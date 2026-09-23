# Design constitution

The system every screen of the Cocktail Passport follows. Read it before touching any CSS or TSX
that renders. It replaces the loose "Liquid Sea Glass" notes in `REVIEW/SPEC.md` where the two
disagree. Standing workspace rules (British English, no em dashes, no pill or dotted eyebrow labels,
never twee) apply on top and are not repeated here.

## Thesis

A pocket logbook for a fifteen-day voyage. It is opened two hundred times, one-handed, at a bar, in
sun glare, often by someone who does not use apps much. The second-hundredth use is the one that
matters: "have I had this, what is left at this bar, log it" in three seconds, then back to the
conversation. The sea and the ship are the one place the app is allowed to be a poster. Everything
else is an instrument.

Four qualities, and anything that contradicts one of them goes:

- **Legible.** Readable in sunlight by someone of sixty-five. Nothing below 12px, nothing under
  4.5:1, nothing that relies on a hover.
- **Quick.** The primary action on every screen is one tap and sits where the thumb rests. Recurring
  information keeps its position from day one to day fifteen.
- **Calm.** One accent. Content sits flat on the ground; only chrome floats. Motion is feedback, not
  weather.
- **Honest.** Numbers are the guest's own. Labels say what a thing is in plain words. No decoration
  that pretends to be information.

Governing priority order, from the guest's brief: information architecture, then viewport geometry,
then hierarchy, then state behaviour, then component design, then typography and colour, then
decoration. A polished component on a screen with the wrong module order is still wrong.

## Geometry

One system, used everywhere. If a value is not on this list it is not used.

| Role | Value |
| --- | --- |
| Outer content inset | 16px |
| Spacing scale | 4, 8, 12, 16, 24, 32 |
| Between sections (heading to heading) | 32 |
| Heading to its content | 8 |
| Between related rows | 0 with a hairline, or 4 with none |
| Between groups inside a section | 16 |
| Control height | 44 (compact 36, with a 44 hit area) |
| List row minimum height | 48 |
| Radius, surface (sheet, hero, panel) | 20 |
| Radius, control (button, field, chip, toggle, row highlight) | 12 |
| Radius, tag (small tags 24px tall or less, dots, avatars) | 999 |
| Border | 1px `--line` everywhere a border exists |
| Shadow | the sheet (`--sh-sheet`) and the glass chrome's lift (`--glass-lift`); content has none |

Rule for containers: **one level.** Content sits on the ground as headings, rows and hairlines. A
`.panel` exists only for a discrete interactive module with its own boundary (a form, a QR block, a
sheet's inner control group). A panel never contains another panel, a card never contains a card,
and a list is never a stack of boxes.

Spacing indicates conceptual distance: tight inside a group, moderate between groups, large only
between sections. Whitespace separates ideas; it does not pad every object.

## Material

The look this section describes replaced the cream ground on 23 September 2026: prototype C, "Night
bar", with the grafts from A and B listed in `docs/specs/2026-09-23-night-bar-build.md`. The reason is
the brief's (`docs/specs/2026-09-23-glass-revolution.md`): glass over a flat light fill does not read
as glass, and most drinks are logged in a bar after dark.

- **The room.** The app sits in a room whose light follows the clock: **day** from 7 to 17,
  **evening** from 17 to 21 and **night** from 21 to 7, which are `dayPart()`'s six parts taken in
  pairs (morning and afternoon, golden hour and dusk, night and dawn), so the room, the sea's sky and
  Home's greeting never disagree. The room is `data-room` on `<html>`: set before the first paint by
  the inline script in `index.html` (which honours `?hour=`, so a load never flashes the wrong
  light), then by `src/app/room.ts` at the next boundary and whenever the page comes back into view.
  Nothing reads `prefers-color-scheme`: the room is the clock's, not the phone's setting.
- **What a room is.** A fixed layer behind everything (`.room`, mounted by `Shell`): a vertical
  gradient (`--room-0`, `--room-mid`, `--room-1`) and three pools of light, each a radial gradient on
  a plain element with no filter. The content scrolls over it and the glass bends it.
  - **Day** is the sky and sea by daylight, prototype B's day palette made paler, because rows sit on
    it directly with no platter: a pale sky at the top falling to sea blue and aqua at the floor, the
    sun pooled top right and the sea's teal low left. Never cream. Light glass (white films) and ink.
  - **Evening** is C's golden hour and dusk as one room: plum and amber, with coral and amber pools
    and a pale gold one. C's dark glass and light ink.
  - **Night** is C's bar after dark: navy `#0B1222` with coral, amber and cool blue pools. The coral
    pool sits halfway up the left edge, never low left under the tab bar, where the chrome's
    saturation turned the capsule magenta; the glass keeps its saturation and the pool moved.
- **The pools drift, then rest.** On transform only, over 46 to 58 second cycles, for about 20
  seconds after the guest last scrolled or touched; then they stop. They also rest while the page is
  hidden, while a sheet is up, and under reduced motion. A phone left on a bar table keeps nothing
  moving and no glass re-blurring.
- **A change of room** cross-fades the layer over 600ms on its opacity, never a filter: the outgoing
  light keeps its own `data-room` (the room tokens are declared on `[data-room]` for that reason)
  until the incoming one is over it. The ink and the controls change half way, when the two lights
  are level.
- **The foot.** Over the content's last 110px, a still gradient in the room's floor colours, faded
  in by a mask: clear at the top, .86 by the tab labels, the room alone from the tab bar's lower edge
  down. A row dissolves into the room as it goes under the bar, and no fragment of its text shows in
  the gutters beside the capsule or to the right of Log. It is never a clone of the drifting pools,
  which would re-blur the bar every frame.
- **The glass engine** (`.glass` in `base.css`), prototype C's recipe as one primitive. The element
  carries no filter, opacity or mask, and neither does any ancestor while it is meant to be seen:
  any of those makes a backdrop root, and the glass would sample nothing behind it. Its layers:
  `::before` is the clear body (blur 6, saturate 180%, brightness 1.08, the room's `--glass-film`
  with a sheen across the top third); the children paint over it (`.spec`, the touch light that
  follows the finger, then the content); `::after` is the edge lens (blur 14, saturate 210%,
  brightness 1.32, a 135 degree wash) masked by prototype A's graded frame, two gradient frames that
  fade from each edge across the rim (`--rim`, 8px, 6 on `.glass-sm`) with the foot at 70% and the
  right side at 80%, for one light from the top left. C's hard `content-box exclude` ring is gone: it
  painted a pill inside a pill on the sky chip, a donut on Log and a band down the sheet. The lens
  carries the specular (upper left lit, lower right shaded) and the hairline; the lift is the
  element's own shadow (`--glass-lift`). `-webkit-backdrop-filter` stands beside every
  `backdrop-filter`, and `-webkit-mask` beside every `mask`: Safari needs them, and Brave never shows
  that they are missing.
- **Tuning a surface.** Only through custom properties on the surface itself: `--film`, `--rim`,
  `--glass-blur`, `--glass-sat`, `--glass-bright`, `--lens-blur`, `--lens-sat`, `--lens-bright`,
  `--solid`. Never its own `backdrop-filter` or `::before` background, which is what lets the
  fallbacks below win everywhere. The variants: `.glass-sm` (a narrower rim), `.glass-calm`
  (saturate 130% and 120%, for glass on the sea's sky or a cool pool, where the full numbers painted
  a neon rim and a round button read as a blue one), `.glass-tint` (coral, the Log button's, the one
  tinted glass). The tab bar and Log keep their bodies inside the brief's 160 to 190% saturation.
- **The budget.** At most four backdrop-filtered surfaces on screen. A surface that is covered or
  scrolled away drops its filters with `.glass-off`, on the surface or on any ancestor (prototype A's
  `.hero-off`), so the count holds while a screen is pushed over another or a sheet is up.
- **Fallbacks, in every room.** With no backdrop filter, or under `prefers-reduced-transparency`, the
  body goes solid (the room's `--glass-solid`, or the surface's `--solid`: the coral for Log, the mint
  for the Confirm tick) and the rim keeps its specular and hairline, so the hierarchy and every
  contrast pair hold with no optics at all.
- **Where glass lives.** Chrome only: the tab bar and Log, the top bar once a screen is scrolled,
  the sheet, the sky chip and Back, the toast, the Confirm tick, the Wrapped certificate. It reads as
  glass because content moves beneath it. Never in the content layer, never glass on glass (the
  glass bible's two hard rules): a sheet that opens another replaces it rather than stacking, the way
  the venue sheet opens the drink sheet and Your details opens the privacy note.
- **Panel** is a quiet film on the room (`--panel`), 1px `--line`, radius `--r-surface`, no shadow,
  no optics: it is content, not chrome. Use sparingly (see the container rule).
- **Row highlight** for tappable rows: none at rest; `--press` on press.
- **The metals and the family hues are material**, like the sea: they sit outside the one-accent
  rule. The family hues are in Iconography.
- **The medals** are struck metal, one SVG coin (`Coin`) wherever a medal appears: Home's new medal
  and tray, the case, the medal sheet, You and the Wrapped medals slide. It is prototype C's coin
  with light from the top left, as on the glass: B's turned rim (a conic, lit at two opposite points
  as metal on a lathe is, drawn as a disc behind the SVG because SVG has no conic), the milled ring,
  the bevel falling into the field, the field struck down below the rim (its wall shaded top left
  and lit bottom right, B's inset shadows drawn as two radial rings), then the emblem from
  `emblems-data.ts` struck three times: a shadow down and right at .8, a highlight up and left, the
  face. The relief is scaled to the coin, A's 110 / px coin units held between 0.8 and 2.6, so the
  strike is about a pixel deep on a 44px coin and on the 196px one alike. Each emblem is centred on
  the field and fitted to one size from its measured extent (C's table).
  - **Bronze, silver and gold** take A's polished field, a diagonal with a darker mirror band past
    the middle, in place of C's pale dome: a pale emblem on a pale silver field is what left Gin
    Explorer faint at 96px, and the band is what puts a darker ground under the frosted emblem.
    **The Champion** is a gilt rim round a field of deep blue enamel.
  - **A medal not yet earned is a blank**: the same coin in gunmetal with nothing struck into it,
    its sheen and glint dimmed. Never a grey copy of the earned coin, which would show the reward
    before it is won. **In reach**, the blank carries a ring in `--amber` on the room's `--track`,
    filled to the badge's progress; **locked** is the blank alone.
  - **The turn.** Home's new medal turns once on entry (1.5s after 350ms, C) and then rests. The
    large coin in the medal sheet is a button that turns over to its reverse on a tap: the liner in
    silhouette over the ship's name and the sailing's year, struck the way the emblem is, read from
    the sailing rather than written in. Both are CSS 3D on transform (two faces and a milled edge of
    stacked discs). Under reduced motion the coin holds still and a tap shows the reverse at once.
  - Every coin draws its own gradients under ids made from `useId`, so two coins on one screen, or
    the two faces of one, never share an id. The metals live in `Coin.tsx`'s table, not in
    `tokens.css`: they are material, like the sea, and do not change by room. The cast shadow and the
    side-on edge are the two written exceptions in `design-allow.txt`.

There are no floating cards in the content layer. The two-stop card shadow and the turquoise film on
content are retired; the specular edge belongs to glass chrome only.

### Sheets

A sheet is the one place content is covered, so it is the most-used glass surface and the gesture
has to be right. Rebuilt on 23 September 2026 with the night bar (the build spec's Chrome section):
C's two heights on the glass engine, B's calm rim, and every rule this section already held.

- **Two heights** (prototype C). **Medium**: the sheet's top at 47% of the screen and the pane
  scaled to .955 from its foot, so the screen it came from reads through it and beside it; its
  content does not scroll, and a drag anywhere on it moves the sheet. **Large**: full width, from
  10 below the status bar, with a second film (`--sheet-film-large`) brought in by opacity for
  reading; its content scrolls. The transform, that film and the scrim all follow one number, the
  sheet's offset, so a drag carries all three and nothing animates a filter. `Sheet` opens at
  `height="large"` by default, because a form needs its fields and the keyboard; a sheet to look at
  (a drink, a venue) passes `height="medium"`. A tap on the grabber, a 44px button, moves between
  the two; with a mouse, the wheel does.
- **Look.** The glass engine (`.sheet.glass`) at C's numbers for a sheet: blur 8, saturate 160%,
  brightness 1.04, over the room's `--sheet-film` (navy at .40 in the evening and at night, white at
  .64 by day). At a 26% film and 180% a mint tick in the list behind came through under the meta
  text at 3.7:1; at these it is 5:1. The rim is B's calm one (saturate 130%, brightness 1.12, 8px),
  because C's 200% over 10px lit the room into a band down both sides, a rule along the box by
  another name. Radius 30 all round and the sheet shadow. The scrim is the room's `--scrim` with no
  blur (the old 8px blur was a fifth filter pass), at .7 of itself at medium and all of it at large.
  The pane is never faded and has no faded ancestor, which would cut its glass off from the screen:
  it enters on transform from below the screen, on the drawer curve over 440ms (`--t-drawer`). The
  SheetWave wash is its opening when it is opened by a tap (`wave`, on by default): the sea washes
  the content up over the room's solid glass (`--glass-solid`, never the cream it once was) and
  recedes, and hands over to a sheet that is still glass.
- **Dismiss and settle** (C's thresholds, which replace the 35%-of-height rule). The drag must be
  vertical in intent (more down than across in the first 10px) and then follows the finger from
  where the sheet is, with no jump for the 10px. Velocity is the last 80ms of movement, anchored at
  release, so a drag that slows to a stop cannot read as a flick. A flick down (over 0.9px/ms)
  closes it, or from large above the medium line takes it to medium; a flick up (over 0.6px/ms)
  takes it to large. Otherwise where it is let go decides: past the medium line by more than a third
  of the way to closed (never under 120px) it closes, above half the medium line it goes large, and
  between it settles at medium. Pulled above large it gives the square root of the pull, times four,
  and comes back. Escape, the X and a tap on the scrim also close it, and every close the sheet
  starts goes down first; a sheet its owner closes (a form's Save) unmounts at once.
- **Nothing else moves.** While a sheet is open the page behind is locked (position-fixed body on
  iOS, restored on close), the sheet's scroller contains its overscroll so a pull at its top never
  reaches the page (no pull-to-refresh), `touchmove` is prevented during a drag, and the scroller
  never scrolls sideways. At large a drag starts from the head always and from the scroller only at
  its top and only downward; at medium it starts anywhere but a field, the X, a canvas or
  `[data-noswipe]`, and a drag that moves never becomes the click of the row it started on. The dock
  steps down under the sheet and the top bar leaves, so the sheet is the glass on screen.
- **Reduced motion and transparency.** Under reduced motion the layer fades in and out over 200ms
  and the sheet stands at its height; for those 200ms the fade flattens the glass, which is the
  cost. Under reduced transparency the body goes solid and the reading film is always in.
- **Coming back.** A sheet returned to after a replacement is a fresh mount, so any phase it comes
  back to must be a still state, its end values held with nothing left to replay: ShakeSheet's
  `is-still`, which returns from the drink sheet to the reveal with the cap off and the glass hanging
  rather than throwing the cap again, is the worked case.

## Colour

Colour is semantic. A colour that means something in one place may not decorate another. Every
colour below is defined once per room in `tokens.css` (evening shares night's ink and state colours,
over its own room); a feature file never branches on the room, it reads the token. The figures are
arithmetic, WCAG ratios with alpha composited and no credit for blur, against the worst point each
room can put behind the pair: the teal pool's peak on day's floor, and the brightest pool in the
evening and at night. The Brave render pass at `?hour=13`, `19` and `23` is the measurement, and it
wins where the two disagree.

| Token | Day | Evening and night | Meaning, and nowhere else |
| --- | --- | --- | --- |
| `--room-0`, `--room-mid`, `--room-1`, `--pool-a/b/c` | pale sky to aqua; teal, sun and sky pools | plum or navy; coral, amber, and gold or blue pools | the room (Material) |
| `--ink` | `#0E1A2E` (9.8:1) | `#F6F1E9` (7.6:1) | text and icons |
| `--ink-2` | `#2A4058` (6.0:1) | `--ink` at 84% (5.9:1) | secondary text and labels |
| `--ink-3` | `#46607A` (3.7:1) | `--ink` at 62% (4.1:1) | large text, icon-only glyphs. Never body or meta text |
| `--line`, `--line-2`, `--press` | ink at 14, 8 and 7% | warm white at 14, 8 and 7% | hairlines and borders, the quieter divider, a press |
| `--well`, `--plate`, `--plate-quiet`, `--plate-solid`, `--track` | white films, `#F2F7FA` | a shade, warm-white films, a solid navy or plum | a recessed field or track; a raised plate (the selected segment); a quiet button; a popover that must be read rather than seen through; a switch's track |
| `--fill` / `--on-fill` | ink, white on it | warm white, ink on it | a selected control (a chip that is on) |
| `--coral-ink` | `#C72F50` | `#C72F50` | the filled action, white type on it (5.3:1). Never a text colour in the dark rooms, where it is 3:1 |
| `--coral`, `--coral-text` | `#B8284A` (3.4:1), `#8A1A36` (5.2:1) | `#FF6B84` (3.1:1), `#FFA3B4` (4.6:1) | the action colour as a glyph, and as text |
| `--coral-glass` | a heavier coral (the white label 4.8:1) | C's coral tint | the Log button, the one tinted glass |
| `--mint` / `--mint-fill` / `--on-mint` | `#0A5A3E` (4.7:1), white on it | `#5FE0A8` (5.2:1), `#062818` on it | tried and visited, nothing else |
| `--star` / `--gold-ink` | `#7A4D00` (4.1:1) / `#6A4400` (4.9:1) | `#FFC54D` (5.5:1) | rating stars and rating text, nothing else |
| `--lamp` / `--on-lamp`, `--amber` | a warm brown `#6E3C00` (5.1:1), `#8F5200` | `#FFE2B8` (6.9:1), `#FFB45C` | light, not state: a card's reason line, Undo, a lit line's halo, the in-reach ring. By day a lit line would vanish, so the lamp is a brown |
| `--focus` | `#5B45C9` (3.8:1) | `#B3A6FF` (4.0:1) | the focus ring only |
| `--fam-*` | nine hues, 3.5:1 or more | nine lifted hues, 4.0:1 or more | the family of glass a drink is served in (Iconography) |
| `--sea-ink` | `#0F6563` | `#6FC9C4` | chart fills where ink would be too heavy (bars, area) |
| `--friend-*` | six hues | the same | a person's identity dot and their name mark. Never for decks, charts or badges |

Accent area: coral fills at most one control per screen, and on every screen that shows the Log
button, Log is that control. The sea hero's palette is its own (it mirrors the GLSL) and is the poster
exception; the metals and the family hues are material.

The rooms replace "the app is light only". `color-scheme` is set per room on `<html>`, by the inline
script before the first paint and by `room.ts` after it (light by day, dark in the evening and at
night), so native controls and scrollbars match the light, and the `theme-color` meta follows the
top of the room. `darkreader-lock` stays: the Dark Reader extension rewrote every colour on the page
in Brave on 23 September 2026.

Retired: the cream ground and its washes (`--cream` and `--wash-*` resolve to the room until the
screens have moved off them), the fruit set as a general palette, gradient progress fills, coloured
deck numbers, the eight-colour donut, per-toggle colours (tried is mint, everything else is ink on and
off), the yellow glow behind the Wrapped seal.

## Typography

One family (the platform's rounded or system sans; no webfont), three weights, five sizes and a
floor, three inks. The sizes are prototype C's generous ones, as tokens (`--f-*`): body at 17 and
meta at 15 read at arm's length in a dim bar.

| Role | Token | Size / weight / line-height | Use |
| --- | --- | --- | --- |
| display | `--f-display` | 64 / 700 / .9, tracked -.035em | the readout's figure and the Wrapped numerals only |
| title | `--f-title` | 34 / 700 / 1.12 | the screen's large title |
| heading | `--f-heading` | 21 / 700 / 1.25 | a section h2, a sheet's title |
| body | `--f-body` | 17 / 400 / 1.5 | running text, a row's primary line, every field (over iOS's 16px zoom line) |
| meta | `--f-meta` | 15 / 400 / 1.4, `--ink-2` | secondary lines, labels, counts |
| floor | `--f-micro` | 12 / 600, 700 when active | the tab labels, and nothing else |

- 12px is the floor, and only the tab labels sit on it. Nothing renders smaller, including chart
  axes and hint text. C's in-between sizes (26 for a sheet's title, 24 and 19 for names on the tray
  and the cards, 13 for a kicker) fold into these: a sheet's title is heading, a card's name is body
  at 700, a kicker is meta.
- Emphasis inside body text is weight 600, never colour, never italic, never caps.
- No uppercase tracked labels anywhere. A section is introduced by a plain heading; a field by a
  sentence-case label at meta size; a sheet by its title and one meta line beneath it.
- Numbers are tabular everywhere they can be compared.
- Headings `text-wrap: balance`; body `pretty`, except the Wrapped crew card's facts, which balance
  so a list of drink names never leaves one alone on its second line. Clickable text never wraps to
  two lines.

## Iconography

The drawn set in `ui/Icon.tsx` (24px grid, 1.8 stroke) is the only icon system. No emoji as UI. An
icon appears beside text only when it adds recognition the word lacks (tried, favourite, camera, the
glass a drink is served in). The nav uses icon plus label at all times.

The set holds a glass for each of the nine families in `src/data/glass.ts` (`IconGlassCocktail` and
the rest, chosen by `GlassIcon`), every bowl drawn whole, both sides, and `IconShaker`, the cobbler at
icon size. Either one leads a row in the `.row-lead` slot: the glass on every row that names a drink
(Drinks, a venue's list, Log, Stats' rated rows, Crew's Discover together), the shaker on Home's row
that opens the Shake sheet. `IconDrinks` is the brand's
funnel and draws one side of a glass, which is right for the tab and wrong for a drink. The glass
leads the drink row (`DrinkCard`, on Drinks and in the venue sheet) and says what kind of drink it is
before a word is read.

The glass is drawn as a lit line in its family's hue (prototype A's family hues on C's lit line):
`GlassIcon` draws the family's icon twice, the line over a halo of the same path at 4.4 wide and 22%
(`.gicon-halo`), which costs a stroke rather than a filter on a list of two hundred, in
`--fam-<family>`, tuned per room to 3:1 against the worst point of the room (3.5:1 or more by day,
4.0:1 or more in the evening and at night). The hue is material, like the metals, and it is the one
exception to "a row's glyph is never a state colour": C's all-amber lines made a list slower to scan.
The shaker on Home's row stays in `--ink-3`.

The shaker (`Shaker`, `Glass`) is drawn in the same idiom but is not in the set, and it takes the one
hero stroke: 2.4 on screen for the tin and every glass, whatever the drawing is scaled to. The cap's
grooves are its one hairline, 1.2 in `--ink-3`, and the fine details inside a glass (a pick, the
lime's segments, steam, ice, the flute's bubbles, the rocks glass's heavy base) draw at 1.75.

## Motion

The authored moments, and nothing else moves on its own: the ship riding the sea (the sea itself,
with its sky following the clock, is the app's one live effect), the SheetWave wash when a sheet is
opened by a tap, the hero count-up on first paint, the coin turning (the new medal's single turn on
Home, one rotation and then still, and the large coin in the medal sheet turning over to its reverse
on a tap), the droplet (the active tab's lens sliding along the tab bar; Navigation), and the shaker
in the Shake sheet. The room's pools drift only while the guest is using the app and then rest, and
a change of room cross-fades over 600ms (Material). Everything else is feedback: glass under a thumb
swells to 1.04 in 110ms and settles over 260ms (`.press`); a content control gives to `.97` over
110ms and comes straight back (`.pressable`); state colour over 200ms; a screen fades in over 240ms.
The easings are tokens: `--e-out` for nearly everything, `--e-spring` for the press settle,
`--e-drawer` for the sheet and the chrome moving as a drawer, `--e-drift` for the pools, and the
shaker's written exceptions below. No overshoot on UI state apart from the press settle, no reveal
stagger on every screen, no chart grow-ins, no endless pulses (the pools stop). Under
`prefers-reduced-motion` each effect has its own fallback that keeps the state change visible; there
is no global animation kill.

**The press settle** is the written exception to "no overshoot": one small overshoot as pressed glass
settles back, prototype B's timing (a 110ms swell and a 260ms settle on `--e-spring`, the only press
curve of the three prototypes inside Emil Kowalski's table; C's 420ms release was too slow). It is
glass being pressed and let go rather than a state changing. It runs on the `scale` property, so it
never fights a transform the surface uses to move, and under reduced motion there is no swell.

**A screen's rise.** C fades a screen in over 240ms with a 10px rise. The route transition fades the
root in over 240ms (`craft.css`); the rise is not built, because on the root it would lift the fixed
room and the tab bar with the page, and a `view-transition-name` on the view would make the view a
backdrop root for any glass inside it. It belongs to whoever captures the screen as a group of its
own.

**The ship** rides the water rather than a clock of its own. The sea's surface is one long swell,
about one and a half crests across the hero and a tenth of its height from trough to crest, with a
shorter wave and a little chop on it. Each frame the liner reads the water's height at its stern and
its bow from `swell()` in `SeaHero.tsx`, which is the shader's function term for term (change one,
change both), and lifts by the full height, about 6px either way, while it pitches a third of the
slope, at most about 5 degrees: taken whole, the slope tipped it 16 degrees, which read as a ship
foundering rather than riding. Where there is no shader the CSS bob in `sea.css` is the fallback;
under reduced motion the ship holds one position.

**The shake** is the fifth, and the only one the guest starts themselves. Every time in it comes from
`SHAKER` in `timing.ts`: the sheet runs its phases on it and hands the rattle its times, `Shaker`
sets the CSS durations from it, and `keyframes.mjs` writes the CSS keyframes from it, so a timing
changes in one place.

- **The shake**, 0 to 1.8s. The tin is lifted and shaken end to end over the shoulder, the way a
  cobbler is: a small dip the wrong way, then gentle, harder and violent strokes (travel of 16, then
  26 to 30, then 38 to 40 on the drawing's grid, leaning 8 to 20 degrees), the cap chattering on the
  strainer. It is set down hard on the bar at 1.8s, on the rattle's clack, with one rebound of 2.5px.
- **The pressure**, 1.8 to 2.3s. The dice knock from inside twice, at 1.97 and 2.1s: the tin hops
  3px, then 5px, sharper. The cap lifts off the neck on each, 7px and back, then 12px, quicker, and
  held, and is then pressed 1.6px down into the neck over the last 65ms: the wind-up the pop is
  thrown from.
- **The pop**, at 2.3s. The cap is thrown up off the neck, falls away over the right shoulder
  tumbling, and is gone 190ms after its apex. Six ink strokes draw outward from the mouth over
  160ms and have faded by 280. The tin kicks down 2px as the pressure lets go. 20ms behind the cap,
  so the cap is clear before the rim comes up under it, the glass for the drink comes out of the
  mouth at the neck's width, grows to its full size as it clears the neck, rises 5px past its hang
  and settles on it at 2.84s, its foot at least 18px clear of the neck.
- **The card**, from the landing. Its lines arrive in reading order, 80ms apart, each from 8px down
  and a 4px blur: the name at 2.84s, the place, then the reason when there is one, the last in by
  3.3s. "Shake again" fades in on the last line's clock.

The written exceptions, each with its reason beside the keyframes in `shake.css`:

- **The prize's one overshoot and settle.** The rule above bans overshoot on UI state; this is a
  glass thrown out of a tin rather than a state changing, and a linear arrival reads as two pictures
  being swapped. One overshoot, never a bounce.
- **`--e-shake`** (`cubic-bezier(.77, 0, .175, 1)`, a strong ease-in-out) on the shaker's travel and
  nowhere else: the strokes, and the tin and the cap settling back in the held beat. The tin is
  travelling on screen and reversing at each end; on `--e-out` it leaves every reversal at full speed
  and the strokes jump rather than turn.
- **The linear set-down**, and the linear hops of the knocks. A tin put down hard does not slow
  before it meets the bar.
- **Linear between samples.** The cap's flight and the glass's rise and sink are sampled from the
  motion every 20ms and joined linearly, which is how the cap's fall speeds up and how the glass's
  size follows where its foot is.
- **The glass enters at 0.6 of its size**, under the 0.9 floor for an entrance. It is an object
  emerging from a container at the container's width, not an entrance from nothing, and it is inside
  the tin, unseen, until then.

Nothing spins, because a spinning prize is the slot machine and not the crate. It is finite, it is
user-triggered, it lives inside a sheet and nothing else on the sheet moves while it runs. "Shake
again" puts it back first: the glass sinks into the mouth in 180ms and the cap comes back onto the
neck from 50ms, seated by 250, inside the 260 the sheet waits, so every shake starts from a closed
shaker. Under `prefers-reduced-motion` the tin does not move, nothing is drawn bursting, and the
rattle, the knocks and their taps are silent; at the pop the cap fades off in the first half of the
same 200ms every other fallback here uses and the glass fades in where it hangs in the second, so the
two are never on screen at once, and the card's lines and "Shake again" fade in together over the
whole of it. The reveal still lands.

## States

Every control ships default, pressed, focus-visible, disabled, a disabled one a ghost of its enabled self rather than a second filled tone. Every list ships its empty state with
the one action that fills it. Anything that waits on the network shows that it is waiting and what
failed. Tried, visited, favourite and wishlist read the same way on every screen: a filled glyph in
the state colour, not a background tint.

**Confirmation.** A completed action the guest cannot otherwise see (a friend added, a group joined,
a code accepted) is confirmed once, the same way everywhere: the `Confirm` primitive, a filled-green
liquid-glass disc (`.glass-mint`) with a white tick that draws in, a one-line label ("Sam added"), and a haptic where the platform
gives one (`haptic()`: the Vibration API on Android, the switch-toggle trick on iOS Safari, nothing
the feature depends on). It holds for about a second and clears itself. Actions whose result is
already visible (tried, rated, favourite) stay silent; the glyph is the confirmation.

## Copy

House rules apply. In addition: sentence case throughout; ration the middle dot to one per line;
labels name the thing ("Tried", "Deck 7", "8 of 18 bars"), never the mood; no version, no "beta",
no exclamation marks. "Tried" not "sipped".

Each thing is said once. These rules come from the 22 September declutter
(`docs/specs/2026-09-22-declutter.md`) and bind every screen and sheet:

- **A row that opens a sheet does not repeat that sheet's meta line.** Home's "Shake for a drink"
  and Crew's "Set up a group" are one line each; the sheet they open says what it is for.
- **A sheet's meta line carries the one fact its controls do not show**, never a list of the fields
  below it: "Only the deck and name are needed.", "Your logged drinks stay where they are.", "How
  your crew sees you.". Every sheet keeps its one meta line; this rule chooses its wording.
- **Placeholders are examples, never labels.** A field whose label already says what it is carries
  none ("Your name"); where an example helps, the placeholder is the example ("Gin, liqueur", "4pm
  to late"), and no hint repeats it.
- **A hairline separates rows in a list and never groups inside a sheet.** Groups inside a sheet are
  separated by space. The one hairline a sheet keeps is the one above a remove or delete in the
  venue and sailing forms, which the registry requires.
- **No structural zero, on any screen.** A count, chip, bar or row that can only read zero is not
  drawn: no "0 of 0" on a venue with no drinks, no empty meter track on a venue with nothing tried,
  no deck chip that no drink is filed on, no "0 of 18" beside an empty Earned list.
- **A number is shown once per screen, and not on a tab another tab already covers.** The filter
  panel carries no count because the count line beneath it is one; Ship's deck headings carry none
  because Stats' "Where you have been" has completion by deck; the Wrapped footer carries no
  position because the rail at the top shows it. The one written exception is Home's Last bar ("12
  of 44 tried here"), which repeats a Ship row on purpose: it answers "what is left at this bar"
  where the guest is standing, without a tap, and that question is Home's to answer.

## Navigation

Five tabs, icon and label: **Home · Drinks · Ship · Crew · You**. "You" holds Stats, Badges and Log
behind a segmented control at the top of the page. The routes `/stats`, `/badges` and `/log` keep
resolving (they open You on that segment) so every existing link still lands. Rebuilt on 23
September 2026 as prototype C's chrome, with A's and B's fixes (`docs/specs/2026-09-23-night-bar-build.md`,
Chrome).

- **The dock** (`src/app/Nav.tsx`, `nav.css`): C's floating capsule of the five tabs, 64 tall,
  radius 32, 16 in from each side and 10 above the safe area, and Log, round and 64, 10 along at its
  trailing end. Both are the glass engine at its own numbers. Tab labels are 12px at 600 in ink; the
  tab you are on is 700, in ink on the droplet. Under 360 wide it is A's compact dock, 56 tall and 8
  in from the sides, so five tabs of at least 44 clear Log at 320. While a sheet is up the dock steps
  down under it, one translate on the strip, so the sheet is the glass on screen and nothing behind a
  modal can be tapped. The tab you are on, tapped again, scrolls its screen to the top.
- **The droplet** marks the tab you are on. It retires this section's old "no indicator pill": the
  brief (`docs/specs/2026-09-23-glass-revolution.md`) asks for iOS 26's tab bar, whose selected tab
  is a lens inside the glass, and the plate the 22 September declutter removed was a pill on a flat
  bar, not that. It is B's bead, bright and clearly visible in every room (`--bead`, `--bead-shadow`,
  with ink on it, `--on-bead`; C's white at .26 was too faint to find), inside the capsule's glass
  with no filter of its own. It slides on transform with A's liquid morph: 480ms on a linear timeline
  with each segment eased on its own, so the 1.22 by 1.08 swell peaks at 45% of the run, overshoots
  the tab by 4% and settles, and a run already going is cancelled from where it is drawn before the
  next one starts, so quick taps never stack. Dragged along the capsule it follows the finger,
  stretched to 1.16 by 1.08, and lands on the nearest tab. Under a thumb the capsule swells to 1.02
  and the bead to 1.06. Under reduced motion it fades in at its new tab over 200ms.
- **Log** carries a magnifier and the word "Log" (A and B; C's bare plus said "add", and what it
  opens is a search), in white on the one tinted glass (`.glass-tint`). Tapped, the field takes focus
  inside the tap, so iOS raises the keyboard, and C's morph runs: Log becomes the search field and
  the capsule folds into one round button showing the tab you came from, which closes the search.
  It is done with clip-path on the glass's two filtered layers and opacity on the pieces, never by
  animating width on a backdrop-filtered element, and nothing lands on an element carrying glass or
  on its ancestor (Material). The field and the round button ride above the keyboard, read off
  `visualViewport` (`--kb`). The round button, Escape and a route change close the search. Every
  other "Log a drink" in the app (Home's hero button, the empty states of Stats, Badges and Log)
  calls `openLog()` and opens the same search (Screens, Search).
- **The top bar** (`TopBar`, `shell.css`): a screen's large title folds into C's scroll edge glass
  once the page is 46px down. The glass engine at blur 16 (at 10 the Home readout's 64px figures
  ghosted through), saturate 170%, brightness .92, with the top of the room as its film, .8 falling
  to .66 by the title line (`--bar-film`), and the title again at body size, 700. Built as B's: the
  filter lives on `::before` and only that fades, the title fading on its own; the element carries no
  mask and is never faded, so no backdrop root forms half way through. Its last 14px fade out by a
  mask on the filtered layer itself, so there is no rule along its foot. A screen names it with
  `useScreenTitle('…')` (`src/app/screenTitle.ts`), in the words its large title prints; one that
  does not gets its tab's name. It leaves while a sheet is up. It is the budget's third surface after
  the capsule and Log, so a screen with glass of its own (Home's sea chips) drops that glass with
  `.glass-off` while the bar is in.
- **A screen** fades in over 240ms with a 10px rise (`.screen`, `shell.css`), on the screen alone,
  never on the view or the root, which would lift the fixed room and the dock with it. It is keyed
  by tab, so You's three segments change in place. The tabs navigate without a view transition: a
  root snapshot would show the droplet twice for the length of the fade.

## Screens

Each screen has a five-second read, its modules in rank order, and what must be visible at
390×844 with the nav in place (about 770px of content). Modules below the fold are still present;
they are simply not the reason the screen exists.

### Entry

Read: which sailing, who am I, what does this do with my data. The first open asks those three once
and then never asks again; `enteredCruise` is the record that it did. It renders outside `Shell`, so
it carries its own ground and its own masthead and has no nav.

0. **The ground**, the same `<div className="ground" aria-hidden />` `Shell` renders. Not a module:
   without it the screen falls back to flat `--cream` from `body` and loses the two washes and the
   grain. The screen itself is a `<main className="entry">`, so it has one landmark, as `main.view`
   does everywhere else.
1. **Masthead** (chrome). The same component the landing carries, pinned to the top of the
   viewport rather than part of the centred block.
2. **The sailing.** `h1.t-title` with the ship, then one `p.t-meta` line: line, middle dot, dates.
   Sibling: a sheet's title and its one meta line. With more than one sailing in the registry the h1
   becomes "Choose your sailing" and `Select` answers it under a "Your sailing" label. The registry
   holds the published sailing plus any the guest has set up for themselves, so that branch renders
   from the moment they make one, and "Set up your own sailing" sits as one `button.row.pressable.cruise-byo`
   beneath module 2 in either branch, a one-line row in the privacy row's shape and its wrapper, with
   no chevron. It has no second line: "your own sailing" says what it is, and on the single-sailing
   branch there is no list for a second line to point at.
3. **Name and colour.** `NameFields` inside `div.entry-fields`. On the ground, not in a `.panel`: the
   sibling is `ProfileSheet`, whose identical pair sits flat on the sheet. `NameCard` keeps its panel
   on Crew because it sits among other content there; here the form is the screen, and a box around
   the only thing present is the fourth banned tell.
4. **What this is**, one `p.t-body`.
5. **The consent line**, one `p.t-meta`, then the privacy note as `button.row.pressable.privacy-open`
   with a one-line `.row-copy` reading "Privacy note" and no chevron. It sits in its own wrapper, so
   `.row:not(:only-child)` leaves an isolated row at radius 12. The same row is in `ProfileSheet`, so
   the note is reached the same way from both, with one written divergence: there it keeps
   `PRIVACY_SUBTITLE` as a second line, and here it does not, because the consent line directly above
   already says what leaves the phone and how to remove it.
6. **Done**, `button.btn.btn-wide.btn-coral.pressable.entry-done`: the screen's one filled accent.

24 between every one of modules 2 to 6, one rule with no exception; 8 from a heading to its content;
16 between the two fields. No new token, no new radius, no shadow and no `backdrop-filter`, because
the entry screen is not chrome and carries no glass.

**The screen must not scroll, and a render is the only check that counts.** Measured headless at
390×844 on 22 September, `.entry-in` is 608 of the 738 the body offers below the masthead on the
single-sailing branch and 634 on the multi-sailing branch (572 and 598 on a build with no server);
the "Set up your own sailing" row and, on the multi branch, the sailing Select add to it, and the
multi branch drops the Select's field label to stay off the scroll, its h1 being the label. Both
leave room to spare there. A real
iPhone's insets take about 49 of that: `.app-head` carries `--safe-t`, and the body's bottom padding
is `max(var(--s6), var(--safe-b))`. Past that the copy has to come down instead. Measure `.entry-in`
against the body, never the document height: `.entry` is `min-height: 100dvh`, so 844 of 844 is what
an empty screen reads too and proves nothing.

Nothing has left the phone when this renders, and nothing does until Done: `sync.ts` gates its whole
transport on `enteredCruise`. That is what makes the consent line true rather than a description of
something that already happened.

### Landing

Read: what this is, how to get it on my phone, what it costs. It is Entry's desktop twin, and it sits
here for that reason: those two are the screens a cold visitor meets. A laptop is the wrong instrument
for a one-handed phone logbook, so a desktop visitor is given the app on the phone in their pocket
rather than a screen asking for a name and a colour. It renders outside `Shell`, so it carries its own
ground and its own masthead and has no nav, and it renders in two places: the gate at `/`, immediately
above Entry's, and the route `/get`, mounted outside `Shell` as `/wrapped` is. `isDesktopVisitor()`
decides which branch paints, on `(min-width: 900px) and (hover: hover) and (pointer: fine)`: three
conditions together, because a phone in landscape can exceed 900px and a tablet with a trackpad
genuinely is a desktop visitor for this purpose.

Desktop branch, in rank order:

1. **Masthead** (chrome). The same component the entry screen carries, pinned to the top of the
   viewport rather than part of the centred block.
2. **Title and lead.** `h1.t-title`, then one `p.muted.t-body`: Entry's "what this is" sentence
   character for character, so the two screens a cold visitor can land on answer that question
   identically.
3. **The code**, the dominant element and the reason the screen exists. A `.section` holding
   `h2.t-h2` inside a `.section-head`, one `p.t-meta`, then the `.qr-plate` with a 200px `Qr`, then
   the address as `p.t-meta.tnum.landing-addr` beneath it. Sibling: the add sheet's plate. The value
   is `location.origin` plus the base, so it is always the address in front of the visitor; the line
   beneath is the display form of the same value, and it is real selectable text, so there is a route
   to the app whether the code draws or not. Nothing else on the screen is boxed.
4. **Add it to your home screen.** A `.section` holding the heading, then two static `.line` rows
   taking their single hairline from `base.css`, one per platform, then one `p.t-meta.landing-note`.
   Each row is `div.line > div.landing-step`, `.t-strong` then `.t-meta`; `.line` and not `.row`,
   because an instruction is not a control. Inside the installed app the rows and the line beneath
   become one `p.t-body`, "It is already on your home screen", and the heading stays, so the screen
   keeps its shape.
5. **The price slot**, one `p.t-meta`, rendered only when `PRICE_LINE` is set. It is `null` today, so
   the branch renders five modules and this position is reserved. It sits below the steps because
   price is the last thing a visitor needs and the first thing that would cheapen the screen if it
   led.
6. **The way on**, one `.quiet-action`. Its label is a prop, not a store read: the gate passes "Open
   it in this browser instead", `/get` passes "Open your passport".

Phone branch: module 3 is absent, because a code of the address the phone is already on tells it
nothing. Masthead, title and lead, the install steps, the price slot, the way on, which is four
rendered modules while the slot is empty.

The masthead is row 1 of the page grid and the centred block is row 2, with 32 above and below as
`.entry` has. Inside the block: 8 from the title to its lead; 32 above each of the two headed modules,
which comes from `.section`'s own margin and not from a grid gap, so the section rhythm is the app's
one rhythm; 8 from a `.section-head` to its content; 12 between the meta line, the plate and the
address; 12 from the install rows to the line beneath them; 24 above the price line and 24 above the
way on. Radius 20 on the plate, from `.panel`, and nothing else boxed; control height 44 on the way
on. No new token, no shadow and no `backdrop-filter`. The plate's `--on-accent` overrides `.panel`'s
film on source order, because a code has to read under a camera on any ground. There is no
`--coral-ink` anywhere on the screen: the budget is one filled control per screen and this screen has
none, because its primary action happens on a different device.

Fold, desktop, at **1280×800**: modules 1 to 3, the plate included. The install steps and the way on
may sit below it on a short window, and that is the intended shape rather than a defect: the code is
the reason the screen exists and the steps are what you read after you have scanned it. That is why
the plate is checked against the fold and not against a document height. 390×844 is not a viewport
this branch can be seen at, since `(min-width: 900px)` excludes it; it is rendered there only to
prove nothing overflows when it is squeezed. Fold, phone, at **390×844**: all four rendered modules,
nothing below the fold.

Nothing on this screen collects, sends or stores anything, so it carries no consent line and no
privacy row: the way on leads to Entry, which asks properly. It makes no network request either, so
there is no offline state to write and none may be added.

### Home

Read: what day is it, where am I, what do I do now. Home is the instrument's front panel, not a
summary; every module either answers one of those or leads to the screen that does. Nothing sits
above it: the greeting, when the guest has a name, is the screen's first line, and otherwise the
hero is.

1. **The sea hero** (the poster, kept): countdown or day chip top right, the percentage readout
   bottom left, and bottom right the one primary action on the app, **"Log a drink"**, a
   coral-tinted glass button floating on the water. It opens the search (Screens, Search) with the
   field focused inside the tap, so logging at a bar is two taps from cold. The sea is alive in two honest ways: **the sky follows
   the real clock** (dawn, day, golden hour, dusk, night palettes in the shader and the CSS
   fallback, so the app at breakfast and the app at midnight look like breakfast and midnight), and
   **the chips are refractive liquid glass**: inside the sea shader, the readout and countdown
   rectangles bend the water beneath them with a lensed edge and a specular, the one place in the
   app a GPU refraction earns its cost (the taste bar's "hero moment" exception). The HTML text sits
   on top; when WebGL is absent the chips fall back to the CSS glass and nothing is lost.
   A greeting sits above the hero as the screen's first line, only when the guest has a name:
   "Evening, Isabel" with the day or the countdown as its meta, so the screen says who and when
   before it says what.
2. **Today**, one row on the ground, three facts. Aboard, three numbers that move by the day:
   drinks today, day streak, bars visited. "Day 3 of 15" is not among them; the hero chip already
   says it. Before sailing there is no day, no streak and nothing logged, so the module is only the
   way to a first venue: with no venue it is one row, "Add your first venue", under "The ship"; with
   any venue it is absent and For you takes its place. The ship's own counts do not change between
   opens and do not say what to do now, and Ship holds them. Never a number the hero shows, and never
   a structural zero.
3. **For you**, a horizontal shelf of up to six drinks to try next, each an independently opened,
   swipe-snapped card (the one boxed thing in the content layer, earning its boundary as an
   interactive unit). It sits here, above Last bar, because "what should I drink next" is the
   forward question the guest opens Home to answer; Last bar answers the narrower "where am I". Each
   card names the drink and, in the accent, the honest basis for the pick: a crew member whose
   palate matches yours who loved it ("Sam matches your taste" / "Loved by Sam and Ravi", from
   `pickedForYou` over `recommendedForYou`), or the spirit you rate highest ("Because you love
   whiskey", three-plus of your own fives). The shelf renders only when there is a real personal
   basis, so it is absent for a fresh guest with no ratings and no crew: never a generic "you might
   like". At the foot of the section, after the shelf, one `button.row.pressable.shake-open` in its
   own wrapper, no chevron, `aria-haspopup="dialog"`, led by `IconShaker` in the `.row-lead` slot so
   it reads as the door it is rather than a heading, reading "Shake for a drink" on one line, which
   opens the Shake sheet; what the shaker does is that sheet's meta line, and the row does not repeat
   it (Copy). It borrows this heading and adds none, because this is the section that already exists
   to suggest drinks, and it is ink only: Log
   a drink keeps the screen's coral. When there is no shelf the section still renders, the heading
   and this one row, because for that guest the shaker is the most useful thing on the screen. With
   no catalogue at all there is nothing to shake and nothing to suggest, and the section goes.
4. **Last bar** (aboard): one row for the venue of the last drink logged today, with "12 of 44
   tried here" and the first untried drink there named; it opens that venue's sheet. With nothing
   logged today it is "Your top bar"; before sailing it is "Where to start", the biggest bar and
   its count. Never a guess from the clock: a wrong bar labelled as yours breaks "Honest".
5. **A new medal**, when one has been earned since the guest last looked: the struck coin (the
   `Coin`, turning once on entry, then still) with "New medal · Gin Explorer" and its hint,
   tapping to the badge sheet. It is the app's reward moment and the one place Home may be
   spectacular; it shows once per medal (a seen-set in the store) and then folds back into Up next.
6. **Up next**: the badge nearest to earned as a row with a 3px bar ("2 more gins for Gin
   Explorer") and, when there is a crew, one line per crew member who logged today, "Sam · 3 today,
   mostly Crooners · synced 20 min ago" (entries carry a date, not a time, so the venue is where
   most of today's drinks were, and the time is their passport's `exportedAt`, which is honest as
   "last synced"), opening Crew. Where the family is, as far as the data can say, without asking.
   There is no top drink row and no top bar row: both
   look back under a heading that says "Up next", Stats shows both, and Last bar's "Your top bar"
   already names the top bar when nothing is logged today. With no badge in reach and nobody logging
   today the section has nothing to say and does not render.
7. The Wrapped row, only when unlocked.

Fold: the greeting, the hero, and Today aboard or For you before sailing. The seed data is
pre-sailing, so both states are verified by rendering the aboard branch with the date pinned
(`?day=2026-10-05`, a QA override in `today()`). "Log a drink" is the only control with that
intent: the Drinks page's catalogue action is "Add a missing drink". It opens the search over Home,
and the field takes its focus inside the tap, so iOS raises the keyboard; it no longer routes to
Drinks, which iOS will not raise a keyboard for.

### Shake sheet

Read: what should I drink, decided for me. It sits here, straight after Home, because Home is the
only place it opens from. It is the app's one moment of theatre and it earns it twice over: the pick
is genuinely useful (untried, never one this sitting has already surfaced, weighted by what the guest
and their crew like), and it is silent and still until asked for. The theatre is inside a sheet, on
demand, and finite. Home stays an instrument.

1. **Title and meta.** `h2.t-title.sheet-title` "Shake", then one `p.sheet-meta`: "The shaker picks
   one you have not tried."
2. **The shaker** (`Shaker`), centred on a stage 300 by 275 that is one fixed size in every phase.
   It is the cobbler of Charles's photograph of 22 September, 198 tall and 79 wide: a grooved cap on
   a short neck, a domed strainer, the band where the strainer's skirt overlaps the body's rim, and a
   tall body tapering to its foot, at 9, 21, 7 and 63 per cent of the height. `--ink` stroke on
   `--cream`, and polished steel as a strip of light in `--glass-rim` with a narrow `--line`
   reflection beside it and `--line` down the far side; no engraving, which two judges read as a
   liquid level through the tin. No panel: the sheet is the container and a box around the only
   thing present is the fourth banned tell. It has no window, because a shaker has none. The prize
   is a glass drawn for the drink (`Glass`), the drink in `--line`, in one of nine families: a
   cocktail glass with an olive on a pick, a margarita glass with a wedge of lime, a wine glass, a
   flute with bubbles rising in it, a pint with its head, a cup on a saucer, a hurricane glass with a
   straw, a highball with ice and a straw, and a rocks glass with one big cube and a twist of peel.
   It is the same family the drink's row on Drinks leads with, chosen once by `glassFamily()` in
   `src/data/glass.ts` (the registry says how), because the category is too coarse to say it: a
   Mojito filed as "Signature" would rise in a martini glass and tell the guest something false
   before the card names it. It is about 58 wide and 65 tall on screen and hangs with its foot at
   least 18 clear of the neck. The shaker is the one dominant element.
3. **The answer**, empty until a reveal: the drink's name first, as `h3.t-h2`, in full and never
   clipped, because the one job of this moment is to name a drink and the glass carries no name of
   its own; then the venue and deck as `p.t-meta.tnum` ("THE MIX · Deck 17", one middle dot; a
   drink with no venue prints its category), then the reason as `p.t-body` ("Because you love gin",
   "Sam loved it") when the pick has one. A pick with nothing personal behind it gives no reason
   line: "One you have not tried" repeated the meta line above it on the same screen. Centred,
   because it is the caption of a centred object. It is rendered as the cap goes, in a slot whose
   height is held from the first frame, and its lines arrive in order as the glass lands (Motion
   above), closing up when there is no reason rather than leaving a gap.
4. **The one filled control**, `button.btn.btn-coral.btn-wide.shake-go`: "Shake", then "Shaking" as
   a disabled ghost for the 2.8 seconds of the shake and the opening, then "Go get it". Tapping it
   replaces this sheet with `DrinkSheet`, one `.sheet` at a time; closing that returns to the
   reveal, with the cap off and the glass hanging, not to Home.
5. **The quiet actions**, `.quiet-action`: "Shake again" on a reveal, fading in with the card's last
   line and holding its line before then, and the sound toggle always,
   "Shake quietly" when sound is on and "Shake with sound" when it is off, persisted in
   `spcc-shake-quiet`. The label states the action, not the state, as every other quiet action does.
   The two sit in a grid, so each spans the sheet and its label centres under the answer.

24 between modules 2 to 5, 12 between the two quiet actions (`.quiet-action`'s pair rule). Radius
12 on the button, none on the shaker, no glass anywhere on it: it sits in the content layer. No
pill, no dot, no rule, no emoji.

Sound is `startRattle` (Motion above, and the registry): synthesised, no asset, created inside the
press handler so iOS allows it, and silent when the guest chose quiet or reduced motion is set. The
held beat and the opening have sounds of their own, all laid on the same clock as the rattle: a low
knock on each of the two knocks from inside, the second harder, a cork as the cap goes and a thock
as the glass lands. Each knock also fires `haptic('tap')` from the sheet's own timer; the knocks and
their taps are silent under quiet and reduced motion alike. The landing
fires `haptic('success')` and no `Confirm` tick: the answer is on the screen, which is this
document's own test for when a confirmation is owed. An `aria-live="polite"` region says what the
card beneath the shaker says, as one sentence ("Try THE MIX's Red Stripe, Deck 17"), once, when the
card shows it.

**The sheet must not scroll after a reveal.** Measured headless at 390×844 on 22 September, with a
three-line card, the sheet is 709 tall of the 742 (88svh) it may take, and `.sheet-scroll`'s
scrollHeight equals its clientHeight, 688, so there are 33 to spare; the stage is 275 in every
phase, which is what bought them. Measure `.sheet-scroll`, and skip `.sr-only` if you walk its
children for the last one: the live region is the sheet's last child and measures nothing a guest
sees.

When every drink on the sailing has been tried the shake still runs, the reveal names the guest's
highest-rated drink, the reason reads "You have tried them all. Have another." and the button reads
"Go again". The catalogue is local, so there is no loading, offline or error state here and none is
to be added.

### Drinks

Read: find it, have I had it, log it. Modules: (1) search with the filter control beside it, one
row; (2) the count line; (3) the list, grouped under venue headings ("Good Spirits at Sea · Deck 7")
so the page has landmarks and the bar you are standing in is one scroll away. A row leads with the
glass the drink is served in (`GlassIcon`, 24px, `--ink-3`: Iconography), then name and stars on
the first line, one meta line (ingredients, one line, clamped), and a tried check at the right that
is a 44px target. Favourite, wishlist and the rest live in the sheet. The price becomes part of
the meta line ("$12"), not a pill; a drink with no published price shows none, and a row with
neither ingredients nor a price has no meta line at all. The category stays in the sheet's meta
line and the Type filter: within a venue group it is usually the same row after row, and the
ingredients need the room. Fold: search, count, the first heading and four rows.

The filter panel holds Status, Package (on a sailing that declares packages), the quick chips, then
Where, Spirit, Flavour and Type as folded groups. Where is the deck chips alone, and a deck no drink
is filed on is not drawn: a bar is found by typing its name (search matches it) or from its sheet
on Ship, and a chip per venue was a fourth route to one place and a wall of identical rounded boxes.
The panel carries no count of its own: the count line beneath it is the one count, and the panel's
head holds Clear all only when something is chosen.

With no catalogue at all (a sailing the guest set up and has not yet added a drink to), modules 1 and
2 go with module 3: a search over nothing, a filter over nothing and a count line reading "0 drinks"
are three controls with nothing behind them. What is left is the `.dempty` shape the screen already
has, one `p.t-body` and one primary inside `.dempty-acts`, and one button rather than the two the
filter-empty state shows, because there is no filter to drop. With a venue the button opens the add
sheet; with none it is a `Link` to `/ship`, because the venue form belongs to Ship and a second door
onto it from here would be a divergent sibling. This state is tested before the filter-empty one, or
an empty catalogue says "No drink matches that search" and offers a Reset with nothing to reset.

### Drink sheet

Title, one meta line ("Good Spirits at Sea · Deck 7 · Signature"), ingredients as body, the blurb as
meta, then the facts line (tier and price, then flavours; an unpublished price prints nothing, and a
price with no package tier is the price alone), and for a drink not on a published menu the one line
"Not on a published menu. Check at the bar." Then sweetness and strength as five ink dots each, with
no sentence beneath except "Alcohol free" at strength 0, since five empty rings cannot say none.
Then rating (stars, 44px each) with the crew average beside its label and "Recommended by" beneath,
then the toggles as one row of compact chips, on one line at 390px (Tried in mint when on;
Favourite, Wishlist, Recommend in ink when on), then the date once tried, then "Private notes" and
"Comment for your crew" as fields with no hints and no placeholders (the labels say who sees each),
then what the crew said as rows. Groups are separated by space, never a hairline. No eyebrow, no
coloured toggle boxes, no gradient meters. There is no "Order again" (Favourite already says "I would
have it again"; `restore.ts` still merges the field from old backups) and no "Also at" row (the
bar's group and its venue sheet list its other drinks).

A drink the guest added renders its title, meta line, whatever the guest typed (ingredients, price),
rating, Tried, Favourite, Wishlist, date and notes, and nothing else: `share.ts` never sends a custom
drink to the crew, so Recommend and the crew comment would promise sharing that does not happen, and
its sweetness and strength are defaults nobody measured.

### Search

Read: find it, tick it. What Log opens, from any screen and over it (`src/features/search/`); the
Drinks page keeps its own search, which is for browsing the catalogue with its filters. The screen
underneath stays mounted and hidden (`.view.is-covered`), so closing the search puts the guest back
where they were, scrolled where they were. The field is the dock's: Log, become the field
(Navigation); this is the page under it, with its own scroller and its own top bar.

1. **The large title**, "Log a drink", with no lead line.
2. **With nothing typed**: "Still to try at Crooners", the untried drinks on the menu of the bar the
   guest is in (prototype B's list), which is Home's Last bar: `currentBar()`, the venue of the last
   drink logged today, aboard only, one selector both screens read. Then "Your wishlist", untried,
   bar by bar, each run under the bar's name and deck as a meta line, because the wishlist spans bars
   and its rows do not say where they are; a drink already in the first list is left out of the
   second. With nothing logged today it is the wishlist alone; with neither list, one line, "Nothing
   on your wishlist yet."
3. **Typed**: the count line ("3 matches", "The first 60 of 140 matches", "Nothing on board matches
   that."), then the matches grouped under their bars as Drinks groups them ("Good Spirits at Sea ·
   Deck 7"), the bar with the best match first. They are found by Drinks' own matcher (`matchQuery`
   in `facets.ts`), names that start with what was typed come first, and sixty are drawn at most.

Every row is `DrinkCard`, by import. Its tick logs the drink and says so once, in a toast, "Logged
Mykonos Press", with Undo in the line; a row opens the drink sheet over the search. The reason a
list is there is said once, in its heading, never on every row: "Sam matches your taste" on three
rows running was a judged defect. The empty field's lists are taken as the search opens and then
held, so a drink ticked off "Still to try" keeps its row, ticked, under the thumb that ticked it,
and a tick at another bar does not swap the heading for that bar's list mid-search.

### Ship

Read: which bars, what is done, where next. A plain section per deck: heading "Deck 17", then one row
per venue: name, "n of m", and a thin ink progress bar 3px tall once a drink there is tried; a venue
with no drinks shows its name alone. The heading carries no count: completion by deck is Stats'
"Where you have been", and a shared list was counted once in the heading and twice in the rows
beneath it, so the heading contradicted its own rows. There is no lead line under the title; the
deck headings already read from the top down. Visited is a mint check after the name. The deck's own
label comes from `deckLabel()`, so a ship that calls a deck something other than its number says so
here, in Stats and in the filter panel alike. Fold: the top two decks.

A guest can add venues of their own, so the screen has two more states and one quiet door:

- **Populated**, one `button.row.pressable.ship-add` after the last deck, in Crew's "Set up a group"
  shape, one line, chevron and all, alone in a bare `.section` with no heading. It has no meta line:
  the guest has just scrolled past every venue, so the list already says what a venue is. It is the
  one rounded row on Ship and that is deliberate: `.row:not(:only-child)` squares the venue rows
  inside each deck section, and this row is not another venue. Ink only; the coral budget stays
  unspent.
- **Empty** (a sailing with no venues yet), where the action is the state, as on Badges: one
  `p.t-body`, one `p.t-meta` and a filled `GlassButton variant="primary".ship-add`. Two lines rather
  than Badges' one, because nothing else fills this screen; a filled control, as the You segments'
  `.empty-state` now also uses, because this is the only way to make the screen exist. The two never
  render together.
- **Change this sailing**, one `.quiet-action` at the foot, on a sailing the guest set up only. The
  sailing's name and dates are what this screen is about and changing them is rare, so it takes the
  registered shape for the quietest text action at a screen's foot and spends no colour. It is the
  only door onto the returning sailing sheet, which is where a sailing is renamed, re-dated or
  deleted.

### Venue sheet

Title, meta line (deck, kind, hours), blurb, the shared-list line ("Same list as THE MIX.") when the
venue pours another's list, "Edit this venue" as one row on a venue the guest added, the visited
switch as one row, the count line as text ("6 of 44 tried"), then the venue's drinks as the same rows
Drinks uses. A venue with no drinks, which only a guest's own venue can be, takes `.empty-state`:
"No drinks here yet." and one filled "Add a drink", which opens the add sheet preset to this venue in
place of this sheet (one sheet at a time), and closing it comes back here. Space separates the groups; there
is no hairline and no meter. The same number was in the text, the meter and the row behind the
sheet, and every drink below carries its own tried check.

### Crew (Social)

Read: who is with me, add someone. Modules: (1) heading "Your crew" with the profile control at the
right (dot, name, code); (2) the one coral button, "Add to your crew", full width; (3) "Sailing
with" rows, each counting what that person has tried ("8 tried"); (4) "Groups" rows with "Set up a
group" as a one-line row; (5) "Discover together" rows. There is no sixth module: its picks had no
personal basis, and Discover together above and the Shake sheet on Home already suggest untried
drinks with a reason. The name card, when shown, is a panel (a form with its own boundary) and the
only panel on the screen. Fold: 1 to 3.

**Add to your crew** is server-first: the backend can find a person and make the friendship mutual
in one call (`find_profiles` then `befriend`, which writes both edges), so the phone-to-phone routes
are the fallback, not the front door. (1) **Find them**, with no heading of its own (the sheet's meta
line and the field's label already say it): one field, "Their name or code", with one idle line
beneath it, "Their code is at the top of their Crew page.", the one fact nothing else on the sheet
gives, searching the server as you type (two characters on, whole-word prefixes, eight results,
never yourself):
each match is a `.row` with their dot, name and code, and a 44px "Add" at the right (someone
already held reads "In your crew" with no Add); Add lands on the `Confirm` tick and the row joins
"Sailing with", holding the row-highlight tint for about four seconds so the name on the tick can
be found in the list. A full code pasted or typed matches exactly.
Offline, the field says so ("No connection. Send your link instead.") and the link route takes over.
(2) **Or send your link**, a secondary button opening the native share sheet, which is also the
nearby route (AirDrop on iPhone, Nearby Share on Android; the web has no contact-tap of its own); its
meta line says so ("Beside them? AirDrop or Nearby Share it."). (3) One row of two quiet controls,
"Scan their code" and "Show my code" (the QR and the code with Copy unfold inline, the code with no
visible label, because the toggle above it now reads "Hide my code"). (4) "Join a group with a
code", a `.quiet-action` folded like the paste path and 12 above it, unfolding in place to the
field, labelled "Invite code or link" with no placeholder, and the "Join group" button; the field
takes focus as it unfolds, as the paste path's does, because the tap that unfolded it unmounted the
control that held focus: most joins arrive as a tapped `/join` link, so the field is
the rare route. Every success, on either phone, ends in the `Confirm` tick; the other side gets a
toast "Sam added you" on the next pull. The privacy trade is stated in `0003_find_profiles.sql`:
anyone in the app can find anyone who has set a name, and nothing beyond name, colour and code is
returned.

A tapped link (`/add`) asks for the guest's name **before** it befriends, exactly as `/join` does
(the name card with a lead naming the sender), because a befriend without a name publishes
"A friend" to the sender's roster; the sixteen "A friend" rows on the live project are this bug.
The "added you" toast fires only for a direct friend the server introduced (not one this phone
added itself, which still carries `needsEdge`) and never on a pull whose previous roster was empty
(first sync, a restore, after delete-my-data), where everyone is new.

### You

A segmented control (Stats · Badges · Log) under the title, then the segment. Stats answers three
questions under three headings: "Where you have been" (completion by deck as ink bars with no track,
most visited bars as a ranked list), "What you drink" (the top five categories and the top five
spirits as ranked lists with counts, no donut), "Best and worst" (highest rated, lowest rated, best
rated bars as rows). "Across the voyage" survives only with labelled axes at 12px and a title that
names the question ("Drinks logged per day"). Badges: earned medals as a row of discs with names
beneath, the heading carrying "6 of 18" at the right and nothing while none is earned, then "Close"
as one-line rows (the name, then "58 of 100" and a thin progress bar side by side at the right; a
percentage badge reads "27% of 50%"; the hint is the badge sheet's meta line), then "Locked" as plain
rows with the hint, which is the only statement there of what earns the badge. No card per badge.
Log: a section per day, heading "Day 1 · Sat 3 Oct" with the count at the right, rows with
hairlines, each row the drink and its rating on one line (the bar is the drink sheet's meta line, one
tap away). Empty, each of the three segments is the same `.empty-state`: one short line and a filled
"Log a drink", which opens the search.

### Wrapped

Experience mode; the story format stays. Headings roman, no uppercase tracked labels (the cover's
"A voyage in cocktails" becomes a meta line beneath the title), the certificate keeps its inner rule
because it is a certificate, "Save my Wrapped" is the one coral button. Backdrop drift stays as this
mode's one ambient motion and stops under reduced motion.

The medals slide shows the coins won, up to six, highest tier first, three to a row under the count:
the one slide with a disc on it, because Charles asked on 23 September 2026 for the medals to be good
looking and prominent. With a crew, the crew slide is followed by up to four more, each made only when
the synced passports fill it honestly (`src/features/wrapped/crewCards.ts`, tested): the crew's
favourite (the highest average from three raters, or two in a crew of two, four stars or over), the
one that split you (your rating and one friend's two stars or more apart, the friend named), your
find (loved by you, had by nobody else), and next time (the crew's pick you have not had, the same
ranking as Home's Picked for you, with the first thing one of them wrote about it). Insight, never a
ranking: nobody is placed above anybody. The story root carries `wr-<kind>` as its modifier class, so
a card's inner classes must not reuse a kind's name (`.wr-medals` once capped the whole story at
240px; the coin row is `.wr-coins`).

## Verification

A screen is done when a render in Brave at 390×844 from the running dev server (`?seed&nosync`)
shows the modules in rank order with the fold respected, in each room (`?hour=13`, `?hour=19` and
`?hour=23`), and a scan of its CSS finds: no font-size below 12px and none off the `--f-*` scale; no
spacing literal off the `--s*` scale; no radius off the `--r-*` scale; no `box-shadow` that is not a
token; no `backdrop-filter` outside the glass engine and the chrome that owns a surface; no
`text-transform: uppercase` with tracking; no easing that is not a token, outside the shaker's
written exceptions (Motion); every colour a token. The scan reads its scales from `tokens.css`, so
the two cannot drift apart.

**The render is Brave's, not headless Chrome's.** Charles, 22 September 2026: "use brave to verify
stuff not headless chrome it nukes performance" (`OPERATING_RULES.md`, "Verify in Brave, not headless
Chrome"). Open your own tab through the browser extension on the dev server, loaded with
`?seed&nosync`, then write an iframe wrapper into that tab on the same origin, 390 by 844, pointing at
the route with `?seed&nosync`: the frame is a true phone viewport, and its layout can be measured
from outside it. Take each screenshot twice, because the automation tab only renders when one is
taken, and read overflow from the frame's `scrollWidth` rather than by eye. Always pass `nosync`:
the dev server's `.env` carries the live project's keys, so a load without it signs a throwaway
anonymous user in. The room follows the clock, not a colour-scheme preference (Colour), so a
browser's forced dark mode and the Dark Reader extension in Brave leave it as a phone draws it; pin the
room with `?hour=`. Brave's content blocking hides elements
whose class names look like social-media widgets: on 23 September 2026 it hid `.social-head`, the
Crew heading and the only door onto Your details, which is why Crew's classes are `crew-*`. Keep
class names clear of social, share, ad, banner and promo, and treat a module missing from a Brave
render as a possible block before a bug. A timed sequence does not advance between the extension's
calls, so an animated phase (a sheet's wave, the shake) is judged at its end state, never watched.
The method and Brave's other quirks are in the visual-verify skill
(`C:\Users\Charles\.claude\skills\visual-verify\SKILL.md`).

`tools/qa/scan.mjs` is the mechanical check, and `npm run design:check` is the same scan as a hard
gate, run in CI before every build. Neither opens a browser, and nor do `npm test`, `npm run lint` or
`npx tsc`, so they run at any time. A genuine exception goes in `tools/qa/design-allow.txt` with its
reason, never into the scanner.

The headless tools in `tools/qa/` (see its README) are kept, and run only when Charles asks for a
headless run: `shot.mjs` renders one screen or sheet, `shots.mjs` sweeps them all, `film.mjs` films
an interaction as a contact sheet and a flipbook (how the shaker's timing is judged frame by
frame), and `gestures.mjs` drives the sheet's gesture contract with real touch events and asserts it;
`shake-live.mjs`, `first-open.mjs` and `update.mjs` assert the shaker's reveal and return, the
first-open sync gate and the deploy reload.

## Working on this design

This section exists because the app once drifted into the default bundle (see `DESIGN-AUDIT.md`)
and because features built in isolation, each reaching for its own container, label style and
colour, are how that happens again. Read it before any change that renders.

### The order of work

1. **Read before you build.** This document; `DESIGN-AUDIT.md` (the thirteen faults, so you recognise
   them when they come back); the section under Screens for the screen you are on; the registry
   below. Then read the screen's files and its nearest neighbour (the screen that already does the
   same job: a list, a sheet, a section head). Grep the codebase for the behaviour and the classes
   you are about to write. Most "new" is a sibling of something that exists.
2. **Place it before you draw it.** For a new feature or module, write its five-second read, which
   screen it belongs on and where it sits in that screen's rank order, and what it displaces or
   merges with. A feature is not isolated: it reinforces or dilutes what is already on the screen.
   If it needs a number the hero already shows, or one another tab already covers, it does not show
   the number again (Copy). If it needs a state colour, it uses the one that already means that
   state.
3. **Fit the form, then diverge for a reason.** Compose from the registry. A list is `.row`s with
   hairlines under a `.section-head`; a sheet is `Sheet` with a title and a `.sheet-meta` line; a
   control is one of `ui/`. Copy how the neighbouring screen does the same job. Depart from it only
   with a one-line reason written in the CSS comment; if you cannot write the reason, do not depart.
4. **Mint a primitive properly or not at all.** If the pattern genuinely does not exist: build it
   once in `src/styles/base.css` or `src/ui/`, add it to the registry below in the same change, and
   sweep every existing sibling to use it (grep finds them). A second, slightly different version of
   an existing primitive is the failure this process is for.
5. **Verify with a render, not by reasoning about the CSS.** `npm run dev`, then render the screen
   and each sheet it opens in Brave at 390×844, as Verification says: settled, and scrolled through
   the frame for the whole page. Then `tools/qa/scan.mjs` on the files you touched, `npm run
   design:check`, `npx tsc -p tsconfig.app.json --noEmit`. Look at the screenshots honestly: rank
   order, fold, boxes, caps, wrapping, contrast. `shot.mjs` and the other headless tools run only
   when Charles asks for a headless run.
6. **Keep this document true.** A rule that changes changes here first, with the reason, then in the
   code. A screen section that no longer describes the screen is a bug.

### The registry: what exists, where it lives, the rule

| Primitive | Home | Rule |
| --- | --- | --- |
| Tokens (`--ink*`, `--line*`, `--press`, `--well`, `--plate*`, `--track`, `--fill`, `--coral*`, `--mint*`, `--star`, `--gold*`, `--lamp`, `--amber`, `--focus`, `--fam-*`, `--sea-ink`, `--room-*`, `--pool-*`, `--glass-*`, `--lens-*`, `--sheet-film*`, `--bead*`, `--on-bead`, `--bar-film`, `--s1..6`, `--r-*`, `--f-*`, `--e-out`, `--e-spring`, `--e-drawer`, `--e-drift`, `--e-shake`, `--t-*`, `--bar-h`, `--bar-b`) | `src/styles/tokens.css` | every colour, space, radius, size and easing is a token; a literal in feature CSS is a defect. Everything that differs by room is defined three times, on `[data-room="day\|evening\|night"]`, with night also the `:root` default; a feature file never branches on the room. The one written exception: the shaker's computed keyframes carry `--e-out`'s and `--e-shake`'s values written in, read from this file by `keyframes.mjs`, because a `var()` in a keyframe's timing function does not resolve; `design-allow.txt` carries both with that reason |
| Retiring token aliases: `--cream`, `--wash-*`, `--panel-solid`, `--glass-film-sheet`, `--glass-film-chip`, `--glass-live-film`, `--glass-film-light`, `--glass-highlight-film`, `--glass-highlight`, `--glass-border`, `--glass-fallback`, `--glass-blur-strong`, `--glass-blur-sm`, `--coral-film`, `--coral-film-blur`, `--mint-film-blur`, `--coral-deep`, `--ink-line`, `--lilac`, `--aqua`, `--fruit-*`, `--r-xs` to `--r-xl`, `--r-pill`, `--s7`, `--sh-1`, `--sh-2`, `--f-hero`, `--e-io`, `--spring`, `--spring-soft`, `--t-spring`, `--nav-h` | `src/styles/tokens.css` | kept only so unconverted CSS lands in the room rather than on cream: each resolves to the room's value. A screen builder moves its uses to the room tokens; the integrator deletes the alias once nothing reads it. `--ship-deck` is new and not retiring: the liner's white deck is paint, and `sea.css` should read it rather than `--cream` |
| The room: `roomFor()`, `msToNextRoom()`, `applyRoom()`, `startRoom()`, `.room`, `.room-light`, `.pool`, `.room-foot` | `src/app/room.ts`, `base.css`, `src/app/shell.css`, the inline script in `index.html` | the light by the clock (Material). `roomFor()` is over `dayPart()`, and the inline script repeats its boundaries (7, 17, 21) because it runs before any module: change them together. `Shell` mounts the layer and the foot; the pools drift only while the guest is here. `.ground` is the same room painted once and still, retiring: Entry and Landing still render it, and move to the layer |
| `.glass`, `.glass-sm`, `.glass-calm`, `.glass-tint`, `.spec`, `.glass-off` | `base.css` | the glass engine, prototype C's recipe with A's graded lens (Material). A surface tunes it through `--film`, `--rim`, `--glass-*`, `--lens-*` and `--solid` on itself, never with its own `backdrop-filter`; `.glass-off` on a covered surface or its ancestor drops the filters, for the four-surface budget |
| `.press`, `.pressable` | `base.css` | glass under a thumb swells to 1.04 and settles with one small overshoot (Motion's written exception); a content control gives to .97. Both on `scale` |
| Type roles `.t-display .t-title .t-h2 .t-body .t-strong .t-meta .t-micro .eyebrow` | `src/styles/base.css` | never a local `font-size`; `.eyebrow` is a sentence-case label, not caps; `.t-micro` is the 12px floor and is retiring as a text role, since only the tab labels sit on it |
| `.section`, `.section-head` | `base.css` | a section is a plain `h2.t-h2`, 32px above, 8px to its content, count or meta at the right |
| `.page`, `.page-act` | `src/app/shell.css` | a routed screen's wrapper: `.page > h1` sets 16 under the screen's title, and nothing sits between the title and the first module, since no screen has a lead line. `.page-act` is the one button under an invite route's line, 16 below it, in place of an inline margin. The safe-area inset is on `.view`, because no masthead sits above the tabs |
| `.row` (tappable), `.line` (static), `.row-copy` | `base.css` | every list is rows with hairlines on the ground; never a box per item |
| `.panel` | `base.css` | the one container, a quiet film on the room for a bounded interactive module only; never nested |
| `.qr-plate` | `base.css` | the white plate under any `Qr`, because a code has to read under a camera whatever the ground is: the add sheet, the group sheet and the landing. It hides itself when empty, which is how `Qr` returning null for a value it cannot encode is caught at every call site at once |
| Retiring: `.glass-live`, `.glass-edge`, `.glass-sm` on old markup, `.glass-coral`, `.glass-mint` | `base.css` | aliases of the glass engine kept so unconverted markup lands on it: `.glass-live` is `.glass`, `.glass-edge` does nothing (the lens is the edge), `.glass-coral` and `.glass-mint` are tinted films. Still used by Home's sea chips (the dock is on `.glass` and `.glass-tint`); the Home builder moves to `.glass`, `.glass-sm`, `.glass-calm` and `.glass-tint`, and the integrator deletes the aliases |
| `Confirm`, `haptic()` | `src/ui/Confirm.tsx`, `src/ui/haptic.ts` | the one success confirmation (a mint glass disc with the tick, the label on its own glass plate, a haptic); silent where the result is already visible. It fades on the glass's own layers, never on an ancestor, so the glass stays glass as it goes |
| `Toast`, `useToast()` | `src/ui/Toast.tsx`, `toast.css` | a glass pill at the top of the screen (prototype C), clear of the thumb and the tab bar, sliding down on the drawer curve and back up on transform alone; its action (Undo) sits in the line, in the lamp's colour |
| `GlassButton` (`.gbtn-*`); retiring `.btn .btn-coral .btn-mint .btn-wide .mini` | `src/ui/GlassButton.tsx`, `button.css`, `base.css` | 44px and round-ended, in the room's plates; `lg` is C's 52px wide button at body size. One filled coral control per screen, and on a screen that shows the Log button that control is Log. A disabled control drops its fill to a ghost (transparent, hairline, `--ink-2`) so it never reads as an active one; the fill, the edge and the label colour change on one transition. The `.btn` family in `base.css` is kept as an alias in the same look while the screens move to `GlassButton` |
| `.quiet-action` | `base.css` | the quietest text action on a screen: a block, 44px of target, meta size at weight 600 in `--ink-2`, underlined, 24 above. Swept from `.friends-quiet`; the join and paste paths on the add sheet, the guest line on Your details, the Shake sheet's pair, the landing's way on and Ship's "Change this sailing". Two in a row sit 12 apart, not 24, by one rule here (`.quiet-action + .quiet-action`), because they are one group of rare routes; one that follows anything else keeps its own 24. A screen that sets the pair's spacing locally is the divergence this rule replaced |
| `.tag`, `.mini` | `base.css` | small outline tags inside a meta line; compact 36px secondary control |
| `Sheet` (`height`, `wave`) + `.sheet-meta` | `src/ui/Sheet.tsx`, `sheet.css` | title then one meta line, which carries the one fact the controls do not show (Copy); no eyebrow. Two heights (Sheets): large by default, `height="medium"` for a sheet to look at; the SheetWave is its opening when opened by a tap |
| The dock: `Nav`, `.dock`, `.tabbar`, `.droplet`, `.logbtn`, `.logfield`, `.tab-return`; `TABS`, `tabOf()` | `src/app/Nav.tsx`, `nav.css`, `src/app/tabs.ts` | the capsule, the droplet and Log (Navigation). The morph moves clip-path on the filtered layers and opacity, never width; the droplet is `--bead` on transform with A's per-segment run. `TABS` is the one list of tabs, read by the dock and by `Shell` |
| `TopBar`, `useScreenTitle()` | `src/app/TopBar.tsx`, `src/app/screenTitle.ts`, `shell.css` | the scroll edge a screen's large title folds into past 46px (Navigation). A screen names it with `useScreenTitle`, or it takes the tab's name; the search mounts its own on its own scroller |
| `.screen`, `.view.is-covered` | `src/app/shell.css` | a screen's 240ms fade and 10px rise, keyed by tab in `Shell`; the view hidden, never unmounted, under the search |
| `SearchOverlay`, `useLogSearch`, `openLog()`, `registerLogField()` | `src/features/search/` | the search Log opens (Screens, Search). Anything that means "log a drink" calls `openLog()`, which focuses the dock's field inside the tap and then opens the overlay; never a route to Drinks |
| `emptyLists()`, `rankMatches()`, `byVenue()` | `src/features/search/lists.ts` | what the search shows, pure over plain shapes and tested in `lists.test.ts` |
| `currentBar()` | `src/state/stats.ts` | the bar the guest is in: aboard, the venue of the last drink logged today; otherwise none. Home's Last bar and the search's "Still to try at" both read it, so they cannot name two bars |
| `Field`, `SearchField`, `Select`, `Switch`, `Segmented`, `Chip`, `FriendDot` | `src/ui/` | the controls, in the room's tokens (a field is a well, a selected segment a plate, a chip that is on the room's fill, a switch mint when on); restyle them there, never locally |
| Icons (`Icon.tsx`: `IconStar`, `IconCheck`, `IconChevron`, ...) | `src/ui/Icon.tsx` | the only icon system; no glyph characters, no emoji; add to the set, do not draw inline |
| `GlassIcon` (`IconGlassCocktail` and the other eight), `IconShaker`, `--fam-*`, `.gicon`, `.gicon-halo` | `src/ui/Icon.tsx`, `tokens.css`, `base.css` | the glass a drink is served in, one per family of `src/data/glass.ts`, on the icon grid with both sides of every bowl drawn. `GlassIcon` picks by family and draws it as a lit line in the family's hue over a halo of the same path (Iconography); it renders a `span.gicon` round two drawings. The shaker's prize is the same families drawn large (`Glass`) |
| `.row-lead` | `base.css` | a row's leading glyph: the glass on every row that names a drink (`DrinkCard`, Log, Stats' rated rows, Crew's Discover together), in its family's hue, and `IconShaker` on Home's shake row in `--ink-3`. Never a state colour. A new row that names a drink takes it |
| `.sr-only` | `base.css` | visually hidden, still announced |
| `.empty-state` | `base.css` | an empty list: one short `p.t-body` and the one filled `.btn.btn-coral` that fills it, flush to the leading edge, 16 apart. Stats, Badges and Log use it (ruling 9 of the 22 September declutter, which retired `.stats-empty` and `.badge-empty-action`); a new empty list on another screen reuses it |
| `.meter` | `base.css` | the 3px measure beside a count out of a total (a Ship venue row once something there is tried, Home's nearest-badge row); Stats' 6px deck bars and the badge rows keep their own shapes. Never an empty track: with nothing to fill it, it is not drawn |
| `dayPart()`, `greetingWord()` | `src/state/stats.ts` | the six parts of the day and the greeting word; the sea's sky palette, Home's greeting and the room (`roomFor()`) all key off them, never off their own boundaries |
| `nowHour()`, `today()`, `qaFirstOpen()`, `qaLanding()`, `isDesktopVisitor()` | `src/data/model.ts` | the clock, with `?hour=` and `?day=` QA overrides; `?entry` forces the first-open screen over any store, and does not gate sync; `?landing=desktop\|phone` pins the landing's branch, and `desktop` also forces the root gate open, since `?seed` has always migrated the store to entered; `isDesktopVisitor()` is the width-plus-pointer test that chooses the landing's branch, kept here so `Landing.tsx` only exports its component |
| `ingredientsOf()` | `src/data/model.ts` | what a drink's ingredients line shows. A drink the guest added before 22 September carries "Ingredients not recorded", which the add sheet used to write in place of nothing; it reads as empty, as a drink added now is. Whatever prints ingredients (the list row, the drink sheet) reads them through it, never `d.ingredients` directly |
| `badgeCount()` | `src/data/badges.ts` | a badge's progress in words: "58 of 100", or "27% of 50%" for a badge marked `percent` (Cocktail Master and the ship's Champion), because everywhere else "n of m" counts drinks. The Close rows, the badge sheet and the labels on Home's nearest-badge row all use it |
| `Masthead` | `src/app/Masthead.tsx` | the app's name above the entry screen and the landing, the two screens a cold visitor meets. Chrome: never part of a screen's rank order. `Shell` does not render it |
| `Landing` | `src/features/landing/Landing.tsx` | the desktop install path: what this is, the code of the live address, the two steps to a home screen, and the price slot when there is one. Which branch renders is decided by `isDesktopVisitor()`, which lives in `src/data/model.ts` beside the QA overrides (so this file only exports its component) and is the only reader of the media query; the way on's label is a prop, because the caller knows which path it is on |
| `NameFields` | `src/features/social/NameFields.tsx` | the name and colour pair wherever it is asked for (`NameCard`, the entry screen). It imports `friends/friends.css`, which owns `.f-field input`, `.fpick` and `.fpick-dot`. `ProfileSheet` keeps its own copy on purpose: it writes to the store on every keystroke with no draft, so it has nothing to hand `draft` and `onDraft`. A fourth site gets an uncontrolled mode on `NameFields`, never a fourth copy |
| `PrivacySheet`, `PRIVACY_SUBTITLE`, `GUEST_HONESTY` | `src/features/privacy/PrivacySheet.tsx` | the privacy note, one text, opened by the same `.privacy-open` row from the entry screen and from Your details; `GUEST_HONESTY` is the one wording of what a guest stands to lose |
| `seenMedals`, `markMedalsSeen()` | `src/state/store.ts` (persist v8) | which badges' "new medal" moment Home has shown; seeded on upgrade with what was already earned |
| `SeaHero` (`level`, `hour`, `chips`) | `src/features/home/SeaHero.tsx` | the sea; the sky follows `hour`, the shader lenses the water under the `chips` rectangles, and the liner rides the swell (Motion): `swell()` in the script is the shader's function term for term, so change one and change both. The CSS bob in `sea.css` is the fallback where there is no shader |
| `pickedForYou()` | `src/state/social.ts` | the "For you" shelf: honest picks (taste-matched crew, or your top spirit); empty when there is no personal basis |
| `Shaker` | `src/features/shake/Shaker.tsx` | the cobbler shaker, drawn on an 88 by 220 grid in `Icon.tsx`'s idiom, shown at 0.9 on a 300 by 275 stage at the hero stroke (Iconography). It is not in the icon set because it is not an icon: it is the one object on its screen, and an icon there would be a 24px glyph blown up. One SVG, painted back to front in one rig: the burst, the prize glass inside the tin, the tin over it, the cap. The file exports only the component (and its types), so it keeps fast refresh; its timings are `SHAKER`. It has no window, and adding one back would be drawing a shaker that does not exist |
| `SHAKER` | `src/features/shake/timing.ts` | the shaker's timings (the shake, the knocks, the pop, the landing, the reverse), in a module of their own beside the drawing, because a component file that exports anything else loses fast refresh. The sheet runs its phases on them and hands the rattle its times, and `Shaker` sets the CSS durations from them, so a timing changes in one place |
| `keyframes.mjs` | `src/features/shake/keyframes.mjs` | writes the computed keyframes at the foot of `shake.css` (the shake and the held beat as one timeline, and the cap's flight and the glass's rise and sink sampled every 20ms) from `SHAKER` and its own tables, and prints whether the cap clears the glass and whether anything leaves the top of the stage. Edit `SHAKER` in `timing.ts` or a table here, then run `node src/features/shake/keyframes.mjs`; never edit the computed block by hand. Node only, not imported by the app; it refuses to run on a shake other than 1800ms, which its stroke table is drawn against |
| `Glass` | `src/features/shake/Glass.tsx` | the prize: one glass per family of drink (cocktail, margarita, wine, flute, pint, cup, hurricane, highball, rocks) on a 64 by 72 box, the drink in `--line` and the outline painted three times so the drink never crosses the stroke. `data-glass` names the family for the QA probes. Never `IconDrinks`, which draws one side of a glass |
| `GlassFamily`, `glassFamily()`, `ruleFamily()`, `GLASS_FAMILIES`, `GLASS_NAME` | `src/data/glass.ts` | which of the nine glasses a drink is served in, the one place that is decided: the drink row's icon and the shaker's prize both read it. A drink on the published catalogue takes its glass from `GLASS_BY_DRINK`; a drink the guest added (it carries a `cruise`), even one sharing a published name, takes `ruleFamily()`: its name first (a Mojito, a Mule or a Tonic is a highball, a Paloma a margarita glass, a Colada a hurricane, a Negroni or an Old Fashioned a rocks glass, Champagne or a Bellini a flute), then whether it is frozen, then its category, and the cocktail glass for the rest. The rules are pure and tested in `glass.test.ts` |
| `GLASS_BY_DRINK` | `src/data/glassByDrink.ts` | generated, never edited: the published catalogue's glass for every drink, keyed by name, written by `tools/glass-classify.mjs`. Wines and beers are decided in code there (sparkling wine and Champagne a flute); each cocktail was put to Jev (TypeSafe, `jev-1.13.0`) as one choice among the nine glasses over its name, category, spirits, ingredients, flavours, frozen flag and menu note. A person's rulings, where Jev was unsure or wrong, live in `tools/glass-classify.overrides.json` and are applied last; each answer's probability is in `tools/glass-classify.report.json`. A changed glass is a ruling in that file, not an edit here; it takes effect when the script next runs, which asks Jev again |
| `ShakeSheet` | `src/features/shake/ShakeSheet.tsx` | the Shake sheet and its five phases, opened by `.shake-open` on Home and from nowhere else, timed by `SHAKER`. The card's lines carry their own start as `--at`, so a card without a reason closes up. It returns `DrinkSheet` on "Go get it" rather than stacking one, the same replacement `ProfileSheet` and `VenueSheet` use, and it comes back from it as a fresh mount that `still` holds at the reveal (Sheets, Coming back) |
| `shake()` | `src/features/shake/pick.ts` | what the shaker surfaces: untried only, never one of this sitting's last six, weight 4 for a drink the "For you" shelf already vouches for, 2 for the guest's top spirit, 1 for the rest, each weight carrying the line that explains it. Pure, with `random` injected, tested in `pick.test.ts` |
| `startRattle()` | `src/features/shake/rattle.ts` | the dice in the tin: WebAudio, synthesised, no asset, the whole schedule laid down in one pass at press time, with a low knock at each knock time the sheet passes it from `SHAKER.knocks`. `reveal()` carries the opening, a cork at the cap and the thock `landMs` later as the glass lands, laid down against the same clock rather than on a timer. A silent no-op when the guest chose quiet, under reduced motion, or where there is no `AudioContext` |
| `haptic('shake')` | `src/ui/haptic.ts` | the third pattern, a rising series mirroring the rattle's acceleration. Its first pulse is the press tap, so the press fires this one and not both. The two knocks from inside are `haptic('tap')`, fired from the sheet's own timer and never under quiet or reduced motion |
| `DrinkCard` | `src/features/drinks/DrinkCard.tsx` | the drink row everywhere a drink is listed (Drinks, venue sheet, the search): the glass, then name and stars, one meta line, the tried check. `onTried` hears the check, for a caller that says more than the check does (the search's Undo toast) |
| `Coin` (`badge`, `state`, `progress`, `size`, `turn`, `flip`) | `src/features/badges/Coin.tsx`, `coin.css` | the one medal, everywhere a medal appears (Material, The medals). `state` is `earned`, `reach` or `locked`; `progress` (0 to 1) fills the amber ring round a coin in reach; `size` is the outer box in px; `turn` is Home's one turn on entry; `flip` makes the large coin in the medal sheet a button that turns over to its reverse. A screen sizes it by the prop, never by overriding its inner elements |
| `earnedOn()` | `src/data/earnedOn.ts` | the day a badge was earned: the guest's tried entries and check-ins replayed in date order through the caller's stat computation (`(p) => computeStats(drinks, p).badgeStat`), the first day the test passes. Null when not earned, or when only an undated entry earns it, so the sheet never names a day the record does not hold. Beside `badges.ts`, not in it, because `badges.ts` reads `SHIP` at import and cannot load under `node --test`; tested in `earnedOn.test.ts` |
| `SeaHero`, `SheetWave`, the hero count-up | `src/features/home/`, `src/ui/SheetWave.tsx` | three of the five authored motions (Motion above; the new-medal coin and the shaker are the other two); do not add a sixth without amending Motion |
| `You` | `src/features/you/You.tsx` | Stats, Badges and Log render inside it; they carry no page wrapper of their own |
| `Sailing`, `allSailings()`, `venuesFor()` | `src/data/sailings.ts` | the sailings a guest sets up and every venue they add, in `spcc-sailings` beside `spcc-cruise`. It holds no drinks, entries or visits, so removing a sailing or a venue is two calls, the store's `forgetSailing()` or `forgetVenue()` first. The catalogue is resolved at module load, so a change to it reloads the page, once, from the sheet's own close handler and only when something was saved |
| `VenueForm` | `src/features/ship/VenueForm.tsx` | the add-and-edit sheet for a venue, and `SailingSheet` (`src/features/cruise/`) its twin for a sailing. Both are `AddSheet`'s skeleton: `Sheet`, title, one `.sheet-meta` line, the `ui/` fields, one block primary. Every inline error is the `Field` primitive's own `error` prop, never a hand-written meta line; a remove or delete is a `ConfirmButton` below a hairline, as `ProfileSheet` places delete-my-data |
| `Fault`, `.fault` | `src/main.tsx`, `base.css` | the error boundary around the app and the one screen it shows: an `.empty-state` held in the middle of the room over a `.ground`, `h1.t-title` "Something went wrong." and a primary `GlassButton` "Reload", nothing else, no stack trace. A failed lazy chunk reloads the page once instead (a sessionStorage flag stops a loop). The only renderer of `.fault` |
| The recovery code: `useRecoveryCode()`, `claimPassport()`, `startAgain()`, `useSyncStore()` `claim` and `status` (`'moved'`, `'local'`) | `src/state/sync.ts`, with the secret in `src/state/recovery.ts` (`formatSecret()`, `normaliseSecret()`, `isSecret()`) | what the "Save your passport" section and "Bring back a passport" render (their copy is in `docs/specs/2026-09-23-recovery-and-hardening.md`, section 1). The code shows only when `useRecoveryCode()` returns one, grouped as `K7QM-3XPA-9RTC-W2HD-6NBF`; format a typed code with `formatSecret()`, never locally. Each `claim` state has one line: `wrong` "That code does not match a passport.", `offline` "No connection. Try again with a signal.", `done` the `Confirm` tick "Passport back"; `status` `'moved'` says "This passport moved to another phone or app. Bring it back with your recovery code, or start again." |
| `googleSignInEnabled` | `src/state/backend.ts` | false: the "Keep it with Google" block renders only when it is true. The Google paths stay in the code, unreachable |
| Seed data | `index.html` (`?seed`) | how every screen is populated for a render |

Retired by the 22 September declutter, and not to be rebuilt: `.page-lead` (a lead line under a
screen's title; Ship had the only one), `.center` and `.card` (the box round the invite route's
line, the fourth banned tell), and the nav's sliding indicator plate (`.nav-lens`, a pill on a flat
bar; the droplet that replaced it on 23 September is a lens in a glass one, for the reason written in
Navigation). `.stats-empty` and
`.badge-empty-action` went into `.empty-state`, and the add sheet's and the Shake sheet's own
spacing for two quiet actions went into `.quiet-action`'s pair rule.
`Medallion` (the three.js coin, with `emblems.ts`, `three`, `@react-three/fiber`, `@react-three/drei`
and `@types/three`) and `MedalDisc` (the flat ink disc of the cream system) were retired by the
night bar build on 23 September 2026: `Coin` replaces both, in SVG, with no WebGL context to load.
