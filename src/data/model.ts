// Domain model built over the active cruise's dataset. Ids stay positional (d/w/b + index)
// so old share-codes and imported progress still map onto the same drinks.
import { activeCruise } from './cruises'
import { type VenueRaw } from './raw'

// The active cruise supplies the dataset. Resolved once at module load; switching cruises reloads.
const ACTIVE = activeCruise()
const DATA = ACTIVE.data
const { VENUES, COCKTAILS, WINES, BEERS, PLUS, PREM, START, END, DECK_LABELS } = DATA

export { VENUES, START, END }
export type Venue = VenueRaw

/** The ship this sailing is on. The places that print a ship name read it here, so a guest on a
 *  sailing they set up is shown the name they typed rather than the Sun Princess. */
export const SHIP = ACTIVE.ship

/** Whether this sailing declares package tiers at all. A sailing the guest set up does not, so no
 *  drink on it can be classified against one. PLUS and PREM stay module-local on purpose: a
 *  `number | undefined` in the exported surface invites exactly the comparison this pair exists to
 *  stop, and pkgFields() below is the whole of what a caller needs. */
export const HAS_PACKAGES = typeof PLUS === 'number' && typeof PREM === 'number'

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
  plus: boolean | null // <= $15 (null when price unknown, or the sailing declares no packages)
  premier: boolean | null // <= $20
  extra: number | null // amount over $20
  cruise?: string // set on a drink the guest added: it appears only on the sailing it was added to
}

export type PkgTier = 'plus' | 'prem' | 'over' | 'unknown'

/** The three package fields for a price. Null throughout when the sailing declares no package
 *  tiers, or the price is unknown: Math.max(0, p - undefined) is NaN, and NaN in `extra` is what
 *  a user sailing would otherwise store on every drink with a price. */
export function pkgFields(p: number | null): Pick<Drink, 'plus' | 'premier' | 'extra'> {
  if (p === null || !HAS_PACKAGES) return { plus: null, premier: null, extra: null }
  return { plus: p <= PLUS!, premier: p <= PREM!, extra: Math.max(0, p - PREM!) }
}

/** Rebuild the 214-drink list exactly as the original build() did. */
export function buildDrinks(): Drink[] {
  const out: Drink[] = []
  COCKTAILS.forEach((r, i) => {
    const p = r[9]
    out.push({
      id: 'd' + i, name: r[0], venue: r[1], category: r[2], spirits: r[3],
      ingredients: r[4], flavors: r[5], sweet: r[6], strength: r[7], frozen: r[8],
      price: p, desc: r[10], verified: r[11],
      ...pkgFields(p),
    })
  })
  WINES.forEach((w, i) => {
    out.push({
      id: 'w' + i, name: w[0], venue: 'crooners', category: 'Wine', spirits: ['Wine'],
      ingredients: w[1] + ' by the glass',
      flavors: [w[1] === 'Red' ? 'Bitter' : 'Refreshing'],
      sweet: w[0] === 'Moscato' ? 5 : 2, strength: 2, frozen: false, price: w[2], verified: true,
      // the tier is already beside the price in the sheet's facts line, so the blurb does not repeat it
      desc: 'Poured across the ship.',
      ...pkgFields(w[2]),
    })
  })
  BEERS.forEach((b, i) => {
    out.push({
      id: 'b' + i, name: b[0], venue: 'themix', category: 'Beer', spirits: ['Beer'],
      ingredients: 'Bottle or can unless marked draft', flavors: ['Refreshing'],
      sweet: 1, strength: b[0].indexOf('0.0') > -1 ? 0 : 2, frozen: false, price: b[1],
      verified: true,
      desc: 'Available fleet wide. Add $2 at pool bars to make it a michelada.',
      ...pkgFields(b[1]),
    })
  })
  return out
}

export const DRINKS: Drink[] = buildDrinks()
export const DRINK_BY_ID: Record<string, Drink> = Object.fromEntries(DRINKS.map((d) => [d.id, d]))

export const SPIRITS = ['Vodka', 'Rum', 'Gin', 'Tequila', 'Bourbon', 'Whiskey', 'Scotch', 'Brandy', 'Cognac', 'Mezcal', 'Liqueur', 'Wine', 'Beer']
export const FLAVOURS = ['Tropical', 'Fruity', 'Sour', 'Sweet', 'Bitter', 'Refreshing', 'Strong', 'Coffee', 'Dessert']
// Read up here, above DECKS, because DECKS is derived from it and a const cannot be read before it
// is declared. Nothing between the two touches it.
export const VENUE_KEYS = Object.keys(VENUES)
/** The decks this sailing's venues are on, derived rather than declared. On the published data that
 *  is [7, 8, 9, 15, 17, 18] at counts 9, 6, 4, 1, 6 and 2: the same array it replaces, so Ship,
 *  Stats and the filter panel render identically there. A sailing with no venues has no decks. */
export const DECKS = Array.from(new Set(VENUE_KEYS.map((k) => VENUES[k].deck))).sort((a, b) => a - b)
/** What the ship calls a deck, where it calls it something other than the number. The one reader of
 *  DECK_LABELS, so Ship, Stats and the filter panel all print the same thing. */
export const deckLabel = (deck: number): string => DECK_LABELS?.[deck] ?? String(deck)
// A base vocabulary, so a sailing with a catalogue of one drink still offers the types worth
// choosing from and the four badges that key off a category name stay reachable. Every one of these
// is a category the published dataset already uses, so the union below is the same thirteen in the
// same order there; the two Princess brand names in that data are deliberately not in the base and
// still appear on the published sailing, because they come from its own catalogue.
const BASE_CATEGORIES = ['Classic', 'Signature', 'Martini', 'Margarita', 'Spritz', 'Frozen', 'Coffee', 'Dessert', 'Mocktail', 'Wine', 'Beer']
export const CATEGORIES = Array.from(new Set([...DRINKS.map((d) => d.category), ...BASE_CATEGORIES])).sort()

/** What a drink's ingredients line shows. A drink the guest added before 22 September carries the
 *  words the add sheet used to write in place of nothing; they were never the guest's, so they read
 *  as empty, as a drink added now is. */
const NO_INGREDIENTS = 'Ingredients not recorded'
export const ingredientsOf = (d: Drink): string => (d.ingredients === NO_INGREDIENTS ? '' : d.ingredients)

/** Package tier — the one place price classification lives. null price = 'unknown'. */
export function pkgOf(d: Drink): PkgTier {
  // A drink can carry a price and still have no tier: on a sailing that declares no packages every
  // drink has a real price and null tiers, and without this test the two below would fall through
  // to 'over', which is a claim about a package the sailing does not have.
  if (d.plus === null || d.premier === null) return 'unknown'
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

/** The kinds a venue can be: the seven the published dataset uses and nothing else (Bar 5, Pub 1,
 *  Lounge 2, Café 3, Pool bar 7, Restaurant 8, Experience 2). It is the venue form's Kind list and
 *  the source isRestaurant is read against, so the two cannot drift. */
export const VENUE_TYPES = ['Bar', 'Pub', 'Lounge', 'Café', 'Pool bar', 'Restaurant', 'Experience']
export const VENUE_TYPES_RESTAURANT = ['Restaurant', 'Experience']
/** Guarded: a drink or a link can carry a venue key this sailing does not hold, and reading .type
 *  off the miss is one of the four lookups that used to be a white screen. */
export const isRestaurant = (venueKey: string) => {
  const v = VENUES[venueKey]
  return !!v && VENUE_TYPES_RESTAURANT.includes(v.type)
}

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
    // digits only: an absent param is null, and Number(null) is 0, which once pinned every real
    // session to midnight
    const raw = new URLSearchParams(location.search).get('hour')
    if (raw && /^\d{1,2}$/.test(raw) && Number(raw) <= 23) return Number(raw)
  }
  return new Date().getHours()
}
/** ?nosync (QA only) keeps a headless run off the backend entirely: no anonymous sign-in, no
 *  publish, no pull. The live project rate-limits anonymous sign-ins per IP, and every seeded
 *  screenshot used to spend one. */
export function qaNoSync(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).has('nosync')
}
/** ?landing=desktop|phone (QA only) pins which branch of the landing screen renders. `desktop` also
 *  forces the root gate open, because shot.mjs always appends ?seed and a seeded store has already
 *  migrated to entered, so the gate could never be reached otherwise. `phone` forces nothing: it
 *  only pins the branch off, which is what makes it the negative control. Anything else is ignored. */
export function qaLanding(): 'desktop' | 'phone' | null {
  if (typeof location === 'undefined') return null
  const raw = new URLSearchParams(location.search).get('landing')
  return raw === 'desktop' || raw === 'phone' ? raw : null
}
/** Decides which branch of the landing renders, on three conditions together and not width alone: a
 *  phone in landscape can exceed 900px, and a tablet with a trackpad genuinely is a desktop visitor
 *  for this purpose. matchMedia('(hover: hover)') is already the app's test for a pointer device
 *  (avatarSpring.ts), and the typeof guard is that line's. The value is read at render and not
 *  subscribed to: nobody resizes a laptop into a phone mid-install. Lives here beside qaLanding()
 *  rather than in Landing.tsx so that file only exports its component (react(only-export-components)). */
export function isDesktopVisitor(): boolean {
  const forced = qaLanding()
  if (forced) return forced === 'desktop'
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches
}
/** ?entry (QA only) renders the first-open screen once whatever the store says, so it can be shot
 *  from a seeded dev server: index.html seeds at version 2, so the store always migrates through the
 *  step that marks it entered. It does not gate sync, which reads enteredCruise rather than this, so
 *  a seeded run passes ?nosync too. */
export function qaFirstOpen(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).has('entry')
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
