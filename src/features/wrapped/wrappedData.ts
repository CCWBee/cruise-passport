import { BADGES } from '../../data/badges'
import { END, START, VENUES, type Drink } from '../../data/model'
import { computeStats, type Passport, type Stats } from '../../state/stats'

export const WRAPPED_TOTAL = 214

export interface WrappedArchetype {
  name: string
  blurb: string
  traits: string[]
}

export type WrappedCard =
  | { kind: 'cover'; dateRange: string }
  | { kind: 'tried'; count: number; pct: number }
  | { kind: 'topbar'; venue: string; deck: number; count: number }
  | { kind: 'spirit'; spirit: string; count: number }
  | { kind: 'bigday'; date: string; count: number }
  | { kind: 'decks'; count: number; venues: number; decks: number[] }
  | { kind: 'archetype'; archetype: WrappedArchetype }
  | { kind: 'medals'; count: number; total: number }
  | { kind: 'moment' }
  | {
      kind: 'finale'
      count: number
      pct: number
      archetype: WrappedArchetype | null
      topBar: string | null
      spirit: string | null
      medals: number
    }

const ARCHETYPES: Record<string, Omit<WrappedArchetype, 'traits'>> = {
  spiritForward: { name: 'Spirit-Forward', blurb: 'You take it strong and unsweetened, and you have opinions.' },
  sweetTooth: { name: 'Sweet Tooth', blurb: 'Pudding in a glass, and no apology for it.' },
  classicist: { name: 'The Classicist', blurb: 'Martinis and old standards. You know what you like.' },
  explorer: { name: 'The Explorer', blurb: 'You roamed the ship and tried a bit of everything.' },
  regular: { name: 'The Regular', blurb: 'One bar adopted you. You repaid the loyalty.' },
  poolsider: { name: 'The Poolsider', blurb: 'If it was frozen, you were there.' },
  sipper: { name: 'The Sipper', blurb: 'You proved a good night needs no proof.' },
  completionist: { name: 'The Completionist', blurb: 'You came to drink the ship dry, and nearly did.' },
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  values.forEach((value) => { counts[value] = (counts[value] || 0) + 1 })
  return counts
}

function topKey(counts: Record<string, number>): string | null {
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))[0] || null
}

function deriveArchetype(stats: Stats): WrappedArchetype | null {
  const cocktails = stats.tried.filter((drink) => drink.category !== 'Wine' && drink.category !== 'Beer')
  if (!cocktails.length) return null

  const n = cocktails.length
  const categories = countBy(cocktails.map((drink) => drink.category))
  const flavours = countBy(cocktails.flatMap((drink) => drink.flavors))
  const venues = countBy(cocktails.map((drink) => drink.venue))
  const averageSweet = cocktails.reduce((sum, drink) => sum + drink.sweet, 0) / n
  const averageStrength = cocktails.reduce((sum, drink) => sum + drink.strength, 0) / n
  const classicShare = cocktails.filter((drink) => drink.category === 'Classic' || drink.category === 'Martini').length / n
  const frozenShare = cocktails.filter((drink) => drink.frozen).length / n
  const mocktailShare = cocktails.filter((drink) => drink.category === 'Mocktail').length / n
  const topVenue = topKey(venues)
  const loyalty = topVenue ? venues[topVenue] / n : 0
  const scores: Record<string, number> = {
    spiritForward: averageStrength * 1.35 + (5 - averageSweet) * .8,
    sweetTooth: averageSweet * 1.4 + ((flavours.Sweet || 0) / n) * 3,
    classicist: classicShare * 8 + averageStrength * .35,
    explorer: Math.min(1, Object.keys(venues).length / 6) * 5 + Math.min(1, Object.keys(categories).length / 6) * 4,
    regular: loyalty * 8,
    poolsider: frozenShare * 9,
    sipper: mocktailShare * 9 + (5 - averageStrength) * .4,
    completionist: (stats.pct / 100) * 8,
  }
  const id = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0]
  const traits = [topKey(flavours), topKey(categories), `${Object.keys(venues).length} venues`]
    .filter((value): value is string => Boolean(value))
  return { ...ARCHETYPES[id], traits }
}

function voyageDateRange(): string {
  const start = new Date(`${START}T12:00:00`)
  const end = new Date(`${END}T12:00:00`)
  return `${start.getDate()} to ${end.getDate()} ${end.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
}

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function favouriteSpirit(stats: Stats): { spirit: string; count: number } | null {
  const result = Object.entries(stats.bySpirit)
    .filter(([spirit]) => spirit !== 'Wine' && spirit !== 'Beer')
    .sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b))[0]
  return result ? { spirit: result[0], count: result[1] } : null
}

function visitedDecks(stats: Stats, passport: Passport): number[] {
  const venueKeys = new Set(stats.tried.map((drink) => drink.venue))
  Object.entries(passport.visits).forEach(([key, visit]) => { if (visit.visited) venueKeys.add(key) })
  return Array.from(new Set(
    Array.from(venueKeys, (key) => VENUES[key]?.deck).filter((deck): deck is number => Boolean(deck)),
  )).sort((a, b) => a - b)
}

export function deriveWrapped(drinks: Drink[], passport: Passport): WrappedCard[] {
  const stats = computeStats(drinks, passport)
  const cards: WrappedCard[] = [{ kind: 'cover', dateRange: voyageDateRange() }]
  const pct = Math.min(100, stats.n / WRAPPED_TOTAL * 100)
  const spirit = favouriteSpirit(stats)
  const biggestDay = Object.entries(stats.byDay)
    .sort(([a, aDrinks], [b, bDrinks]) => bDrinks.length - aDrinks.length || a.localeCompare(b))[0]
  const decks = visitedDecks(stats, passport)
  const archetype = deriveArchetype(stats)
  const medals = BADGES.filter((badge) => badge.test(stats.badgeStat)).length

  if (stats.n > 0) cards.push({ kind: 'tried', count: stats.n, pct })
  if (stats.favVenue && stats.favVenueN > 0) {
    cards.push({
      kind: 'topbar',
      venue: VENUES[stats.favVenue]?.name || stats.favVenue,
      deck: VENUES[stats.favVenue]?.deck || 0,
      count: stats.favVenueN,
    })
  }
  if (spirit) cards.push({ kind: 'spirit', ...spirit })
  if (biggestDay?.[1].length) cards.push({ kind: 'bigday', date: formatDay(biggestDay[0]), count: biggestDay[1].length })
  if (decks.length) cards.push({ kind: 'decks', count: decks.length, venues: stats.venues, decks })
  if (archetype) cards.push({ kind: 'archetype', archetype })
  if (medals > 0) cards.push({ kind: 'medals', count: medals, total: BADGES.length })
  cards.push({ kind: 'moment' })
  cards.push({
    kind: 'finale', count: stats.n, pct, archetype,
    topBar: stats.favVenue ? VENUES[stats.favVenue]?.name || stats.favVenue : null,
    spirit: spirit?.spirit || null, medals,
  })
  return cards
}

export function wrappedUnlocked(drinks: Drink[], passport: Passport, now = Date.now()): boolean {
  return now > new Date(`${END}T23:59:59`).getTime() || computeStats(drinks, passport).n >= 25
}

export { voyageDateRange }
