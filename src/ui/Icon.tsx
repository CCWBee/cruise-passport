// Drawn icon set — one grid (24px box, 1.8px stroke, round caps/joins), outline↔filled.
// Replaces emoji used as UI chrome. Emoji stays only as content voice (category glyphs, badges).
import type { SVGProps, ReactNode } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number; filled?: boolean }

function Svg({ size = 24, filled, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden {...rest}
    >
      {children}
    </svg>
  )
}

export const IconHome = (p: P) => (
  <Svg {...p}>
    <path d="M4 11.2 12 4.5l8 6.7" />
    <path d="M6 10.4V18a1.2 1.2 0 0 0 1.2 1.2h9.6A1.2 1.2 0 0 0 18 18v-7.6" />
  </Svg>
)
export const IconDrinks = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 6h15L12 14v4.6" />
    <path d="M8 19.4h8" />
  </Svg>
)
export const IconShip = (p: P) => (
  <Svg {...p}>
    <path d="M4 13.5h16l-1.6 4.2a2 2 0 0 1-1.9 1.3H7.5a2 2 0 0 1-1.9-1.3L4 13.5z" />
    <path d="M12 13.3V5" />
    <path d="M12 5.4 17 8l-5 1.8" />
  </Svg>
)
export const IconStats = (p: P) => (
  <Svg {...p}>
    <path d="M6 19v-4.6" /><path d="M12 19V7" /><path d="M18 19v-8.6" />
  </Svg>
)
export const IconBadges = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="9.5" r="5.4" />
    <path d="M9 14.2 7.6 20l4.4-2.4L16.4 20 15 14.2" />
  </Svg>
)
export const IconLog = (p: P) => (
  <Svg {...p}>
    <path d="M12 6.2C10.6 5.2 8.7 4.8 6.5 5v12c2.2-.2 4.1.2 5.5 1.2 1.4-1 3.3-1.4 5.5-1.2V5c-2.2-.2-4.1.2-5.5 1.2z" />
    <path d="M12 6.2v12" />
  </Svg>
)

export const IconCheck = ({ filled, ...p }: P) =>
  filled ? (
    <Svg filled {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.2 12.2l2.5 2.5 5-5.2" fill="none" stroke="var(--on-accent, #fff)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ) : (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.3 12.3l2.4 2.4 4.8-5" />
    </Svg>
  )
export const IconHeart = (p: P) => (
  <Svg {...p}>
    <path d="M12 20s-6.7-4.2-8.8-8C1.6 9 3.2 5.7 6.3 5.7c2 0 3.2 1.3 3.7 2.4.5-1.1 1.7-2.4 3.7-2.4 3.1 0 4.7 3.3 3.1 6.3C18.7 15.8 12 20 12 20z" />
  </Svg>
)
export const IconBookmark = (p: P) => (
  <Svg {...p}>
    <path d="M7 5.6h10a1 1 0 0 1 1 1V19l-6-3.2L6 19V6.6a1 1 0 0 1 1-1z" />
  </Svg>
)
export const IconStar = ({ filled, ...p }: P) => (
  <Svg filled={filled} {...p}>
    <path d="M12 3.6l2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.9l-5 2.75.96-5.6L3.9 9.5l5.6-.8L12 3.6z" strokeWidth={filled ? 0 : 1.8} />
  </Svg>
)
export const IconCamera = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 8.5h3l1.2-1.8h6.6L16.5 8.5h3a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.1" />
  </Svg>
)
export const IconSearch = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.2" /><path d="M20 20l-4.5-4.5" /></Svg>
)
export const IconClose = (p: P) => (
  <Svg {...p}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></Svg>
)
export const IconSlider = (p: P) => (
  <Svg {...p}><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="15" cy="8" r="2.2" /><circle cx="7" cy="16" r="2.2" /></Svg>
)
