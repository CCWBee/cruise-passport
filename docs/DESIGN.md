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
| Shadow | sheet only (`--sh-sheet`); nav has a top hairline; content has none |

Rule for containers: **one level.** Content sits on the ground as headings, rows and hairlines. A
`.panel` exists only for a discrete interactive module with its own boundary (a form, a QR block, a
sheet's inner control group). A panel never contains another panel, a card never contains a card,
and a list is never a stack of boxes.

Spacing indicates conceptual distance: tight inside a group, moderate between groups, large only
between sections. Whitespace separates ideas; it does not pad every object.

## Material

- **Ground.** Cream `#FBF3E2` with two washes no darker than `#F7ECD3`. The film grain stays at 3.5%.
  This is the surface content sits on.
- **Liquid glass is the material of the chrome layer**, and it is meant to be seen. It reads as
  glass only because content moves beneath it, so it lives exactly where that is true: the bottom
  nav (the page scrolls under it), the sheet (the page shows through, blurred, behind it), the
  readout and countdown chips and the floating action on the sea hero (the water moves under
  them), the toast, and the Wrapped certificate over its drifting backdrop. Nowhere in the content
  layer, never glass on glass (the glass bible's two hard rules).
- **The glass recipe** (`.glass-live` plus `.glass-edge` in `base.css`, tuned per role by tokens):
  the film is a contrast obligation, not a fixed number: whatever white tint holds the text on it at
  4.5:1 against the darkest backdrop that surface can have (buy contrast with film, never by
  darkening the ink). Over the cream ground and the day sea that is 45 to 62%; the sheet, which
  covers content of any brightness, sits at 88%; the sea chips, whose backdrop follows the clock,
  carry a film the hero sets by the hour (lighter by day with the shader's own lens film beneath
  them, heavier at night without it). `blur` 6 to 8px on small controls, 16 to 22px on bars and sheets, `saturate(160%)`,
  a near-white hairline, one light from the top: a specular top edge (`inset 0 1px 0` white at 75%)
  and a highlight gradient over the top 40%. A coral-tinted film marks the one primary action on
  glass. Non-blur fallback and reduced-transparency path always present. The scan allows
  `backdrop-filter` and the inset edge only in the files that own chrome.
- **Panel** is a flat surface: `rgba(255,255,255,.55)` over the ground, 1px `--line`, radius 20, no
  shadow, no highlight gradient. Use sparingly (see the container rule).
- **Row highlight** for tappable rows: none at rest; `rgba(28,60,86,.06)` on press.

There are no floating cards. The two-stop card shadow and the turquoise film on content are retired;
the specular edge belongs to glass chrome only.

### Sheets

A sheet is the one place content is covered, so it is the most-used glass surface and the gesture
has to be right:

- **Look.** Glass film 88% (a sheet opens over the sea hero and over anything else; only a film this
  heavy keeps 13px `--ink-2` at 4.5:1 over the water, and the arithmetic sits beside the token), blur
  22, the specular edge, the sheet shadow; the scrim behind it is ink at 22% with an 8px blur, so the
  page is visibly still there. The SheetWave wash is its opening.
- **Dismiss.** Drag down from the grab bar or the header, or from anywhere when the sheet's own
  scroller is at its top. The drag must be vertical in intent (more down than across in the first
  10px) and it follows the finger. It dismisses only past 35% of the sheet's height (never under
  140px), or on a fast flick (over 1.1px/ms after at least 70px); otherwise it settles back over
  200ms. Escape and a tap on the scrim also close it.
- **Nothing else moves.** While a sheet is open the page behind is locked (position-fixed body on
  iOS, restored on close), the sheet's scroller contains its overscroll so a pull at its top never
  reaches the page (no pull-to-refresh), `touchmove` is prevented during a drag, and the scroller
  never scrolls sideways.

## Colour

Colour is semantic. A colour that means something in one place may not decorate another.

| Token | Value | Meaning, and nowhere else |
| --- | --- | --- |
| `--ink` | `#1C3C56` | text, icons, chart fills, deck numbers, every ordinal |
| `--ink-2` | `rgba(28,60,86,.74)` | secondary text and labels (4.9:1 on the darkest ground) |
| `--ink-3` | `rgba(28,60,86,.6)` | large text 18px bold or more, icon-only glyphs, hairlines. Never body or meta text |
| `--line` | `rgba(28,60,86,.12)` | hairlines and borders |
| `--coral-ink` | `#C72F50` | the one action colour: filled primary button (white text, 5.3:1), small accent text, active nav |
| `--coral` | `#E23C61` | accent at icon or display size only (3.5:1) |
| `--coral-brand` | `#FF5B78` | the funnel and the wordmark glyph. Not for UI |
| `--mint` / `--mint-ink` | `#147C58` / `#0F6E4F` | "tried" and "visited", nothing else |
| `--gold` / `--gold-ink` | `#B57A00` / `#965F00` | rating stars and rating text, nothing else |
| `--focus` | `#6F5BD6` | the focus ring only |
| `--sea-ink` | `#146E6A` | chart fills where ink would be too heavy (bars, area) |
| `--friend-*` | six hues | a person's identity dot and their name mark. Never for decks, charts or badges |

Accent area: coral covers at most one control per screen plus the active nav item. The sea hero's
palette is its own (mirrors the GLSL) and is the poster exception.

Retired: the fruit set as a general palette, gradient progress fills, coloured deck numbers, the
eight-colour donut, per-toggle colours (tried is mint, everything else is ink on and off), the
yellow glow behind the Wrapped seal.

## Typography

One family (the platform's rounded or system sans; no webfont), two weights, five sizes, three inks.

| Role | Size / weight / line-height | Use |
| --- | --- | --- |
| display | clamp(40px, 11vw, 52px) / 700 / 1 | the hero percentage and Wrapped numerals only |
| title | 22 / 600 / 1.2 | the screen's h1, the sheet's title |
| heading | 17 / 600 / 1.3 | section h2, a row's primary line when it is the object (drink name) |
| body | 15 / 400 / 1.5 | running text, row primary lines |
| meta | 13 / 400 / 1.4, `--ink-2` | secondary lines, labels, counts, nav labels at 12 |

- 12px is the floor. Nothing renders smaller, including chart axes and hint text.
- Emphasis inside body text is weight 600, never colour, never italic, never caps.
- No uppercase tracked labels anywhere. A section is introduced by a plain heading; a field by a
  sentence-case label at meta size; a sheet by its title and one meta line beneath it.
- Numbers are tabular everywhere they can be compared.
- Headings `text-wrap: balance`; body `pretty`. Clickable text never wraps to two lines.

## Iconography

The drawn set in `ui/Icon.tsx` (24px grid, 1.8 stroke) is the only icon system. No emoji as UI. An
icon appears beside text only when it adds recognition the word lacks (tried, favourite, camera).
The nav uses icon plus label at all times.

## Motion

Four authored moments and nothing else moves on its own: the ship bobbing on the sea (the sea itself,
with its sky following the clock, is the app's one live effect), the SheetWave wash when a sheet
opens, the hero count-up on first paint, and the new-medal coin's single turn on Home (one rotation,
then still). Everything else is feedback: press
scale `.97` over 120ms, state colour over 200ms, sheet rise over 280ms. One easing, `--e-out`.
No overshoot or spring curves on UI state, no reveal stagger on every screen, no chart grow-ins,
no endless pulses. Under `prefers-reduced-motion` each effect has its own fallback that keeps the
state change visible; there is no global animation kill.

## States

Every control ships default, pressed, focus-visible, disabled. Every list ships its empty state with
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

## Navigation

Five tabs, icon and label: **Home · Drinks · Ship · Crew · You**. "You" holds Stats, Badges and Log
behind a segmented control at the top of the page. The routes `/stats`, `/badges` and `/log` keep
resolving (they open You on that segment) so every existing link still lands. Active tab is coral
icon and label; there is no indicator pill and no icon lift.

## Screens

Each screen has a five-second read, its modules in rank order, and what must be visible at
390×844 with the nav in place (about 740px of content). Modules below the fold are still present;
they are simply not the reason the screen exists.

### Home

Read: what day is it, where am I, what do I do now. Home is the instrument's front panel, not a
summary; every module either answers one of those or leads to the screen that does.

1. **The sea hero** (the poster, kept): countdown or day chip top right, the percentage readout
   bottom left, and bottom right the one primary action on the app, **"Log a drink"**, a
   coral-tinted glass button floating on the water. It opens Drinks with the search focused, so
   logging at a bar is two taps from cold. The sea is alive in two honest ways: **the sky follows
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
   says it. Before sailing there is no day, no streak and nothing logged, and "drinks to go" is only
   the hero's "58 of 214" turned round, so the row becomes **The ship**: bars, restaurants, decks.
   Never a number the hero shows, and never a structural zero.
3. **Last bar** (aboard): one row for the venue of the last drink logged today, with "12 of 44
   tried here" and the first untried drink there named; it opens that venue's sheet. With nothing
   logged today it is "Your top bar"; before sailing it is "Where to start", the biggest bar and
   its count. Never a guess from the clock: a wrong bar labelled as yours breaks "Honest".
4. **A new medal**, when one has been earned since the guest last looked: the 3D coin (the
   Medallion, spinning once on entry, then still) with "New medal · Gin Explorer" and its hint,
   tapping to the badge sheet. It is the app's reward moment and the one place Home may be
   spectacular; it shows once per medal (a seen-set in the store) and then folds back into Up next.
5. **Up next**: the badge nearest to earned as a row with a 3px bar ("2 more gins for Gin
   Explorer"), the top drink and top bar rows as today, and, when there is a crew, one line per
   crew member who logged today, "Sam · 3 today, mostly Crooners · synced 20 min ago" (entries carry
   a date, not a time, so the venue is where most of today's drinks were, and the time is their
   passport's `exportedAt`, which is honest as "last synced"), opening Crew. Where the family is,
   as far as the data can say, without asking.
6. The Wrapped row, only when unlocked.

Fold: 1 to 3. The seed data is pre-sailing, so both states are verified by rendering the aboard
branch with the date pinned (`?day=2026-10-05`, a QA override in `today()`). "Log a drink" is the
only control with that intent: the Drinks page's catalogue action is "Add a missing drink". Opening
Drinks from it focuses the search field and shows the ring; the keyboard is the platform's to
raise, and it will not from a route change on iOS.

### Drinks

Read: find it, have I had it, log it. Modules: (1) search with the filter control beside it, one
row; (2) the count line; (3) the list, grouped under venue headings ("Good Spirits at Sea · Deck 7")
so the page has landmarks and the bar you are standing in is one scroll away. A row is name and
stars on the first line, one meta line (ingredients, one line, clamped), a tried check at the right
that is a 44px target. Favourite, wishlist and the rest live in the sheet. Tags become part of the
meta line ("Signature · £12"), not pills. Fold: search, count, the first heading and four rows.

### Drink sheet

Title, one meta line ("Good Spirits at Sea · Deck 7 · Signature"), ingredients as body, the blurb as
meta. Then rating (stars, 44px each), then the toggles as one row of compact chips (Tried in mint
when on; Favourite, Wishlist, Order again, Recommend in ink when on), then date and notes as fields,
then crew opinions as rows. No eyebrow, no coloured toggle boxes, no gradient meters: sweetness and
strength are five ink dots. The chip row wraps to a second line at 390px (five labelled chips do
not fit one line); that is the intended shape, not a defect.

### Ship

Read: which bars, what is done, where next. A plain section per deck: heading "Deck 17 · 6 of 65",
number in ink, then one row per venue: name, "n of m", a thin ink progress bar 3px tall. Visited is
a mint check after the name. Fold: the top two decks.

### Venue sheet

Title, meta line (deck, kind, hours), blurb, the visited switch as one row, the progress line, then
the venue's drinks as the same rows Drinks uses.

### Crew (Social)

Read: who is with me, add someone. Modules: (1) heading "Your crew" with the profile control at the
right (dot, name, code); (2) the one coral button, "Add to your crew", full width; (3) "Sailing
with" rows; (4) "Groups" rows with "Set up a group" as a text action; (5) "Discover together" rows;
(6) "Nobody's tried these yet" rows. The name card, when shown, is a panel (a form with its own
boundary) and the only panel on the screen. Fold: 1 to 3.

**Add to your crew** is server-first: the backend can find a person and make the friendship mutual
in one call (`find_profiles` then `befriend`, which writes both edges), so the phone-to-phone routes
are the fallback, not the front door. (1) **Find them**: one field, "Their name or code", searching
the server as you type (two characters on, whole-word prefixes, eight results, never yourself):
each match is a `.row` with their dot, name and code, and a 44px "Add" at the right (someone
already held reads "In your crew" with no Add); Add lands on the `Confirm` tick and the row joins
"Sailing with", holding the row-highlight tint for about four seconds so the name on the tick can
be found in the list. A full code pasted or typed matches exactly.
Offline, the field says so and the link route takes over. (2) **Or send your link**, a secondary
button opening the native share sheet, which is also the nearby route (AirDrop on iPhone, Nearby
Share on Android; the web has no contact-tap of its own); its meta line says so. (3) One row of two
quiet controls, "Scan their code" and "Show my code" (the QR and code unfold inline). (4) "Join a
group" as today. Every success, on either phone, ends in the `Confirm` tick; the other side gets a
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
most visited bars as a ranked list), "What you drink" (categories and spirits as ranked lists with
counts, no donut), "Best and worst" (highest rated, lowest rated, best rated bars as rows). "Across
the voyage" survives only with labelled axes at 12px and a title that names the question ("Drinks
logged per day"). Badges: earned medals as a row of discs with names beneath, then "Close" as rows
with a thin progress bar and "58 of 100", then "Locked" as plain rows. No card per badge. Log: a
section per day, heading "Day 1 · Sat 3 Oct" with the count at the right, rows with hairlines.

### Wrapped

Experience mode; the story format stays. Headings roman, no uppercase tracked labels (the cover's
"A voyage in cocktails" becomes a meta line beneath the title), the certificate keeps its inner rule
because it is a certificate, "Save my Wrapped" is the one coral button. Backdrop drift stays as this
mode's one ambient motion and stops under reduced motion.

## Verification

A screen is done when a fresh screenshot at 390×844 from the running dev server (`?seed`) shows the
modules in rank order with the fold respected, and a scan of its CSS finds: no font-size below 12px
and none off the scale; no spacing literal off the scale; no radius outside 20/12/999; no
`box-shadow` on content; no `backdrop-filter` outside nav, sheet and hero chips; no
`text-transform: uppercase` with tracking; no easing other than `--e-out`; every colour a token.

The tools for this live in `tools/qa/` (see its README): `shot.mjs` renders one screen or sheet,
`shots.mjs` sweeps them all, `scan.mjs` is the mechanical check, `gestures.mjs` drives the sheet's
gesture contract with real touch events and asserts it, and `npm run design:check` is the same
scan as a hard gate, run in CI before every build. A genuine exception goes in
`tools/qa/design-allow.txt` with its reason, never into the scanner.

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
   If it needs a number the hero already shows, it does not show the number again. If it needs a
   state colour, it uses the one that already means that state.
3. **Fit the form, then diverge for a reason.** Compose from the registry. A list is `.row`s with
   hairlines under a `.section-head`; a sheet is `Sheet` with a title and a `.sheet-meta` line; a
   control is one of `ui/`. Copy how the neighbouring screen does the same job. Depart from it only
   with a one-line reason written in the CSS comment; if you cannot write the reason, do not depart.
4. **Mint a primitive properly or not at all.** If the pattern genuinely does not exist: build it
   once in `src/styles/base.css` or `src/ui/`, add it to the registry below in the same change, and
   sweep every existing sibling to use it (grep finds them). A second, slightly different version of
   an existing primitive is the failure this process is for.
5. **Verify with a render, not by reasoning about the CSS.** `npm run dev`, then `tools/qa/shot.mjs`
   at 390×844 for the screen and each sheet it opens (settled, `--after 3000`), the full-page shot,
   `tools/qa/scan.mjs` on the files you touched, `npm run design:check`, `npx tsc -p tsconfig.app.json
   --noEmit`. Look at the PNGs honestly: rank order, fold, boxes, caps, wrapping, contrast.
6. **Keep this document true.** A rule that changes changes here first, with the reason, then in the
   code. A screen section that no longer describes the screen is a bug.

### The registry: what exists, where it lives, the rule

| Primitive | Home | Rule |
| --- | --- | --- |
| Tokens (`--ink*`, `--line`, `--coral*`, `--mint*`, `--gold*`, `--sea-ink`, `--s1..6`, `--r-*`, `--f-*`, `--e-out`, `--t-*`) | `src/styles/tokens.css` | every colour, space, radius, size and easing is a token; a literal in feature CSS is a defect |
| Type roles `.t-display .t-title .t-h2 .t-body .t-strong .t-meta .t-micro .eyebrow` | `src/styles/base.css` | never a local `font-size`; `.eyebrow` is a sentence-case label, not caps |
| `.section`, `.section-head` | `base.css` | a section is a plain `h2.t-h2`, 32px above, 8px to its content, count or meta at the right |
| `.row` (tappable), `.line` (static), `.row-copy` | `base.css` | every list is rows with hairlines on the ground; never a box per item |
| `.panel` | `base.css` | the one container, for a bounded interactive module only; never nested |
| `.glass-live`, `.glass-edge`, `.glass-coral` | `base.css` | liquid glass for chrome: nav, sheet, hero chips and the floating action, toast, Wrapped certificate. Nothing in the content layer |
| `Confirm`, `haptic()` | `src/ui/Confirm.tsx`, `src/ui/haptic.ts` | the one success confirmation (tick on glass, label, haptic); silent where the result is already visible |
| `.btn .btn-coral .btn-wide`, `GlassButton` | `base.css`, `src/ui/GlassButton.tsx` | one filled coral control per screen; disabled falls to the plain surface |
| `.tag`, `.mini` | `base.css` | small outline tags inside a meta line; compact 36px secondary control |
| `Sheet` + `.sheet-meta` | `src/ui/Sheet.tsx`, `sheet.css` | title then one meta line; no eyebrow; the SheetWave is its opening |
| `Field`, `SearchField`, `Select`, `Switch`, `Segmented`, `Chip`, `Toast`, `FriendDot` | `src/ui/` | the controls; restyle them there, never locally |
| Icons (`Icon.tsx`: `IconStar`, `IconCheck`, `IconChevron`, ...) | `src/ui/Icon.tsx` | the only icon system; no glyph characters, no emoji; add to the set, do not draw inline |
| `.sr-only` | `base.css` | visually hidden, still announced |
| `.meter` | `base.css` | the 3px measure beside a count out of a total (venue rows, the Home bar row); Stats' 6px deck bars and the badge rows keep their own shapes |
| `dayPart()`, `greetingWord()` | `src/state/stats.ts` | the six parts of the day and the greeting word; the sea's sky palette and Home's greeting both key off them, never off their own boundaries |
| `nowHour()`, `today()` | `src/data/model.ts` | the clock, with `?hour=` and `?day=` QA overrides |
| `seenMedals`, `markMedalsSeen()` | `src/state/store.ts` (persist v8) | which badges' "new medal" moment Home has shown; seeded on upgrade with what was already earned |
| `SeaHero` (`level`, `hour`, `chips`) | `src/features/home/SeaHero.tsx` | the sea; the sky follows `hour`, the shader lenses the water under the `chips` rectangles |
| `DrinkCard` | `src/features/drinks/DrinkCard.tsx` | the drink row everywhere a drink is listed (Drinks, venue sheet) |
| `Medallion` | `src/features/badges/Medallion.tsx` | the badge disc, grid and sheet |
| `SeaHero`, `SheetWave`, the hero count-up | `src/features/home/`, `src/ui/SheetWave.tsx` | the three authored motions; do not add a fourth without amending Motion above |
| `You` | `src/features/you/You.tsx` | Stats, Badges and Log render inside it; they carry no page wrapper of their own |
| Seed data | `index.html` (`?seed`) | how every screen is populated for a render |
