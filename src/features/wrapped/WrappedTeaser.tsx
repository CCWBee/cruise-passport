import { Link } from 'react-router-dom'
import { useAllDrinks, useStore } from '../../state/store'
import { wrappedUnlocked } from './wrappedData'
import './wrapped.css'

export function WrappedTeaser() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  if (!wrappedUnlocked(drinks, me)) return null
  return (
    <Link to="/wrapped" className="wr-teaser glass pressable" viewTransition>
      <div className="eyebrow">A little surprise</div>
      <div className="wr-teaser-title t-strong">Your Cruise, Wrapped</div>
      <div className="muted t-body">See your voyage in cocktails</div>
    </Link>
  )
}
