import type { CSSProperties } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IconHome, IconDrinks, IconShip, IconSocial, IconStats } from '../ui/Icon'
import './nav.css'

// Five destinations. Stats, Badges and Log live behind "You" (a segmented control on that page);
// their routes still resolve, so every old link lands, and any of them lights this tab.
const TABS = [
  { to: '/', label: 'Home', Icon: IconHome, match: (p: string) => p === '/' },
  { to: '/drinks', label: 'Drinks', Icon: IconDrinks, match: (p: string) => p.startsWith('/drinks') },
  { to: '/ship', label: 'Ship', Icon: IconShip, match: (p: string) => p.startsWith('/ship') },
  { to: '/social', label: 'Crew', Icon: IconSocial, match: (p: string) => p.startsWith('/social') },
  { to: '/stats', label: 'You', Icon: IconStats, match: (p: string) => /^\/(you|stats|badges|log)/.test(p) },
]

export function Nav() {
  const { pathname } = useLocation()
  const active = Math.max(0, TABS.findIndex((t) => t.match(pathname)))
  return (
    <nav className="nav glass-live glass-edge" aria-label="Sections">
      <div className="nav-lens" style={{ '--i': active, '--n': TABS.length } as CSSProperties} aria-hidden />
      {TABS.map(({ to, label, Icon }, i) => {
        const on = i === active
        return (
          <NavLink key={to} to={to} viewTransition className={'nav-btn' + (on ? ' on' : '')} aria-current={on ? 'page' : undefined}>
            <Icon size={24} />
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
