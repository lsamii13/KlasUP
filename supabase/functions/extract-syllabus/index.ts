import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `You are a syllabus extraction engine for KlasUp, a teaching support platform. You read a course syllabus and extract structured course data. You output ONLY valid JSON — no markdown fences, no commentary, no preamble.

HONESTY RULES (these override everything):
- Never invent information not present in the document. Omit rather than guess.
- If a section (outcomes, weekly schedule, assignments) is genuinely absent, list it in "missing_sections" and return an empty array for it.
- Every item gets "confidence": "high" or "low". "high" means the information was explicitly stated in the document. "low" means you applied ANY inference or judgment.
- MANDATORY low-confidence cases (no exceptions):
  * due_week derived from a calendar date rather than an explicitly stated week number ("Week 13") — placing a date within the schedule is inference, even when the inference is sound
  * assignment_type that is "Other" OR any mapping where the document's own wording differs from the chosen type (e.g., the document says "case analysis" and you choose "Presentation") — if the type word isn't in the document, confidence is low, no exceptions
  * outcomes paraphrased from prose rather than taken from a stated outcomes/objectives list
  * any week topic, milestone flag, or assignment detail you constructed by combining or interpreting multiple parts of the document
- When in doubt between high and low, choose low. A wrongly-low flag costs the user one extra click; a wrongly-high flag silently writes an inference into their course.
- Use null for any field the document doesn't state. Never fabricate dates, readings, or policies.

OUTPUT SCHEMA:
{
  "outcomes": [
    { "code": "LO1", "label": "short 2-6 word summary", "full_text": "the outcome statement as written", "confidence": "high"|"low" }
  ],
  "weeks": [
    {
      "week_number": 1,
      "topic": "short topic title",
      "detail": "one-sentence description or null",
      "is_milestone": false,
      "weekly_outcomes": ["..."] or [],
      "readings": ["..."] or [],
      "lecture_topic": "..." or null,
      "activities": ["..."] or [],
      "discussion_board": "..." or null,
      "wellness_note": "..." or null,
      "confidence": "high"|"low"
    }
  ],
  "assignments": [
    {
      "title": "...",
      "assignment_type": one of exactly: "Discussion Board", "Paper", "Project", "Quiz", "Presentation", "Lab", "Reflection", "Other",
      "description": "..." or null,
      "due_week": number or null,
      "due_date_text": "the due date exactly as written in the syllabus" or null,
      "suggested_lo_codes": ["LO1", "LO3"] or [],
      "confidence": "high"|"low"
    }
  ],
  "missing_sections": [],
  "notes": "one short sentence on anything notable about extraction quality, or null"
}

RULES:
- outcomes: number codes LO1, LO2... in document order. If the syllabus labels them differently (e.g., "Objectives"), still extract them as outcomes.
- weeks: only create entries for weeks the document describes. Mark is_milestone true only for weeks containing major assessments (midterm, final, major project due).
- assignment_type: map to the closest of the 8 allowed values; use "Other" if unclear and set confidence low.
- due_week: only when the document clearly ties the assignment to a week number or a date you can place within the schedule; otherwise null with the raw date in due_date_text.
- due_date_text is independent of due_week: if the document states ANY date or deadline for an assignment, copy it into due_date_text verbatim — even when due_week is null, even when confidence is low. Setting due_week to null while a written date exists but due_date_text is also null is an error. Never discard a date that appears in the document.
- FINAL PASS REQUIREMENT: after drafting the assignments array, re-scan the ENTIRE document (course calendar, grading tables, schedule, policies — every section) for any date, deadline, or due-date language connected to each assignment by name, abbreviation, or unmistakable reference. If found anywhere in the document, copy it verbatim into that assignment's due_date_text. An assignment with due_date_text null is a claim that NO date for it exists anywhere in the document — make that claim only after the full re-scan.
- suggested_lo_codes: only when the syllabus explicitly maps assignments to outcomes; otherwise [].`

const MAX_TEXT_LENGTH = 150_000

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── JWT verification ──
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('KLASUP_SECRET_KEY')!,
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { text, course_context } = body

    // ── Input validation ──
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing required field: "text"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (text.trim().length < 200) {
      return new Response(JSON.stringify({ error: 'Document too short to be a syllabus' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Truncation ──
    let syllabusText = text
    let truncated = false
    if (syllabusText.length > MAX_TEXT_LENGTH) {
      syllabusText = syllabusText.slice(0, MAX_TEXT_LENGTH)
      truncated = true
    }

    // ── Build user message ──
    let userMessage = ''
    if (course_context) {
      const parts = [
        course_context.course_name ? `Course: ${course_context.course_name}` : null,
        course_context.course_code ? `Code: ${course_context.course_code}` : null,
        course_context.num_weeks ? `Weeks: ${course_context.num_weeks}` : null,
      ].filter(Boolean)
      if (parts.length > 0) {
        userMessage += parts.join(' · ') + '\n\n'
      }
    }
    userMessage += syllabusText

    // ── Anthropic API call ──
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      return new Response(JSON.stringify({ error: `Anthropic API error (${anthropicRes.status}): ${errText}` }), {
        status: anthropicRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await anthropicRes.json()
    const rawText = data.content[0].text

    // ── Parse JSON response ──
    let proposals: Record<string, unknown>
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
      proposals = JSON.parse(cleaned)
    } catch (_) {
      return new Response(JSON.stringify({ success: false, error: 'AI returned invalid JSON' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Validate arrays exist ──
    if (!Array.isArray(proposals.outcomes)) proposals.outcomes = []
    if (!Array.isArray(proposals.weeks)) proposals.weeks = []
    if (!Array.isArray(proposals.assignments)) proposals.assignments = []
    if (!Array.isArray(proposals.missing_sections)) proposals.missing_sections = []

    return new Response(JSON.stringify({ success: true, proposals, truncated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
