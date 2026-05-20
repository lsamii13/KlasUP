# KlasUp Backend Audit — AI Analysis Pipeline & Scoring Readiness

**Date:** 2026-05-18
**Purpose:** Step 0 — Read-only audit of current state before implementing evidence-based health scores
**Auditor:** Claude Code

---

## 1. AI ANALYSIS CURRENTLY RUNNING

### 1A. Assignment Builder (generate-micro-learning edge function)

**File:** `supabase/functions/generate-micro-learning/index.ts`

This single edge function handles **7 distinct AI operations** based on a `type` parameter, all using **Claude Sonnet** (`claude-sonnet-4-20250514`) via the Anthropic Messages API.

#### Operation: `micro-learning` (default)

- **Input:** `content` (plain text from upload), `category` (Announcement, Assignment, Discussion Prompt, Learning Outcome, Post-Class Notes, Student Voice), `course`, `week`
- **Analysis:** Fetches up to 5 RAG articles via keyword search, then asks Claude to analyze the content and generate 4 micro-learning recommendations grounded in research
- **Output:** JSON array of 4 objects, each with: `tag`, `title`, `summary`, `article` (APA citation), `action`
- **Stored:** Frontend stores in React state (`setMicroHistory`). The `micro_learnings` table exists but **no insert call exists in the frontend code** — only delete calls in `adminResetTestUser()`. This means micro-learning recommendations are **ephemeral by default**.

**System prompt excerpt:**
```
You are KlasUp's Micro-Learning Engine — an AI pedagogical advisor for higher-education faculty.
When a faculty member submits course content... analyze it and generate exactly 4 personalized
micro-learning recommendations.
```

Tags are constrained to: Active Learning, Socratic Seminar, UDL, Reflection, Flipped Classroom, Student Voice, Assessment Design, Scaffolding, Metacognition, Inclusive Pedagogy, Trauma-Informed Teaching (11 values).

#### Operation: `reflection`

- **Input:** `course`, `uploadLog` (all uploads for course), `microHistory` (all recommendations)
- **Analysis:** Synthesizes a semester narrative reflection (600-900 words)
- **Output:** Plain text in first person
- **Stored:** `reflections` table has `content` and `edited_content` columns; frontend stores via Supabase

#### Operation: `assignment-doc`

- **Input:** `description`, `course`, `semesterStart`, `numWeeks`, `outcomes`
- **Analysis:** Generates a complete assignment document with rubric, timeline, learning objectives
- **Output:** Plain text document
- **Stored:** **Not persisted.** Returned to frontend for display/export only.

#### Operation: `assignment-doc-update`

- **Input:** Existing document + plain English change instruction
- **Output:** Updated document
- **Stored:** **Not persisted.**

#### Operation: `ppt-plan` (Slide Studio)

- **Input:** `description`, `course`, `week`
- **Analysis:** Generates slide-by-slide outline with talking points, visuals, timing, speaker notes
- **Output:** JSON array of slide objects
- **Stored:** **Not persisted.** Frontend holds in state only.

#### Operation: `ppt-plan-update`

- Same pattern as assignment-doc-update but for slide decks

#### Operation: `sage-chat` (Klas AI Brainstorming Assistant)

- **Input:** `messages` (conversation history), `currentPage`, `courseName`
- **Analysis:** 340+ line system prompt defining "Klas" — a structured brainstorming partner with Context Gathering and Brainstorming modes, CORE_4 tracking (subject, level, building/format, goal), embedded markers for frontend parsing (`<<CORE_4:...>>`, `<<OPTIONS:...>>`)
- **Output:** Conversational response (max 250 tokens) with structured markers
- **Stored:** Full conversations saved to `klas_conversations` table with `core_4_context` (jsonb), `messages` (jsonb), `dimensions_touched`, `current_mode`, `actions_taken`

### 1B. Slide Studio

Slide Studio calls the `ppt-plan` operation described above. The frontend mentions "UDL scoring" in the UI description text but **no UDL analysis code exists** — this appears to be aspirational copy.

### 1C. File Upload Processing

**File:** `src/App.jsx` — `extractFileText()` function

Supported formats: `.txt`, `.docx` (via mammoth), `.pdf` (regex-based binary extraction), `.pptx` (ZIP XML parsing for `<a:t>` tags).

**No AI analysis happens at upload time.** Files are:
1. Text-extracted client-side
2. Displayed in a textarea for the user
3. Only analyzed when the user clicks "Submit" — which triggers `generateMicroLearning()`

**The uploaded files themselves are never stored** — only the extracted text content enters the system.

### 1D. RAG Search (rag-search edge function)

**File:** `supabase/functions/rag-search/index.ts`

Three operations:
- **SEARCH:** Keyword-only full-text search against `research_articles`
- **CONTEXT:** Builds a short keyword query from content, returns formatted article citations for use as RAG context in the micro-learning prompt
- **EMBED:** Placeholder for vector embeddings (Voyage AI or Claude fallback). Currently non-functional for actual similarity search.

### 1E. Research Crawler (research-crawler edge function)

**File:** `supabase/functions/research-crawler/index.ts`

Crawls ERIC API and PubMed API, maps to 28 pedagogical dimensions, deduplicates by title, inserts into `research_articles` with `search_terms` arrays. No embeddings generated.

### Summary: Data Flow

```
User types/uploads → extractFileText() → text in textarea
  → User clicks Submit → generateMicroLearning() → Edge Function
    → RAG context fetched (keyword search, 5 articles)
    → Claude Sonnet analyzes content + RAG context
    → Returns 4 micro-learning recommendations (JSON)
  → Frontend stores in React state (uploadLog, microHistory)
  → NO automatic database persistence of uploads or micro-learnings
```

---

## 2. DATA STORAGE

### Complete Table Inventory (16 tables + 2 views)

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | FK → auth.users(id) |
| name | text | not null |
| email | text | not null, unique |
| institution | text | |
| role | text | 'free', 'pro', 'institutional', 'admin' |
| subscription_expires_at | timestamptz | |
| trial_started_at | timestamptz | |
| test_user | boolean | |
| job_title | text | |
| lms | text | |
| photo_url | text | |
| last_active_at | timestamptz | |
| education_level | text | |
| bio | text | |
| onboarding_complete | boolean | |
| stripe_customer_id | text | unique |
| tos_accepted_at, tos_version, deletion_requested_at | | Compliance fields |
| created_at | timestamptz | |

#### `courses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → profiles(id) |
| course_code | text | not null |
| course_name | text | not null |
| section | text | |
| semester_code | text | not null |
| semester_start | date | |
| num_weeks | integer | |
| created_at | timestamptz | |

#### `uploads`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → profiles(id) |
| course_id | uuid | FK → courses(id) |
| week | integer | not null |
| category | text | not null |
| content | text | not null (the extracted text) |
| created_at | timestamptz | |

#### `micro_learnings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → profiles(id) |
| upload_id | uuid | FK → uploads(id) |
| tag | text | Pedagogical category |
| title | text | not null |
| summary | text | |
| article | text | APA citation |
| action | text | Actionable recommendation |
| rating | integer | User rating (1-5?) |
| created_at | timestamptz | |

#### `reflections`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → profiles(id) |
| course_id | uuid | FK → courses(id) |
| semester_code | text | not null |
| content | text | AI-generated reflection |
| edited_content | text | Faculty-edited version |
| created_at | timestamptz | |

#### `wellness_checkins`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → profiles(id) |
| check_in_score | integer | 1-5 scale |
| note | text | Optional |
| created_at | timestamptz | |

#### `research_articles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| title, authors, year, journal, abstract, content | text/int | Article metadata |
| dimension | text | 33 pedagogical dimensions (CHECK constraint) |
| embedding | vector(1536) | Nullable — not yet populated |
| search_terms | text[] | For keyword matching |
| source_type | text | peer_reviewed, ctl_resource, ted_talk, etc. |
| url | text | |
| fts | tsvector | Generated full-text search index |

#### `klas_conversations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → auth.users(id) |
| title | text | |
| core_4_context | jsonb | Structured brainstorm context |
| messages | jsonb | Full conversation history |
| current_mode | text | 'gathering', 'confirming', 'brainstorming' |
| dimensions_touched | text[] | Teaching dimensions identified |
| reached_mode_2 | boolean | |
| actions_taken | text[] | AI-suggested actions |
| message_count | integer | |
| archived | boolean | |
| created_at, updated_at | timestamptz | |

#### `klas_article_interactions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | FK → auth.users(id) |
| conversation_id | uuid | FK → klas_conversations(id) |
| article_id | uuid | FK → research_articles(id) |
| interaction_type | text | 'shown', 'clicked', 'saved', 'shared' |
| dimension | text | |

#### Other tables
- **`events`** — Analytics funnel (signup, first_upload, first_micro_learning, etc.)
- **`security_log`** — Auth events with metadata
- **`beta_agreements`** — Signed beta agreements
- **`announcements`** / **`announcement_dismissals`** — Admin announcements
- **`klas_other_responses`** — Referenced in `supabase.js` but **no migration file exists** — may be created outside migrations or may error at runtime

#### Views
- **`admin_usage_stats`** — Aggregate counts
- **`admin_funnel`** — Funnel metrics

### Key Finding: Is Structured AI Analysis Stored?

**Partially.** The tables exist (`uploads`, `micro_learnings`) but the frontend code **does not write to them**. The only database writes from `App.jsx` are:
- `klas_conversations` — full Klas brainstorm sessions with structured context
- `klas_article_interactions` — article engagement tracking
- `wellness_checkins` — wellness scores
- `reflections` — semester reflections

Uploads and micro-learnings are held in React state (`useState`) and **lost on page refresh**. The `adminResetTestUser()` function deletes from these tables, implying they were populated at some point, but no current insert path exists in the frontend.

---

## 3. COURSE DATA

### Are uploads tagged to courses?

**Yes, in React state.** Each upload object includes `{ content, category, course, week, timestamp }` where `course` is the `course_code`. The `uploads` database table has a `course_id` FK.

### Is there a courses table?

**Yes.** Per-faculty — each course belongs to one `user_id`. Columns: `course_code`, `course_name`, `section`, `semester_code`, `semester_start`, `num_weeks`.

### Can we distinguish materials between courses?

**In theory, yes** — the `uploads` table has `course_id` and the UI auto-tags by selected course. **In practice, no** — because uploads aren't being written to the database (see Section 2).

### Course-level data available for scoring:

If uploads were persisted, we could query by course_id and get:
- Upload count by category and week
- Content text for AI analysis
- Linked micro-learnings
- Reflections (these ARE persisted with course_id)

---

## 4. EXISTING DASHBOARD SCORES

### Up Score — HARDCODED

```javascript
// src/App.jsx:2292
<ScoreRing score={83} size={mob ? 70 : 90} color={C.tealBright} />
```

The Up Score is a **static value of 83** with a hardcoded "+31 pts this semester" tag. The sub-metrics (Uploads: 23, Weeks Active: 8, Dimensions Tracked: 10/3, Courses: dynamic) are also hardcoded except course count.

### Course Health Scores — HARDCODED

```javascript
// src/App.jsx:2314-2315
const demoScores = [83, 71, 67, 75, 60];
const demoTrends = ["+11", "+6", "+3", "+8", "+2"];
```

Each course card cycles through these demo values. No calculation from real data.

### Health Dimensions — HARDCODED

```javascript
// src/App.jsx:135-146
const DIMENSIONS = [
  { label: "Active Learning", score: 76, note: "Good variety; case studies underused", tier: "pro", ... },
  { label: "Announcements & Presence", score: 79, note: "Good frequency, tone could be warmer", ... },
  { label: "Assignments & Feedback Quality", score: 72, note: "Missing milestone checkpoints", ... },
  // ... 7 more, all hardcoded scores
];
```

10 dimensions with static scores and notes. No data pipeline feeds these.

### Weekly Snapshot (Week-over-Week chart) — HARDCODED

```javascript
// src/App.jsx:234
const healthData = [52, 58, 55, 63, 70, 74, 79, 83];
```

Static array of 8 weekly scores. No calculation.

### Semester-over-Semester — HARDCODED

```javascript
// src/App.jsx:235
const semData = [{ l: "F'23", s: 61 }, { l: "Sp'24", s: 68 }, { l: "F'24", s: 74 }, { l: "Sp'25", s: 83 }];
```

### Career Connections — HARDCODED

```javascript
// src/App.jsx:79-127
const CAREER_DATA = {
  "MKT 301": { topic: "Consumer Behavior & AI-Driven Personalization", ... },
  "MKT 410": { topic: "Digital Strategy & Content Marketing", ... },
  "BUS 201": { topic: "Organizational Behavior & Decision-Making", ... },
};
```

Three hardcoded course-career mappings with fake job growth percentages, intelligence blurbs, and share card content. Only matches courses named MKT 301, MKT 410, or BUS 201. Falls back to MKT 301 for any other course.

### Assignment Builder "AI Feedback" — HEURISTIC, NOT AI

```javascript
// src/App.jsx:1358-1371
const genFeedback = () => {
  blooms: assignText.length > 80 ? "Analyze / Evaluate" : "Remember / Understand",
  scaffold: milestones.length >= 2 ? 82 : 44,
  outcomes: selectedOutcomes.length,
  clarity: assignText.length > 60 ? 78 : 51,
};
```

Bloom's level is determined by text length (>80 chars = higher). Scaffolding score is binary (82 if 2+ milestones, else 44). Clarity is binary (78 if >60 chars, else 51). **None of this is AI-generated.**

---

## 5. WELLNESS CHECK-INS

### Current Schema

```sql
-- supabase/migrations/007_wellness.sql
create table wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  check_in_score integer not null check (check_in_score between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);
```

### What's Working

- RLS is enabled and correct (users can read/insert/update own checkins)
- Index exists on `(user_id, created_at desc)` for efficient time-series queries
- Frontend correctly inserts and updates check-ins
- Burnout detection exists: flags if 3 consecutive check-ins score <= 2
- Weekly averaging displayed in a 4-week chart

### What's Broken or Missing

1. **No course association.** Wellness check-ins are per-user, not per-course. The new spec likely needs per-course wellness signals. There's no `course_id` column.

2. **No delete policy.** Users can read, insert, and update, but cannot delete their own check-ins. This may be intentional (data integrity) or an oversight.

3. **No wellness category/type.** The schema stores a single score (1-5). The spec's Wellness Integration dimension likely needs richer signals — stress triggers, workload context, support resources used.

4. **No student wellness data.** The UI has a "Your Students" tab on the wellness page, but there's no student-facing data collection. The tab appears to show canned content only.

5. **`klas_other_responses` table** is referenced in `supabase.js` (lines 434-468) but **has no migration file**. It may exist from a manual creation or may throw runtime errors. This table tracks free-text "Other" responses in Klas option prompts and promotes popular ones to first-class options.

6. **Limited temporal granularity.** Only `created_at` timestamp — no concept of "which week of semester" to correlate with course activity.

---

## 6. GAPS REPORT

### Gap 1: Uploads and Micro-Learnings Are Not Persisted

**Current:** Uploads and AI recommendations live in React `useState` only. Lost on page refresh.
**Needed:** Persistent storage is the foundation for ALL scoring. Without historical upload data and AI analysis results, no score can be calculated.
**Fix:** Add database insert calls for `uploads` and `micro_learnings` tables (which already exist with the right schema).
**Risk: CRITICAL** — This is the single biggest blocker. Everything else depends on having historical data.

### Gap 2: No Structured AI Analysis Output for Scoring

**Current:** The micro-learning prompt returns 4 recommendations with tags from a fixed set of 11 pedagogical categories. There is no structured rubric evaluation, no dimensional scoring, no evidence extraction.
**Needed:** Per the new spec, AI analysis should produce structured scores across 4 dimensions (Course Design, Inclusive Teaching, Assessment, Wellness Integration) with specific evidence and sub-indicator values.
**Fix:** New AI analysis pipeline — either a new edge function or a major refactor of the micro-learning prompt to produce scoreable output alongside recommendations.

### Gap 3: No Score Calculation Engine

**Current:** All scores are hardcoded constants in the frontend.
**Needed:** A scoring engine that:
- Aggregates upload analysis results per course per dimension
- Weights sub-indicators appropriately
- Produces Up Score (Course Design + Inclusive Teaching + Assessment) and Wellness Core
- Tracks scores over time (weekly, semester)
**Fix:** New backend logic — could be an edge function, a database function, or client-side calculation from stored data.

### Gap 4: Career Connections Are Static

**Current:** Three hardcoded course-career mappings (MKT 301, MKT 410, BUS 201). Any other course falls back to MKT 301 data.
**Needed:** Dynamic career connections based on actual course content and learning outcomes.
**Fix:** New AI analysis that maps course content to career pathways. Requires either a new edge function or integration with labor market APIs.

### Gap 5: Assignment Builder Feedback Is Fake

**Current:** Bloom's level, scaffolding, outcomes alignment, and clarity scores are computed from string length and checkbox counts — not AI analysis.
**Needed:** Real AI-powered analysis of assignment quality, aligned to the Assessment dimension.
**Fix:** Replace heuristic `genFeedback()` with actual AI analysis call. This data should also feed back into the course score.

### Gap 6: Wellness Check-ins Lack Course Context

**Current:** `wellness_checkins` has `user_id`, `check_in_score` (1-5), `note`, `created_at`. No course association, no semester/week tagging, no category.
**Needed:** Course-level wellness signals that feed the Wellness Integration dimension. Richer metadata (stress triggers, workload indicators, support needs).
**Fix:** Either add `course_id` to `wellness_checkins` or create a new table for course-specific wellness signals.

### Gap 7: No Scoring History Tables

**Current:** No tables exist to store calculated scores over time.
**Needed:** Tables to store:
- Per-course, per-dimension, per-week scores
- Composite Up Score and Wellness Core per course per time period
- Score deltas and trends
**Fix:** New migration with scoring tables. Suggested schema:
- `course_scores` (course_id, dimension, sub_indicator, score, evidence_json, week, semester, created_at)
- `score_snapshots` (course_id, up_score, wellness_core, week, semester, created_at)

### Gap 8: Slide Studio UDL Analysis Doesn't Exist

**Current:** The UI claims "get UDL scoring" but no UDL analysis code exists for slide decks.
**Needed:** AI analysis of slide deck content against UDL principles, feeding the Inclusive Teaching dimension.
**Fix:** Add UDL analysis to the ppt-plan response or as a separate analysis pass.

### Gap 9: No Cross-Upload Trend Analysis

**Current:** Each upload is analyzed in isolation. The only cross-upload analysis is the semester reflection (which is a narrative, not structured data).
**Needed:** Week-over-week and semester-level trend analysis showing how teaching practice evolves.
**Fix:** Scoring engine needs to query historical uploads and scores to compute trends. The weekly snapshot chart needs real data.

### Gap 10: Micro-Learning Tags Don't Map to New Dimensions

**Current:** 11 micro-learning tags: Active Learning, Socratic Seminar, UDL, Reflection, Flipped Classroom, Student Voice, Assessment Design, Scaffolding, Metacognition, Inclusive Pedagogy, Trauma-Informed Teaching.
**Needed:** 4 scoring dimensions: Course Design, Inclusive Teaching, Assessment, Wellness Integration.
**Fix:** Need a mapping layer from existing tags (and new analysis output) to the 4-dimension scoring model. Some tags map clearly (UDL → Inclusive Teaching, Assessment Design → Assessment), others need splitting or new analysis.

### Gap 11: `klas_other_responses` Table Missing From Migrations

**Current:** Referenced in `supabase.js` but no migration creates it. May cause runtime errors.
**Fix:** Add migration or verify it was created manually.

---

## Appendix: File Reference

| File | Purpose |
|------|---------|
| `supabase/functions/generate-micro-learning/index.ts` | All AI analysis (7 operations) |
| `supabase/functions/rag-search/index.ts` | RAG keyword search + embedding placeholder |
| `supabase/functions/research-crawler/index.ts` | ERIC/PubMed article crawler |
| `src/App.jsx` | Entire frontend (5500+ lines, single file) |
| `src/anthropic.js` | Edge function client wrapper |
| `src/supabase.js` | Supabase client + all DB helper functions |
| `supabase/migrations/001_initial_schema.sql` | profiles, courses, uploads, micro_learnings, reflections, events, security_log |
| `supabase/migrations/007_wellness.sql` | wellness_checkins table |
| `supabase/migrations/012_klas_conversations_and_article_interactions.sql` | klas_conversations, klas_article_interactions |
| `supabase/migrations/013_expand_dimensions_check.sql` | Expanded research_articles dimensions to 33 |
