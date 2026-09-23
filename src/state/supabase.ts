// Guarded Supabase client. Absent env keys (the default, and every guest) => no backend at all, and
// supabase-js is never even downloaded (dynamic import), so the offline-first app is unchanged. When
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set, the client is created on first use.
// The anon key is public by design; RLS does the protecting. See docs/BACKEND_SETUP.md.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from './timeout'

const URL = import.meta.env.VITE_SUPABASE_URL?.trim()
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const backendConfigured: boolean = Boolean(URL && KEY)

// ── the session, kept ──
// The library's own key, computed exactly as supabase-js computes its default
// (`sb-<project ref>-auth-token`) and passed back to it, so every phone already signed in keeps its
// session across this change. Only this key is watched; the `-user` and PKCE keys beside it are
// left to the library.
const SESSION_KEY = (() => {
  try { return URL ? `sb-${new globalThis.URL(URL).hostname.split('.')[0]}-auth-token` : '' } catch { return '' }
})()
// The app's copy of the last session the library wrote, and the mark that says the identity it
// belonged to is gone for good (session.ts, judgeRestore). Both beside the passport in
// localStorage, and every access is wrapped, as data/cruises.ts does, because storage can be blocked.
const KEPT_KEY = 'spcc-session-kept'
const RETIRED_KEY = 'spcc-session-retired'

const read = (k: string): string | null => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string): void => { try { localStorage.setItem(k, v) } catch { /* blocked */ } }
const remove = (k: string): void => { try { localStorage.removeItem(k) } catch { /* blocked */ } }

// True only inside forgetSession(): the one removal that is the app's own decision (Delete my data,
// or leaving for another account), after which there is nothing to keep.
let forgetting = false

// localStorage, as the library would use by default, with one difference: when the library removes
// the session on its own (a refresh it counted as final, a stored value it could not read), the
// copy stays, so ensureSession() can put it back rather than minting a stranger. Reading the key
// also refreshes the copy, so a phone that signed in before this build has one from its first read.
const storage = {
  getItem(key: string): string | null {
    const value = read(key)
    if (key === SESSION_KEY && value !== null && read(KEPT_KEY) !== value) write(KEPT_KEY, value)
    return value
  },
  setItem(key: string, value: string): void {
    write(key, value)
    if (key === SESSION_KEY) write(KEPT_KEY, value)
  },
  removeItem(key: string): void {
    remove(key)
    if (key === SESSION_KEY && forgetting) remove(KEPT_KEY)
  },
}

/** The library's key still holds a session (getSession() may still answer null for a minute after
 *  a failed refresh: see session.ts). */
export function storedSession(): boolean {
  return Boolean(SESSION_KEY) && read(SESSION_KEY) !== null
}

/** The kept copy's tokens, when there is a whole one. */
export function keptSession(): { access_token: string; refresh_token: string } | null {
  const raw = read(KEPT_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as { access_token?: unknown; refresh_token?: unknown }
    return typeof s.access_token === 'string' && s.access_token && typeof s.refresh_token === 'string' && s.refresh_token
      ? { access_token: s.access_token, refresh_token: s.refresh_token }
      : null
  } catch { return null }
}

export function dropKeptSession(): void { remove(KEPT_KEY) }
export function isRetired(): boolean { return read(RETIRED_KEY) === '1' }
export function setRetired(on: boolean): void { if (on) write(RETIRED_KEY, '1'); else remove(RETIRED_KEY) }

/** Sign out as the app's own decision: the library's session and the kept copy both go, so the
 *  next session this phone gets is a new one and nothing tries to put the old one back. 'local'
 *  asks the server nothing, for an identity that is already gone there. */
export async function forgetSession(client: SupabaseClient, scope: 'global' | 'local' = 'global'): Promise<void> {
  forgetting = true
  try { await client.auth.signOut({ scope }) } catch { /* the local half is what matters here */ } finally {
    forgetting = false
    dropKeptSession()
  }
}

let clientPromise: Promise<SupabaseClient> | null = null

/** The Supabase client, or null when no backend is configured (pure guest / offline). */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!backendConfigured) return null
  if (!clientPromise) {
    const p = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL!, KEY!, {
        auth: {
          persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
          storage, storageKey: SESSION_KEY || undefined,
        },
        // Every request gets a time limit (timeout.ts), read through globalThis at call time so a
        // test or a polyfill that replaces fetch later is still the one used.
        global: { fetch: withTimeout((input, init) => globalThis.fetch(input, init)) },
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
