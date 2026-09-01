// Group flows over the backend adapter. Create/join then force a sync so the roster + co-members'
// passports come straight back. Guarded: no backend => these return null (the UI hides itself).
import { activeCruiseId } from '../data/cruises'
import { createGroup, hasBackend, joinGroup } from './backend'
import { refreshNow } from './sync'
import { useStore } from './store'

export async function createGroupFlow(name: string): Promise<{ invite: string } | null> {
  if (!hasBackend()) return null
  const result = await createGroup(name.trim() || 'Our group', useStore.getState().cruiseId || activeCruiseId())
  if (!result) return null
  await refreshNow()
  return { invite: result.invite }
}

export async function joinGroupFlow(invite: string): Promise<{ name: string } | null> {
  if (!hasBackend()) return null
  const result = await joinGroup(invite.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''))
  if (!result) return null
  await refreshNow()
  return { name: result.name }
}

/** A shareable join link. Text it and one tap adds the whole group. */
export function groupInviteLink(invite: string): string {
  return `${location.origin}${import.meta.env.BASE_URL}join#${invite}`
}
