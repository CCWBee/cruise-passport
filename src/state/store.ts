import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { activeCruiseId, CRUISES, setActiveCruise } from '../data/cruises'
import { DRINKS, today, type Drink } from '../data/model'
import { hasBackend, unfriend, type FeedRow, type GroupRow } from './backend'
import { emptyPassport, FRIEND_COLOURS, type Entry, type Passport, type Friend, type Profile, type FriendColour } from './stats'
import { decodeShare, ensureMyId, ensureMyCode, genCode, normaliseCode, parseFriend, ShareError, type SharePayload } from './share'

// re-export the social types/consts that used to live here, for existing call sites
export { FRIEND_COLOURS }
export type { Friend, FriendColour, Profile }

export interface Filters {
  venues: string[]
  decks: number[]
  spirits: string[]
  flavors: string[]
  cats: string[]
  pkg: 'any' | 'plus' | 'prem' | 'over'
  tried: boolean | null
  frozen: boolean
  fav: boolean
  wish: boolean
  top: boolean
}
export const emptyFilters = (): Filters => ({
  venues: [], decks: [], spirits: [], flavors: [], cats: [],
  pkg: 'any', tried: null, frozen: false, fav: false, wish: false, top: false,
})

interface State {
  me: Passport
  custom: Drink[]
  friends: Friend[]
  profile: Profile
  cruiseId: string
  enteredCruise: boolean
  groups: GroupRow[] // groups I'm in on this cruise (online; refreshed by sync, persisted so Social renders offline)
  pendingInvites: string[] // join codes tapped offline; replayed on the next successful pull
  pendingUnfriends: string[] // removals the server has not confirmed; replayed, and their feed rows ignored
  filters: Filters
  showFilters: boolean

  enterCruise: (id: string) => void
  setGroups: (g: GroupRow[]) => void
  queueInvite: (code: string) => void
  setPendingInvites: (codes: string[]) => void
  setPendingUnfriends: (codes: string[]) => void

  // entry mutations (self)
  patch: (id: string, o: Partial<Entry>) => void
  toggleTried: (id: string) => boolean // returns new tried value
  setRating: (id: string, n: number) => void
  toggle: (id: string, key: 'fav' | 'wish' | 'again') => void
  setNotes: (id: string, notes: string) => void
  setDate: (id: string, date: string) => void
  toggleVisit: (venueKey: string) => boolean
  addCustom: (d: Drink) => void

  // social
  ensureIdentity: () => void
  toggleRec: (id: string) => void
  setComment: (id: string, text: string) => void
  setProfile: (p: Partial<Profile>) => void
  upsertFriend: (f: Friend) => void
  removeFriend: (id: string) => Promise<void>
  importFriendPayload: (payload: SharePayload) => { ok: boolean; name?: string; reason?: string; stale?: boolean }
  importCode: (code: string) => Promise<{ ok: boolean; name?: string; reason?: string; stale?: boolean }>
  applyFeed: (direct: FeedRow[], group: FeedRow[]) => void
  resetSocialIdentity: () => void

  // filters
  setFilters: (f: Partial<Filters>) => void
  replaceFilters: (f: Filters) => void
  setShowFilters: (v: boolean) => void
  clearFilters: () => void
}

/** Match an incoming person against the roster: by code when both sides have one, else by id. Code
 *  wins so a synthesised pending row ("c:CODE") collapses into the real record, ids and all, the
 *  moment that person's own payload arrives. */
function matchFriend(friends: Friend[], incoming: { id: string; code?: string }): number {
  if (incoming.code) {
    const byCode = friends.findIndex((f) => f.code === incoming.code)
    if (byCode > -1) return byCode
  }
  return friends.findIndex((f) => f.id === incoming.id)
}

/** Adding someone back cancels a removal of them that never reached the server. */
const unblock = (queued: string[], code?: string): string[] =>
  (code && queued.includes(code) ? queued.filter((c) => c !== code) : queued)

// A feed row with no payload = they have joined but not synced yet. Stand in an identity card at
// ts 0, which always loses the staleness test, so it can never blank a snapshot we already hold.
const synthCard = (row: FeedRow): SharePayload => ({
  v: 2, id: 'c:' + row.code, n: row.name || 'A friend', c: row.colour || 'aqua',
  ts: 0, k: row.code, cd: 1, e: {}, s: {},
})

/** Fold one feed row into the roster. The row's identity (name, colour, code, group tags) is
 *  authoritative on every pull; the passport is only replaced by something genuinely newer. */
function foldRow(friends: Friend[], row: FeedRow, groupOnly: boolean): Friend[] {
  const payload = row.payload ?? synthCard(row)
  const incoming = parseFriend(payload)
  const at = matchFriend(friends, incoming)
  const existing = at > -1 ? friends[at] : undefined
  // A card carries no entries, so it never replaces a snapshot; nor does an older payload. A pending
  // record holds nothing worth keeping, so anything real overwrites it.
  const keep = Boolean(existing) && !existing!.pending
    && (Boolean(payload.cd) || existing!.exportedAt >= incoming.exportedAt)

  // Built field by field rather than spread from `existing` on purpose: `needsEdge` must not survive,
  // because arriving in a feed at all is the server confirming the edge we were asking for.
  const next: Friend = {
    // Only a real published payload may rename the record's id; a synthesised card must not.
    id: row.payload ? incoming.id : (existing?.id ?? incoming.id),
    name: (row.name || '').trim().slice(0, 24) || incoming.name,
    colour: (FRIEND_COLOURS as readonly string[]).includes(row.colour) ? row.colour : incoming.colour,
    code: normaliseCode(row.code) || incoming.code,
    passport: keep ? existing!.passport : incoming.passport,
    exportedAt: keep ? existing!.exportedAt : incoming.exportedAt,
  }
  if (!keep && incoming.pending) next.pending = true
  if (groupOnly) next.groupOnly = true
  const groupIds = row.groupIds ?? existing?.groupIds
  if (groupIds?.length) next.groupIds = groupIds
  return at > -1 ? friends.map((f, k) => (k === at ? next : f)) : [...friends, next]
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      me: emptyPassport(),
      custom: [],
      friends: [],
      profile: { id: '', name: '', colour: 'aqua' },
      cruiseId: activeCruiseId(),
      // With one sailing there is nothing to choose, so skip the picker entirely.
      enteredCruise: CRUISES.length === 1,
      groups: [],
      pendingInvites: [],
      pendingUnfriends: [],
      filters: emptyFilters(),
      showFilters: false,

      setGroups: (g) => set({ groups: g }),
      queueInvite: (code) => set((s) => (s.pendingInvites.includes(code) ? {} : { pendingInvites: [...s.pendingInvites, code] })),
      setPendingInvites: (codes) => set({ pendingInvites: codes }),
      setPendingUnfriends: (codes) => set({ pendingUnfriends: codes }),

      // Choose (or switch) the active cruise. First entry needs no reload (data already = default);
      // switching cruises re-inits the module-level dataset in model.ts, so it reloads.
      enterCruise: (id) => {
        const changing = id !== get().cruiseId
        setActiveCruise(id)
        set({ cruiseId: id, enteredCruise: true })
        if (changing && typeof location !== 'undefined') location.reload()
      },

      patch: (id, o) => set((s) => {
        const cur = s.me.entries[id] || {}
        const next: Entry = { ...cur, ...o }
        ;(Object.keys(next) as (keyof Entry)[]).forEach((k) => { if (next[k] === undefined) delete next[k] })
        return { me: { ...s.me, entries: { ...s.me.entries, [id]: next } } }
      }),

      toggleTried: (id) => {
        const cur = get().me.entries[id] || {}
        const on = !cur.tried
        get().patch(id, { tried: on, date: on ? (cur.date || today()) : undefined })
        return on
      },
      setRating: (id, n) => {
        const cur = get().me.entries[id] || {}
        get().patch(id, { rating: cur.rating === n ? undefined : n })
      },
      toggle: (id, key) => {
        const cur = get().me.entries[id] || {}
        get().patch(id, { [key]: !cur[key] } as Partial<Entry>)
      },
      setNotes: (id, notes) => get().patch(id, { notes: notes || undefined }),
      setDate: (id, date) => get().patch(id, { date }),

      toggleVisit: (venueKey) => {
        const cur = get().me.visits[venueKey] || {}
        const on = !cur.visited
        set((s) => ({ me: { ...s.me, visits: { ...s.me.visits, [venueKey]: { visited: on, date: on ? (cur.date || today()) : undefined } } } }))
        return on
      },

      addCustom: (d) => set((s) => ({ custom: [...s.custom, d] })),

      // ── social (rec/comment ride the existing Entry; friends are merged passports) ──
      // Every user (guests included) gets a stable uuid + public code, generated once and persisted.
      ensureIdentity: () => set((s) => {
        const id = s.profile.id || ensureMyId(s.profile)
        const code = s.profile.code || ensureMyCode(s.profile)
        if (id === s.profile.id && code === s.profile.code) return {}
        return { profile: { ...s.profile, id, code } }
      }),
      toggleRec: (id) => {
        const cur = get().me.entries[id] || {}
        get().patch(id, { rec: cur.rec ? undefined : true })
      },
      setComment: (id, text) => get().patch(id, { comment: text.trim().slice(0, 140) || undefined }),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      upsertFriend: (f) => set((s) => {
        const at = matchFriend(s.friends, f)
        // A direct friend is only real once the server edge exists, so ask for one.
        const next: Friend = f.groupOnly || !f.code ? f : { ...f, needsEdge: true }
        return {
          friends: at > -1 ? s.friends.map((x, k) => (k === at ? next : x)) : [...s.friends, next],
          pendingUnfriends: unblock(s.pendingUnfriends, next.code),
        }
      }),
      removeFriend: async (id) => {
        const friend = get().friends.find((f) => f.id === id)
        // Someone I still share a group with stays on the roster as a co-member (the next pull would
        // bring them back that way regardless), so say so now rather than blink them out and in.
        set((s) => ({
          friends: friend?.groupIds?.length
            ? s.friends.map((x) => (x.id === id ? { ...x, groupOnly: true, needsEdge: undefined } : x))
            : s.friends.filter((x) => x.id !== id),
        }))
        if (!friend?.code || !hasBackend()) return
        // Cut the server edge too, or the next pull hands them straight back. A removal made with no
        // signal is queued rather than swallowed, and until it lands the feed row is ignored, so the
        // person the guest removed does not quietly reappear.
        const ok = await unfriend(friend.code).catch(() => false)
        if (!ok) set((s) => (s.pendingUnfriends.includes(friend.code!) ? {} : { pendingUnfriends: [...s.pendingUnfriends, friend.code!] }))
      },
      // The manual route in: QR, /add# link, or a pasted code. Always yields a direct friend.
      importFriendPayload: (payload) => {
        const me = get().profile
        const theirCode = payload.k ? normaliseCode(payload.k) : ''
        if ((payload.id && payload.id === me.id) || (theirCode && theirCode === me.code))
          return { ok: false, reason: 'That is your own code.' }

        const incoming = parseFriend(payload)
        const friends = get().friends
        const at = matchFriend(friends, incoming)
        const existing = at > -1 ? friends[at] : undefined

        // Re-scanning someone I already hold must not blank their passport: a card refreshes who
        // they are, and promotes a group-only person to a direct friend, but keeps their entries.
        if (existing && payload.cd && !existing.pending) {
          const next: Friend = {
            ...existing, id: incoming.id, name: incoming.name, colour: incoming.colour,
            code: incoming.code ?? existing.code, groupOnly: false, needsEdge: true,
          }
          set((s) => ({ friends: friends.map((f, k) => (k === at ? next : f)), pendingUnfriends: unblock(s.pendingUnfriends, next.code) }))
          return { ok: true, name: next.name }
        }
        // A pending record is identity only, so a real payload always wins over it.
        if (existing && !existing.pending && existing.exportedAt >= incoming.exportedAt)
          return { ok: false, stale: true, name: incoming.name, reason: `You already have ${incoming.name}’s latest.` }

        const next: Friend = { ...incoming, groupOnly: false, needsEdge: true }
        if (existing?.groupIds?.length) next.groupIds = existing.groupIds
        set((s) => ({
          friends: at > -1 ? friends.map((f, k) => (k === at ? next : f)) : [...friends, next],
          pendingUnfriends: unblock(s.pendingUnfriends, next.code),
        }))
        return { ok: true, name: next.name }
      },
      importCode: async (code) => {
        let payload
        try { payload = await decodeShare(code) }
        catch (e) { return { ok: false, reason: e instanceof ShareError ? e.message : 'Could not read that code.' } }
        return get().importFriendPayload(payload)
      },
      // The online route in. Group-only people are rebuilt from scratch on every pull, so leaving a
      // group (either way round) drops them with no purge step.
      applyFeed: (direct, group) => set((s) => {
        let friends = s.friends
        // Someone removed while the unfriend RPC could not be reached: their edge is still live on
        // the server, so skip their row until the queued removal lands rather than re-adding them.
        const blocked = new Set(s.pendingUnfriends)
        const directCodes = new Set<string>()
        for (const row of direct) {
          const code = normaliseCode(row.code)
          if (blocked.has(code)) continue
          if (code) directCodes.add(code)
          friends = foldRow(friends, row, false)
        }

        const groupCodes = new Set<string>()
        for (const row of group) { const code = normaliseCode(row.code); if (code) groupCodes.add(code) }

        // The direct feed is the server's word on who my friends are, and friendship is mutual: an
        // edge the other side cut (or an identity they erased) drops them here too, or the removed
        // person would keep seeing a passport that was withdrawn. Only a friend the server has
        // already confirmed once (no edge still owed) is judged this way, so a friend added offline,
        // or one whose profile has not synced yet, is left alone. Sharing a group keeps them, as a
        // co-member.
        friends = friends.flatMap((f) => {
          if (f.groupOnly || !f.code || f.needsEdge || directCodes.has(f.code)) return [f]
          if (!groupCodes.has(f.code)) return []
          const next: Friend = { ...f, groupOnly: true }
          return [next]
        })


        for (const row of group) {
          const code = normaliseCode(row.code)
          if (!code) continue
          const at = friends.findIndex((f) => f.code === code)
          if (at > -1 && !friends[at].groupOnly) {
            // Already a direct friend, so they render once, as direct; only the group tags change.
            const next: Friend = { ...friends[at] }
            if (row.groupIds?.length) next.groupIds = row.groupIds
            else delete next.groupIds
            friends = friends.map((f, k) => (k === at ? next : f))
          } else {
            friends = foldRow(friends, row, true)
          }
        }

        friends = friends.filter((f) => !f.groupOnly || Boolean(f.code && groupCodes.has(f.code)))
        friends = friends.map((f) => {
          if (f.groupOnly || !f.groupIds || (f.code && groupCodes.has(f.code))) return f
          const next: Friend = { ...f }
          delete next.groupIds
          return next
        })
        return { friends }
      }),
      // After a server-side erasure: come back as a stranger, so nothing left behind resolves to me.
      resetSocialIdentity: () => set((s) => ({
        friends: [], groups: [], pendingInvites: [], pendingUnfriends: [],
        profile: { ...s.profile, id: ensureMyId({ ...s.profile, id: '' }), code: genCode() },
      })),

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      replaceFilters: (f) => set({ filters: f }),
      setShowFilters: (v) => set({ showFilters: v }),
      clearFilters: () => set({ filters: emptyFilters() }),
    }),
    {
      name: 'spcc2',
      version: 7,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted: any, from: number) => {
        if (from < 2 && persisted) {
          persisted.profile ??= { id: '', name: '', colour: 'aqua' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          persisted.friends = (persisted.friends ?? []).map((f: any) => ({ ...f, exportedAt: f.exportedAt ?? 0 }))
        }
        if (from < 4 && persisted) {
          // profile.code (the stable public handle) is backfilled by ensureIdentity() at startup.
          persisted.profile ??= { id: '', name: '', colour: 'aqua' }
        }
        if (from < 5 && persisted) {
          // Existing users are already mid-cruise, so skip the picker and keep them on this sailing.
          persisted.cruiseId = persisted.cruiseId || activeCruiseId()
          persisted.enteredCruise = true
        }
        if (from < 6 && persisted) {
          // The Worker transport is gone: its group code and per-profile sync URL go with it.
          persisted.profile ??= { id: '', name: '', colour: 'aqua' }
          delete persisted.profile.groupCode
          delete persisted.profile.syncUrl
          persisted.groups ??= []
          persisted.pendingInvites ??= []
          if (CRUISES.length === 1) persisted.enteredCruise = true
        }
        if (from < 7 && persisted) {
          // The edge is now asked for per friend rather than for the whole roster on every pull.
          // Rosters from before this carry no flag, and the old first sync befriended before the
          // profile row existed, so plenty of those edges were never made: ask once, here.
          persisted.pendingUnfriends ??= []
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          persisted.friends = (persisted.friends ?? []).map((f: any) => (f.groupOnly || !f.code ? f : { ...f, needsEdge: true }))
        }
        return persisted
      },
      // persist data only; UI (filters/showFilters) resets each session
      partialize: (s) => ({
        me: s.me, custom: s.custom, friends: s.friends, profile: s.profile,
        cruiseId: s.cruiseId, enteredCruise: s.enteredCruise, groups: s.groups,
        pendingInvites: s.pendingInvites, pendingUnfriends: s.pendingUnfriends,
      }),
    },
  ),
)

// Give every user a stable identity (uuid + code) as soon as the store hydrates, guests included,
// so "Add me" and the friend graph always have a handle to show.
useStore.getState().ensureIdentity()

/** Full drink list = catalogue + any custom drinks the user added. */
export const allDrinks = (): Drink[] => [...DRINKS, ...useStore.getState().custom]
export const useAllDrinks = () => {
  const custom = useStore((s) => s.custom)
  return [...DRINKS, ...custom]
}
