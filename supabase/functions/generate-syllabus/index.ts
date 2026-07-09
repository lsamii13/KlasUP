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

// ── System prompt — bakes in all §5 wording rules ────────────
const SYSTEM_PROMPT = `You are KlasUp's Syllabus Generator — an AI that produces warm, research-informed, learner-centered syllabi for higher-education faculty.

You will receive structured data about a course (whatever exists so far) and produce a complete syllabus as a JSON array of sections. The faculty member downloads this as a Word document, so the prose must be polished and ready-to-use.

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

Return ONLY valid JSON — no preamble, no markdown fences. The JSON must be an array of exactly 10 section objects in this exact order:

[
  {
    "sectionKey": "welcome",
    "title": "Welcome & Course Description",
    "content": "...",
    "hasPlaceholders": true
  },
  ...
]

The 10 sections, in order, with their sectionKey values:

1. "welcome" — Warm welcome + course description
2. "instructor" — Instructor info + office hours
3. "belonging" — Belonging statement
4. "support" — Student support & resources (Wellness Core)
5. "outcomes" — What you'll be able to do (outcomes + competencies + skills)
6. "structure" — How this class runs (class structure)
7. "assignments" — Assignments & grading
8. "schedule" — Weekly schedule
9. "policies" — Policies (classroom, late work, AI use)
10. "boilerplate" — Institutional / required boilerplate

Each section's "content" is the full prose/tables for that section, ready for a Word document. Use markdown-style formatting within content (## for sub-headings, **bold**, | for table rows) — the frontend will convert this to docx formatting.

Set "hasPlaceholders" to true if the section contains any [...] placeholders.

## SECTION-SPECIFIC INSTRUCTIONS

### 1. welcome
- Open with a genuinely warm welcome paragraph using "we" language.
- If a course description exists, weave it in naturally.
- If missing: draft a warm generic welcome using the course title + "[Add your course description here]".

### 2. instructor
- Use instructor name/title/email if available; placeholder if not.
- ALWAYS include placeholders for: office hours location, office hours times.
- Include a warm one-line explanation of what office hours are for ("Office hours are your time — come with questions, ideas, or just to talk through something you're working on").

### 3. belonging
- Write a genuine, inclusive-classroom statement. Not boilerplate — make it feel human.
- Use "we" language. Frame the classroom as a place where everyone's perspective matters.

### 4. support
- Point students to counseling, accessibility/disability services, tutoring, food pantry.
- Use placeholders for institution-specific links: [Add your campus counseling link], etc.
- Frame as "connecting you to resources" — NOT the instructor acting as therapist.

### 5. outcomes
- If learning outcomes exist: phrase as student capability ("By the end of this course, you'll be able to…").
- If competencies/skills exist: list them in a readable format, grouped by category.
- If missing: "[Your learning outcomes will appear here once added]".

### 6. structure
- Write from the assignment/activity mix and weekly schedule data.
- TRANSPARENCY RULE: where a design choice is evident (frequent low-stakes quizzes, drafts before finals), add a short plain-language WHY.
- If missing: "[Describe how your class sessions typically run]".

### 7. assignments
- List each assignment with title, description, type, and weight/points if available.
- Include a grading breakdown table if weights/points exist.
- For major assessments, add a brief "why it matters" line.
- If no assignments: "[Your assignments and grading breakdown will appear here once added]".

### 8. schedule
- Render as a clean week-by-week table if course_weeks data exists.
- If missing: "[Your weekly schedule will appear here once built]".

### 9. policies
- Three sub-sections: Classroom policy, Late work, AI use.
- Each gets a short, warm, editable starter framed positively + "[Edit to match your policy]".
- Frame as "here's how to succeed" not "here's what happens if you fail."

### 10. boilerplate
- Labeled placeholders for: disability/accessibility statement, academic integrity statement, Title IX/required institutional language.
- Note: "Paste your institution's official required statements here."

CRITICAL OUTPUT RULES:
- Your ENTIRE response must be a single JSON array. Nothing else.
- Do NOT wrap it in markdown code fences (\`\`\`json ... \`\`\`).
- Do NOT add any text, commentary, or explanation before or after the JSON.
- Start your response with [ and end it with ].
- The JSON must be valid and parseable.`

// ── Helper: truncate long text to stay within token budget ────
function truncate(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text || ''
  return text.slice(0, maxChars) + '… [truncated]'
}

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

    // ── Build the user prompt with all available data ─────────
    const sections: string[] = []

    // Course basics
    sections.push(`## COURSE DATA
- Title: ${course.course_name}
- Code: ${course.course_code || '(not set)'}
- Section: ${course.section || '(not set)'}
- Semester: ${course.semester_code || '(not set)'}
- Semester start: ${course.semester_start || '(not set)'}
- Number of weeks: ${course.num_weeks || '(not set)'}`)

    // Instructor
    if (profile) {
      sections.push(`## INSTRUCTOR PROFILE
- Name: ${profile.name || '(not set)'}
- Email: ${profile.email || '(not set)'}
- Title: ${profile.job_title || '(not set)'}
- Institution: ${profile.institution || '(not set)'}
- Bio: ${truncate(profile.bio, 500) || '(not set)'}
- Office hours: (not stored — use placeholder)`)
    } else {
      sections.push(`## INSTRUCTOR PROFILE\n(No profile data available — use placeholders for all instructor fields)`)
    }

    // Discipline
    if (discipline?.inferred_discipline) {
      sections.push(`## DISCIPLINE\nInferred: ${discipline.inferred_discipline} (confidence: ${discipline.confidence})`)
    } else {
      sections.push(`## DISCIPLINE\n(Not available — infer lightly from course title if possible)`)
    }

    // Learning outcomes
    if (learningOutcomes.length > 0) {
      const loText = learningOutcomes.map((o: { code: string; label: string; full_text?: string }) =>
        `- ${o.code}: ${o.label}${o.full_text ? ' — ' + o.full_text : ''}`
      ).join('\n')
      sections.push(`## LEARNING OUTCOMES (${learningOutcomes.length})\n${loText}`)
    } else {
      sections.push(`## LEARNING OUTCOMES\n(None added yet)`)
    }

    // Competencies
    if (competencies.length > 0) {
      const compText = competencies.map((o: { code: string; label: string; full_text?: string }) =>
        `- ${o.code}: ${o.label}${o.full_text ? ' — ' + o.full_text : ''}`
      ).join('\n')
      sections.push(`## COMPETENCIES (${competencies.length})\n${compText}`)
    } else {
      sections.push(`## COMPETENCIES\n(None added yet)`)
    }

    // Skills
    if (skills.length > 0) {
      const skillText = skills.map((o: { code: string; label: string; full_text?: string }) =>
        `- ${o.code}: ${o.label}${o.full_text ? ' — ' + o.full_text : ''}`
      ).join('\n')
      sections.push(`## SKILLS (${skills.length})\n${skillText}`)
    } else {
      sections.push(`## SKILLS\n(None added yet)`)
    }

    // Assignments
    if (assignments.length > 0) {
      const assignText = assignments.map((a: { title: string; assignment_type: string; description?: string; due_date?: string; meta?: Record<string, unknown> }) => {
        const weight = a.meta && typeof a.meta === 'object' ? (a.meta as Record<string, unknown>).weight || (a.meta as Record<string, unknown>).points || '' : ''
        return `- ${a.title} (${a.assignment_type})${weight ? ' — Weight/Points: ' + weight : ''}${a.due_date ? ' — Due: ' + a.due_date : ''}\n  ${truncate(a.description || '', 300)}`
      }).join('\n')
      sections.push(`## ASSIGNMENTS (${assignments.length})\n${assignText}`)
    } else {
      sections.push(`## ASSIGNMENTS\n(None added yet)`)
    }

    // Weekly schedule
    if (weeks.length > 0) {
      const weekText = weeks.map((w: { week_number: number; topic?: string; detail?: string; lecture_topic?: string; activities?: string[]; readings?: string[]; discussion_board?: string }) => {
        const parts = [`Week ${w.week_number}: ${w.topic || '(no topic)'}`]
        if (w.lecture_topic) parts.push(`  Lecture: ${w.lecture_topic}`)
        if (w.detail) parts.push(`  Detail: ${truncate(w.detail, 200)}`)
        if (w.activities?.length) parts.push(`  Activities: ${w.activities.join(', ')}`)
        if (w.readings?.length) parts.push(`  Readings: ${w.readings.join(', ')}`)
        if (w.discussion_board) parts.push(`  Discussion: ${truncate(w.discussion_board, 150)}`)
        return parts.join('\n')
      }).join('\n')
      sections.push(`## WEEKLY SCHEDULE (${weeks.length} weeks)\n${weekText}`)
    } else {
      sections.push(`## WEEKLY SCHEDULE\n(Not built yet)`)
    }

    const userMessage = `Generate a complete syllabus for this course. Use all available data below. For anything marked "(not set)" or "(None added yet)" or "(Not built yet)", use appropriate placeholders.

${sections.join('\n\n')}`

    // ── Call Anthropic API (with one automatic retry on parse failure) ─
    const MAX_ATTEMPTS = 2
    let syllabusSections: Array<{ sectionKey: string; title: string; content: string; hasPlaceholders: boolean }> | null = null
    let lastParseError = ''

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text()
        console.error(`[generate-syllabus] Anthropic API error (attempt ${attempt}):`, anthropicRes.status, errText)
        return new Response(JSON.stringify({ error: `AI service error (${anthropicRes.status})` }), {
          status: anthropicRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const aiData = await anthropicRes.json()
      const rawText = aiData.content[0].text

      try {
        const parsed = parseClaudeJSON(rawText) as typeof syllabusSections
        if (Array.isArray(parsed) && parsed.length > 0) {
          syllabusSections = parsed
          break
        }
        lastParseError = 'AI returned non-array or empty array'
        console.error(`[generate-syllabus] Invalid structure (attempt ${attempt}):`, typeof parsed)
      } catch (parseErr) {
        lastParseError = (parseErr as Error).message
        console.error(`[generate-syllabus] JSON parse failed (attempt ${attempt}):`, rawText.slice(0, 500))
      }

      if (attempt < MAX_ATTEMPTS) {
        console.log('[generate-syllabus] Retrying after parse failure...')
      }
    }

    if (!syllabusSections) {
      return new Response(JSON.stringify({ error: `Failed to parse AI response after ${MAX_ATTEMPTS} attempts: ${lastParseError}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate structure
    if (!Array.isArray(syllabusSections) || syllabusSections.length === 0) {
      console.error('[generate-syllabus] AI returned non-array or empty array')
      return new Response(JSON.stringify({ error: 'AI returned invalid syllabus structure' }), {
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
