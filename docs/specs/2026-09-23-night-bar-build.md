# Night bar: building prototype C into the app

23 September 2026. Charles picked direction C from the three glass prototypes: "C is go", then "Yeah
inclusive of all those fixes from the other two mentioned prior, also there could be day evening
night modes as a thought". This spec is what the build works from. Branch `night-bar`.

## Sources, in order of authority

1. **This spec.** Where it and the others disagree, it wins.
2. **The prototype**, `prototypes/2026-09-23/c/` (`style.css`, `app.js`, `index.html`, `README.md`).
   Its glass numbers went through two Brave passes and three judges. **Port its values and its code;
   do not re-derive them.** Apply only the changes listed below.
3. **The judging record**, `prototypes/2026-09-23/JUDGING.md`: every graft and defect below is taken
   from it, with file and line references into prototypes A and B.
4. **The brief**, `docs/specs/2026-09-23-glass-revolution.md`: the must-dos (iPhone Safari, the
   layered glass recipe, at most four backdrop surfaces, fallbacks, medals).
5. **`docs/DESIGN.md`**: data, flows, copy, the said-once rules, states and every screen's module
   list. Those survive. Its look (cream ground, films of 45 to 88%, ink on cream, the grey medal
   ladder, no tab indicator, no overshoot) is what this build replaces, and DESIGN.md is amended to
   say so (below).

## Three rooms, by the clock

Charles: "day evening night modes". The app sits in a room whose light follows the real clock, the
way the sea hero's sky already does. The room is set on `<html>` as `data-room="day|evening|night"`
from `dayPart(nowHour())` (so `?hour=` pins it for QA), and re-set at the next boundary (a timer to
the next boundary, and again on `visibilitychange`). Nothing reads `prefers-color-scheme`.
`<meta name="darkreader-lock">` stays. `color-scheme` is set per room on `<html>` from the same
function (`light` by day, `dark` in the evening and at night), so native form controls match; the
`only light` in `index.html` and `base.css` goes.

| Room | Hours (`dayPart`) | The room | Glass | Type |
| --- | --- | --- | --- | --- |
| **Day** | 7 to 17 (morning, afternoon) | The sky and sea by daylight: prototype B's day palette (`prototypes/2026-09-23/b/b.css`, `b/shots/home-13.png`): pale sky at the top of the viewport falling to sea blue and aqua at the floor, a sun pool top right and a teal pool low left. **Never cream.** Glass over a flat light fill is the failure the brief exists to end | light: white films, B's light platter values as the model; the medium sheet still reads as glass | ink (C's light-sky-chip ink `#0E1A2E` is the model), ink-2 for meta |
| **Evening** | 17 to 21 (golden, dusk) | C's golden-hour and dusk rooms: warm, plum and amber, coral and amber pools | C's dark glass | C's light ink |
| **Night** | 21 to 7 (night, dawn) | C's night room: navy `#0B1222` with coral, amber and cool blue pools | C's dark glass | C's light ink |

- Every token that differs by room is defined three times in `tokens.css` under
  `:root[data-room="…"]` (ink, ink-2, ink-3, line, the glass films and rims, the room gradient and
  pools, and the state colours tuned per room: coral action, mint tried, gold stars, C's lamp amber,
  focus). A feature file never branches on the room; it reads tokens.
- Every text pair clears 4.5:1 (icons 3:1) in each room, measured from a Brave render, not only by
  arithmetic. Day is judged for a sunlit deck: ink on light glass.
- The change of room at a boundary cross-fades the room over about 600ms (the room layer's opacity,
  never a filter); a load paints the right room first time, with no flash (set the attribute in the
  inline script in `index.html` before first paint, from the same hour logic including `?hour=`).
- Reduced transparency and the no-blur fallback exist in every room and hold contrast.

## The room layer and the glass engine

Ported from C (`style.css`, "the glass" and the room blocks), into `src/styles/` as primitives:

- **The room**: a fixed layer behind everything (the vertical gradient and three pools as radial
  gradients on large elements, no filter). The content scrolls over it. The pools drift on transform
  only while the guest is using the app: for about 20 seconds after the last scroll or pointer
  event, then they rest. They also rest when the page is hidden, while a sheet is up, and under
  reduced motion. A phone left on a bar table must not keep the GPU busy.
- **The foot**: C's second copy of the room faded in towards the tab bar is **static** (a gradient
  in the room's colours, no cloned animated pools), with its mid stop moved to about .86 so no
  fragment of a row's text shows in the gutters beside the capsule or to the right of Log.
- **`.glass`**: C's recipe exactly (the element has no filter, opacity or mask; `::before` is the
  body, `::after` the edge lens, `.spec` the touch light, then specular, hairline, lift), with:
  - **the edge lens as A's graded frame** (`prototypes/2026-09-23/a/a.css` lines 231 to 235: two
    additive gradient frames fading from each edge across the ring, weighted for one top-left light)
    in place of C's hard `mask: content-box exclude` ring, which painted a pill inside a pill on the
    sky chip, a donut on Log and a blue band down the sheet;
  - the tab bar and Log bodies back inside the brief's saturate 160 to 190%; the magenta problem is
    solved by moving the coral pool away from the bar's position, not by desaturating the glass;
  - **`-webkit-backdrop-filter` beside every `backdrop-filter` and `-webkit-mask` beside every
    `mask`**, everywhere (C has 20 filters but 11 prefixed, 10 masks but 4 prefixed; Brave never
    needed the prefix and Safari does);
  - A's surface budget enforced in code (`a.css` line 469, `.hero-off`): a surface that is covered
    or scrolled away drops its filter, so the four-surface budget holds during pushes and sheets.
- **Motion**: press swells to 1.04 in about 110ms and settles in about 260ms with one small
  overshoot (B's press timing, the only one inside Emil Kowalski's table; C's 420ms settle is too
  slow). Screens cross-fade in 240ms with a 10px rise (C).

## Chrome

- **Tab bar**: C's floating capsule of the five tabs (64 tall, radius 32, inset 16, 10 above the
  safe area), replacing `Nav.tsx`'s bar. The active tab is the **droplet**: B's look (a clear bead
  with ink on it by day, a bright bead at night, clearly visible: C's white `.26` to `.10` was too
  faint), moved with **A's per-segment easing on a linear timeline** (`a/a.js` lines 958 to 965), so
  the swell peaks at 45% of the run, and **cancelling any running animation** before starting one.
  Dragging along the bar follows the finger (C). Under 360 wide, A's compact dock (Log 56, margins
  8), verified at 320.
- **Log button**: round, 64, coral glass, at the trailing end, carrying **a magnifier and the word
  "Log"** (A and B; C's bare plus says "add", and this opens search). Tapped, C's morph: the capsule
  folds to one round button showing the tab you came from and Log becomes the search field, **done
  on transform or clip-path, never by animating width** on a backdrop-filtered element. Focus is
  taken inside the tap so iOS raises the keyboard; the pair ride above it on `visualViewport`.
- **Search** (new, `src/features/search/`): what Log opens, over the current screen. It replaces
  "Log a drink" routing to Drinks with the search focused (the Drinks page keeps its own search).
  Empty field: **"Still to try at Crooners"**, the untried drinks at the bar you are in (B), which is
  Home's Last bar venue (the venue of the last drink logged today; move that computation out of
  `Home.tsx` into one shared selector both use), then your wishlist; with nothing logged today it
  is the wishlist alone. Typing matches drinks as Drinks' search does (the same facet matcher). Each
  result row is `DrinkCard`'s shape; its tick logs the drink with an Undo toast (C). Say a reason
  once in a heading, never on every row ("Sam matches your taste" repeated on three rows was a
  judged defect).
- **Top bar**: large titles fold into C's scroll edge glass past about 46px of scroll, built as B's
  (`b/b.css` lines 539 to 540): the filter lives on `::before` and that pseudo fades; the element
  carries no mask and is never faded itself, so no backdrop root forms mid-fade.
- **Sheet**: two heights (C). Medium: top at 47% of the screen, scaled .955, glass film over a light
  scrim so the screen reads through it; large: full width with the second film brought in by opacity.
  The film follows the finger; nothing animates a filter. The rim is B's calm one (`b/b.css` lines
  579 to 584: saturate 130%, brightness 1.12, 8px at the sides), not C's saturate 200% band. C's
  drag, rubber-band and flick thresholds, **plus every rule DESIGN.md's Sheets section already
  holds** (page locked, overscroll contained, vertical intent, Escape and scrim close, fresh-mount
  return). The SheetWave wash stays as the opening when a sheet is opened by a tap, and hands over to
  a sheet that is still glass.
- **Toast, Confirm, Segmented, Switch, Chip, Field, SearchField, Select, GlassButton, buttons**:
  restyled in `src/ui/` for the rooms, never locally.

## Content

- **Glass icons in family hues** (A): each of the nine families of `src/data/glass.ts` gets a hue,
  tuned per room to 3:1, drawn as C's lit line (C's all-amber lines made a list slower to scan).
  DESIGN.md's Iconography and `.row-lead` rules are amended: the family hue is material, like the
  metals, and is the one exception to "never a state colour".
- **Type**: C's generous sizes (body 17, meta 15, tab labels 12 at 600 and 700, nothing under 12),
  kept to five sizes as tokens.
- **Home**, C's order: greeting, the sea window (the app's `SeaHero` shader in a rounded window with
  the sky chip at top left; the readout moves out of it), the readout line (27%, 58 of 214 tried,
  and aboard, Today's three facts), **the medal tray** (module 2, inside the first screen), For you,
  the shake row, Last bar, Up next, the Wrapped row. The tray is the one dominant box: the first
  screen must end on labelled content (the For you card names visible above the bar), never on
  unlabelled dark boxes, and Home's boxes are held to the sea window, the tray and the For you cards
  with the tray dominant by more than brightness. `SeaHero`'s WebGL context takes `antialias: false`
  and a device-pixel-ratio cap of 1.5 (C asked for antialias at dpr 2, wasted multisampling).
- **Drinks, the drink sheet**: rows as C, the price leading the meta line (C's second pass).
  **Tried, Favourite and Wishlist straight under the sheet title, visible at medium height** (A;
  in C logging needed a drag to large), with Recommend on the same row at 390 (C wrapped it to a
  second row); only Tried fills (mint) when on, the rest are glyphs in the state colour.
- **Ship**: the visited mark must read as visited, not as done (a mint tick beside "0 of 2" read as
  complete to a judge): say it in words or place it so it cannot be mistaken for completion.
- **Crew, You, Stats, Log, the venue sheet, the friend sheets, Shake, Wrapped, Entry, Landing, the
  add, sailing, venue and privacy sheets**: every screen and sheet the prototype did not draw is moved
  into the rooms with the same primitives. The shaker is drawn in the room's ink and steel, not ink on
  cream. Nothing is left cream.

## Medals

- **The coin is C's SVG coin**, ported from `app.js` (the shared metal gradients in `index.html`, the
  rim, milled edge, bevel, field, the emblem struck in relief from `emblems-data.ts`, sheen and
  glint), as one component `src/features/badges/Coin.tsx` used everywhere a medal appears (Home's
  tray and new medal, the case, the medal sheet, You, the Wrapped medals slide). Bronze, silver,
  gold, and the Champion's gilt rim on blue enamel. Locked is a gunmetal blank; in reach is the blank
  with an amber ring filling to its progress.
- **Relief that reads at every size**: A's relief scaled to size (`a/README.md` line 52: 110 / px)
  and B's strike (the turned conic rim, the field struck down by inset shadows, the emblem triple
  struck with the shadow at .8). **Gin Explorer's emblem must be clearly legible at 96px**; it was
  faint pale-on-pale in C.
- The turn: once on Home's new-medal entry (C, 1.5s after 350ms), and the large coin in the medal
  sheet turns over to the reverse (the liner and "Sun Princess 2026") on a tap, in CSS 3D.
- **The medal sheet**: the coin at 196, name, tier, what earned it, and B's dated line: **"Struck on
  day 4, Tuesday 6 October. You are on 15 gins, most recently Mykonos Press and The Lux Classic."**
  The day a badge was earned is derived by replaying the guest's tried entries in date order and
  finding the first day its test passed: a pure, tested function beside `src/data/badges.ts`.
- **`Medallion.tsx`, three, `@react-three/fiber`, `@react-three/drei` and `@types/three` go.** Only
  `Medallion.tsx` and `emblems.ts` import three; the SVG coin replaces both uses. Check nothing else
  imports them, then remove the packages.
- The case (the Badges segment of You, opened in one tap from Home's tray): the earned coins large in
  tier order on the velvet, In reach as ringed blanks with what is left and the count, Locked as
  blanks with what earns them.

## DESIGN.md is amended, not rewritten

Change the sections this build changes, each with its reason: Material (the rooms, the glass
engine, the metals and the family hues as material), Colour (three rooms, per-room tokens, the
retired cream), Typography (C's sizes), Iconography (family hues), Motion (the droplet, the press
spring and its written exception to "no overshoot", the room cross-fade, the pools resting when
idle; the five authored moments become the list with the droplet and the coin turn named), Navigation
(the capsule, the droplet, Log and search, with the brief as the written reason for retiring "no
indicator"), Sheets (two heights), and the screens that change (Home, Drinks, Drink sheet, Ship, You,
Wrapped, and a new Search section). The registry gains `Coin`, the room, `.glass`, the search
overlay, the shared last-bar selector and the earned-on function, and retires `Medallion`,
`.glass-live`, `.glass-edge` and `MedalDisc`. Copy, States and the said-once rules are untouched.
`tools/qa/scan.mjs`'s token file and `tools/qa/design-allow.txt` are updated in the same change so
`npm run design:check` passes against the new tokens.

## Build and verification

- **Foundation first, serially**: tokens and rooms, the room layer and glass engine, the `src/ui/`
  controls, the tab bar, Log and the search overlay, the two-height sheet, `Coin`, the scan's tokens,
  the DESIGN.md system sections. Nothing else runs until it builds and `design:check` is green.
- **Then the screens**, one builder per feature folder, the foundation files frozen for them (a
  builder that finds a defect in a primitive reports it rather than forking the primitive).
- **Then one integration pass**: `npm test`, `npx tsc -b`, `npm run lint`, `npm run design:check`,
  `npm run build` all green; DESIGN.md's screen sections merged from what each builder reports.
- **Then Brave, serially**, one screen set per agent, own tab, 390 by 844 in an iframe with
  `?seed&nosync`, each state at `?hour=13`, `?hour=19` and `?hour=23` (day, evening, night), and a
  320 pass; contrast sampled from the render; then a refute-by-default gate review
  (`C:\Users\Charles\.claude\skills\visual-verify\GATE.md`).
- **Then Charles's phone.** Deployed to a Pages preview branch (`npx wrangler pages deploy dist
  --project-name=cruise-passport --branch=night-bar`), not `main`. Whether iPhone Safari draws the
  edge lens (a mask on a backdrop-filtered pseudo-element), the droplet at speed, the sheet drag and
  the keyboard lift cannot be seen in Brave. `main` is pushed only after he has opened it on his
  iPhone.
- House rules throughout: British English, no em dashes, sentence case, the four banned tells, 44px
  targets, one filled accent per screen, never headless Chrome.
