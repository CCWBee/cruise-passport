import { useState } from 'react'
import type { Drink } from '../../../../data/model'
import type { ShakerProps, ShakerVariant } from '../index'
import { glassFor } from './glass-kind'
import { Glass } from './glasses'
import './b.css'

// Variant b, "The top comes off" (docs/specs/2026-09-22-shaker-v2.md). The cobbler shaker of Charles's
// reference, and the lootcrate taken literally: the whole top, cap and domed strainer as one piece,
// is the crate's lid. The shake builds in three phases, the seal strains twice with the tin at rest,
// then the top blasts off and the glass for the drink rises out of the body's mouth.
//
// Drawn on a 90 by 224 grid, the reference's proportions to the pixel: cap 20 (9%), dome 47 (21%),
// band 16 (7%, two rings: the strainer's skirt over the body's rolled rim), body 141 (63%). The band
// is the widest part at 90, so the shaker is 2.5 times as tall as it is wide; the cap is 40% of the
// band and the neck 45%; the body tapers from 84 at the rim to 62 at the foot, 74% of its top. It is
// rendered at 84 by 210, so the stage stays the 275 the sheet was measured with.
//
// Three layers in one rig, painted back to front, every coordinate in the one viewBox so nothing is
// positioned by a CSS length: the glass, down in the body where the cream fill hides it; the body with
// its rim; the top, seated on the rim. The rig carries the shake; the top and the glass move alone.

const VIEW = '0 0 90 224'
const W = 84, H = 210

function Shaker({ phase, still = false, drink }: ShakerProps) {
  // The sheet clears its result on Shake again before the tin closes, so `drink` is undefined while
  // the glass goes back in. The last drink is kept here so the glass that sinks is the one that rose,
  // not the default one swapped in under the guest's eye.
  const [kept, setKept] = useState<Drink | undefined>(drink)
  if (drink && drink.id !== kept?.id) setKept(drink)
  const shown = drink ?? kept

  const cls = 'shaker-b'
    + (phase === 'shaking' ? ' is-shaking' : '')
    + (phase === 'opening' || phase === 'revealed' ? ' is-open' : '')
    + (phase === 'closing' ? ' is-closing' : '')
    + (still ? ' is-still' : '')

  return (
    <div className={cls}>
      <div className="sb-rig">
        {/* the glass: 80 by 90 on the grid, down inside the body at rest, 101 below where it hangs
            once it has risen out with its foot just clear of the rim */}
        <svg className="sb-prize" width={W} height={H} viewBox={VIEW} overflow="visible" aria-hidden>
          {shown && <Glass kind={glassFor(shown.category)} x={5} y={86} />}
        </svg>

        {/* the body: the tapered cone, its steel light and shade, a line of sea engraved round the
            foot, and the rolled rim the top seats on, which is the half of the band that stays. Its
            overflow is visible because the rim bulges past the grid when the seal strains. */}
        <svg
          className="sb-body"
          width={W}
          height={H}
          viewBox={VIEW}
          overflow="visible"
          fill="var(--cream)"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 83H87L76 214Q75.3 222.8 66 222.8H24Q14.7 222.8 14 214Z" />
          <path className="sb-shade" d="M77 86H84.6L74 212H66.5Z" />
          <path className="sb-light" d="M16 88H23.5L30 212H25Z" />
          <path className="sb-light" d="M28.5 88H30.5L34.5 212H33.5Z" />
          <path className="sb-sea" d="M18 190q4.5-3.2 9 0t9 0t9 0t9 0t9 0t9 0" />
          <path className="sb-sea" d="M21 199q4.5-3.2 9 0t9 0t9 0t9 0t9 0" />
          <rect className="sb-rim" x="2" y="75" width="86" height="8" rx="3" />
        </svg>

        {/* the top: cap, neck, dome and the strainer's skirt, one piece, lifted and thrown as one */}
        <div className="sb-lid">
          <svg
            className="sb-top"
            width={W}
            height={H}
            viewBox={VIEW}
            fill="var(--cream)"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M25 20V24C15 27 4.5 37 4 56V67H86V56C85.5 37 75 27 65 24V20Z" />
            <path className="sb-shade" d="M72 34C79 39 82.5 46 82.8 56V63H77.5V56C77.2 48 75 42 69.5 37Z" />
            <path className="sb-light" d="M20 33C13 38 9.8 45 9.5 55V63H14.5V56C14.8 47 17 41 23 36Z" />
            <rect x="27" y="1.2" width="36" height="20" rx="4.5" />
            <path className="sb-fine" d="M27 11.5H63M27 14.8H63M27 18.1H63" fill="none" />
            <rect x="1.2" y="66" width="87.6" height="9" rx="3" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// The timings, from the press. The shake runs the rattle's own 1.8s, its three phases stepping where
// the ticks quicken (0.6s, 1.3s) and stopping hard upright on the clack. The held beat is 500ms: the
// seal lifts and settles twice, the second time faster, then presses down a hair, and the top goes
// at 2.3s. The glass settles onto its hang 560ms later, at 2.86s, which is where the thock and the
// success haptic land; the card's three lines follow it and are in by 3.3s.
export const variant: ShakerVariant = {
  id: 'b',
  Shaker,
  shakeMs: 1800,
  popMs: 2300,
  landMs: 560,
  closeMs: 240,
}
