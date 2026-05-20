-- Course Architect Schema
-- Tables: learning_outcomes, course_weeks, assignments, lo_tags
-- Run this in your Supabase SQL Editor

-- 1. Learning Outcomes
create table learning_outcomes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  code text not null,
  label text not null,
  full_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_learning_outcomes_course_id on learning_outcomes(course_id);

-- 2. Course Weeks
create table course_weeks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  week_number integer not null,
  topic text,
  detail text,
  is_milestone boolean not null default false,
  weekly_outcomes text[],
  readings text[],
  lecture_topic text,
  activities text[],
  discussion_board text,
  wellness_note text,
  extra_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, week_number)
);

create index idx_course_weeks_course_id on course_weeks(course_id);

-- 3. Assignments
create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  week_id uuid references course_weeks(id) on delete set null,
  parent_assignment_id uuid references assignments(id) on delete set null,
  title text not null,
  assignment_type text not null,
  description text,
  due_date text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assignments_course_id on assignments(course_id);
create index idx_assignments_week_id on assignments(week_id);
create index idx_assignments_parent_id on assignments(parent_assignment_id);

-- 4. LO Tags (polymorphic join between learning_outcomes and weeks/assignments)
create table lo_tags (
  id uuid primary key default gen_random_uuid(),
  learning_outcome_id uuid not null references learning_outcomes(id) on delete cascade,
  taggable_type text not null check (taggable_type in ('week', 'assignment')),
  taggable_id uuid not null,
  created_at timestamptz not null default now(),
  unique (learning_outcome_id, taggable_type, taggable_id)
);

create index idx_lo_tags_taggable on lo_tags(taggable_type, taggable_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table learning_outcomes enable row level security;
alter table course_weeks enable row level security;
alter table assignments enable row level security;
alter table lo_tags enable row level security;

-- Helper: "course belongs to current user"
-- Used in subqueries below to keep policies readable.

-- learning_outcomes policies
create policy "Users can view own learning_outcomes"
  on learning_outcomes for select
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can insert own learning_outcomes"
  on learning_outcomes for insert
  with check (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can update own learning_outcomes"
  on learning_outcomes for update
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can delete own learning_outcomes"
  on learning_outcomes for delete
  using (course_id in (select id from courses where user_id = auth.uid()));

-- course_weeks policies
create policy "Users can view own course_weeks"
  on course_weeks for select
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can insert own course_weeks"
  on course_weeks for insert
  with check (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can update own course_weeks"
  on course_weeks for update
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can delete own course_weeks"
  on course_weeks for delete
  using (course_id in (select id from courses where user_id = auth.uid()));

-- assignments policies
create policy "Users can view own assignments"
  on assignments for select
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can insert own assignments"
  on assignments for insert
  with check (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can update own assignments"
  on assignments for update
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users can delete own assignments"
  on assignments for delete
  using (course_id in (select id from courses where user_id = auth.uid()));

-- lo_tags policies (checks ownership through learning_outcomes → courses)
create policy "Users can view own lo_tags"
  on lo_tags for select
  using (learning_outcome_id in (
    select lo.id from learning_outcomes lo
    join courses c on c.id = lo.course_id
    where c.user_id = auth.uid()
  ));

create policy "Users can insert own lo_tags"
  on lo_tags for insert
  with check (learning_outcome_id in (
    select lo.id from learning_outcomes lo
    join courses c on c.id = lo.course_id
    where c.user_id = auth.uid()
  ));

create policy "Users can update own lo_tags"
  on lo_tags for update
  using (learning_outcome_id in (
    select lo.id from learning_outcomes lo
    join courses c on c.id = lo.course_id
    where c.user_id = auth.uid()
  ));

create policy "Users can delete own lo_tags"
  on lo_tags for delete
  using (learning_outcome_id in (
    select lo.id from learning_outcomes lo
    join courses c on c.id = lo.course_id
    where c.user_id = auth.uid()
  ));
