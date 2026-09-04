// Foreground sync. One transport (Supabase) behind an offline-first envelope: publish profile,
// passport and backup, pull the friend and group feeds, then hand both to applyFeed, which is the
// single merge path shared with QR and paste. Success = a confirmed response, never navigator.onLine.
//   - backend (Supabase configured): publish and pull.
//   - off     (guest): nothing.
import { create } from 'zustand'
import {
  befriend, ensureSession, friendFeed, groupFeed, hasBackend, joinGroup, myGroups,
  publishBackup, publishPassport, unfriend, upsertProfile,
} from './backend'
import { qaNoSync } from '../data/model'
import { buildPayload } from './share'
import type { Friend } from './stats'
import { useStore } from './store'

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'held' | 'error'

interface SyncState { status: SyncStatus; lastSyncedAt: number | null; pending: boolean }
export const useSyncStore = create<SyncState>()(() => ({ status: 'off', lastSyncedAt: null, pending: false }))

const BACKOFF_MS = [5_000, 15_000, 60_000]
let backoffAttempt = 0
let backoffTimer: ReturnType<typeof setTimeout> | undefined
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let visibleInterval: ReturnType<typeof setInterval> | undefined
let activeSync: Promise<void> | null = null
let localRevision = 0

type Mode = 'backend' | 'off'
// ?nosync (QA) keeps a headless run off the backend: see qaNoSync() in data/model.ts
function mode(): Mode {
  return hasBackend() && !qaNoSync() ? 'backend' : 'off'
}

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
  const profileOk = s.profile.code
    ? await upsertProfile(s.profile.code, s.profile.name || 'A friend', s.profile.colour || 'aqua')
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
  if (mode() === 'off') { clearBackoff(); useSyncStore.setState({ status: 'off', pending: false }); return }
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

// Work the server has not seen yet: a friend added by QR, link or paste needs an edge, and a queued
// invite or removal needs replaying. Counted, not compared by reference, because the pull's own
// applyFeed rebuilds `friends` every time and would otherwise mark itself pending for ever; and
// only an increase counts, so clearing the queues does not schedule another round trip.
const unsent = (s: ReturnType<typeof useStore.getState>): number =>
  s.friends.reduce((n, f) => n + (f.needsEdge ? 1 : 0), 0) + s.pendingInvites.length + s.pendingUnfriends.length

useStore.subscribe((state, previous) => {
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
    queueMicrotask(() => { void syncNow() })
  }
}
