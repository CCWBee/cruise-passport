import './shake.css'

// The shaker itself: a cobbler shaker drawn the way ui/Icon.tsx draws everything, one stroke on a
// flat fill, scaled up to hero size. It is not in the icon set because it is not an icon: it is the
// one object on its screen, at 168 by 176, and an icon there would be a 24px glyph blown up.
//
// The window in its body is the 8-ball: --ink while the answer is still inside, clearing to --cream
// as the name surfaces through it. It is part of the drawing rather than a disc laid over it, so the
// tin's wall passes behind it and the shape reads as one object.

export type ShakePhase = 'idle' | 'shaking' | 'revealed'

export function Shaker({ phase, name, drinkId }: { phase: ShakePhase; name?: string; drinkId?: string }) {
  const cls = 'shaker'
    + (phase === 'shaking' ? ' is-shaking' : '')
    + (phase === 'revealed' ? ' is-revealed' : '')
  return (
    <div className={cls}>
      {/* Drawn on a 168 by 176 grid and rendered a seventh larger, so the window is the 112 across
          the reveal needs: at 96 a name as ordinary as "Lychee Vodka Mojito" clipped. */}
      <svg
        className="shaker-tin"
        width={196}
        height={205}
        viewBox="0 0 168 176"
        fill="var(--cream)"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {/* cap, the domed strainer top, the rolled rim it seats on, then the tin, which is widest at
            the mouth and tapers to its base, as a cobbler's bottom tin does */}
        <rect x="70" y="4" width="28" height="10" rx="3" />
        <path d="M34 46c0-20 18-32 34-32h32c16 0 34 12 34 32z" />
        <rect x="18" y="46" width="132" height="12" rx="4" />
        <path d="M22 58h124l-8 100a12 12 0 0 1-12 12H42a12 12 0 0 1-12-12z" />
        {/* the window: dark until the shaker has something to say */}
        <circle className="shaker-liquid" cx="84" cy="112" r="48" />
      </svg>
      {/* The name is HTML over the drawing, not SVG text: it has to wrap, clamp to two lines and take
          the app's own type role, none of which an SVG string does. `data-drink` names what the
          window is showing, which is what the QA reveal check reads. */}
      <div className="shaker-window" data-drink={drinkId}>
        {name && <span className="shaker-name t-strong">{name}</span>}
      </div>
    </div>
  )
}
