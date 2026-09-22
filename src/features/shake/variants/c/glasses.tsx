import type { ReactNode } from 'react'

// The prize's face: one glass per family of drink, so the guest can tell what kind it is before
// the card names it (docs/specs/2026-09-22-shaker-v2.md, The prize). Each is drawn once, on a 40 by
// 44 grid rendered 1:1, in the shaker's own idiom: an ink stroke on a cream fill, with the drink
// itself in --line, which is the one shade the drawing is allowed. Never IconDrinks: that glyph is
// the brand's funnel and draws one side of a glass.

const STROKE = 2

function Glass({ children }: { children: ReactNode }) {
  return (
    <svg
      className="sc-glass"
      width={40}
      height={44}
      viewBox="0 0 40 44"
      fill="var(--cream)"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** the stem and foot every stemmed glass stands on, from the bottom of its bowl */
const Stem = ({ from }: { from: number }) => (
  <>
    <path d={`M20 ${from}V40`} fill="none" />
    <path d="M11 41.5Q20 38.5 29 41.5" fill="none" />
  </>
)

/** Martini, Classic, Signature, Dessert, and anything not listed: the V, both sides of the bowl */
export const CocktailGlass = () => (
  <Glass>
    <path d="M3 3H37L20 21.5Z" />
    <path d="M8.3 8H31.7L20 20.2Z" fill="var(--line)" stroke="none" />
    <Stem from={21.5} />
  </Glass>
)

/** Margarita: the wide shallow brim stepping down into a small bowl */
export const MargaritaGlass = () => (
  <Glass>
    <path d="M2 3H38C37.5 9 33 11.5 27.5 11.5C27.5 18 24.5 21.5 20 21.5C15.5 21.5 12.5 18 12.5 11.5C7 11.5 2.5 9 2 3Z" />
    <path d="M4.2 7H35.8C34 10 31 10.6 27.5 10.6H12.5C9 10.6 6 10 4.2 7Z" fill="var(--line)" stroke="none" />
    <Stem from={21.5} />
  </Glass>
)

/** Wine and Spritz: a round bowl on a stem */
export const WineGlass = () => (
  <Glass>
    <path d="M11 2H29C34 9 34 20 20 23.5C6 20 6 9 11 2Z" />
    <path d="M8.3 12.5H31.7C31.2 17 28 20.6 20 22.3C12 20.6 8.8 17 8.3 12.5Z" fill="var(--line)" stroke="none" />
    <Stem from={23.5} />
  </Glass>
)

/** Beer: a pint, wider at the brim, with its head of foam left cream */
export const PintGlass = () => (
  <Glass>
    <path d="M7.5 2H32.5L29.5 41.5H10.5Z" />
    <path d="M8.9 10H31.1L28.6 40.3H11.4Z" fill="var(--line)" stroke="none" />
    <path d="M8.9 10H31.1" fill="none" strokeWidth={1.4} />
  </Glass>
)

/** Coffee: a cup on its saucer, steam rising */
export const CoffeeCup = () => (
  <Glass>
    <path d="M14.5 11C12.5 8.5 16.5 6.5 14.5 2.5" fill="none" strokeWidth={1.6} />
    <path d="M22 11C20 8.5 24 6.5 22 2.5" fill="none" strokeWidth={1.6} />
    <path d="M30 20C37 20 37 30 29 30" fill="none" />
    <path d="M7 15H31V24C31 31.5 26.5 35.5 19 35.5C11.5 35.5 7 31.5 7 24Z" />
    <path d="M2.5 40.5Q20 43 37.5 40.5" fill="none" />
    <path d="M13 38.5H25" fill="none" />
  </Glass>
)

/** Frozen: a hurricane glass, pinched at the waist, with a straw */
export const HurricaneGlass = () => (
  <Glass>
    <path d="M23 13L30.5 1.5" fill="none" />
    <path d="M11 3H29C29 8.5 25.5 11 25.5 16C25.5 21 31.5 23 31.5 29C31.5 34.5 26.5 36.5 20 36.5C13.5 36.5 8.5 34.5 8.5 29C8.5 23 14.5 21 14.5 16C14.5 11 11 8.5 11 3Z" />
    <path d="M13.2 20.5H26.8C28.5 22.4 30.2 25 30.2 28.8C30.2 33.4 26 35.2 20 35.2C14 35.2 9.8 33.4 9.8 28.8C9.8 25 11.5 22.4 13.2 20.5Z" fill="var(--line)" stroke="none" />
    <path d="M20 36.5V40" fill="none" />
    <path d="M13 41.5Q20 39 27 41.5" fill="none" />
  </Glass>
)

/** Mocktail: a highball with a straw */
export const HighballGlass = () => (
  <Glass>
    <path d="M22.5 14L31 1.5" fill="none" />
    <path d="M10 5H30V39C30 40.6 29 41.5 27.5 41.5H12.5C11 41.5 10 40.6 10 39Z" />
    <path d="M11.2 14H28.8V39C28.8 39.8 28.2 40.3 27.4 40.3H12.6C11.8 40.3 11.2 39.8 11.2 39Z" fill="var(--line)" stroke="none" />
  </Glass>
)

/** The glass for a drink's category, from CATEGORIES in src/data/model.ts. Categories not in the
 *  table (the two Princess brand names, and any a guest's own sailing brings) take the V. */
export function CategoryGlass({ category }: { category: string }) {
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
