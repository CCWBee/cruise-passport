import { useId } from 'react'
import type { GlassKind } from './glass-kind'

// The prize: a glass drawn for the drink's category, so the guest can tell what kind of drink it is
// before the card names it (docs/specs/2026-09-22-shaker-v2.md, "The prize"). Each is drawn once, on
// a 64 by 72 grid, in the shaker's own idiom: one ink stroke over a cream fill, with the drink itself
// as the one shade the constitution allows (--line, ink at 12%). No colour, no lettering.
//
// A glass is a nested <svg>, so the shaker places it in its own coordinates (x, y) and the layer that
// carries it only ever moves by transform. It is drawn on 64 by 72 and placed at 80 by 90, a quarter
// larger, so its stroke is a quarter lighter here (1.92) and lands on the shaker's own 2.4.

// Each vessel is one closed outline and the level its drink comes up to. The outline is painted three
// times: cream underneath, the drink clipped to it, then the stroke on top, so the drink never crosses
// the ink line whatever shape the glass is.
interface Vessel { outline: string; level: number }

const VESSELS: Record<GlassKind, Vessel> = {
  // a V both sides of the bowl, which is what the funnel mark in the icon set never drew
  cocktail: { outline: 'M5 10H59L32 40Z', level: 17 },
  // the stepped bowl: a wide shallow brim over a small cup
  margarita: {
    outline: 'M4 10H60C60 18 51 21.5 42 22.5C42 31 38 36 32 36C26 36 22 31 22 22.5C13 21.5 4 18 4 10Z',
    level: 15,
  },
  // a round bowl that closes in towards the rim
  wine: { outline: 'M18 6C11 19 10 33 20 38.5C26 41.5 38 41.5 44 38.5C54 33 53 19 46 6Z', level: 23 },
  // tapered to the base; the gap above the drink is the head
  pint: { outline: 'M12 6H52L47.5 66H16.5Z', level: 16 },
  // the cup is drawn on its own below; this is only its bowl
  cup: { outline: 'M10 24H48V37C48 50 40 58 29 58C18 58 10 50 10 37Z', level: 99 },
  // flared lip, pinched waist, round belly, on a short foot
  hurricane: {
    outline: 'M18 6C19 14 25 18 24 24C23 30 15 36 16 45C17 53 24 58 32 58C40 58 47 53 48 45C49 36 41 30 40 24C39 18 45 14 46 6Z',
    level: 12,
  },
  highball: { outline: 'M15 6H49V63A3 3 0 0 1 46 66H18A3 3 0 0 1 15 63Z', level: 15 },
}

function Bowl({ kind }: { kind: GlassKind }) {
  const clip = 'sb-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const v = VESSELS[kind]
  return (
    <>
      <clipPath id={clip}><path d={v.outline} /></clipPath>
      <path d={v.outline} stroke="none" />
      <rect className="sb-drink" x="0" y={v.level} width="64" height="72" clipPath={`url(#${clip})`} />
      <path d={v.outline} fill="none" />
    </>
  )
}

/** A stem and a flat foot, shared by the four stemmed glasses. */
function Stem({ from }: { from: number }) {
  return <path d={`M32 ${from}V64M20 66H44`} fill="none" />
}

export function Glass({ kind, x, y }: { kind: GlassKind; x: number; y: number }) {
  return (
    <svg
      className="sb-glass"
      data-glass={kind}
      x={x}
      y={y}
      width={80}
      height={90}
      viewBox="0 0 64 72"
      overflow="visible"
      fill="var(--cream)"
      stroke="currentColor"
      strokeWidth={1.92}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {kind === 'cocktail' && (
        <>
          <Bowl kind={kind} />
          <Stem from={40} />
          {/* an olive on a pick, the martini's own mark */}
          <path className="sb-fine" d="M47 3L29 31" fill="none" />
          <circle cx="36" cy="20" r="4.6" />
        </>
      )}
      {kind === 'margarita' && (
        <>
          <Bowl kind={kind} />
          <Stem from={36} />
          {/* a wedge of lime sat on the rim */}
          <path d="M44 10A8 8 0 0 1 60 10Z" />
          <path className="sb-fine" d="M52 10L47.5 5.2M52 10V2.6M52 10L56.5 5.2" fill="none" />
        </>
      )}
      {kind === 'wine' && (
        <>
          <Bowl kind={kind} />
          <Stem from={40.5} />
        </>
      )}
      {kind === 'pint' && <Bowl kind={kind} />}
      {kind === 'cup' && (
        <>
          {/* steam, the handle behind the cup so the cup covers its ends, the cup, then the saucer */}
          <path className="sb-fine" d="M24 18C20 14 28 10 24 5M34 18C30 14 38 10 34 5" fill="none" />
          <path d="M46 30C57 30 57 46 44 46" fill="none" />
          <Bowl kind={kind} />
          <path d="M3 61H61C58 66 50 67.5 32 67.5C14 67.5 6 66 3 61Z" />
        </>
      )}
      {kind === 'hurricane' && (
        <>
          {/* the straw first, so the glass hides all of it but what stands above the lip */}
          <path d="M32 50L47 -8" fill="none" />
          <Bowl kind={kind} />
          <path d="M32 58V63M22 65H42" fill="none" />
        </>
      )}
      {kind === 'highball' && (
        <>
          <path d="M36 30L52 -6" fill="none" />
          <Bowl kind={kind} />
          {/* two cubes of ice in the drink */}
          <rect className="sb-fine" x="20" y="24" width="11" height="11" rx="2" transform="rotate(-10 25.5 29.5)" />
          <rect className="sb-fine" x="31" y="38" width="11" height="11" rx="2" transform="rotate(12 36.5 43.5)" />
        </>
      )}
    </svg>
  )
}
