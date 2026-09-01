// Group flows over the backend adapter. Create/join/leave then force a sync so the roster and the
// co-members' passports come straight back. Guarded: no backend => these return null (the UI hides
// itself). A join tapped with no signal is queued instead of lost, and replayed by the next pull.
import { activeCruiseId } from '../data/cruises'
import { createGroup, deleteGroup, hasBackend, joinGroup, leaveGroup } from './backend'
import { refreshNow } from './sync'
import { useStore } from './store'

const offline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

/** An invite code out of a raw code, a /join#CODE link, or a ?g=CODE one. */
function extractInvite(raw: string): string {
  let t = (raw || '').trim()
  const hash = t.lastIndexOf('#')
  if (hash > -1) t = t.slice(hash + 1)
  else {
    const query = /[?&]g=([^&\s]+)/.exec(t)
    if (query) t = query[1]
  }
  try { t = decodeURIComponent(t) } catch { /* keep it raw */ }
  return t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)
}

export async function createGroupFlow(name: string): Promise<{ invite: string } | null> {
  if (!hasBackend()) return null
  const result = await createGroup(name.trim() || 'Our group', useStore.getState().cruiseId || activeCruiseId())
  if (!result) return null
  await refreshNow()
  return { invite: result.invite }
}

export async function joinGroupFlow(invite: string): Promise<{ name?: string; queued?: boolean } | null> {
  if (!hasBackend()) return null
  const code = extractInvite(invite)
  if (!code) return null
  const queue = () => { useStore.getState().queueInvite(code); return { queued: true } }
  if (offline()) return queue()
  const result = await joinGroup(code)
  // Only the server saying there is no such group means a bad code. A call that did not answer is
  // patchy ship Wi-Fi, which navigator.onLine cannot see, so hold it and replay on the next pull.
  if (result === 'invalid') return null
  if (!result) return queue()
  await refreshNow()
  return { name: result.name }
}

export async function leaveGroupFlow(id: string): Promise<boolean> {
  if (!hasBackend()) return false
  const ok = await leaveGroup(id)
  if (ok) await refreshNow()
  return ok
}

/** The owner's version of leaving: the group and every membership go with it. */
export async function deleteGroupFlow(id: string): Promise<boolean> {
  if (!hasBackend()) return false
  const ok = await deleteGroup(id)
  if (ok) await refreshNow()
  return ok
}

/** A shareable join link. Text it and one tap adds the whole group. */
export function groupInviteLink(invite: string): string {
  return `${location.origin}${import.meta.env.BASE_URL}join#${invite}`
}
