import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * RAG Search Edge Function (keyword-only mode)
 *
 * All retrieval uses the keyword_search_articles RPC (full-text search on
 * title/abstract/authors + search_terms array matching). No embedding provider
 * is required.
 *
 * When an embedding provider is added in the future, the "embed" operation can
 * be re-enabled to backfill the embedding column, and "search"/"context" can
 * optionally incorporate vector similarity via the match_articles RPC.
 *
 * Supported operations:
 *   1. "search"  — keyword search of research_articles
 *   2. "context" — retrieve research context for grounding AI recommendations
 *   3. "embed"   — placeholder; returns a message that no embedding provider is configured
 */

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
    const { type } = body

    // ── EMBED: Generate embeddings for articles missing them ──
    if (type === 'embed') {
      const voyageKey = Deno.env.get('VOYAGE_API_KEY')
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
      const useVoyage = !!voyageKey
      const activeKey = voyageKey || anthropicKey

      if (!activeKey) {
        return new Response(JSON.stringify({
          error: 'No API key configured. Set VOYAGE_API_KEY or ANTHROPIC_API_KEY.',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch articles missing embeddings (batch of 50 to avoid timeouts)
      const { data: articles, error: fetchErr } = await supabase
        .from('research_articles')
        .select('id, title, abstract, dimension')
        .is('embedding', null)
        .limit(50)

      if (fetchErr) throw new Error(`Failed to fetch articles: ${fetchErr.message}`)

      if (!articles || articles.length === 0) {
        return new Response(JSON.stringify({
          message: 'All articles already have embeddings.',
          processed: 0, succeeded: 0, failed: 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let succeeded = 0
      let failed = 0
      const errors: string[] = []
      const provider = useVoyage ? 'voyage-2' : 'claude-fallback'

      for (const article of articles) {
        try {
          const inputText = `${article.title} ${article.abstract || ''} ${article.dimension}`.trim()
          let embedding: number[]

          if (useVoyage) {
            // Voyage AI embeddings API
            const embRes = await fetch('https://api.voyageai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${voyageKey}`,
              },
              body: JSON.stringify({
                model: 'voyage-2',
                input: [inputText],
                input_type: 'document',
              }),
            })

            const voyageText = await embRes.text()
            console.log('Voyage response status:', embRes.status)
            console.log('Voyage response body:', voyageText)

            if (!embRes.ok) {
              throw new Error(`Voyage API ${embRes.status}: ${voyageText}`)
            }

            const embData = JSON.parse(voyageText)
            embedding = embData.data?.[0]?.embedding
            if (!embedding) throw new Error('No embedding returned from Voyage')
          } else {
            // Fallback: use Claude to generate a pseudo-embedding
            const embRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicKey!,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                system: 'You are a semantic embedding generator. Given a text, return ONLY a JSON array of exactly 512 floating point numbers between -1 and 1 that represent the semantic meaning of the text. The numbers should capture the key topics, concepts, and relationships in the text. Return ONLY the JSON array, no other text.',
                messages: [{ role: 'user', content: inputText.slice(0, 2000) }],
              }),
            })

            if (!embRes.ok) {
              const errText = await embRes.text()
              throw new Error(`Claude API ${embRes.status}: ${errText}`)
            }

            const embData = await embRes.json()
            const rawText = embData.content?.[0]?.text || ''
            embedding = JSON.parse(rawText)
            if (!Array.isArray(embedding) || embedding.length !== 512) {
              throw new Error(`Invalid embedding: expected 512 numbers, got ${Array.isArray(embedding) ? embedding.length : typeof embedding}`)
            }
          }

          console.log('Saving embedding for article:', article.id, 'vector length:', embedding.length)
          const { error: updateErr } = await supabase
            .from('research_articles')
            .update({ embedding })
            .eq('id', article.id)

          if (updateErr) {
            console.log('Supabase save error:', JSON.stringify(updateErr))
            throw new Error(`DB update failed: ${updateErr.message}`)
          }
          console.log('Successfully saved embedding for article:', article.id)

          succeeded++
        } catch (e) {
          failed++
          errors.push(`"${article.title.substring(0, 40)}...": ${e.message}`)
        }

        // Rate limit — delay between API calls
        await new Promise(r => setTimeout(r, useVoyage ? 100 : 500))
      }

      return new Response(JSON.stringify({
        message: `Embedding complete (${provider}). ${succeeded} succeeded, ${failed} failed out of ${articles.length} processed.`,
        processed: articles.length,
        succeeded,
        failed,
        provider,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── SEARCH: Keyword search ──
    if (type === 'search') {
      const { query, dimension, count = 5 } = body

      if (!query) {
        return new Response(JSON.stringify({ error: 'query is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: results, error } = await supabase
        .rpc('keyword_search_articles', {
          query_text: query,
          match_count: count,
          filter_dimension: dimension || null,
        })

      if (error) throw new Error(`Search error: ${error.message}`)

      return new Response(JSON.stringify({
        articles: (results || []).map((r: Record<string, unknown>) => ({ ...r, source: 'keyword' })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── CONTEXT: Retrieve research context for micro-learning grounding ──
    if (type === 'context') {
      const { content, category } = body

      if (!content) {
        return new Response(JSON.stringify({ error: 'content is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Build a short keyword query from the content
      const queryText = `${category || ''} ${content}`.slice(0, 200)

      const { data: articles, error } = await supabase
        .rpc('keyword_search_articles', {
          query_text: queryText,
          match_count: 5,
          filter_dimension: null,
        })

      if (error) throw new Error(`Context search error: ${error.message}`)

      const context = (articles || []).map((a: {
        title: string; authors: string; year: number; journal: string; abstract: string; dimension: string
      }) =>
        `[${a.dimension}] ${a.authors} (${a.year}). "${a.title}." ${a.journal || ''}.\nAbstract: ${a.abstract || 'N/A'}`
      ).join('\n\n---\n\n')

      return new Response(JSON.stringify({
        context,
        articles: (articles || []).map((a: {
          id: string; title: string; authors: string; year: number; journal: string; dimension: string; rank: number
        }) => ({
          id: a.id,
          title: a.title,
          authors: a.authors,
          year: a.year,
          journal: a.journal,
          dimension: a.dimension,
          rank: a.rank,
        })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown type: ${type}. Use "search", "context", or "embed".` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
