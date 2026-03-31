-- KlasUp Wellness Check-ins
-- Stores daily faculty wellness check-in scores and optional notes.

create table if not exists wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  check_in_score integer not null check (check_in_score between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wellness_checkins_user on wellness_checkins (user_id, created_at desc);

alter table wellness_checkins enable row level security;

drop policy if exists "Users can read own checkins" on wellness_checkins;
create policy "Users can read own checkins"
  on wellness_checkins for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own checkins" on wellness_checkins;
create policy "Users can insert own checkins"
  on wellness_checkins for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own checkins" on wellness_checkins;
create policy "Users can update own checkins"
  on wellness_checkins for update using (auth.uid() = user_id);
