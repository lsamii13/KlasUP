import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import mammoth from "npm:mammoth@1.8.0"
import JSZip from "npm:jszip@3.10.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Extract text from a document stored in the "documents" Storage bucket.
 *
 * Receives: { storage_path: string, file_type: string }
 * Returns:  { success: true, text: string } or { success: false, error: string }
 *
 * Supported file types: txt, docx, pdf, pptx
 *
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (auto-injected).
 */

/* ------------------------------------------------------------------ */
/*  Extraction helpers                                                 */
/* ------------------------------------------------------------------ */

async function extractTxt(buffer: ArrayBuffer): Promise<string> {
  return new TextDecoder().decode(buffer)
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

// PDF extraction happens client-side (pdfjs-dist works in browser, not in Deno edge runtime).
// If a PDF request reaches this function, return a helpful message.

async function extractPptx(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)

  // Collect slide files in order (slide1.xml, slide2.xml, ...)
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
      return numA - numB
    })

  const parts: string[] = []

  for (const slidePath of slideFiles) {
    const xml = await zip.file(slidePath)!.async('string')
    const matches = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
    const slideText = matches.map(m => m[1]).join(' ').trim()
    if (slideText) {
      parts.push(slideText)
    }
  }

  return parts.join('\n\n')
}

const EXTRACTORS: Record<string, (buf: ArrayBuffer) => Promise<string>> = {
  txt: extractTxt,
  docx: extractDocx,
  pptx: extractPptx,
  // pdf is handled client-side via pdfjs-dist — not in this function
}

/* ------------------------------------------------------------------ */
/*  Handler                                                            */
/* ------------------------------------------------------------------ */

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
    const { storage_path, file_type } = body

    if (!storage_path || !file_type) {
      return new Response(JSON.stringify({ success: false, error: 'Missing "storage_path" or "file_type"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const extractor = EXTRACTORS[file_type.toLowerCase()]
    if (!extractor) {
      return new Response(JSON.stringify({ success: false, error: `Unsupported file type: ${file_type}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Download file from Storage using service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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

    let text: string
    try {
      text = await extractor(buffer)
    } catch (extractionErr) {
      const detail = extractionErr.message || String(extractionErr)
      console.error(`[extract-text] ${file_type} extraction failed for ${storage_path}:`, detail)
      return new Response(JSON.stringify({
        success: false,
        error: `Could not extract text from this ${file_type.toUpperCase()} file. ${detail}`,
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!text || text.trim().length === 0) {
      console.warn(`[extract-text] Empty result for ${storage_path} (${file_type})`)
      return new Response(JSON.stringify({
        success: false,
        error: 'No readable text found in this file. It may be image-only or scanned without OCR.',
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, text: text.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[extract-text] Unexpected error:', err.message || err)
    return new Response(JSON.stringify({ success: false, error: err.message || 'Extraction failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
