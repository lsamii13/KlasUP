-- Migration 024: Add control fields to career_connections
--
-- career_connections (migration 023) stores the generated Career Connections
-- card + topic narratives in its `content` jsonb column. This adds three CONTROL
-- fields the Edge Function branches on, as real queryable columns:
--   confidence            -- 'high' | 'low' : AI discipline-inference confidence
--   discipline_confirmed  -- true once faculty corrects/confirms discipline;
--                            protects their choice from being re-inferred
--   last_generated_at     -- when content was last (re)generated; drives the
--                            "materials changed — refresh?" staleness logic
--                            (distinct from updated_at, which changes every write)

alter table public.career_connections
  add column if not exists confidence text,
  add column if not exists discipline_confirmed boolean not null default false,
  add column if not exists last_generated_at timestamptz;

update public.career_connections
  set last_generated_at = coalesce(last_generated_at, created_at)
  where last_generated_at is null;
