import { useState } from 'react'
import type { Drink } from '../../../../data/model'
import type { ShakerProps } from '../index'
import { Bar, Cap, Die, Tin } from './drawing'

// Variant c, the dice roll (docs/specs/2026-09-22-shaker-v2.md). The brief's dice, taken literally:
// the cobbler is lifted off the bar and shaken with the dice audibly rattling in it, each stroke
// ending on a tick of the rattle; it is slammed down on the rattle's clack; two knocks come from
// inside; then the cap pops off and a die flies out of the strainer's mouth, drops onto the bar,
// rolls two quarter turns and rocks back onto its face. The face is a die's five with the middle
// spot replaced by the glass for the drink's category: the 8-ball's answer, on a die. The card
// follows under it.
//
// The stage is one box, 320 by 275, in every phase, and nothing leaves it: the bar line runs across
// its foot, the shaker stands at its left third and the die comes to rest at its right, so the pair
// is centred on the stage once the roll is over.

export function Shaker({ phase, still = false, drink }: ShakerProps) {
  // The die keeps showing the drink it rolled while it is put away for a second shake: the sheet
  // clears the result at the press, which would otherwise blank the face as the die fades.
  const [last, setLast] = useState<Drink | undefined>(drink)
  if (drink && drink !== last) setLast(drink)
  const shown = drink ?? last

  const cls = 'shaker-c'
    + (phase === 'shaking' ? ' is-shaking' : '')
    + (phase === 'opening' || phase === 'revealed' ? ' is-open' : '')
    + (phase === 'closing' ? ' is-closing' : '')
    + (still ? ' is-still' : '')
  return (
    <div className={cls}>
      <Bar />
      {/* the die sits behind the tin until it clears the mouth (its keyframes lift it in front at the
          top of its flight), so it comes out of the strainer rather than across it */}
      <Die category={shown?.category} />
      <div className="sc-shaker">
        <Tin />
        <Cap />
      </div>
    </div>
  )
}
