// Guarded Supabase client. Absent env keys (the default, and every guest) => no backend at all, and
// supabase-js is never even downloaded (dynamic import), so the offline-first app is unchanged. When
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set, the client is created on first use.
// The anon key is public by design; RLS does the protecting. See docs/BACKEND_SETUP.md.
import type { SupabaseClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL?.trim()
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const backendConfigured: boolean = Boolean(URL && KEY)

let clientPromise: Promise<SupabaseClient> | null = null

/** The Supabase client, or null when no backend is configured (pure guest / offline). */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!backendConfigured) return null
  if (!clientPromise) {
    const p = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL!, KEY!, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }),
    )
    clientPromise = p
    // A chunk that 404s after a deploy, or a connection that drops mid-import, must not poison every
    // later call: forget the failure so the next one retries. (The catch also keeps the rejection
    // handled; callers get the same promise and guard it themselves.)
    p.catch(() => { if (clientPromise === p) clientPromise = null })
  }
  return clientPromise
}
