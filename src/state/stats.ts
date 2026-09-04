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

/** A friend is another passport, merged in by share-code, with attribution.
 *  Crew = direct friends (we hold each other's code) + group co-members, one record type, tagged by
 *  route: `groupOnly` marks someone I only see through a shared group, so leaving the group drops
 *  them and "Remove" is never offered for them. */
export interface Friend {
  id: string
  name: string
  colour: string // FRIEND_COLOURS key
  code?: string // stable public handle, for online resolve; absent on legacy/paste-only friends
  passport: Passport
  exportedAt: number // ms — from the code we merged; drives skip-if-older
  pending?: boolean // identity only (no passport snapshot yet); render gracefully until first resolve
  groupOnly?: boolean // true = seen only through a group; absent/false = a direct friend
  groupIds?: string[] // groups this person shares with me, for the "· Gillams" subline
  needsEdge?: true // added here but not yet confirmed on the server; cleared by the first direct feed
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

// ── Home's front panel: pure selectors, appended. Nothing above this line changed. ──
// These exist so Home reads the same numbers the screens they lead to compute, rather than
// measuring the same things a second way and disagreeing with them.
import { BADGES, type BadgeDef } from '../data/badges'
import { menuFor } from '../data/model'

export interface NextBadge { badge: BadgeDef; cur: number; need: number; pct: number }

/** The badge nearest to earned. The same measure the Badges screen's "Close" list uses: an
 *  un-earned badge with a progress predicate and something on the board, ranked by percentage. */
export function nextBadge(stat: BadgeStat): NextBadge | null {
  let best: NextBadge | null = null
  for (const badge of BADGES) {
    if (badge.test(stat)) continue
    const p = badge.progress?.(stat)
    if (!p || p.need <= 0 || p.cur <= 0) continue
    const pct = Math.min(100, Math.max(0, (p.cur / p.need) * 100))
    if (!best || pct > best.pct) best = { badge, cur: p.cur, need: p.need, pct }
  }
  return best
}

/** Drinks a passport logged on one ISO day, in the order that passport holds them. */
export function drinksOn(drinks: Drink[], p: Passport, iso: string): Drink[] {
  const byId: Record<string, Drink> = {}
  drinks.forEach((d) => { byId[d.id] = d })
  const out: Drink[] = []
  for (const id of Object.keys(p.entries)) {
    const e = p.entries[id]
    if (e && e.tried && e.date === iso && byId[id]) out.push(byId[id])
  }
  return out
}

/** How many drinks a passport logged on one ISO day. Used for self and for a crew member. */
export function countOn(p: Passport, iso: string): number {
  let n = 0
  for (const id of Object.keys(p.entries)) {
    const e = p.entries[id]
    if (e && e.tried && e.date === iso) n++
  }
  return n
}

/** The venue of the last drink logged on a day. An entry carries a date, not a time, so the only
 *  honest "last" is the last one the passport wrote; nothing here is guessed from the clock. */
export function lastVenueOn(drinks: Drink[], p: Passport, iso: string): string | null {
  const list = drinksOn(drinks, p, iso)
  return list.length ? list[list.length - 1].venue : null
}

export interface VenueProgress { key: string; total: number; done: number; next: Drink | null }

/** One venue's own list: tried, total, and the first drink on it still untried. */
export function venueProgress(drinks: Drink[], p: Passport, key: string): VenueProgress {
  const menu = menuFor(key, drinks)
  const done = menu.filter((d) => p.entries[d.id]?.tried).length
  return { key, total: menu.length, done, next: menu.find((d) => !p.entries[d.id]?.tried) || null }
}

/** The bar with the longest list: where a guest who has logged nothing has the most to find.
 *  Bars only, so a restaurant never wins it, and own drinks only, so a venue that shares another's
 *  list is not credited with it twice. */
export function biggestBar(drinks: Drink[]): string | null {
  const n: Record<string, number> = {}
  drinks.forEach((d) => {
    if (!VENUES[d.venue] || isRestaurant(d.venue)) return
    n[d.venue] = (n[d.venue] || 0) + 1
  })
  const keys = Object.keys(n)
  if (!keys.length) return null
  return keys.sort((a, b) => n[b] - n[a] || VENUES[a].name.localeCompare(VENUES[b].name))[0]
}

/** How many decks carry a venue. The Ship screen's landmarks are its decks, so Home counts them
 *  off the venue list the way Ship groups them rather than reading the DECKS constant beside it. */
export function deckCount(): number {
  const on: Record<number, 1> = {}
  VENUE_KEYS.forEach((k) => { on[VENUES[k].deck] = 1 })
  return Object.keys(on).length
}

// ── time of day: one set of boundaries for the sky palette and the greeting, so they agree ──
export type DayPart = 'dawn' | 'morning' | 'afternoon' | 'golden' | 'dusk' | 'night'
/** Six parts of the day from a local hour. The sea shader keys its palette off these and the Home
 *  greeting keys its word off them; change the boundaries here and both follow. */
export function dayPart(hour: number): DayPart {
  if (hour < 5) return 'night'
  if (hour < 7) return 'dawn'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 19) return 'golden'
  if (hour < 21) return 'dusk'
  return 'night'
}
/** The word before the name in the Home greeting. Dry: nobody says "Night, Isabel". */
export function greetingWord(part: DayPart): string {
  if (part === 'dawn' || part === 'morning') return 'Morning'
  if (part === 'afternoon') return 'Afternoon'
  return 'Evening'
}

// ── Home's greeting, medal moment and crew lines: pure selectors, appended ──

/** The name to greet by: the first word of the profile name, empty when there is none. With no
 *  name there is no greeting at all, so the hero stays the screen's first line. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || ''
}

/** Badges earned but never shown as a "new medal" moment, in the order BADGES declares them. */
export function newMedals(stat: BadgeStat, seen: string[]): BadgeDef[] {
  return BADGES.filter((b) => b.test(stat) && !seen.includes(b.id))
}

// A tier is an ordinal, so "the best of these" is the highest rank; within one rank the later badge
// in BADGES is the harder one (the list runs easiest first), which is why the fold keeps the last.
const TIER_RANK: Record<NonNullable<BadgeDef['tier']>, number> = { bronze: 0, silver: 1, gold: 2, special: 3 }
/** The one medal a batch is announced by: the highest tier, and the hardest inside that tier. */
export function topMedal(list: BadgeDef[]): BadgeDef | null {
  if (!list.length) return null
  return list.reduce((best, b) => (TIER_RANK[b.tier ?? 'bronze'] >= TIER_RANK[best.tier ?? 'bronze'] ? b : best))
}

export interface CrewDay {
  id: string
  name: string
  colour: string
  n: number
  /** the venue where more than half of today's drinks were logged, and whether every one of them
   *  was there. Null on a day spread evenly across bars: a plurality is not a majority, and
   *  "mostly" said of one drink in three would be a guess dressed as a fact. */
  venue: string | null
  onlyVenue: boolean
  /** when that passport was last exported to us; 0 = never (an identity with no snapshot yet) */
  syncedAt: number
}

/** One line per crew member who logged today. An entry carries a date, not a time, so this counts
 *  the day and names where most of it happened; nothing is inferred about where anyone is now.
 *  "Most" is a strict majority, not the top of a sort: three drinks at three bars have no "mostly",
 *  so the venue is dropped and the line is just the count.
 *  Nobody logged today means an empty list, and Home renders no filler for it. */
export function crewToday(
  drinks: Drink[],
  people: { id: string; name: string; colour: string; passport: Passport; isSelf: boolean }[],
  syncedAt: Record<string, number>,
  iso: string,
): CrewDay[] {
  return people
    .filter((p) => !p.isSelf)
    .map((p) => {
      const list = drinksOn(drinks, p.passport, iso)
      const byVenue: Record<string, number> = {}
      list.forEach((d) => { byVenue[d.venue] = (byVenue[d.venue] || 0) + 1 })
      const keys = Object.keys(byVenue).sort(
        (a, b) => byVenue[b] - byVenue[a] || (VENUES[a]?.name || a).localeCompare(VENUES[b]?.name || b),
      )
      // the venue only when more than half of the day was there; a plurality of one is not "mostly"
      const top: string | undefined = keys[0]
      const majority = top !== undefined && byVenue[top] > list.length / 2
      return {
        id: p.id, name: p.name, colour: p.colour, n: list.length,
        venue: majority ? top : null, onlyVenue: keys.length === 1,
        syncedAt: syncedAt[p.id] || 0,
      }
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
}

/** How long ago a passport reached this phone, in words. The unit grows with the gap so a friend who
 *  synced in August is not reported as "9000 h ago". */
export function syncedAgo(at: number, now: number = Date.now()): string {
  const mins = Math.floor((now - at) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
