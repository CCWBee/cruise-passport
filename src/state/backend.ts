// Thin client over the Supabase RPCs in supabase/migrations/. Nothing here throws: with no backend
// configured every call is a no-op, so guest/offline code paths never branch on this. Writes report
// false. The three feeds report null instead, because "the call failed" and "you have nobody" are
// different answers and the caller must not write an empty roster over a good one. Feeds left-join
// passports, so a row's payload may be null (they have joined but not yet synced); the store
// synthesises an identity card for those. Live end-to-end needs Charles's project
// (docs/BACKEND_SETUP.md); the shapes here match the RPCs exactly.
import type { SharePayload } from './share'
import { readOAuthError } from './restore'
import { backendConfigured, getSupabase } from './supabase'

export interface FeedRow {
  code: string; name: string; colour: string
  payload: SharePayload | null // null = no passport published yet
  updatedAt: number
  groupIds?: string[] // group feed only: the groups on this cruise I share with them
}
/** What find_profiles returns: the same three public fields lookup() gives, never a payload. */
export interface FoundProfile { code: string; name: string; colour: string }
export interface GroupRow { id: string; name: string; plan: string; slots: number; invite: string; role: string; members: number }
export interface MemberRow { code: string; name: string; colour: string; role: string; joinedAt: number }

export const hasBackend = (): boolean => backendConfigured

// ── the OAuth return leg ──
// Everything the provider hands back on a failure, plus the tokens a successful implicit-flow login
// leaves lying in the URL. `state` is the OAuth round-trip nonce, not anything of ours.
const OAUTH_KEYS = [
  'error', 'error_code', 'error_description', 'state',
  'provider_token', 'access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type',
]

/** Strip the OAuth keys from one half of the URL, and only when that half actually carries one: a
 *  query or fragment with no error in it is handed straight back, so `/add#SPP…` is never rewritten
 *  at all. Every surviving parameter keeps its original text rather than being rebuilt through
 *  URLSearchParams, which re-encodes and turns a bare `?seed` into `?seed=`. */
function stripOAuth(raw: string, lead: string): string {
  if (!raw) return raw
  const parts = raw.replace(/^[#?]/, '').split('&')
  const isOAuth = (p: string) => OAUTH_KEYS.includes(p.split('=')[0])
  if (!parts.some(isOAuth)) return raw
  const kept = parts.filter((p) => p && !isOAuth(p))
  return kept.length ? lead + kept.join('&') : ''
}

// Read at module evaluation and nowhere later. That order is both safe and necessary: this module is
// fully evaluated before anything can call getSupabase(), which is a dynamic import, so the URL is
// still intact when this line runs. The installed client does happen to leave a failed login's
// parameters in place (_getSessionFromURL throws at its first check and never reaches its
// hash-clearing branch), but depending on that is not worth it. And the error reaches the app no
// other way: getSession() awaits initializePromise and ignores its error.
const oauth = typeof location !== 'undefined' ? readOAuthError(location.hash, location.search) : null
if (oauth && typeof location !== 'undefined' && typeof history !== 'undefined') {
  try {
    const cleaned = location.pathname + stripOAuth(location.search, '?') + stripOAuth(location.hash, '#')
    history.replaceState(null, '', cleaned)
  } catch { /* a URL we cannot rewrite is still readable, and the error is already captured above */ }
}

/** The provider error this page came back with, or null. Captured once, at module load. */
export const oauthError = (): { code: string; description: string } | null => oauth

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

// ── who is signed in ──

export type SessionKind = 'none' | 'anonymous' | 'signed-in'

/** Three-valued on purpose, and this is the one adaptation the recovered adapter needed rather than
 *  wanted. 037be89's isAnonymous() tested `Boolean(user) && …`, so a phone with **no session at all**
 *  read as "not anonymous", i.e. signed in. The launch check runs before the first ensureSession(),
 *  which is exactly when there is no session, so on a fresh phone the Profile sheet would have said
 *  "Kept with Google" with no button on the very first open. */
export async function sessionKind(): Promise<SessionKind> {
  const client = await sb()
  if (!client) return 'none'
  try {
    const user = (await client.auth.getSession()).data.session?.user
    if (!user) return 'none'
    // is_anonymous is what GoTrue stamps on the token now; the second test is 037be89's own (no
    // email, no identities), kept as the fallback for a session minted before that field existed.
    if (user.is_anonymous === true) return 'anonymous'
    if (!user.email && (user.identities?.length ?? 0) === 0) return 'anonymous'
    return 'signed-in'
  } catch { return 'none' }
}

/** Kept under its recovered name, as a wrapper, so the question has one implementation. */
export async function isAnonymous(): Promise<boolean> {
  return (await sessionKind()) === 'anonymous'
}

/** The current user, or null. Unlike ensureSession() this never **creates** one, which is what makes
 *  it the only way the restore path may resolve a user: see fetchBackup. */
export async function currentUserId(): Promise<string | null> {
  const client = await sb()
  if (!client) return null
  try { return (await client.auth.getSession()).data.session?.user?.id ?? null } catch { return null }
}

export async function signOut(): Promise<void> {
  const client = await sb()
  if (client) { try { await client.auth.signOut() } catch { /* the caller's rows are its own concern */ } }
}

/** Give up this session's own profiles, passports and backups rows, through the own-row policies, so
 *  the identity about to be abandoned does not sit frozen in someone else's crew list under a code
 *  nobody can reach again. Deliberately **not** deleteMyData(): that RPC also deletes groups this
 *  user owns (migration 207) and memberships.group_id cascades (64), so using it here would destroy
 *  a family group for every other member because one member signed in. */
export async function discardGuestRows(): Promise<boolean> {
  const client = await sb()
  if (!client) return false // no backend at all; signInWithGoogle has already given up in that case
  const uid = await currentUserId()
  // No session is not a failure: there is nothing to discard, signInWithOAuth needs no session, and
  // reporting false here would leave a phone that has never completed a sync unable to sign in.
  if (!uid) return true
  for (const table of ['profiles', 'passports', 'backups']) {
    const { error } = await client.from(table).delete().eq('user_id', uid)
    if (error) return false
  }
  return true
}

/** Leaves for Google, so a 'redirecting' result means this page is going away. The caller says what
 *  happened when it is not, which is the point of returning a result at all: 037be89 swallowed the
 *  error and the sheet would simply have appeared to do nothing. */
export async function signInWithGoogle(redirectTo: string, mode: 'link' | 'fresh'): Promise<'redirecting' | 'unavailable' | 'failed'> {
  const client = await sb()
  if (!client) return 'failed'
  // 'fresh' abandons this identity for another account's, so its rows go first. If they will not go,
  // nothing is attempted: signing into A1 while A2's rows survive is the exact ghost this prevents.
  if (mode === 'fresh' && !(await discardGuestRows())) return 'failed'
  const kind = await sessionKind()
  try {
    // 'link' upgrades the session in place, so the user id and every row under it survive. With no
    // session there is no identity to link to and linkIdentity would only error, so that case signs
    // in whatever the mode says. It never signs out first: a guest who cancels at Google still holds
    // the same user id and code, and the next sync republishes the rows just deleted, so a cancelled
    // attempt costs a round trip rather than an identity.
    const { error } = mode === 'link' && kind !== 'none'
      ? await client.auth.linkIdentity({ provider: 'google', options: { redirectTo } })
      : await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (!error) return 'redirecting'
    // The provider is off, or manual linking is: a gate Charles has not opened yet rather than a
    // fault, so the sheet says so and leaves the button live. `code` is only present on newer GoTrue
    // responses, which is why the message test is here as the fallback rather than as the test.
    const code = (error as { code?: string }).code
    if (code === 'provider_disabled' || code === 'manual_linking_disabled') return 'unavailable'
    if (/not enabled|unsupported provider|manual linking/i.test(error.message || '')) return 'unavailable'
    return 'failed'
  } catch { return 'failed' }
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

/** 'none' = there is no backup row, so there is nothing to bring back and publishing over it is
 *  safe; null = the call did not answer, and then we must not write a possibly empty passport over a
 *  backup we could not read. The two lead to opposite actions, which is why they are told apart at
 *  all, exactly as joinGroup tells 'invalid' from null below.
 *  The user is resolved with currentUserId() and not ensureSession(): ensureSession **creates** an
 *  anonymous user, so a restore that used it would mint a user, defeat ?nosync, and then read an
 *  empty row belonging to a stranger it had just invented. */
export async function fetchBackup(cruiseId: string): Promise<{ state: unknown; updatedAt: number } | 'none' | null> {
  const client = await sb()
  const uid = await currentUserId()
  if (!client || !uid) return null
  const { data, error } = await client.from('backups').select('state, updated_at').eq('user_id', uid).eq('cruise_id', cruiseId).maybeSingle()
  if (error) return null
  if (!data) return 'none'
  return { state: data.state, updatedAt: new Date(data.updated_at).getTime() }
}

/** Every backup row this user owns, newest first. `backups` RLS is own-row ("own backup" for all,
 *  using auth.uid() = user_id, 0001_init.sql), so a plain select is the whole query: no RPC, no
 *  policy change, no schema change. It is how a phone learns about a sailing it has never been on,
 *  since fetchBackup only ever asks for the cruise id this phone already holds.
 *  The file's standing contract holds: it never throws, null means the call did not answer, and []
 *  means you own none. A caller that conflated the two would read a failed request as "you have no
 *  sailings" and adopt nothing while reporting success. currentUserId() rather than ensureSession(),
 *  for the reason fetchBackup gives above. */
export async function listBackups(): Promise<{ cruiseId: string; state: unknown; updatedAt: number }[] | null> {
  const client = await sb()
  const uid = await currentUserId()
  if (!client || !uid) return null
  const { data, error } = await client
    .from('backups').select('cruise_id, state, updated_at')
    .eq('user_id', uid).order('updated_at', { ascending: false })
  if (error || !data) return null
  return data.map((row) => ({
    cruiseId: String(row.cruise_id),
    state: row.state,
    updatedAt: new Date(row.updated_at).getTime(),
  }))
}

/** My own profiles row: the canonical friend code, and the name and colour that go with it. Same
 *  three-way return and the same currentUserId() rule as fetchBackup, for the same reasons.
 *  `code` is what every friend edge of this account already points at, so adopting it is what keeps
 *  those edges live (see sync.ts, restoreNow). name and colour are read as well because `profiles`
 *  is global across sailings: an account whose backup for *this* sailing is 'none' may still carry a
 *  name from a previous one, and taking it when the local name is empty is the rule mergeProfile
 *  already applies. */
export async function fetchProfile(): Promise<{ code: string; name: string; colour: string } | 'none' | null> {
  const client = await sb()
  const uid = await currentUserId()
  if (!client || !uid) return null
  const { data, error } = await client.from('profiles').select('code, name, colour').eq('user_id', uid).maybeSingle()
  if (error) return null
  if (!data) return 'none'
  return { code: data.code ?? '', name: data.name ?? '', colour: data.colour ?? '' }
}

export async function befriend(code: string): Promise<boolean> {
  const client = await sb()
  if (!client || !(await ensureSession())) return false
  const { error } = await client.rpc('befriend', { p_code: code })
  return !error
}

/** Find people by name (whole-word prefixes, two characters on) or by an exact code, hyphen optional.
 *  Named profiles only, never the caller, eight at most (supabase/migrations/0003_find_profiles.sql).
 *  null = the call did not answer, which the sheet shows as no connection; [] = nobody matched. The
 *  two are different answers, as with the feeds, and the caller must not read one as the other. */
export async function findProfiles(q: string): Promise<FoundProfile[] | null> {
  const client = await sb()
  if (!client || !(await ensureSession())) return null
  const { data, error } = await client.rpc('find_profiles', { p_q: q })
  if (error || !Array.isArray(data)) return null
  return data.map((r) => {
    const row = r as { code: string; name: string; colour: string }
    return { code: row.code, name: row.name, colour: row.colour }
  })
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
  await signOut() // one way to end a session, so a later sign-in path cannot grow a second
  return true
}
