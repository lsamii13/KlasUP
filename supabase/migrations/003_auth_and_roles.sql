-- 003_auth_and_roles.sql
-- Adds roles, tiers, subscriptions, admin features, security, analytics, and compliance

-- ============================================================
-- 1. PROFILES — Add new columns
-- ============================================================

-- Role & tier
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'free'
  CHECK (role IN ('free', 'pro', 'institutional', 'admin'));

-- Subscription & trial
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now();

-- Test user flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS test_user boolean NOT NULL DEFAULT false;

-- Extended profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lms text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url text;

-- Activity tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Legal & compliance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tos_version text;

-- Deletion request
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

-- ============================================================
-- 2. RESTORE FK TO AUTH — Courses now use real auth user IDs
-- ============================================================

-- Drop the permissive public policy from migration 002
DROP POLICY IF EXISTS "Public access courses" ON courses;

-- Re-add FK to profiles (user_id now holds auth.users UUID)
-- Only add if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'courses_user_id_fkey' AND table_name = 'courses'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 3. SECURITY LOG — Tracks login attempts, resets, role changes
-- ============================================================

CREATE TABLE IF NOT EXISTS security_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failure', 'password_reset_request',
    'password_reset_complete', 'role_change', 'signup', 'logout',
    'account_locked', 'deletion_request'
  )),
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. EVENTS — Founder analytics / funnel tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_name text NOT NULL CHECK (event_name IN (
    'signup', 'first_upload', 'first_micro_learning',
    'upgrade_prompt_shown', 'course_added', 'reflection_generated',
    'profile_completed', 'onboarding_completed', 'feature_locked_hit'
  )),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. ANNOUNCEMENTS — Admin broadcasts
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dismissed announcements per user
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

-- ============================================================
-- 6. ROW LEVEL SECURITY — All tables
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can see and manage all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- COURSES
DROP POLICY IF EXISTS "Users can view own courses" ON courses;
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own courses" ON courses;
CREATE POLICY "Users can manage own courses" ON courses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- UPLOADS
DROP POLICY IF EXISTS "Users can manage own uploads" ON uploads;
CREATE POLICY "Users can manage own uploads" ON uploads
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MICRO_LEARNINGS
DROP POLICY IF EXISTS "Users can manage own micro_learnings" ON micro_learnings;
CREATE POLICY "Users can manage own micro_learnings" ON micro_learnings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REFLECTIONS
DROP POLICY IF EXISTS "Users can manage own reflections" ON reflections;
CREATE POLICY "Users can manage own reflections" ON reflections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SECURITY_LOG — users see their own, admins see all
DROP POLICY IF EXISTS "Users can view own security log" ON security_log;
CREATE POLICY "Users can view own security log" ON security_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all security logs" ON security_log;
CREATE POLICY "Admins can view all security logs" ON security_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Anyone can insert security log" ON security_log;
CREATE POLICY "Anyone can insert security log" ON security_log
  FOR INSERT WITH CHECK (true);

-- EVENTS — users see own, admins see all
DROP POLICY IF EXISTS "Users can manage own events" ON events;
CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all events" ON events;
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ANNOUNCEMENTS — anyone can read active, only admins can create
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ANNOUNCEMENT_DISMISSALS
DROP POLICY IF EXISTS "Users can manage own dismissals" ON announcement_dismissals;
CREATE POLICY "Users can manage own dismissals" ON announcement_dismissals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. SERVER-SIDE VALIDATION FUNCTION
-- ============================================================

-- Sanitize text input — strips HTML tags and trims
CREATE OR REPLACE FUNCTION sanitize_text(input text)
RETURNS text AS $$
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  -- Strip HTML tags
  RETURN trim(regexp_replace(input, '<[^>]*>', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to sanitize profile fields on insert/update
CREATE OR REPLACE FUNCTION sanitize_profile_fields()
RETURNS trigger AS $$
BEGIN
  NEW.name := sanitize_text(NEW.name);
  NEW.institution := sanitize_text(NEW.institution);
  NEW.job_title := sanitize_text(NEW.job_title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sanitize_profiles ON profiles;
CREATE TRIGGER trg_sanitize_profiles
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sanitize_profile_fields();

-- Trigger to sanitize course fields
CREATE OR REPLACE FUNCTION sanitize_course_fields()
RETURNS trigger AS $$
BEGIN
  NEW.course_code := sanitize_text(NEW.course_code);
  NEW.course_name := sanitize_text(NEW.course_name);
  NEW.section := sanitize_text(NEW.section);
  NEW.semester_code := sanitize_text(NEW.semester_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sanitize_courses ON courses;
CREATE TRIGGER trg_sanitize_courses
  BEFORE INSERT OR UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION sanitize_course_fields();

-- ============================================================
-- 8. ADMIN HELPER VIEWS
-- ============================================================

-- View for admin usage stats
CREATE OR REPLACE VIEW admin_usage_stats AS
SELECT
  (SELECT count(*) FROM profiles WHERE NOT test_user) AS total_users,
  (SELECT count(*) FROM profiles WHERE last_active_at > now() - interval '7 days' AND NOT test_user) AS active_this_week,
  (SELECT count(*) FROM uploads) AS total_uploads,
  (SELECT count(*) FROM micro_learnings) AS total_micro_learnings,
  (SELECT count(*) FROM profiles WHERE role = 'pro' AND NOT test_user) AS pro_users,
  (SELECT count(*) FROM profiles WHERE role = 'institutional' AND NOT test_user) AS institutional_users,
  (SELECT count(*) FROM profiles WHERE trial_started_at > now() - interval '14 days' AND role = 'free') AS active_trials;

-- Grant access to the view
GRANT SELECT ON admin_usage_stats TO authenticated;

-- ============================================================
-- 9. FUNNEL VIEW FOR ANALYTICS
-- ============================================================

CREATE OR REPLACE VIEW admin_funnel AS
SELECT
  (SELECT count(DISTINCT user_id) FROM events WHERE event_name = 'signup') AS signups,
  (SELECT count(DISTINCT user_id) FROM events WHERE event_name = 'first_upload') AS first_uploads,
  (SELECT count(DISTINCT user_id) FROM events WHERE event_name = 'first_micro_learning') AS first_micro_learnings,
  (SELECT count(DISTINCT user_id) FROM events WHERE event_name = 'upgrade_prompt_shown') AS upgrade_prompts_shown;

GRANT SELECT ON admin_funnel TO authenticated;

-- ============================================================
-- 10. AUTO-SET TRIAL ON NEW PROFILES
-- ============================================================

CREATE OR REPLACE FUNCTION set_trial_on_signup()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'free' AND NEW.subscription_expires_at IS NULL THEN
    NEW.role := 'pro';
    NEW.trial_started_at := now();
    NEW.subscription_expires_at := now() + interval '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_trial ON profiles;
CREATE TRIGGER trg_set_trial
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_trial_on_signup();

-- ============================================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_security_log_user_id ON security_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_log_event ON security_log(event_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);
