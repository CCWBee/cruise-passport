# Prototype C · Night bar

The passport as a ship's bar after dark: a deep navy room with coral and amber light pooling in it,
luminous Liquid Glass chrome with bright rims floating over it, the drink glasses drawn as lit lines,
and the medals as struck metal on a velvet tray. It keeps the dark at noon and passes in daylight on
contrast, not on a light theme: every text pair below clears 4.5:1 against the brightest pool of
light, body text clears 7:1 at every hour but golden hour (6.9:1), and the sky chip on the sea flips
to light glass with ink by day.

Open `index.html` directly (no server, no network, no build). On a desktop the phone is centred at
390 by 844; at phone width it fills the screen.

## States

| URL | What it shows |
| --- | --- |
| `?screen=home` (default) | Home: greeting, the sea window, 27%, the medal tray, For you, Where to start |
| `?screen=drinks` | Drinks: search, All · Untried · Tried, venue groups of rows with lit glasses and tried checks |
| `?screen=sheet` | Apples Delight's sheet over Drinks at the medium height |
| `?screen=sheet-large` | The same sheet at the large height |
| `?screen=search` | The Log button opened: the capsule folded to one round button, the search field, your wishlist |
| `?screen=medals` | The full medal case |
| `?screen=medal` | Gin Explorer opened over the case |
| `?screen=ship`, `crew`, `you` | One honest screen each |
| `&hour=0..23` | The room and the sea by the hour (night 21 to 5, dawn, morning, afternoon, golden hour, dusk) |
| `&still` | No drift, no coin turn, no wave: for judging a landed state in a screenshot |

By hand: tap or drag along the tab bar (the droplet follows the finger and lands on the nearest
tab); tap the round coral button to log (search opens, type, tick a result, Undo in the toast); tap
a row to open its sheet (the blue wave washes it in); drag the sheet between its heights, tap the
grabber, drag it down or tap the dimmed screen to close, or press Escape; tap the medal tray to open
the case, a coin to open it, and the large coin to turn it over. The mouse wheel lifts a medium
sheet to large.

## Files

- `index.html`: the shell and the chrome (tab bar, Log button, top bar, toast, sheet) and the shared
  metal gradients for the coins.
- `style.css`: everything visual. The glass recipe is one block under "the glass".
- `app.js`: the data first (generated from `src/data/raw.ts`, `glass.ts` and
  `features/badges/emblems-data.ts`: 214 drinks, 28 venues, the 18 emblems; not hand-edited), then the
  prototype. The seed passport is the app's own `?seed`: 58 of 214 tried, Sam and Ravi as crew.

## The glass recipe

Every layer is something iPhone Safari renders. No SVG displacement anywhere, on purpose: Safari
cannot run it in a backdrop filter, and a Chromium-only lens would make the Brave render show a
material the guests' phones never draw.

One rule carries it: the glass element itself has no filter, no opacity and no mask. Its two
pseudo-elements do the optics. An element with any of those three would become their backdrop root,
and they would sample nothing but it.

| Layer | What it is | Numbers |
| --- | --- | --- |
| `::before`, the body | a clear backdrop filter with a thin film | `blur(6px) saturate(180%) brightness(1.08)`; film navy `rgba(12,18,34,.20)` (tab bar and search field `.24`, the dark sky chip `.36`, sheet `.40` at `saturate(160%) brightness(1.04)`; the sky chip and Back at `saturate(130%) brightness(1.06)`); a sheen across the top third, white `.11` to `0` at 34% |
| `.spec`, the touch light | a radial highlight that moves to the finger | white `.34` at the pointer, `.06` at 46%, gone at 70%; opacity `0` to `1` in 80ms on press, back in 340ms |
| content | the label, icon or field | positioned, so it paints above the body and under the rim |
| `::after`, the edge lens | a heavier, brighter backdrop masked to a ring round the shape | `blur(14px) saturate(210%) brightness(1.32)` (sheet `blur(18px) saturate(200%) brightness(1.3)`; the sky chip and Back `saturate(120%) brightness(1.24)`, because at the chrome's numbers the chip's rim went neon cyan on the day sky and Back read as a blue button); ring 8px (sheet 10px, small buttons and chips 6px) by `mask: content-box exclude`; a 135° wash white `.24` to `0` at 62%, so the rim is lit from the top left |
| specular | on the rim layer | `inset 1.5px 1.5px .5px -.5px` white `.9` on the upper left edge; `inset -1px -1.5px 1px -.5px` black `.38` on the lower right |
| hairline | on the rim layer | `inset 0 0 0 1px` white `.16` |
| lift | the element's own shadow | `0 14px 30px -8px` black `.6`, `0 2px 6px` black `.35` |
| tint | the one primary action only | the Log button: coral radial `rgba(255,128,148,.78)` to `rgba(226,60,97,.64)` to `rgba(170,28,66,.62)`, between body and rim; it fades out as the button becomes the search field |

Surfaces and their jobs:

- **Tab bar**: a floating capsule of the five tabs, 64 tall, radius 32, inset 16 from the edges and
  10 above the safe area. The **droplet** is the active tab's lens inside it. It has no backdrop
  filter of its own (that would be glass on glass): it is a brighter film (white `.26` under the icon
  to `.10` at the label), its own specular and a warm rim, and it slides on transform, stretching to
  about 1.3 by 1.1 half way and settling with a small squash where it lands. Held, the capsule swells
  to 1.02 and the droplet lifts to 1.06.
- **Log button**: round, 64, coral glass, at the trailing end of the tab bar. Tapped, the capsule
  folds to one round button showing the tab you came from and the Log button widens into the search
  field (width on the drawer curve, 440ms); focus is taken inside the tap so iOS raises the keyboard,
  and the pair ride above it on `visualViewport`.
- **Sheet**: two heights. Medium shows its top at 47% of the screen, scaled to .955 so the screen
  shows at its sides, film `.40` over a scrim of `.42`, so it still reads as glass (the list behind
  shows through, blurred) while a mint tick passing behind the meta text holds 5:1. Large is full width with a second film layer
  (`rgba(12,17,32,.66)`) brought in by opacity as it rises, so it reads as reading glass. The film
  follows the finger during a drag; nothing animates a filter.
- **Top bar**: the large title folds into a scroll edge effect of glass past 46px of scroll:
  `blur(16px) saturate(170%) brightness(.92)` (at 10px the readout's 64px figures stayed readable
  through it as a ghost), the room's colour at `.8` to `.66`, masked out over
  its last 14px only, so the title itself is never masked.
- **Sky chip**: the countdown on the sea window, top left (the sun and the moon are at the right of
  the sky). It is the adaptive case of the material: dark film `.36` with light type at dusk and night,
  white film `.24` with ink by day.
- **Back button** on the medal case, and the **toast**, are the same recipe at 44 and 52 tall.

Budget: at most four glass surfaces are on screen at once (Home: sky chip, tab bar, Log, and the top
bar once scrolled; the case: back, tab bar, Log, top bar; search: the folded tab bar, the field, the
top bar, the toast). While a sheet is up the tab bar and Log button step down under it, so the sheet
is the only lensed surface. Only one WebGL effect runs per view: the sea on Home, the wave while a
sheet opens.

Fallbacks: with no backdrop filter, or under `prefers-reduced-transparency`, the body becomes solid
`#1A2238`, the rim keeps its specular and hairline, the top bar takes the room's solid colour, the
sheet takes its large film at every height, and the Log button's coral goes solid `#C63556`. Every
contrast pair holds, because the solid surfaces are darker than the worst case the glass is measured
at.

## The backdrop

The glass needs colour behind it, so the whole app sits in a room:

- A vertical gradient per part of the day (`room-0` at the top to `room-1` at the floor) and three
  pools of light: radial gradients on 460 to 580px elements (no filter), low left behind the tab bar,
  high right, and top left. At night they are coral `.36`, amber `.30` and a cool blue `.22` over
  `#0B1222`; by day the lamps give way to the sea and the sun (teal `.30`, sun white `.22` to `.24`,
  coral `.20` to `.22`) over a deep sea blue, `#0A2540`. The parts follow the app's own `dayPart()`
  boundaries (5, 7, 12, 17, 19, 21).
- The pools drift on transform alone, 46 to 58 second cycles, 40 to 70px, so the glass has something
  moving to bend. They pause while a sheet is up, when the page is hidden, and under `?still`; under
  reduced motion they do not move.
- The content scrolls over the room: the lit glasses, the metal coins, the For you cards and the sea
  window are what pass under the tab bar and the top bar.
- At the foot, a second copy of the room is laid over the content and faded in towards the tab bar
  (clear until 110px above the safe area, which is 36px above the bar; 78% at 40px, level with the tab
  labels; 90% at the bottom). It began 176px up until the Brave pass, which showed it dimming the last
  100px of every screen above the bar, the medal tray's next coin among them. A row dissolves into the
  room as it goes under the bar while the warm light stays behind the glass. This is what keeps the tab labels
  legible over anything, a silver coin included.
- The **sea window** on Home is the app's own shader, ported whole (`SeaHero.tsx`): the sky by the
  hour with its six palettes and their half-hour cross-fades, the swell, the liner riding it (lift and
  a third of the slope as pitch), the tide line at 27%. At dusk and night the liner's windows are lit.
  The CSS gradient sea is underneath, so there is never a blank window.

## The medals

Struck metal in its real colour, drawn in SVG, on shared gradients in `index.html`:

- **Bronze, silver, gold**, and for the Champion a gilt rim round a field of deep blue enamel, a
  naval decoration. The metals are material, as the sea is, so they sit outside the one-accent rule.
- Each coin: a rim lit from the top left, a milled edge (a dashed stroke round the rim), a bevel in
  the reversed gradient falling into the field, the field as a soft dome of light, then the app's own
  emblem (`emblems-data.ts`), centred on the field by its drawn extent and scaled to one size (the
  emblems were drawn for a badge: the sunrise ones sit low in their box, and at .68 of the box they
  read as a smudge at 48px), struck in relief: a shade copy offset down and right, a highlight copy up
  and left, then the face in the metal. A specular sheen and a glint on the upper rim finish it.
- A **locked** medal is the same coin as a gunmetal blank with nothing struck into it, never a grey
  version of an earned one. A medal **in reach** is the blank with an amber ring round it filling to
  its progress.
- **On Home**, directly under the readout and inside the first screen: one velvet tray, the only boxed
  thing on Home, holding the new medal (Gin Explorer at 96px, turning once on the first view, then
  still, with "New medal" above its name), the other five earned coins at 56px, filling the tray's
  width, and the next in reach (Whiskey Lover, 1 more whiskey, 9 of 10). The count, 6 of 18, is in
  its heading. The whole tray is one tap to the full case. With an iPhone's safe areas (47 top, 34
  bottom) the whole tray ends above the tab bar on the first screen, which is why the sea window is
  176 tall and the gaps above the tray are tight: measured in Brave with the safe areas set, the tray
  runs 461 to 713 and the bar starts at 736.
- **On You**, the same velvet case, small: the count, the next in reach, and the six earned coins in
  a line at 44px. It opens the full case over You, and Back returns to You (from Home, to Home).
- **The case**: the earned six at 92px in tier order on the velvet, then In reach (six rows, ringed
  blanks, what is left and the count), then Locked (six rows, blanks, what earns them). Tapping any
  coin opens it: the coin at 196px, its name, its tier, what earned it, and for Gin Explorer the ten
  gin drinks that did. Tap the large coin and it turns over to show the reverse: the liner and
  "Sun Princess 2026" struck the same way, the legend with its own shade and highlight so silver on
  silver still reads. The 3D coin is two faces and a stack of discs for the
  milled edge, in CSS 3D.

## Motion

- Press: glass swells to 1.04 in 140ms (`--e-out`, `cubic-bezier(.22,.9,.32,1)`) with the touch light
  at the finger, and settles on release on `cubic-bezier(.34,1.45,.55,1)` over 420ms: one small
  overshoot, spring-like.
- Droplet: WAAPI on transform, 360ms plus 50ms per tab travelled (up to four), on
  `cubic-bezier(.3,.7,.2,1)`: swells to about 1.3 by 1.1 at 45%, squashes to .97 at 82%, lands.
  Dragging it along the bar follows the finger at 1.16 by 1.08.
- Sheet: the drawer curve `cubic-bezier(.32,.72,0,1)` over 440ms. It follows the finger, rubber-bands
  above the large height, settles to the nearest height, and a flick decides: faster than 0.9px/ms
  down goes to the next height down or closes, faster than 0.6px/ms up goes large. At the large height
  the content scrolls, and a pull down from its top brings the sheet with it.
- The blue wave: the app's `SheetWave` shader, 2.4s, washing the sea up the sheet over a navy pane and
  receding to leave the glass clear. It runs when a sheet is opened by a tap, not on a direct landing.
- The new medal turns once (1.5s on `--e-out`, after 350ms), then rests. The shaker icon rattles once
  before the Shake row picks an untried drink. A ticked check pops its mint disc on the spring and
  draws its tick in 260ms.
- Screens cross-fade in 240ms with a 10px rise.
- Reduced motion: every one of these becomes a fade or an instant change; the pools, the sea and the
  coin hold still, and the sheet fades in and out at its height.

## Contrast

Measured by alpha compositing in `sRGB` (WCAG relative luminance), with no credit taken for blur:
each pair against the lightest thing that can sit behind it, then the darkest. The lightest room
point is the peak of the brightest pool at each hour; behind the tab bar it is a white coin coming
through the foot edge at 16.5% over that pool; behind the sheet it is a list of white text read as
30% white over the pool, under the scrim; behind the top bar it is the day sun on the sea window.

| Pair | Lightest / darkest behind |
| --- | --- |
| Ink `#F6F1E9`, body text on the room | 6.9 / 16.7 |
| Ink at 84%, meta text on the room | 5.5 / 11.9 |
| Lamp `#FFE2B8`, the 13px bold reason line on a For you card | 5.0 / 12.1 |
| Mint `#5FE0A8`, the tried tick (icon, 3:1 needed) | 4.7 / 11.4 |
| Star `#FFC54D`, rating stars (icon) | 4.9 / 12.0 |
| Lamp line of a drawn glass (icon) | 6.2 / 15.1 |
| Ink at 90%, inactive tab label on the tab bar | 5.0 / 13.5 |
| White, active tab label on the droplet | 4.8 / 13.4 |
| Ink at 84%, placeholder in the search field | 4.6 / 11.8 |
| White plus on the coral Log button (icon) | 5.1 / 7.6 |
| Ink on the sheet at medium height | 10.5 (render) |
| Ink at 84% on the sheet at medium height | 5.0 over a mint tick, 9.1 over the room (render) |
| Ink at 84% on the sheet at large height | 9.5 / 10.5 |
| Ink `#0E1A2E` on the light sky chip, dawn to golden hour | 6.6 / 17.2 |
| Ink on the dark sky chip, dusk and night | 5.7 at dusk, 13.8 at night (render) |
| Ink, the collapsed title on the top bar | 5.7 / 14.7 |
| Lamp and ink at 84% on the velvet tray | 12.0 and 9.8 at the lightest |

The two sheet rows and the dark chip row above were first written from the script. The render
said it was too kind in two places: a mint tick in the list behind the medium sheet came through
under its meta text at 3.7:1 (the script read the list as white text only), and the dark sky chip
on the dusk sky measured 4.3:1. Both were fixed (the sheet's film and scrim, the chip's film), and
those rows now carry the numbers from the render.

### Measured in Brave

Sampled from the 390 by 844 screenshots in `shots/`: for each text box, the backdrop pixels actually
painted behind the text (the darker half of the box, its 95th percentile towards the text), the
text colour from `getComputedStyle` composited over it, WCAG ratio. Worst case per pair:

| Pair | Hour 13 | Golden (18) | Dusk (19) | Night (23) |
| --- | --- | --- | --- | --- |
| Sky chip text (ink on light, white on dark) | 7.3 | 9.1 | 5.7 | 13.8 |
| Date under the title, ink at 84% | 8.7 | 9.5 | 10.4 | 11.1 |
| Readout, ink at 84% | 8.6 | 9.1 | 10.3 | 10.2 |
| Medals count in the heading, ink at 84% | 6.3 | 6.2 | 8.3 | 7.5 |
| Tray: "Silver medal for ten gin drinks", ink at 84% | 10.3 | 10.3 | 10.3 | 10.3 |
| Tray: "1 more whiskey · 9 of 10", ink at 84% | 11.2 | 11.2 | 11.2 | 11.2 |
| Tab labels, with the For you cards passing under | 10.0 | 9.2 | 8.9 | 9.0 |

The medium sheet at night, over Drinks: title 10.5, lead 12.1, meta and notes 9.1, and meta over the
brightest mint tick behind it 5.0. Tab labels over the Drinks, Ship and Crew lists at night: 8.7 or
more. Search: placeholder 10.2, row meta 9.7. A screenshot is one moment
of the pools' drift; the script's lightest-point numbers above are the bound.

Body text in the content layer is 17px, meta 15px, and nothing is under 12px (the tab labels, at
12px 600 and 700, are the only text at the floor).

## What was checked here, and what was not

Rendered in Brave on 23 September 2026 through the browser extension, in an iframe at 390 by 844 on
the real GPU (the WebGL sea paints): every state in the table above plus Home at 13, 19 and 23; the
final shots are in `shots/`. Measured there: `scrollWidth` is 390 on every state; at most three
backdrop-filtered surfaces on any landing (Home: the sky chip, the tab bar, Log; the case: Back, the
tab bar, Log; a sheet alone), four with the top bar or the toast; the contrast above. Driven there
with script clicks and pointer events: a tab tap moves the droplet and the screen, the Log button
opens search with the field focused, a tick in search logs with an Undo toast and Undo reverts it,
the tray opens the case, a coin opens its sheet at the large height, the grabber takes it to medium,
close and Back return, the large coin turns over. Found and fixed in that pass, beside the contrast
and the Home fit: the coin's reverse face carried the class `back`, so it took the Back button's
44px size and its hidden-under-a-sheet rule, and turning the coin showed only its edge (now
`face-rev`); and "Add to your crew" was a second filled lamp button on a screen whose one filled
action is Log (now an outlined button in lamp type).

Checked without a browser: the script parses (`node --check`); every `?screen=` landing runs its
whole start-up path in Node against a stub DOM without an error; the generated markup for every
screen and sheet nests correctly; the contrast numbers above come from a script, not by eye; no em
or en dash anywhere, and no text under 12px.

Not checked here: a real iPhone. Safari's rendering of the ring mask on a backdrop-filtered
pseudo-element, the sea's motion (the automation tab only advances frames when a screenshot is
taken), the droplet's slide at speed, a finger dragging the sheet, and the keyboard lifting the
search field. Those need the Cloudflare Pages preview on a phone.

Not built: the Shake sheet itself (the row picks an untried drink and opens its sheet), the tab bar
minimising on scroll, Wrapped, and anything behind "Add to your crew".
