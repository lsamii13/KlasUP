-- ============================================================
-- 025: Generated syllabi — stores structured syllabus output
-- for the Generate Syllabus feature (Phase 1 persistence,
-- Phase 2 in-app editing).
-- ============================================================

create table if not exists generated_syllabi (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  sections      jsonb not null default '[]',
  inputs_snapshot jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- Index for fast lookups by course (most recent first)
create index if not exists idx_generated_syllabi_course
  on generated_syllabi (course_id, created_at desc);

-- RLS: users can only access their own generated syllabi
alter table generated_syllabi enable row level security;

create policy "Users can insert their own syllabi"
  on generated_syllabi for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own syllabi"
  on generated_syllabi for select
  using (auth.uid() = user_id);

create policy "Users can delete their own syllabi"
  on generated_syllabi for delete
  using (auth.uid() = user_id);
