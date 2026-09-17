import { IconDrinks } from '../../ui/Icon'
import './shake.css'

// The shaker itself: a cobbler shaker drawn the way ui/Icon.tsx draws everything, one stroke on a
// flat fill, scaled up to hero size. It is not in the icon set because it is not an icon: it is the
// one object on its screen, at 168 by 176, and an icon there would be a 24px glyph blown up.
//
// A shaker has no window, so there is none: the reveal is the lid coming off and the drop popping
// out of the mouth, which is the lootcrate the brief asked for. That needs three layers in one box,
// painted back to front:
//
//   the token, which sits inside the mouth and is invisible there because the tin is drawn over it;
//   the lid (cap and strainer top), its own layer so it can flip about the back edge of the rim;
//   the tin (rim and body), last, so its cream fill hides both of them exactly as it does today.
//
// Closed, the three paint the drawing the first build had, less the window: the lid sits behind the
// rim, which is the order the single SVG drew them in, so the idle picture is unchanged.

export type ShakePhase = 'idle' | 'shaking' | 'opening' | 'revealed' | 'closing'

// The drawing, rendered a seventh larger than the 168 by 176 grid it is drawn on.
const W = 196, H = 205

export function Shaker({ phase }: { phase: ShakePhase }) {
  const cls = 'shaker'
    + (phase === 'shaking' ? ' is-shaking' : '')
    + (phase === 'opening' || phase === 'revealed' ? ' is-open' : '')
    + (phase === 'closing' ? ' is-closing' : '')
  return (
    <div className={cls}>
      {/* The drop: a drawn token, not a label. It carries no text, because a name inside 44px is the
          clipping the window had, and the lootcrate order is the item first and its card second. It
          is drawn in screen pixels rather than on the tin's grid, since what it does is travel in
          them: the rise is 84px whatever the tin is scaled to. The disc takes the tin's 2.4 stroke
          and the glyph inside it the icon set's own 1.8 at 20px. */}
      <div className="shaker-token">
        <svg
          width={44}
          height={44}
          viewBox="0 0 44 44"
          fill="var(--cream)"
          stroke="currentColor"
          strokeWidth={2.4}
          aria-hidden
        >
          <circle cx="22" cy="22" r="20.6" />
        </svg>
        <IconDrinks size={20} />
      </div>
      {/* the lid: the cap and the domed strainer top, hinged in shake.css at the back edge of the rim */}
      <svg
        className="shaker-lid"
        width={W}
        height={H}
        viewBox="0 0 168 176"
        fill="var(--cream)"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="70" y="4" width="28" height="10" rx="3" />
        <path d="M34 46c0-20 18-32 34-32h32c16 0 34 12 34 32z" />
      </svg>
      {/* the tin: the rolled rim the lid seats on, then the body, which is widest at the mouth and
          tapers to its base, as a cobbler's bottom tin does */}
      <svg
        className="shaker-tin"
        width={W}
        height={H}
        viewBox="0 0 168 176"
        fill="var(--cream)"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="18" y="46" width="132" height="12" rx="4" />
        <path d="M22 58h124l-8 100a12 12 0 0 1-12 12H42a12 12 0 0 1-12-12z" />
      </svg>
    </div>
  )
}
