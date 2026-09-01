// Foreground sync. Two transports behind one offline-first envelope; the merge stays the single path
// (importFriendPayload, shared with QR/paste). Success = a confirmed response, never navigator.onLine.
//   - backend mode  (Supabase configured): publish profile+passport+backup, pull friend & group feeds.
//   - worker mode    (legacy Cloudflare group mailbox): PUT/GET /g/:group/:member. Fallback only.
//   - off            (guest): nothing.
import { create } from 'zustand'
import {
  befriend, ensureSession, friendFeed, groupFeed, hasBackend, myGroups,
  publishBackup, publishPassport, upsertProfile,
} from './backend'
import { buildPayload, type SharePayload } from './share'
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

type Mode = 'backend' | 'worker' | 'off'
function mode(): Mode {
  if (hasBackend()) return 'backend'
  return workerConfig() ? 'worker' : 'off'
}

// ── legacy worker transport (fallback when no Supabase backend is configured) ──
function workerConfig(): { base: string; group: string; memberId: string } | null {
  const { profile } = useStore.getState()
  const base = (profile.syncUrl?.trim() || import.meta.env.VITE_SYNC_URL?.trim() || '').replace(/\/+$/, '')
  const group = profile.groupCode?.trim() || ''
  const memberId = profile.id?.trim() || ''
  if (!base || !group || !memberId) return null
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(group) || !/^[A-Za-z0-9_-]{1,64}$/.test(memberId)) return null
  return { base, group, memberId }
}

async function request(url: string, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try { return await fetch(url, { ...init, signal: controller.signal }) } catch { return null } finally { clearTimeout(timeout) }
}

// ── shared scheduling machinery ──
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
  await upsertProfile(s.profile.code || '', s.profile.name || 'A friend', s.profile.colour || 'aqua')
  const ok = await publishPassport(s.cruiseId, buildPayload(s.me, s.profile))
  void publishBackup(s.cruiseId, { me: s.me, custom: s.custom, profile: s.profile }) // best-effort
  return ok
}
async function pullBackend(): Promise<boolean> {
  const s = useStore.getState()
  if (!(await ensureSession())) return false
  // Establish/repair the mutual edge for everyone I've added (idempotent; both directions, so no
  // accept flow — they see me back on their next pull). Small N on a cruise, so cheap.
  const codes = [...new Set(s.friends.map((f) => f.code).filter((c): c is string => Boolean(c)))]
  await Promise.all(codes.map((c) => befriend(c)))
  const [friends, coMembers, groups] = await Promise.all([
    friendFeed(s.cruiseId), groupFeed(s.cruiseId), myGroups(s.cruiseId),
  ])
  const merge = useStore.getState().importFriendPayload
  for (const row of [...friends, ...coMembers]) if (row?.payload) merge(row.payload)
  useStore.getState().setGroups(groups)
  return true
}

// ── worker transport ──
async function publishWorker(config: { base: string; group: string; memberId: string }): Promise<boolean> {
  const s = useStore.getState()
  const payload = buildPayload(s.me, s.profile)
  const res = await request(`${config.base}/g/${encodeURIComponent(config.group)}/${encodeURIComponent(config.memberId)}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ payload }),
  })
  return Boolean(res && res.status === 200)
}
async function pullWorker(config: { base: string; group: string; memberId: string }): Promise<boolean> {
  const res = await request(`${config.base}/g/${encodeURIComponent(config.group)}`)
  if (!res || res.status !== 200) return false
  try {
    const data = await res.json() as { members?: Array<{ id: string; payload: SharePayload }> }
    if (!Array.isArray(data.members)) return false
    for (const m of data.members) if (m && m.id !== config.memberId && m.payload) useStore.getState().importFriendPayload(m.payload)
    return true
  } catch { return false }
}

async function runSync() {
  const m = mode()
  if (m === 'off') { clearBackoff(); useSyncStore.setState({ status: 'off', pending: false }); return }
  useSyncStore.setState({ status: 'syncing' })
  const publishedRevision = localRevision
  let pulled = false, published = true
  if (m === 'backend') {
    pulled = await pullBackend()
    if (useSyncStore.getState().pending) published = await publishBackend()
  } else {
    const config = workerConfig()!
    pulled = await pullWorker(config)
    if (useSyncStore.getState().pending) published = await publishWorker(config)
  }
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

/** Force a pull now (e.g. after creating/joining a group), regardless of pending. */
export function refreshNow(): Promise<void> {
  useSyncStore.setState((s) => ({ pending: s.pending }))
  return syncNow()
}

useStore.subscribe((state, previous) => {
  if (state.me !== previous.me || state.profile !== previous.profile) markPending()
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
