import { create } from 'zustand'
import { buildPayload, type SharePayload } from './share'
import { useStore } from './store'

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'held' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: number | null
  pending: boolean
}

export const useSyncStore = create<SyncState>()(() => ({
  status: 'off',
  lastSyncedAt: null,
  pending: false,
}))

const BACKOFF_MS = [5_000, 15_000, 60_000]
let backoffAttempt = 0
let backoffTimer: ReturnType<typeof setTimeout> | undefined
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let visibleInterval: ReturnType<typeof setInterval> | undefined
let activeSync: Promise<void> | null = null
let localRevision = 0

export function syncConfig(): { base: string; group: string; memberId: string } | null {
  const { profile } = useStore.getState()
  const base = (profile.syncUrl?.trim() || import.meta.env.VITE_SYNC_URL?.trim() || '').replace(/\/+$/, '')
  const group = profile.groupCode?.trim() || ''
  const memberId = profile.id?.trim() || ''
  if (!base || !group || !memberId) return null
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(group) || !/^[A-Za-z0-9_-]{1,64}$/.test(memberId)) return null
  return { base, group, memberId }
}

function clearBackoff() {
  if (backoffTimer) clearTimeout(backoffTimer)
  backoffTimer = undefined
  backoffAttempt = 0
}

function scheduleBackoff() {
  if (backoffTimer || !syncConfig()) return
  const delay = BACKOFF_MS[Math.min(backoffAttempt, BACKOFF_MS.length - 1)]
  backoffAttempt++
  backoffTimer = setTimeout(() => {
    backoffTimer = undefined
    void syncNow()
  }, delay)
}

function holdPending() {
  useSyncStore.setState({ status: 'held', pending: true })
  scheduleBackoff()
}

function markPending() {
  localRevision++
  if (!syncConfig()) {
    clearBackoff()
    updateVisibleInterval()
    useSyncStore.setState({ status: 'off', pending: false })
    return
  }
  updateVisibleInterval()
  useSyncStore.setState((state) => ({ pending: true, status: state.status === 'syncing' ? 'syncing' : 'idle' }))
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { void syncNow() }, 2_000)
}

async function request(url: string, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function publishMine(): Promise<boolean> {
  const config = syncConfig()
  if (!config) {
    useSyncStore.setState({ status: 'off', pending: false })
    return false
  }
  useSyncStore.setState({ status: 'syncing' })
  const state = useStore.getState()
  const payload = buildPayload(state.me, state.profile)
  const publishedRevision = localRevision
  const response = await request(`${config.base}/g/${encodeURIComponent(config.group)}/${encodeURIComponent(config.memberId)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload }),
  })
  if (!response || response.status !== 200) {
    holdPending()
    return false
  }
  clearBackoff()
  const changedWhilePublishing = localRevision !== publishedRevision
  useSyncStore.setState({ status: 'idle', pending: changedWhilePublishing, lastSyncedAt: Date.now() })
  if (changedWhilePublishing) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { void syncNow() }, 2_000)
  }
  return true
}

interface MembersResponse {
  members: Array<{ id: string; payload: SharePayload; updatedAt: number }>
}

export async function pullFriends(): Promise<boolean> {
  const config = syncConfig()
  if (!config) {
    useSyncStore.setState({ status: 'off', pending: false })
    return false
  }
  const response = await request(`${config.base}/g/${encodeURIComponent(config.group)}`)
  if (!response || response.status !== 200) return false
  try {
    const data = await response.json() as MembersResponse
    if (!Array.isArray(data.members)) return false
    for (const member of data.members) {
      if (member && member.id !== config.memberId && member.payload) {
        useStore.getState().importFriendPayload(member.payload)
      }
    }
    return true
  } catch {
    return false
  }
}

async function runSync() {
  const config = syncConfig()
  if (!config) {
    clearBackoff()
    useSyncStore.setState({ status: 'off', pending: false })
    return
  }
  useSyncStore.setState({ status: 'syncing' })
  const pulled = await pullFriends()
  let published = true
  if (useSyncStore.getState().pending) published = await publishMine()
  if (!pulled) {
    if (useSyncStore.getState().pending || !published) holdPending()
    else useSyncStore.setState({ status: 'error' })
  } else if (published) {
    clearBackoff()
    useSyncStore.setState((state) => ({ status: 'idle', lastSyncedAt: state.lastSyncedAt ?? Date.now() }))
  }
}

export function syncNow(): Promise<void> {
  if (activeSync) return activeSync
  activeSync = runSync().catch(() => { holdPending() }).finally(() => { activeSync = null })
  return activeSync
}

useStore.subscribe((state, previous) => {
  if (state.me !== previous.me || state.profile !== previous.profile) markPending()
})

function updateVisibleInterval() {
  if (visibleInterval) clearInterval(visibleInterval)
  visibleInterval = undefined
  if (document.visibilityState === 'visible' && syncConfig()) {
    visibleInterval = setInterval(() => { void syncNow() }, 60_000)
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('online', () => { void syncNow() })
  document.addEventListener('visibilitychange', () => {
    updateVisibleInterval()
    if (document.visibilityState === 'visible') void syncNow()
  })
  updateVisibleInterval()
  if (syncConfig()) {
    useSyncStore.setState({ status: 'idle', pending: true })
    queueMicrotask(() => { void syncNow() })
  }
}
