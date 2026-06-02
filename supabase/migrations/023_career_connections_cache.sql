-- Career Connections cache — stores AI-generated career content per course.
-- One cached row per (user_id, course_id); regenerated on demand.

create table career_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  course_title text not null,
  inferred_discipline text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_connections_user_course_unique unique (user_id, course_id)
);

-- Row Level Security
alter table career_connections enable row level security;

create policy "Users can view own career_connections"
  on career_connections for select using (auth.uid() = user_id);

create policy "Users can manage own career_connections"
  on career_connections for all using (auth.uid() = user_id);
