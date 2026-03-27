const SYSTEM_PROMPT = `You are KlasUp's Micro-Learning Engine — an AI pedagogical advisor for higher-education faculty.

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

export async function generateMicroLearning({ content, category, course, week }) {
  const userMessage = `Faculty member teaching ${course}, ${week}.
Content category: ${category}
Submitted content:
---
${content}
---

Based on this content, identify pedagogical gaps and opportunities, then generate 4 personalized micro-learning recommendations grounded in peer-reviewed research.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const text = data.content[0].text
  return JSON.parse(text)
}

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

export async function generateSemesterReflection({ course, uploadLog, microHistory }) {
  const uploadSummary = uploadLog
    .filter(u => u.course === course)
    .map(u => `[${u.week} · ${u.category}]\n${u.content}`)
    .join('\n\n---\n\n')

  const microSummary = Object.entries(microHistory)
    .flatMap(([cat, entries]) =>
      entries.filter(e => e.course === course).map(e =>
        `[${e.week} · ${cat}] ${e.recs.map(r => `${r.tag}: ${r.title}`).join('; ')}`
      )
    )
    .join('\n')

  const userMessage = `Faculty member teaching ${course}.

SEMESTER UPLOADS:
${uploadSummary || '(No uploads recorded)'}

AI MICRO-LEARNING RECOMMENDATIONS GENERATED:
${microSummary || '(No recommendations generated)'}

Based on this complete semester record, draft a reflective semester narrative for this faculty member's teaching portfolio.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: REFLECTION_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.content[0].text
}
