import { useState, type CSSProperties } from 'react'
import type { Drink } from '../../data/model'
import { GLASS_H, GLASS_W, Glass } from './Glass'
import './shake.css'

// The shaker: a cobbler shaker drawn the way ui/Icon.tsx draws everything, one ink stroke on a cream
// fill, at hero size. It is not in the icon set because it is not an icon: it is the one object on
// its screen, and an icon there would be a 24px glyph blown up.
//
// Drawn from Charles's photograph of 22 September (docs/specs/2026-09-22-shaker-v2.md): a grooved cap
// on a short neck, a domed strainer, the band where the strainer's skirt overlaps the body's rolled
// rim, and a tall body tapering to its foot. 88 wide by 220 on its grid, the photograph's 2.5 to 1,
// with the cap, dome, band and body at 9, 21, 7 and 63 per cent of the height. It has no window,
// because a shaker has none: the reveal is the cap coming off and the prize rising out of the mouth.
//
// One SVG is the whole stage, and its viewBox puts the shaker's own grid at the origin, so every
// coordinate below is on the drawing and nothing is placed with a layout offset. Painted back to
// front inside one rig, which is what the shake moves:
//
//   the burst, six ink strokes that exist for a quarter of a second as the cap goes;
//   the prize glass, down inside the tin until the pop, so the tin's cream fill hides it;
//   the tin (dome, band and body), with the light and shade of polished steel;
//   the cap, on top, its own layer so it can chatter, lift and fly.

export type ShakePhase = 'idle' | 'shaking' | 'opening' | 'revealed' | 'closing'

export interface ShakerProps {
  phase: ShakePhase
  /** the reveal found where it was left on returning from the drink sheet: no animation replays */
  still?: boolean
  /** the drink the shaker is about to surface; set at the pop, so the prize is the right kind */
  drink?: Drink
}

/** The shaker's timings, in ms. They belong to the drawing, so they live beside it: the sheet runs
 *  its phases on them, the rattle lays its sound on them, and shake.css holds the same numbers in its
 *  keyframes (`keyframes.mjs` writes those from this object, so the two cannot drift).
 *
 *    0 to 1800     the shake, set down on the bar on the rattle's clack at 1800, one small rebound
 *    knocks        the dice knock from inside, twice; the cap lifts off the neck on each
 *    popMs         the pop: the cap flies, the burst, the glass comes out of the mouth
 *    popMs+landMs  the glass has overshot and settled: the thock, the haptic, the card's first line
 *    closeMs       Shake again: the glass sinks and the cap goes back on before the next shake */
export const SHAKER = {
  shakeMs: 1800,
  knocks: [1970, 2100],
  popMs: 2300,
  landMs: 540,
  closeMs: 260,
}

const STAGE_W = 300, STAGE_H = 275
// The grid is shown at nine tenths, so the shaker stands 198 tall and 79 wide on screen, which leaves
// 73 above the cap for the shake's travel, the cap's flight and the prize's hang. Every stroke width
// is divided by the same factor, so lines draw at the hero stroke, 2.4, on screen.
const K = 0.9
const STROKE = 2.4 / K
// the cap's grooves are the drawing's one hairline
const HAIRLINE = 1.2 / K
// where the shaker sits in the stage, in screen pixels: centred, its foot 4 above the stage's floor
const X0 = (STAGE_W - 88 * K) / 2, Y0 = STAGE_H - 4 - 220 * K
// The prize hangs with the foot of its box at 4 on the grid, so the foot of every glass clears the
// neck (20) by at least 20, 18 on screen, and the tallest of them still stops inside the stage.
const HANG = 4

const CAP = 'M27 20V6Q27 2 31 2H57Q61 2 61 6V20Z'
const DOME = 'M24 20V23C11 26 5 40 4.5 62V66H83.5V62C83 40 77 26 64 23V20Z'
const BODY = 'M3 81C5.5 140 10.5 190 13.5 211Q14.5 219.5 21.5 219.5H66.5Q73.5 219.5 74.5 211C77.5 190 82.5 140 85 81Z'
const BAND = 'M3.5 66H84.5Q88 66 88 69.5V77.5Q88 81 84.5 81H3.5Q0 81 0 77.5V69.5Q0 66 3.5 66Z'

// Six strokes fanned over the mouth, none straight up, because that is where the glass rises
const RAYS = [-168, -145, -122, -58, -35, -12]

export function Shaker({ phase, still = false, drink }: ShakerProps) {
  // The sheet clears the result the moment Shake again is pressed, before the glass has gone back
  // into the tin, so the last drink is kept here, by id: the glass sinking back is the one it came
  // out as, not the default swapped in under the guest's eye.
  const [kept, setKept] = useState<Drink | undefined>(drink)
  if (drink && drink.id !== kept?.id) setKept(drink)
  const shown = drink ?? kept
  const open = phase === 'opening' || phase === 'revealed'
  const cls = 'shaker'
    + (phase === 'shaking' ? ' is-shaking' : '')
    + (open ? ' is-open' : '')
    + (phase === 'closing' ? ' is-closing' : '')
    + (still ? ' is-still' : '')
  // the durations the CSS runs on, from the same object the sheet times its phases by
  const clock = {
    '--pop': `${SHAKER.popMs}ms`,
    '--land': `${SHAKER.landMs}ms`,
    '--close': `${SHAKER.closeMs}ms`,
  } as CSSProperties

  return (
    <div className={cls} style={clock}>
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
        <g transform="translate(44 132)"><g className="shaker-rig"><g transform="translate(-44 -132)">
          <g className="shaker-burst" fill="none">
            {RAYS.map((a) => (
              <g key={a} transform={`rotate(${a} 44 20) translate(76 20)`}>
                <line className="shaker-ray" x1={0} y1={0} x2={12} y2={0} />
              </g>
            ))}
          </g>

          {/* The prize, drawn only once there is one, so the shake cannot show it. It turns about
              the middle of its foot, because it grows out of the mouth from there. */}
          {shown && (open || phase === 'closing') && (
            <g transform={`translate(44 ${HANG})`}><g className="shaker-glass">
              <g transform={`translate(${-GLASS_W / 2} ${-GLASS_H})`}>
                <Glass category={shown.category} fine={STROKE * 0.73} />
              </g>
            </g></g>
          )}

          <g className="shaker-tin">
            <path d={BODY} stroke="none" />
            <path d={DOME} stroke="none" />
            <path d={BAND} stroke="none" />
            {/* the steel: a strip of light left of centre down the dome and the body, and the far
                side in shade. The light on steel and --line, the only two allowed on the drawing */}
            <g className="shaker-light" stroke="none">
              <path d="M17 84L24 84L28.5 212L24.5 212Z" />
              <path d="M28.5 84L30.5 84L33 212L31.5 212Z" />
              <path d="M19 31C13 39 10.5 49 10 62L16 62C16.5 49 18.5 40 23 32Z" />
            </g>
            {/* the shade: the far side, and a narrow dark reflection beside each strip of light,
                which is what makes a highlight read on cream, as it does on polished steel */}
            <g className="shaker-shade" stroke="none">
              <path d="M66 84H84C81.5 140 77 190 74 210H64.5C66.5 190 67.5 140 66 84Z" />
              <path d="M58 27C70 31 77 44 78 62H70C69.5 46 65.5 34 58 27Z" />
              <path d="M31.5 84L37 84L38.5 212L34 212Z" />
              <path d="M23 32C18.5 40 16.5 49 16 62L20.5 62C21 50 22.5 41 26.5 33.5Z" />
            </g>
            <path d={BODY} fill="none" />
            <path d={DOME} fill="none" />
            <path d={BAND} fill="none" />
            {/* the band is two rings: the strainer's skirt over the body's rolled rim */}
            <path d="M1.5 73.5H86.5" fill="none" />
          </g>

          {/* the cap turns about its own centre */}
          <g transform="translate(44 11)"><g className="shaker-cap"><g transform="translate(-44 -11)">
            <path d={CAP} />
            <path className="shaker-light" d="M32 4.5H35V18.5H32Z" stroke="none" />
            <path className="shaker-shade" d="M52 4H59.5V19H52ZM35.5 4H38.5V19H35.5Z" stroke="none" />
            {/* the grooves round the cap's lower half */}
            <path d="M27.5 11.5H60.5M27.5 14.5H60.5M27.5 17.5H60.5" fill="none" stroke="var(--ink-3)" strokeWidth={HAIRLINE} />
            <path d={CAP} fill="none" />
          </g></g></g>
        </g></g></g>
      </svg>
    </div>
  )
}
