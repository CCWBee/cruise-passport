import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DRINKS, today, type Drink } from '../data/model'
import { emptyPassport, type Entry, type Passport } from './stats'

// ── social seam: a friend is just another passport with attribution ──
// Live now: `me`. Friends land via share-code merge; leaderboards read across them.
export interface Friend { id: string; name: string; colour: string; passport: Passport }

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
  filters: Filters
  showFilters: boolean

  // entry mutations (self)
  patch: (id: string, o: Partial<Entry>) => void
  toggleTried: (id: string) => boolean // returns new tried value
  setRating: (id: string, n: number) => void
  toggle: (id: string, key: 'fav' | 'wish' | 'again') => void
  setNotes: (id: string, notes: string) => void
  setDate: (id: string, date: string) => void
  toggleVisit: (venueKey: string) => boolean
  addCustom: (d: Drink) => void

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
      filters: emptyFilters(),
      showFilters: false,

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

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      replaceFilters: (f) => set({ filters: f }),
      setShowFilters: (v) => set({ showFilters: v }),
      clearFilters: () => set({ filters: emptyFilters() }),
    }),
    {
      name: 'spcc2',
      version: 1,
      // persist data only; UI (filters/showFilters) resets each session
      partialize: (s) => ({ me: s.me, custom: s.custom, friends: s.friends }),
    },
  ),
)

/** Full drink list = catalogue + any custom drinks the user added. */
export const allDrinks = (): Drink[] => [...DRINKS, ...useStore.getState().custom]
export const useAllDrinks = () => {
  const custom = useStore((s) => s.custom)
  return [...DRINKS, ...custom]
}
