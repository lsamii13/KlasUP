-- KlasUp Initial Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor)

-- 1. Profiles — faculty user info
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  institution text,
  created_at timestamptz not null default now()
);

-- 2. Courses — faculty courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_code text not null,
  course_name text not null,
  section text,
  semester_code text not null,
  semester_start date,
  num_weeks integer,
  created_at timestamptz not null default now()
);

-- 3. Uploads — all faculty uploads
create table uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  week integer not null,
  category text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 4. Micro-learnings — AI generated recommendations
create table micro_learnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  upload_id uuid not null references uploads(id) on delete cascade,
  tag text,
  title text not null,
  summary text,
  article text,
  action text,
  rating integer,
  created_at timestamptz not null default now()
);

-- 5. Reflections — end of semester reflections
create table reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  semester_code text not null,
  content text,
  edited_content text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security on all tables
alter table profiles enable row level security;
alter table courses enable row level security;
alter table uploads enable row level security;
alter table micro_learnings enable row level security;
alter table reflections enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can view own courses"
  on courses for select using (auth.uid() = user_id);

create policy "Users can manage own courses"
  on courses for all using (auth.uid() = user_id);

create policy "Users can view own uploads"
  on uploads for select using (auth.uid() = user_id);

create policy "Users can manage own uploads"
  on uploads for all using (auth.uid() = user_id);

create policy "Users can view own micro_learnings"
  on micro_learnings for select using (auth.uid() = user_id);

create policy "Users can manage own micro_learnings"
  on micro_learnings for all using (auth.uid() = user_id);

create policy "Users can view own reflections"
  on reflections for select using (auth.uid() = user_id);

create policy "Users can manage own reflections"
  on reflections for all using (auth.uid() = user_id);
