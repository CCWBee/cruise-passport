import { useState } from 'react'
import type { Drink } from '../../../../data/model'
import type { ShakerProps } from '../index'
import { Glass } from './glasses'

// Variant a, the cobbler with its cap off (docs/specs/2026-09-22-shaker-v2.md, angle A). Drawn from
// Charles's photograph: a grooved cap on a short neck, a domed strainer, the band where the strainer's
// skirt overlaps the body's rolled rim, and a tall body tapering to its foot. 88 wide by 220 on its grid,
// which is the photograph's 2.5 to 1, with the cap, dome, band and body at 9, 21, 7 and 63 per cent
// of the height.
//
// One SVG is the whole stage, and its viewBox puts the shaker's own grid at the origin, so every
// coordinate below is on the drawing and nothing is placed with a layout offset. Painted back to
// front inside one rig, which is what the shake moves:
//
//   the burst, a few ink strokes that exist for a quarter of a second as the cap goes;
//   the prize glass, down inside the tin until the pop, so the tin's cream fill hides it;
//   the tin (dome, band and body), with the light and shade of polished steel;
//   the cap, on top, its own layer so it can chatter, lift and fly.

const STAGE_W = 300, STAGE_H = 292
// The drawing's grid is shown at nine tenths, so the shaker stands 198 tall and 79 wide on screen,
// which leaves 90 above the cap for the cap's flight and the prize's hang. Every stroke width is
// divided by the same factor, so lines draw at 2.2 on screen, as they would at full size.
const K = 0.9
const STROKE = 2.2 / K
// where the shaker sits in the stage, in screen pixels: centred, its foot 4 above the stage's floor
const X0 = (STAGE_W - 88 * K) / 2, Y0 = STAGE_H - 4 - 220 * K

const CAP = 'M27 20V6Q27 2 31 2H57Q61 2 61 6V20Z'
const DOME = 'M24 20V23C11 26 5 40 4.5 62V66H83.5V62C83 40 77 26 64 23V20Z'
const BODY = 'M3 81C5.5 140 10.5 190 13.5 211Q14.5 219.5 21.5 219.5H66.5Q73.5 219.5 74.5 211C77.5 190 82.5 140 85 81Z'
const BAND = 'M3.5 66H84.5Q88 66 88 69.5V77.5Q88 81 84.5 81H3.5Q0 81 0 77.5V69.5Q0 66 3.5 66Z'

// Six strokes fanned over the mouth, none straight up, because that is where the glass rises
const RAYS = [-165, -140, -115, -65, -40, -15]

export function ShakerA({ phase, still = false, drink }: ShakerProps) {
  // The sheet clears the result the moment Shake again is pressed, before the glass has gone back
  // into the tin, so the last drink is kept here: the glass sinking back is the one it came out as.
  const [kept, setKept] = useState<Drink | undefined>(drink)
  if (drink && drink !== kept) setKept(drink)
  const shown = drink ?? kept
  const open = phase === 'opening' || phase === 'revealed'
  const cls = 'shaker-a'
    + (phase === 'shaking' ? ' is-shaking' : '')
    + (open ? ' is-open' : '')
    + (phase === 'closing' ? ' is-closing' : '')
    + (still ? ' is-still' : '')

  return (
    <div className={cls}>
      <svg
        width={STAGE_W}
        height={STAGE_H}
        viewBox={`${-X0 / K} ${-Y0 / K} ${STAGE_W / K} ${STAGE_H / K}`}
        fill="var(--cream)"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {/* Each moving group sits between a translate to its pivot and one back, so it turns about
            the origin of its own coordinates. That is the one pivot every browser agrees on for
            SVG; a CSS transform-origin in px on a <g> is resolved differently by different engines
            once the viewBox does not start at zero. The rig turns 60% of the way down, where the
            hands are, round the body and the strainer. */}
        <g transform="translate(44 132)"><g className="a-rig"><g transform="translate(-44 -132)">
          <g className="a-burst" fill="none">
            {RAYS.map((a) => (
              <g key={a} transform={`rotate(${a} 44 20)`}>
                <line className="a-ray" x1={76} y1={20} x2={86} y2={20} />
              </g>
            ))}
          </g>

          {/* The prize: only drawn once there is one, so the shake cannot show it. The glasses are
              drawn on a 44 by 52 box and shown 1.6 times that on the grid, 63 by 75 on screen,
              so the prize is the object on the stage when it hangs; the stroke is divided by the
              same 1.6 so it draws at the tin's weight. At rest its box is 40 to 123 down the
              drawing, inside the dome, the band and the body, where the tin's fill covers it. */}
          {shown && (open || phase === 'closing') && (
            <g className="a-glass">
              <g transform="translate(8.8 40) scale(1.6)" strokeWidth={STROKE / 1.6}>
                <Glass category={shown.category} />
              </g>
            </g>
          )}

          <g className="a-tin">
            <path d={BODY} stroke="none" />
            <path d={DOME} stroke="none" />
            <path d={BAND} stroke="none" />
            {/* the steel: a strip of light left of centre down the dome and the body, and the far
                side in shade. White at low opacity and --line, the only two allowed on the drawing */}
            <g className="a-light" stroke="none">
              <path d="M17 84L24 84L28.5 212L24.5 212Z" />
              <path d="M28.5 84L30.5 84L33 212L31.5 212Z" />
              <path d="M19 31C13 39 10.5 49 10 62L16 62C16.5 49 18.5 40 23 32Z" />
            </g>
            <g className="a-shade" stroke="none">
              <path d="M66 84H84C81.5 140 77 190 74 210H64.5C66.5 190 67.5 140 66 84Z" />
              <path d="M58 27C70 31 77 44 78 62H70C69.5 46 65.5 34 58 27Z" />
            </g>
            {/* two lines of sea engraved round the lower body: the app's own water on the tin */}
            <g className="a-engrave" fill="none">
              <path d="M13 180q3.875-2.4 7.75 0t7.75 0t7.75 0t7.75 0t7.75 0t7.75 0t7.75 0t7.75 0" />
              <path d="M14 189q3.75 2.4 7.5 0t7.5 0t7.5 0t7.5 0t7.5 0t7.5 0t7.5 0t7.5 0" />
            </g>
            <path d={BODY} fill="none" />
            <path d={DOME} fill="none" />
            <path d={BAND} fill="none" />
            {/* the band is two rings: the strainer's skirt over the body's rolled rim */}
            <path d="M1.5 73.5H86.5" fill="none" />
          </g>

          {/* the cap turns about its own centre */}
          <g transform="translate(44 11)"><g className="a-cap"><g transform="translate(-44 -11)">
            <path d={CAP} />
            <path className="a-light" d="M32 4.5H35V18.5H32Z" stroke="none" />
            <path className="a-shade" d="M52 4H59.5V19H52Z" stroke="none" />
            {/* the grooves round the cap's lower half */}
            <path className="a-groove" d="M27.5 11.5H60.5M27.5 14.5H60.5M27.5 17.5H60.5" fill="none" />
            <path d={CAP} fill="none" />
          </g></g></g>
        </g></g></g>
      </svg>
    </div>
  )
}
