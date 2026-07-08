import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── JSON parser (matches generate-micro-learning pattern) ────────
// Handles clean JSON, markdown-fenced JSON, or stray text around JSON.
function parseClaudeJSON(text: string): unknown {
  const trimmed = text.trim()

  try { return JSON.parse(trimmed) } catch (_) { /* fall through */ }

  const fenceStripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  if (fenceStripped !== trimmed) {
    try { return JSON.parse(fenceStripped) } catch (_) { /* fall through */ }
  }

  const startIdx = trimmed.search(/[\[{]/)
  if (startIdx !== -1) {
    const open = trimmed[startIdx]
    const close = open === '[' ? ']' : '}'
    let depth = 0
    for (let i = startIdx; i < trimmed.length; i++) {
      if (trimmed[i] === open) depth++
      else if (trimmed[i] === close) depth--
      if (depth === 0) {
        try { return JSON.parse(trimmed.slice(startIdx, i + 1)) } catch (_) { break }
      }
    }
  }

  throw new Error(`Could not extract valid JSON from AI response (first 200 chars): ${trimmed.slice(0, 200)}`)
}

// ── System prompt (verbatim from spec) ───────────────────────────
const SYSTEM_PROMPT = `You are the Career Connections engine for KlasUp, a platform that helps higher education faculty teach. Your job is to help a faculty member answer the question every student eventually asks: "Why am I learning this?"

You generate honest, specific connections between what a course teaches and the real work students might go on to do. Faculty hand your output directly to students, so it must be written to land for a student and be something a professor would be proud to stand behind.

## YOUR TASK

You will be given a course title, optionally the text of uploaded course materials (which may include a syllabus), and optionally a specific topic. You will produce:
1. An inferred discipline (with a confidence level)
2. A stable COURSE-LEVEL card: a general blurb, broad roles, and broad skills for the whole course
3. When a topic or syllabus schedule is available: one or more TOPIC-LEVEL narratives, each tying that specific topic to real work

## ABSOLUTE HONESTY RULES (never violate)

- NEVER invent statistics of any kind.
- NEVER include salary figures or salary ranges.
- NEVER include job-growth claims or projections (e.g. "expected to grow," "fast-growing field," percentages).
- NEVER include percentages of any kind.
- NEVER cite sources, studies, or institutions — you have no verified citations.
- NEVER promise employment outcomes ("you will get a job as..."). Frame roles as honest possibilities ("connects to," "transfers to," "prepares you for work like").
- If you are not confident about the discipline, SAY SO rather than guessing confidently.

These rules exist because faculty just removed fabricated content from this product. Anything that reads as confident-but-unverifiable is the exact failure we are preventing.

## DISCIPLINE INFERENCE — THREE STATES

Decide your confidence in the course's discipline:
- HIGH confidence: materials clearly indicate the discipline, OR the title is unambiguous (e.g. "Organic Chemistry," "Introduction to Marketing"). Return confidence "high".
- LOW confidence: you can make a reasonable guess but you're working from limited signal (e.g. a moderately clear title with no materials). Return confidence "low".
- CANNOT DETERMINE: the title is genuinely uninformative (e.g. "Senior Capstone," "Special Topics 401," "Independent Study") AND there are no materials to clarify. In this case set "needs_discipline": true and return NOTHING else — do not guess.

## WRITING VOICE — write TO THE STUDENT (this is critical)

The faculty member hands this text directly to their students. So write it FOR A STUDENT, speaking TO them — never about the course to the professor. Do NOT write "Your course builds..." or "Students learn...". Write "You're learning...", "The work you're doing here...", "This is exactly how...".

The voice is: a great professor who is genuinely excited about why this matters, talking straight to a student. Warm and direct AND energizing. Specifically:
- Open with a hook that pulls the student in (a question, a surprising framing, a "here's the thing..."). Example openers: "Ever wonder how...", "Here's a secret:", "Reading closely is a kind of superpower most people never develop."
- Use plain, concrete language. Name real things in the world (what to build, how to price it, why a campaign flopped) — NEVER abstract institutional phrasing like "evidence-based decisions an organization makes about its customers."
- Be honest about value without hype or fabrication. "People will pay you well for this precisely because most people can't do it" is good — it's true and general. A specific salary number is NOT (forbidden).
- Sound like a person, not a brochure. Enthusiasm is welcome; corporate jargon is not.

REGISTER BY EVIDENCE (the hedge still lives in the words):
- When you have real materials: speak with grounded confidence about what they're doing. "The work you're doing in this course is exactly how..."
- When you only have a title (no materials): keep the same warm student-facing voice but hedge honestly. "If this course is what it sounds like, you're building..." / "Courses like this usually train you to...". The hedge lives in the words, not just the confidence flag.

## DEFINITIONS

- ROLES: real job titles a student could move toward (NOT vague fields). 3-4 per card. Example good: "Market Research Analyst." Example bad: "marketing."
- SKILLS: 5-6 per card. When materials/learning outcomes are present, draw skills from what the course actually teaches and match them to what the roles require. When no materials, list the skills the roles generally require — without pretending the course covers them.
- COURSE-LEVEL blurb: 2-3 sentences written TO the student using the writing voice above. Opens with a hook, connects the whole course to the world of work, makes the student feel "oh — this actually matters."
- TOPIC-LEVEL narrative: 2-4 sentences written TO the student using the writing voice above, connecting THIS SPECIFIC TOPIC to real work they might do. This is the heart of the feature. Rules for making it land:
  1. Be specific to the TOPIC, not generic to the field. For "focus groups," talk about what focus group work actually looks like in a real research role — not marketing in general.
  2. NAME the concrete transferable skill the topic builds, in plain words a student recognizes — e.g. "attention to detail," "critical thinking," "working through ambiguity," "spotting patterns," "building an argument from evidence." Do not leave the skill abstract or implied; say it directly.
  3. Then connect that named skill to a concrete kind of work where it visibly matters. The test: a student reading it should think "oh — THAT's why this matters," not "okay, this is vaguely useful."
  This concrete skill-naming applies to EVERY discipline. An English course analyzing an unreliable narrator? You're training yourself to catch when a story and the facts don't line up — the same instinct a fraud analyst, an editor, or a UX researcher gets paid for. Say that plainly.

## SYLLABUS MINING

If the materials contain a week-by-week schedule (a syllabus), extract the list of weekly topics in order. Return them in the "topics" array. Generate a full narrative ONLY for the topic you are told is the current one (or the first topic if none specified); for all other topics, return the topic label with "status": "pending" and no narrative yet.
If a specific topic is provided directly (not from a syllabus), generate the narrative for that topic.

## OUTPUT FORMAT

Return ONLY valid JSON, no preamble, no markdown fences. Structure:
{
  "needs_discipline": false,
  "inferred_discipline": "Marketing",
  "confidence": "high",
  "course": {
    "blurb": "...",
    "roles": ["...", "...", "..."],
    "skills": ["...", "...", "...", "...", "..."]
  },
  "topics": [
    { "topic": "Focus Group Research", "status": "ready", "narrative": "...", "roles": ["...", "..."], "skills": ["...", "..."] },
    { "topic": "Survey Design", "status": "pending" }
  ]
}
If "needs_discipline" is true, return ONLY: { "needs_discipline": true }`

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

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ── Auth: validate JWT and extract user_id ─────────────────
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
    const userId = user.id

    // ── Parse and validate request body ────────────────────────
    const body = await req.json()
    const { course_id, course_title, topic, override_discipline, confirmed } = body

    if (!course_id || !course_title) {
      return new Response(JSON.stringify({ error: 'course_id and course_title are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isCorrection = !!(override_discipline && confirmed)

    // ── Cache check: return existing row if present (v1: simple hit) ──
    // Skip cache when faculty is correcting the discipline — always regenerate.
    const { data: cached, error: cacheErr } = await supabase
      .from('career_connections')
      .select('content, discipline_confirmed, inferred_discipline')
      .eq('user_id', userId)
      .eq('course_id', course_id)
      .maybeSingle()

    if (cacheErr) {
      console.error('[career-connections] Cache lookup failed:', cacheErr.message)
      // Non-fatal — proceed to generate
    }

    if (cached && !isCorrection && !topic) {
      return new Response(JSON.stringify(cached.content), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Determine discipline to use ─────────────────────────────
    // Priority: (1) explicit override, (2) previously confirmed discipline, (3) let AI infer
    const knownDiscipline = isCorrection
      ? override_discipline
      : (cached?.discipline_confirmed ? cached.inferred_discipline : null)

    // ── Gather materials text for this course ──────────────────
    const { data: uploads, error: uploadsErr } = await supabase
      .from('uploads')
      .select('content')
      .eq('course_id', course_id)
      .eq('user_id', userId)
      .order('week', { ascending: true })
      .order('created_at', { ascending: true })

    if (uploadsErr) {
      console.error('[career-connections] Failed to fetch uploads:', uploadsErr.message)
    }

    const materialsText = (uploads || [])
      .map((u: { content: string }) => u.content)
      .filter(Boolean)
      .join('\n\n---\n\n')

    // ── Build user message from template ───────────────────────
    const disciplineLine = knownDiscipline
      ? `\nDISCIPLINE: ${knownDiscipline}. Do not infer it — use this as the discipline.\n`
      : ''

    const userMessage = `COURSE TITLE: ${course_title}
${disciplineLine}
CURRENT TOPIC (generate full narrative for this one): ${topic || 'none specified'}

UPLOADED MATERIALS:
${materialsText || 'No materials uploaded yet.'}`

    // ── Call Anthropic API ──────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[career-connections] Anthropic API error:', anthropicRes.status, errText)
      return new Response(JSON.stringify({ error: `AI service error (${anthropicRes.status})` }), {
        status: anthropicRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await anthropicRes.json()
    const rawText = aiData.content[0].text

    // ── Parse AI response ──────────────────────────────────────
    let parsed: Record<string, unknown>
    try {
      parsed = parseClaudeJSON(rawText) as Record<string, unknown>
    } catch (parseErr) {
      console.error('[career-connections] JSON parse failed. Raw response:', rawText)
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Handle needs_discipline state (no cache write) ─────────
    if (parsed.needs_discipline === true) {
      return new Response(JSON.stringify({ needs_discipline: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Write cache row (upsert on user_id + course_id) ────────
    // Skip cache write when a topic is explicitly provided — topic exploration
    // is transient; the default cached card stays intact for normal reloads.
    if (!topic) {
      const { error: upsertErr } = await supabase
        .from('career_connections')
        .upsert({
          user_id: userId,
          course_id,
          course_title,
          inferred_discipline: isCorrection ? override_discipline : parsed.inferred_discipline as string,
          confidence: isCorrection ? 'high' : parsed.confidence as string,
          discipline_confirmed: isCorrection ? true : (cached?.discipline_confirmed || false),
          content: parsed,
          last_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,course_id',
        })

      if (upsertErr) {
        console.error('[career-connections] Upsert failed:', upsertErr.message)
        // Still return the generated content even if caching failed
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[career-connections] Unexpected error:', err.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
