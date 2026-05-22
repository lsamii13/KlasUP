-- KlasUp: Klas "Other" Response Tracking
-- Stores crowd-sourced "Other" responses from Klas's structured questions.
-- When a response is submitted multiple times (count >= 10), it gets
-- promoted into the standard option set for that question type.

-- ============================================================
-- TABLE: klas_other_responses
-- ============================================================
create table klas_other_responses (
  id              uuid        primary key default gen_random_uuid(),
  question_type   text        not null,
  response_text   text        not null,
  count           integer     not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One row per unique response per question type (powers upsert logic)
create unique index idx_klas_other_responses_unique
  on klas_other_responses (question_type, response_text);

-- Fast lookup for promoted options (count >= 10)
create index idx_klas_other_responses_promoted
  on klas_other_responses (question_type, count desc);

-- Auto-update updated_at on row modification
-- (set_updated_at function already exists from migration 012)
create trigger klas_other_responses_updated_at
  before update on klas_other_responses
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: anonymous aggregated data — any authenticated user can
-- read, insert, and update (no user_id column)
-- ============================================================
alter table klas_other_responses enable row level security;

create policy "Authenticated users can read all responses"
  on klas_other_responses for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert responses"
  on klas_other_responses for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update responses"
  on klas_other_responses for update
  using (auth.role() = 'authenticated');
