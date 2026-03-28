-- Allow anonymous access to courses before auth is added
-- Removes the FK to profiles so device-based IDs work

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own courses" ON courses;
DROP POLICY IF EXISTS "Users can manage own courses" ON courses;

-- Remove FK to profiles (user_id will hold a device UUID for now)
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_user_id_fkey;

-- Allow public CRUD so the anon key works
CREATE POLICY "Public access courses" ON courses
  FOR ALL USING (true) WITH CHECK (true);
