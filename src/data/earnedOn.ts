// The day a medal was struck. Beside badges.ts rather than in it, because badges.ts reads SHIP from
// data/model at import and so cannot be loaded under `node --test`; this file imports types only,
// which are erased, so earnedOn.test.ts runs it for real.
import type { BadgeDef, BadgeStat } from './badges'
import type { Passport } from '../state/stats'

/** The ISO day a badge's test first passed, found by replaying the guest's own record in date
 *  order: for each day anything was logged or checked in, the passport as it stood at the end of
 *  that day is put through `statOf` (the app passes `(p) => computeStats(drinks, p).badgeStat`, the
 *  same computation every screen reads) and the first day the badge passes is the answer.
 *
 *  Null when the badge is not earned, and also when it is earned but only with a drink or a visit
 *  that carries no date: then the day cannot be known, and the sheet leaves the dated line out
 *  rather than naming a day the record does not support. An undated entry is left out of the
 *  replay altogether, so where the dated record earns the badge by itself the answer is the day it
 *  did, which may be later than the day the undated drink actually tipped it. Every test is
 *  monotonic in what has been tried, so the first passing day is the day it was earned. */
export function earnedOn(
  badge: Pick<BadgeDef, 'test'>,
  passport: Passport,
  statOf: (p: Passport) => BadgeStat,
): string | null {
  const days = new Set<string>()
  for (const e of Object.values(passport.entries)) if (e?.tried && e.date) days.add(e.date)
  for (const v of Object.values(passport.visits)) if (v?.visited && v.date) days.add(v.date)

  // ISO dates sort as strings, whatever order the passport holds its keys in
  for (const day of [...days].sort()) {
    const asOf: Passport = { entries: {}, visits: {} }
    for (const [id, e] of Object.entries(passport.entries)) {
      if (e?.tried && e.date && e.date <= day) asOf.entries[id] = e
    }
    for (const [key, v] of Object.entries(passport.visits)) {
      if (v?.visited && v.date && v.date <= day) asOf.visits[key] = v
    }
    if (badge.test(statOf(asOf))) return day
  }
  return null
}
