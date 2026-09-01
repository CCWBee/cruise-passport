// Pure social selectors over self + merged friends. No store mutation; mirrors stats.ts.
import { useMemo } from 'react'
import { DRINK_BY_ID, VENUES, isRestaurant, type Drink } from '../data/model'
import type { Passport, Friend } from './stats'
import { useStore, type Profile } from './store'

export interface Source { id: string; name: string; colour: string; passport: Passport; isSelf: boolean }

export function sources(me: Passport, friends: Friend[], profile: Profile): Source[] {
  return [
    { id: profile.id || 'me', name: profile.name || 'You', colour: profile.colour || 'aqua', passport: me, isSelf: true },
    ...friends.map((f) => ({ id: f.id, name: f.name, colour: f.colour, passport: f.passport, isSelf: false })),
  ]
}
export function useSources(): Source[] {
  const me = useStore((s) => s.me)
  const friends = useStore((s) => s.friends)
  const profile = useStore((s) => s.profile)
  return useMemo(() => sources(me, friends, profile), [me, friends, profile])
}

export interface RatingBit { source: Source; rating: number }
export interface GroupRating { avg: number; count: number; mine: number | null; bits: RatingBit[] }
export function groupRating(drinkId: string, srcs: Source[]): GroupRating {
  const bits: RatingBit[] = []
  let mine: number | null = null
  for (const s of srcs) {
    const r = s.passport.entries[drinkId]?.rating
    if (r && r >= 1 && r <= 5) { bits.push({ source: s, rating: r }); if (s.isSelf) mine = r }
  }
  const count = bits.length
  return { count, mine, avg: count ? bits.reduce((a, b) => a + b.rating, 0) / count : 0, bits }
}

export interface Rec { source: Source; note?: string }
export function recommendationsFor(drinkId: string, srcs: Source[]): Rec[] {
  return srcs.filter((s) => s.passport.entries[drinkId]?.rec)
    .map((s) => ({ source: s, note: s.passport.entries[drinkId]?.comment || undefined }))
}

export interface Comment { source: Source; text: string; rating?: number }
export function commentsFor(drinkId: string, srcs: Source[]): Comment[] {
  return srcs.filter((s) => (s.passport.entries[drinkId]?.comment || '').trim())
    .map((s) => ({ source: s, text: s.passport.entries[drinkId]!.comment!.trim(), rating: s.passport.entries[drinkId]?.rating }))
}

export interface BarScore { venueKey: string; name: string; avg: number; count: number }
export function bestRatedBars(srcs: Source[], opts: { minRatings?: number; barsOnly?: boolean } = {}): BarScore[] {
  const min = opts.minRatings ?? 2
  const acc: Record<string, { sum: number; n: number }> = {}
  for (const s of srcs) for (const [id, e] of Object.entries(s.passport.entries)) {
    const r = e.rating
    if (!r || r < 1 || r > 5) continue
    const d = DRINK_BY_ID[id]
    if (!d) continue
    if (opts.barsOnly && isRestaurant(d.venue)) continue
    ;(acc[d.venue] ??= { sum: 0, n: 0 })
    acc[d.venue].sum += r
    acc[d.venue].n += 1
  }
  return Object.entries(acc).filter(([, v]) => v.n >= min)
    .map(([vk, v]) => ({ venueKey: vk, name: VENUES[vk]?.name || vk, avg: v.sum / v.n, count: v.n }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
}

// ── taste affinity: how closely a friend's palate matches yours ──
// Mean absolute rating difference on co-rated drinks (NOT correlation: n is tiny, and a friend
// who rates everything 5 has zero variance -> Pearson divides by zero). affinity in 0..1.
export interface Affinity { source: Source; affinity: number; coRated: number }
export function tasteAffinity(me: Passport, srcs: Source[]): Affinity[] {
  return srcs.filter((s) => !s.isSelf).map((s) => {
    let sum = 0, n = 0
    for (const [id, e] of Object.entries(me.entries)) {
      const mine = e.rating, theirs = s.passport.entries[id]?.rating
      if (mine && theirs) { sum += Math.abs(mine - theirs); n += 1 }
    }
    return { source: s, coRated: n, affinity: n ? 1 - (sum / n) / 4 : 0 }
  }).sort((a, b) => b.affinity - a.affinity || b.coRated - a.coRated || a.source.name.localeCompare(b.source.name))
}
/** The closest-palate friend, but only claimed when there is enough shared signal AND they genuinely
 *  agree (>= ~0.62 = within ~1.5 stars on average). Otherwise "shares your taste" would be a lie. */
export function tasteTwin(me: Passport, srcs: Source[], minCoRated = 3, minAffinity = 0.62): Affinity | null {
  const top = tasteAffinity(me, srcs)[0]
  return top && top.coRated >= minCoRated && top.affinity >= minAffinity ? top : null
}
/** Recommendation weight for a friend: continuous, so low-signal friends degrade to the old count-based behaviour. */
function friendWeight(aff: Map<string, Affinity>, id: string): number {
  const a = aff.get(id)
  return a ? 0.4 + 0.6 * (a.affinity * Math.min(a.coRated, 6) / 6) : 0.4
}

// ── collective reach: what the group has found together (collaborative, never a ranking) ──
export interface GroupReach { total: number; triedTogether: number; onlyFriends: number }
export function groupReach(srcs: Source[]): GroupReach {
  const selfTried = new Set<string>(), all = new Set<string>()
  for (const s of srcs) for (const [id, e] of Object.entries(s.passport.entries)) {
    if (e.tried && DRINK_BY_ID[id]) { all.add(id); if (s.isSelf) selfTried.add(id) }
  }
  let onlyFriends = 0
  all.forEach((id) => { if (!selfTried.has(id)) onlyFriends += 1 })
  return { total: Object.keys(DRINK_BY_ID).length, triedTogether: all.size, onlyFriends }
}

export interface FriendPick { drink: Drink; avg: number; by: Source[]; score: number }
export function recommendedForYou(me: Passport, srcs: Source[], limit = 4): FriendPick[] {
  const friends = srcs.filter((s) => !s.isSelf)
  const aff = new Map(tasteAffinity(me, srcs).map((a) => [a.source.id, a]))
  const picks: FriendPick[] = []
  for (const [id, d] of Object.entries(DRINK_BY_ID)) {
    if (me.entries[id]?.tried) continue
    const bits = friends.map((s) => ({ s, e: s.passport.entries[id] }))
      .filter((x) => x.e?.rec || (x.e?.rating ?? 0) >= 4)
    if (!bits.length) continue
    const rated = bits.filter((x) => x.e?.rating)
    picks.push({
      drink: d, by: bits.map((x) => x.s),
      avg: rated.length ? rated.reduce((a, x) => a + x.e!.rating!, 0) / rated.length : 0,
      // weighted by taste affinity: a friend who shares your palate carries more
      score: bits.reduce((acc, x) => acc + ((x.e?.rating ?? 4) / 5) * friendWeight(aff, x.s.id), 0),
    })
  }
  return picks.sort((a, b) => b.score - a.score || b.by.length - a.by.length || b.avg - a.avg).slice(0, limit)
}
