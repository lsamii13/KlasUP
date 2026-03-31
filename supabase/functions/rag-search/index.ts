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

    // ── EMBED: Placeholder — no embedding provider configured ──
    if (type === 'embed') {
      // Count how many articles are missing embeddings
      const { count } = await supabase
        .from('research_articles')
        .select('id', { count: 'exact', head: true })
        .is('embedding', null)

      return new Response(JSON.stringify({
        message: `No embedding provider configured. ${count ?? 0} articles are missing embeddings. Keyword search is active and working. To enable vector search, add an embedding provider and re-deploy this function.`,
        count: 0,
        missing_embeddings: count ?? 0,
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
