import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useFeatureFlags() {
  const [flags, setFlags] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchFlags() {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('name, enabled')
      if (cancelled) return
      if (!error && data) {
        const map = {}
        for (const row of data) {
          map[row.name] = row.enabled
        }
        setFlags(map)
      }
      setLoading(false)
    }

    fetchFlags()

    // Re-fetch flags when auth state changes (e.g. login/logout may affect RLS visibility)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchFlags()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { flags, loading }
}
