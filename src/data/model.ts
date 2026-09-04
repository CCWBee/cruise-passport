// Domain model built over the active cruise's dataset. Ids stay positional (d/w/b + index)
// so old share-codes and imported progress still map onto the same drinks.
import { activeCruise } from './cruises'
import { type VenueRaw } from './raw'

// The active cruise supplies the dataset. Resolved once at module load; switching cruises reloads.
const DATA = activeCruise().data
const { VENUES, COCKTAILS, WINES, BEERS, PLUS, PREM, START, END } = DATA

export { VENUES, PLUS, PREM, START, END }
export type Venue = VenueRaw

export interface Drink {
  id: string
  name: string
  venue: string
  category: string
  spirits: string[]
  ingredients: string
  flavors: string[]
  sweet: number // 1..5
  strength: number // 0..5
  frozen: boolean
  price: number | null
  desc: string
  verified: boolean
  plus: boolean | null // <= $15 (null when price unknown)
  premier: boolean | null // <= $20
  extra: number | null // amount over $20
}

export type PkgTier = 'plus' | 'prem' | 'over' | 'unknown'

/** Rebuild the 214-drink list exactly as the original build() did. */
export function buildDrinks(): Drink[] {
  const out: Drink[] = []
  COCKTAILS.forEach((r, i) => {
    const p = r[9]
    out.push({
      id: 'd' + i, name: r[0], venue: r[1], category: r[2], spirits: r[3],
      ingredients: r[4], flavors: r[5], sweet: r[6], strength: r[7], frozen: r[8],
      price: p, desc: r[10], verified: r[11],
      plus: p === null ? null : p <= PLUS,
      premier: p === null ? null : p <= PREM,
      extra: p === null ? null : Math.max(0, p - PREM),
    })
  })
  WINES.forEach((w, i) => {
    out.push({
      id: 'w' + i, name: w[0], venue: 'crooners', category: 'Wine', spirits: ['Wine'],
      ingredients: w[1] + ' by the glass',
      flavors: [w[1] === 'Red' ? 'Bitter' : 'Refreshing'],
      sweet: w[0] === 'Moscato' ? 5 : 2, strength: 2, frozen: false, price: w[2], verified: true,
      desc: 'Poured across the ship. ' + (w[2] <= PLUS ? 'Within the Plus allowance.' : 'Premier tier.'),
      plus: w[2] <= PLUS, premier: w[2] <= PREM, extra: Math.max(0, w[2] - PREM),
    })
  })
  BEERS.forEach((b, i) => {
    out.push({
      id: 'b' + i, name: b[0], venue: 'themix', category: 'Beer', spirits: ['Beer'],
      ingredients: 'Bottle or can unless marked draft', flavors: ['Refreshing'],
      sweet: 1, strength: b[0].indexOf('0.0') > -1 ? 0 : 2, frozen: false, price: b[1],
      verified: true,
      desc: 'Available fleet wide. Add $2 at pool bars to make it a michelada.',
      plus: true, premier: true, extra: 0,
    })
  })
  return out
}

export const DRINKS: Drink[] = buildDrinks()
export const DRINK_BY_ID: Record<string, Drink> = Object.fromEntries(DRINKS.map((d) => [d.id, d]))

export const SPIRITS = ['Vodka', 'Rum', 'Gin', 'Tequila', 'Bourbon', 'Whiskey', 'Scotch', 'Brandy', 'Cognac', 'Mezcal', 'Liqueur', 'Wine', 'Beer']
export const FLAVOURS = ['Tropical', 'Fruity', 'Sour', 'Sweet', 'Bitter', 'Refreshing', 'Strong', 'Coffee', 'Dessert']
export const DECKS = [7, 8, 9, 15, 17, 18]
export const CATEGORIES = Array.from(new Set(DRINKS.map((d) => d.category))).sort()

/** Package tier — the one place price classification lives. null price = 'unknown'. */
export function pkgOf(d: Drink): PkgTier {
  if (d.price === null || d.price === undefined) return 'unknown'
  if (d.plus === true) return 'plus'
  if (d.premier === true) return 'prem'
  return 'over'
}

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return '–'
  return '$' + (Number(n) % 1 ? Number(n).toFixed(2) : n)
}

/** Drinks poured at a venue, following the `shares` link when the venue has no own menu. */
export function menuFor(venueKey: string, drinks: Drink[] = DRINKS): Drink[] {
  const own = drinks.filter((d) => d.venue === venueKey)
  if (own.length) return own
  const s = VENUES[venueKey]?.shares
  return s ? drinks.filter((d) => d.venue === s) : []
}

export const VENUE_KEYS = Object.keys(VENUES)
export const isRestaurant = (venueKey: string) => ['Restaurant', 'Experience'].includes(VENUES[venueKey].type)

// ── voyage calendar ──
export function voyageDays(): string[] {
  const out: string[] = []
  const d = new Date(START + 'T12:00:00')
  const e = new Date(END + 'T12:00:00')
  while (d <= e) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1) }
  return out
}
export const DAYS = voyageDays()
export function today(): string {
  // ?day=YYYY-MM-DD pins the date, so the aboard states can be rendered before sailing (QA only)
  if (typeof location !== 'undefined') {
    const pinned = new URLSearchParams(location.search).get('day')
    if (pinned && /^\d{4}-\d{2}-\d{2}$/.test(pinned)) return pinned
  }
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
/** The local hour, 0..23. ?hour=N pins it (QA only) so the sky and the greeting can be rendered at
 *  any time of day; pairs with ?day=. */
export function nowHour(): number {
  if (typeof location !== 'undefined') {
    const pinned = Number(new URLSearchParams(location.search).get('hour'))
    if (Number.isInteger(pinned) && pinned >= 0 && pinned <= 23) return pinned
  }
  return new Date().getHours()
}
export function prettyDay(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── area-honest liquid fill (kept for any SVG/2D liquid, e.g. the brand glyph) ──
// Trapezoidal martini bowl: apex hw 4, rim hw 38 over height 58. Exact inverse of area.
export function surfaceY(fraction: number): number {
  const APEXY = 104, H = 58
  const f = Math.max(0, Math.min(1, fraction))
  if (f <= 0) return APEXY
  const s = (Math.sqrt(16 + 1428 * f) - 4) / 34
  return Math.min(APEXY - H * s, APEXY - 2)
}
