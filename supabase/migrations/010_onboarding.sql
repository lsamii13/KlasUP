-- Add onboarding_complete flag to profiles
alter table profiles add column if not exists onboarding_complete boolean not null default false;
