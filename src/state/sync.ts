// Foreground sync. One transport (Supabase) behind an offline-first envelope: publish profile,
// passport and backup, pull the friend and group feeds, then hand both to applyFeed, which is the
// single merge path shared with QR and paste. Success = a confirmed response, never navigator.onLine.
//   - backend (Supabase configured): publish and pull.
//   - off     (guest): nothing.
import { create } from 'zustand'
import {
  befriend, ensureSession, fetchBackup, fetchProfile, friendFeed, groupFeed, hasBackend, joinGroup,
  myGroups, oauthError, publishBackup, publishPassport, sessionKind, signInWithGoogle, unfriend,
  upsertProfile, type SessionKind,
} from './backend'
import { qaNoSync } from '../data/model'
import { isUntouched, mergeProfile, mergeRestore, readBackup, type BackupState } from './restore'
import { buildPayload } from './share'
import type { Friend, Profile } from './stats'
import { useStore } from './store'

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'held' | 'error'
export type AccountState = 'off' | 'guest' | 'saved'
export type RestoreState =
  'idle' | 'working' | 'done' | 'empty' | 'failed' | 'linked' | 'unavailable' | 'failed-signin'

interface SyncState {
  status: SyncStatus; lastSyncedAt: number | null; pending: boolean
  account: AccountState
  restore: RestoreState
  restored: number
}
// account starts at the truthful default for almost everyone: a build with no backend has nothing to
// sign in to, and everyone else is a guest until the launch check says otherwise. That check finishes
// long before the sheet can be opened, so there is no flash of the wrong line. There is deliberately
// no restoreAt: the 'done' line clears itself on a timer, so nothing needs to store when it happened.
export const useSyncStore = create<SyncState>()(() => ({
  status: 'off', lastSyncedAt: null, pending: false,
  account: hasBackend() ? 'guest' : 'off',
  restore: 'idle',
  restored: 0,
}))

const BACKOFF_MS = [5_000, 15_000, 60_000]
let backoffAttempt = 0
let backoffTimer: ReturnType<typeof setTimeout> | undefined
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let visibleInterval: ReturnType<typeof setInterval> | undefined
let activeSync: Promise<void> | null = null
let localRevision = 0
// Set between discardGuestRows() and the browser actually leaving for Google; see runSync. Cleared
// only when the sign-in did not redirect, because a page that is leaving has no later state to keep.
let leaving = false
let doneTimer: ReturnType<typeof setTimeout> | undefined

type Mode = 'backend' | 'off'
// Nothing signs in, nothing publishes and nothing pulls before Done on the first-open screen. The
// consent line there says what sync does, and it would be false if this file published at module
// load as it used to. Safe to read at load: the persist middleware hydrates synchronously from
// localStorage, which is why store.ts can call ensureIdentity() at module scope.
// ?nosync (QA) keeps a headless run off the backend: see qaNoSync() in data/model.ts
function mode(): Mode {
  if (!useStore.getState().enteredCruise) return 'off'
  return hasBackend() && !qaNoSync() ? 'backend' : 'off'
}

// ── QA overrides ──
// ?qa=account:saved,restore:done,restored:58,sync:held,signedin:1. Comma-separated key:value pairs,
// parsed once. The same family as ?day= and ?hour= in data/model.ts, and it changes nothing for a
// real session. Values off the lists below are ignored rather than trusted.
const ACCOUNTS: readonly string[] = ['off', 'guest', 'saved']
const RESTORES: readonly string[] = ['idle', 'working', 'done', 'empty', 'failed', 'linked', 'unavailable', 'failed-signin']
const STATUSES: readonly string[] = ['off', 'idle', 'syncing', 'held', 'error']

interface QaOverrides { account?: AccountState; restore?: RestoreState; restored?: number; sync?: SyncStatus; signedin?: boolean }
function qaOverrides(): QaOverrides {
  const out: QaOverrides = {}
  if (typeof location === 'undefined') return out
  const raw = new URLSearchParams(location.search).get('qa')
  if (!raw) return out
  for (const pair of raw.split(',')) {
    const at = pair.indexOf(':')
    if (at < 0) continue
    const key = pair.slice(0, at).trim()
    const value = pair.slice(at + 1).trim()
    if (key === 'account' && ACCOUNTS.includes(value)) out.account = value as AccountState
    else if (key === 'restore' && RESTORES.includes(value)) out.restore = value as RestoreState
    else if (key === 'sync' && STATUSES.includes(value)) out.sync = value as SyncStatus
    else if (key === 'restored' && /^\d+$/.test(value)) out.restored = Number(value)
    else if (key === 'signedin') out.signedin = value === '1'
  }
  return out
}
const QA = qaOverrides()
// The four that are written into the store. When any of them is present the whole sync goes inert,
// so nothing the app does afterwards can overwrite the state being screenshotted: without it the
// first markPending() after hydration resets status and sync:held would never survive to the shutter.
const qaFrozen = QA.account !== undefined || QA.restore !== undefined || QA.restored !== undefined || QA.sync !== undefined
function applyQaState(): void {
  if (!qaFrozen) return
  const patch: Partial<SyncState> = {}
  if (QA.account !== undefined) patch.account = QA.account
  if (QA.restore !== undefined) patch.restore = QA.restore
  if (QA.restored !== undefined) patch.restored = QA.restored
  if (QA.sync !== undefined) patch.status = QA.sync
  useSyncStore.setState(patch)
}

/** signedin:1 is the opposite of the four above: it leaves sync running and makes the session read
 *  as signed in, so the whole restore path runs against the anonymous user's own rows. It is what
 *  makes the launch order testable against the real backend with no Google account. Both
 *  restoreOnLaunch and restoreNow go through here, not just the first: restoreNow re-checks the
 *  session and would otherwise bail on the very run this override exists to produce. */
async function kind(): Promise<SessionKind> {
  return QA.signedin ? 'signed-in' : await sessionKind()
}

// The mode the guest asked for, held across the redirect. sessionStorage, not local: a tab that
// never came back must not force a restore next week. Every read and write is wrapped, exactly as
// data/cruises.ts 44 to 57 does, because storage can be blocked.
const SIGNIN_KEY = 'spcc-signin'
function readSignIn(): 'link' | 'fresh' | null {
  try {
    const v = sessionStorage.getItem(SIGNIN_KEY)
    return v === 'link' || v === 'fresh' ? v : null
  } catch { return null }
}
function writeSignIn(m: 'link' | 'fresh'): void { try { sessionStorage.setItem(SIGNIN_KEY, m) } catch { /* blocked */ } }
function clearSignIn(): void { try { sessionStorage.removeItem(SIGNIN_KEY) } catch { /* blocked */ } }

// ── scheduling machinery ──
function clearBackoff() { if (backoffTimer) clearTimeout(backoffTimer); backoffTimer = undefined; backoffAttempt = 0 }
function scheduleBackoff() {
  if (backoffTimer || mode() === 'off') return
  const delay = BACKOFF_MS[Math.min(backoffAttempt, BACKOFF_MS.length - 1)]
  backoffAttempt++
  backoffTimer = setTimeout(() => { backoffTimer = undefined; void syncNow() }, delay)
}
function holdPending() { useSyncStore.setState({ status: 'held', pending: true }); scheduleBackoff() }

function markPending() {
  if (qaFrozen) return // the screenshot's state is the point; nothing may write over it
  localRevision++
  if (mode() === 'off') {
    clearBackoff(); updateVisibleInterval(); useSyncStore.setState({ status: 'off', pending: false }); return
  }
  updateVisibleInterval()
  useSyncStore.setState((s) => ({ pending: true, status: s.status === 'syncing' ? 'syncing' : 'idle' }))
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { void syncNow() }, 2_000)
}

// ── backend (Supabase) transport ──
async function publishBackend(): Promise<boolean> {
  const s = useStore.getState()
  if (!(await ensureSession())) return false
  // `code` is unique, so a blank one is never worth writing; every real profile has one (the store
  // stamps it at hydrate). A failed profile write is a failed sync: the feeds are authoritative for
  // name and colour, so silently reporting success would leave the crew on a stale name for ever.
  // No fallback name. `profiles.name` is the column find_profiles, friend_feed and group_feed all
  // read, so it is never given a name the guest did not type; find_profiles already excludes an empty
  // one (coalesce(p.name, '') <> ''), so an unnamed guest is simply not findable rather than findable
  // as somebody called "A friend". The four display fallbacks are client-side and unchanged, and
  // share.ts 92 still puts the literal in passports.payload.n, which no SQL reads and parseFriend
  // normalises on receipt: deliberate, and out of this workstream's scope.
  const profileOk = s.profile.code
    ? await upsertProfile(s.profile.code, s.profile.name, s.profile.colour || 'aqua')
    : true
  const ok = await publishPassport(s.cruiseId, buildPayload(s.me, s.profile))
  void publishBackup(s.cruiseId, { me: s.me, custom: s.custom, profile: s.profile }) // best-effort
  return ok && profileOk
}

/** Replay invites tapped while offline. A code the server rejects outright is dropped rather than
 *  retried for the rest of the cruise; only a call that did not answer stays queued. */
async function replayInvites(): Promise<void> {
  const queued = useStore.getState().pendingInvites
  if (!queued.length) return
  const results = await Promise.all(queued.map((code) => joinGroup(code).catch(() => null)))
  const left = queued.filter((_, i) => results[i] === null)
  if (left.length === queued.length) return
  // Anything queued while this was in flight is kept: the snapshot must not overwrite it.
  const since = useStore.getState().pendingInvites.filter((c) => !queued.includes(c))
  useStore.getState().setPendingInvites([...left, ...since])
}

/** Replay removals the server never confirmed. Until one lands, applyFeed ignores that person's row,
 *  so the queue is what keeps a removal made with no signal from quietly undoing itself. */
async function replayUnfriends(): Promise<void> {
  const queued = useStore.getState().pendingUnfriends
  if (!queued.length) return
  const results = await Promise.all(queued.map((code) => unfriend(code).catch(() => false)))
  const left = queued.filter((_, i) => !results[i])
  if (left.length === queued.length) return
  const since = useStore.getState().pendingUnfriends.filter((c) => !queued.includes(c))
  useStore.getState().setPendingUnfriends([...left, ...since])
}

async function pullBackend(): Promise<boolean> {
  const s = useStore.getState()
  if (!(await ensureSession())) return false
  await Promise.all([replayInvites(), replayUnfriends()])
  // Ask for the mutual edge only where one is still owed (idempotent; both directions, so no accept
  // flow: they see me back on their next pull). Blanket-befriending the whole roster would rebuild
  // the edge the other side has just cut. Group-only people are never befriended, or every
  // co-member would silently become a permanent friend.
  const codes = [...new Set(s.friends.filter((f) => !f.groupOnly && f.needsEdge).map((f) => f.code).filter((c): c is string => Boolean(c)))]
  await Promise.all(codes.map((c) => befriend(c)))
  const [friends, coMembers, groups] = await Promise.all([
    friendFeed(s.cruiseId), groupFeed(s.cruiseId), myGroups(s.cruiseId),
  ])
  // A call that did not answer is not "you have nobody": hold and retry rather than writing an
  // empty roster over a good one and calling it a successful sync.
  if (!friends || !coMembers || !groups) return false
  // Snapshot the roster as it stands at this instant (not `s`, which was read several awaits ago),
  // so the merge below can tell a friend the server introduced from one this phone asked for.
  const before = useStore.getState().friends
  useStore.getState().applyFeed(friends, coMembers)
  useStore.getState().setGroups(groups)
  announceAdded(before, useStore.getState().friends)
  return true
}

/** "Sam added you". A tapped link is mutual, so the sender is told by the pull that brings the new
 *  edge back and nothing else: they never saw the tick, because the tap was on the other phone.
 *  Only a direct friend the server introduced counts — one this phone added still carries needsEdge
 *  on its old record — and never on a pull whose previous roster was empty (a first sync, a restore,
 *  a delete-my-data), where everyone is new and the guest would get a screenful. */
function announceAdded(before: Friend[], after: Friend[]): void {
  if (!before.length || typeof window === 'undefined') return
  const was = new Map(before.filter((f) => f.code).map((f) => [f.code!, f]))
  for (const friend of after) {
    if (friend.groupOnly || !friend.code) continue
    const previous = was.get(friend.code)
    if (previous && !previous.groupOnly) continue // already a direct friend before this pull
    if (previous?.needsEdge) continue             // this phone asked for the edge; it is not news
    window.dispatchEvent(new CustomEvent('crew:added', { detail: { name: friend.name } }))
  }
}

async function runSync() {
  // A 'fresh' sign-in has just deleted this session's rows and the browser has not left yet. Three
  // timers can fire into that window (the 2s debounce, the 60s visible interval, the backoff) and
  // pending is almost always true, so without this publishBackend would write the profile, passport
  // and backup straight back and the real account would sign in over a live guest.
  if (leaving) return
  if (mode() === 'off') { clearBackoff(); useSyncStore.setState({ status: 'off', pending: false }); return }
  // Restore reads the server before anything of ours is published over it. restoreNow calls nothing
  // that leads back here, so this can never wait on itself.
  await booting
  // "It will try again" has to be true rather than a permanently shut gate: the backoff in
  // scheduleBackoff() is what re-enters runSync, so a failed restore gets one more go before this
  // round gives up.
  if (useSyncStore.getState().restore === 'failed') {
    await restoreNow()
    if (useSyncStore.getState().restore === 'failed') { holdPending(); return }
  }
  useSyncStore.setState({ status: 'syncing' })
  const publishedRevision = localRevision
  // Publish first: `befriend` and both feeds resolve me through my own profiles row, so on a first
  // run the pull would do nothing at all if the row did not exist yet.
  const published = useSyncStore.getState().pending ? await publishBackend() : true
  const pulled = await pullBackend()
  if (!pulled || !published) { holdPending(); return }
  clearBackoff()
  const changedWhilePublishing = localRevision !== publishedRevision
  useSyncStore.setState({ status: 'idle', pending: changedWhilePublishing, lastSyncedAt: Date.now() })
  if (changedWhilePublishing) { if (debounceTimer) clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { void syncNow() }, 2_000) }
}

export function syncNow(): Promise<void> {
  if (qaFrozen) return Promise.resolve()
  if (activeSync) return activeSync
  activeSync = runSync().catch(() => { holdPending() }).finally(() => { activeSync = null })
  return activeSync
}

/** Force a genuinely fresh pull (e.g. after creating/joining a group). Joining an in-flight sync
 *  would resolve against a pull that read the server before the group existed, so wait for it and
 *  then start another: `activeSync` is cleared in its own finally, so this call is a new one. */
export function refreshNow(): Promise<void> {
  return activeSync ? activeSync.then(() => syncNow()) : syncNow()
}

// ── restore ──

/** A terminal restore state that is not a failure. 'done' clears itself, so opening the sheet an
 *  hour later does not report a restore as if it had just happened; the timer is set here rather
 *  than in the sheet, so it does not depend on the sheet being mounted. 'failed' never clears
 *  itself, because it is still true. The sign-in key goes on any terminal state but 'failed', where
 *  it is left in place so the retry still counts as a restore the guest asked for. */
function settle(restore: 'done' | 'empty', restored: number): void {
  useSyncStore.setState({ restore, restored })
  clearSignIn()
  if (restore !== 'done') return
  if (doneTimer) clearTimeout(doneTimer)
  doneTimer = setTimeout(() => {
    if (useSyncStore.getState().restore === 'done') useSyncStore.setState({ restore: 'idle', restored: 0 })
  }, 8_000)
}

/** Bring the passport back and fold it into whatever is on this phone. Makes no sync call of its
 *  own: applyRestore changes the profile, the subscription below marks the sync pending, and the
 *  pull that booting.then fires brings the crew back under the canonical code. */
async function restoreNow(): Promise<void> {
  // Re-check the session first, so the retry inside runSync can never shut the publish gate for
  // ever on a session that has gone away.
  if ((await kind()) !== 'signed-in') { useSyncStore.setState({ restore: 'idle' }); return }
  useSyncStore.setState({ restore: 'working' })
  const s = useStore.getState()
  const [profileRow, backupRow] = await Promise.all([fetchProfile(), fetchBackup(s.cruiseId)])
  // A call that did not answer is the one unrecoverable case here: writing a possibly empty passport
  // over a backup we could not read cannot be undone, so the publish gate stays shut.
  if (profileRow === null || backupRow === null) { useSyncStore.setState({ restore: 'failed' }); return }

  const server = profileRow === 'none' ? null : profileRow
  const canonicalCode = server && server.code ? server.code : undefined
  const local: BackupState = { me: s.me, custom: s.custom, profile: s.profile }
  // A malformed row is treated as no backup at all (readBackup returns null), which is what 'empty'
  // says: there is nothing here worth acting on.
  const remote = backupRow === 'none' ? null : readBackup(backupRow.state)

  if (!remote) {
    // Nothing to bring back, but the canonical code still has to be adopted. profiles is global
    // across sailings while backups is not, so an account with friends from a previous sailing and
    // no backup on this one is exactly the case where skipping the rename orphans every edge. The
    // server's name and colour come with it, and mergeProfile takes them only when local is empty.
    if (server) {
      const fromServer: Profile = { ...local.profile, name: server.name || '', colour: server.colour || local.profile.colour }
      const profile = mergeProfile(local.profile, fromServer, canonicalCode)
      useStore.getState().applyRestore({
        me: s.me, custom: s.custom, profile,
        adopted: 0, codeChanged: profile.code !== local.profile.code,
      })
    }
    settle('empty', 0)
    return
  }

  const result = mergeRestore(local, remote, { untouched: isUntouched(s), canonicalCode })
  useStore.getState().applyRestore(result)
  settle('done', result.adopted)
}

/** The launch check, in order. The whole body is one try/catch that never rethrows: booting must
 *  never reject, or `await booting` would throw into holdPending() on every retry for the rest of
 *  the session and booting.then(() => syncNow()) would never fire at all, so one thrown error in
 *  sessionKind() or a blocked sessionStorage would take the whole sync down with it. */
async function restoreOnLaunch(): Promise<void> {
  try {
    // No backend, or ?nosync, or a frozen QA state: no call is made at all, which is what keeps a
    // headless run from creating an anonymous user.
    if (mode() === 'off' || qaFrozen) return
    const asked = readSignIn()

    // The one state that cannot be known in advance: linkIdentity is refused because this Google
    // account already carries an identity. The anonymous session survives a URL login failure
    // (auth-js keeps it deliberately), which is what the confirm then acts as.
    const err = oauthError()
    if (err && (err.code === 'identity_already_exists' || /identity.*already.*(exist|link)/i.test(err.description))) {
      useSyncStore.setState({ restore: 'linked' })
      clearSignIn()
      return
    }

    const seen = await kind()
    if (seen !== 'signed-in') {
      // 'none' and 'anonymous' are both a guest. A sign-in that was asked for, with no OAuth error
      // in the URL and still no session: that is the cancelled-at-Google case.
      useSyncStore.setState({ account: 'guest' })
      if (asked) { useSyncStore.setState({ restore: 'failed-signin' }); clearSignIn() }
      return
    }

    useSyncStore.setState({ account: 'saved' })
    // Merging without being asked, on a phone already in use, is not a decision the app makes for
    // the guest: it runs on the next explicit sign-in instead.
    if (asked || isUntouched(useStore.getState())) await restoreNow()
  } catch {
    useSyncStore.setState({ restore: 'failed' })
  }
}

/** Leave for Google. 'fresh' when there is nothing local to preserve, which also skips the
 *  identity_already_exists round trip a new phone would otherwise always take; 'link' otherwise, so
 *  the user id and every row under it survive. */
export async function startSignIn(mode?: 'link' | 'fresh'): Promise<void> {
  const chosen = mode ?? (isUntouched(useStore.getState()) ? 'fresh' : 'link')
  writeSignIn(chosen)
  leaving = true
  const result = await signInWithGoogle(new URL(import.meta.env.BASE_URL, window.location.origin).href, chosen)
  if (result === 'redirecting') return // the page is going away; there is no later state to set
  leaving = false
  clearSignIn()
  useSyncStore.setState({ restore: result === 'unavailable' ? 'unavailable' : 'failed-signin' })
}

/** Give up the 'linked' decision and stay a guest. Everything is left exactly as it was. */
export function keepAsGuest(): void {
  useSyncStore.setState({ restore: 'idle' })
}

// One promise, named, created once, and created after backend.ts has been evaluated (it is imported
// at the top of this file), so oauthError() has already captured the URL.
const booting: Promise<void> = restoreOnLaunch()

// Work the server has not seen yet: a friend added by QR, link or paste needs an edge, and a queued
// invite or removal needs replaying. Counted, not compared by reference, because the pull's own
// applyFeed rebuilds `friends` every time and would otherwise mark itself pending for ever; and
// only an increase counts, so clearing the queues does not schedule another round trip.
const unsent = (s: ReturnType<typeof useStore.getState>): number =>
  s.friends.reduce((n, f) => n + (f.needsEdge ? 1 : 0), 0) + s.pendingInvites.length + s.pendingUnfriends.length

useStore.subscribe((state, previous) => {
  // Done on the first-open screen is what opens the gate above, and without this branch nothing would
  // sync after it either: the three tests below watch me, profile and unsent, and setProfile fires
  // while mode() is still off, so that change is swallowed and no publish is ever scheduled.
  // markPending() alone is enough and is what to write: it calls updateVisibleInterval() itself, so
  // the 60-second interval starts from the same call. Nothing is lost by publishing late, because
  // publishBackend reads the whole current store rather than a diff.
  if (state.enteredCruise && !previous.enteredCruise) { markPending(); return }
  if (state.me !== previous.me || state.profile !== previous.profile || unsent(state) > unsent(previous)) markPending()
})

function updateVisibleInterval() {
  if (visibleInterval) clearInterval(visibleInterval)
  visibleInterval = undefined
  if (document.visibilityState === 'visible' && mode() !== 'off') visibleInterval = setInterval(() => { void syncNow() }, 60_000)
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('online', () => { void syncNow() })
  document.addEventListener('visibilitychange', () => { updateVisibleInterval(); if (document.visibilityState === 'visible') void syncNow() })
  updateVisibleInterval()
  if (mode() !== 'off') {
    useSyncStore.setState({ status: 'idle', pending: true })
    // The restore reads the server before the first publish, and this is the single most important
    // ordering in the workstream: `pending` is true on the line above, so without it the first sync
    // would publish this phone's passport, backup included, and on a new phone that overwrites a
    // good backup with an empty one before anything has read it.
    void booting.then(() => syncNow())
  }
  // Last in the block, after the setState above, which also runs at module load and would otherwise
  // clobber sync:held before the shutter. Outside the mode() check on purpose: every screenshot
  // carries &nosync, so mode() is 'off' for all of them and the overrides would never be applied.
  applyQaState()
}
