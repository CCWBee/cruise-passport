// The 18 achievements. Predicates run over a computed BadgeStat snapshot.
// Each badge's face is the drawn emblem in features/badges/emblems-data.ts (the `emoji` field is a
// legacy key, not rendered); Medallion.tsx strikes it into a tiered coin, locked = a quiet grey disc.

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
}

export const BADGES: BadgeDef[] = [
  { id: 'first', emoji: '🥇', name: 'First Sip', hint: 'Log one drink', tier: 'bronze', test: (s) => s.n >= 1, progress: (s) => ({ cur: s.n, need: 1 }) },
  { id: 'ten', emoji: '🔟', name: 'Ten Down', hint: 'Log ten', tier: 'bronze', test: (s) => s.n >= 10, progress: (s) => ({ cur: s.n, need: 10 }) },
  { id: 'twentyfive', emoji: '🎉', name: 'Twenty Five', hint: 'Log twenty five', tier: 'silver', test: (s) => s.n >= 25, progress: (s) => ({ cur: s.n, need: 25 }) },
  { id: 'fifty', emoji: '🌟', name: 'Fifty', hint: 'Log fifty', tier: 'silver', test: (s) => s.n >= 50, progress: (s) => ({ cur: s.n, need: 50 }) },
  { id: 'hundred', emoji: '💯', name: 'One Hundred', hint: 'Log one hundred', tier: 'gold', test: (s) => s.n >= 100, progress: (s) => ({ cur: s.n, need: 100 }) },
  { id: 'onefifty', emoji: '🚀', name: 'One Fifty', hint: 'Log one hundred and fifty', tier: 'gold', test: (s) => s.n >= 150, progress: (s) => ({ cur: s.n, need: 150 }) },
  { id: 'twohundred', emoji: '👑', name: 'Two Hundred', hint: 'Log two hundred', tier: 'gold', test: (s) => s.n >= 200, progress: (s) => ({ cur: s.n, need: 200 }) },
  { id: 'everybar', emoji: '🗺️', name: 'Every Bar', hint: 'Check in at all 28 venues', tier: 'gold', test: (s) => s.venues >= s.totalVenues, progress: (s) => ({ cur: s.venues, need: s.totalVenues }) },
  { id: 'martini', emoji: '🍸', name: 'Martini Club', hint: 'Every martini on board', tier: 'silver', test: (s) => s.catDone('Martini') },
  { id: 'margarita', emoji: '🍋', name: 'Margarita Queen', hint: 'Every margarita', tier: 'silver', test: (s) => s.catDone('Margarita') },
  { id: 'frozen', emoji: '🧊', name: 'Brain Freeze', hint: 'Every frozen drink', tier: 'silver', test: (s) => s.frozenDone },
  { id: 'coffee', emoji: '☕', name: 'Coffee Expert', hint: 'Eight coffee cocktails', tier: 'bronze', test: (s) => s.cat('Coffee') >= 8, progress: (s) => ({ cur: s.cat('Coffee'), need: 8 }) },
  { id: 'whiskey', emoji: '🥃', name: 'Whiskey Lover', hint: 'Ten whiskey or bourbon', tier: 'silver', test: (s) => s.sp('Whiskey') + s.sp('Bourbon') >= 10, progress: (s) => ({ cur: s.sp('Whiskey') + s.sp('Bourbon'), need: 10 }) },
  { id: 'gin', emoji: '🌿', name: 'Gin Explorer', hint: 'Ten gin drinks', tier: 'silver', test: (s) => s.sp('Gin') >= 10, progress: (s) => ({ cur: s.sp('Gin'), need: 10 }) },
  { id: 'rum', emoji: '🏴‍☠️', name: 'Rum Captain', hint: 'Twelve rum drinks', tier: 'silver', test: (s) => s.sp('Rum') >= 12, progress: (s) => ({ cur: s.sp('Rum'), need: 12 }) },
  { id: 'wine', emoji: '🍷', name: 'Wine Connoisseur', hint: 'Twelve wines by the glass', tier: 'silver', test: (s) => s.cat('Wine') >= 12, progress: (s) => ({ cur: s.cat('Wine'), need: 12 }) },
  { id: 'master', emoji: '🎩', name: 'Cocktail Master', hint: 'Half of everything', tier: 'gold', test: (s) => s.pct >= 50, progress: (s) => ({ cur: Math.round(s.pct), need: 50 }) },
  { id: 'champion', emoji: '🏆', name: 'Sun Princess Champion', hint: 'Ninety per cent', tier: 'special', test: (s) => s.pct >= 90, progress: (s) => ({ cur: Math.round(s.pct), need: 90 }) },
]
