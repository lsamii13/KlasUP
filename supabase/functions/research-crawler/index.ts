import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Research Crawler Edge Function
 *
 * Crawls ERIC and PubMed APIs for new peer-reviewed articles on teaching and
 * learning, deduplicates against existing research_articles rows, and inserts
 * new articles with keyword search terms.
 *
 * Embeddings are NOT generated here — articles are stored with embedding = null.
 * Keyword search (full-text + search_terms array) is used for retrieval.
 * When an embedding provider is configured in the future, embeddings can be
 * backfilled via the rag-search "embed" operation.
 *
 * Body: { source?: "eric" | "pubmed" | "all" }
 * Default: "all"
 */

// ── Dimension mapping — maps search queries to KlasUp dimensions ─────

const ERIC_SEARCHES: { query: string; dimension: string }[] = [
  { query: '"active learning" higher education', dimension: 'Active Learning' },
  { query: '"universal design for learning"', dimension: 'Universal Design for Learning' },
  { query: 'andragogy "adult learning"', dimension: 'Andragogy' },
  { query: '"problem based learning"', dimension: 'Problem-Based Learning' },
  { query: '"project based learning"', dimension: 'Project-Based Learning' },
  { query: '"Kagan" cooperative learning structures', dimension: 'Kagan Structures' },
  { query: '"experiential learning" higher education', dimension: 'Experiential Learning' },
  { query: '"action research" faculty teaching', dimension: 'Action Research' },
  { query: '"socratic" seminar discussion method', dimension: 'Socratic Seminar' },
  { query: '"flipped classroom"', dimension: 'Flipped Classroom' },
  { query: 'metacognition "self-regulated learning"', dimension: 'Metacognition' },
  { query: '"formative assessment" feedback quality', dimension: 'Feedback Quality' },
  { query: '"student wellbeing" OR "student well-being" higher education', dimension: 'Student Wellbeing' },
  { query: '"faculty development" teaching', dimension: 'Faculty Development' },
  { query: '"community of inquiry" education', dimension: 'Community of Inquiry' },
  { query: '"trauma-informed" teaching pedagogy', dimension: 'Trauma-Informed Teaching' },
]

const PUBMED_SEARCHES: { query: string; dimension: string }[] = [
  { query: 'pedagogy higher education teaching', dimension: 'Pedagogy' },
  { query: 'teaching learning college faculty development', dimension: 'Faculty Development' },
  { query: 'faculty development university assessment', dimension: 'Faculty Development' },
  { query: 'active learning student engagement university', dimension: 'Active Learning' },
  { query: 'metacognition self-regulation education', dimension: 'Metacognition' },
]

// ── ERIC API crawler ─────────────────────────────────────────

interface CrawledArticle {
  title: string
  authors: string
  year: number
  journal: string | null
  abstract: string
  dimension: string
  search_terms: string[]
}

async function crawlERIC(query: string, dimension: string): Promise<CrawledArticle[]> {
  const url = `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(query)}&format=json&rows=10&fields=title,author,publicationdateyear,source,description,subject&start=0`

  const res = await fetch(url)
  if (!res.ok) {
    console.error(`[ERIC] Failed for "${query}": ${res.status}`)
    return []
  }

  const data = await res.json()
  const docs = data?.response?.docs || []

  return docs
    .filter((doc: { title: string; description: string }) => doc.title && doc.description)
    .map((doc: {
      title: string
      author: string[]
      publicationdateyear: number
      source: string
      description: string
      subject: string[]
    }) => ({
      title: doc.title,
      authors: (doc.author || []).join(', ') || 'Unknown',
      year: doc.publicationdateyear || new Date().getFullYear(),
      journal: doc.source || null,
      abstract: doc.description,
      dimension,
      search_terms: [
        ...(doc.subject || []).slice(0, 8).map((s: string) => s.toLowerCase()),
        dimension.toLowerCase(),
      ],
    }))
}

// ── PubMed API crawler ───────────────────────────────────────

async function crawlPubMed(query: string, dimension: string): Promise<CrawledArticle[]> {
  // Step 1: Search for article IDs
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=10&retmode=json&sort=relevance`

  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) {
    console.error(`[PubMed] Search failed for "${query}": ${searchRes.status}`)
    return []
  }

  const searchData = await searchRes.json()
  const ids: string[] = searchData?.esearchresult?.idlist || []
  if (ids.length === 0) return []

  // Step 2: Fetch article details
  const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`

  const fetchRes = await fetch(fetchUrl)
  if (!fetchRes.ok) {
    console.error(`[PubMed] Fetch failed: ${fetchRes.status}`)
    return []
  }

  const fetchData = await fetchRes.json()
  const results = fetchData?.result || {}

  // Step 3: Fetch abstracts via efetch
  const abstractUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=text`
  const abstractRes = await fetch(abstractUrl)
  const abstractsRaw = abstractRes.ok ? await abstractRes.text() : ''

  // Parse abstracts (split by double newline patterns between articles)
  const abstractBlocks = abstractsRaw.split(/\n\n\d+\. /).filter(Boolean)

  const articles: CrawledArticle[] = []

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const doc = results[id]
    if (!doc || !doc.title) continue

    const authors = (doc.authors || [])
      .map((a: { name: string }) => a.name)
      .join(', ') || 'Unknown'

    const year = doc.pubdate ? parseInt(doc.pubdate.substring(0, 4)) : new Date().getFullYear()
    const journal = doc.source || doc.fulljournalname || null

    // Try to extract abstract from the text block
    let abstract = ''
    if (abstractBlocks[i]) {
      const lines = abstractBlocks[i].split('\n')
      const absStart = lines.findIndex((l: string) => l.trim() === '' && lines[lines.indexOf(l) + 1]?.length > 50)
      if (absStart >= 0) {
        abstract = lines.slice(absStart + 1).join(' ').trim().substring(0, 2000)
      }
    }

    if (!abstract) {
      abstract = `Research article on ${dimension.toLowerCase()} published in ${journal || 'peer-reviewed journal'}.`
    }

    articles.push({
      title: doc.title.replace(/<\/?[^>]+(>|$)/g, ''),
      authors,
      year,
      journal,
      abstract,
      dimension,
      search_terms: [dimension.toLowerCase(), 'higher education', 'teaching', 'learning'],
    })
  }

  return articles
}

// ── Main handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()
    const source = body.source || 'all'

    // Fetch existing titles for dedup
    const { data: existing, error: existErr } = await supabase
      .from('research_articles')
      .select('title')

    if (existErr) throw new Error(`Failed to fetch existing articles: ${existErr.message}`)
    const existingTitles = new Set((existing || []).map((a: { title: string }) => a.title.toLowerCase().trim()))

    const allCrawled: CrawledArticle[] = []

    // ── Crawl ERIC ──
    if (source === 'all' || source === 'eric') {
      for (const search of ERIC_SEARCHES) {
        const articles = await crawlERIC(search.query, search.dimension)
        allCrawled.push(...articles)
        await new Promise(r => setTimeout(r, 200))
      }
    }

    // ── Crawl PubMed ──
    if (source === 'all' || source === 'pubmed') {
      for (const search of PUBMED_SEARCHES) {
        const articles = await crawlPubMed(search.query, search.dimension)
        allCrawled.push(...articles)
        await new Promise(r => setTimeout(r, 300))
      }
    }

    // ── Deduplicate ──
    const newArticles = allCrawled.filter(a =>
      !existingTitles.has(a.title.toLowerCase().trim())
    )

    const seenTitles = new Set<string>()
    const uniqueNew = newArticles.filter(a => {
      const key = a.title.toLowerCase().trim()
      if (seenTitles.has(key)) return false
      seenTitles.add(key)
      return true
    })

    // ── Insert without embeddings (keyword search only for now) ──
    let inserted = 0
    const errors: string[] = []

    for (const article of uniqueNew) {
      try {
        const { error: insertErr } = await supabase
          .from('research_articles')
          .insert({
            title: article.title,
            authors: article.authors,
            year: article.year,
            journal: article.journal,
            abstract: article.abstract,
            dimension: article.dimension,
            search_terms: article.search_terms,
            // embedding is null — keyword search is used for retrieval.
            // Embeddings can be backfilled later when an embedding provider is configured.
          })

        if (insertErr) {
          errors.push(`Insert failed for "${article.title.substring(0, 50)}...": ${insertErr.message}`)
          continue
        }
        inserted++
      } catch (e) {
        errors.push(`Error processing "${article.title.substring(0, 50)}...": ${e.message}`)
      }
    }

    return new Response(JSON.stringify({
      message: `Crawl complete. Found ${allCrawled.length} articles, ${uniqueNew.length} new, ${inserted} inserted.`,
      crawled: allCrawled.length,
      new_found: uniqueNew.length,
      inserted,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
