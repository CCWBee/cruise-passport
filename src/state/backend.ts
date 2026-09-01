// Thin client over the Supabase RPCs in supabase/migrations/0001_init.sql. Every call is a no-op that
// returns a safe empty/false when no backend is configured, so guest/offline code paths never branch
// on this — they just get nothing back. The merge stays the one path: friend/group feeds are run
// through the same importFriendPayload as QR and paste. Live end-to-end needs Charles's project
// (docs/BACKEND_SETUP.md); the shapes here match the RPCs exactly.
import type { SharePayload } from './share'
import { backendConfigured, getSupabase } from './supabase'

export interface FeedRow { code: string; name: string; colour: string; payload: SharePayload; updatedAt: number }
export interface GroupRow { id: string; name: string; plan: string; slots: number; invite: string; role: string; members: number }

export const hasBackend = (): boolean => backendConfigured

async function sb() {
  const p = getSupabase()
  return p ? await p : null
}

/** Ensure we have a session; create an invisible anonymous one if needed. Returns the user id. */
export async function ensureSession(): Promise<string | null> {
  const client = await sb()
  if (!client) return null
  try {
    const { data } = await client.auth.getSession()
    if (data.session?.user) return data.session.user.id
    const { data: anon, error } = await client.auth.signInAnonymously()
    if (error) return null
    return anon.user?.id ?? null
  } catch {
    return null
  }
}

export async function currentUserId(): Promise<string | null> {
  const client = await sb()
  if (!client) return null
  try { return (await client.auth.getSession()).data.session?.user?.id ?? null } catch { return null }
}

export async function isAnonymous(): Promise<boolean> {
  const client = await sb()
  if (!client) return false
  try {
    const user = (await client.auth.getSession()).data.session?.user
    // anonymous users have no identities / no email
    return Boolean(user) && !user!.email && (user!.identities?.length ?? 0) === 0
  } catch { return false }
}

/** Upgrade the current (anonymous) session to Google without losing the account. Redirects away. */
export async function signInWithGoogle(redirectTo: string): Promise<void> {
  const client = await sb()
  if (!client) return
  const anon = await isAnonymous()
  try {
    if (anon) await client.auth.linkIdentity({ provider: 'google', options: { redirectTo } })
    else await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  } catch { /* provider or linking not enabled; caller shows a message */ }
}

export async function signOut(): Promise<void> {
  const client = await sb()
  if (client) { try { await client.auth.signOut() } catch { /* ignore */ } }
}

// ── data ──

export async function upsertProfile(code: string, name: string, colour: string): Promise<boolean> {
  const client = await sb()
  const uid = await ensureSession()
  if (!client || !uid) return false
  const { error } = await client.from('profiles').upsert({ user_id: uid, code, name, colour, updated_at: new Date().toISOString() })
  return !error
}

export async function publishPassport(cruiseId: string, payload: SharePayload): Promise<boolean> {
  const client = await sb()
  const uid = await ensureSession()
  if (!client || !uid) return false
  const { error } = await client.from('passports').upsert({ user_id: uid, cruise_id: cruiseId, payload, updated_at: new Date().toISOString() })
  return !error
}

export async function publishBackup(cruiseId: string, state: unknown): Promise<boolean> {
  const client = await sb()
  const uid = await ensureSession()
  if (!client || !uid) return false
  const { error } = await client.from('backups').upsert({ user_id: uid, cruise_id: cruiseId, state, updated_at: new Date().toISOString() })
  return !error
}

export async function fetchBackup(cruiseId: string): Promise<{ state: unknown; updatedAt: number } | null> {
  const client = await sb()
  const uid = await ensureSession()
  if (!client || !uid) return null
  const { data, error } = await client.from('backups').select('state, updated_at').eq('user_id', uid).eq('cruise_id', cruiseId).maybeSingle()
  if (error || !data) return null
  return { state: data.state, updatedAt: new Date(data.updated_at).getTime() }
}

export async function lookup(code: string): Promise<{ code: string; name: string; colour: string } | null> {
  const client = await sb()
  if (!client) return null
  const { data, error } = await client.rpc('lookup', { p_code: code })
  if (error || !data?.length) return null
  return data[0]
}

export async function befriend(code: string): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('befriend', { p_code: code })
  return !error
}

function toFeed(rows: unknown): FeedRow[] {
  if (!Array.isArray(rows)) return []
  return rows.map((r) => {
    const row = r as { code: string; name: string; colour: string; payload: SharePayload; updated_at: string }
    return { code: row.code, name: row.name, colour: row.colour, payload: row.payload, updatedAt: new Date(row.updated_at).getTime() }
  })
}

export async function friendFeed(cruiseId: string): Promise<FeedRow[]> {
  const client = await sb()
  if (!client || !(await ensureSession())) return []
  const { data, error } = await client.rpc('friend_feed', { p_cruise: cruiseId })
  return error ? [] : toFeed(data)
}

export async function groupFeed(cruiseId: string): Promise<FeedRow[]> {
  const client = await sb()
  if (!client || !(await ensureSession())) return []
  const { data, error } = await client.rpc('group_feed', { p_cruise: cruiseId })
  return error ? [] : toFeed(data)
}

export async function myGroups(cruiseId: string): Promise<GroupRow[]> {
  const client = await sb()
  if (!client || !(await ensureSession())) return []
  const { data, error } = await client.rpc('my_groups', { p_cruise: cruiseId })
  if (error || !Array.isArray(data)) return []
  return data.map((r) => {
    const row = r as { id: string; name: string; plan: string; slots: number; invite_code: string; role: string; members: number }
    return { id: row.id, name: row.name, plan: row.plan, slots: row.slots, invite: row.invite_code, role: row.role, members: row.members }
  })
}

export async function createGroup(name: string, cruiseId: string): Promise<{ id: string; invite: string } | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('create_group', { p_name: name, p_cruise: cruiseId })
  if (error || !data?.length) return null
  return { id: data[0].id, invite: data[0].invite_code }
}

export async function joinGroup(invite: string): Promise<{ id: string; name: string } | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('join_group', { p_invite: invite })
  if (error || !data?.length) return null
  return { id: data[0].id, name: data[0].name }
}

export async function deleteMyData(): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('delete_my_data')
  return !error
}
