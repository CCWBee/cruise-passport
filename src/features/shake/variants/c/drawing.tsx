import { useId } from 'react'
import { CategoryGlass } from './glasses'

// The drawing for variant c. Every layer is an SVG the size of the stage, 320 by 275, with its
// viewBox shifted so the thing it draws lands in its place: the shaker's box at (40, 78), the die's
// at (208, 193), the bar line across the foot at 261. That keeps the layout out of the CSS, which
// only moves the layers, and it is why the transform origins in c.css are stage coordinates.
//
// The shaker is 180 tall on an 80 by 186 box. Proportions are Charles's photograph of 22 September,
// measured as fractions of the height (docs/specs/2026-09-22-shaker-v2.md, Charles's reference):
// cap 17 (9%), neck and dome 37 (21%), band 12 (7%), body 114 (63%); 72 across the band, so 2.5
// times as tall as it is wide; the cap 29 wide (40% of the band), the neck 32 (45%), the base 49
// (72% of the body's top). Steel is the ink stroke on the cream fill, a light strip in white at low
// opacity left of centre, and --line down the right as the only shade. Nothing else is coloured.

const STAGE_W = 320, STAGE_H = 275
const SHAKER_AT = { x: 40, y: 78 }
const DIE_AT = { x: 208, y: 193 }
const box = (at: { x: number; y: number }) => `${-at.x} ${-at.y} ${STAGE_W} ${STAGE_H}`

const SW = 2.4
const common = {
  width: STAGE_W,
  height: STAGE_H,
  fill: 'var(--cream)',
  stroke: 'currentColor',
  strokeWidth: SW,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** the body's outline, shared by its fill and the clip that keeps the engraving on the tin */
const BODY = 'M6 69H74L65.2 176.5Q64.6 183 58.5 183H21.5Q15.4 183 14.8 176.5Z'

/** The bar the shaker stands on and the die rolls along: a hairline, drawn, not a rule. */
export function Bar() {
  return (
    <svg className="sc-bar" {...common} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
      <path d="M16 261H304" />
    </svg>
  )
}

/** Everything but the cap: the dome of the strainer top and its neck, the band where the strainer's
 *  skirt overlaps the body's rolled rim, and the tall tapered body. */
export function Tin() {
  const clip = useId()
  return (
    <svg className="sc-tin" {...common} viewBox={box(SHAKER_AT)}>
      <defs>
        <clipPath id={clip}><path d={BODY} /></clipPath>
      </defs>
      {/* the body, then its shade and light, then the engraving, all under the outline */}
      <path d={BODY} />
      <path d="M61.5 72H71L62.6 176H56.2Z" fill="var(--line)" stroke="none" />
      <path d="M15.5 72H22L26.5 178H21.2Z" className="sc-light" stroke="none" />
      {/* a few engraved lines of sea round the foot, the app's own water on the tin */}
      <g clipPath={`url(#${clip})`} fill="none" stroke="var(--ink-3)" strokeWidth={1}>
        <path d="M4 150q5.5-3.5 11 0t11 0t11 0t11 0t11 0t11 0t11 0" />
        <path d="M-1.5 157q5.5-3.5 11 0t11 0t11 0t11 0t11 0t11 0t11 0" />
      </g>
      <path d={BODY} fill="none" />
      {/* the band: the body's rim, then the strainer's skirt seated over it, the widest line of all */}
      <rect x={5} y={63} width={70} height={6} rx={3} />
      <rect x={4} y={57} width={72} height={6} rx={3} />
      {/* the strainer top: a short neck, then the dome swelling like a bell to the skirt */}
      <path d="M24 20H56V23.5C67 26 75.5 39 75.5 57H4.5C4.5 39 13 26 24 23.5Z" />
      <path d="M56 25.5C66.5 29 72.5 41 73 55H63.5C63 43 60.5 32 56 25.5Z" fill="var(--line)" stroke="none" />
      <path d="M18.5 30.5C13.5 36 10.5 44 10 54.5H14.5C15 45.5 17.5 38 21.5 32Z" className="sc-light" stroke="none" />
    </svg>
  )
}

/** The cap on the neck, with its grooves round the lower half. Its own layer, because it comes off. */
export function Cap() {
  return (
    <svg className="sc-cap" {...common} viewBox={box(SHAKER_AT)}>
      <rect x={25.5} y={3} width={29} height={17.5} rx={4} />
      <path d="M29 5.5V10" className="sc-light-line" fill="none" />
      <g fill="none" strokeWidth={1.2}>
        <path d="M26.7 12.6H53.3" />
        <path d="M26.7 15.4H53.3" />
        <path d="M26.7 18.2H53.3" />
      </g>
    </svg>
  )
}

/** The die: 68 square, its edges rounded as a die's are. Its face is a five whose middle spot is the
 *  glass for the drink: the four corner spots are what make it read as a die rather than a tile, and
 *  the glass sits where the fifth would. */
const SPOTS = [11.5, 56.5]
export function Die({ category }: { category?: string }) {
  return (
    <svg className="sc-die" {...common} viewBox={box(DIE_AT)}>
      <rect x={1.2} y={1.2} width={65.6} height={65.6} rx={14} />
      <g fill="currentColor" stroke="none">
        {SPOTS.map((x) => SPOTS.map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={3.4} />))}
      </g>
      {category !== undefined && <g transform="translate(14 12)"><CategoryGlass category={category} /></g>}
    </svg>
  )
}
