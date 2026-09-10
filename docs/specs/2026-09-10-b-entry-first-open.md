# Entry and first open, with the honesty and privacy copy

Workstream B of `docs/specs/2026-09-10-product-brief.md`. Built on branch `product`, after A and C,
before E. Read `docs/DESIGN.md` in full first; this spec places itself inside it and adds one screen
section and three registry rows to it.

## Purpose

A first open asks three things once, on one screen: which sailing, who you are, and whether data may
leave the phone. Then it never asks again.

It closes two failures outright and narrows a third:

- **An anonymous user and three server rows are created before anything on screen has said so.**
  `sync.ts` 183 to 191 publishes at module load, so a cold first open signs in anonymously and writes
  `profiles`, `passports` and `backups` while the first screen is still up. The sync gate below stops
  that until Done.
- **The picker has never rendered**, because `App.tsx` 167 gates it on `CRUISES.length > 1`. It
  becomes the first-open screen and `enteredCruise` decides.
- **The "A friend" rows on the live project.** The screen asks for a name before anything is
  published, which is where those rows came from, but the name stays optional here (see Behaviour),
  so asking alone does not close it. What narrows it is the third `sync.ts` edit: the fallback at
  `sync.ts` 64 that writes the literal string `A friend` into `profiles.name` goes. State the scope
  of that precisely, because it is not total. `profiles.name` is the column `find_profiles` and both
  feeds read, and it is what the sixteen visible rows are; after the edit it is never fabricated. The
  same literal still reaches `passports.payload.n`, because `sync.ts` 66 publishes
  `buildPayload(s.me, s.profile)` and `share.ts` 92 applies the fallback there; that value sits
  inside a jsonb blob no SQL reads, and `share.ts` is in no workstream's contention map, so it is out
  of scope (see Out of scope). Do not claim this screen, or this workstream, removes the fabricated
  name everywhere.

## What exists

Line numbers are from the files as read on 10 September 2026 on branch `product`. **They are for
orientation only.** Workstream C rewrites `store.ts`, `sync.ts` and `ProfileSheet.tsx` before B
starts, and workstream A touches `Sheet.tsx`, so every number below may have moved. Anchor on the
symbol named beside it (`enterCruise`, `mode()`, `useStore.subscribe`, `migrate`) and re-read the
file; never patch by line number.

- **`src/features/cruise/CruisePicker.tsx` (1 to 46).** The unrendered first-run screen.
  `prettyRange(start, end)` (6 to 13) formats "3 to 17 October 2026" from two ISO dates: keep it
  verbatim. Line 21 renders `<div className="ground" aria-hidden />`, because this screen renders
  outside `Shell` and so has to bring its own ground: keep that too (see Design placement, module 0).
  The rest predates the design pass and contradicts the constitution: `.glass card` (line 32) is
  glass in the content layer, and two `.eyebrow` kickers (lines **25** and **34**) sit above headings.
  Reuse the helper, the ground div and the `enterCruise` call; the markup is rewritten.
- **`src/features/cruise/cruise.css` (1 to 26).** `.cruise-gate` centres a `100dvh` grid; every other
  rule belongs to the card that goes. Nothing outside this folder uses a `.cruise-*` class (grep
  confirms: the only reader is `CruisePicker.tsx` itself), so all six rules are replaced. The file
  stays at the same path.
- **`src/app/App.tsx` (163 to 188).** `enteredCruise` is read at 164 and the gate at 167 is
  `if (!enteredCruise && CRUISES.length > 1)`. `AddRoute` (45 to 101) and `JoinRoute` (106 to 150)
  both render `<NameCard lead=…/>` before they act, because `befriend` and the group RPCs resolve a
  member through their profile row: this is the pattern the entry screen generalises.
- **`src/app/Shell.tsx` (24 to 47).** Owns the masthead: `header.app-head` with `.brand`
  (`IconDrinks`) and `.brand-name`, rendered only when `pathname !== '/'` (line 30), and the
  `.ground` div (line 29) and `main.view` (38). This is the markup Home gains and the entry screen
  reuses.
- **`src/features/social/Social.tsx` (22 to 72).** `NameCard`: a `.panel` holding an `h1`/`h2`
  ("What should your crew call you?"), an optional `lead`, the `Your name` field, the `Your colour`
  six-dot picker, and its own `Done` that writes `setProfile({ name: draft.trim() })`. The draft is
  local (line 25); the colour writes on tap (line 55); Done is `disabled={!draft.trim()}` and takes
  `btn-coral` only when there is a name (62 to 69). The mechanism to reuse is the field pair; the
  card's own `Done` is what the entry screen must not have twice.
- **`src/features/friends/friends.css` (6 to 43).** **This is where `.f-field input`, `.f-field
  textarea`, `.fpick` and `.fpick-dot` are actually styled.** `base.css` 202 to 203 carries only
  `.f-field` and `.f-label`. `Social.tsx` imports `'../friends/friends.css'` at line 17, which is the
  only reason `NameCard`'s fields have a box at all. Any file that renders the field pair must import
  it or the inputs render borderless and the colour dots collapse. Lines 105 to 106
  (`.addme-find > .f-field, .addme-find > .f-field > .f-label { margin-top: 0 }`) are the named
  precedent for zeroing `.f-field`'s own `margin-top` inside a container that sets its own gaps.
- **`src/styles/base.css`.** `.row` / `.row-copy` (136 to 148): `.row:not(:only-child)` squares the
  radius at 144, and **`.row-copy > *` is `white-space: nowrap; text-overflow: ellipsis` at 148**, so
  every line of a row's copy is one line and clips. `.section > h2, .section-head` carries the 8px
  heading-to-content margin at 82: **an `h3` inside `.section` gets nothing**, which is why the
  privacy sheet wraps each `h3` in a `.section-head`, as Home already does with its `h2`.
  `h1, h2, h3, p { margin: 0 }` at 61, so all vertical rhythm is the container's.
- **`src/features/home/Home.tsx` (181 to 201) and `home.css` (4).** `.home` sets
  `padding-top: calc(var(--s4) + var(--safe-t))` because nothing sits above it today. `Home.tsx`
  itself needs no change.
- **`src/features/you/You.tsx` (16 to 27).** The masthead is already above this screen; the segmented
  control and `h1` start at `.page`'s `var(--s3)` (`shell.css`). This is the spacing Home inherits.
- **`src/state/store.ts`.** `enteredCruise: CRUISES.length === 1` (143), `enterCruise` (162 to 167,
  writes `setActiveCruise`, sets both fields, reloads only when the id changes), persist `name: 'spcc2'`,
  `version: 8` (349, 350), `migrate` (352 to 394), `partialize` (396 to 400, already carries
  `cruiseId` and `enteredCruise`). `ensureIdentity()` runs at hydrate (407) and is local only.
- **`src/data/cruises.ts` (29 to 61).** `CRUISES` (one entry: `sun-princess-2026`), `activeCruiseId`,
  `activeCruise`, `setActiveCruise` (localStorage key `spcc-cruise`), `cruiseById`.
- **`src/features/friends/ProfileSheet.tsx` (33 to 90).** Title "Your details", one `.sheet-meta`
  line, name, colour, code, the sync line, and `Delete my data` in `.friends-danger` (which renders
  only when `hasBackend()`). Workstream C adds sign-in, restore status and the guest honesty line
  here; B adds one row.
- **`src/state/sync.ts`.** At module load (183 to 191), `if (mode() !== 'off') queueMicrotask(syncNow)`.
  `mode()` (31 to 33) consults only `hasBackend()` and `qaNoSync()`. So today a cold first open
  signs in anonymously and writes while the first screen is still up. This is the fact the consent
  line cannot be written around. `useStore.subscribe` (173 to 175) watches `me`, `profile` and
  `unsent` only. `markPending()` (45 to 54) calls `updateVisibleInterval()` itself when the mode is
  not off. **`publishBackend` line 64 is `upsertProfile(s.profile.code, s.profile.name || 'A friend',
  s.profile.colour || 'aqua')`**: the one place in the codebase where a fabricated name is written to
  the server.
- **`src/state/supabase.ts`.** `getSupabase()` is a **dynamic** `import('@supabase/supabase-js')`, so
  the library is never downloaded until a call needs it. `backend.ts` line 9 imports `./supabase`
  **statically**, and the Vite dev server rewrites that to a request for `/src/state/supabase.ts` on
  every load. Verification below depends on both facts.
- **`src/data/model.ts` (112 to 137).** `today()`, `nowHour()` and `qaNoSync()` are the QA overrides
  (`?day`, `?hour`, `?nosync`). `qaFirstOpen()` joins them.
- **Backend, for the copy only.** `supabase/migrations/0001_init.sql`: `profiles` (21 to 27: `code`
  unique not null, `name` and `colour` both nullable `text`, so an empty name is legal),
  `passports` (the lossy shared payload), `backups` (the full owner-only state), `friends`, `groups`,
  `memberships`; **`befriend` (105 to 120) inserts BOTH edges** (117 and 118), so being added is not
  something the added person approves; `delete_my_data` (198 to 213) deletes memberships, groups I
  own, **my own** friend edges, backups, passports and profiles, and its own comment says the auth
  account is a separate admin step. `0002_social_v2.sql` supersedes both feeds and adds `unfriend`
  (25 to 41), which cuts both edges; `friend_feed` (99 to 110) and `group_feed` (112 to 128) are the
  functions that actually decide who sees what, and they join `profiles`, so a deleted profile takes
  the person out of everyone's feed. `0003_find_profiles.sql` (1 to 9): anyone in the app can find
  anyone who has set a name, and only name, colour and code are returned; the `coalesce(p.name, '')
  <> ''` test means a guest with no name is not findable. `src/state/share.ts` `shareable` (69 to 77):
  the shared payload carries tried, date, rating, recommend and comment, and therefore **not** notes,
  favourites or wishlist. `MAINTENANCE.md` (38): the project's region is `eu-west-2`, which is London.

## Design placement

A new screen, added to `docs/DESIGN.md` under Screens, above Home.

**Entry.** Read: which sailing, who am I, what does this do with my data. It renders outside `Shell`,
so it carries its own ground and masthead and has no nav.

0. **The ground.** `<div className="ground" aria-hidden />`, the same line `Shell.tsx` 29 renders.
   Not a module: without it the screen falls back to flat `--cream` from `body`, losing the two
   washes and the 3.5% grain that the Material section makes the ground everywhere else. The screen
   itself is a `<main className="entry">`, so it has one landmark, as `Shell`'s `main.view` does.
1. **Masthead** (chrome). The `Masthead` component, the same one `Shell` renders on every other
   screen. Pinned to the top of the viewport, not part of the centred block.
2. **The sailing.** `h1.t-title` with the ship name, then one `p.t-meta` line: line, middle dot,
   dates. Sibling: the sheet's title and its one `.sheet-meta` line (`Sheet`, `badge-sheet`). One
   middle dot on the line, as the Copy rules require.
3. **Name and colour.** `NameFields`, the mechanism lifted out of `NameCard`, inside a
   `div.entry-fields`. On the ground, not in a `.panel`: the sibling here is `ProfileSheet`, whose
   identical field pair sits flat on the sheet. `NameCard` keeps its panel on Crew because it sits
   among other content there; on the entry screen the form is the screen, and a box around the only
   thing present is the fourth banned tell.
4. **What this is.** One `p.t-body`.
5. **The consent line.** One `p.t-meta`, then the privacy note as
   `button.row.pressable.privacy-open` (`.t-strong` primary line, `.t-meta` second line, no
   chevron, `aria-haspopup="dialog"`). Sibling: Home's `Up next` rows, which are `.row` with a
   two-line `.row-copy` and no chevron. It sits inside its own wrapper `div` with no class of its
   own, so `.row:not(:only-child)` (base.css 144) does not square its corners and press tint: an
   isolated row keeps radius 12. The identical row goes into `ProfileSheet`, so the note is reached
   the same way in both places. Both lines are clipped at one line by `.row-copy > *` (base.css 148),
   so neither may exceed about 50 characters at 13px; the strings in Behaviour are inside that.
6. **Done.** `button.btn.btn-wide.btn-coral.pressable.entry-done`, the screen's one filled accent,
   exactly as `NameCard`'s Done and Crew's "Add to your crew" are.

`.privacy-open` and `.entry-done` carry no style of their own; they exist so the QA shots can click
them, as `.social-me` and `.d-open` do on the screens already shot. The class is `privacy-open`, not
`entry-privacy`, because the identical row is rendered twice, here and in `ProfileSheet`: a name tied
to one of the two screens would read as a divergent sibling in the registry, and the shot that opens
the sheet from the profile needs the same selector.

Geometry: `--inset` 16 through `.wrap`; **24 between every one of modules 2 to 6, one rule with no
exception**; 8 from a heading to its content; 16 between the two fields inside module 3; control
height 44; radius 12 on the button and the row, 999 on the colour dots. Colours: `--ink`, `--ink-2`,
`--line`, `--coral-ink` on the one button, the six `--friend-*` hues in the picker. No new token, no
new radius, no shadow, no `backdrop-filter` (the entry screen is not chrome and carries no glass). No
eyebrow, no rule under a heading, no emoji, one dominant element.

`.f-field` carries `margin-top: var(--s4)` of its own (base.css 202). Inside a grid that sets its own
gaps those margins add rather than collapse, which would put 40 above the name field and break the
rule above. `.entry-fields` therefore zeroes them and supplies the 16 itself, following
`friends.css` 105 to 106 (`.addme-find > .f-field`), which does exactly this for the same reason:

```css
.entry-fields { display: grid; gap: var(--s4); }
.entry-fields > .f-field { margin-top: 0; }
```

Height at 390×844, headless, no safe-area inset. Arithmetic, not a guess: masthead 43 (12 + 23 + 8
from `shell.css`), title block 53 (26 + 8 + 18), 24, fields 148 (66 + 16 + 66), 24, what this is 45
(two lines at 22.5), 24, consent 91 (five lines at 18.2), 24, privacy row 59 (8 + 22.5 + 2 + 18.2 +
8), 24, button 44, plus 32 above and below the centred block: **667 of 844.** On a real iPhone the
safe-area insets add about 49, giving roughly 716. It holds, but a consent line that grows past six
lines does not. The screen must not scroll; the shot asserts it and is the only check that counts.

**Home** gains the masthead. Rank order is unchanged: the greeting is still Home's first content
line, and the masthead is chrome above it, as it is on Drinks, Ship, Crew and You. Net cost is about
39px (43 for the masthead, less the 4 that `.home`'s padding gives back), against roughly 784 of
visible content, so the fold (greeting, hero, Today) holds at about 510px; the shot asserts it.

## Behaviour

Every copy string below is final. British English, sentence case, no em dashes.

### First open, backend configured (the normal case)

The store has no persisted state, so `enteredCruise` is `false` and the entry screen renders in place
of the router. No network call is made by this screen, and no sync runs behind it (see Data and state).

- `h1`: the active cruise's ship, from the registry. Today: **Sun Princess**
- meta line: `${cruise.line} · ${prettyRange(cruise.start, cruise.end)}`. Today:
  **Princess Cruises · 3 to 17 October 2026**
- `NameFields`: label **Your name**, placeholder **Your name**, `maxLength` 24, `autoComplete="name"`;
  label **Your colour**, the six dots, each `aria-label` **Use aqua** and so on. All unchanged.
- What this is: **Tick off, rate and log the cocktails aboard, and see what your crew has found. It
  works offline.**
- Consent line: **Tapping Done turns on sync: your name, colour and the drinks you log go to this
  app's own server in London, under your friend code. You do not need to sign in, there is no
  analytics and no advertising, and you can delete it all from Your details at any time.**
- The privacy row: primary line **Privacy note**, second line **What leaves your phone, and how to
  remove it.** (45 characters, so it does not hit the ellipsis at base.css 148.)
- Done: **Done**

The brief says "in the EU"; the project's region is `eu-west-2`, which is London, so the copy says
London. Saying EU of a London region would be inaccurate, and "Honest" is one of the four qualities.
The draft's phrase "nothing is tracked" is not used: Cloudflare and Supabase both keep ordinary
server logs that include IP addresses, which the privacy note says, and a consent line that
contradicted the note two taps away would be the same failure in miniature. "No analytics and no
advertising" is what the code supports, and it answers the brief's "what is never collected".

**Taps.** A colour dot writes `setProfile({ colour })` at once, as it does in `NameCard` and
`ProfileSheet`; it is local, and nothing has left the phone yet. The name field updates local draft
state only, and the draft is initialised from `profile.name` (`useState(() => useStore.getState().profile.name)`),
which is empty on a genuine first open and is what stops a `?entry` run over a seeded or existing
store from showing an empty field beside a name the user already has. The privacy row opens the
privacy sheet. Done is **always enabled**: a name is optional here, because the app has never
required one to log a drink, and `/add`, `/join` and Crew each still ask before anything of yours
goes out under a name. Done, in order:

1. `if (draft.trim()) setProfile({ name: draft.trim() })`
2. `enterCruise(chosen)`, where `chosen` is `CRUISES[0].id` in the single-sailing case.
3. `onDone()`, which clears the `?entry` override in `App` and does nothing else.

`setProfile` runs first because `enterCruise` reloads the page when the chosen id differs from the
persisted `cruiseId` (`store.ts` 166). On a genuine first open the ids match, so there is no reload:
the router mounts in place and the current URL decides the screen.

**Skipping the name is a supported path and has a consequence, which is why `sync.ts` 64 changes.**
With the name left blank, the first sync writes a `profiles` row whose `name` is the empty string
(the column is nullable `text`; see What exists). That row is not returned by `find_profiles`, whose
`coalesce(p.name, '') <> ''` test excludes it, so an unnamed guest cannot be found by anybody. The
row still exists, so `befriend` still works if they later hand out their own link, and the
four client-side `|| 'A friend'` display fallbacks (`share.ts` 154 in `parseFriend`, `store.ts` 100
for a feed row, `Shell.tsx` 16 for the toast, `AddCrewSheet.tsx` 110 for the share text) still print
"A friend" on the other phone until a name is set. That is the right behaviour and none of them
changes.

The exact claim, and no more: **`profiles.name` is never fabricated after this edit.** That is the
column `find_profiles`, `friend_feed` and `group_feed` read, and it is what the sixteen live rows
are. Two other `|| 'A friend'` writes remain and are out of scope, both in `share.ts`, a file in no
workstream's contention map:

- **`share.ts` 92**, the tail of `buildPayload`, which `sync.ts` 66 hands to `publishPassport`. So
  `passports.payload.n` still holds the literal for a nameless guest. It sits inside a jsonb blob
  that no SQL reads and that only the owner's own row-level policy exposes, and `parseFriend` 154
  normalises it on receipt, so changing it would alter nothing a person sees. If a later pass wants
  the strong claim, `n: profile.name` is the one-token edit, and `share.ts` joins Files touched.
- **`share.ts` 101**, `buildCard`, the identity card in a QR or an `/add#SPP…` link. That card is
  read on a phone with no server, so it has to carry something printable. Leave it.

### Returning open

`enteredCruise` is `true`, so `App` renders the router and the entry screen never mounts. Nothing
about Home, Drinks, Ship, Crew or You changes except that Home now carries the masthead.

### An existing user upgrading

Persist version 8 to 9. The migration marks the store entered, so nobody mid-voyage is asked to
enter a sailing they are already on, or asked to consent to sync that has been running for weeks.

### A tapped invite link on a cold phone

`/add#SPP…`, `/join#INVITE`, `/wrapped` or any other route on a phone with no store: the entry screen
renders first, because consent has to precede the first `befriend` or `join_group`. The URL is not
touched, so after Done the router mounts on the original path with its fragment intact and the flow
continues: `AddRoute` finds a name already set and goes straight to the tick, and `JoinRoute` the
same. The sender's lead line ("Sam is adding you") does not appear on the entry screen; the sender's
name appears on the `Confirm` tick a moment later, which is where it is needed.

### Offline, and no backend configured

Two different things, and the app already distinguishes them (`JoinRoute`'s comment at `App.tsx` 116
to 117).

- **No signal.** The entry screen makes no request, so it behaves identically. Nothing to say and
  nothing is said.
- **`hasBackend()` false** (a build with no Supabase env vars). The consent line is replaced by:
  **This version of the app has no server, so nothing leaves this phone. Your passport is stored on
  this phone only.** The privacy row and the sheet stay. The sheet gains one first paragraph,
  **This version of the app has no server configured, so nothing described below leaves your phone.**,
  and the three sections that describe a server are not rendered at all: **Who can see it**, **Where
  it is kept** and **Deleting it**, along with the second paragraph of **What is stored** (the
  private restore copy). Rendering them under a disclaimer would leave one sheet saying two things.

### Errors

There are none to report: the screen makes no call, and both writes are local and synchronous. There
is no waiting state, no failure state and no retry. Nothing renders a spinner.

### Storage blocked

In a browser that refuses `localStorage` (private mode, or site data blocked), the persist middleware
never rehydrates and never writes, so `enteredCruise` stays at its new `false` default and the entry
screen appears on **every** launch. Today it does not, because the default is `CRUISES.length === 1`.
This is a real regression and it is accepted rather than worked around: in that browser the passport
itself is lost on every launch too, so a one-tap screen is the smallest of the consequences, and it
is the one screen that tells the truth about what is happening. Do not add a session-only flag to
paper over it.

### The privacy sheet

`Sheet` with `labelledBy`, so it dismisses by drag, scrim tap, Escape and the close control like every
other sheet, and its wave opens it. Title **Privacy note** (`h2.t-title.sheet-title`, as every sheet
in the app); meta line **What leaves your phone, and how to remove it.**, the same string the row's
second line uses, exported once as a constant so the two cannot drift. Then the sections below, each
a `section.section` containing `<div className="section-head"><h3 className="t-h2">…</h3></div>`:
`base.css` 82 gives the 8px to `.section > h2` and to `.section-head`, but **not** to a bare `h3`, so
the wrapper is what supplies it, exactly as Home's sections do. `h3` keeps the outline under the
sheet's own `h2` rather than flattening it for a screen reader. This is the whole text, and it is the
same text in both places it is opened from.

Seven headings and about 480 words is longer than "a short sheet" sounds, and it is deliberate: each
heading answers one question a person is entitled to ask about their own data, and dropping one would
mean not answering it. The cut to make, if one is ever wanted, is shorter sentences, never fewer
headings.

**What is stored**

Your name, your colour and your friend code. For each drink: whether you have tried it, the date,
your rating, whether you recommend it, and any comment you write for your crew. Which venues you have
visited. Any drink you add yourself. The sailing you are on.

A second, private copy of the whole passport is kept so it can be restored, and that one includes
your notes, your favourites and your wishlist. Only you can read it.

**Who can see it**

The people in your crew: anyone you have added, anyone who has added you, and the members of any
group you join. They see your name, colour and code, and the drinks you have ticked, rated,
recommended or commented on. They never see your notes, your favourites or your wishlist.

Adding is not something you approve. Once you have set a name, anyone using the app can find you by
name or by code, and adding you makes the crew mutual at once: from that moment they see your
passport and you see theirs, with no request and no acceptance. The search itself returns your name,
your colour and your code, and nothing else, and a guest who has set no name is not findable at all.
Removing someone cuts both sides, and they stop seeing your passport from that moment.

**Where it is kept**

On a server in London, run by Supabase for this app alone and shared with nothing else. The app
itself is served by Cloudflare. Both keep the ordinary server logs any website keeps, which include
IP addresses.

**What is never collected**

No email address, unless you choose to sign in, and then it is held by the sign-in service and never
copied into this app's own tables. No location, no phone number, no date of birth. No analytics, no
advertising, no third-party trackers, and nothing stored on your phone beyond what the app needs to
work offline.

**If you do not sign in**

This paragraph belongs to workstream C, which ships first and writes the honesty line for the Profile
sheet. B does not rewrite it: `GUEST_HONESTY` takes C's wording verbatim, lifted out of
`ProfileSheet.tsx` as C left it, and the sheet renders that constant. The text below is the fallback,
used only if C left no such line to lift.

Your passport lives on this phone. Clear the browser's data, or change phone, and it is gone, your
friend code with it, and nothing can bring it back. Signing in, from Your details, is what makes it
recoverable.

**Deleting it**

Open Your details on the Crew tab and tap Delete my data. It removes your profile, your shared
passport, your private restore copy, your own crew list and your group memberships from the server,
and deletes any group you set up. Once your profile is gone, nobody can look your code up again and
nobody who had added you can still see you. The copy on your phone stays until you clear it yourself.
Nothing expires on its own: what is stored stays until you remove it.

If you signed in with Google, your email address stays with the sign-in service until the account
itself is removed, which is done by hand. Ask at the address below and it will be.

**Who is responsible, and who it is for**

This app is run by one person, not a company. The app is for adults; it is not aimed at anyone under
eighteen. Questions, or a request to see or remove your data: `PRIVACY_CONTACT`.

Foot, one `p.t-meta.privacy-foot`: **Updated 10 September 2026.**

`PRIVACY_CONTACT` is a constant in the same file. While it is an empty string the last sentence and
the Google sentence are not rendered at all: a placeholder address on screen would be worse than no
address. Charles supplies it (Open questions).

### The multi-sailing branch

`CRUISES` has one entry, so this branch cannot render today and no data is invented for it. With more
than one entry the screen is identical except that module 2 becomes `h1.t-title` **Choose your
sailing** and, beneath it, the `Select` primitive (`src/ui/Select.tsx`) with `ariaLabel="Your sailing"`
under an `.f-label` reading **Your sailing**, its options built from `CRUISES` as
``{ value: id, label: `${ship} · ${prettyRange(start, end)}` }``, its value the local `chosen` state
initialised from `activeCruiseId()`. `Select` is chosen over a list of rows because one control at
44px answers a one-of-n question and needs no selected-state colour, and the registry already carries
it: its one consumer today is `src/features/drinks/AddSheet.tsx` (the "Add a missing drink" sheet, two
instances), which is the API to copy. It is verified by `tsc` only, which is stated at the foot of
Verification.

### The `?entry` QA override

`?entry` on any URL renders the entry screen once, whatever the store says, so it can be shot from a
seeded dev server. `index.html` writes the seed at `version: 2`, so the store always migrates through
the `from < 5` step, which sets `enteredCruise = true`: without the override a seeded run can never
see this screen. It is read once into `useState` in `App`, and Done clears it, so the click-through
can be exercised too. It sits beside `?day`, `?hour` and `?nosync` in `src/data/model.ts` and is
documented with them. It does **not** gate sync: `mode()` reads `enteredCruise`, not the override, so
a `?entry` run over an entered store still syncs unless `nosync` is also passed. Every shot command
below passes both.

## Data and state

**Store (`src/state/store.ts`).**

- `enteredCruise` default becomes `false` (was `CRUISES.length === 1`). It is the record that the
  consent line was shown and Done was tapped.
- `cruiseId`, `enterCruise`, `partialize` unchanged. `partialize` already persists `me`, `custom`,
  `friends`, `profile`, `cruiseId`, `enteredCruise`, `groups`, `pendingInvites`, `pendingUnfriends`,
  `seenMedals`; nothing is added or removed.
- persist `version: 8` becomes `9`, with a new migrate step, appended after the `from < 8` block and
  before `return persisted`:

```ts
if (from < 9 && persisted) {
  // The picker is now the first-open screen for everyone, not only for a second sailing. Anyone
  // with a persisted store has been in the app, and has been syncing under the terms the privacy
  // note now states, so they are entered and are not asked again.
  persisted.enteredCruise = true
}
```

The `from < 6` line that reads `if (CRUISES.length === 1) persisted.enteredCruise = true` stays where
it is: it is the history of that release and the new step covers it.

**Why no existing user loses anything.** `migrate` runs only when a persisted store exists and its
version is below 9, and the new step only sets one boolean; nothing is deleted or reshaped. Every
store at version 5 or above already carries `enteredCruise: true` (set by the `from < 5` and
`from < 6` steps), so the new step is belt and braces for the one case that matters: a store whose
`enteredCruise` was somehow false would otherwise be shown a consent screen for sync that has been
running for weeks. A store with no persisted state at all never enters `migrate`, gets the new
`false` default, and sees the screen once, which is the intent.

**No new store field.** A dated consent record is not added (Open questions); `enteredCruise` is the
single flag, and it is already persisted.

**Local component state.** `App`: `forced` from `qaFirstOpen()`. `Entry`: `draft` (the name, lifted
from `NameCard`, initialised from `profile.name`), `privacyOpen`, and `chosen` (multi-sailing only).
None of it persists.

**localStorage keys.** `spcc2` (the zustand persist store, now version 9) and `spcc-cruise` (the
active cruise id, written by `setActiveCruise` inside `enterCruise`). No new key.

**Sync gating (`src/state/sync.ts`).** Without the first two edits the consent line is false, because
`sync.ts` publishes at module load. Three edits:

1. `mode()` returns `'off'` when `!useStore.getState().enteredCruise`, in addition to the existing
   `hasBackend()` and `qaNoSync()` tests. Nothing signs in, nothing publishes and nothing pulls
   before Done. This is safe to read at module load: the persist middleware hydrates synchronously
   from `localStorage`, which is why `store.ts` 407 can call `ensureIdentity()` at module scope.
2. The existing `useStore.subscribe` (173 to 175) gains one branch: when
   `state.enteredCruise && !previous.enteredCruise`, call `markPending()`. Without it nothing syncs
   after Done either: the subscription watches `me`, `profile` and `unsent`, and `setProfile` fires
   while `mode()` is still off, so that change is swallowed and no publish is ever scheduled.
   `markPending()` alone is enough, and is what to write: it calls `updateVisibleInterval()` itself
   (line 50) once the mode is no longer off, so the 60-second interval starts from the same call.
   Nothing is lost by publishing late, because `publishBackend` reads the whole current store rather
   than a diff.
3. Line 64 loses its fabricated name: `s.profile.name || 'A friend'` becomes `s.profile.name`, with a
   comment saying that `profiles.name` is what `find_profiles` and both feeds read and so is never
   given a name the guest did not type, that `find_profiles` already excludes an empty name, that
   the four display fallbacks are client-side and unchanged, and that `share.ts` 92 still puts the
   literal in `passports.payload.n`, which is deliberate and out of scope. This is the edit that
   narrows the "A friend" rows, not the screen. It also means the sixteen live rows are overwritten
   with an empty name the next time each of those users syncs, which takes them out of
   `find_profiles` as well; say so in the commit message.

`ensureIdentity()` at hydrate stays as it is: it mints a uuid and a code locally and touches no
network. `findProfiles`, `befriend` and `joinGroupFlow` are all user-initiated after entry and are
untouched.

## Backend

None. No RPC, no table, no policy, no `supabase/config.toml` change, and no new migration. The
privacy note only describes what `0001_init.sql`, `0002_social_v2.sql` and `0003_find_profiles.sql`
already do; `0002` is the one that governs "Who can see it", because it replaced both feeds and made
`unfriend` cut both edges. If a sentence in the note and the SQL ever disagree, the SQL is right and
the sentence is the bug.

## Implementation steps

Each step is one commit.

1. **`src/state/store.ts`.** Set `enteredCruise: false` at line 143 with a one-line comment saying
   the first-open screen now decides; bump `version` to 9; append the `from < 9` migrate block above.
   Nothing else in the file changes.
2. **`src/data/model.ts`.** Add `qaFirstOpen()` beside `qaNoSync()` (line 135), same shape:
   `typeof location !== 'undefined' && new URLSearchParams(location.search).has('entry')`, with a
   one-line comment naming it a QA override.
3. **`src/state/sync.ts`.** The three edits under Data and state: gate `mode()` on `enteredCruise`,
   add the `enteredCruise` branch to `useStore.subscribe`, and drop the `|| 'A friend'` at line 64.
   Each carries the comment that says why.
4. **`src/app/Masthead.tsx`** (new). Move the `header.app-head` markup out of `Shell.tsx` verbatim,
   comment and all, into `export function Masthead()`. It imports `./shell.css` and `IconDrinks`.
5. **`src/app/Shell.tsx`.** Replace the inline header with `<Masthead />` and drop the `!home`
   condition and the now-unused `home` const, keeping the surrounding comments. `pathname` was its
   only reader, so the `useLocation` import goes with it; `tsconfig.app.json` sets `noUnusedLocals`
   and `noUnusedParameters`, so leaving it behind is a `tsc` error, not a warning. Add one line of
   comment saying Home carries the masthead too, because the app's name has to be somewhere for a
   visitor who arrives cold on the landing screen.
6. **`src/features/home/home.css`.** Change `.home`'s `padding-top` to `var(--s3)` and add one line
   of comment saying the masthead above it now carries the safe-area inset, so the two do not stack,
   and that `var(--s3)` is `.page`'s own value (`shell.css`), which is what makes Home's
   masthead-to-heading gap identical to Crew's. Do not delete the rule.
7. **`src/features/social/NameFields.tsx`** (new). `export function NameFields({ draft, onDraft })`:
   the two `.f-field` blocks lifted out of `NameCard` (`Social.tsx` 34 to 59) unchanged, with the
   colour still read from and written to the store. The comments that explain them travel with them.
   **It imports `'../friends/friends.css'`**, which is the file that owns `.f-field input`, `.fpick`
   and `.fpick-dot`; without that import the entry screen renders borderless inputs and collapsed
   colour dots, because `base.css` styles only `.f-field` and `.f-label`. `Social.tsx` keeps its own
   import of the same file, which is idempotent.
8. **`src/features/social/Social.tsx`.** `NameCard` keeps its `.panel`, its heading, its `lead`, its
   own `draft` state and its own `Done` (including the comment at 60 to 61 about the fill arriving
   with the name), and renders `<NameFields draft={draft} onDraft={setDraft} />` in place of the two
   blocks it just lost. No behaviour changes on Crew, `/add` or `/join`.
9. **`src/features/privacy/PrivacySheet.tsx`** (new), plus `src/features/privacy/privacy.css` with
   exactly two rules and no new value off the scale:
   `.privacy p + p { margin-top: var(--s3); }` (consecutive paragraphs inside a section, since
   `base.css` 61 zeroes every `p` margin) and `.privacy-foot { margin-top: var(--s6); }` (the foot is
   not a `.section`, so it needs the between-sections 32 explicitly). Exports
   `PrivacySheet({ onClose })` and the constants `PRIVACY_CONTACT`, `PRIVACY_SUBTITLE` (the one
   string used by both the row's second line and the sheet's meta line) and `GUEST_HONESTY`.
   The copy is the Behaviour section, verbatim, except that `GUEST_HONESTY` is C's honesty line
   copied character for character out of `ProfileSheet.tsx`; only if C left none does it take the
   fallback paragraph in this spec.
10. **`src/features/cruise/Entry.tsx`.** `git mv src/features/cruise/CruisePicker.tsx
    src/features/cruise/Entry.tsx`, export `Entry({ onDone })`, keep `prettyRange` and the `.ground`
    div unchanged, and write modules 1 to 6 above. Rewrite `cruise.css` in place: delete all six
    existing rules and write `.entry` (a `100dvh` two-row grid, masthead then body), `.entry-body`
    (`display: grid; align-content: center; padding-block: var(--s6) max(var(--s6), var(--safe-b))`),
    `.entry-in` (a `var(--s5)` grid) and `.entry-fields` as given under Design placement. Drop the
    `GlassButton` import with the card. The screen is renamed because it is no longer only a picker,
    and the file stays inside the folder this workstream owns.
11. **`src/app/App.tsx`.** Import `Entry` and `qaFirstOpen`; drop the `CRUISES` import (line 167 is
    its only reader in this file, so it goes, or `tsc` fails on `noUnusedLocals`); replace line 167 with
    `const [forced, setForced] = useState(() => qaFirstOpen())` above the gate and
    `if (!enteredCruise || forced) return <Entry onDone={() => setForced(false)} />`. The `useState`
    sits before the early return, so hook order is unconditional. Rewrite the two-line comment above
    it to say what now decides: `enteredCruise`, not the number of sailings.
12. **`src/features/friends/ProfileSheet.tsx`.** Add the same `button.row.pressable.privacy-open`,
    character for character, in its own wrapper `div`, beneath the sync line and above
    `.friends-danger`, opening `PrivacySheet` from local state. It sits outside the `hasBackend()`
    guard, because the note is worth reading in a build with no server too. Both instances use the
    same class and the same two strings (`PRIVACY_SUBTITLE`); if a third caller ever appears, the row
    becomes a component in `src/features/privacy/` rather than a third copy. Then make the honesty
    line one text rather than two that can drift: copy C's
    literal into `GUEST_HONESTY` unchanged and have this file render the constant. C's wording wins;
    B only moves it.
13. **`tools/qa/first-open.mjs`** (new). See Verification.
14. **Docs, one commit.** `docs/DESIGN.md`: the Entry screen section under Screens, one sentence in
    the Home section saying the masthead is above it, three registry rows (`Masthead`, `NameFields`,
    `PrivacySheet` plus `GUEST_HONESTY`), and `?entry` added to the existing
    `nowHour(), today()` registry row, which is where the QA overrides are listed. `CLAUDE.md`: one
    line in Operating notes for the first-open gate, the sync gate and `?entry`, and one line under
    Accounts saying the server no longer stores the literal `A friend`.
    `tools/qa/README.md`: `?entry` in the paragraph at lines 29 to 31 that lists `?day`, `?hour` and
    `?nosync`. Merge into these files; never replace a section.

## Verification

One dev server on 5173, already running; never start a second. Every shot is 390×844 through
`tools/qa/shot.mjs`, and every seeded run carries `nosync` so the live backend gets no anonymous
users. `shot.mjs` always appends `?seed`, runs `--eval` after the clicks and before the shot, and
reads `--after` only inside the click loop, so `--after` without a `--click` is silently ignored.

```bash
node tools/qa/shot.mjs b-entry-first "home?entry&nosync"
node tools/qa/shot.mjs b-entry-privacy "home?entry&nosync" --click ".privacy-open" --after 3000
node tools/qa/shot.mjs b-entry-privacy-foot "home?entry&nosync" --click ".privacy-open" --after 3000 \
  --eval "(document.querySelector('.sheet-scroll').scrollTop = 99999, 'bottom')"
node tools/qa/shot.mjs b-home-masthead "home?nosync"
node tools/qa/shot.mjs b-crew-profile "social?nosync" --click ".social-me" --after 3000
node tools/qa/shot.mjs b-crew-privacy "social?nosync" --click ".social-me" --click2 ".privacy-open" --after 3000
node tools/qa/shot.mjs b-add-entry "add?entry&nosync#SPPTEST" --click ".entry-done" --after 2000 \
  --eval "location.pathname + ' ' + location.hash.slice(0, 8)"
node tools/qa/first-open.mjs
node tools/qa/scan.mjs src/features/cruise src/features/privacy src/features/home src/app
npm run design:check
npm run lint
npx tsc -p tsconfig.app.json --noEmit
```

What each must show or print:

- `b-entry-first`: masthead, "Sun Princess", "Princess Cruises · 3 to 17 October 2026", both fields
  with a bordered input and six 44px colour dots, the two lines of copy, the privacy row with both
  its lines complete and no ellipsis, one coral Done. The line printed must read
  `viewport 390 scrollWidth 390 docHeight 844` (or a smaller `docHeight`): no horizontal overflow and
  no vertical scroll. No box around the fields, no eyebrow, no glass, and the ground's wash and grain
  visible behind it rather than flat cream.
- `b-entry-privacy`: the sheet settled over the entry screen, its title, its meta line, and the first
  two sections legible, each heading 8px above its paragraph rather than flush against it.
- `b-entry-privacy-foot`: the same sheet scrolled to the bottom, showing "Who is responsible, and who
  it is for" and the "Updated 10 September 2026" foot. The `--eval` is what scrolls it; `--click2`
  would only click.
- `b-home-masthead`: the masthead, then the greeting, the hero and Today all above 784px. The gap
  between masthead and greeting must match Crew's masthead-to-`h1` gap; compare against
  `b-crew-profile`.
- `b-crew-profile`: Your details with the new "Privacy note" row between the sync line and Delete my
  data, and nothing else on that sheet moved. With `?nosync` the sync line is absent (`mode()` is
  off, so `sync.status` is `'off'` and `ProfileSheet` renders nothing there), which is the existing
  behaviour and not a regression: the row sits directly above `.friends-danger`.
- `b-crew-privacy`: the privacy sheet open **over** Your details, which is the only stacked-sheet
  path B adds. `Sheet` registers in `openSheets` on mount and locks the body once, so the second
  sheet must sit above the first with the first still visible behind it, Escape must close only the
  top one, and the page behind must not have jumped. If the shot shows one sheet, the row did not
  match: `--click2` prints `WARN: nothing matched` and the run still exits 0, so read the console
  line, not just the PNG.
- `b-add-entry`: prints `eval: "/add #SPPTEST"`. That line is the proof, and the only proof, that a
  tapped invite link survives the entry screen. **The PNG shows the add flow's failure screen**, not
  a tick: `SPPTEST` starts with `SPP`, so `extractShareCode` passes it through, `decodeShare`
  rejects it, and `AddRoute` renders "Could not read that add link." with "Go to your crew". That is
  the expected image; a tick would mean the fixture decoded, which it cannot. The seeded profile is
  named Alex, so `AddRoute` never falls back to `NameCard`, which is what makes the eval meaningful.
- `first-open.mjs`: opens `http://127.0.0.1:5173/` with **no query at all** in a fresh browser
  context (`chrome.user()` creates one with its own storage), waits 3000ms, and asserts that nothing
  reached Supabase and that `document.querySelector('.entry-done')` exists.
  `performance.getEntriesByType('resource')` alone is not enough: the buffer holds 250 entries by
  default and a Vite dev server serves this app's module graph in far more than that, so a late
  request would be dropped and the check would pass vacuously. Collect through an observer instead,
  installed before navigation with the `send` on the object `launch()` returns (`listeners` is
  internal to `cdp.mjs`, so a CDP `Network` subscription is not available without editing it):

  ```js
  const chrome = await launch({ width: 390, height: 844 })
  const u = await chrome.user('S')
  await chrome.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__sb = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (/\\.supabase\\.co|node_modules[^"']*supabase/i.test(e.name)) window.__sb.push(e.name) })
      .observe({ type: 'resource', buffered: true });
  ` }, u.sessionId)
  await u.goto('http://127.0.0.1:5173/')
  await u.sleep(3000)
  ```

  The `\\.` in that pattern is deliberate: the source is a JS template literal in the `.mjs`, so a
  doubled backslash is what reaches the page as `\.`. Check the emitted string once with a
  `console.log` of `source` if in doubt, rather than assuming.

  **The pattern must not be a bare `/supabase/i`.** `backend.ts` line 9 imports `./supabase`
  statically, so the dev server serves `http://127.0.0.1:5173/src/state/supabase.ts` on every load,
  including a correct first open; a bare match reports that as a violation, the run fails on working
  code, and the next person loosens the test. The two alternatives above are the API host
  (`<ref>.supabase.co`) and the pre-bundled dependency
  (`/node_modules/.vite/deps/@supabase_supabase-js.js`), which is the only way `supabase-js` itself
  can arrive, since `src/state/supabase.ts` imports it dynamically. A pass therefore proves both that
  no request was made and that the library was never fetched. `buffered: true` picks up anything that
  landed before the observer ran, and an observer is not capped. Then
  `u.eval('JSON.stringify(window.__sb)')`. Prints `PASS first open: entry screen, 0 supabase
  requests` and exits 0, or prints the offending names and exits 1. It must **not** click Done: that
  would create a live anonymous user on every run. Before trusting a pass, confirm the dev server is
  backend-configured, by name only: `grep -c VITE_SUPABASE_URL .env` prints 1 (the file exists and is
  gitignored; a build with no key would pass this test for the wrong reason).
- `scan.mjs` and `design:check`: no suspects, and nothing added to `tools/qa/design-allow.txt`. If
  the entry screen needs an allow-list line, the design is wrong, not the scanner. `cruise.css` is
  in no allow-list entry today and must still be in none afterwards.
- `npm run lint`: 0 errors. The warning count must not rise above the baseline, which was 28 on
  10 September (`npm run lint 2>&1 | grep -c "warning "`). Three of those are in `App.tsx`, at 60,
  81 and 115, all `react(set-state-in-effect)` inside `AddRoute` and `JoinRoute`, and all
  pre-existing: they are not B's to fix and they must still be three afterwards. No other file B
  touches carries a warning today, so any new one in `Entry.tsx`, `Masthead.tsx`, `NameFields.tsx`,
  `PrivacySheet.tsx`, `Shell.tsx`, `Social.tsx`, `ProfileSheet.tsx`, `store.ts`, `sync.ts` or
  `model.ts` is B's and is fixed before the commit. `tsc`: no output.

**The one thing not machine-checked here, and why.** Nothing above proves that sync *resumes* after
Done, which is the riskier half of the change: a mistake there means no user ever syncs again, and it
is silent. It cannot be checked headless without creating a live anonymous user, and `?nosync` (which
every shot carries) forces `mode()` off regardless of `enteredCruise`. So it is a hand check on the
dev server, done once, and reported with its result:

1. Open `http://127.0.0.1:5173/` in a normal window with **no query at all** and DevTools Network
   open, filtered to `supabase.co`. Confirm zero requests while the entry screen is up.
2. Type the name **Alex** (deliberately: `CLAUDE.md` scopes the QA purge to anonymous sessions whose
   profile name is Alex, so the row this creates is inside the documented rule), pick a colour, tap
   Done.
3. Within about three seconds a request to `<ref>.supabase.co` must appear. That is the gate.
4. **Before deleting anything, copy the anonymous user id out of the Network tab** (the
   `auth/v1/signup` response, or `user_id` in the `profiles` upsert body) and put it in the report.
   `delete_my_data` removes the profile row but leaves the auth user, and `CLAUDE.md`'s purge rule
   filters on profile name Alex, so once the profile is gone that auth row can only be found by id.
5. Then open Crew, Your details, and tap Delete my data twice. Never blanket-purge.

There is no test runner in this project (`package.json` has no test script and no vitest), and B does
not add one; workstream C's `restore.ts` tests are where that decision belongs. The multi-sailing
branch cannot be rendered while `CRUISES` has one entry, so it is verified by `tsc` alone; say so in
the commit message rather than implying it was seen.

Also confirm by hand, once, on the dev server without `?seed`: enter with no name, land on Home,
open Crew and see `NameCard` still asking for a name; then reload and confirm the entry screen does
not come back.

## Files touched

Inside the brief's contention map for B (`src/features/cruise/*`, `src/app/App.tsx`,
`src/features/home/Home.tsx`, `src/state/store.ts`, the new privacy sheet, docs):

- `src/features/cruise/Entry.tsx` (renamed from `CruisePicker.tsx`)
- `src/features/cruise/cruise.css`
- `src/features/privacy/PrivacySheet.tsx`, `src/features/privacy/privacy.css` (new)
- `src/app/App.tsx`
- `src/state/store.ts`
- `docs/DESIGN.md`, `docs/specs/2026-09-10-b-entry-first-open.md`, `CLAUDE.md`

Additions, each with its reason:

- `src/features/home/home.css`: the map named `Home.tsx`, which needs no change at all; the padding
  that has to give way to the masthead is one rule in the screen's own stylesheet.
- `src/app/Masthead.tsx`, `src/app/Shell.tsx`: `Shell` owns the masthead, and the alternative to
  extracting it is a second copy inside the entry screen, which is the divergent-sibling failure.
  Neither file is in another workstream's map.
- `src/features/social/NameFields.tsx`, `src/features/social/Social.tsx`: the brief requires the
  `NameCard` mechanism, not a copy of it, and `Social.tsx` is where that mechanism lives.
- `src/state/sync.ts`: the consent line is false unless the load-time publish is gated on
  `enteredCruise`, and the "A friend" failure the Purpose names is closed at line 64 of this file or
  nowhere. Workstream C finishes with this file before B starts, so there is no second writer; if C
  is still in flight, B stops and waits rather than opening it.
- `src/features/friends/ProfileSheet.tsx`: the brief puts the privacy note in this sheet as well. Same
  sequencing as `sync.ts`. If C is somehow still in flight, this one row is deferred to its own commit.
- `src/data/model.ts`: the QA overrides live there; a fourth beside `?nosync` keeps them in one place.
- `tools/qa/first-open.mjs`, `tools/qa/README.md`: the sync gate cannot be checked through
  `shot.mjs`, which always appends `?seed`, and a reusable script belongs beside the others.

## Out of scope

- Sign-in, restore, the "Keep your passport" control and the sync status line: workstream C. B renders
  the privacy note's sentences about sign-in, and imports C's honesty line rather than writing a
  second one.
- The desktop landing, the QR of the live address, install instructions and anything about price:
  workstream E.
- Custom sailings and custom venues: BYO.
- A second curated sailing, or any drink, venue or price data: nothing is invented here.
- The `|| 'A friend'` fallbacks at `share.ts` 92 and 101, and therefore the literal inside
  `passports.payload.n`. 92 is `buildPayload`, which `sync.ts` 66 publishes, and 101 is `buildCard`,
  the QR and link identity card. `share.ts` is in no workstream's contention map; the payload value
  is read by no SQL and is normalised by `parseFriend` on receipt; the card has to carry something a
  phone with no server can print. Only the server-side write at `sync.ts` 64 changes, and the spec's
  claim is scoped to `profiles.name` accordingly.
- Backfilling or deleting the sixteen existing "A friend" rows. They are overwritten with an empty
  name when each of those users next syncs; a manual sweep is Charles's console and is not asked for.
- A cookie or consent banner. There is nothing to consent to beyond this screen, and adding a banner
  would be theatre.
- Auto-expiring server rows, an edge function to delete the auth account, and a dated consent record.
- Changing `index.html`'s seed block, the service worker, or anything workstream A owns.

## Open questions for Charles

1. **The contact address for the privacy note.** One address a stranger can write to about their
   data. Until it exists, `PRIVACY_CONTACT` is empty and the last sentence and the Google-account
   sentence do not render.
2. **Retention.** Nothing expires today, and the note says so. Do rows get deleted some months after
   a sailing ends, and if so how many? That is a controller's decision, and the note's wording
   changes with it.
3. **A dated consent record.** `enteredCruise` records that consent happened, not when or against
   which text. If the note is ever materially reworded, a stored date and version would be needed to
   re-ask. Worth it, or not?
4. **Deleting the auth account.** `delete_my_data` leaves the Supabase auth user, which for a
   Google sign-in holds an email address. The note says it is removed by hand on request. Is that the
   process you want, or should this be automated later?
5. **"Sun Princess" or "Cocktail Passport" as the entry screen's `h1`.** The spec makes it the ship,
   with the masthead carrying the app's name, because the screen's first question is which sailing.
   A taste call, and the only one on this screen.
6. **Being added without approving it.** `befriend` writes both edges, so anyone who can find you by
   name can see your passport from the moment they tap Add, with no request and no acceptance. The
   note now says so plainly, which is the honest minimum. Do you want it left as it is, or should a
   later workstream add an accept step, or a switch that makes you unfindable by name? Not B's work
   either way; the note has to be true of whichever it is.
