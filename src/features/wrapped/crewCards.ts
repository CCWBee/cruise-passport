// The roundup's crew slides after the first: what the synced passports say about the voyage taken
// together. Insight, never a ranking (DESIGN.md, Social): nobody is placed above anybody, and a slide
// that the data cannot honestly fill is not made. Pure over the sources and a catalogue lookup, and
// it imports types only, so `node --test` runs it without the store or the catalogue loading.
import type { Drink } from '../../data/model'
import type { Entry } from '../../state/stats'
import type { Source } from '../../state/social'

type Lookup = Record<string, Drink>

/** Loved is the app's one bar for it everywhere else (recommendations, "Both loved"): four stars or
 *  a recommendation. Had counts a rating without the tick, as recommendedForYou does. */
const loved = (e: Entry | undefined): boolean => (e?.rating ?? 0) >= 4 || Boolean(e?.rec)
const had = (e: Entry | undefined): boolean => Boolean(e?.tried || e?.rating)
const rating = (e: Entry | undefined): number => {
  const r = e?.rating ?? 0
  return r >= 1 && r <= 5 ? r : 0
}

export interface CrewFavourite { name: string; avg: number; raters: number }

/** The drink the crew rated highest on average. At least three raters when the crew is three or
 *  more, so two people's shared five does not outrank what everyone had; two otherwise. Under four
 *  is not a favourite, so there is no slide. */
export function crewFavourite(srcs: Source[], byId: Lookup): CrewFavourite | null {
  if (srcs.filter((s) => !s.isSelf).length === 0) return null
  const sums = new Map<string, { sum: number; n: number }>()
  for (const s of srcs) {
    for (const [id, e] of Object.entries(s.passport.entries)) {
      const r = rating(e)
      if (!r || !byId[id]) continue
      const acc = sums.get(id) ?? { sum: 0, n: 0 }
      acc.sum += r
      acc.n += 1
      sums.set(id, acc)
    }
  }
  const rank = (min: number) => [...sums.entries()]
    .filter(([, a]) => a.n >= min)
    .map(([id, a]) => ({ name: byId[id].name, avg: a.sum / a.n, raters: a.n }))
    .sort((a, b) => b.avg - a.avg || b.raters - a.raters || a.name.localeCompare(b.name))
  const best = rank(Math.min(3, srcs.length))[0] ?? rank(2)[0]
  return best && best.avg >= 4 ? best : null
}

export interface SplitDecision { name: string; mine: number; friend: string; theirs: number }

/** The drink you and one friend rated furthest apart, two stars or more. Ties go to the drink you
 *  rated higher, since the slide is about your taste, then by name. */
export function splitDecision(srcs: Source[], byId: Lookup): SplitDecision | null {
  const self = srcs.find((s) => s.isSelf)
  if (!self) return null
  let best: (SplitDecision & { gap: number }) | null = null
  for (const [id, e] of Object.entries(self.passport.entries)) {
    const mine = rating(e)
    const drink = byId[id]
    if (!mine || !drink) continue
    for (const f of srcs) {
      if (f.isSelf) continue
      const theirs = rating(f.passport.entries[id])
      if (!theirs) continue
      const gap = Math.abs(mine - theirs)
      if (gap < 2) continue
      const candidate = { name: drink.name, mine, friend: f.name, theirs, gap }
      if (!best || gap > best.gap || (gap === best.gap && (mine > best.mine || (mine === best.mine && drink.name.localeCompare(best.name) < 0)))) best = candidate
    }
  }
  if (!best) return null
  const { gap: _gap, ...split } = best
  return split
}

export interface YourFind { name: string; rating: number }

/** A drink you loved that nobody else in the crew had: the highest rated, a favourite before the
 *  rest, then the latest logged, then by name. Only with a crew, or "nobody else" means nothing. */
export function yourFind(srcs: Source[], byId: Lookup): YourFind | null {
  const self = srcs.find((s) => s.isSelf)
  const friends = srcs.filter((s) => !s.isSelf)
  if (!self || friends.length === 0) return null
  const finds = Object.entries(self.passport.entries)
    .filter(([id, e]) => byId[id] && loved(e) && !friends.some((f) => had(f.passport.entries[id])))
    .sort(([a, ae], [b, be]) => rating(be) - rating(ae)
      || Number(Boolean(be.fav)) - Number(Boolean(ae.fav))
      || (be.date ?? '').localeCompare(ae.date ?? '')
      || byId[a].name.localeCompare(byId[b].name))
  const top = finds[0]
  return top ? { name: byId[top[0]].name, rating: rating(top[1]) } : null
}

export interface NextTime { name: string; by: string[]; note: { name: string; text: string } | null }

/** The crew's pick you never had, from a ranking the caller already made (recommendedForYou, so it
 *  matches Home's Picked for you): who loved it, and the first thing one of them wrote about it. */
export function nextTime(pick: { drink: Drink; by: Source[] } | undefined): NextTime | null {
  if (!pick || pick.by.length === 0) return null
  let note: NextTime['note'] = null
  for (const s of pick.by) {
    const text = s.passport.entries[pick.drink.id]?.comment?.trim()
    if (text) { note = { name: s.name, text }; break }
  }
  return { name: pick.drink.name, by: pick.by.map((s) => s.name), note }
}
