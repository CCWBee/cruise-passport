import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { activeCruiseId, setActiveCruise } from '../data/cruises'
import { DRINKS, today, type Drink } from '../data/model'
import { emptyPassport, FRIEND_COLOURS, type Entry, type Passport, type Friend, type Profile as BaseProfile, type FriendColour } from './stats'
import { decodeShare, ensureMyId, ensureMyCode, parseFriend, ShareError, type SharePayload } from './share'

// re-export the social types/consts that used to live here, for existing call sites
export { FRIEND_COLOURS }
export type { Friend, FriendColour }

export interface Profile extends BaseProfile {
  groupCode: string
  syncUrl?: string
}

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
  filters: Filters
  showFilters: boolean

  enterCruise: (id: string) => void

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
  setGroup: (code: string) => void
  upsertFriend: (f: Friend) => void
  removeFriend: (id: string) => void
  importFriendPayload: (payload: SharePayload) => { ok: boolean; name?: string; reason?: string; stale?: boolean }
  importCode: (code: string) => Promise<{ ok: boolean; name?: string; reason?: string; stale?: boolean }>

  // filters
  setFilters: (f: Partial<Filters>) => void
  replaceFilters: (f: Filters) => void
  setShowFilters: (v: boolean) => void
  clearFilters: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      me: emptyPassport(),
      custom: [],
      friends: [],
      profile: { id: '', name: '', colour: 'aqua', groupCode: '' },
      cruiseId: activeCruiseId(),
      enteredCruise: false,
      filters: emptyFilters(),
      showFilters: false,

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
      setGroup: (code) => set((s) => {
        const groupCode = code.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64)
        return {
          profile: {
            ...s.profile,
            id: groupCode && !s.profile.id ? ensureMyId(s.profile) : s.profile.id,
            groupCode,
          },
        }
      }),
      upsertFriend: (f) => set((s) => ({ friends: [...s.friends.filter((x) => x.id !== f.id), f] })),
      removeFriend: (id) => set((s) => ({ friends: s.friends.filter((x) => x.id !== id) })),
      importFriendPayload: (payload) => {
        const me = get().profile
        if (payload.id && payload.id === me.id) return { ok: false, reason: 'That is your own code.' }
        const friend = parseFriend(payload)
        const existing = get().friends.find((f) => f.id === friend.id)
        if (existing && existing.exportedAt >= friend.exportedAt)
          return { ok: false, stale: true, name: friend.name, reason: `You already have ${friend.name}'s latest.` }
        get().upsertFriend(friend)
        return { ok: true, name: friend.name }
      },
      importCode: async (code) => {
        let payload
        try { payload = await decodeShare(code) }
        catch (e) { return { ok: false, reason: e instanceof ShareError ? e.message : 'Could not read that code.' } }
        return get().importFriendPayload(payload)
      },

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      replaceFilters: (f) => set({ filters: f }),
      setShowFilters: (v) => set({ showFilters: v }),
      clearFilters: () => set({ filters: emptyFilters() }),
    }),
    {
      name: 'spcc2',
      version: 5,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted: any, from: number) => {
        if (from < 2 && persisted) {
          persisted.profile ??= { id: '', name: '', colour: 'aqua' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          persisted.friends = (persisted.friends ?? []).map((f: any) => ({ ...f, exportedAt: f.exportedAt ?? 0 }))
        }
        if (from < 3 && persisted) {
          persisted.profile ??= { id: '', name: '', colour: 'aqua' }
          persisted.profile.groupCode ??= ''
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
        return persisted
      },
      // persist data only; UI (filters/showFilters) resets each session
      partialize: (s) => ({ me: s.me, custom: s.custom, friends: s.friends, profile: s.profile, cruiseId: s.cruiseId, enteredCruise: s.enteredCruise }),
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
