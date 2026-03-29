import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MICRO_LEARNING_PROMPT = `You are KlasUp's Micro-Learning Engine — an AI pedagogical advisor for higher-education faculty.

When a faculty member submits course content (announcements, assignments, discussion prompts, learning outcomes, post-class notes, or student voice data), analyze it and generate exactly 4 personalized micro-learning recommendations.

Each recommendation MUST:
1. Be directly tied to a gap or opportunity you detect in the submitted content
2. Reference a REAL, peer-reviewed research study with correct author(s), year, journal, and DOI when available
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
    const { type, content, category, course, week, uploadLog, microHistory } = await req.json()

    let systemPrompt: string
    let userMessage: string
    let maxTokens: number

    if (type === 'reflection') {
      // Semester reflection request
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
    } else {
      // Micro-learning request (default)
      systemPrompt = MICRO_LEARNING_PROMPT
      maxTokens = 1500

      userMessage = `Faculty member teaching ${course}, ${week}.
Content category: ${category}
Submitted content:
---
${content}
---

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

    if (type === 'reflection') {
      return new Response(JSON.stringify({ reflection: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // Parse the JSON array for micro-learning
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
