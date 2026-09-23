import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAllDrinks, useStore } from '../../state/store'
import { wrappedUnlocked } from './wrappedData'
import './wrapped.css'

// Home's row into the story. A plain link with no view transition: a whole-page transition would
// snapshot the tab bar on the way out, and the story brings its own entrance.
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
      className="row pressable wrapped-row"
      aria-label={seen ? 'Open your Cruise Wrapped again' : 'Open your Cruise Wrapped'}
    >
      {/* one line: the row renders only when Wrapped is unlocked, so "Ready to open" beneath it told
          the guest nothing the row being there does not. The label keeps the "again" distinction. */}
      <span className="row-copy">
        <span className="t-strong">Your voyage, wrapped</span>
      </span>
    </Link>
  )
}
