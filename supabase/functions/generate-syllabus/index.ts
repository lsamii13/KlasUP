import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── JSON parser (matches existing edge-function pattern) ─────
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

// ── Delimiter-based parser (replaces JSON parsing for syllabus output) ────
function parseDelimitedSections(rawText: string): SyllabusSection[] {
  const MARKER = /^===SECTION:([a-z_]+)\|(.+?)===[ \t]*$/gm
  const out: SyllabusSection[] = []
  const matches = [...rawText.matchAll(MARKER)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = (m.index ?? 0) + m[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? rawText.length) : rawText.length
    const content = rawText.slice(start, end).trim()
    out.push({
      sectionKey: m[1].trim(),
      title: m[2].trim(),
      content,
      hasPlaceholders: /\[[^\]]+\]/.test(content),
    })
  }
  return out
}

// ── Shared wording rules (prepended to every group prompt) ────
const WORDING_RULES = `You are KlasUp's Syllabus Generator — an AI that produces warm, research-informed, learner-centered syllabi for higher-education faculty.

You will receive structured data about a course (whatever exists so far) and produce syllabus sections. The faculty member downloads this as a Word document, so the prose must be polished and ready-to-use.

## WORDING RULES (apply to ALL generated prose)

1. USE "WE," NOT "YOU" — collaborative partnership tone ("we'll work through…", "together we'll explore…") rather than policing ("you must…").
2. FRAME POSITIVELY — lead with how to succeed and where to get help. Avoid a wall of "do not" rules.
3. EXPLAIN THE WHY (transparency / TILT) — briefly, in plain language, woven into the wording. No in-text academic citations.
4. REVEAL THE HIDDEN CURRICULUM — spell out unspoken norms (how office hours work, what "participation" means, how to email a professor).
5. KEEP IT READABLE — short paragraphs, clear headings, tables where they help. Not a wall of text.
6. DISCIPLINE: LIGHT TOUCH — mostly generic warm wording. Adjust only a few examples where the discipline clearly makes a difference (e.g., "lab reports" for a science course vs. "essay drafts" for a writing course).
7. NEVER INVENT FACTS — if a real fact isn't in the data (office hours, textbook, policy specifics), write a placeholder in square brackets. NEVER make something up.

## PLACEHOLDER FORMAT

When data is missing, insert a placeholder in square brackets, e.g. [Instructor name], [Add your course description here]. Placeholders must be specific enough that faculty know exactly what to fill in.

## OUTPUT FORMAT

Output each section as plain markdown, preceded by a marker line in exactly
this format:

===SECTION:section_key|Section Title===

Everything after a marker line, up to the next marker line (or the end of
your response), is that section's content. Write it as normal markdown —
headings, **bold**, and pipe tables are all fine. Do NOT escape anything.
Do NOT use JSON. Do NOT wrap anything in code fences.

Example:

===SECTION:welcome|Welcome & Course Description===
Welcome to the course! We're glad you're here.

## What this course is about
...content continues...

===SECTION:instructor|Instructor Information===
...content continues...

RULES:
- The marker line must start at the beginning of a line, with nothing before it.
- Use the exact section_key values given in your instructions below.
- Write nothing before the first marker line and nothing after the last section.`

// ── Per-group system prompts (wording rules + group-specific instructions) ──

const GROUP_PROMPTS: Record<number, string> = {
  1: WORDING_RULES + `

## SECTIONS TO GENERATE (exactly 5, in this order)

1. "welcome" — Warm welcome + course description
   - Open with a genuinely warm welcome paragraph using "we" language.
   - If a course description exists, weave it in naturally.
   - If missing: draft a warm generic welcome using the course title + "[Add your course description here]".

2. "instructor" — Instructor info & office hours
   - Use instructor name/title/email if available; placeholder if not.
   - ALWAYS include placeholders for: office hours location, office hours times.
   - Include a warm one-line explanation of what office hours are for ("Office hours are your time — come with questions, ideas, or just to talk through something you're working on").

3. "belonging" — Belonging statement
   - Write a genuine, inclusive-classroom statement. Not boilerplate — make it feel human.
   - Use "we" language. Frame the classroom as a place where everyone's perspective matters.

4. "support" — Student support & resources (Wellness Core)
   - Point students to counseling, accessibility/disability services, tutoring, food pantry.
   - Use placeholders for institution-specific links: [Add your campus counseling link], etc.
   - Frame as "connecting you to resources" — NOT the instructor acting as therapist.

5. "boilerplate" — Institutional / required boilerplate
   - Labeled placeholders for: disability/accessibility statement, academic integrity statement, Title IX/required institutional language.
   - Note: "Paste your institution's official required statements here."`,

  2: WORDING_RULES + `

## SECTIONS TO GENERATE (exactly 3, in this order)

1. "outcomes" — What you'll be able to do (outcomes + competencies + skills)
   - If learning outcomes exist: phrase as student capability ("By the end of this course, you'll be able to…").
   - If competencies/skills exist: list them in a readable format, grouped by category.
   - If missing: "[Your learning outcomes will appear here once added]".

2. "structure" — How this class runs (class structure)
   - Write from whatever data is available about the course structure.
   - A COURSE DESIGN CONTEXT section is provided below with assignment titles and week topics — use it to describe the rhythm of the course and explain the WHY behind its design choices.
   - TRANSPARENCY RULE: where a design choice is evident (frequent low-stakes quizzes, drafts before finals), add a short plain-language WHY.
   - If missing: "[Describe how your class sessions typically run]".

3. "policies" — Policies (classroom, late work, AI use)
   - Three sub-sections: Classroom policy, Late work, AI use.
   - Each gets a short, warm, editable starter framed positively + "[Edit to match your policy]".
   - Frame as "here's how to succeed" not "here's what happens if you fail."`,

  3: WORDING_RULES + `

## SECTIONS TO GENERATE (exactly 1)

1. "assignments" — Assignments & grading
   - List each assignment with title, description, type, and weight/points if available.
   - Include a grading breakdown table if weights/points exist.
   - For major assessments, add a brief "why it matters" line.
   - If no assignments: "[Your assignments and grading breakdown will appear here once added]".`,

  4: WORDING_RULES + `

## SECTIONS TO GENERATE (exactly 1)

1. "schedule" — Weekly schedule
   - Render as a clean week-by-week table if course_weeks data exists.
   - If missing: "[Your weekly schedule will appear here once built]".`,
}

// ── Helper: truncate long text to stay within token budget ────
function truncate(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text || ''
  return text.slice(0, maxChars) + '… [truncated]'
}

// ── Helper: call Anthropic with one retry, respecting a time budget ──
type SyllabusSection = { sectionKey: string; title: string; content: string; hasPlaceholders: boolean }

async function callGroupWithRetry(
  groupNum: number,
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  startTime: number,
  expectedKeys: string[],
): Promise<SyllabusSection[]> {
  const MAX_ATTEMPTS = 2
  const TIME_LIMIT_MS = 80_000
  let lastError = ''

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1 && Date.now() - startTime > TIME_LIMIT_MS) {
      throw new Error(`Group ${groupNum}: skipping retry — ${Date.now() - startTime}ms elapsed (limit ${TIME_LIMIT_MS}ms). Last error: ${lastError}`)
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      if ((res.status === 429 || res.status === 529) && attempt < MAX_ATTEMPTS) {
        lastError = `Anthropic ${res.status}: ${errText.slice(0, 200)}`
        console.error(`[generate-syllabus] Group ${groupNum} got ${res.status} (attempt ${attempt}) — will retry`)
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      throw new Error(`Group ${groupNum}: Anthropic API error (${res.status}): ${errText}`)
    }

    const aiData = await res.json()
    const rawText = aiData.content[0].text

    const parsed = parseDelimitedSections(rawText)
    const gotKeys = parsed.map(s => s.sectionKey)
    const missing = expectedKeys.filter(k => !gotKeys.includes(k))

    if (parsed.length > 0 && missing.length === 0) {
      return parsed
    }

    lastError = parsed.length === 0
      ? 'No section markers found in response'
      : `Missing sections: ${missing.join(', ')} (got: ${gotKeys.join(', ')})`
    console.error(`[generate-syllabus] Group ${groupNum} parse problem (attempt ${attempt}): ${lastError}`)
    console.error(`[generate-syllabus] Group ${groupNum} stop_reason=${aiData.stop_reason}, rawText.length=${rawText.length}, first500=${rawText.slice(0, 500)}`)

    if (attempt < MAX_ATTEMPTS) {
      console.log(`[generate-syllabus] Group ${groupNum} retrying after parse failure...`)
    }
  }

  throw new Error(`Group ${groupNum}: failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError}`)
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now()

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
    // ── Auth ──────────────────────────────────────────────────
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

    // ── Parse request ────────────────────────────────────────
    const body = await req.json()
    const { course_id } = body

    if (!course_id) {
      return new Response(JSON.stringify({ error: 'course_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Gather all course data in parallel ───────────────────
    const [
      courseRes,
      assignmentsRes,
      outcomesRes,
      weeksRes,
      profileRes,
      disciplineRes,
    ] = await Promise.all([
      supabase
        .from('courses')
        .select('id, course_code, course_name, section, semester_code, semester_start, num_weeks')
        .eq('id', course_id)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('assignments')
        .select('title, assignment_type, description, due_date, meta')
        .eq('course_id', course_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('learning_outcomes')
        .select('code, label, full_text, category, sort_order')
        .eq('course_id', course_id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('course_weeks')
        .select('week_number, topic, detail, is_milestone, weekly_outcomes, readings, lecture_topic, activities, discussion_board')
        .eq('course_id', course_id)
        .order('week_number', { ascending: true }),
      supabase
        .from('profiles')
        .select('name, email, institution, job_title, bio')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('career_connections')
        .select('inferred_discipline, confidence')
        .eq('course_id', course_id)
        .eq('user_id', userId)
        .maybeSingle(),
    ])

    // ── Verify course ownership ──────────────────────────────
    if (!courseRes.data) {
      return new Response(JSON.stringify({ error: 'Course not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const course = courseRes.data
    const assignments = assignmentsRes.data || []
    const outcomes = outcomesRes.data || []
    const weeks = weeksRes.data || []
    const profile = profileRes.data
    const discipline = disciplineRes.data

    // ── Separate outcomes by category ────────────────────────
    const learningOutcomes = outcomes.filter((o: { category: string }) => o.category === 'outcome')
    const competencies = outcomes.filter((o: { category: string }) => o.category === 'competency')
    const skills = outcomes.filter((o: { category: string }) => o.category === 'skill')

    // ── Group 1 data: course metadata + profile ──────────────
    const courseBlock = `## COURSE DATA
- Title: ${course.course_name}
- Code: ${course.course_code || '(not set)'}
- Section: ${course.section || '(not set)'}
- Semester: ${course.semester_code || '(not set)'}
- Semester start: ${course.semester_start || '(not set)'}
- Number of weeks: ${course.num_weeks || '(not set)'}`

    const profileBlock = profile
      ? `## INSTRUCTOR PROFILE
- Name: ${profile.name || '(not set)'}
- Email: ${profile.email || '(not set)'}
- Title: ${profile.job_title || '(not set)'}
- Institution: ${profile.institution || '(not set)'}
- Bio: ${truncate(profile.bio, 500) || '(not set)'}
- Office hours: (not stored — use placeholder)`
      : `## INSTRUCTOR PROFILE\n(No profile data available — use placeholders for all instructor fields)`

    const disciplineBlock = discipline?.inferred_discipline
      ? `## DISCIPLINE\nInferred: ${discipline.inferred_discipline} (confidence: ${discipline.confidence})`
      : `## DISCIPLINE\n(Not available — infer lightly from course title if possible)`

    const group1Msg = `Generate the syllabus sections listed in your instructions. Use all available data below. For anything marked "(not set)", use appropriate placeholders.

${courseBlock}

${profileBlock}

${disciplineBlock}`

    // ── Group 2 data: outcomes + competencies + skills ────────
    const loBlock = learningOutcomes.length > 0
      ? `## LEARNING OUTCOMES (${learningOutcomes.length})\n${learningOutcomes.map((o: { code: string; label: string; full_text?: string }) => `- ${o.code}: ${o.label}${o.full_text ? ' — ' + o.full_text : ''}`).join('\n')}`
      : `## LEARNING OUTCOMES\n(None added yet)`

    const compBlock = competencies.length > 0
      ? `## COMPETENCIES (${competencies.length})\n${competencies.map((o: { code: string; label: string; full_text?: string }) => `- ${o.code}: ${o.label}${o.full_text ? ' — ' + o.full_text : ''}`).join('\n')}`
      : `## COMPETENCIES\n(None added yet)`

    const skillBlock = skills.length > 0
      ? `## SKILLS (${skills.length})\n${skills.map((o: { code: string; label: string; full_text?: string }) => `- ${o.code}: ${o.label}${o.full_text ? ' — ' + o.full_text : ''}`).join('\n')}`
      : `## SKILLS\n(None added yet)`

    // Lightweight design context for the "structure" section (Correction B)
    const assignmentSummary = assignments.length > 0
      ? assignments.map((a: { title: string; assignment_type: string }) => `- ${a.title} (${a.assignment_type})`).join('\n')
      : '(none yet)'

    const weekSummary = weeks.length > 0
      ? weeks.map((w: { week_number: number; topic?: string }) => `- Week ${w.week_number}: ${w.topic || '(no topic)'}`).join('\n')
      : '(none yet)'

    const designContextBlock = `

## COURSE DESIGN CONTEXT (background only)
Use this ONLY to write the "structure" section — to describe the rhythm of
the course and explain the WHY behind its design. Do NOT list these as an
assignment list or a weekly schedule; those sections are generated elsewhere.

Assignment titles & types:
${assignmentSummary}

Week numbers & topics:
${weekSummary}`

    const group2Msg = `Generate the syllabus sections listed in your instructions. Use all available data below. For anything marked "(None added yet)", use appropriate placeholders.

${loBlock}

${compBlock}

${skillBlock}
${designContextBlock}`

    // ── Group 3 data: assignments ────────────────────────────
    const assignBlock = assignments.length > 0
      ? `## ASSIGNMENTS (${assignments.length})\n${assignments.map((a: { title: string; assignment_type: string; description?: string; due_date?: string; meta?: Record<string, unknown> }) => {
          const weight = a.meta && typeof a.meta === 'object' ? (a.meta as Record<string, unknown>).weight || (a.meta as Record<string, unknown>).points || '' : ''
          return `- ${a.title} (${a.assignment_type})${weight ? ' — Weight/Points: ' + weight : ''}${a.due_date ? ' — Due: ' + a.due_date : ''}\n  ${truncate(a.description || '', 300)}`
        }).join('\n')}`
      : `## ASSIGNMENTS\n(None added yet)`

    const group3Msg = `Generate the syllabus sections listed in your instructions. Use all available data below. For anything marked "(None added yet)", use appropriate placeholders.

${assignBlock}`

    // ── Group 4 data: course_weeks ───────────────────────────
    const weekBlock = weeks.length > 0
      ? `## WEEKLY SCHEDULE (${weeks.length} weeks)\n${weeks.map((w: { week_number: number; topic?: string; detail?: string; lecture_topic?: string; activities?: string[]; readings?: string[]; discussion_board?: string }) => {
          const parts = [`Week ${w.week_number}: ${w.topic || '(no topic)'}`]
          if (w.lecture_topic) parts.push(`  Lecture: ${w.lecture_topic}`)
          if (w.detail) parts.push(`  Detail: ${truncate(w.detail, 200)}`)
          if (w.activities?.length) parts.push(`  Activities: ${w.activities.join(', ')}`)
          if (w.readings?.length) parts.push(`  Readings: ${w.readings.join(', ')}`)
          if (w.discussion_board) parts.push(`  Discussion: ${truncate(w.discussion_board, 150)}`)
          return parts.join('\n')
        }).join('\n')}`
      : `## WEEKLY SCHEDULE\n(Not built yet)`

    const group4Msg = `Generate the syllabus sections listed in your instructions. Use all available data below. For anything marked "(Not built yet)", use appropriate placeholders.

${weekBlock}`

    // ── Fire all 4 groups in parallel ────────────────────────
    const results = await Promise.allSettled([
      callGroupWithRetry(1, GROUP_PROMPTS[1], group1Msg, apiKey, startTime, ['welcome', 'instructor', 'belonging', 'support', 'boilerplate']),
      callGroupWithRetry(2, GROUP_PROMPTS[2], group2Msg, apiKey, startTime, ['outcomes', 'structure', 'policies']),
      callGroupWithRetry(3, GROUP_PROMPTS[3], group3Msg, apiKey, startTime, ['assignments']),
      callGroupWithRetry(4, GROUP_PROMPTS[4], group4Msg, apiKey, startTime, ['schedule']),
    ])

    // ── Check for failures ───────────────────────────────────
    const failedGroups: string[] = []
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const reason = (results[i] as PromiseRejectedResult).reason
        console.error(`[generate-syllabus] Group ${i + 1} failed:`, reason.message || reason)
        failedGroups.push(`Group ${i + 1}`)
      }
    }

    if (failedGroups.length > 0) {
      return new Response(JSON.stringify({ error: `Syllabus generation failed for: ${failedGroups.join(', ')}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Merge into locked 10-section order ───────────────────
    const group1Sections = (results[0] as PromiseFulfilledResult<SyllabusSection[]>).value
    const group2Sections = (results[1] as PromiseFulfilledResult<SyllabusSection[]>).value
    const group3Sections = (results[2] as PromiseFulfilledResult<SyllabusSection[]>).value
    const group4Sections = (results[3] as PromiseFulfilledResult<SyllabusSection[]>).value

    const SECTION_ORDER = [
      'welcome', 'instructor', 'belonging', 'support',
      'outcomes', 'structure',
      'assignments',
      'schedule',
      'policies',
      'boilerplate',
    ]

    const allSections = [...group1Sections, ...group2Sections, ...group3Sections, ...group4Sections]
    const sectionMap = new Map(allSections.map(s => [s.sectionKey, s]))

    const syllabusSections: SyllabusSection[] = SECTION_ORDER
      .map(key => sectionMap.get(key))
      .filter((s): s is SyllabusSection => s != null)

    // ── Completeness check (Correction A) ────────────────────
    if (syllabusSections.length !== SECTION_ORDER.length) {
      const returnedKeys = allSections.map(s => s.sectionKey)
      const missing = SECTION_ORDER.filter(k => !returnedKeys.includes(k))
      console.error(`[generate-syllabus] INCOMPLETE MERGE — missing: ${missing.join(', ')} | keys actually returned: ${returnedKeys.join(', ')}`)
      return new Response(JSON.stringify({ error: `Syllabus incomplete — missing sections: ${missing.join(', ')}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Persist to generated_syllabi ─────────────────────────
    const inputsSnapshot = {
      course,
      assignmentCount: assignments.length,
      outcomeCount: learningOutcomes.length,
      competencyCount: competencies.length,
      skillCount: skills.length,
      weekCount: weeks.length,
      discipline: discipline?.inferred_discipline || null,
      hasProfile: !!profile,
    }

    const { error: insertErr } = await supabase
      .from('generated_syllabi')
      .insert({
        course_id,
        user_id: userId,
        sections: syllabusSections,
        inputs_snapshot: inputsSnapshot,
      })

    if (insertErr) {
      console.error('[generate-syllabus] Failed to save syllabus:', insertErr.message)
      // Non-fatal — still return the generated content
    }

    // ── Return structured sections ───────────────────────────
    return new Response(JSON.stringify({ sections: syllabusSections }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[generate-syllabus] Unexpected error:', err.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
