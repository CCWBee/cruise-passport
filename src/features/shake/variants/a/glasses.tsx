import { useId, type ReactNode } from 'react'

// The prize: a glass for the kind of drink, so the guest can tell what is coming before the card
// names it (docs/specs/2026-09-22-shaker-v2.md, "The prize"). Each is drawn once, on a 44 by 52 box
// in the shaker's own idiom: an --ink stroke on a --cream fill, with the drink itself as --line, the
// one shade the constitution allows on this drawing. They are SVG groups rather than whole images
// because they are painted inside the shaker's drawing, behind the tin, and rise out of its mouth.

const BOX_W = 44
const BOX_H = 52

// A glass is its outline, the level the drink comes up to, and whatever sits in or on it. The drink
// is the outline again, filled with --line and clipped below its level, so it follows the bowl's
// curve exactly without a second path to keep in step. The outline is painted twice, filled under
// the drink and stroked over it, so the drink never covers the line.
function Vessel({ outline, level, children }: { outline: string; level: number; children?: ReactNode }) {
  const clip = useId()
  return (
    <>
      <path d={outline} stroke="none" />
      <clipPath id={clip}>
        <rect x={0} y={level} width={BOX_W} height={BOX_H - level} />
      </clipPath>
      <path d={outline} fill="var(--line)" stroke="none" clipPath={`url(#${clip})`} />
      {children}
      <path d={outline} fill="none" />
    </>
  )
}

/** a stem and a foot, shared by every stemmed glass: the stem runs from the bowl's base to the foot */
function Stem({ from }: { from: number }) {
  return <path d={`M22 ${from}V48M12 49.5Q22 46.5 32 49.5`} fill="none" />
}

/** Martini, Classic, Signature, Dessert and anything unlisted: the V, both sides of the bowl, and an olive */
export function CocktailGlass() {
  return (
    <>
      <Vessel outline="M3 6H41L22 27Z" level={11}>
        <path d="M34 1L24.5 19" fill="none" />
        <circle cx={27} cy={15.5} r={3.4} />
      </Vessel>
      <Stem from={27} />
    </>
  )
}

/** Margarita: the wide stepped bowl over a small one, and a wedge of lime on the rim */
export function MargaritaGlass() {
  return (
    <>
      <Vessel outline="M2 6C3 13 12 15 16.5 15.5C15.5 21 18 25.5 22 25.5C26 25.5 28.5 21 27.5 15.5C32 15 41 13 42 6Z" level={10}>
        <path d="M31 6A6.5 6.5 0 0 1 44 6" />
      </Vessel>
      <Stem from={25.5} />
    </>
  )
}

/** Wine and Spritz: a round bowl on a stem */
export function WineGlass() {
  return (
    <>
      <Vessel outline="M9 3C5 16 9 27.5 22 27.5C35 27.5 39 16 35 3Z" level={14} />
      <Stem from={27.5} />
    </>
  )
}

/** Beer: a tapered pint with its head */
export function PintGlass() {
  return (
    <Vessel outline="M7 3L11.4 48.5Q11.7 50.5 14 50.5H30Q32.3 50.5 32.6 48.5L37 3Z" level={11}>
      <path d="M7.7 11Q11.2 8.4 14.7 11T21.7 11T28.7 11T36.3 11" fill="none" />
    </Vessel>
  )
}

/** Coffee: a cup on its saucer, steam over it */
export function CoffeeCup() {
  return (
    <>
      <path d="M4 47.5H40Q38.5 51 34 51H10Q5.5 51 4 47.5Z" />
      <path d="M34.6 28.5C42 27.5 42 38.5 34 39" fill="none" />
      <Vessel outline="M9 24H35V35C35 42 29.5 46.5 22 46.5C14.5 46.5 9 42 9 35Z" level={28} />
      <path d="M18 19C15.5 15.5 20.5 13 18 8.5M26 19C23.5 15.5 28.5 13 26 8.5" fill="none" />
    </>
  )
}

/** Frozen: a hurricane glass with a straw */
export function HurricaneGlass() {
  return (
    <>
      <Vessel outline="M12 3C8 12 17 18 16 27C15 35 16 41.5 22 41.5C28 41.5 29 35 28 27C27 18 36 12 32 3Z" level={9}>
        <path d="M30.5 -3L24 33" fill="none" />
      </Vessel>
      <path d="M22 41.5V48M12 49.5Q22 46.5 32 49.5" fill="none" />
    </>
  )
}

/** Mocktail: a highball with ice and a straw */
export function HighballGlass() {
  return (
    <Vessel outline="M11 5V47.5Q11 50.5 14 50.5H30Q33 50.5 33 47.5V5Z" level={12}>
      <path d="M29.5 -3L22.5 41" fill="none" />
      <rect x={14} y={17} width={9} height={9} rx={1.5} transform="rotate(-12 18.5 21.5)" />
      <rect x={19} y={29} width={9} height={9} rx={1.5} transform="rotate(10 23.5 33.5)" />
    </Vessel>
  )
}

/** the glass for a category; the two Princess brand names and anything new get the cocktail glass */
export function Glass({ category }: { category: string }) {
  switch (category) {
    case 'Margarita': return <MargaritaGlass />
    case 'Wine':
    case 'Spritz': return <WineGlass />
    case 'Beer': return <PintGlass />
    case 'Coffee': return <CoffeeCup />
    case 'Frozen': return <HurricaneGlass />
    case 'Mocktail': return <HighballGlass />
    default: return <CocktailGlass />
  }
}
