# Prototype B: Open water

The sky and sea at the hour you open the app are the backdrop of every screen, with the ship riding
a tide line that is how far through the list you are. Content sits on frosted platters over the
water, light by day and dark at dusk and night, and the chrome floats over all of it as clear Liquid
Glass.

Open `index.html` straight from disk or from any static server. It makes no network requests, loads
no web fonts and needs no build step. The data is the app's own (`data.js` is generated from
`src/data/raw.ts`, `glassByDrink.ts`, the emblems and the `?seed` passport; see the foot of this
file).

## States to land on

| Query | What it shows |
| --- | --- |
| `?screen=home` | Home: the readout on the sky, the medal case, For you, Last bar |
| `?screen=drinks` | Drinks: search, the filter, every venue's drinks with their glasses and tried checks |
| `?screen=sheet` | Lavender Smoke's drink sheet over Drinks at medium height |
| `?screen=sheet-large` | The same sheet at large height |
| `?screen=search` | The Log button opened: the search field at the foot, what is left at your last bar |
| `?screen=medals` | The full medal case |
| `?screen=medal` | Gin Explorer opened over the case |
| `?screen=ship`, `crew`, `you` | One honest screen each; Crew carries the crew's own facts (below) |
| `?hour=0..23` | Pins the sky to the middle of that hour: `?hour=13` is 13:30. Without it the sky follows the clock |
| `?still` | Holds the sea on one frame and skips the coin's turn and the wave, for a render that cannot wait |

`window.__openWater.renderOnce()` paints one frame of the sea, for an automation tab that runs no
animation frames. The prototype stands on the evening of day 7 (Friday 9 October), the last day the
seed has entries, so every number is the seed's: 58 of 214 tried (27%), 7 today, a 7 day streak, 15
of 28 venues, 6 of 18 medals.

## The backdrop

A full-screen port of the hero's sea shader (`SeaHero.tsx`): the same six palettes by the hour and
the same swell, term for term, scaled from the hero's 280px to the screen's height, so the liner
reads its lift and pitch off the water exactly as the hero's does. Three changes, each for the type
that sits on it:

- **The tide line.** It rises from 45% of the screen's height at nothing tried to 59% at everything
  (27% puts it 432px down on a 844px screen). It never climbs into the type on the sky, and on Home
  the medal case starts 20px under it, so the whole case (count, new coin, fan, next in reach) sits
  above the tab bar at rest, and the ship rides in the gap between the readout and the
  case.
- **The sky's curve.** The sky reaches its top colour at 1.8 screen heights above the horizon rather
  than 1.0, so the day sky stays pale enough for ink. Dusk is darkened (`#434262` over `#7A6480`, the
  band `#D27440` at 0.40) so white holds on it.
- **The sun and the moon** sit high on the right, 58px down, where the top bar covers them once
  content scrolls: no platter ever crosses the moon.

Stars come out at dusk and night, faint, above the horizon. The water carries long, low swells of
noise, so the glass over it has something to bend. The canvas is drawn at no more than 1.5 device
pixels and pauses when the tab is hidden, while a sheet's wave runs, and under reduced motion. Where
there is no WebGL, a CSS gradient of the same sky and the same tide line stands in, still.

## The glass recipe (chrome only)

Every chrome surface is one element carrying no filter, opacity or mask of its own, with two sibling
pseudo-elements. They are siblings because a backdrop filter nested inside another one sees only its
parent, never the sea.

| Layer | Numbers |
| --- | --- |
| Clear body (`::before`) | `backdrop-filter: blur(6px) saturate(185%) brightness(b)`, a film, and a sheen: `linear-gradient(162deg, white .26, transparent 36%)` over the top third |
| Edge lens (`::after`) | `backdrop-filter: blur(14px) saturate(200%) brightness(1.22)`, masked to a soft ring 10px wide (two linear-gradient masks on a capsule, a radial one on a circle), so the rim bends and lights what is behind it and the centre stays clear |
| Specular (on the lens) | `inset 1.5px 1.5px 0 white .78` on the top-left rim, `inset -1px -1.5px 0 black .16` along the foot, `inset 0 0 0 1px white .22` as the hairline |
| Lift | `0 10px 28px rgba(4,18,32,.26), 0 1px 3px rgba(4,18,32,.18)` |

The body's film and brightness depend on what the surface carries and what is behind it:

| Surface | Film | Brightness | Type |
| --- | --- | --- | --- |
| Tab bar (always over the sea) | white .06 | .50 | white; the droplet is a bead of white .80 to .96 film with ink on it |
| Log button (the one tint) | coral `#C72F50` at .84 | .85 | white |
| Search field (Log, opened) | `rgba(8,22,38,.30)` | .50 | white; placeholder `#D5DEE6` |
| Top bar by day | white .20 | 1.10 | ink |
| Top bar at dusk and night | `rgba(8,20,36,.34)` | .78 | white |
| Sheet by day, medium | white .64, blur 14 | 1.08 | ink, `#24445C` |
| Sheet by day, large | a second film of white .62 laid over it (together .86) | 1.08 | ink |
| Sheet at night | `rgba(10,22,38,.60)`, then .70 over it at large | .85 | white, `#C9D4DE` |

The tab bar is dark glass at every hour because it always sits over the deepest water at the foot
of the screen, where ink on a clear light film computes well under 2:1. The brief's clear body (film
8 to 25%, brightness 1.05 to 1.12) is what the top bar by day uses.
Every surface that carries small type needs more than that to hold 4.5:1 over the worst thing that
can pass beneath it, so the tab bar and the search field dim the backdrop (brightness .50) instead of
filming it white, and the sheets take the film their text needs. The written reason is the contrast
table below.

Budget: at most four backdrop-filter layers on screen at rest (the tab bar's two and the Log
button's two), five once the top bar shows (its body only: a scroll edge carries no lens). A sheet
hides the tab bar and the Log button as it rises, so an open sheet is its own two layers plus the top
bar's one. No backdrop filter is ever animated: the top bar fades its own layers, never itself,
because opacity on the parent would cut its filter off from the sea for the length of the fade; the
search morph changes the Log button's width, never its filter.

The droplet under the active tab is not a second backdrop filter (that would be glass on glass): it
is a bright film with a specular and a shade, inside the bar's own glass.

Fallbacks: without `backdrop-filter` each surface becomes a near-solid film of the same tone
(`rgba(12,30,46,.88)` dark, `rgba(246,250,252,.92)` light, solid coral for Log, `.95` and `.96` for the
sheets). Under `prefers-reduced-transparency` the same, and the platters go to `.94`.

No SVG displacement is used anywhere. Safari cannot run `url(#filter)` in a backdrop filter, and the
verifying browser is Chromium, so a Chromium-only lens would make the check look better than the
phone.

## Platters (content)

The content layer is a film with no live blur: `rgba(255,255,255,.64)` by day,
`rgba(6,18,34,.56)` at dusk and night, radius 20, an inner hairline of white at .45 by day and .12
at night, no shadow, no specular, no lens. The backdrop is drawn soft (no detail finer than the
swell), so a film does the frosting and costs nothing, and the four live filters stay with the
chrome. The difference in material is also the hierarchy: things you read are frosted, things you
press are glass.

## The medals

The medals are struck metal in their own colours, the one exemption from the one-accent rule,
because the metals are material as the sea is.

- **The coin** is one element, sized in `em` so every bevel scales: a turned rim
  (`conic-gradient` through the metal's highlight, mid and low, lit top left), the field struck
  down inside it (its wall in shade top left and lit bottom right, by inset shadows), a beaded border
  at 60px and up, the edge showing as a thickness below and to the right, and a soft highlight and a
  narrow glint across the face.
- **The emblem** is the app's drawn one (`emblems-data.ts`, as SVG symbols), struck in relief three
  times over: a shadow offset bottom right, a highlight offset top left, and the face in a lighter
  pull of the same metal.
- **Bronze, silver, gold** are the real metals (`#C47C40`, `#B9C3CC`, `#E2B23E` at mid; silver was `#C8D0D7` until the render pass showed it as a pale disc on a light platter, so its low, deep and field were taken down a step and its emblem's shadow raised to .8). **The
  Champion** is platinum with a field of sea enamel, the fourth finish.
- **A medal not yet earned** is a blank: the same coin shape in clear glass with a raised rim and an
  empty field, never a grey copy of a struck coin. One in reach wears its progress as a ring.
- **On Home** the case is the first thing under the sea: the newest medal at 96px (Martini Club,
  struck today) turning once on entry and then still, the other five at 52px in a fan with "All 18", and the
  next one in reach, Whiskey Lover, 9 of 10, one more whiskey. One tap opens the case or the medal.
- **The case** is the earned coins in tier order, the first at 148px and the rest at 92px, then the
  six in reach with their progress, then what is still to strike with what earns it. Opening a
  medal turns the coin once at 184px; it then leans a little towards the finger, and its reverse
  carries the liner.

## Motion

| Moment | How |
| --- | --- |
| The sea and the liner | the shader's clock; the liner lifts by the swell under it and pitches a third of its slope |
| The droplet | slides to the tapped tab over 460ms on `cubic-bezier(.32,.72,0,1)` and swells up to 1.16 wide at the middle of the trip; drag along the bar and it lifts under the finger (1.1) and the tab you leave it on opens |
| A pressed glass control | swells to 1.04 in 110ms and its rim brightens, then settles on `cubic-bezier(.3,1.45,.5,1)` over 260ms: one small overshoot |
| Log to search | the Log button widens into the field and the capsule folds to one round button that closes it (380ms, the drawer curve) |
| Large titles | collapse into the top bar once 40px have scrolled under it (200px on Home, past the readout) |
| Sheets | rise on the drawer curve over 420ms to medium (the top at 44% of the screen); drag, flick (over 1.1px/ms) or tap the grab bar between medium and large; dismiss past 35% of the way down or on a flick; the scrim, the close button and Escape close it too |
| The blue wave | a drink sheet's opening, the app's SheetWave in the sky's own sea colours, washing the content up onto a pane of the sheet's glass and receding in 2.4s to leave the sheet clear. The sea holds still while it runs, so there is one live effect at a time |
| The coin | turns once, 1.5s, then rests; edge layers give it a thickness side on |
| A tick | pops to 1.18 and settles, 360ms |
| Shake for a drink | the shaker icon rattles for 520ms and hands over an untried drink (the app's Shake sheet stays as it is; this is only its door) |

Under `prefers-reduced-motion` the sea holds one frame, the ship one position, and every change of
state is a fade: no slide, swell, turn or wave.

## Contrast, designed for

Measured by arithmetic against the lightest and darkest thing that can sit behind each surface,
with the backdrop filter's brightness applied and its saturation ignored. These want a check in the
render.

| Type | On | Against the darkest | Against the lightest |
| --- | --- | --- | --- |
| Ink `#1C3C56` | day sky, the readout and titles (y 36 to 350) | 4.78:1 (13:30, the top line) | 6.2:1 and up |
| White | dusk and night sky | 4.58:1 (dusk, a full passport's tide, the facts line) | 7.1:1 at night |
| Ink | light platter over the darkest day water `#093755` | 5.54:1 | 9.60:1 (over the sun) |
| `#2B4960` (secondary) | light platter | 4.55:1 | 7.90:1 |
| Mint `#0B5E42`, gold `#7A4D00` (glyphs) | light platter | 3.76:1, 3.51:1 | 6.5:1, 6.1:1 |
| White | dark platter over the brightest dusk band | 10.8:1 | |
| `#C3CFDA` (secondary) | dark platter | 6.84:1 | |
| Mint `#4ADBA2`, gold `#F5C451` | dark platter | 6.2:1, 6.7:1 | |
| White labels | tab bar over a light platter over the lightest day water | 4.65:1 | |
| Ink | droplet | 9.5:1 | |
| White | Log's coral glass | 4.91:1 (over a light platter) | 4.49:1 over pure white, which never sits under it |
| White, `#D5DEE6` | search field | 5.4:1, 5.78:1 | |
| Ink | top bar by day | 6.49:1 over the day sky | 7.57:1 over a platter |
| White | top bar at night | 8.7:1 over the moon | |
| Ink, `#24445C` | medium sheet by day, over the darkest water under the scrim | 5.52:1, 4.91:1 | |
| Ink, `#24445C` | large sheet by day | 8.89:1, 7.91:1 | |
| White, `#C9D4DE` | sheet at night, over the dusk band | 8.87:1, 5.90:1 | |

Light or dark is chosen by measuring the sky a third of the way from the horizon to the top, not by
the clock. The one known gap: on the live clock, in the half hour either side of 19:00 and of
05:00, the palette cross-fades between a light sky and a dark one and type on the open sky can dip
to about 3.3:1. A pinned `?hour` never lands there (it is the middle of the hour).

## The crew's facts (the roundup's crew slides)

Crew carries "The crew so far", four facts built from what the synced passports hold, each an
insight and never a ranking: the crew's favourite (Coco-Cafe, 4.7 on average from all three of you),
the one that split you (Lavender Smoke: Ravi gave it five, you gave it one), your find (Clover Club,
five stars from you and nobody else has had it) and one for next time (Wicklow Pipes, which Sam gave
five). These are the facts the brief puts into Wrapped in the app; here they sit where this
direction would show them day to day.

## What the render pass should rule on

- **The pull down from a large sheet's content on Chromium touch.** At large the content has
  `touch-action: pan-y`, so Chromium may claim the pan and cancel the pointer before the
  non-passive `touchmove` can hold it. The grab bar and the header always drag, so the worst case is
  the app's current contract; it is still the gesture most likely to fail.
- **Drinks is a stack of twenty venue platters.** Each is a section with its own heading and this
  direction is built from platters, but at 390 wide the stack may read as a wall of identical
  rounded boxes. If it does, the fallback is one platter per screen with the venue headings inside
  it, separated by space.
- **The medium sheet at white .64.** It is the film 13px secondary type needs over the darkest
  water under the scrim. Whether it reads as glass over the moving water or as the heavy film the
  brief was written against is a call for the render.
- **Every contrast figure above** is arithmetic; the render is the measurement.

## Render pass, 23 September

Rendered in Brave at 390 by 844 in an iframe, every state at 13:30, 19:30 and 23:30, the sea drawn
by the shader on the real GPU. What changed, and why:

- **The medal case now sits whole above the tab bar on Home.** Before, only the count and the new
  coin cleared it; the fan ran under the tab bar and the next one in reach was off screen, with 240px
  of empty sky above the tide line. The tide line moved up (above) and the coins grew (96 and 52).
- **Silver is darker** (above), with a 1px shade round every coin so a white rim holds its edge on a
  light platter.
- **The sheet's rim is calmer**: `saturate(130%) brightness(1.12)`, 8px at the sides. At the
  chrome's 200% and 1.22 it lit the teal under the sheet's side edges into a cyan stripe.
- **The large sheet showed a scrollbar** in Chromium; hidden, as on the screens.
- **For you's first pick snapped to the platter's edge** rather than its padding
  (`scroll-padding-inline`; checked in the render, the first pick now starts at x 32 under the heading).
- **Drinks listed 213**: Coffee and Cones shares Coffee Currents' list but pours one drink of its own
  (Orange Granita), and the list skipped every sharing venue. It now keeps a sharing venue that has
  drinks of its own.
- **Log, opened:** the placeholder is "Drink, bar or spirit" (it was "Jungle Bird", which read as a
  value), the clear button shows only with something to clear, and the rows under "Still to try at
  Crooners" carry what is in the drink rather than the bar's name again.

Rulings on the open questions: the pull down from the large sheet, the tap on the grab bar and the
drag from the header all work (JavaScript pointer events in the frame; a real finger on a phone is
still the test). Drinks does not read as a wall of boxes: each venue platter is a screen or more tall
with its own heading. The medium sheet reads as frosted glass with the sea at its rim, not clear; the
film stays at .64 because 13px `#24445C` needs it (measured below).

### Contrast, measured in the render

Sampled from the shader's own pixels under each line of text (a 7 by 4 grid over the text's box),
with the platter's film, the scrim, the backdrop filter's brightness and the glass film laid over
them in order; the worst sample is the figure. Blur only averages, so the worst unblurred pixel is a
floor.

| Type | On | 13:30 | 19:30 | 23:30 |
| --- | --- | --- | --- | --- |
| Ink or white, the greeting | the sky | 5.35:1 | 6.17:1 | 9.14:1 |
| Fact labels | the sky | 6.56:1 | 5.01:1 | 7.38:1 |
| Secondary, the next medal's count | the medal platter over the water | 4.80:1 | 10.18:1 | 11.06:1 |
| Secondary, a drink's ingredients | a venue platter | 5.05:1 | 9.66:1 | 10.78:1 |
| Secondary, a medal's hint | the case, over the deepest water | 4.64:1 | 10.83:1 | 11.45:1 |
| White tab labels | tab bar over the sea / over a platter | 14.61 / 5.86:1 | 16.02 / 17.09:1 | 17.13 / 17.56:1 |
| White | Log's coral glass over the sea / over a platter | 6.55 / 5.13:1 | 6.65 / 6.73:1 | 6.76 / 6.78:1 |
| White | search field | 17.46:1 | 18.26:1 | 19.01:1 |
| Ink or white | top bar, "Home" | 7.26:1 | 11.67:1 | 14.11:1 |
| `#24445C` / white-side `#C9D4DE` | medium sheet, worst line, over open sea under the scrim | 4.99:1 | | 11.07:1 |
| The same | large sheet | 9.15:1 | | 11.62:1 |

The one figure in the designed-for table that the new tide line moves is white on the dusk sky
with a full passport: the tide then sits at 346px and the dusk band climbs towards the facts line.
Measured the same way (every drink ticked, 19:30): 4.53:1 on the fact labels, 4.62:1 on their
values, 4.89:1 on "214 of 214 tried". It holds, with nothing to spare.

Backdrop filters on screen, counted from the computed styles: four at rest on every tab (the tab
bar's body and lens, Log's body and lens). With the top bar showing, five. With a sheet open, the
sheet's body and rim plus the top bar's body where it shows; a count taken 400ms after load caught
the tab bar and Log still sliding off (six), because a hidden automation tab runs no transitions.

## What is not built

The tab bar does not minimise on scroll, the filter panel is three segments rather than the app's
folded groups, venues open no sheet, and the Shake row opens a drink rather than the Shake sheet. The
day is fixed at day 7.

## Data

`data.js` is written by `gen-data.mts` beside it (run from the repo root:
`node prototypes/2026-09-23/b/gen-data.mts`) from `src/data/raw.ts`,
`src/data/glassByDrink.ts`, `src/features/badges/emblems-data.ts` and the `?seed` rules in
`index.html`: all 214 drinks with their real venues, prices, ingredients and glasses, all 28 venues,
the seed passport and the 18 emblems. The crew (Sam and Ravi) is copied into `b.js` from the same
seed block.
