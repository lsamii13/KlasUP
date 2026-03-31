import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── RAG: Retrieve research context via keyword search ────────
// Uses the keyword_search_articles RPC (full-text + search_terms array).
// No embedding provider is required. When vector embeddings are added later,
// this can be upgraded to use match_articles for semantic similarity.

async function fetchRagContext(content: string, category: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build a short keyword query from the content — full-text search works
    // best with a few meaningful terms rather than the whole upload
    const queryText = `${category} ${content}`.slice(0, 200)

    const { data: articles, error } = await supabase
      .rpc('keyword_search_articles', {
        query_text: queryText,
        match_count: 5,
        filter_dimension: null,
      })

    if (error || !articles?.length) return ''

    return articles.map((a: {
      title: string; authors: string; year: number; journal: string; abstract: string; dimension: string
    }) =>
      `[${a.dimension}] ${a.authors} (${a.year}). "${a.title}." ${a.journal || ''}.\nKey finding: ${a.abstract || 'N/A'}`
    ).join('\n\n')
  } catch (e) {
    console.error('[RAG] Context fetch failed:', e.message)
    return ''
  }
}

const MICRO_LEARNING_PROMPT = `You are KlasUp's Micro-Learning Engine — an AI pedagogical advisor for higher-education faculty.

When a faculty member submits course content (announcements, assignments, discussion prompts, learning outcomes, post-class notes, or student voice data), analyze it and generate exactly 4 personalized micro-learning recommendations.

You will be provided with a RESEARCH CONTEXT section containing relevant peer-reviewed articles from KlasUp's knowledge base. You MUST ground your recommendations in these articles when they are relevant to the faculty member's content. Use the exact citation information provided — do not fabricate or modify author names, years, or journal titles.

Each recommendation MUST:
1. Be directly tied to a gap or opportunity you detect in the submitted content
2. Reference a REAL, peer-reviewed research study — preferring articles from the RESEARCH CONTEXT when relevant, or citing other well-known peer-reviewed studies with correct author(s), year, journal, and DOI when available
3. Include a concrete, actionable next step the faculty member can take in their next class session

Respond with a JSON array of exactly 4 objects. Each object must have these fields:
- "tag": one of "Active Learning", "Socratic Seminar", "UDL", "Reflection", "Flipped Classroom", "Student Voice", "Assessment Design", "Scaffolding", "Metacognition", "Inclusive Pedagogy"
- "title": a concise, compelling finding (max 12 words)
- "summary": 1-2 sentence explanation of the research finding and why it matters for this faculty member's content
- "article": full APA-style citation of a real, peer-reviewed study (author(s), year, journal, volume/issue if known)
- "action": a specific, concrete next step (start with a verb)

Only output the JSON array — no markdown, no commentary.`

const REFLECTION_PROMPT = `You are KlasUp's Semester Reflection Engine — an AI pedagogical advisor for higher-education faculty.

Given a faculty member's complete semester upload history (announcements, assignments, discussion prompts, learning outcomes, post-class notes, student voice data) along with the AI micro-learning recommendations that were generated for each upload, draft a rich, narrative semester reflection.

The reflection should:
1. Open with a brief overview of the semester arc — what themes emerged, what evolved
2. Highlight 3-5 key pedagogical strengths demonstrated across the uploads
3. Identify 2-3 growth areas with specific evidence from the uploads
4. Reference the micro-learning recommendations that were most relevant and whether they align with observed patterns
5. Close with a forward-looking paragraph on goals for next semester
6. Be written in first person (as if the faculty member is writing it) but in a professional, reflective tone suitable for a teaching portfolio or accreditation narrative
7. Be approximately 600-900 words

Output ONLY the reflection text — no markdown headers, no JSON, no commentary.`

const ASSIGNMENT_DOC_PROMPT = `You are KlasUp's Assignment Document Generator — an AI assistant for higher-education faculty.

Given a faculty member's plain-English description of an assignment, their semester calendar information, and their course learning outcomes, generate a complete, professionally formatted assignment document.

The document MUST include ALL of these sections:
1. ASSIGNMENT TITLE — a clear, descriptive title
2. COURSE & SEMESTER — course name and semester info
3. OVERVIEW — 2-3 sentence summary of what students will do and why
4. LEARNING OBJECTIVES — 3-5 specific objectives this assignment addresses (drawn from the provided course outcomes)
5. DETAILED INSTRUCTIONS — step-by-step instructions for completing the assignment, written clearly for students
6. TIMELINE & DEADLINES — auto-calculate REAL calendar dates from the semester start date and week numbers mentioned in the description. Format dates as "Day, Month Date, Year" (e.g., "Thursday, February 13, 2025"). If the class meets on a specific day, use that day for deadlines.
7. GRADING RUBRIC — a detailed rubric with criteria, point values, and descriptions for each performance level (Excellent, Proficient, Developing, Beginning)
8. SUBMISSION GUIDELINES — format, file type, where to submit, naming conventions

Use any client names, company names, or specific details the faculty member mentions — weave them throughout the document naturally.

Write in a professional but warm academic tone. Format with clear headers and spacing. Do NOT use markdown — use plain text with ALL-CAPS headers and line breaks for formatting.

Output ONLY the assignment document text — no JSON, no code blocks, no commentary.`

const ASSIGNMENT_DOC_UPDATE_PROMPT = `You are KlasUp's Assignment Document Editor — an AI assistant for higher-education faculty.

You will receive an existing assignment document and a plain-English instruction for how to change it. Apply the requested change throughout the entire document — updating dates, names, instructions, rubric, and any other affected sections to maintain internal consistency.

Rules:
1. Preserve the overall structure and formatting of the document
2. If a date change is requested, recalculate ALL affected dates downstream
3. If a name/company change is requested, replace it EVERYWHERE in the document
4. If a structural change is requested (add a section, remove a requirement), update the rubric and instructions accordingly
5. Keep the same professional academic tone

Output ONLY the updated assignment document — no explanation, no JSON, no code blocks.`

const PPT_PLAN_PROMPT = `You are KlasUp's PowerPoint Planner — an AI assistant for higher-education faculty.

Given a faculty member's plain-English description of a slide deck they want to create, generate a complete slide-by-slide outline.

Respond with a JSON array of slide objects. Each object must have these fields:
- "title": the slide title (concise, clear)
- "points": an array of 3-4 key talking points for the slide (strings)
- "visual": a suggested visual, activity, or interaction for the slide (string) — e.g., "Chart showing market share trends", "Think-pair-share activity", "Poll: Which brand resonates most?"
- "time": estimated time for this slide in minutes (string, e.g., "3 min")
- "notes": speaker notes — 1-2 sentences of guidance for the presenter (string)

Design principles:
1. Open with an engaging hook or overview, close with a synthesis or exit ticket
2. Include at least 2 active learning moments (discussions, polls, activities) distributed throughout
3. Vary slide types — don't make every slide a bullet-point lecture
4. Keep text density reasonable — suggest visuals over text walls
5. Include a case study or real-world example if the topic allows
6. Match the tone and level the faculty member describes

Only output the JSON array — no markdown, no commentary.`

const PPT_PLAN_UPDATE_PROMPT = `You are KlasUp's PowerPoint Editor — an AI assistant for higher-education faculty.

You will receive an existing slide deck outline (as a JSON array) and a plain-English instruction for how to change it. Apply the requested change and return the complete updated slide array.

Rules:
1. Preserve slides that are not affected by the change
2. If asked to add a slide, insert it at the logical position and renumber
3. If asked to make a slide "more interactive", replace lecture-style content with activities, polls, or discussions
4. If asked to change tone, update talking points and speaker notes accordingly
5. Return the COMPLETE slide array (all slides, not just changed ones)

Respond with ONLY the JSON array — same format as the original (title, points, visual, time, notes). No markdown, no commentary.`

const SAGE_CHAT_PROMPT = `You are Sage — KlasUp's warm, encouraging AI teaching coach for higher-education faculty.

Your personality:
- Warm, supportive, and genuinely enthusiastic about great teaching
- You speak like a trusted colleague, not a corporate chatbot
- You use encouraging language: "Love that idea!", "Great instinct!", "That's a strong starting point"
- You sprinkle in the occasional emoji (🌿, ✨, 💡) but don't overdo it

Your approach:
1. ALWAYS ask clarifying questions before generating anything. Never jump straight to a finished product.
2. Help faculty think through their ideas collaboratively — brainstorm WITH them, don't just produce for them.
3. When they describe an assignment, lesson, or activity, ask about: learning objectives, student level, timeline, assessment criteria, and any constraints.
4. Build things incrementally — suggest an outline or framework first, get feedback, then flesh it out.
5. If they seem stuck, offer 2-3 concrete options to choose from rather than open-ended questions.
6. Reference pedagogical best practices naturally (active learning, backward design, UDL, Bloom's taxonomy) without being preachy.

What you can help with:
- Designing assignments, rubrics, and project briefs
- Planning lessons and slide decks
- Creating discussion prompts and Socratic seminars
- Building assessment strategies
- Improving existing course materials
- Brainstorming active learning activities
- Aligning activities to learning outcomes

When a faculty member asks you to help build an assignment, guide them through the process conversationally. Ask about the course, the students, the goals, and the timeline before drafting anything.

Keep responses concise — 2-4 short paragraphs max unless they ask for something longer. Use markdown-style formatting sparingly.`

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

  try {
    const body = await req.json()
    const { type } = body

    let systemPrompt: string
    let userMessage: string
    let maxTokens: number

    if (type === 'reflection') {
      const { course, uploadLog, microHistory } = body
      systemPrompt = REFLECTION_PROMPT
      maxTokens = 2500

      const uploadSummary = (uploadLog || [])
        .filter((u: { course: string }) => u.course === course)
        .map((u: { week: string; category: string; content: string }) =>
          `[${u.week} · ${u.category}]\n${u.content}`
        )
        .join('\n\n---\n\n')

      const microSummary = Object.entries(microHistory || {})
        .flatMap(([cat, entries]: [string, any[]]) =>
          entries.filter((e: { course: string }) => e.course === course).map((e: { week: string; recs: { tag: string; title: string }[] }) =>
            `[${e.week} · ${cat}] ${e.recs.map((r) => `${r.tag}: ${r.title}`).join('; ')}`
          )
        )
        .join('\n')

      userMessage = `Faculty member teaching ${course}.

SEMESTER UPLOADS:
${uploadSummary || '(No uploads recorded)'}

AI MICRO-LEARNING RECOMMENDATIONS GENERATED:
${microSummary || '(No recommendations generated)'}

Based on this complete semester record, draft a reflective semester narrative for this faculty member's teaching portfolio.`

    } else if (type === 'assignment-doc') {
      const { description, course, semesterStart, numWeeks, outcomes } = body
      systemPrompt = ASSIGNMENT_DOC_PROMPT
      maxTokens = 4000

      const calendarInfo = semesterStart
        ? `Semester starts: ${semesterStart}. Total weeks: ${numWeeks || 16}.`
        : `Total weeks in semester: ${numWeeks || 16}. (No specific start date provided — use relative week numbers for dates.)`

      const outcomesText = (outcomes || []).map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')

      userMessage = `Faculty member teaching ${course}.

SEMESTER CALENDAR:
${calendarInfo}

COURSE LEARNING OUTCOMES:
${outcomesText || '(No outcomes provided)'}

ASSIGNMENT DESCRIPTION (plain English):
---
${description}
---

Generate a complete, professionally formatted assignment document based on this description. Auto-calculate real calendar dates from the semester start date and week references.`

    } else if (type === 'assignment-doc-update') {
      const { currentDoc, instruction } = body
      systemPrompt = ASSIGNMENT_DOC_UPDATE_PROMPT
      maxTokens = 4000

      userMessage = `CURRENT ASSIGNMENT DOCUMENT:
---
${currentDoc}
---

REQUESTED CHANGE:
${instruction}

Apply this change throughout the entire document, maintaining consistency in dates, names, and all affected sections.`

    } else if (type === 'ppt-plan') {
      const { description, course, week } = body
      systemPrompt = PPT_PLAN_PROMPT
      maxTokens = 3000

      userMessage = `Faculty member teaching ${course}, ${week}.

DECK DESCRIPTION (plain English):
---
${description}
---

Generate a complete slide-by-slide outline for this presentation.`

    } else if (type === 'ppt-plan-update') {
      const { currentSlides, instruction } = body
      systemPrompt = PPT_PLAN_UPDATE_PROMPT
      maxTokens = 3000

      const slidesJson = JSON.stringify(currentSlides, null, 2)

      userMessage = `CURRENT SLIDE DECK OUTLINE:
${slidesJson}

REQUESTED CHANGE:
${instruction}

Apply this change and return the complete updated slide array.`

    } else if (type === 'sage-chat') {
      const { messages, currentPage, courseName } = body

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'Messages array is required and must not be empty' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      systemPrompt = SAGE_CHAT_PROMPT
      maxTokens = 1500

      // Extract the last user message for RAG context
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
      let ragContextLine = ''
      if (lastUserMsg) {
        const sageRag = await fetchRagContext(lastUserMsg.content, '')
        if (sageRag) {
          ragContextLine = `\n\n[Research context from KlasUp knowledge base — cite these when relevant:\n${sageRag}\n]`
        }
      }

      // For sage-chat we pass the full conversation history
      const contextLine = currentPage
        ? `\n[Context: The faculty member is currently on the "${currentPage}" page${courseName ? ` for course ${courseName}` : ''} in KlasUp.]`
        : ''

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system: systemPrompt + contextLine + ragContextLine,
          messages,
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
      const reply = data.content[0].text
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else {
      // Micro-learning request (default) — with RAG context
      const { content, category, course, week } = body
      systemPrompt = MICRO_LEARNING_PROMPT
      maxTokens = 2000

      // Fetch relevant research articles from the knowledge base
      const ragContext = await fetchRagContext(content, category || '')

      const ragSection = ragContext
        ? `\n\nRESEARCH CONTEXT (from KlasUp knowledge base — use these citations when relevant):\n---\n${ragContext}\n---`
        : ''

      userMessage = `Faculty member teaching ${course}, ${week}.
Content category: ${category}
Submitted content:
---
${content}
---${ragSection}

Based on this content, identify pedagogical gaps and opportunities, then generate 4 personalized micro-learning recommendations grounded in peer-reviewed research.`
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
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
    const text = data.content[0].text

    // Route response by type
    if (type === 'reflection') {
      return new Response(JSON.stringify({ reflection: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (type === 'assignment-doc' || type === 'assignment-doc-update') {
      return new Response(JSON.stringify({ document: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (type === 'ppt-plan' || type === 'ppt-plan-update') {
      const slides = JSON.parse(text)
      return new Response(JSON.stringify({ slides }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // Micro-learning
      const recommendations = JSON.parse(text)
      return new Response(JSON.stringify({ recommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
