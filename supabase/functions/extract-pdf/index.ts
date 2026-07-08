import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { extractText } from "npm:unpdf@0.12.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Extract text from a PDF stored in the "documents" Storage bucket.
 *
 * Receives: { storage_path: string }
 * Returns:  {
 *   success: true,
 *   text: string,
 *   total_pages: number,
 *   total_chars: number,
 *   chars_per_page: number,
 *   likely_scanned: boolean,
 * }
 *
 * Scanned-detection logic:
 *   If the average characters-per-page falls below a threshold,
 *   the PDF is likely scanned/image-based and won't yield usable text.
 *   The threshold is returned so we can tune it empirically in 4b.
 *
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (auto-injected).
 */

const SCANNED_THRESHOLD_CHARS_PER_PAGE = 50

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { storage_path } = body

    if (!storage_path) {
      return new Response(JSON.stringify({ success: false, error: 'Missing "storage_path"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Verify caller owns the requested file ──
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('KLASUP_SECRET_KEY')!,
    )
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!storage_path.startsWith(user.id + '/')) {
      return new Response(JSON.stringify({ success: false, error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Download PDF from Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('KLASUP_SECRET_KEY')!,
    )

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storage_path)

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ success: false, error: 'File not found in storage' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const buffer = await fileData.arrayBuffer()

    // Extract text with unpdf
    let result
    try {
      result = await extractText(new Uint8Array(buffer))
    } catch (extractErr) {
      const detail = (extractErr as Error).message || String(extractErr)
      console.error(`[extract-pdf] unpdf extraction failed for ${storage_path}:`, detail)
      return new Response(JSON.stringify({
        success: false,
        error: `Could not extract text from this PDF. ${detail}`,
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // unpdf returns text as an array of per-page strings, not a single string
    const pages: string[] = Array.isArray(result.text)
      ? result.text.map((p: unknown) => String(p).trim())
      : [String(result.text || '').trim()]
    const totalPages = result.totalPages || pages.length
    const text = pages.join('\n\n')
    const totalChars = text.length
    const charsPerPage = totalPages > 0 ? Math.round(totalChars / totalPages) : 0
    const likelyScanned = totalPages > 0 && charsPerPage < SCANNED_THRESHOLD_CHARS_PER_PAGE

    return new Response(JSON.stringify({
      success: true,
      text,
      total_pages: totalPages,
      total_chars: totalChars,
      chars_per_page: charsPerPage,
      likely_scanned: likelyScanned,
      scanned_threshold: SCANNED_THRESHOLD_CHARS_PER_PAGE,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[extract-pdf] Unexpected error:', (err as Error).message || err)
    return new Response(JSON.stringify({ success: false, error: (err as Error).message || 'PDF extraction failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
