-- ============================================================
-- 022: Auto-send welcome email when a new lead is inserted
-- ============================================================
-- Fires AFTER INSERT on the leads table. Calls the
-- send-lead-welcome Edge Function via pg_net, passing the
-- lead's email and source. Uses the welcome_sent column
-- as a dedup flag so the email is never sent twice.
-- ============================================================

create or replace function send_lead_welcome_email()
returns trigger
language plpgsql
security definer
as $$
declare
  _anon_key text;
  _base_url constant text := 'https://thbfibtknxivegybhupw.supabase.co';
begin
  -- Only send if the email hasn't already been sent for this row
  if NEW.welcome_sent = true then
    return NEW;
  end if;

  -- Read anon key from Vault
  select decrypted_secret into _anon_key
    from vault.decrypted_secrets
    where name = 'supabase_anon_key'
    limit 1;

  if _anon_key is null then
    raise warning 'send_lead_welcome_email: supabase_anon_key not found in Vault, skipping';
    return NEW;
  end if;

  -- Call the send-lead-welcome Edge Function
  perform net.http_post(
    url     := _base_url || '/functions/v1/send-lead-welcome',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body    := jsonb_build_object(
      'email',  NEW.email,
      'source', NEW.source
    )
  );

  -- Mark as sent so it won't fire again
  update leads
    set welcome_sent = true
    where id = NEW.id;

  return NEW;
end;
$$;

drop trigger if exists trg_send_lead_welcome_email on leads;

create trigger trg_send_lead_welcome_email
  after insert on leads
  for each row
  execute function send_lead_welcome_email();
