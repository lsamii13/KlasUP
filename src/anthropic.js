const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callEdgeFunction(body) {
  const url = `${SUPABASE_URL}/functions/v1/generate-micro-learning`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  }

  console.log('[KlasUp] Edge Function URL:', url)
  console.log('[KlasUp] Authorization header:', headers.Authorization ? `Bearer ${SUPABASE_ANON_KEY.slice(0, 10)}...` : 'MISSING')
  console.log('[KlasUp] VITE_SUPABASE_URL defined:', !!SUPABASE_URL)
  console.log('[KlasUp] VITE_SUPABASE_ANON_KEY defined:', !!SUPABASE_ANON_KEY)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `Edge Function error (${res.status})`)
  }

  return res.json()
}

export async function generateMicroLearning({ content, category, course, week }) {
  const data = await callEdgeFunction({ type: 'micro-learning', content, category, course, week })
  return data.recommendations
}

export async function generateSemesterReflection({ course, uploadLog, microHistory }) {
  const data = await callEdgeFunction({ type: 'reflection', course, uploadLog, microHistory })
  return data.reflection
}

export async function generateAssignmentDoc({ description, course, semesterStart, numWeeks, outcomes }) {
  const data = await callEdgeFunction({ type: 'assignment-doc', description, course, semesterStart, numWeeks, outcomes })
  return data.document
}

export async function updateAssignmentDoc({ currentDoc, instruction }) {
  const data = await callEdgeFunction({ type: 'assignment-doc-update', currentDoc, instruction })
  return data.document
}

export async function generatePptPlan({ description, course, week }) {
  const data = await callEdgeFunction({ type: 'ppt-plan', description, course, week })
  return data.slides
}

export async function updatePptPlan({ currentSlides, instruction }) {
  const data = await callEdgeFunction({ type: 'ppt-plan-update', currentSlides, instruction })
  return data.slides
}

export async function sendSageChat({ messages, currentPage, courseName }) {
  const data = await callEdgeFunction({ type: 'sage-chat', messages, currentPage, courseName })
  return data.reply
}

// ── RAG Knowledge Base ──────────────────────────────────────

async function callRagFunction(body) {
  const url = `${SUPABASE_URL}/functions/v1/rag-search`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `RAG Function error (${res.status})`)
  }
  return res.json()
}

export async function searchResearchArticles({ query, dimension, count = 5 }) {
  const data = await callRagFunction({ type: 'search', query, dimension, count })
  return data.articles
}

export async function embedAllArticles() {
  const data = await callRagFunction({ type: 'embed' })
  return data
}
