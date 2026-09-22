import { useId } from 'react'
import { glassFamily } from './glassFamily'

// The prize: a glass drawn for the kind of drink, so the guest can tell what is coming before the card
// names it. Eight families, each drawn once on a 64 by 72 box in the shaker's own idiom: one ink
// stroke over a cream fill, and the drink itself in --line, the one shade the drawing is allowed. No
// colour, no lettering, never IconDrinks (that glyph is the brand's funnel and draws one side of a
// glass). They are SVG groups, not whole images, because they are painted inside the shaker's drawing,
// behind the tin, and rise out of its mouth.
//
// The caller sets the stroke on the group it places the glass in, so a glass draws at the tin's
// weight on screen whatever it is scaled to; the fine lines (a pick, the lime's segments, steam, ice)
// are `fine`, which the caller passes in the same units.

// Which family a drink takes is glassFamily.ts's decision (its name first, then frozen, then its
// category), kept apart from the drawings so it can be tested.

const BOX_W = 64, BOX_H = 72

// A bowl is one closed outline and the drink inside it. The outline is painted three times: cream
// under everything, the drink clipped to it, then the stroke on top, so the drink never crosses the
// ink line whatever shape the glass is. The drink is a level (everything below it) unless a glass
// draws its own surface, as the pint's head does.
function Bowl({ outline, level, drink }: { outline: string; level: number; drink?: string }) {
  const clip = 'glass-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <>
      <clipPath id={clip}><path d={outline} /></clipPath>
      <path d={outline} stroke="none" />
      <path
        d={drink ?? `M0 ${level}H${BOX_W}V${BOX_H}H0Z`}
        fill="var(--line)"
        stroke="none"
        clipPath={`url(#${clip})`}
      />
      <path d={outline} fill="none" />
    </>
  )
}

/** A stem and a flat foot, shared by the stemmed glasses: from the bowl's base down to the foot. */
function Stem({ from }: { from: number }) {
  return <path d={`M32 ${from}V64M20 66H44`} fill="none" />
}

/** Martini, Classic, Signature, Dessert and anything unlisted: the V, both sides of the bowl, and
 *  an olive on a pick, which is the martini's own mark */
export function CocktailGlass({ fine }: { fine: number }) {
  return (
    <>
      <Bowl outline="M5 10H59L32 40Z" level={17} />
      <Stem from={40} />
      <path d="M47 3L29 31" fill="none" strokeWidth={fine} />
      <circle cx="36" cy="20" r="4.6" />
    </>
  )
}

/** Margarita: a wide shallow brim stepped down to a small cup, and a wedge of lime on the rim */
export function MargaritaGlass({ fine }: { fine: number }) {
  return (
    <>
      <Bowl
        outline="M4 10H60C60 18 51 21.5 42 22.5C42 31 38 36 32 36C26 36 22 31 22 22.5C13 21.5 4 18 4 10Z"
        level={15}
      />
      <Stem from={36} />
      <path d="M44 10A8 8 0 0 1 60 10Z" />
      <path d="M52 10L47.5 5.2M52 10V2.6M52 10L56.5 5.2" fill="none" strokeWidth={fine} />
    </>
  )
}

/** Wine and Spritz: a round bowl that closes in towards the rim, on a stem */
export function WineGlass() {
  return (
    <>
      <Bowl outline="M18 6C11 19 10 33 20 38.5C26 41.5 38 41.5 44 38.5C54 33 53 19 46 6Z" level={23} />
      <Stem from={40.5} />
    </>
  )
}

/** Beer: a tapered pint, and its head as a wave over the drink, which is what says beer rather than
 *  a tumbler of water */
export function PintGlass() {
  return (
    <>
      <Bowl
        outline="M12 6H52L47.6 63.5Q47.3 66 44.8 66H19.2Q16.7 66 16.4 63.5Z"
        level={16}
        drink="M0 16Q4 12.4 8 16T16 16T24 16T32 16T40 16T48 16T56 16T64 16V72H0Z"
      />
      <path d="M12.8 16Q16 12.4 20 16T28 16T36 16T44 16T51.2 16" fill="none" />
    </>
  )
}

/** Coffee: a cup on its saucer, steam over it */
export function CoffeeCup({ fine }: { fine: number }) {
  return (
    <>
      <path d="M24 18C20 14 28 10 24 5M34 18C30 14 38 10 34 5" fill="none" strokeWidth={fine} />
      {/* the handle before the cup, so the cup covers its ends */}
      <path d="M46 30C57 30 57 46 44 46" fill="none" />
      <Bowl outline="M10 24H48V37C48 50 40 58 29 58C18 58 10 50 10 37Z" level={29} />
      <path d="M3 61H61C58 66 50 67.5 32 67.5C14 67.5 6 66 3 61Z" />
    </>
  )
}

/** Frozen: a hurricane glass, flared lip, pinched waist, round belly, with a straw */
export function HurricaneGlass() {
  return (
    <>
      {/* the straw first, so the glass hides all of it but what stands above the lip */}
      <path d="M32 50L46 -4" fill="none" />
      <Bowl
        outline="M18 6C19 14 25 18 24 24C23 30 15 36 16 45C17 53 24 58 32 58C40 58 47 53 48 45C49 36 41 30 40 24C39 18 45 14 46 6Z"
        level={12}
      />
      <path d="M32 58V64M22 66H42" fill="none" />
    </>
  )
}

/** Mocktail: a highball with a straw and two cubes of ice */
export function HighballGlass({ fine }: { fine: number }) {
  return (
    <>
      <path d="M36 30L51 -4" fill="none" />
      <Bowl outline="M15 6H49V63A3 3 0 0 1 46 66H18A3 3 0 0 1 15 63Z" level={15} />
      <rect x="20" y="24" width="11" height="11" rx="2" transform="rotate(-10 25.5 29.5)" strokeWidth={fine} />
      <rect x="31" y="38" width="11" height="11" rx="2" transform="rotate(12 36.5 43.5)" strokeWidth={fine} />
    </>
  )
}

/** Negronis, an Old Fashioned, a Carajillo: a short heavy tumbler, one big cube, a twist of peel on the
 *  rim. The weight of its base is what says rocks rather than a highball cut short. */
export function RocksGlass({ fine }: { fine: number }) {
  return (
    <>
      <Bowl outline="M11 28H53L50.4 62.5Q50 66 46.5 66H17.5Q14 66 13.6 62.5Z" level={38} />
      <path d="M14.6 58H49.4" fill="none" strokeWidth={fine} />
      <rect x="22" y="33" width="19" height="19" rx="3" transform="rotate(-8 31.5 42.5)" strokeWidth={fine} />
      <path d="M45 28C49 21 56 21 55 27" fill="none" />
    </>
  )
}

/** The glass for a drink, drawn on its 64 by 72 box. `data-glass` names the family, which is what
 *  the QA probes read back to prove the prize matched the drink. */
export function Glass({ drink, fine }: { drink: { name: string; category: string; frozen?: boolean }; fine: number }) {
  const family = glassFamily(drink)
  return (
    <g data-glass={family}>
      {family === 'cocktail' && <CocktailGlass fine={fine} />}
      {family === 'margarita' && <MargaritaGlass fine={fine} />}
      {family === 'wine' && <WineGlass />}
      {family === 'pint' && <PintGlass />}
      {family === 'cup' && <CoffeeCup fine={fine} />}
      {family === 'hurricane' && <HurricaneGlass />}
      {family === 'highball' && <HighballGlass fine={fine} />}
      {family === 'rocks' && <RocksGlass fine={fine} />}
    </g>
  )
}

/** The box every glass is drawn on, for the shaker to place it by. */
export const GLASS_W = BOX_W
export const GLASS_H = BOX_H
