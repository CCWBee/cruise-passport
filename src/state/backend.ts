// Thin client over the Supabase RPCs in supabase/migrations/. Nothing here throws: with no backend
// configured every call is a no-op, so guest/offline code paths never branch on this. Writes report
// false. The three feeds report null instead, because "the call failed" and "you have nobody" are
// different answers and the caller must not write an empty roster over a good one. Feeds left-join
// passports, so a row's payload may be null (they have joined but not yet synced); the store
// synthesises an identity card for those. Live end-to-end needs Charles's project
// (docs/BACKEND_SETUP.md); the shapes here match the RPCs exactly.
import type { SharePayload } from './share'
import { backendConfigured, getSupabase } from './supabase'

export interface FeedRow {
  code: string; name: string; colour: string
  payload: SharePayload | null // null = no passport published yet
  updatedAt: number
  groupIds?: string[] // group feed only: the groups on this cruise I share with them
}
export interface GroupRow { id: string; name: string; plan: string; slots: number; invite: string; role: string; members: number }
export interface MemberRow { code: string; name: string; colour: string; role: string; joinedAt: number }

export const hasBackend = (): boolean => backendConfigured

// The import itself can fail (a precached chunk gone stale after a deploy), so it is caught here
// rather than rejecting every adapter call and breaking the never-throws contract above.
async function sb() {
  try {
    const p = getSupabase()
    return p ? await p : null
  } catch {
    return null
  }
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

export async function befriend(code: string): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('befriend', { p_code: code })
  return !error
}

/** Cut both edges, so "Remove" really revokes rather than letting them return on the next pull. */
export async function unfriend(code: string): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('unfriend', { p_code: code })
  return !error
}

function toFeed(rows: unknown): FeedRow[] {
  if (!Array.isArray(rows)) return []
  return rows.map((r) => {
    const row = r as { code: string; name: string; colour: string; payload: SharePayload | null; updated_at: string | null; group_ids?: string[] }
    const feed: FeedRow = {
      code: row.code, name: row.name, colour: row.colour, payload: row.payload ?? null,
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
    }
    if (Array.isArray(row.group_ids)) feed.groupIds = row.group_ids.map(String)
    return feed
  })
}

// null = the call did not answer. Never [], which the store would read as "nobody" and act on.
export async function friendFeed(cruiseId: string): Promise<FeedRow[] | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('friend_feed', { p_cruise: cruiseId })
  return error ? null : toFeed(data)
}

export async function groupFeed(cruiseId: string): Promise<FeedRow[] | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('group_feed', { p_cruise: cruiseId })
  return error ? null : toFeed(data)
}

export async function myGroups(cruiseId: string): Promise<GroupRow[] | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('my_groups', { p_cruise: cruiseId })
  if (error || !Array.isArray(data)) return null
  return data.map((r) => {
    const row = r as { id: string; name: string; plan: string; slots: number; invite_code: string; role: string; members: number }
    return { id: row.id, name: row.name, plan: row.plan, slots: row.slots, invite: row.invite_code, role: row.role, members: row.members }
  })
}

/** The roster of one of my groups. Empty unless I am a member (the RPC gates on that). */
export async function groupMembers(groupId: string): Promise<MemberRow[]> {
  const client = await sb()
  if (!client || !(await ensureSession())) return []
  const { data, error } = await client.rpc('group_members', { p_group: groupId })
  if (error || !Array.isArray(data)) return []
  return data.map((r) => {
    const row = r as { code: string; name: string; colour: string; role: string; joined_at: string | null }
    return { code: row.code, name: row.name, colour: row.colour, role: row.role, joinedAt: row.joined_at ? new Date(row.joined_at).getTime() : 0 }
  })
}

export async function createGroup(name: string, cruiseId: string): Promise<{ id: string; invite: string } | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('create_group', { p_name: name, p_cruise: cruiseId })
  if (error || !data?.length) return null
  return { id: data[0].id, invite: data[0].invite_code }
}

/** 'invalid' = there is no such group, so retrying will never help; null = the call did not answer,
 *  so the code is worth holding. The two are told apart by the RPC's own message. */
export async function joinGroup(invite: string): Promise<{ id: string; name: string } | 'invalid' | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('join_group', { p_invite: invite })
  if (error) return /no such group/i.test(error.message || '') ? 'invalid' : null
  if (!data?.length) return 'invalid'
  return { id: data[0].id, name: data[0].name }
}

/** Give up my membership. Owners cannot: the RPC raises, and they delete the group instead. */
export async function leaveGroup(groupId: string): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('leave_group', { p_group: groupId })
  return !error
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('delete_group', { p_group: groupId })
  return !error
}

/** GDPR erasure. Also drops the anonymous session, so the next sync starts as a fresh user rather
 *  than re-publishing under the identity we just erased. */
export async function deleteMyData(): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('delete_my_data')
  if (error) return false
  try { await client.auth.signOut() } catch { /* the rows are gone either way */ }
  return true
}
