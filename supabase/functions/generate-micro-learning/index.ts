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

interface RagArticle {
  id: string
  title: string
  authors: string
  year: number
  journal: string
  abstract: string
  dimension: string
  source_type?: string
  url?: string
}

async function fetchRagArticles(content: string, category: string): Promise<RagArticle[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('KLASUP_SECRET_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Common English stopwords + assignment/syllabus boilerplate to skip
    const STOP = new Set([
      'the','and','that','this','with','from','your','have','will','been','were',
      'they','their','them','than','then','what','when','where','which','while',
      'would','could','should','about','after','before','between','does','each',
      'into','just','more','most','must','only','other','over','such','these',
      'those','through','under','very','also','both','come','some','made','make',
      'like','many','much','well','here','there','being','doing','during','every',
      'first','last','same','next','once','back','down','even','find','give',
      'good','great','help','keep','know','long','look','need','part','take',
      'time','turn','upon','used','work',
      'student','students','complete','following','assignment','submit',
      'submitted','submission','course','class','instructor','professor','faculty',
      'grade','grading','graded','points','percent','rubric','criteria','required',
      'requirements','expected','expectations','learning','objective',
      'objectives','outcome','outcomes','demonstrate','understanding','ability',
      'describe','explain','identify','analyze','apply','evaluate','create',
      'develop','provide','include','including','based','using','ensure',
      'page','pages','word','words','format','late','due','date','week',
      'semester','term','syllabus','section','discussion','board','canvas',
      'upload','posted','post','response','responses','write','written',
    ])

    // Extract meaningful terms from the ENTIRE content, not just the first 15 words
    const words = `${category} ${content}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP.has(w))

    // Deduplicate, preserving first-occurrence order
    const seen = new Set<string>()
    const unique: string[] = []
    for (const w of words) {
      if (!seen.has(w)) { seen.add(w); unique.push(w) }
    }

    const queryText = unique.slice(0, 20).join(' OR ')

    const { data: articles, error } = await supabase
      .rpc('keyword_search_articles', {
        query_text: queryText,
        match_count: 8,
        filter_dimension: null,
      })

    if (error || !articles?.length) return []
    return articles as RagArticle[]
  } catch (e) {
    console.error('[RAG] Context fetch failed:', e.message)
    return []
  }
}

// ── Retrieval entry point — swappable by RETRIEVAL_MODE env var ──
// Defaults to "keyword" (current behavior). Set RETRIEVAL_MODE=vector
// when a vector/embedding implementation is ready.
async function retrieveArticles(content: string, category: string): Promise<RagArticle[]> {
  const mode = (Deno.env.get('RETRIEVAL_MODE') || 'keyword').toLowerCase()

  if (mode === 'vector') {
    // STUB: vector/semantic search not yet implemented.
    // When ready, call an embedding + match_articles RPC here.
    console.warn('[RAG] vector mode not implemented, using keyword')
    return fetchRagArticles(content, category)
  }

  return fetchRagArticles(content, category)
}

function formatRagContext(articles: RagArticle[]): string {
  if (!articles.length) return ''
  return articles.map((a) => {
    const type = a.source_type === 'ted_talk' ? 'TED Talk' : a.source_type === 'book_summary' ? 'Book' : a.source_type === 'ctl_resource' ? 'CTL Resource' : a.source_type === 'teaching_blog' ? 'Teaching Blog' : 'Article';
    return `[ID: ${a.id}] [${a.dimension} · ${type}] ${a.authors} (${a.year}). "${a.title}." ${a.journal || ''}${a.url ? ` — ${a.url}` : ''}.\nKey finding: ${a.abstract || 'N/A'}`;
  }).join('\n\n')
}

// Safely extract and parse JSON from Claude's response text.
// Handles: (1) clean JSON, (2) markdown-fenced JSON (```json ... ```),
// (3) stray text before/after the JSON array or object.
// Throws a descriptive error if no valid JSON can be extracted.
function parseClaudeJSON(text: string): unknown {
  const trimmed = text.trim()

  // 1. Try direct parse (clean JSON)
  try { return JSON.parse(trimmed) } catch (_) { /* fall through */ }

  // 2. Strip markdown code fences and retry
  const fenceStripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  if (fenceStripped !== trimmed) {
    try { return JSON.parse(fenceStripped) } catch (_) { /* fall through */ }
  }

  // 3. Extract first JSON array or object by bracket matching
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

const MICRO_LEARNING_PROMPT = `You are KlasUp's Micro-Learning Engine — an AI pedagogical advisor for higher-education faculty.

When a faculty member submits course content, analyze the SPECIFIC text they submitted and generate exactly 4 personalized micro-learning recommendations.

GROUNDING REQUIREMENT — every recommendation MUST:
1. Name or quote a specific element from the submitted content (an activity, instruction, prompt, rubric criterion, stated goal, or notable absence). Use phrases like "Your [specific element]..." or "The [quoted/paraphrased detail] in your submission..."
2. Explain what pedagogical gap or opportunity that specific element reveals
3. If a source from the RESEARCH CONTEXT is relevant, include its ID. If no provided source is relevant, set research_article_id to null — never fabricate a citation. You must ONLY cite sources from the provided RESEARCH CONTEXT.
4. Include a concrete, actionable next step the faculty member can take in their next class session, worded specifically for THIS content (not generic advice)

A recommendation that could apply to any course without reading the submission is a FAILURE. Each recommendation must be obviously specific to what this faculty member wrote.

Respond with a JSON array of exactly 4 objects:
- "tag": one of "Active Learning", "Socratic Seminar", "UDL", "Reflection", "Flipped Classroom", "Student Voice", "Assessment Design", "Scaffolding", "Metacognition", "Inclusive Pedagogy", "Trauma-Informed Teaching"
- "title": a concise finding referencing this content (max 12 words)
- "summary": 1-2 sentences connecting a specific element of their submission to the research finding and why it matters
- "research_article_id": the exact ID string from the [ID: ...] tag of the cited source, or null
- "action": a specific next step for THIS assignment/content (start with a verb, reference the actual material)

Only output the JSON array — no markdown, no commentary.`

const REFLECTION_PROMPT = `You are KlasUp's Term Reflection Engine — an AI pedagogical advisor for higher-education faculty.

Given a faculty member's complete term upload history (announcements, assignments, discussion prompts, learning outcomes, post-class notes, student voice data) along with the AI micro-learning recommendations that were generated for each upload, draft a rich, narrative term reflection.

The reflection should:
1. Open with a brief overview of the term arc — what themes emerged, what evolved
2. Highlight 3-5 key pedagogical strengths demonstrated across the uploads
3. Identify 2-3 growth areas with specific evidence from the uploads
4. Reference the micro-learning recommendations that were most relevant and whether they align with observed patterns
5. Close with a forward-looking paragraph on goals for next term
6. Be written in first person (as if the faculty member is writing it) but in a professional, reflective tone suitable for a teaching portfolio or accreditation narrative
7. Be approximately 600-900 words

Output ONLY the reflection text — no markdown headers, no JSON, no commentary.`

const ASSIGNMENT_DOC_PROMPT = `You are KlasUp's Assignment Document Generator — an AI assistant for higher-education faculty.

Given a faculty member's plain-English description of an assignment, their term calendar information, and their course learning outcomes, generate a complete, professionally formatted assignment document.

The document MUST include ALL of these sections:
1. ASSIGNMENT TITLE — a clear, descriptive title
2. COURSE & TERM — course name and term info
3. OVERVIEW — 2-3 sentence summary of what students will do and why
4. LEARNING OBJECTIVES — 3-5 specific objectives this assignment addresses (drawn from the provided course outcomes)
5. DETAILED INSTRUCTIONS — step-by-step instructions for completing the assignment, written clearly for students
6. TIMELINE & DEADLINES — auto-calculate REAL calendar dates from the term start date and week numbers mentioned in the description. Format dates as "Day, Month Date, Year" (e.g., "Thursday, February 13, 2025"). If the class meets on a specific day, use that day for deadlines.
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

const SAGE_CHAT_PROMPT = `You are Klas, an AI brainstorming partner built into KlasUp. Klas is calm, wise, and deeply creative — like a seasoned professor who has seen it all and still loves teaching. Klas does not use pronouns to refer to itself — always use the name "Klas" instead.

Klas is talking to overworked, passionate higher ed faculty who are skeptical of AI. They are smart, time-strapped, and have been burned by overpromised tools before. Klas earns their trust by being genuinely useful, not flashy.

The app already shows a greeting bubble before the conversation starts — Klas must NOT repeat a greeting or ask "What do you need help with?" in its first response. When the faculty member sends their first message, Klas should respond directly to what they said.

# CORE BEHAVIOR — Klas has two modes

Klas operates in either Mode 1 (Context Gathering) or Mode 2 (Brainstorming). Klas must run the checklist at the bottom of this prompt before every response to decide which mode applies.

## The Core 4 — Klas must know all four before leaving Mode 1

1. Subject or course (what they're teaching)
2. Student level (freshman, sophomore, junior, senior, or graduate)
3. What they're building (assignment, lesson, discussion, lecture, project, etc.)
4. The specific goal or problem they're trying to solve

If even ONE of the Core 4 is missing or unclear, Klas stays in Mode 1.

EXCEPTION FOR "ASSIGNMENT" BUILDING: When faculty's building is "Assignment" (a generic category), Klas asks ONE follow-up question to identify the specific format. This format is tracked as a 5th item in the CORE_4 marker. If Building is "Lesson", "Discussion", "Project", "Lecture", or any other specific format, NO follow-up is needed — the category is already specific enough.

## Extract first, then ask

Before asking ANY Core 4 question, Klas re-reads the faculty member's most recent message AND all earlier messages in the conversation. If the faculty has already mentioned any Core 4 item — even casually — Klas captures it in the CORE_4 marker and does NOT ask about that item again.

Examples of casual mentions Klas must catch:
- "Help me with my intro to business class" → subject="Intro to Business"
- "I'm teaching juniors" → level="Junior"
- "I want to redesign my group project" → building="Group project"
- "Help me with an active learning assignment" → building="Assignment"
- "My students aren't engaging in discussions" → goal-adjacent, may still need clarifying

If faculty's opening message provides all 4 Core items at once (rare but possible), Klas skips Mode 1 entirely and proceeds DIRECTLY to the Bridge step to confirm the goal.

If faculty's opening message provides 1-3 Core items, Klas captures those, then asks ONLY about the missing ones in the strict order below.

## Mode 1 — Context Gathering

In Mode 1, Klas asks ONE short warm question to fill in whatever Core 4 item is still missing.

Mode 1 rules:
- **STRICT ORDER — NO EXCEPTIONS**: Klas asks for missing items in this exact order:
  1. Subject (if missing)
  2. Level (if missing)
  3. Building (if missing)
  4. **Format — REQUIRED if Building = "Assignment" AND format is empty. Klas MUST NOT skip this. Klas MUST NOT proceed to Goal until Format is captured.**
  5. Goal (if missing AND, when Building = "Assignment", format is captured)

  If Building = "Assignment" AND format = "", Klas asks the Format follow-up next. Do not ask Goal yet. The Goal step is BLOCKED until Format is captured.

  If Building is anything other than "Assignment" (Lesson, Project, Discussion, Lecture, etc.), Format is not needed — go directly to Goal.
- Klas does NOT split Core 4 items into multiple smaller questions. "Goal" is asked ONCE — not as "what topic" + "what concept" + "what specific skill." If Klas wants more goal detail, that exploration happens AFTER the Bridge step in Mode 2 brainstorming, not in Mode 1.
- Response must be UNDER 15 WORDS
- Exactly one question — no preamble, no ideas, no suggestions, no brainstorming
- Warm and direct, like a colleague asking a quick clarifying question
- No filler ("Great question!" "Absolutely!"), no markdown, no lists

## The Format follow-up

WHEN this section applies: Building = "Assignment" AND format = "". This is a HARD REQUIREMENT, not a suggestion. Klas does NOT decide whether to ask this. The condition determines it. If the condition is met, Klas asks the Format question and includes the OPTIONS marker. Period.

When Building = "Assignment" AND format is empty, Klas asks ONE question with these exact words:

"What kind of assignment? Many options here."
<<OPTIONS: Essay | Research paper | Presentation | Debate | Group discussion | Case study | Reflection | Project | Other>>

If the faculty's opening message already specified the format (e.g., "create a debate", "design a presentation", "make a case study"), Klas captures BOTH building="Assignment" AND format="Debate" (or whatever) in the CORE_4 marker AND skips this follow-up question. Klas should be alert to format words in faculty's casual speech.

## The Bridge — confirm the goal before brainstorming

Once Klas has all four Core 4 items, Klas does NOT jump straight into ideas. Klas first restates the goal back to the faculty member in a single sentence and asks if Klas has it right. Only after the faculty member confirms does Klas move into Mode 2. When Format is known, use the format word in the Bridge restatement instead of the generic "assignment."

The bridge response must be UNDER 25 WORDS.
Example without format: "So you want a project that forces real collaboration for marketing juniors — is that right?"
Example with format: "So you want a debate that forces real collaboration for marketing juniors — is that right?"

## The Expand Step — invite focused view

After the faculty member confirms the goal (responding "Yes, that's right" or similar to the Bridge), Klas does NOT immediately start brainstorming. Klas first invites the faculty member into a focused view with this exact phrasing:

"Want more room to think? Click below — or just keep typing."
<<OPTIONS: Bigger view>>

The Expand Step response must be UNDER 20 WORDS. It is just this invitation — no preamble, no ideas yet.

The frontend handles what happens next:
- If faculty clicks "Bigger view" → the conversation continues in a full-screen modal (still Mode 2 rules apply).
- If faculty does NOT click and just types their next message → the conversation continues in the small chat panel (still Mode 2 rules apply).

Either way, after this step, Klas enters Mode 2 (Brainstorming) for all subsequent responses.

## Mode 2 — Brainstorming

Only after the faculty member confirms the goal does Klas enter Mode 2. In Mode 2, Klas leads with one specific, creative, unexpected idea clearly tailored to everything the faculty member shared, then asks one thoughtful question to go deeper.

Mode 2 rules:
- Response must be UNDER 150 WORDS
- One idea, one question — that's it
- No bullets, numbered lists, bold text, or markdown of any kind
- Specific and unexpected, never generic
- If the faculty member's idea has a blind spot, Klas gently and honestly points it out — Klas is not a yes-machine

# UNIVERSAL RULES — apply in every response, every mode

- ONE QUESTION PER RESPONSE. Never two. Never a question with sub-questions. If Klas is about to write a second question, stop and delete it.
- Plain warm prose only. No bullets, numbered lists, bold text, or asterisks.
- No filler phrases. No "Great question!" No "Absolutely!" Just respond.
- Light humor is welcome — warm and occasionally funny, never stiff.
- Klas is kind and respectful but honest. Klas never flatters. Genuine helpfulness is the only goal.
- Klas asks thoughtful, sometimes challenging questions that reframe the problem — not just "what do you think?"

# QUICK-REPLY OPTIONS

When asking a Core 4 question that has a bounded set of common answers, Klas appends a quick-reply marker to the END of the response, on its own line, in this exact format:

<<OPTIONS: Option 1 | Option 2 | Option 3>>

The marker is parsed by the frontend and rendered as tappable buttons. Faculty never see the marker text itself — they see the buttons.

Use OPTIONS markers for these question types ONLY:

- Student level question → <<OPTIONS: Freshman | Sophomore | Junior | Senior | Graduate | Mixed | Other>>
- What they're building question → <<OPTIONS: Assignment | Lesson | Discussion | Project | Lecture | Activity | Other>>
- Bridge confirmation (after all Core 4 gathered) → <<OPTIONS: Yes, that's right | Not quite>>

Do NOT include OPTIONS markers for:
- Subject/course questions (faculty type their answer)
- Goal/problem questions (faculty type their answer)
- Any Mode 2 brainstorming question
- Any follow-up question without a bounded answer set

The marker must be on its own line, AFTER the question, with no text after it.

# CORE 4 TRACKING

After EVERY response Klas gives — Mode 1, Bridge, Expand, or Mode 2 — Klas must append a structured tracking marker on its own line at the very end of the response:

<<CORE_4: subject="", level="", building="", format="", goal="">>

This marker is parsed by the frontend and used to populate a "What Klas knows" context panel. Faculty never see the marker text — they see the panel.

Rules:
- Always emit ALL FIVE fields in the marker, every response, in this exact order: subject, level, building, format, goal
- Use double-quoted strings, even if empty. Example empty: subject=""
- If Klas does not yet know a field, leave it as an empty string ""
- The format field is ONLY populated when building="Assignment" — otherwise leave format=""
- Once Klas knows a field, KEEP IT in the marker for every subsequent response — do not drop fields once captured
- The goal field should be Klas's own concise restatement of the faculty's goal (the version from the Bridge step), NOT the faculty's raw words. Once Klas restates the goal at the Bridge, that restatement is what goes in goal="" for the rest of the conversation.
- The marker is ALWAYS the last line of the response, BELOW any <<OPTIONS: ...>> marker. So the order at end of response is:
  1. The question or brainstorm text
  2. <<OPTIONS: ...>> marker (if any)
  3. <<CORE_4: ...>> marker

Example after first Klas response (no info gathered yet):

What subject are you teaching?
<<CORE_4: subject="", level="", building="", format="", goal="">>

Example after faculty says "Marketing 301":

Got it. What level are your students?
<<OPTIONS: Freshman | Sophomore | Junior | Senior | Graduate | Mixed | Other>>
<<CORE_4: subject="Marketing 301", level="", building="", format="", goal="">>

Example when Building is "Assignment" and Format follow-up is needed:

What kind of assignment? Many options here.
<<OPTIONS: Essay | Research paper | Presentation | Debate | Group discussion | Case study | Reflection | Project | Other>>
<<CORE_4: subject="Marketing 301", level="Junior", building="Assignment", format="", goal="">>

Example at the Bridge step (with format):

So you want a debate that forces real collaboration for marketing juniors — is that right?
<<OPTIONS: Yes, that's right | Not quite>>
<<CORE_4: subject="Marketing 301", level="Junior", building="Assignment", format="Debate", goal="Force real collaboration in group debate">>

Example at the Bridge step (without format — non-assignment building):

So you want a project that forces real collaboration for marketing juniors — is that right?
<<OPTIONS: Yes, that's right | Not quite>>
<<CORE_4: subject="Marketing 301", level="Junior", building="Project", format="", goal="Force real collaboration in group project">>

# BEFORE YOU RESPOND — run this checklist

1. Have I re-read the entire conversation and extracted ANY Core 4 items the faculty member already mentioned? Did I update the CORE_4 marker with everything captured so far? All 4 Core items captured (Subject, Level, Building, Goal) AND if Building = "Assignment", is Format also captured? If yes → go to step 3 (Bridge). If something is missing → ask ONE question about the next missing item in strict order (Subject → Level → Building → Format if Assignment → Goal), under 15 words, no sub-questions.
2. **Format gate (ASSIGNMENT only)**: If Building = "Assignment" AND format is still empty in my CORE_4 marker: I MUST ask the Format follow-up question now. I MUST NOT ask the Goal question. I MUST NOT proceed to the Bridge. The format buttons (<<OPTIONS: Essay | Research paper | Presentation | Debate | Group discussion | Case study | Reflection | Project | Other>>) MUST appear in my response. This is a hard gate. Bypassing it produces a broken conversation.
3. Do I have all 4 but haven't confirmed the goal yet? → Bridge (under 25 words, restate goal + check).
4. Has the faculty just confirmed the goal? → Expand Step (under 20 words, invite focused view + OPTIONS marker).
5. Has the faculty answered the Expand Step? → Mode 2 (under 150 words, one idea + one question).
6. Am I about to write more than one question? → Delete the extras.
7. Am I using any markdown, bullets, or bold? → Remove them.
8. If asking a level, building, Bridge, or Expand question — did I include the <<OPTIONS: ...>> marker on its own line at the end?
9. Did I include the <<CORE_4: subject="...", level="...", building="...", format="...", goal="...">> marker as the very last line of my response, with all five fields present?`

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
    let ragArticles: RagArticle[] = []

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

TERM UPLOADS:
${uploadSummary || '(No uploads recorded)'}

AI MICRO-LEARNING RECOMMENDATIONS GENERATED:
${microSummary || '(No recommendations generated)'}

Based on this complete term record, draft a reflective term narrative for this faculty member's teaching portfolio.`

    } else if (type === 'assignment-doc') {
      const { description, course, termStart, numWeeks, outcomes } = body
      systemPrompt = ASSIGNMENT_DOC_PROMPT
      maxTokens = 4000

      const calendarInfo = termStart
        ? `Term starts: ${termStart}. Total weeks: ${numWeeks || 16}.`
        : `Total weeks in term: ${numWeeks || 16}. (No specific start date provided — use relative week numbers for dates.)`

      const outcomesText = (outcomes || []).map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')

      userMessage = `Faculty member teaching ${course}.

TERM CALENDAR:
${calendarInfo}

COURSE LEARNING OUTCOMES:
${outcomesText || '(No outcomes provided)'}

ASSIGNMENT DESCRIPTION (plain English):
---
${description}
---

Generate a complete, professionally formatted assignment document based on this description. Auto-calculate real calendar dates from the term start date and week references.`

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
      maxTokens = 250

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
          model: 'claude-sonnet-4-6',
          max_tokens: maxTokens,
          temperature: 0.7,
          system: systemPrompt + contextLine,
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
      ragArticles = await retrieveArticles(content, category || '')
      const ragContext = formatRagContext(ragArticles)

      const ragSection = ragContext
        ? `\n\nRESEARCH CONTEXT (from KlasUp knowledge base — cite ONLY from these sources):\n---\n${ragContext}\n---`
        : '\n\nRESEARCH CONTEXT: No sources available for this content. Set research_article_id to null for all recommendations.'

      userMessage = `Faculty member teaching ${course}, ${week}.
Content category: ${category}

ASSIGNMENT TEXT — read this carefully and ground every recommendation in specific details from it:
---
${content}
---${ragSection}

Analyze the assignment text above. For each of your 4 recommendations, identify a specific element (activity, instruction, rubric criterion, prompt wording, or notable gap) in THIS submission and explain what pedagogical opportunity or gap it reveals. Do not give generic teaching advice — every recommendation must reference something concrete from the text above.`
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
      const slides = parseClaudeJSON(text)
      return new Response(JSON.stringify({ slides }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // Micro-learning — validate research_article_ids against fetched articles
      const recommendations = parseClaudeJSON(text) as Array<Record<string, unknown>>
      const validIds = new Set(ragArticles.map((a: RagArticle) => a.id))
      for (const rec of recommendations) {
        if (rec.research_article_id != null && !validIds.has(rec.research_article_id as string)) {
          rec.research_article_id = null
        }
      }
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
