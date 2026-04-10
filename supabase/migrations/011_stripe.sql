-- 011_stripe.sql
-- Adds Stripe customer ID to profiles for webhook lookups

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- RLS: the Edge Function uses the service_role key, which bypasses RLS,
-- so no additional policies are needed for Stripe webhook updates.
