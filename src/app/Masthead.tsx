import { IconDrinks } from '../ui/Icon'
import './shell.css'

// The app's name, above every screen. Chrome, not content: it sits above the first content line
// rather than in the rank order. Lifted out of Shell so the entry screen, which renders outside
// Shell, can carry the same masthead rather than a second copy of the markup.
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
