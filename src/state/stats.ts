// Pure stats derivation over a passport (self, or a merged view). No store deps,
// so it is trivially testable and reusable for friends/leaderboards later.
import { VENUES, VENUE_KEYS, isRestaurant, DAYS, today, type Drink } from '../data/model'
import type { BadgeStat } from '../data/badges'

export interface Entry {
  tried?: boolean
  date?: string
  rating?: number // 1..5
  fav?: boolean // private
  wish?: boolean // private
  again?: boolean // private
  notes?: string // private diary note — NEVER shared
  // ── social (additive, shared) ──
  rec?: boolean // "I recommend this"
  comment?: string // public one-liner, <=140 chars — shared
}

/** A friend is another passport, merged in by share-code, with attribution. */
export interface Friend {
  id: string
  name: string
  colour: string // FRIEND_COLOURS key
  code?: string // stable public handle, for online resolve; absent on legacy/paste-only friends
  passport: Passport
  exportedAt: number // ms — from the code we merged; drives skip-if-older
  pending?: boolean // added by code only (no payload yet); render gracefully until first resolve
}

// self-identity + the friend colour palette (here, not store.ts, to avoid a store<->share cycle)
// id = internal uuid stamped on payloads; code = stable human handle others add you by.
export interface Profile { id: string; name: string; colour: string; code?: string }
export const FRIEND_COLOURS = ['aqua', 'melon', 'mango', 'lime', 'grape', 'pine'] as const
export type FriendColour = typeof FRIEND_COLOURS[number]
export interface VenueVisit { visited?: boolean; date?: string }
export interface Passport {
  entries: Record<string, Entry>
  visits: Record<string, VenueVisit>
}
export const emptyPassport = (): Passport => ({ entries: {}, visits: {} })

export interface Stats {
  total: number
  n: number
  pct: number
  streak: number
  tried: Drink[]
  rated: Drink[]
  avg: number
  bars: number; barsTotal: number
  rest: number; restTotal: number
  venues: number
  best: Drink | null
  favVenue: string | null
  favVenueN: number
  favSpirit: string | null
  byVenue: Record<string, number>
  bySpirit: Record<string, number>
  byCategory: Record<string, number>
  byDay: Record<string, Drink[]>
  badgeStat: BadgeStat
}

export function computeStats(drinks: Drink[], p: Passport): Stats {
  const E = (id: string): Entry => p.entries[id] || {}
  const tried = drinks.filter((d) => E(d.id).tried)
  const rated = tried.filter((d) => E(d.id).rating)

  const checked = VENUE_KEYS.filter((k) => p.visits[k]?.visited)
  const vset: Record<string, 1> = {}
  tried.forEach((d) => { vset[d.venue] = 1 })
  checked.forEach((k) => { vset[k] = 1 })
  const vkeys = Object.keys(vset)

  const byVenue: Record<string, number> = {}
  const bySpirit: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  const byDay: Record<string, Drink[]> = {}
  tried.forEach((d) => {
    byVenue[d.venue] = (byVenue[d.venue] || 0) + 1
    d.spirits.forEach((x) => { bySpirit[x] = (bySpirit[x] || 0) + 1 })
    byCategory[d.category] = (byCategory[d.category] || 0) + 1
    const t = E(d.id).date
    if (t) (byDay[t] = byDay[t] || []).push(d)
  })

  // streak of consecutive logged days ending today (or last logged day)
  const dts = Object.keys(byDay).sort()
  let streak = 0
  if (dts.length) {
    const set: Record<string, 1> = {}
    dts.forEach((x) => { set[x] = 1 })
    let cur = set[today()] ? today() : dts[dts.length - 1]
    while (set[cur]) {
      streak++
      const pv = new Date(cur + 'T12:00:00'); pv.setDate(pv.getDate() - 1)
      cur = pv.toISOString().slice(0, 10)
    }
  }

  const best = rated.slice().sort((a, b) => (E(b.id).rating! - E(a.id).rating!) || a.name.localeCompare(b.name))[0] || null
  const favVenue = Object.keys(byVenue).sort((a, b) => byVenue[b] - byVenue[a])[0] || null
  const favSpirit = Object.keys(bySpirit).sort((a, b) => bySpirit[b] - bySpirit[a])[0] || null

  const cat = (c: string) => tried.filter((d) => d.category === c).length
  const sp = (x: string) => tried.filter((d) => d.spirits.indexOf(x) > -1).length
  const catDone = (c: string) => {
    const t = drinks.filter((d) => d.category === c)
    return t.length > 0 && t.every((d) => E(d.id).tried)
  }
  const frozenSet = drinks.filter((d) => d.frozen)
  const frozenDone = frozenSet.length > 0 && frozenSet.every((d) => E(d.id).tried)
  const pct = (tried.length / drinks.length) * 100

  const badgeStat: BadgeStat = {
    n: tried.length, venues: vkeys.length, totalVenues: VENUE_KEYS.length,
    pct, frozenDone, cat, catDone, sp,
  }

  return {
    total: drinks.length, n: tried.length, pct, streak, tried, rated,
    avg: rated.length ? rated.reduce((a, d) => a + (E(d.id).rating || 0), 0) / rated.length : 0,
    bars: vkeys.filter((k) => !isRestaurant(k)).length,
    barsTotal: VENUE_KEYS.filter((k) => !isRestaurant(k)).length,
    rest: vkeys.filter((k) => isRestaurant(k)).length,
    restTotal: VENUE_KEYS.filter((k) => isRestaurant(k)).length,
    venues: vkeys.length, best, favVenue, favVenueN: favVenue ? byVenue[favVenue] : 0, favSpirit,
    byVenue, bySpirit, byCategory, byDay, badgeStat,
  }
}

export const voyageDayIndex = (): number => DAYS.indexOf(today())
export { VENUES }
