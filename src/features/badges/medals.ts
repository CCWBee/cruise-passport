// The medal case's arithmetic (docs/DESIGN.md, Screens, You): which medals are earned, in reach or
// locked, what is left of one in words, and the sheet's dated line. Read by the case (Badges.tsx) and
// by You's small case, so the two cannot count differently. A module of its own rather than exports
// from Badges.tsx, because a component file that exports anything else loses fast refresh.
import { BADGES, BADGE_UNIT, badgeCount, tierOrder, type BadgeDef, type BadgeStat } from '../../data/badges'
import { earnedOn } from '../../data/earnedOn'
import { DAYS, type Drink } from '../../data/model'
import { computeStats, type Passport } from '../../state/stats'

export interface Progress { cur: number; need: number; pct: number }

export function progressOf(badge: BadgeDef, stat: BadgeStat): Progress | null {
  const p = badge.progress?.(stat)
  if (!p || p.need <= 0) return null
  return { ...p, pct: Math.min(100, Math.max(0, (p.cur / p.need) * 100)) }
}

export interface MedalGroups {
  earned: BadgeDef[]
  reach: { badge: BadgeDef; progress: Progress }[]
  locked: BadgeDef[]
}

/** Earned in tier order (the Champion first, then gold, silver, bronze, and within a tier the
 *  order of BADGES, a count ladder's higher rung first); in reach, anything with a count and something on it, nearest first, so the
 *  first of them is the medal Home's tray names; the rest locked. */
export function medalGroups(stat: BadgeStat): MedalGroups {
  const earned: { badge: BadgeDef; i: number }[] = []
  const reach: MedalGroups['reach'] = []
  const locked: BadgeDef[] = []
  BADGES.forEach((badge, i) => {
    if (badge.test(stat)) { earned.push({ badge, i }); return }
    const progress = progressOf(badge, stat)
    if (progress && progress.cur > 0) reach.push({ badge, progress })
    else locked.push(badge)
  })
  // Within a tier, the rungs of one count ladder sit together at the ladder's first place in BADGES,
  // highest rung first, so "the best medal held" is Fifty rather than Twenty Five
  const key = (e: { badge: BadgeDef; i: number }) => {
    const unit = BADGE_UNIT[e.badge.id]?.[1]
    const first = unit ? BADGES.findIndex((b) => BADGE_UNIT[b.id]?.[1] === unit) : e.i
    return { first, need: unit ? progressOf(e.badge, stat)?.need ?? 0 : 0 }
  }
  earned.sort((a, b) => {
    const ka = key(a), kb = key(b)
    return tierOrder(a.badge) - tierOrder(b.badge) || ka.first - kb.first || kb.need - ka.need || a.i - b.i
  })
  reach.sort((a, b) => b.progress.pct - a.progress.pct)
  return { earned: earned.map((e) => e.badge), reach, locked }
}

/** What an earned medal is, for the line under Home's tray lead and on the case's sheet ("Silver medal · Twenty-five
 *  drinks"). A badge's hint is what to do ("Log twenty five"), which is right in reach and locked
 *  but wrong on a medal already won, so the imperative is turned into what was done: the verb goes,
 *  compound tens take their hyphen, and a count ladder gets its unit. A hint that already names the
 *  thing ("Ten gin drinks", "Half of everything") is said as it is. Derived rather than kept as
 *  a second wording per badge, because the badge data is Isabel's (src/data/badges.ts). */
export function earnedWords(badge: BadgeDef): string {
  let words = badge.hint.replace(/^Log /, '').replace(/^Check in at /, '')
  words = words.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety) (one|two|three|four|five|six|seven|eight|nine)\b/gi, '$1-$2')
  const unit = BADGE_UNIT[badge.id]
  if (unit && words !== badge.hint && !unit.some((u) => words.endsWith(' ' + u))) {
    words += ' ' + (/^one$/i.test(words) ? unit[0] : unit[1])
  }
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const unitOf = (badge: BadgeDef, n: number) => {
  const u = BADGE_UNIT[badge.id]
  return u ? (n === 1 ? u[0] : u[1]) : ''
}

/** What is left of a medal in reach, in its own unit: "1 more whiskey", "23% more of the list". */
export function remainder(badge: BadgeDef, p: Progress): string {
  const left = Math.max(1, p.need - p.cur)
  if (badge.percent) return `${left}% more of the list`
  const unit = unitOf(badge, left)
  return unit ? `${left} more ${unit}` : `${left} more`
}

// Long weekday and month, as Home's greeting says the date: it is read, not scanned.
const longDate = (iso: string): string =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/** The drinks a count badge counted, most recent last: a tried, dated drink counts if taking it away
 *  lowers the badge's count. That asks the badge itself rather than keeping a second list of which
 *  spirit or category each one means. */
function countedRecently(
  badge: BadgeDef, drinks: Drink[], passport: Passport, cur: number,
  statOf: (p: Passport) => BadgeStat, take: number,
): Drink[] {
  // the passport's own order breaks a tie within one day, as drinksOn() does
  const order = Object.keys(passport.entries)
  const dated = drinks
    .filter((d) => passport.entries[d.id]?.tried && passport.entries[d.id]?.date)
    .sort((a, b) => passport.entries[a.id].date!.localeCompare(passport.entries[b.id].date!)
      || order.indexOf(a.id) - order.indexOf(b.id))
  const out: Drink[] = []
  for (let i = dated.length - 1; i >= 0 && out.length < take; i--) {
    const d = dated[i]
    const without: Passport = { ...passport, entries: { ...passport.entries, [d.id]: { ...passport.entries[d.id], tried: false } } }
    const p = badge.progress?.(statOf(without))
    if (p && p.cur < cur) out.unshift(d)
  }
  return out
}

/** The sheet's line under an earned medal, B's: "Struck on day 4, Tuesday 6 October. You are on 15
 *  gins, most recently Mykonos Press and The Lux Classic." The day comes from earnedOn(), and when
 *  the record cannot say which day (an undated drink earned it) the first sentence is left out
 *  rather than guessed. The count is the guest's own and runs past the target; the two drinks are
 *  named only when there are more than two, or the sentence would list everything. */
export function struckLine(badge: BadgeDef, drinks: Drink[], passport: Passport): string {
  const statOf = (p: Passport) => computeStats(drinks, p).badgeStat
  const parts: string[] = []

  const day = earnedOn(badge, passport, statOf)
  if (day) {
    const i = DAYS.indexOf(day)
    parts.push(i > -1 ? `Struck on day ${i + 1}, ${longDate(day)}.` : `Struck on ${longDate(day)}.`)
  }

  const p = badge.progress?.(statOf(passport))
  if (p && badge.percent) parts.push(`You have tried ${p.cur}% of the list.`)
  else if (p && BADGE_UNIT[badge.id]) {
    let line = `You are on ${p.cur} ${unitOf(badge, p.cur)}`
    // venues are checked in as well as drunk at, so a drink is not what Every Bar counts
    if (badge.id !== 'everybar' && p.cur > 2) {
      const names = countedRecently(badge, drinks, passport, p.cur, statOf, 2).map((d) => d.name)
      if (names.length) line += `, most recently ${names.join(' and ')}`
    }
    parts.push(line + '.')
  }
  return parts.join(' ')
}

/** The sheet's line under a medal not yet struck: the count and what is left, or nothing when the
 *  badge has no count (finishing a category) and the hint above already says what earns it. */
export function unstruckLine(badge: BadgeDef, p: Progress | null): string {
  if (!p) return ''
  if (p.cur <= 0) return 'Not started yet.'
  const left = remainder(badge, p)
  return `${badgeCount(badge, p.cur, p.need)}. ${left.charAt(0).toUpperCase()}${left.slice(1)} to strike it.`
}
