// Cruise Wrapped — derive the story cards from real data. Source-parameterised (self today; a
// friend or the group later reuses the same pipeline via per-source attribution).
import { VENUES, DAYS, prettyDay, type Drink } from '../../data/model'
import { computeStats, type Passport } from '../../state/stats'
import { BADGES } from '../../data/badges'

export type WrappedKind =
  | 'cover' | 'tried' | 'topbar' | 'spirit' | 'bigday' | 'decks' | 'archetype' | 'medals' | 'moment' | 'finale'

export interface WrappedCard {
  kind: WrappedKind
  eyebrow?: string
  headline?: string
  big?: string // large count-up-able number as string
  bigSuffix?: string
  value?: string
  sub?: string
  accent: string // css var
}

const ARCHETYPE: Record<string, { name: string; line: string }> = {
  Tropical: { name: 'The Beachcomber', line: 'Give you an umbrella and a sea view and you are home.' },
  Strong: { name: 'The Purist', line: 'You came for the spirit, not the sugar.' },
  Sweet: { name: 'The Sweet Tooth', line: 'Pudding in a glass, and no apologies.' },
  Bitter: { name: 'The Sophisticate', line: 'The bartender nods when you order.' },
  Refreshing: { name: 'The Deck Cruiser', line: 'Long, cold and easy, all day on the water.' },
  Sour: { name: 'The Zest Seeker', line: 'Sharp, bright and wide awake.' },
  Fruity: { name: 'The Orchard', line: 'If it grows on a tree, you will drink it.' },
  Coffee: { name: 'The Night Owl', line: 'The voyage does not end at sundown.' },
  Dessert: { name: 'The Sweet Tooth', line: 'Pudding in a glass, and no apologies.' },
}

export function deriveWrapped(drinks: Drink[], passport: Passport): WrappedCard[] {
  const s = computeStats(drinks, passport)
  const E = (id: string) => passport.entries[id] || {}

  // flavour tally over tried drinks -> archetype
  const flavours: Record<string, number> = {}
  s.tried.forEach((d) => d.flavors.forEach((f) => { flavours[f] = (flavours[f] || 0) + 1 }))
  const topFlavour = Object.keys(flavours).sort((a, b) => flavours[b] - flavours[a])[0]
  const archetype = ARCHETYPE[topFlavour] || { name: 'The Voyager', line: 'A little of everything the ship pours.' }

  // biggest day
  const dayEntries = Object.entries(s.byDay).map(([iso, list]) => ({ iso, n: list.length }))
  const biggest = dayEntries.sort((a, b) => b.n - a.n)[0]

  // favourite spirit excluding Wine/Beer
  const spirit = Object.keys(s.bySpirit)
    .filter((x) => x !== 'Wine' && x !== 'Beer')
    .sort((a, b) => s.bySpirit[b] - s.bySpirit[a])[0]

  const medals = BADGES.filter((b) => b.test(s.badgeStat)).length
  const dayIndex = biggest ? DAYS.indexOf(biggest.iso) + 1 : 0
  void E

  const cards: WrappedCard[] = [
    { kind: 'cover', eyebrow: 'Sun Princess · 3 to 17 October', headline: 'Your voyage,\nwrapped', accent: 'var(--coral)' },
    { kind: 'tried', eyebrow: 'You sipped', big: String(s.n), value: `of ${s.total} aboard`, sub: `${s.pct.toFixed(0)}% of the ship`, accent: 'var(--coral)' },
  ]
  if (s.favVenue) cards.push({ kind: 'topbar', eyebrow: 'Your bar', headline: VENUES[s.favVenue].name, sub: `${s.favVenueN} drinks · Deck ${VENUES[s.favVenue].deck}`, accent: 'var(--aqua)' })
  if (spirit) cards.push({ kind: 'spirit', eyebrow: 'Your spirit', headline: spirit, big: String(s.bySpirit[spirit]), bigSuffix: ' drinks', accent: 'var(--fruit-mango)' })
  if (biggest && biggest.n > 1) cards.push({ kind: 'bigday', eyebrow: 'Your biggest day', headline: `Day ${dayIndex}`, big: String(biggest.n), bigSuffix: ' drinks', sub: prettyDay(biggest.iso), accent: 'var(--fruit-grape)' })
  cards.push({ kind: 'decks', eyebrow: 'You explored', big: String(s.venues), value: `of ${Object.keys(VENUES).length} venues`, sub: `${s.bars}/${s.barsTotal} bars`, accent: 'var(--sea-hi)' })
  if (s.n >= 3) cards.push({ kind: 'archetype', eyebrow: 'Your cocktail archetype', headline: archetype.name, sub: archetype.line, accent: 'var(--fruit-melon)' })
  cards.push({ kind: 'medals', eyebrow: 'You earned', big: String(medals), value: `of ${BADGES.length} medals`, accent: 'var(--gold)' })
  cards.push({ kind: 'moment', eyebrow: 'The tide came in', headline: `${s.pct.toFixed(0)}%`, sub: `${s.n} of ${s.total} drinks`, accent: 'var(--sea-hi)' })
  cards.push({ kind: 'finale', eyebrow: 'Sun Princess Cocktail Passport', headline: 'Until the next voyage', sub: `${s.n} drinks · ${s.venues} venues · ${medals} medals`, accent: 'var(--coral)' })
  return cards
}

export function wrappedUnlocked(drinks: Drink[], passport: Passport): boolean {
  const past = new Date() > new Date('2026-10-17T23:59:59')
  const s = computeStats(drinks, passport)
  return past || s.n >= 25
}
