// The 18 achievements. Predicates run over a computed BadgeStat snapshot.
// Each badge's face is the drawn emblem in features/badges/emblems-data.ts (the `emoji` field is a
// legacy key, not rendered); Coin.tsx strikes it into the tier's metal, and a medal not yet earned is
// a gunmetal blank. The day a badge was earned is earnedOn.ts, beside this file.
//
// SHIP comes from data/model, not from activeCruise(), so the ship's name has one source. It makes
// this file need localStorage at import, which is why restore.ts must not import it, and does not.
import { SHIP } from './model'

export interface BadgeStat {
  n: number // drinks tried
  venues: number // distinct venues checked in / drunk at
  totalVenues: number
  pct: number // 0..100 completion
  frozenDone: boolean
  cat: (c: string) => number // count tried in a category
  catDone: (c: string) => boolean // whole category tried
  sp: (x: string) => number // count tried carrying a spirit
}

export interface BadgeDef {
  id: string
  emoji: string
  name: string
  hint: string
  test: (s: BadgeStat) => boolean
  /** live progress for count-type badges (locked-state "7 of 12") */
  progress?: (s: BadgeStat) => { cur: number; need: number }
  tier?: 'bronze' | 'silver' | 'gold' | 'special'
  /** progress is per cent of the list, not a count of drinks */
  percent?: true
}

/** "58 of 100", or "27% of 50%" for a percentage badge. Everywhere else in the app "n of m" counts
 *  drinks, so a percentage says so in its own figures rather than leaning on the hint. */
export const badgeCount = (badge: BadgeDef, cur: number, need: number): string =>
  badge.percent ? `${cur}% of ${need}%` : `${cur} of ${need}`

export type Tier = NonNullable<BadgeDef['tier']>

/** The medal ladder, highest first: the order the case, Home's tray and Wrapped lay coins out in,
 *  and the order topMedal picks by. One rank, so no two screens can rank a medal differently. */
export const TIER_ORDER: Record<Tier, number> = { special: 0, gold: 1, silver: 2, bronze: 3 }
export const tierOrder = (badge: BadgeDef): number => TIER_ORDER[badge.tier ?? 'bronze']

/** The tier in words, said beside the metal so the metal does not carry the rank alone. C's words:
 *  the ship's Champion is its own tier, and "Special" said nothing a guest could picture. */
export const TIER_WORD: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  special: 'Champion',
}

/** What a badge's count is a count of, so a line reads as a sentence ("1 more whiskey"). An id with
 *  no unit is a percentage badge, or one earned by finishing a whole category, which has no count. */
export const BADGE_UNIT: Record<string, [one: string, many: string]> = {
  first: ['drink', 'drinks'], ten: ['drink', 'drinks'], twentyfive: ['drink', 'drinks'],
  fifty: ['drink', 'drinks'], hundred: ['drink', 'drinks'], onefifty: ['drink', 'drinks'],
  twohundred: ['drink', 'drinks'], everybar: ['venue', 'venues'],
  coffee: ['coffee cocktail', 'coffee cocktails'], whiskey: ['whiskey', 'whiskeys'],
  gin: ['gin', 'gins'], rum: ['rum', 'rums'], wine: ['wine', 'wines'],
}

export const BADGES: BadgeDef[] = [
  { id: 'first', emoji: '🥇', name: 'First Sip', hint: 'Log one drink', tier: 'bronze', test: (s) => s.n >= 1, progress: (s) => ({ cur: s.n, need: 1 }) },
  { id: 'ten', emoji: '🔟', name: 'Ten Down', hint: 'Log ten', tier: 'bronze', test: (s) => s.n >= 10, progress: (s) => ({ cur: s.n, need: 10 }) },
  { id: 'twentyfive', emoji: '🎉', name: 'Twenty Five', hint: 'Log twenty five', tier: 'silver', test: (s) => s.n >= 25, progress: (s) => ({ cur: s.n, need: 25 }) },
  { id: 'fifty', emoji: '🌟', name: 'Fifty', hint: 'Log fifty', tier: 'silver', test: (s) => s.n >= 50, progress: (s) => ({ cur: s.n, need: 50 }) },
  { id: 'hundred', emoji: '💯', name: 'One Hundred', hint: 'Log one hundred', tier: 'gold', test: (s) => s.n >= 100, progress: (s) => ({ cur: s.n, need: 100 }) },
  { id: 'onefifty', emoji: '🚀', name: 'One Fifty', hint: 'Log one hundred and fifty', tier: 'gold', test: (s) => s.n >= 150, progress: (s) => ({ cur: s.n, need: 150 }) },
  { id: 'twohundred', emoji: '👑', name: 'Two Hundred', hint: 'Log two hundred', tier: 'gold', test: (s) => s.n >= 200, progress: (s) => ({ cur: s.n, need: 200 }) },
  // The hint no longer names 28, because 28 is a fact about one sailing. The zero test is not
  // pedantry: without it 0 >= 0 earns the badge the moment a sailing has no venues, and with it
  // progressOf returns null for need <= 0, so it lands in Locked rather than in Close or Earned.
  { id: 'everybar', emoji: '🗺️', name: 'Every Bar', hint: 'Check in at every venue', tier: 'gold', test: (s) => s.totalVenues > 0 && s.venues >= s.totalVenues, progress: (s) => ({ cur: s.venues, need: s.totalVenues }) },
  { id: 'martini', emoji: '🍸', name: 'Martini Club', hint: 'Every martini on board', tier: 'silver', test: (s) => s.catDone('Martini') },
  { id: 'margarita', emoji: '🍋', name: 'Margarita Queen', hint: 'Every margarita', tier: 'silver', test: (s) => s.catDone('Margarita') },
  { id: 'frozen', emoji: '🧊', name: 'Brain Freeze', hint: 'Every frozen drink', tier: 'silver', test: (s) => s.frozenDone },
  { id: 'coffee', emoji: '☕', name: 'Coffee Expert', hint: 'Eight coffee cocktails', tier: 'bronze', test: (s) => s.cat('Coffee') >= 8, progress: (s) => ({ cur: s.cat('Coffee'), need: 8 }) },
  { id: 'whiskey', emoji: '🥃', name: 'Whiskey Lover', hint: 'Ten whiskey or bourbon', tier: 'silver', test: (s) => s.sp('Whiskey') + s.sp('Bourbon') >= 10, progress: (s) => ({ cur: s.sp('Whiskey') + s.sp('Bourbon'), need: 10 }) },
  { id: 'gin', emoji: '🌿', name: 'Gin Explorer', hint: 'Ten gin drinks', tier: 'silver', test: (s) => s.sp('Gin') >= 10, progress: (s) => ({ cur: s.sp('Gin'), need: 10 }) },
  { id: 'rum', emoji: '🏴‍☠️', name: 'Rum Captain', hint: 'Twelve rum drinks', tier: 'silver', test: (s) => s.sp('Rum') >= 12, progress: (s) => ({ cur: s.sp('Rum'), need: 12 }) },
  { id: 'wine', emoji: '🍷', name: 'Wine Connoisseur', hint: 'Twelve wines by the glass', tier: 'silver', test: (s) => s.cat('Wine') >= 12, progress: (s) => ({ cur: s.cat('Wine'), need: 12 }) },
  { id: 'master', emoji: '🎩', name: 'Cocktail Master', hint: 'Half of everything', tier: 'gold', percent: true, test: (s) => s.pct >= 50, progress: (s) => ({ cur: Math.round(s.pct), need: 50 }) },
  // The one badge whose name is read from the data: the October crowd still earns Sun Princess
  // Champion, and a guest on a sailing they set up earns their own ship's.
  { id: 'champion', emoji: '🏆', name: SHIP + ' Champion', hint: 'Ninety per cent', tier: 'special', percent: true, test: (s) => s.pct >= 90, progress: (s) => ({ cur: Math.round(s.pct), need: 90 }) },
]
