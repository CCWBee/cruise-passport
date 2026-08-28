import type { CSSProperties } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IconHome, IconDrinks, IconShip, IconStats, IconBadges, IconLog } from '../ui/Icon'
import './nav.css'

const TABS = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/drinks', label: 'Drinks', Icon: IconDrinks },
  { to: '/ship', label: 'Ship', Icon: IconShip },
  { to: '/stats', label: 'Stats', Icon: IconStats },
  { to: '/badges', label: 'Badges', Icon: IconBadges },
  { to: '/log', label: 'Log', Icon: IconLog },
]

export function Nav() {
  const { pathname } = useLocation()
  const active = Math.max(0, TABS.findIndex((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to))))

  return (
    <nav className="nav glass-live" aria-label="Sections">
      <div className="nav-ind" style={{ '--i': active } as CSSProperties} aria-hidden />
      {TABS.map(({ to, label, Icon }, i) => (
        <NavLink key={to} to={to} end={to === '/'} viewTransition className={({ isActive }) => 'nav-btn pressable' + (isActive ? ' on' : '')}>
          <Icon size={24} filled={i === active} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
