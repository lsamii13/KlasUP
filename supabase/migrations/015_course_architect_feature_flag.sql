-- Add course_architect feature flag (disabled by default)
insert into feature_flags (name, enabled)
values ('course_architect', false)
on conflict (name) do nothing;
