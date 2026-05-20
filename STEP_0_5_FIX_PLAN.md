# Step 0.5 Fix Plan

## Summary

Four tables exist with correct schema and RLS but have no working insert paths from the frontend: `uploads`, `micro_learnings`, `reflections`, and `klas_article_interactions`. Additionally, the wellness check-ins have a duplicate-insert bug, and `klas_other_responses` is referenced in code but the table was never created via migration. Fixing these 6 gaps means adding insert helper functions in `supabase.js`, calling them from `App.jsx` at the right moments, and adding a load-from-DB path so data survives page refresh.

## Gaps Found

---

### Gap 1: `uploads` — No Insert Path

- **Current state:** When a user submits content (typed or extracted from .docx/.pdf/.pptx/.txt), the text is added to React state via `setUploadLog()` at `App.jsx:2529`. No database write occurs. Data is lost on page refresh.
- **Frontend file(s) affected:**
  - `src/supabase.js` — needs new `insertUpload()` helper
  - `src/App.jsx` — `handleSubmit()` at line 2523 needs to call it
- **Proposed fix:**

  **Step A: Add helper to `supabase.js`:**
  ```javascript
  export async function insertUpload(userId, courseId, week, category, content) {
    const { data, error } = await supabase
      .from('uploads')
      .insert({
        user_id: userId,
        course_id: courseId,
        week: week,         // must be integer — see Risk below
        category: sanitize(category),
        content: sanitize(content),
      })
      .select()
      .single()
    if (error) throw error
    return data
  }
  ```

  **Step B: Add load helper to `supabase.js`:**
  ```javascript
  export async function fetchUploads(userId) {
    const { data, error } = await supabase
      .from('uploads')
      .select('*, courses!inner(course_code)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  ```

  **Step C: Call insert in `App.jsx` `handleSubmit()`:**
  After line 2529, before/after the `generateMicroLearning()` call:
  ```javascript
  // Resolve course_id from course_code
  const courseObj = dbCourses.find(c => c.course_code === course);
  const weekNum = parseInt(week.replace(/\D/g, ''), 10); // "Week 8" → 8

  const uploadRow = await insertUpload(
    session.user.id,
    courseObj.id,
    weekNum,
    myCourseCategory,
    text
  );
  // Then pass uploadRow.id to micro_learnings insert (Gap 2)
  ```

  **Step D: Load on mount** — add to the main `useEffect` that fires after session is established, then seed `uploadLog` state from DB rows.

- **Risk:**
  - **Week format mismatch.** The `week` state is a string like `"Week 8"` but the DB column is `integer NOT NULL`. Must parse the integer out. If the string format ever changes (e.g., localization), the parse will break. Suggest a `parseWeek()` utility.
  - **`course_id` resolution.** The frontend tracks the selected course by `course_code` string, but `uploads.course_id` is a UUID FK. Must look up the `courses` row by `course_code` to get the UUID. This lookup needs the `dbCourses` array which is loaded on mount — should always be available by the time a user submits.
  - **Content size.** Uploads have no size limit in the schema. Large PDFs/PPTX files could produce huge text blobs. Consider adding a reasonable content length check (e.g., 100KB) in the helper, but this is an enhancement — not blocking for Step 0.5.
  - **Error handling.** If the insert fails (network, RLS, etc.), the upload should still work in-memory so the user doesn't lose their work. Wrap in try/catch; log error but don't block the UI flow.

---

### Gap 2: `micro_learnings` — No Insert Path

- **Current state:** After `generateMicroLearning()` returns 4 recommendations, they're stored in `setMicroHistory()` at `App.jsx:2541`. No database write. Lost on refresh.
- **Frontend file(s) affected:**
  - `src/supabase.js` — needs new `insertMicroLearnings()` helper
  - `src/App.jsx` — the `.then(recs => {...})` block at line 2535 needs to call it
- **Proposed fix:**

  **Step A: Add helper to `supabase.js`:**
  ```javascript
  export async function insertMicroLearnings(userId, uploadId, recs) {
    const rows = recs.map(r => ({
      user_id: userId,
      upload_id: uploadId,
      tag: r.tag,
      title: r.title,
      summary: r.summary || null,
      article: r.article || null,
      action: r.action || null,
    }))
    const { data, error } = await supabase
      .from('micro_learnings')
      .insert(rows)
      .select()
    if (error) throw error
    return data
  }
  ```

  **Step B: Add load helper to `supabase.js`:**
  ```javascript
  export async function fetchMicroLearnings(userId) {
    const { data, error } = await supabase
      .from('micro_learnings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  ```

  **Step C: Call insert in `App.jsx` `.then()` handler:**
  ```javascript
  .then(recs => {
    setAiMicro(recs);
    // ... existing state updates ...

    // Persist to DB (uploadRow from Gap 1 insert)
    if (uploadRow?.id) {
      insertMicroLearnings(session.user.id, uploadRow.id, recs)
        .catch(err => console.error("Failed to persist micro-learnings:", err));
    }
  })
  ```

  **Step D: Load on mount** — fetch from DB and reconstruct `microHistory` state shape.

- **Risk:**
  - **Depends on Gap 1.** `micro_learnings.upload_id` is a required FK to `uploads.id`. Must insert the upload first and use its returned ID. These two inserts need to be sequential: insert upload → get ID → insert micro_learnings with that ID.
  - **AI response format.** If Claude returns malformed JSON (missing `title`, etc.), the insert will fail because `title` is NOT NULL. Should validate the `recs` array before inserting. But this risk exists today (the UI would also break) — not new.
  - **Batch insert.** Inserting 4 rows at once via array is the right approach. Supabase handles this as a single request.

---

### Gap 3: `reflections` — No Insert Path

- **Current state:** When a user generates a semester reflection at `App.jsx:3636`, the AI response is stored in `setReflectionText()`. The user can edit it in a textarea at line 3668. None of this is saved to the `reflections` table. Lost on refresh.
- **Frontend file(s) affected:**
  - `src/supabase.js` — needs new `upsertReflection()` helper
  - `src/App.jsx` — needs save calls after generation and after editing
- **Proposed fix:**

  **Step A: Add helpers to `supabase.js`:**
  ```javascript
  export async function upsertReflection(userId, courseId, semesterCode, content, editedContent = null) {
    // Upsert by user + course + semester (one reflection per course per semester)
    const { data, error } = await supabase
      .from('reflections')
      .upsert({
        user_id: userId,
        course_id: courseId,
        semester_code: sanitize(semesterCode),
        content: sanitize(content),
        edited_content: editedContent ? sanitize(editedContent) : null,
      }, { onConflict: 'user_id,course_id,semester_code' })
      .select()
      .single()
    if (error) throw error
    return data
  }

  export async function fetchReflection(userId, courseId, semesterCode) {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('semester_code', semesterCode)
      .maybeSingle()
    if (error) throw error
    return data
  }
  ```

  **Step B: Save after AI generation** — at line 3636:
  ```javascript
  .then(text => {
    setReflectionText(text);
    setReflectionLoading(false);
    // Persist AI-generated reflection
    const courseObj = dbCourses.find(c => c.course_code === portfolioCourse);
    if (courseObj) {
      upsertReflection(session.user.id, courseObj.id, courseObj.semester_code, text)
        .catch(err => console.error("Failed to save reflection:", err));
    }
  })
  ```

  **Step C: Save after user edits** — add a save trigger when the user modifies `reflectionText` in the textarea (line 3668). Could be on blur, on a "Save" button, or debounced. The `edited_content` column stores the user's version while `content` preserves the original AI output.

  **Step D: Load on mount** — when user navigates to Portfolio page, fetch existing reflection for the selected course/semester.

- **Risk:**
  - **No unique constraint exists.** The `reflections` table has no unique constraint on `(user_id, course_id, semester_code)`. The upsert approach above needs this constraint to work. Options: (a) add a unique constraint via migration, or (b) use select-then-insert/update logic instead of upsert. Option (b) avoids a migration.
  - **Course ID resolution.** Same as Gap 1 — must resolve `course_code` to `course_id`.
  - **Edited vs. original.** Need to decide when to write `edited_content` vs `content`. Cleanest: `content` = AI-generated (written once), `edited_content` = user-modified (updated on each save). The user edits in place on the textarea, so we need to track whether the text has been modified from the original.

---

### Gap 4: `klas_article_interactions` — No Insert Path

- **Current state:** The table was created in migration 012 to track how users interact with research articles surfaced by Klas (shown, clicked, saved, shared). The schema exists with proper columns and RLS, but **no code anywhere in the frontend inserts into this table**.
- **Frontend file(s) affected:**
  - `src/supabase.js` — needs new `trackArticleInteraction()` helper
  - `src/App.jsx` — needs to call it from wherever research articles are displayed or clicked
- **Proposed fix:**

  **Step A: Add helper to `supabase.js`:**
  ```javascript
  export async function trackArticleInteraction(userId, articleId, interactionType, conversationId = null, dimension = null) {
    const { error } = await supabase
      .from('klas_article_interactions')
      .insert({
        user_id: userId,
        article_id: articleId,
        interaction_type: interactionType,  // 'shown', 'clicked', 'saved', 'shared'
        conversation_id: conversationId,
        dimension: dimension,
      })
    if (error) throw error
  }
  ```

  **Step B: Instrument App.jsx** — find where research articles are rendered in the Klas chat or Research Library and add tracking calls. This requires identifying the exact UI touchpoints (article cards, links, save buttons).

- **Risk:**
  - **Lower priority than Gaps 1-3.** This is analytics/engagement data, not core content. The scoring system doesn't depend on it immediately.
  - **Article IDs.** The frontend needs to know the `research_articles.id` UUID to log interactions. Currently, the RAG search returns article data but may not include the UUID in every context. Need to verify the RAG response shape includes `id`.
  - **Volume.** "shown" events could generate many rows if every article render triggers an insert. Consider batching or debouncing.

---

### Gap 5: `klas_other_responses` — Table Doesn't Exist

- **Current state:** `supabase.js` has a full `upsertKlasOtherResponse()` function (lines 434-458) and `getPromotedKlasOptions()` (lines 460-468). `App.jsx` calls `upsertKlasOtherResponse()` at line 1558. But **no migration creates this table**. Every call to this function will fail with a Supabase "relation does not exist" error at runtime.
- **Frontend file(s) affected:**
  - `supabase/migrations/` — needs a new migration to create the table
  - No frontend changes needed (the code is already written)
- **Proposed fix:**

  **New migration** (e.g., `014_klas_other_responses.sql`):
  ```sql
  create table if not exists klas_other_responses (
    id uuid primary key default gen_random_uuid(),
    question_type text not null,
    response_text text not null,
    count integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Prevent duplicate entries for same question_type + response_text
  create unique index if not exists idx_klas_other_responses_unique
    on klas_other_responses (question_type, response_text);

  create index if not exists idx_klas_other_responses_promoted
    on klas_other_responses (question_type, count desc);

  alter table klas_other_responses enable row level security;

  -- Anyone can read promoted options
  create policy "Anyone can read klas_other_responses"
    on klas_other_responses for select using (true);

  -- Any authenticated user can insert
  create policy "Authenticated users can insert klas_other_responses"
    on klas_other_responses for insert with check (auth.uid() is not null);

  -- Any authenticated user can update (for count increment)
  create policy "Authenticated users can update klas_other_responses"
    on klas_other_responses for update using (auth.uid() is not null);
  ```

- **Risk:**
  - **Schema inference.** The table schema above is inferred from the supabase.js code (which references `id`, `count`, `question_type`, `response_text`, `updated_at`). If the original developer intended a different schema, this could mismatch. But the inference is straightforward.
  - **No user_id.** The existing code doesn't associate responses with users — it's anonymous aggregation. This is intentional (it tracks what "Other" options people type so popular ones can be promoted to first-class options).
  - **Silent failures today.** Every time a user types an "Other" response in Klas, the upsert silently fails (the `.catch()` at line 1558 swallows the error). No user-visible impact currently, but data is being lost.

---

### Gap 6: `wellness_checkins` — Duplicate Insert Bug

- **Current state:** The table exists and inserts/updates work correctly on the first check-in and on page-refresh-then-recheck. However, there's a bug in the "Update" button flow.
- **The bug (App.jsx line 2258):**
  ```javascript
  // "Update" button clears client state but NOT the DB awareness
  onClick={() => { setWellnessMsg(null); setWellnessScore(null); setWellnessTodayCheckin(null); }}
  ```
  When the user clicks "Update" to change their check-in:
  1. `setWellnessTodayCheckin(null)` clears the reference to today's existing DB row
  2. User taps a new emoji → `handleWellnessCheckin(score)` fires
  3. `wellnessTodayCheckin` is null (just cleared), so line 1301 runs: `insertWellnessCheckin()` — creates a **new row** instead of updating the existing one
  4. Result: **two rows for the same day** in the database
  5. `fetchTodayCheckin()` only returns the most recent (`.limit(1)`), masking the duplicate

- **Frontend file(s) affected:**
  - `src/App.jsx` — the "Update" button onClick at line 2258
- **Proposed fix:**

  **Option A (minimal):** Don't clear `wellnessTodayCheckin` when the user clicks "Update":
  ```javascript
  onClick={() => { setWellnessMsg(null); setWellnessScore(null); }}
  // Keep wellnessTodayCheckin so the next submission triggers UPDATE, not INSERT
  ```

  **Option B (defensive):** Reload today's check-in before re-rendering the emoji picker:
  ```javascript
  onClick={async () => {
    setWellnessMsg(null);
    setWellnessScore(null);
    // Re-fetch to ensure we have the latest row for update
    const today = await fetchTodayCheckin(session.user.id);
    setWellnessTodayCheckin(today);
  }}
  ```

  Option A is simpler and sufficient. The key insight: the "Update" button should show the emoji picker again without forgetting that a row already exists.

- **Risk:**
  - **Existing duplicates.** Users who have clicked "Update" before may already have duplicate rows. These are harmless (the query always takes the latest) but could skew analytics if anyone ever counts rows. Consider a one-time cleanup query, but not blocking.
  - **No schema change needed.** This is purely a frontend state management bug.

---

## Wellness Check-ins Special Case

The wellness_checkins table **does not need schema fixes** for Step 0.5. The schema is correct for its current purpose (per-user daily score tracking). What the audit report flagged as "broken" are actually **missing features** that belong to later steps:

- **No `course_id` column** — needed for per-course wellness signals in the new scoring model. This is Step 1 work (new schema design), not Step 0.5.
- **No delete RLS policy** — intentional for data integrity. Users can update their score but not erase that they checked in. Leave as-is.
- **`note` field unused** — the schema supports it, the helpers accept it, but the UI never passes it. This is a feature gap, not a persistence bug. Leave for later.
- **No student wellness** — the "Your Students" tab shows canned content. New feature territory — not Step 0.5.

**The only Step 0.5 fix is the duplicate-insert bug (Gap 6).**

---

## Order of Implementation

| Order | Gap | Table | Rationale |
|-------|-----|-------|-----------|
| 1 | Gap 6 | `wellness_checkins` | **Safest.** One-line fix. No new functions needed. Fixes an active bug with zero risk of regression. |
| 2 | Gap 5 | `klas_other_responses` | **Easy win.** Add a migration. Frontend code already exists and works — just needs the table to exist. No App.jsx changes. |
| 3 | Gap 1 | `uploads` | **Foundation.** Everything else depends on uploads being persisted. Requires new helper + App.jsx changes + week format parsing + load-on-mount. |
| 4 | Gap 2 | `micro_learnings` | **Depends on Gap 1.** Requires `upload_id` from the insert in Gap 1. Do these back-to-back since they share the same `handleSubmit()` code path. |
| 5 | Gap 3 | `reflections` | **Depends on Gaps 1+2.** Reflections are generated from `uploadLog` and `microHistory`. Once those are persisted and loaded from DB, the reflection input data will survive refresh. Then add persistence for the reflection output itself. May need a unique constraint migration. |
| 6 | Gap 4 | `klas_article_interactions` | **Lowest priority.** Analytics/engagement tracking. Not blocking for scoring. Requires finding UI touchpoints and wiring up tracking calls. |

**Recommended approach:** Fix Gaps 1+2 together as a single PR (they share the same code path). Gap 6 and Gap 5 can each be their own tiny PR. Gap 3 is a separate PR. Gap 4 can wait.

---

## Out of Scope (Explicitly Not Doing)

These items were considered but are **not part of Step 0.5**:

| Item | Why deferred |
|------|-------------|
| New scoring tables (`course_scores`, `score_snapshots`) | Step 1 — new infrastructure, not fixing existing tables |
| AI analysis restructuring (structured dimensional output) | Step 1 — new edge function work |
| `wellness_checkins` schema changes (adding `course_id`, categories) | Step 1 — schema design for new scoring model |
| Career Connections dynamic generation | Step 2+ — new AI feature |
| Assignment Builder real AI feedback | Step 2+ — replacing heuristic with AI |
| Slide Studio UDL analysis | Step 2+ — new AI feature |
| Replacing hardcoded dashboard scores with real ones | Step 1+ — requires scoring engine |
| Mapping micro-learning tags to 4-dimension model | Step 1 — scoring model design |
| `note` field UI for wellness check-ins | Feature addition, not persistence fix |
| Student wellness data collection | New feature, not persistence fix |
| `research_articles` vector embeddings | RAG infrastructure — separate initiative |
| `announcements` table — no user-facing insert path needed | Admin-only table; working correctly |
| `events` and `security_log` — already working | No gaps found |
| Refactoring App.jsx into smaller components | Code quality work, not persistence |
| Adding loading spinners or rehydration UX | UX improvement, not persistence |
