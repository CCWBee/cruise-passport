import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAllDrinks, useStore } from '../../state/store'
import { wrappedUnlocked } from './wrappedData'
import './wrapped.css'

export function WrappedTeaser() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const [seen] = useState(() => {
    try { return localStorage.getItem('spcc-wrapped-seen') === '1' } catch { return false }
  })
  if (!wrappedUnlocked(drinks, me)) return null
  return (
    <Link
      to="/wrapped"
      className="wr-teaser glass pressable"
      viewTransition
      aria-label={seen ? 'Open your Cruise Wrapped again' : 'Open your Cruise Wrapped'}
    >
      <span className="wr-teaser-copy">
        <span className="eyebrow">Cruise Wrapped</span>
        <span className="wr-teaser-title">
          {seen ? 'Your voyage story is ready to revisit' : 'Your Sun Princess story is ready'}
        </span>
        <span className="wr-teaser-action">Open your story</span>
      </span>
      <svg className="wr-teaser-seal" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="20" />
        <circle cx="28" cy="28" r="14" />
        <path d="M20 30c5-7 11-7 16 0M20 35c5-7 11-7 16 0" />
      </svg>
    </Link>
  )
}
