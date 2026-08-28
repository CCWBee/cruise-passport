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

export interface FriendPick { drink: Drink; avg: number; by: Source[] }
export function recommendedForYou(me: Passport, srcs: Source[], limit = 4): FriendPick[] {
  const friends = srcs.filter((s) => !s.isSelf)
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
    })
  }
  return picks.sort((a, b) => b.by.length - a.by.length || b.avg - a.avg).slice(0, limit)
}
