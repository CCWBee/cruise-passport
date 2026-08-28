// Faceted filter engine. OR within a group, AND across groups; per-option counts are
// SELF-EXCLUDED (picking one Spirit never zeros the others) in a single O(drinks×groups) pass.
// See REVIEW/reports/facet-engine.md.
import { pkgOf, VENUES, type Drink } from '../../data/model'
import type { Filters } from '../../state/store'
import type { Entry } from '../../state/stats'

export type EntryGet = (id: string) => Entry
type Tok = string | number

interface Group {
  kind: 'multi' | 'seg' | 'bool'
  active: (f: Filters) => boolean
  pass: (d: Drink, f: Filters, E: EntryGet) => boolean
  tokens: (d: Drink, E: EntryGet) => Tok[]
}

export function matchQuery(d: Drink, q: string): boolean {
  if (!q) return true
  const hay = (d.name + ' ' + d.ingredients + ' ' + VENUES[d.venue].name + ' ' +
    d.category + ' ' + d.spirits.join(' ') + ' ' + d.flavors.join(' ')).toLowerCase()
  return hay.indexOf(q) > -1
}

export const GROUPS: Record<string, Group> = {
  venues: { kind: 'multi', active: (f) => f.venues.length > 0, pass: (d, f) => !f.venues.length || f.venues.indexOf(d.venue) > -1, tokens: (d) => [d.venue] },
  decks: { kind: 'multi', active: (f) => f.decks.length > 0, pass: (d, f) => !f.decks.length || f.decks.indexOf(VENUES[d.venue].deck) > -1, tokens: (d) => [VENUES[d.venue].deck] },
  spirits: { kind: 'multi', active: (f) => f.spirits.length > 0, pass: (d, f) => !f.spirits.length || f.spirits.some((x) => d.spirits.indexOf(x) > -1), tokens: (d) => d.spirits },
  flavors: { kind: 'multi', active: (f) => f.flavors.length > 0, pass: (d, f) => !f.flavors.length || f.flavors.some((x) => d.flavors.indexOf(x) > -1), tokens: (d) => d.flavors },
  cats: { kind: 'multi', active: (f) => f.cats.length > 0, pass: (d, f) => !f.cats.length || f.cats.indexOf(d.category) > -1, tokens: (d) => [d.category] },

  pkg: { kind: 'seg', active: (f) => f.pkg !== 'any', pass: (d, f) => f.pkg === 'any' || pkgOf(d) === f.pkg, tokens: (d) => [pkgOf(d)] },
  tried: { kind: 'seg', active: (f) => f.tried !== null, pass: (d, f, E) => f.tried === null || !!E(d.id).tried === f.tried, tokens: (d, E) => [E(d.id).tried ? 'yes' : 'no'] },

  frozen: { kind: 'bool', active: (f) => f.frozen, pass: (d, f) => !f.frozen || d.frozen, tokens: (d) => (d.frozen ? ['on'] : []) },
  fav: { kind: 'bool', active: (f) => f.fav, pass: (d, f, E) => !f.fav || !!E(d.id).fav, tokens: (d, E) => (E(d.id).fav ? ['on'] : []) },
  wish: { kind: 'bool', active: (f) => f.wish, pass: (d, f, E) => !f.wish || !!E(d.id).wish, tokens: (d, E) => (E(d.id).wish ? ['on'] : []) },
  top: { kind: 'bool', active: (f) => f.top, pass: (d, f, E) => !f.top || (E(d.id).rating || 0) >= 4, tokens: (d, E) => ((E(d.id).rating || 0) >= 4 ? ['on'] : []) },
}
export const GORDER = ['venues', 'decks', 'spirits', 'flavors', 'cats', 'pkg', 'tried', 'frozen', 'fav', 'wish', 'top'] as const

export type Counts = Record<string, Record<string, number>>
export interface FacetResult { results: Drink[]; counts: Counts }

/** Results + self-excluded counts for every group, in one pass. */
export function facets(drinks: Drink[], f: Filters, query: string, E: EntryGet): FacetResult {
  const q = query.trim().toLowerCase()
  const active = GORDER.filter((k) => GROUPS[k].active(f))
  const counts: Counts = {}
  GORDER.forEach((k) => { counts[k] = {} })
  const results: Drink[] = []

  const tally = (d: Drink, k: string) => {
    GROUPS[k].tokens(d, E).forEach((v) => {
      const key = String(v)
      counts[k][key] = (counts[k][key] || 0) + 1
    })
  }

  for (const d of drinks) {
    if (!matchQuery(d, q)) continue
    let failN = 0
    let failed: string | null = null
    for (let i = 0; i < active.length; i++) {
      if (!GROUPS[active[i]].pass(d, f, E)) { failed = active[i]; if (++failN > 1) break }
    }
    if (failN === 0) {
      results.push(d)
      GORDER.forEach((k) => tally(d, k))
    } else if (failN === 1 && failed) {
      tally(d, failed)
    }
  }
  return { results, counts }
}

export function nChosen(f: Filters): number {
  return f.venues.length + f.decks.length + f.spirits.length + f.flavors.length + f.cats.length +
    (f.pkg !== 'any' ? 1 : 0) + (f.tried !== null ? 1 : 0) +
    (f.frozen ? 1 : 0) + (f.fav ? 1 : 0) + (f.wish ? 1 : 0) + (f.top ? 1 : 0)
}

/** Which single active group, if dropped, restores the most results (for the empty state). */
export function loosest(drinks: Drink[], f: Filters, query: string, E: EntryGet): { key: string; n: number } | null {
  const q = query.trim().toLowerCase()
  const active = GORDER.filter((k) => GROUPS[k].active(f))
  let best: { key: string; n: number } | null = null
  active.forEach((drop) => {
    let n = 0
    for (const d of drinks) {
      if (matchQuery(d, q) && active.every((k) => k === drop || GROUPS[k].pass(d, f, E))) n++
    }
    if (n > 0 && (!best || n > best.n)) best = { key: drop, n }
  })
  return best
}

export const GROUP_LABEL: Record<string, string> = {
  venues: 'Venue', decks: 'Deck', spirits: 'Spirit', flavors: 'Flavour', cats: 'Type',
  pkg: 'Package', tried: 'Status', frozen: 'Frozen', fav: 'Favourites', wish: 'Wishlist', top: 'Rated 4+',
}
