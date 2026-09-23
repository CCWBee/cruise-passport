import { IconHome, IconDrinks, IconShip, IconSocial, IconStats } from '../ui/Icon'

// Five destinations. Stats, Badges and Log live behind "You" (a segmented control on that page);
// their routes still resolve, so every old link lands, and any of them lights this tab. Its own module
// so the dock (Nav.tsx) and Shell, which keys the screen and names the top bar by it, read one list.
export const TABS = [
  { to: '/', label: 'Home', Icon: IconHome, match: (p: string) => p === '/' },
  { to: '/drinks', label: 'Drinks', Icon: IconDrinks, match: (p: string) => p.startsWith('/drinks') },
  { to: '/ship', label: 'Ship', Icon: IconShip, match: (p: string) => p.startsWith('/ship') },
  { to: '/social', label: 'Crew', Icon: IconSocial, match: (p: string) => p.startsWith('/social') },
  { to: '/stats', label: 'You', Icon: IconStats, match: (p: string) => /^\/(you|stats|badges|log)/.test(p) },
]

/** The tab a path lights, or -1 (/add, /join and a stray link light nothing). */
export const tabOf = (path: string): number => TABS.findIndex((t) => t.match(path))
