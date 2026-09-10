# Landing and install

Workstream E of `docs/specs/2026-09-10-product-brief.md`. Drafted 10 September 2026 against branch
`product`, reviewed the same day against the code and against B's spec. It runs after A, C and B, and
before BYO, and must not delay A, C or B.

## Purpose

A desktop visitor who opens cruise.charlesbee.org gets a passport they cannot use: the app is a
one-handed phone logbook, and a laptop is the wrong instrument for it. This workstream gives that
visitor the one thing they came for, the app on the phone in their pocket, as a scannable code of
the live address, the two steps that put it on a home screen, and a slot for the price when there is
one. The failure it removes is the desktop dead end: B's first-open screen asking for a name and a
colour on a machine that will never be carried to a bar.

## What exists

### The precondition: E cannot start until B has landed two lines in `store.ts`

`src/state/store.ts:143` reads `enteredCruise: CRUISES.length === 1`, and `CRUISES` has one entry
(`src/data/cruises.ts:29` to 39). **On a fresh browser today `enteredCruise` is therefore `true`**, so
neither the picker nor anything in front of it renders at `/`. `migrate` reinforces it: `store.ts:374`,
inside the `from < 6` block, sets `persisted.enteredCruise = true` when `CRUISES.length === 1`.

B's spec fixes both (`2026-09-10-b-entry-first-open.md`, Data and state and step 1): the default
becomes `false`, persist goes 8 to 9, and a `from < 9` block sets `enteredCruise = true` so every
existing user is treated as entered. **E adds nothing to `store.ts` and depends entirely on that
change.** Before starting E, confirm it on `product` with
`grep -n "enteredCruise:\|version:" src/state/store.ts`: the default must read `enteredCruise: false`
and persist `version` must be 9. Do not check by line number, because B adds a comment line above the
default and shifts everything under it. If either is not there, stop: the desktop first-open branch
specified here cannot fire, and every claim in Behaviour about `enteredCruise` being false is untrue.

### The files

- **`src/app/App.tsx`** (read 1 to 188, pre-B). Holds every route. Lines 163 to 188 are the entry
  point: `enteredCruise` is read at 164 and, at 167,
  `if (!enteredCruise && CRUISES.length > 1) return <CruisePicker />` renders the picker **outside**
  `BrowserRouter`, so it sits in front of every path including `/add` and `/join`. Lines 21 to 24 are
  `WrappedRoute`, a four-line wrapper that owns a `useNavigate` and passes `onClose`; line 184 mounts
  `/wrapped` **outside** `<Route element={<Shell />}>`, so it renders with no nav and no masthead.
  `BrowserRouter` takes `basename={import.meta.env.BASE_URL}` (line 169), and `vite.config.ts:8` sets
  `base: '/'`, so `BASE_URL` is `'/'` in dev and in the build.
  **After B** (its step 11) that gate reads, in the same place:
  `const [forced, setForced] = useState(() => qaFirstOpen())` then
  `if (!enteredCruise || forced) return <Entry onDone={() => setForced(false)} />`.
  E inserts its branch immediately above that gate. Cite B's gate, not line 167: B moves it.
  Reuse: the `WrappedRoute` shape verbatim for `GetRoute`, and the outside-`Shell` route position
  verbatim for `/get`.
- **`src/app/Shell.tsx`** (read 1 to 47, pre-B). Lines 30 to 37 are the masthead: `header.app-head`
  wrapping `.wrap.app-head-in`, which holds `span.brand` with `IconDrinks size={19}` (line 33) and
  `span.brand-name` reading "Cocktail Passport" (line 34). `src/app/shell.css` (15 lines) styles
  `.brand` at `--coral-brand` (line 9) and `.brand-name` at `--f-body` weight 600 (line 10).
  **After B** (its steps 4 and 5) that markup lives in `src/app/Masthead.tsx` as
  `export function Masthead()`, `Shell` renders `<Masthead />` on every screen including Home, and
  B registers it in `DESIGN.md`. **The Landing imports and renders `<Masthead />`. It does not copy
  the markup**: a second copy of an extracted primitive is the divergent-sibling failure `DESIGN.md`
  rule 4 exists to stop, and it is the reason B extracted it in the first place.
- **`src/features/cruise/CruisePicker.tsx`** (read 1 to 46, pre-B). The only other screen that renders
  outside the router. Line 21 paints its own `<div className="ground" aria-hidden />` because it is
  outside `Shell`, which is where the ground normally comes from (`Shell.tsx:29`). Lines 22 to 24 wrap
  everything in `.cruise-gate > .wrap.cruise-gate-in`. `src/features/cruise/cruise.css` (26 lines) has
  the gate geometry: `min-height: 100dvh`, `display: grid`, `align-items: center`,
  `padding: 32px 0 max(32px, env(safe-area-inset-bottom))` (lines 1 to 7) and a 24px gap between
  blocks (lines 8 to 11). Its values are literals.
  **After B** (its steps 10 and 11) this file is `src/features/cruise/Entry.tsx`, the component is
  `Entry({ onDone })`, and `cruise.css` is rewritten in place as `.entry`, a two-row grid (masthead
  pinned at the top, then a vertically centred `.wrap`), with `.entry-in` a 24-gap grid.
  Reuse: the own-`.ground` line, and **`.entry`'s two-row shape**, so the two screens a cold visitor
  can land on are the same shape on both devices. The landing writes those values as tokens.
- **`src/ui/Qr.tsx`** (read 1 to 44). **This is the QR mechanism, and it needs no network.** It
  imports `qrcode-generator`, a bundled npm dependency (`package.json:20`, `^2.0.4`), builds the model
  in a `useMemo` at auto version and medium error-correction (line 13), walks the module grid and emits
  one SVG `path` of 1×1 rects (line 41) over a white `rect` (line 40) with a two-module quiet zone.
  No image service, no `fetch`, no canvas, no runtime download: Vite bundles the generator into the app
  chunk and the service worker precaches that chunk (`vite.config.ts:36`), so the code draws with the
  aeroplane mode on. Props are `value`, `size` (default 220), `className` and `label`. The comment at
  lines 5 to 7 is explicit that `label` is the only thing distinguishing two visually identical QR
  blocks to a screen reader, so the landing must pass its own.
  Line 27 returns `null` when the value will not encode. **A parent cannot observe that**: React
  renders nothing and the caller sees no signal, so no JSX branch can react to it. Both existing call
  sites would leave an empty white box. The landing therefore handles it in CSS, in the minted plate
  (see Design placement), and `Qr.tsx` is not touched.
- **`src/features/friends/AddCrewSheet.tsx`** (read 1 to 302). Line 60 builds the shareable address
  as `` `${location.origin}${import.meta.env.BASE_URL}add#${code}` ``: origin plus Vite's base, never a
  hardcoded host. Line 240 renders the QR as `<div className="panel addme-qr">{link ? <Qr value={link}
  size={200} /> : <div className="addme-qr-skel" aria-hidden />}</div>`. Line 289 is the quiet text
  action, `<button type="button" className="friends-quiet" onClick={…}>Paste a code instead</button>`,
  and it is the **only** call site of that class in `src`. Reuse: the address construction at 60, the
  plate at 240, the quiet action at 289.
- **`src/features/friends/GroupSheet.tsx`** line 132: the second `panel addme-qr` plate, with
  `label="Scan to join this group"` passed. Both call sites move to the minted primitive.
- **`src/features/friends/friends.css`**. Lines 131 to 136 are `.addme-qr`:
  `justify-self: center; padding: var(--s3); background: var(--on-accent); line-height: 0`, and line 137
  is `.addme-qr svg { display: block }`. Lines 138 to 143 are `.addme-qr-skel`, a 200px placeholder.
  Lines 50 to 59 are `.friends-quiet`: a block, `min-height: var(--ctl)`, `--f-meta`, weight 600,
  `--ink-2`, `margin-top: var(--s5)`, underlined at 3px offset.
  Reuse: `.addme-qr` is promoted to `.qr-plate` and `.friends-quiet` to `.quiet-action`, both in
  `base.css`. `.addme-qr-skel` stays where it is: it belongs to the add sheet's loading case, which the
  landing does not have.
- **`index.html`** (read 1 to 95). Line 7 the title, line 8 the description, line 19
  `<meta name="apple-mobile-web-app-title" content="Cocktails" />`, lines 21 to 35 the canonical link
  and the Open Graph and Twitter cards, lines 36 to 89 the `?seed` demo block. The seed block writes
  `localStorage['spcc2']` at `version: 2` (line 86), which matters to verification: see Verification.
  Reuse: the home-screen name "Cocktails" is a fact the install copy states; nothing in this file changes.
- **`public/`** (listed and read): `_redirects` (`/*  /index.html  200`, so any new route resolves),
  `apple-touch-icon.png`, `favicon.svg`, `favicon-32.png`, `og.png`, `pwa-192.png`, `pwa-512.png`,
  `robots.txt` (`Allow: /`, `Disallow: /add`, `Disallow: /join`), `sitemap.xml` (one entry, `/`),
  `.well-known/security.txt`. Reuse: nothing needs adding; `_redirects` already makes `/get` resolve,
  and `robots.txt` already allows it.
- **`src/styles/base.css`** (read 1 to 206). `.panel, .glass` at 88 to 94 (the one container, no
  shadow, `background: var(--panel)`), `.section` at 81 and `.section-head` at 82 to 83, `.row`/`.line`
  at 136 to 146, `.row-copy` at 147 to 148, the type roles at 69 to 78, `.wrap` at 63, `.tnum` at 66,
  `.sr-only` at 156. Line 146, `.line + .line`, is where the hairline between two static rows comes
  from. Note line 148: `.row-copy > *` sets `overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap`, so `.row-copy` clamps to one line and cannot hold a sentence that must wrap.
  This is why the install steps need a local wrapper with a written reason rather than `.row-copy`.
- **`src/styles/tokens.css`** (read 1 to 139). Every value the landing uses is here: `--ink` (12),
  `--ink-2` (13), `--line` (15), `--on-accent` (17, the white the QR plate needs), `--coral-brand` (20,
  the wordmark glyph), `--panel` (53), `--s1` to `--s6` (95), `--ctl` (97), `--r-surface`/`--r-control`
  (90), `--f-title`/`--f-body`/`--f-meta` (124), `--wrap` 720px (119), `--safe-b` (117). No new token.
- **`src/data/model.ts`** lines 112 to 137: the QA overrides. `today()` reads `?day=` (112 to 120),
  `nowHour()` reads `?hour=` (123 to 131), `qaNoSync()` reads `?nosync` (135 to 137), each guarded on
  `typeof location !== 'undefined'`. B adds `qaFirstOpen()` (`?entry`) beside them first. Reuse:
  `qaLanding()` goes here too, because this is where every QA override in the app lives and
  `DESIGN.md`'s registry row already points at this file for them.
- **`src/ui/avatarSpring.ts`** line 37: `typeof window !== 'undefined' && typeof matchMedia !== 'undefined'
  && matchMedia('(hover: hover)').matches`. This is the app's existing pointer-device test, and the
  guard shape `isDesktopVisitor()` copies.
- **`src/state/store.ts`**: `enteredCruise` default at 143, `enterCruise` at 162 to 167, persist `name`
  `spcc2` at 349, `version` at 350, `migrate` at 352 to 394 (the `from < 5` block that sets
  `enteredCruise = true` is 362 to 366), `partialize` at 396 to 400, which already carries
  `enteredCruise` (398). **E changes nothing in this file**; see Data and state and the precondition above.
- **`tools/qa/shot.mjs`** (read 1 to 53) and **`tools/qa/cdp.mjs`**. `shot.mjs` hardcodes
  `const W = 390, H = 844` (line 24), passes them to `launch()` (27) and overrides device metrics per
  session with `deviceScaleFactor: 2, mobile: true` (30). Routes are passed without a leading slash;
  `home?x=y` is rewritten to `/?x=y` (19) and anything else gets a leading slash (20), and `seed` is
  appended with the right separator (33), so `home?landing=desktop` and `get?landing=phone` both work
  unchanged. `--eval` runs before the geometry line and its result is printed as `eval: <json>` (43),
  `--after` is the settle time after each `--click` (40), and line 45 prints
  `viewport … scrollWidth … docHeight …` plus `HORIZONTAL OVERFLOW`. `tools/qa/shots.mjs` declares its
  own `W`/`H` (line 9) and does not read `shot.mjs`, so widening `shot.mjs` cannot change the sweep.
  **Measured on this machine, 10 September 2026** (a throwaway script over `cdp.mjs`, not committed):
  headless Chrome reports `hover: hover` **and** `pointer: fine` at 390×844 and at 1280×800, with
  `mobile: true` and with `mobile: false` alike. So the width leg of `isDesktopVisitor()` is the only
  leg a headless render can refute; the other two are always true there. That is enough to shoot both
  branches for real, and it is why the QA override exists for the gate rather than for the query.
- **`package.json`** (read 1 to 38): `qrcode-generator` is a runtime dependency (20); `lint` is
  `oxlint` (9); there is **no test runner** (no `test` script, no vitest, no `.test.` file anywhere in
  `src` or `tools`). Verification is therefore renders, `--eval` probes and the standing gates, not
  unit tests. `npm run lint` on `product` today prints 0 errors and 28 warnings (counted, 10 September).

## Design placement

**A new screen, Landing.** It has no entry in `DESIGN.md`'s Screens section, so the implementer adds
one in the same change (`DESIGN.md`, Working on this design, rule 6). It goes **directly after B's
Entry section, above Home**, because Landing is Entry's desktop twin: the two screens are what a cold
visitor meets, and a reader looking for one will look for the other beside it.

Its five-second read: **what this is, how to get it on my phone, what it costs.**

It renders in two places, both established shapes:

- **The gate at `/`**, outside `BrowserRouter`, immediately above B's `Entry` gate. It paints its own
  `.ground` because it is outside `Shell`, as B's `Entry.tsx` does (the line is `CruisePicker.tsx:21`
  before B's rename).
- **The route `/get`**, mounted outside `<Route element={<Shell />}>` exactly as `/wrapped` is
  (`App.tsx:184`), through a `GetRoute` wrapper that mirrors `WrappedRoute` (`App.tsx:21` to 24). One
  component, one rendering, no nav in either place; the masthead is the component's own module 1.

`/get` rather than `/install`: it is shorter to say and to type onto a card, and the screen answers
"what is this" as well as "how do I install it", which `/install` would misname.

### Rank order, desktop branch

1. **Masthead** (chrome). `<Masthead />` from `src/app/Masthead.tsx`, the same component `Shell`
   renders on every other screen and B's `Entry` renders on itself. Pinned to the top of the viewport,
   not part of the centred block. Sibling: B's Entry, module 1.
2. **Title and lead.** `h1.t-title` then one `p.muted.t-body`. Siblings: the title-then-lead opening
   at `CruisePicker.tsx:26` to 27, and after B, `Entry`'s `h1.t-title` (its module 2) with its "what
   this is" `p.t-body` (its module 4), which is the sentence this lead copies.
3. **The code (dominant element).** A `.section` holding `h2.t-h2` inside a `.section-head`, one
   `p.t-meta`, then the `.qr-plate` holding `<Qr size={200} label=… />`, then the address as
   `p.t-meta.tnum.landing-addr` beneath it. Sibling: `AddCrewSheet.tsx:240`. This is the one dominant
   element on the screen and the reason the screen exists; nothing else on it is boxed.
4. **Add it to your home screen.** A `.section` holding a `.section-head` heading, then two static
   `.line` rows taking their single hairline from `base.css:146`, one per platform, then one
   `p.t-meta.landing-note` beneath. Each row is `div.line > div.landing-step` holding
   `span.t-strong` (the platform) then `span.t-meta` (the instruction). Siblings: `.line` and its
   hairline from any read-only list in the app, for instance the Log's day rows; the `.t-strong` over
   `.t-meta` pair from B's privacy row, which is the same two-line copy shape. It is `.line` and not
   `.row` because it is not a control: no press tint, no tabstop, no `aria-haspopup`.
5. **The price slot.** One `p.t-meta`, rendered only when the constant that feeds it is set. Empty
   today, so the desktop branch renders five modules and this position is reserved. It sits here,
   below the install steps and above the way on, because price is the last thing a visitor needs and
   the first thing that would cheapen the screen if it led.
6. **The way on.** One quiet underlined text action, the `.quiet-action` shape (promoted from
   `.friends-quiet`, `friends.css:50` to 59, used at `AddCrewSheet.tsx:289`).

Fold, desktop branch, at **1280×800**: modules 1 to 3, the plate included. The install steps and the
way on sit below it on a short window, and that is the intended shape, not a defect: the code is the
reason the screen exists and the steps are what you read after you have scanned it. 390×844 is not a
viewport this branch can be seen at, because `(min-width: 900px)` excludes it, so quoting a 390 fold
for it would be meaningless. On any desktop window the column is `.wrap` (720px max) inside the
two-row grid, so the content measure is the same 720 as everywhere else in the app.

Height budget, desktop branch at 1280×800, headless, no safe-area inset: masthead 42, body padding 32,
title 26 plus 8 plus a two-line lead 45, section gap 32, the code module 316 (heading 22, 8, meta 18,
12, plate 200 plus 24 padding and 2 border, 12, address 18), section gap 32, the install module 183
(heading 22, 8, two 61 rows with one hairline, 12, note 18), the way on 68 (24 above, 44 tall), bottom
padding 32. About 816, so the whole screen is a little taller than an 800px window and taller still
than a real laptop viewport once browser chrome is taken off. Modules 1 to 3 end at about 502, which
is what the fold claim above rests on and what the shots assert.

Fold, phone branch, at **390×844**: all four rendered modules, nothing below the fold. The budget
there is about 470 of 844, because the code module is absent and the price slot is empty.

### Rank order, phone branch

Module 3 is absent: a code of the address the phone is already on tells it nothing. The order is
masthead, title and lead, add it to your home screen, price slot, way on, which is four rendered
modules while the price slot is empty.

### Geometry

One system, `DESIGN.md`'s. The masthead is row 1 of the page grid; the centred block is row 2, with
`--s6` (32) of padding top and bottom, as `.entry` has. Inside the block: 8 from the title to its
lead (`.landing-head` gap `--s2`); 32 above each of the two headed modules, which comes from
`.section`'s own `margin-top: var(--s6)` and not from a grid gap, so the section rhythm is the app's
one rhythm; 8 from a `.section-head` to its content, from `.section-head`'s own margin; 12 between the
meta line, the plate and the address (`.landing-code` gap `--s3`); 12 from the install rows to the
line beneath them; 24 above the price line and 24 above the way on, the latter from `.quiet-action`'s
own margin. Radius 20 on the plate (from `.panel`), nothing else boxed. Control height 44 on the way
on, from `.quiet-action`'s `min-height: var(--ctl)`.

### Registry primitives used, and the two minted

Used unchanged: `.ground`, `.wrap`, `.section`, `.section-head`, `.line`, `.panel`, `.t-title`,
`.t-body`, `.t-h2`, `.t-meta`, `.tnum`, `.muted`, `.sr-only`, `Qr`, `Masthead`.

Minted in `base.css`, both because `DESIGN.md` rule 4 requires a pattern needed in a second place to
be built once, registered and swept rather than copied:

- **`.qr-plate`**, the white plate under any `Qr`. Two call sites already share one feature-scoped
  class (`AddCrewSheet.tsx:240`, `GroupSheet.tsx:132`); the landing is the third. The rule body is
  `friends.css:131` to 137 moved verbatim, plus one new line, `.qr-plate:empty { display: none }`.
  That line is how the `Qr`-returns-null case is handled at every call site at once: when `Qr` renders
  nothing the plate div has no children, `:empty` matches, and no empty white box appears. It is the
  only place the case can be caught, because a parent cannot see a child return null.
- **`.quiet-action`**, the quietest text action on a screen: block, 44px minimum, meta size, weight
  600, `--ink-2`, underlined at 3px offset, 24 above. The rule body is `friends.css:50` to 59 moved
  verbatim under the new name, and its one existing call site (`AddCrewSheet.tsx:289`) is swept in the
  same commit. The draft offered this as a choice between promoting and copying locally; rule 4 does
  not leave a choice, and the sweep is one line.

One local class diverges from a registry shape and carries its written reason in the CSS, as rule 3
requires: **`.landing-step`**, the wrapper inside a `.line` row. `.row-copy` cannot be used because
`base.css:148` clamps its children to one line with an ellipsis, and an install instruction is a
sentence that must wrap. The rest of `landing.css` is layout for this screen only and names no value
that is not a token.

### Colour and state

No state colour appears on this screen, because nothing on it has a state: no tried, no visited, no
rating, no sync. It uses `--ink` for headings, `--ink-2` for every meta line and the way on, `--line`
for the row hairlines and the plate's border, and `--on-accent` for the plate's fill, which overrides
`.panel`'s `--panel` because a code has to read under a camera on any ground. The masthead's glyph
carries `--coral-brand`, which the colour table reserves for the wordmark glyph and excludes from UI,
so it does not spend the accent budget. **There is no `--coral-ink`**: the budget is one filled
control per screen and this screen has none, because the primary action here happens on a different
device.

### The four banned tells

No pill or dotted eyebrow: module 1 is the `Masthead` primitive, a drawn SVG mark plus a text
wordmark, and every heading is a plain `h2`. No rule along a heading or a box: the only borders are
the single hairline between the two install rows, which separates list rows, and the plate's own 1px
`--line`. No emoji: `IconDrinks`, through `Masthead`. No wall of boxes: one boxed element, the QR
plate, and it is the dominant element.

## Behaviour

`isDesktopVisitor()`, exported from `Landing.tsx`, decides which branch renders:

```ts
export function isDesktopVisitor(): boolean {
  const forced = qaLanding()
  if (forced) return forced === 'desktop'
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches
}
```

Three conditions together, not width alone: a phone in landscape can exceed 900px and a tablet with a
trackpad genuinely is a desktop visitor for this purpose. `matchMedia('(hover: hover)')` is already
the app's test for a pointer device (`avatarSpring.ts:37`), and the `typeof` guard is that line's,
copied. The value is read at render; the screen does not subscribe to the query, because a visitor
does not resize a laptop into a phone mid-install.

`qaLanding()` returns `'desktop'`, `'phone'` or `null` from `?landing=`. It exists for one reason the
media query cannot cover: `shot.mjs` always appends `?seed`, the seed migrates the store to entered,
and an entered store never reaches the gate. `?landing=desktop` therefore also forces the gate open.
`?landing=phone` does not force anything: it only pins the branch, which is what makes it the negative
control. Both branches are additionally shot at `/get` with no override at all, where the real media
query decides (see Verification).

### First open, desktop, at `/`

`enteredCruise` is false (B's default) and `isDesktopVisitor()` is true, so the gate renders the
Landing instead of B's `Entry`. Verbatim copy:

- Masthead: **Cocktail Passport** (the primitive's own text; nothing here sets it)
- `h1`: **A drinks logbook for your sailing**
- Lead: B's Entry "what this is" line, copied character for character out of `Entry.tsx` with a
  comment naming it as the source, so the two cold-open screens answer "what is this" identically.
  As B's spec has it today: **Tick off, rate and log the cocktails aboard, and see what your crew has
  found. It works offline.** If B's landed wording differs, B's wins and this line follows it, the
  same way B takes `GUEST_HONESTY` from C.
- Heading: **Open it on your phone**
- Under the heading: **Point your phone's camera at this code. There is nothing to download from an
  app store.**
- The plate, then the address beneath it as text: **cruise.charlesbee.org**, which is `location.host`
  with `import.meta.env.BASE_URL` appended when the base is not `'/'`. On the dev server it reads
  `127.0.0.1:5173`. It is the display form of the encoded value, not a second source of truth.
- Heading: **Add it to your home screen**
- Row 1: `.t-strong` **On iPhone**, `.t-meta` **Open the address in Safari, tap the share button,
  then Add to Home Screen.**
- Row 2: `.t-strong` **On Android**, `.t-meta` **Open the address in Chrome, tap the menu, then
  Install app.**
- Under the rows: **It saves as Cocktails, with its own icon, and opens without a browser bar.**
  ("Cocktails" is the name in `index.html:19` and `vite.config.ts:19`; it is the one concrete fact a
  guest needs to find it again. "Add to Home Screen" and "Install app" keep their capitals because
  they are the labels on the platforms' own menus, quoted, not sentence-case prose.)
- The price slot: nothing renders today. See Data and state.
- The way on: **Open it in this browser instead**

**No consent line and no privacy row.** B's Entry carries both because tapping its Done turns on sync;
this screen collects nothing, sends nothing and enters no cruise, so a consent line here would be
consent to nothing. The way on leads to B's Entry, which asks properly.

**Taps.** The masthead is not a control. The plate is not a control. The two install rows are `.line`,
not `.row`: static, no press tint, no tap. The way on calls `onContinue`, which at the gate sets a
React state flag in `App` so the gate stands down and B's `Entry` renders on the next paint. Nothing
is written to storage by that tap.

### First open, phone, at `/`

`isDesktopVisitor()` is false, so the gate falls through unchanged and B's `Entry` renders. The
Landing never appears. A phone visitor's landing is the first-open screen, exactly as the brief says.

### Returning visitor, either device, at `/`

`enteredCruise` is true, so neither gate fires and the app renders. The Landing is never shown at `/`
to somebody who already has a passport on this browser, on any device.

### `/get`, desktop

Two paths reach this screen and they are not the same code.

- **Already entered.** The gates do not fire, the router mounts, `GetRoute` renders the Landing, and
  the way on reads **Open your passport** and calls `navigate('/')`, mirroring `WrappedRoute`
  (`App.tsx:22`).
- **Not entered.** The visitor never reaches the router at all: B's `Entry` gate has no path test, so
  E's branch has to claim `/get` as well as `/`, or the first-time desktop visitor who follows the
  address on a card is handed a name and colour card, which is the exact failure this workstream
  exists to remove. Here the way on reads **Open it in this browser instead**, and it rewrites the
  address to `/` (keeping the query string) with `history.replaceState` before it stands the gate
  down; without that, `Entry` appears and then the router mounts `/get` and shows the Landing a second
  time.

The label is a prop, `continueLabel`, not a store read: at the gate rendering under `?landing=desktop`
the seed has already set `enteredCruise` to true, so a component reading the store there would print
"Open your passport" on a screen whose button opens the entry screen. `App` passes the browser line;
`GetRoute` passes the passport line. Each caller knows which path it is on; the component does not
have to guess.

### `/get`, phone

- **Already entered.** `GetRoute` renders the Landing's phone branch: four rendered modules, no plate, way
  on **Open your passport**. This is the useful case, someone on their phone who has the passport in a
  browser tab and wants it on the home screen.
- **Not entered.** B's `Entry` gate fires first and the entry screen renders, not the Landing. E's
  branch is desktop-only by construction, so it does not claim `/get` for a phone. That is the brief's
  intent ("A phone visitor's landing is the first-open screen") and it is stated here because the
  path-test argument above could otherwise be read as covering both devices. It does not.

### Already installed

When `matchMedia('(display-mode: standalone)').matches` is true, the two install rows and the line
beneath them are replaced by one `p.t-body` reading **It is already on your home screen.** The
heading stays, so the screen keeps its shape. This is reachable only through `/get` inside the
installed app, where `display: 'standalone'` is what the manifest declares (`vite.config.ts:23`).

### Offline

Nothing on this screen asks the network for anything. The QR is drawn from a bundled generator
(`Qr.tsx:1`), the address comes from `location.origin`, the copy is static, and the whole chunk is
precached by the service worker (`vite.config.ts:36`, with `navigateFallback: 'index.html'` at line 40,
so `/get` resolves offline too). There is no offline state to write, and the implementer must not add
one: a "you are offline" line on a screen that works offline is dishonest.

### The code will not draw

`Qr` returns `null` when `value` cannot be encoded (`Qr.tsx:27`), and the parent cannot see it, so
there is no JS branch and no error copy. Two things cover it instead:

1. `.qr-plate:empty { display: none }` hides the plate at every call site, so an empty white box can
   never appear on this screen, the add sheet or the group sheet.
2. The address is always rendered beneath the plate as real, selectable text, so there is always a
   route to the app whether the code draws or not, and whether the visitor's camera works or not.

In practice the branch is unreachable here: the value is `location.origin + BASE_URL`, a URL of a few
dozen characters produced by the browser itself, and `qrcode(0, 'M')` picks a version to fit it.

### Empty state

There is none. The screen is static copy; it has no list to be empty.

### Reduced motion

Nothing on this screen animates, so `prefers-reduced-motion` has nothing to fall back to. Do not add
a transition to satisfy the checklist.

### Accessibility

`Qr` gets `label="Scan to open the Cocktail Passport on your phone"`, because its default is
"Scan to add me" and its own comment (`Qr.tsx:5` to 7) says two QR blocks are indistinguishable to a
screen reader without it. The address beneath the plate is real text, so it is readable and
selectable. The way on is a `<button type="button">` at 44px minimum, from `.quiet-action`. The two
install rows are static `.line` elements with no `role` and no tabstop, because they are not controls.

## Data and state

**No store field, no persist version bump, no migrate step, no change to `partialize`, no new
localStorage key.** This is deliberate and worth stating, because the obvious design adds a
`seenLanding` flag and it is not needed:

- Whether the Landing shows is derived, not stored: `enteredCruise` (already persisted,
  `store.ts:398`, and set to `false` by default by B) plus `isDesktopVisitor()` plus the path.
- The one transient bit is "this visitor pressed the way on", which lasts until they finish the entry
  screen and `enterCruise` sets `enteredCruise` (`store.ts:162` to 167). That is a `useState(false)` in
  `App`, nothing more. A reload while still on the entry screen shows the Landing again, which is
  correct: they have not entered anything yet.
- Keeping E out of `store.ts` also keeps it off the file both B and C write to (product brief, File
  contention), which is the whole reason the workstreams are sequential.

The price slot is a module-scope constant in `Landing.tsx`, not state and not configuration:

```ts
// The price slot. Charles has not decided what is sold or for how much (product brief, E, and the
// open question at the foot of this spec's own file), so this is null and the module does not render.
// Setting it to a sentence is the only change needed; nothing else on the screen moves. It never
// carries a number that has not been decided, and it never says "free" either: zero is a price too.
// The shape, so the decision is a number rather than a blank page:
//   'One passport per sailing, £__, paid once.'
// Anything beyond the amount and how often (what happens after, advertising, refunds) is a promise
// about the business, so it is his sentence to write, not one to draft for him.
const PRICE_LINE: string | null = null
```

Rendered as `{PRICE_LINE && <p className="t-meta landing-price">{PRICE_LINE}</p>}`: one meta line, one
sentence, in the slot at position 5. Until he rules the module is absent rather than empty.

The QR value is built the way `AddCrewSheet.tsx:60` builds the share link:
`` `${location.origin}${import.meta.env.BASE_URL}` ``. No canonical host constant and no fallback: on
the live site it encodes cruise.charlesbee.org, on a Cloudflare preview it encodes the preview, and
on the dev server it encodes 127.0.0.1, each of which is the address the person in front of the
screen is actually looking at. The address line beneath it is
`` location.host + (import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL) `` , the display
form of the same value; `base` is `'/'` today (`vite.config.ts:8`), so the branch is there so the two
cannot drift if it ever is not.

## Backend

None. No RPC, no table, no policy, no `supabase/config.toml` change. The Landing renders before any
identity exists and asks the backend nothing; `qaNoSync()` is irrelevant to it beyond keeping the
screenshots off the live project.

## Implementation steps

Each is one commit. **Step 0 is not optional**: confirm `store.ts:143` reads `enteredCruise: false`
and persist `version` is 9 (B's step 1). If not, E does not start.

1. **`src/data/model.ts`**: add `qaLanding()` immediately after `qaNoSync()` (currently 135 to 137),
   same shape and the same doc-comment style: read `?landing=`, return `'desktop'` or `'phone'` when
   the value is exactly one of those, otherwise `null`. The comment says it is a QA override, that
   `desktop` also forces the root gate open because `?seed` always migrates the store to entered, and
   that `phone` only pins the branch.
2. **`src/styles/base.css`**: mint two rules after `.panel` (after line 94, so both outrank it on
   source order).
   - `.qr-plate { justify-self: center; padding: var(--s3); background: var(--on-accent);
     line-height: 0 }` and `.qr-plate svg { display: block }`, the body copied from `friends.css:131`
     to 137, with one comment line: a code has to read under a camera, so the plate is white whatever
     the ground is.
   - `.qr-plate:empty { display: none }`, with one comment line: `Qr` returns null for a value it
     cannot encode and a parent cannot see that, so the plate hides itself rather than showing an
     empty white box.
   - `.quiet-action { display: block; margin-top: var(--s5); min-height: var(--ctl);
     font-size: var(--f-meta); font-weight: 600; color: var(--ink-2); text-decoration: underline;
     text-underline-offset: 3px }`, the body copied from `friends.css:50` to 59, keeping that rule's
     two-line comment about why it is still 44px of target.
3. **`src/features/friends/friends.css`**: delete `.addme-qr` and `.addme-qr svg` (131 to 137) and
   `.friends-quiet` (50 to 59) now that `base.css` owns both. Keep `.addme-qr-skel` (138 to 143): it is
   the add sheet's loading placeholder, not part of the plate.
4. **The sweep step 2 obliges**: `AddCrewSheet.tsx:240` and `GroupSheet.tsx:132` change
   `className="panel addme-qr"` to `className="panel qr-plate"`; `AddCrewSheet.tsx:289` changes
   `className="friends-quiet"` to `className="quiet-action"`. Three lines, no other change.
5. **`src/features/landing/landing.css`** (new). The gate shape mirrors B's `.entry` but in tokens:
   ```css
   .landing { position: relative; min-height: 100dvh; display: grid; grid-template-rows: auto 1fr; }
   .landing-body { display: grid; align-items: center; padding: var(--s6) 0 max(var(--s6), var(--safe-b)); }
   .landing-head { display: grid; gap: var(--s2); }
   .landing-code { display: grid; gap: var(--s3); }        /* the plate centres itself: .qr-plate has justify-self */
   .landing-addr { text-align: center; }
   /* not .row-copy: base.css:148 clamps its children to one line, and an install step is a sentence */
   .landing-step { display: grid; gap: var(--s1); min-width: 0; flex: 1; }
   .landing-note { margin-top: var(--s3); }
   .landing-price { margin-top: var(--s5); }
   ```
   No literal off the spacing scale, no colour, no radius, no shadow, no `backdrop-filter`, so nothing
   here needs a line in `tools/qa/design-allow.txt` and none may be added.
6. **`src/features/landing/Landing.tsx`** (new). Export `isDesktopVisitor()` as written in Behaviour,
   and `Landing({ onContinue, continueLabel }: { onContinue: () => void; continueLabel: string })`.
   Hold `PRICE_LINE` at module scope. Build the encoded value and the display address in one `useMemo`.
   Own `<div className="ground" aria-hidden />` as `Entry.tsx` does (`CruisePicker.tsx:21` before B's
   rename), then `.landing` with
   `<Masthead />` in row 1 and `.landing-body > .wrap` in row 2 holding modules 2 to 6. Branch on
   `isDesktopVisitor()` for module 3 and on `matchMedia('(display-mode: standalone)')` for module 4.
   Read nothing from the store.
7. **`src/app/App.tsx`**: four edits.
   (a) Add `GetRoute`, a copy of `WrappedRoute` (21 to 24), passing
   `onContinue={() => navigate('/')}` and `continueLabel="Open your passport"`.
   (b) Add `<Route path="/get" element={<GetRoute />} />` beside the `/wrapped` route (184), outside
   `<Route element={<Shell />}>`.
   (c) In the default export, add `const [skipLanding, setSkipLanding] = useState(false)` beside B's
   `forced` state, and put the desktop branch **immediately above B's `Entry` gate**:
   ```tsx
   if ((!enteredCruise || qaLanding()) && !skipLanding && (atRoot() || atGet()) && isDesktopVisitor())
     return <Landing onContinue={onLandingContinue} continueLabel="Open it in this browser instead" />
   ```
   where both tests compare a trailing-slash-trimmed path, because somebody typing the address off a
   card produces `/get/` as often as `/get`:
   ```ts
   const path = () => location.pathname.replace(/\/$/, '')
   const base = () => import.meta.env.BASE_URL.replace(/\/$/, '')
   const atRoot = () => path() === base()
   const atGet = () => path() === base() + '/get'
   ```
   The path test is not optional: the gate
   sits in front of every route, and a desktop visitor tapping an `/add` link must reach `AddRoute`,
   not a landing page. `atGet()` is equally not optional, for the reason under `/get`, desktop.
   (d) `onLandingContinue` rewrites the address before it stands the gate down, keeping the query
   string so `?nosync` and the rest survive:
   ```ts
   const onLandingContinue = () => {
     if (atGet()) history.replaceState(null, '', import.meta.env.BASE_URL + location.search)
     setSkipLanding(true)
   }
   ```
   `GetRoute`'s own `onContinue` still uses `navigate('/')`, which is the path taken when the gate did
   not fire because the visitor has already entered.
8. **`docs/DESIGN.md`**: add a **Landing** section under Screens **directly after B's Entry section**,
   carrying the five-second read, the two rank orders, the geometry paragraph and both folds from
   Design placement above; and add registry rows for `.qr-plate` (`base.css`, the white plate under any
   `Qr`, hides itself when empty, swept across the add sheet, the group sheet and the landing),
   `.quiet-action` (`base.css`, the quietest text action on a screen, 44px, swept from
   `.friends-quiet`), and `Landing` plus `isDesktopVisitor()` (`src/features/landing/Landing.tsx`, the
   desktop install path and the width-plus-pointer test). Add `?landing=desktop|phone` to the existing
   `nowHour(), today()` registry row, which is where the QA overrides are listed and where B has just
   added `?entry`. Merge into the document; change nothing else in it.
9. **`tools/qa/shot.mjs`**: replace `const W = 390, H = 844` (line 24) with
   `const W = Number(process.env.SHOT_W || 390), H = Number(process.env.SHOT_H || 844)`. Defaults
   unchanged, so every existing command behaves exactly as before, and `shots.mjs` is untouched because
   it declares its own `W`/`H`. This is the only way the desktop layout gets a real render.
10. **`tools/qa/README.md`**: add `?landing=desktop|phone` to the paragraph that lists `?day`, `?hour`,
    `?nosync` and B's `?entry`, saying that `desktop` also forces the root gate open; and one sentence
    beside the existing `SHOTS_DIR` note that `SHOT_W`/`SHOT_H` widen `shot.mjs` only. Merge; do not
    rewrite the table.
11. **`CLAUDE.md`**: merge two lines into Operating notes: `/get` is the install landing and it also
    renders at `/` for a desktop first-open; `?landing=` and `SHOT_W`/`SHOT_H` are how it is rendered
    headlessly. Do not touch anything else in the file.

## Verification

One dev server on 5173 already; never start a second (`STATE.md`, Gotchas). Commands are given for
Git Bash, which is what `tools/qa/README.md` uses; the two that set environment variables have their
PowerShell form beside them, because `VAR=x node …` is a parse error in PowerShell.

**The trap to know first.** `shot.mjs` appends `?seed` to every URL (line 33), and the seed block
writes `spcc2` at `version: 2` (`index.html:86`), which `migrate` upgrades through the `from < 5`
branch that sets `enteredCruise = true` (`store.ts:362` to 366), and after B through `from < 9` as
well. **A seeded shot can never reach the gate.** That is why step 1 makes `?landing=desktop` force it
open, and why the four gate shots below carry `landing=`. The `/get` shots need no override at all,
because an entered store is exactly the state in which `GetRoute` renders.

**Step 0, before any edit.** Take the before-shot of the plate that steps 2 to 4 sweep, so "exactly as
before" has a reference:

```
node tools/qa/shot.mjs qr-addsheet-before "social?nosync" --click ".social-add" --click2 ".friends-sheet > .addme-actions .btn:last-child" --after 3000
```

`?nosync` is not optional: without it every run signs in a fresh anonymous user on the live project
(product brief, last rule; `STATE.md`, Gotchas). `.social-add` is `Social.tsx:131`; the second
selector is the "Show my code" button, the last `.btn` in `AddCrewSheet.tsx:228` to 236, matched by
`friends.css:167`.

**The gate and the two branches.**

```
node tools/qa/shot.mjs land-desktop "home?landing=desktop&nosync" --full
node tools/qa/shot.mjs land-gate-phone "home?landing=phone&nosync" --full
node tools/qa/shot.mjs land-entered "home?nosync" --full
SHOT_W=1280 SHOT_H=800 node tools/qa/shot.mjs land-wide "home?landing=desktop&nosync" --full \
  --eval "({ plateInFold: document.querySelector('.qr-plate').getBoundingClientRect().bottom <= innerHeight, modules: document.querySelectorAll('.landing-body .section').length })"
```

PowerShell form of the last one:
`$env:SHOT_W=1280; $env:SHOT_H=800; node tools/qa/shot.mjs land-wide "home?landing=desktop&nosync" --full --eval "…"; $env:SHOT_W=$null; $env:SHOT_H=$null`

- `land-desktop`: the five rendered modules in rank order, the plate the only boxed thing, the address legible
  beneath it, the install rows separated by one hairline and not clipped, no price line. This is the
  desktop branch squeezed into a 390 viewport, which is not a viewport it can really be seen at; it is
  shot only to prove nothing overflows when it is.
- `land-wide`: the same at the viewport the branch is for. Its geometry line must print
  `viewport 1280`, and its probe must print `{"plateInFold":true,"modules":2}`. That is the fold claim
  checked directly rather than through `docHeight`: the whole screen is about 816 tall (see the height
  budget under Design placement), so it is expected to run past an 800px window, and asserting a
  `docHeight` of 800 would fail a screen that is correct. What must not happen is the plate falling
  below the fold, because it is the reason the screen exists. `modules: 2` is the two `.section`
  blocks, the code and the install steps, which catches a module lost or duplicated.
- `land-gate-phone`: **Home**, not the Landing and not the entry screen. `?landing=phone` pins E's
  branch off; the seed has already migrated `enteredCruise` to true, so B's gate does not fire either.
  What this shot proves is the claim that belongs to E: `?landing=phone` never renders the Landing at
  `/`. B's phone first-open screen cannot be shot with `?seed` at all, for the same reason, and
  verifying it is B's job through `tools/qa/first-open.mjs`, not this one's.
- `land-entered`: Home, proving a returning visitor never meets the Landing.

Every one of the four must print its `viewport … scrollWidth … docHeight …` line **without**
`HORIZONTAL OVERFLOW`, and must print no `console:` line.

**The real media query, with no override.** This is the only check that exercises `isDesktopVisitor()`
itself rather than the QA branch. Headless Chrome reports `hover: hover` and `pointer: fine` at every
emulated size (measured, see What exists), so the width leg is the one a render can refute, and these
two runs refute it in both directions:

```
node tools/qa/shot.mjs land-media-phone "get?nosync" --full \
  --eval "({ plate: !!document.querySelector('.qr-plate'), steps: document.querySelectorAll('.landing-step').length, wayon: document.querySelector('.quiet-action')?.textContent })"
SHOT_W=1280 SHOT_H=800 node tools/qa/shot.mjs land-media-desktop "get?nosync" --full \
  --eval "({ plate: !!document.querySelector('.qr-plate'), steps: document.querySelectorAll('.landing-step').length, wayon: document.querySelector('.quiet-action')?.textContent })"
```

PowerShell form of the second: set `$env:SHOT_W` and `$env:SHOT_H` as above, run the same line, then
clear them.

- `land-media-phone` must print `{"plate":false,"steps":2,"wayon":"Open your passport"}` and
  `viewport 390 … docHeight 844`. The phone branch is about 470 of 844, so `docHeight` is safe to gate
  on here: anything above 844 means the phone branch has grown a module or lost its budget.
- `land-media-desktop` must print `{"plate":true,"steps":2,"wayon":"Open your passport"}` and
  `viewport 1280`. Do not gate on its `docHeight`, for the reason given under `land-wide`.

`wayon` is "Open your passport" in both because the seed leaves the store entered, so `GetRoute` is
what renders: that is also the check that `continueLabel` is a prop and not a store read.

**The path test, which is the load-bearing line of step 7(c).**

```
node tools/qa/shot.mjs land-add-desktop "add?landing=desktop&nosync" --full
```

Must show `AddRoute` (the "That add link looks incomplete" screen, since there is no fragment), **not**
the Landing. If the Landing appears, `atRoot()`/`atGet()` are missing or wrong and every invite link
is broken for desktop visitors.

**The screen's own facts.**

```
node tools/qa/shot.mjs land-probe "home?landing=desktop&nosync" \
  --eval "({ qr: !!document.querySelector('.qr-plate svg path')?.getAttribute('d'), label: document.querySelector('.qr-plate svg')?.getAttribute('aria-label'), addr: document.querySelector('.landing-addr')?.textContent, steps: document.querySelectorAll('.landing-step').length, price: !!document.querySelector('.landing-price'), quietColour: getComputedStyle(document.querySelector('.quiet-action')).color, plateBg: getComputedStyle(document.querySelector('.qr-plate')).backgroundColor, wayon: document.querySelector('.quiet-action')?.textContent })"
```

Must print exactly:

```
eval: {"qr":true,"label":"Scan to open the Cocktail Passport on your phone","addr":"127.0.0.1:5173","steps":2,"price":false,"quietColour":"rgba(28, 60, 86, 0.74)","plateBg":"rgb(255, 255, 255)","wayon":"Open it in this browser instead"}
```

`price:false` is the honest state, not a failure: the slot stays empty until Charles rules.
`quietColour` is `--ink-2` and must not be any coral. `plateBg` is `--on-accent` and proves the plate
beat `.panel`'s translucent fill on source order. `wayon` here is the gate's label, against "Open your
passport" in the two `/get` runs above: the pair is what proves `continueLabel` is a prop rather than
a store read, since the seed leaves `enteredCruise` true in both. The `?.` on the `querySelector`
chains matters: without it a missing element throws inside `Runtime.evaluate` and the run dies with a
stack instead of printing `false`.

**Network proof, the claim that matters most on this screen.**

```
node tools/qa/shot.mjs land-net "home?landing=desktop&nosync" \
  --eval "(() => { const r = performance.getEntriesByType('resource'); return { total: r.length, offOrigin: r.map(e => e.name).filter(n => !n.startsWith(location.origin)) } })()"
```

Must print `offOrigin: []`: nothing off-origin is fetched, so the code is drawn locally. `total` is
printed alongside because the resource buffer caps at 250 entries; a `total` at 250 means the buffer
filled and the empty list proves less than it looks, in which case rerun against a preview build
(`npm run build && npm run preview`, `SHOT_BASE=http://127.0.0.1:4173`), where the module graph is one
bundle and the count is small.

**Regression on the swept plate and the swept quiet action**, because steps 2 to 4 touch two live
sheets:

```
node tools/qa/shot.mjs qr-addsheet-after "social?nosync" --click ".social-add" --click2 ".friends-sheet > .addme-actions .btn:last-child" --after 3000
```

Compare against `qr-addsheet-before` from step 0: the add sheet's QR on its white plate, and "Paste a
code instead" underlined at meta size in `--ink-2`, must be pixel-identical apart from anything the
run's own timing changes. `GroupSheet.tsx:132` has no seeded render (the seed block creates no groups),
so its plate is verified by the class change plus `tsc` and named here as such rather than claimed as
rendered.

**Standing gates, all four required before this is reported done.**

```
node tools/qa/scan.mjs src/features/landing src/styles/base.css src/features/friends
npm run design:check
npm run lint
npx tsc -p tsconfig.app.json --noEmit
```

`scan.mjs` must name no suspect in any of the three targets. `design:check` must exit 0 and print
`design:check: N files, clean`, with **no new line added to `tools/qa/design-allow.txt`**: nothing in
this workstream is a genuine exception, so an addition there would be a scanner-widening, which
`DESIGN.md` forbids. `lint` must show 0 errors (28 warnings are known, counted on `product` on
10 September). `tsc` must print nothing.

**No test file.** There is no test runner in this repository (`package.json` has no `test` script, no
vitest, and no `.test.` file exists under `src` or `tools`), and this workstream is not the place to
introduce one. The probes above are the mechanical checks in its place.

## Files touched

The brief's contention map names A, C and B only, so E's set is declared here and kept as small as it
can be. Workstreams run sequentially, and E runs after B and before BYO, so nothing here has a
concurrent writer.

- `src/features/landing/Landing.tsx` (new)
- `src/features/landing/landing.css` (new)
- `src/app/App.tsx`: the `/get` route and the desktop branch of the gate. Listed under B in the
  brief; E runs after B, so there is one writer at a time.
- `src/data/model.ts`: `qaLanding()`. Justified: every QA override in the app lives in this file
  beside `qaNoSync()`, B has just added `?entry` there, and `DESIGN.md`'s registry points there.
- `src/styles/base.css`: `.qr-plate` and `.quiet-action`. Justified: `DESIGN.md` rule 4 forbids a
  second copy of an existing pattern; the plate already has two call sites and the quiet action one.
- `src/features/friends/friends.css`, `AddCrewSheet.tsx`, `GroupSheet.tsx`: the sweeps the mints
  oblige, three changed lines and two deleted rules. Justified: rule 4, which requires the sweep in
  the same change.
- `docs/DESIGN.md`: the Landing screen section and four registry entries. Required by rule 6.
- `tools/qa/shot.mjs`, `tools/qa/README.md`: `SHOT_W`/`SHOT_H` and the `?landing=` note. Justified:
  the desktop layout cannot otherwise be rendered, and the harness is documented where it lives.
  `shots.mjs` is deliberately not touched: it carries its own `W`/`H`.
- `CLAUDE.md`: two merged lines in Operating notes, as the brief's rules require.

Not touched: `index.html`, `public/*`, `vite.config.ts`, `src/state/store.ts`, `src/ui/Qr.tsx`,
`src/app/Shell.tsx`, `src/app/Masthead.tsx`, `src/features/cruise/*`, `supabase/*`.

## Out of scope

- **`beforeinstallprompt`.** A real "Add to home screen" button on Android Chrome needs the event
  captured at module scope before it fires, plus state for the deferred prompt and an `appinstalled`
  listener. The brief's E is instructions, the event does not exist on iOS at all, and it would put a
  second install route on the screen for one platform. Instructions only.
- **A desktop layout of the app itself.** Nothing about Home, Drinks, Ship, Crew or You changes at
  desktop width; the Landing exists precisely so that question does not have to be answered yet.
- **Marketing.** No screenshots of the app, no feature list, no testimonials, no comparison, no
  second page. The brief is explicit: the thesis is an instrument, not a brochure.
- **`index.html` title, description and Open Graph cards.** They name the Sun Princess. Generalising
  them is part of making the product any-sailing and belongs with BYO, not here.
- **`public/sitemap.xml`.** `/get` is crawlable through `robots.txt` as it stands; adding a second
  sitemap entry is an SEO decision, not an install one.
- **Payment.** No checkout, no Stripe, no licence key. The price slot is a line of text.
- **Workstream B's first-open screen.** The phone branch of the gate is B's, unchanged here, and the
  two lines of `store.ts` E depends on are B's to land.

## Open questions for Charles

1. **The price line.** What goes in the slot, in his words? Today `PRICE_LINE` is `null` and nothing
   renders, which is what the brief asks for, so this does not gate the build. The shape in the code
   comment leaves the amount blank, "One passport per sailing, £__, paid once.", so the decision is a
   number rather than a blank page. He decides the number, whether it is once per sailing or once
   outright, whether the line ever says the app is free (a price of zero is still a price, and stating
   it is a business decision), and anything it promises beyond the amount.
2. **May a desktop visitor open the passport in the browser at all?** The default here is yes, as one
   quiet underlined text action at the foot ("Open it in this browser instead"), because refusing
   somebody their own data on the machine in front of them is not honest. If he would rather the
   desktop path be install-only, the control comes out and the screen loses nothing else, because the
   `/get` rendering keeps its own "Open your passport" for people who are already in. This is a taste
   call with a working default, so it does not gate the build either.
3. **`index.html`'s title, description and Open Graph cards still say "Sun Princess".** Flagged, not
   fixed: it is the share preview under his name and it belongs with the any-sailing work. Does he
   want it generalised when BYO lands, and to what?
