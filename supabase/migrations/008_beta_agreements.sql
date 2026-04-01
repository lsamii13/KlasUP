-- KlasUp Beta Tester Agreements
-- Stores signed beta tester agreements from the public /beta page.

create table if not exists beta_agreements (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  job_title text,
  institution text,
  digital_signature text not null,
  agreed boolean not null default true,
  signed_at timestamptz not null default now()
);

create index if not exists idx_beta_agreements_email on beta_agreements (email);
create index if not exists idx_beta_agreements_signed_at on beta_agreements (signed_at desc);

alter table beta_agreements enable row level security;

-- Anyone can submit a beta agreement (public form)
drop policy if exists "Anyone can insert beta agreements" on beta_agreements;
create policy "Anyone can insert beta agreements"
  on beta_agreements for insert
  with check (true);

-- Only admin role can read agreements
drop policy if exists "Admins can read beta agreements" on beta_agreements;
create policy "Admins can read beta agreements"
  on beta_agreements for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
