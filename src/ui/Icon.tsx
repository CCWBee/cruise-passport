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
export const IconSocial = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.1" />
    <path d="M3.6 19.2c.5-3 2.7-4.7 5.4-4.7s4.9 1.7 5.4 4.7" />
    <path d="M15.4 6.3a2.7 2.7 0 0 1 0 5.2" />
    <path d="M16.4 14.7c2 .3 3.4 1.7 4 3.6" />
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
    <path d="M12 20.3c-.5-.4-7.8-5.3-7.8-11C4.2 6.4 6.1 4.5 8.6 4.5c1.5 0 2.8.8 3.4 2 .6-1.2 1.9-2 3.4-2 2.5 0 4.4 1.9 4.4 4.8 0 5.7-7.3 10.6-7.8 11z" />
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

export const IconLink = (p: P) => (
  <Svg {...p}>
    <path d="M9.2 14.8 7.7 16.3a3.2 3.2 0 0 1-4.5-4.5l3.1-3.1a3.2 3.2 0 0 1 4.5 0" />
    <path d="m14.8 9.2 1.5-1.5a3.2 3.2 0 1 1 4.5 4.5l-3.1 3.1a3.2 3.2 0 0 1-4.5 0" />
    <path d="m8.8 15.2 6.4-6.4" />
  </Svg>
)
export const IconMedal = (p: P) => (
  <Svg {...p}>
    <path d="m8.2 4 3.8 5 3.8-5M9.2 4H6.5l3 6.2M14.8 4h2.7l-3 6.2" />
    <circle cx="12" cy="14.3" r="5.2" />
    <path d="m12 11.7.8 1.7 1.9.2-1.4 1.3.4 1.9-1.7-.9-1.7.9.4-1.9-1.4-1.3 1.9-.2.8-1.7z" />
  </Svg>
)
export const IconPlus = (p: P) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
// a row's forward affordance, the only chevron in the set
export const IconChevron = (p: P) => (
  <Svg {...p}><path d="m10 6.8 5.2 5.2-5.2 5.2" /></Svg>
)
export const IconPin = (p: P) => (
  <Svg {...p}>
    <path d="M19 10.1c0 5-7 10-7 10s-7-5-7-10a7 7 0 1 1 14 0z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
)
export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="14" rx="2" />
    <path d="M8 3.8v3.4M16 3.8v3.4M7.5 10h9" />
    <path d="M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01" strokeWidth="2.4" />
  </Svg>
)
export const IconTrophy = (p: P) => (
  <Svg {...p}>
    <path d="M8 5h8v3.8a4 4 0 0 1-8 0V5zM12 13v4M8.5 20h7M10 17h4" />
    <path d="M8 7H5v1.2a3 3 0 0 0 3.5 3M16 7h3v1.2a3 3 0 0 1-3.5 3" />
  </Svg>
)
