import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Sanitization ──────────────────────────────────────────

function sanitize(str) {
  if (!str) return str
  return str.replace(/<[^>]*>/g, '').trim()
}

// ── Auth helpers ──────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/#reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// ── Profile helpers ───────────────────────────────────────

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertProfile(userId, profile) {
  const cleaned = {
    id: userId,
    name: sanitize(profile.name),
    email: profile.email,
    institution: sanitize(profile.institution),
    job_title: sanitize(profile.job_title),
    lms: profile.lms || null,
    photo_url: profile.photo_url || null,
    tos_accepted_at: profile.tos_accepted_at || null,
    tos_version: profile.tos_version || null,
  }
  const { data, error } = await supabase
    .from('profiles')
    .upsert(cleaned)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLastActive(userId) {
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId)
}

export async function uploadProfilePhoto(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (uploadErr) throw uploadErr
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  await supabase.from('profiles').update({ photo_url: data.publicUrl }).eq('id', userId)
  return data.publicUrl
}

// ── Subscription / tier helpers ──────────────────────────

export function checkSubscriptionStatus(profile) {
  if (!profile) return { tier: 'free', trialActive: false, trialExpiringSoon: false, trialExpired: false, daysLeft: 0 }
  if (profile.role === 'admin') return { tier: 'admin', trialActive: false, trialExpiringSoon: false, trialExpired: false, daysLeft: Infinity }
  if (profile.test_user) return { tier: 'pro', trialActive: false, trialExpiringSoon: false, trialExpired: false, daysLeft: Infinity }

  const now = new Date()
  const expires = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const daysLeft = expires ? Math.ceil((expires - now) / (1000 * 60 * 60 * 24)) : 0

  if (profile.role === 'institutional') return { tier: 'institutional', trialActive: false, trialExpiringSoon: false, trialExpired: false, daysLeft }

  if (expires && expires > now) {
    const trialActive = profile.trial_started_at != null
    return { tier: 'pro', trialActive, trialExpiringSoon: daysLeft <= 3, trialExpired: false, daysLeft }
  }

  // Expired — should be downgraded
  return { tier: 'free', trialActive: false, trialExpiringSoon: false, trialExpired: expires != null, daysLeft: 0 }
}

export async function downgradeExpiredUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'free' })
    .eq('id', userId)
  if (error) throw error
}

// ── Course helpers ────────────────────────────────────────

export async function fetchCourses(userId) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function insertCourse(course, userId) {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      course_code: sanitize(course.course_code),
      course_name: sanitize(course.course_name),
      section: sanitize(course.section),
      semester_code: sanitize(course.semester_code),
      semester_start: course.semester_start || null,
      num_weeks: course.num_weeks,
      user_id: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCourse(id, updates) {
  const cleaned = { ...updates }
  if (cleaned.course_code) cleaned.course_code = sanitize(cleaned.course_code)
  if (cleaned.course_name) cleaned.course_name = sanitize(cleaned.course_name)
  if (cleaned.section !== undefined) cleaned.section = sanitize(cleaned.section)
  if (cleaned.semester_code) cleaned.semester_code = sanitize(cleaned.semester_code)
  const { data, error } = await supabase
    .from('courses')
    .update(cleaned)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCourse(id) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Event tracking (founder analytics) ────────────────────

export async function trackEvent(userId, eventName, metadata = {}) {
  await supabase
    .from('events')
    .insert({ user_id: userId, event_name: eventName, metadata })
}

// ── Security log ──────────────────────────────────────────

export async function logSecurityEvent(userId, eventType, metadata = {}) {
  await supabase
    .from('security_log')
    .insert({ user_id: userId, event_type: eventType, metadata })
}

// ── Announcements ─────────────────────────────────────────

export async function fetchActiveAnnouncements(userId) {
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (error) throw error

  const { data: dismissed } = await supabase
    .from('announcement_dismissals')
    .select('announcement_id')
    .eq('user_id', userId)

  const dismissedIds = new Set((dismissed || []).map(d => d.announcement_id))
  return (announcements || []).filter(a => !dismissedIds.has(a.id))
}

export async function dismissAnnouncement(userId, announcementId) {
  await supabase
    .from('announcement_dismissals')
    .insert({ user_id: userId, announcement_id: announcementId })
}

// ── Admin functions ───────────────────────────────────────

export async function adminFetchAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function adminUpdateUserRole(userId, newRole, adminId) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  if (error) throw error
  await logSecurityEvent(adminId, 'role_change', { target_user: userId, new_role: newRole })
}

export async function adminSetSubscription(userId, expiresAt) {
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_expires_at: expiresAt })
    .eq('id', userId)
  if (error) throw error
}

export async function adminCreateTestUser(email, password, name) {
  // Sign up the user via auth
  const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
  if (authErr) throw authErr

  // Create their profile as test user with pro
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email,
      name: sanitize(name),
      role: 'pro',
      test_user: true,
      subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      tos_accepted_at: new Date().toISOString(),
      tos_version: '1.0',
    })
  if (profileErr) throw profileErr
  return authData.user
}

export async function adminResetTestUser(userId) {
  // Delete all user data except profile
  await supabase.from('courses').delete().eq('user_id', userId)
  await supabase.from('uploads').delete().eq('user_id', userId)
  await supabase.from('micro_learnings').delete().eq('user_id', userId)
  await supabase.from('events').delete().eq('user_id', userId)
}

export async function adminCreateAnnouncement(authorId, title, body) {
  const { data, error } = await supabase
    .from('announcements')
    .insert({ author_id: authorId, title: sanitize(title), body: sanitize(body) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminFetchUsageStats() {
  const { data, error } = await supabase
    .from('admin_usage_stats')
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function adminFetchFunnel() {
  const { data, error } = await supabase
    .from('admin_funnel')
    .select('*')
    .single()
  if (error) throw error
  return data
}

// ── Data deletion (GDPR/CCPA) ─────────────────────────────

export async function requestDataDeletion(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
  await logSecurityEvent(userId, 'deletion_request')
}
