import { IconDrinks } from '../ui/Icon'
import './shell.css'

// The app's name, above the entry screen and the landing, the two screens a cold visitor meets.
// Chrome, not content: it sits above the first content line rather than in the rank order. One
// component so the two carry the same masthead rather than two copies of the markup.
export function Masthead() {
  return (
    <header className="app-head">
      <div className="wrap app-head-in">
        <span className="brand" aria-hidden><IconDrinks size={19} /></span>
        <span className="brand-name">Cocktail Passport</span>
      </div>
    </header>
  )
}
