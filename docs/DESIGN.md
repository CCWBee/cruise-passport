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
- **Glass (live blur)** is reserved for chrome that genuinely layers over content: the bottom nav,
  the sheet, the readout and countdown chips on the sea hero. Nothing else blurs.
- **Panel** is a flat surface: `rgba(255,255,255,.55)` over the ground, 1px `--line`, radius 20, no
  shadow, no highlight gradient. Use sparingly (see the container rule).
- **Row highlight** for tappable rows: none at rest; `rgba(28,60,86,.06)` on press.

There are no floating cards. The two-stop card shadow, the specular top edge and the turquoise film
are retired.

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

Three authored moments and nothing else moves on its own: the ship bobbing on the sea, the SheetWave
wash when a sheet opens, the hero count-up on first paint. Everything else is feedback: press
scale `.97` over 120ms, state colour over 200ms, sheet rise over 280ms. One easing, `--e-out`.
No overshoot or spring curves on UI state, no reveal stagger on every screen, no chart grow-ins,
no endless pulses. Under `prefers-reduced-motion` each effect has its own fallback that keeps the
state change visible; there is no global animation kill.

## States

Every control ships default, pressed, focus-visible, disabled. Every list ships its empty state with
the one action that fills it. Anything that waits on the network shows that it is waiting and what
failed. Tried, visited, favourite and wishlist read the same way on every screen: a filled glyph in
the state colour, not a background tint.

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

Read: where am I in the voyage and how am I doing. Modules: (1) the sea hero with the percentage
readout and the day count, the only poster on the app; (2) three facts in one row, plain, no box:
to go, day streak, bars visited; (3) "Right now": top drink and top bar as two rows; (4) the Wrapped
row, a single quiet row that appears only when Wrapped is unlocked. Fold: 1 to 3. Nothing on Home
repeats a number the hero already shows.

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
strength are five ink dots.

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
