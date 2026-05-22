-- ============================================================
-- 019: Transactional email system (Resend + pg_cron)
-- ============================================================

-- 1. Email log table — tracks every sent email, prevents duplicates
create table if not exists email_log (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid not null references profiles(id) on delete cascade,
  email_type    text not null,
  sent_at       timestamptz default now(),
  constraint uq_email_log_user_type unique (user_id, email_type)
);

alter table email_log enable row level security;

-- Only service role can insert/read (no user access needed)
create policy "Service role manages email_log"
  on email_log for all
  using (false)
  with check (false);

-- Index for the cron job lookups
create index idx_email_log_type on email_log (email_type);

-- ============================================================
-- 2. Welcome email — fires on profile insert via pg_net
-- ============================================================
-- PREREQUISITE: The anon key must already exist in Vault.
-- Run this in the SQL Editor BEFORE applying this migration:
--
--   select vault.create_secret(
--     'your-anon-key',
--     'supabase_anon_key',
--     'Supabase anon key for calling Edge Functions from pg_net'
--   );
-- ============================================================

create or replace function send_welcome_email()
returns trigger
language plpgsql
security definer
as $$
declare
  _first_name text;
  _anon_key text;
  _base_url constant text := 'https://thbfibtknxivegybhupw.supabase.co';
begin
  -- Extract first name from full name, fall back to 'there'
  _first_name := coalesce(nullif(split_part(NEW.name, ' ', 1), ''), 'there');

  -- Read anon key from Vault
  select decrypted_secret into _anon_key
    from vault.decrypted_secrets
    where name = 'supabase_anon_key'
    limit 1;

  if _anon_key is null then
    raise warning 'send_welcome_email: supabase_anon_key not found in Vault, skipping';
    return NEW;
  end if;

  -- Log first to claim the slot (unique constraint prevents duplicates)
  insert into email_log (user_id, email_type)
  values (NEW.id, 'welcome')
  on conflict (user_id, email_type) do nothing;

  -- Only send if we actually inserted (i.e. not a duplicate)
  if found then
    perform net.http_post(
      url     := _base_url || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon_key
      ),
      body    := jsonb_build_object(
        'template',   'welcome',
        'to',         NEW.email,
        'first_name', _first_name
      )
    );
  end if;

  return NEW;
end;
$$;

create trigger trg_send_welcome_email
  after insert on profiles
  for each row
  execute function send_welcome_email();

-- ============================================================
-- 3. Trial reminder function — called by pg_cron
-- ============================================================

-- Finds users at a specific trial day and sends the matching email.
-- Skips users who already received that email (via email_log).
create or replace function send_trial_emails(
  _day        int,       -- 10 or 13
  _email_type text       -- 'trial_day_10' or 'trial_day_13'
)
returns void
language plpgsql
security definer
as $$
declare
  _rec record;
  _first_name text;
  _anon_key text;
  _base_url constant text := 'https://thbfibtknxivegybhupw.supabase.co';
begin
  -- Read anon key from Vault
  select decrypted_secret into _anon_key
    from vault.decrypted_secrets
    where name = 'supabase_anon_key'
    limit 1;

  if _anon_key is null then
    raise warning 'send_trial_emails: supabase_anon_key not found in Vault, skipping';
    return;
  end if;

  for _rec in
    select p.id, p.email, p.name
    from profiles p
    where p.trial_started_at::date = current_date - make_interval(days := _day)
      and p.role = 'pro'                          -- still on trial (not downgraded)
      and p.stripe_customer_id is null             -- not a paying customer
      and not exists (
        select 1 from email_log el
        where el.user_id = p.id and el.email_type = _email_type
      )
  loop
    _first_name := coalesce(nullif(split_part(_rec.name, ' ', 1), ''), 'there');

    -- Claim the slot
    insert into email_log (user_id, email_type)
    values (_rec.id, _email_type)
    on conflict (user_id, email_type) do nothing;

    if found then
      perform net.http_post(
        url     := _base_url || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _anon_key
        ),
        body    := jsonb_build_object(
          'template',   _email_type,
          'to',         _rec.email,
          'first_name', _first_name
        )
      );
    end if;
  end loop;
end;
$$;

-- ============================================================
-- 4. pg_cron jobs — run daily at 9 AM UTC
-- ============================================================
-- NOTE: pg_cron must be enabled in Supabase Dashboard first.
--       Database → Extensions → search "pg_cron" → Enable
--
-- These SELECT statements schedule the cron jobs.
-- If pg_cron is not yet enabled, this migration will fail —
-- enable the extension and re-run.

select cron.schedule(
  'trial-day-10-email',
  '0 9 * * *',
  $$select send_trial_emails(10, 'trial_day_10')$$
);

select cron.schedule(
  'trial-day-13-email',
  '0 9 * * *',
  $$select send_trial_emails(13, 'trial_day_13')$$
);
