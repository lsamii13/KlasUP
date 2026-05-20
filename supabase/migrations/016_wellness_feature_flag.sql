-- Add wellness feature flag (disabled by default)
insert into feature_flags (name, enabled)
values ('wellness', false)
on conflict (name) do nothing;
