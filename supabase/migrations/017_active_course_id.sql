-- Add active_course_id to profiles (nullable FK to courses)
alter table profiles
  add column if not exists active_course_id uuid references courses(id) on delete set null;
