import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Stable device identity until auth is added
export function getDeviceId() {
  let id = localStorage.getItem('klasup_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('klasup_device_id', id)
  }
  return id
}

export async function fetchCourses() {
  const deviceId = getDeviceId()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', deviceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function insertCourse(course) {
  const deviceId = getDeviceId()
  const { data, error } = await supabase
    .from('courses')
    .insert({ ...course, user_id: deviceId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCourse(id, updates) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
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
