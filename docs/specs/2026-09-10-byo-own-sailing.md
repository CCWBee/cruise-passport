# Bring your own sailing (custom venues data model)

10 September 2026. Workstream BYO of `docs/specs/2026-09-10-product-brief.md`. It ships last, after
A, C, B and E have landed and merged on `product`. Read `docs/DESIGN.md` and `docs/DESIGN-AUDIT.md`
in full before touching anything that renders.

## Purpose

A guest whose ship is not the Sun Princess can set up their own sailing: ship, line, dates, and their
own venues, then add their own drinks to those venues and use every screen the curated sailing gets.
The failure it removes is the app being a single-voyage gift: today `Drink.venue` is a key into a
hard-coded `VENUES` record, and a user who is not on the Sun Princess in October 2026 has nothing to
log against. It also fixes the four unguarded `VENUES[key]` lookups that would throw the moment a
drink, or a venue's `shares` link, carried a key the active dataset does not hold, and the four
places a number can go `NaN` once a catalogue can be empty.

## What exists

Every reader of `Drink.venue` and of `VENUES` / `VENUE_KEYS`, mapped by grep over the whole of `src`
before anything below was specified. Line numbers are the ones read on 10 September 2026.

### The data layer

- `src/data/raw.ts` (1 to 13, 232). `START`, `END`, `PLUS = 15`, `PREM = 20`, the `VenueRaw`
  interface (`name`, `deck`, `type`, `hours`, `blurb`, `shares?`, `sharesNote?`), 28 venues across
  decks 7, 8, 9, 15, 17, 18 (counts 9, 6, 4, 1, 6, 2), types Bar 5, Pub 1, Lounge 2, Café 3,
  Pool bar 7, Restaurant 8, Experience 2, nine of them carrying `shares`. Then the 166 cocktail
  rows, 21 wines, 27 beers. Header says the values are not to be hand-edited. **Reuse:** the
  `VenueRaw` shape is the whole venue contract; a user-made venue is a `VenueRaw` and nothing more.
- `src/data/cruises.ts` (1 to 61). `CruiseDataset` (`START`, `END`, `PLUS`, `PREM`, `VENUES`,
  `COCKTAILS`, `WINES`, `BEERS`), `Cruise` (`id`, `name`, `ship`, `line`, `start`, `end`, `data`),
  `CRUISES` with one entry, and `activeCruiseId()` / `activeCruise()` / `setActiveCruise()` /
  `cruiseById()` reading and writing the bare localStorage key `spcc-cruise` (41 to 57). **Reuse:**
  this is the precedent for reading catalogue state straight from localStorage at module load,
  because `model.ts` resolves its dataset before the store exists. A user sailing is a `Cruise`.
- `src/data/model.ts` (1 to 150). `const DATA = activeCruise().data` at line 7, destructured at 8,
  re-exported at 10. `Drink.venue: string` (16). `buildDrinks()` writes `venue` from the cocktail
  row (40), `'crooners'` for wines (50), `'themix'` for beers (60). `DECKS = [7, 8, 9, 15, 17, 18]`
  hard-coded (76). `CATEGORIES` derived from `DRINKS` (77). `pkgOf()` classifies against `PLUS` and
  `PREM` (80 to 85). `menuFor(venueKey, drinks)` filters by `d.venue` and follows `VENUES[key]?.shares`
  (93 to 98, already optional-chained). `VENUE_KEYS = Object.keys(VENUES)` (100). `isRestaurant`
  reads `VENUES[venueKey].type` **unguarded** (101). `voyageDays()` / `DAYS` off `START` and `END`
  (104 to 111). `today()`, `nowHour()`, `qaNoSync()` with their QA overrides (112 to 137).
- `src/data/badges.ts` (1 to 46). `BadgeStat` carries `venues` and `totalVenues`. `everybar` (35)
  tests `s.venues >= s.totalVenues` with hint "Check in at all 28 venues". `champion` (45) is named
  "Sun Princess Champion". `martini`, `margarita`, `coffee`, `wine` key off the exact category
  strings `Martini`, `Margarita`, `Coffee`, `Wine`. **Reuse:** the predicates are already derived;
  only two strings and one zero-guard are wrong for a user sailing.

### State

- `src/state/store.ts` (1 to 415). `custom: Drink[]` with no cruise scope (33, 200), persist name
  `spcc2` version 8 with `migrate` steps `from < 2` to `from < 8` (348 to 394), `partialize`
  listing `me, custom, friends, profile, cruiseId, enteredCruise, groups, pendingInvites,
  pendingUnfriends, seenMedals` (396 to 400). `toggleVisit(venueKey)` keys `me.visits` by venue key
  (193 to 198). `enterCruise(id)` calls `setActiveCruise`, sets `cruiseId` and `enteredCruise`, and
  **reloads the page when the cruise actually changes** (162 to 167): the app's existing mechanism
  for a dataset change. `allDrinks()` / `useAllDrinks()` return `[...DRINKS, ...custom]` (410 to 414).
- `src/state/stats.ts` (1 to 323). `computeStats` (70 to 136): `VENUE_KEYS.filter(k => p.visits[k]?.visited)`
  (75), `vset[d.venue]` (77), `byVenue[d.venue]` (86), `pct = (tried.length / drinks.length) * 100`
  **with no zero guard** (119), `badgeStat` carrying `totalVenues: VENUE_KEYS.length` (122),
  `bars/barsTotal/rest/restTotal` through `isRestaurant` (129 to 132). `lastVenueOn` (187 to 190),
  `venueProgress` over `menuFor` (192 to 199), `biggestBar` already guarded with `!VENUES[d.venue]`
  (204 to 213), `deckCount()` already derived from `VENUE_KEYS` and `VENUES[k].deck` (217 to 221),
  `crewToday` guarded with `VENUES[a]?.name || a` (284 to 310).
- `src/state/social.ts` (3, 47 to 62). `bestRatedBars` reads `d.venue` and `isRestaurant(d.venue)`,
  falls back to the key with `VENUES[vk]?.name || vk`.
- `src/state/share.ts` (1 to 161). `buildPayload` skips custom drink ids with `if (id[0] === 'c') continue`
  (86) but sends **every** visited venue key (90 to 91). `parseFriend` filters incoming entries
  against `DRINK_BY_ID` (141 to 142) and accepts every incoming visit key unfiltered (151 to 152).
  **Reuse:** line 86 is the exact sibling for skipping user venue keys.
- `src/state/sync.ts` (57 to 69). `publishBackend()` writes `publishBackup(s.cruiseId, { me: s.me,
  custom: s.custom, profile: s.profile })`, best effort. Everything is cruise-scoped by `s.cruiseId`.

### Screens

- `src/features/ship/Ship.tsx` (1 to 71). `DECKS.slice().reverse()`, `VENUE_KEYS.filter(key => VENUES[key].deck === deck)`
  (22 to 26), one `.row.venue-row` per venue with `.meter` and "n of m" (40 to 64), `?venue=<key>`
  deep link guarded by `VENUES[k]` (18 to 21), `VenueSheet` at the foot. Heading is
  `Deck {deck} · {done} of {total}` with an `.sr-only` unit.
- `src/features/ship/VenueSheet.tsx` (1 to 71). Returns null on an unknown key (19). Title, meta
  `Deck {deck} · {type}, {hours}` (31), blurb (32), the shared-list line reading
  `VENUES[venue.shares].name` **unguarded** (34), the visited `Switch`, the progress `.meter`, then
  `DrinkCard` rows, with "No published drinks for this venue yet." as the empty case (67).
- `src/features/drinks/facets.ts` (1 to 101). `matchQuery` builds its haystack with
  `VENUES[d.venue].name` **unguarded** (20). `GROUPS.venues` tokenises `[d.venue]` (26).
  `GROUPS.decks` reads `VENUES[d.venue].deck` **unguarded** (27). `GROUPS.pkg` runs `pkgOf` (32).
- `src/features/drinks/Drinks.tsx` (1 to 121). `VENUE_ORDER`, a module constant sorted by deck then
  name (16 to 18). Grouping by `d.venue` (55 to 65) already has an `extra` branch for keys absent
  from `VENUES`, labelled "Your own drinks" (63 to 64), which is dead today because `AddSheet` can
  only pick a known key. `.dempty` (92 to 99) is filter-empty copy, not catalogue-empty copy.
  `.dtoolbar` carries the count line and a ghost `GlassButton` "Add a missing drink" (85 to 90).
- `src/features/drinks/FilterPanel.tsx` (4, 42, 67 to 88). Iterates `DECKS`, labels deck 15 as
  "Deck 15/16" in two places (71, 79), lists venues per deck off `VENUE_KEYS`, and always renders
  the Package segment (57 to 58).
- `src/features/drinks/AddSheet.tsx` (1 to 97). Venue `Select` off `VENUE_KEYS`, default `VENUE_KEYS[0]`
  (14, 59), type `Select` off `CATEGORIES` with `CATEGORIES[0] || 'Cocktail'` (15, 68), writes a
  `Drink` with `id: 'c' + Date.now()` (27) and no cruise scope. `plus`, `premier` and `extra` are
  computed against `PLUS` and `PREM` (40 to 42), so with neither declared `extra` would be `NaN`.
- `src/features/drinks/DrinkSheet.tsx` (80 to 98). `const v = VENUES[d.venue]` (80) and
  `also = all.filter(x => x.venue === d.venue ...)` (81). The meta line at 98 is **already guarded**:
  it prints the venue name and deck only when `v` is truthy, so an unknown venue degrades to the
  category alone. This file needs no change. Recorded so the map is complete.
- `src/features/home/Home.tsx` (1 to 399). `drinkVenue` already falls back to the key (29).
  `countdown()` hard-codes "of 15" (33). Module 2 shows `bars / restaurants / decks` before sailing
  through `s.barsTotal`, `s.restTotal`, `deckCount()` (214 to 224). The hero readout prints
  `{s.n} of {s.total}` and the count-up percentage (193 to 196). `venueProgress`, `biggestBar`,
  `lastVenueOn` drive the bar module (103 to 109).
- `src/features/badges/Badges.tsx` (1 to 214). Earned, Close, Locked from `computeStats(...).badgeStat`;
  the empty Earned state is a `.t-meta` line plus a `Link` action (126 to 129). **Reuse:** that is
  the sibling for an empty Ship.
- `src/features/stats/Stats.tsx` (137 to 159), `src/features/log/Log.tsx` (69),
  `src/features/social/Social.tsx` (207), `src/features/wrapped/wrappedData.ts` (72, 116 to 119,
  166 to 180): all read `VENUES[key]?.name` with a fallback, so all are already safe.
  `wrappedData.ts:6` hard-codes `WRAPPED_TOTAL = 214`. `Wrapped.tsx:154, 249` and
  `wrappedImage.ts:213` and `AddCrewSheet.tsx:110` hard-code "Sun Princess".

### The four lookups that would throw

`facets.ts:20`, `facets.ts:27`, `model.ts:101` and `VenueSheet.tsx:34`. The first three throw on a
drink whose venue is not in `VENUES`; the fourth throws on a venue whose `shares` names a key the
active dataset does not hold. Everything else either iterates `VENUE_KEYS`, so the key is known by
construction (`Stats.tsx:140`, `deckCount` at `stats.ts:219`, `Drinks.tsx:17`, `FilterPanel.tsx:42`
and `:82`, `AddSheet.tsx:59`), or already falls back (`biggestBar` sorts only over keys it filtered
with `!VENUES[d.venue]` at `stats.ts:207`; `crewToday`, `Home.tsx:29`, `Social.tsx:207`,
`Stats.tsx:159`, `wrappedData.ts:166` and `DrinkSheet.tsx:98` all use `?.` with a fallback). These
four are why "a drink whose venue is not in `VENUES`" is currently a white screen, not a degraded
row.

### Primitives to compose from

`ConfirmButton` (`src/features/friends/ConfirmButton.tsx`, the two-tap arm-then-commit used by
delete-my-data); the "Set up a group" row in `Social.tsx:186-192` (a `.row.pressable` with
`.row-copy`, a `t-body` primary line, a `t-meta` second line and a `Chevron`); `Sheet` with
`.sheet-title` and `.sheet-meta`; `TextField` / `TextArea` / `NumberField` / `Select` / `Switch`;
`GlassButton` (`primary`, `secondary`, `ghost`); `Confirm` and `haptic()`; `.meter`; `.section` and
`.section-head`.

## Design placement

Nothing here mints a primitive. Every element names the sibling it copies.

### Ship, populated (DESIGN.md · Screens · Ship)

Rank order is unchanged: a plain section per deck, top deck down, fold is the top two decks. BYO adds
**one row after the last deck**, below the fold, which is where a rare action belongs on a screen
opened for its list:

- Form: the Crew screen's "Set up a group" row (`Social.tsx:186-192`) exactly: `.row.pressable`,
  `aria-haspopup="dialog"`, `.row-copy` with a `t-body` primary line and a `t-meta` second line, and
  the `Chevron`. It carries the class `ship-add`. It sits inside a bare `.section` with no heading,
  because a heading over a single action would name the action twice.
- **It will be the one rounded row on Ship, and that is the intent.** `base.css:144` squares any row
  with siblings, so the venue rows inside each deck section are square-cornered; alone in its own
  `.section`, this one keeps radius 12. Crew's "Set up a group" is square for the opposite reason,
  because it sits in the list of group rows it belongs to. Here the row is not another venue and
  should not read as one: it is the only control on the screen that does something other than open a
  venue. The reason goes in the JSX comment so nobody "fixes" it later.
- No new colour. Ink only. The screen's coral budget stays unspent.

### Ship, empty (a user sailing with no venues yet)

The empty state is the action, as the Badges screen does it. The sibling, read exactly:
`Badges.tsx:126-129` is one `p.t-meta` and then a text `Link.badge-empty-action`, nothing else.

BYO diverges in two ways and the reason for each goes in the JSX comment:

- **Two lines, not one.** Badges can say it in one line because its list fills itself as a
  side effect of using the app. Nothing fills Ship except this control, so the second line says what
  a venue is for.
- **A filled `GlassButton variant="primary"`, not a text link.** Badges' action leads away to a
  screen the guest was going to open anyway; this one is the only way to make the screen exist. Ship
  spends no coral otherwise, so DESIGN.md's cap of one filled coral control per screen is met.

It carries the class `ship-add`, the same class the foot action carries, because it is the same
action and QA clicks one selector. **The two never render together**: with no venues, `DECKS` is
empty (Data and state), so no deck section renders and the foot action is not reached; with venues,
the empty state is not reached. A screen showing both would be two entry points to one sheet.

### Venue form (new sheet, `src/features/ship/VenueForm.tsx`)

`Sheet` with `.sheet-title` and one `.sheet-meta` line, then a `<form>` of `TextField`,
`NumberField`, `Select`, `TextField`, `TextArea`, then a `GlassButton variant="primary" block`.

That is `AddSheet.tsx`'s skeleton: the same `Sheet`, the same title-and-one-meta-line opening, the
same `ui/` controls in the same idiom, the same block primary at the foot. It is not the same field
list, and it does not pretend to be: a venue has five facts and a drink has six, and they are
different facts. What must match is how it reads, because the venue form and the drink form are the
two "add a thing" sheets in the app and a guest who has used one must recognise the other.

Adding offers a second button beneath the primary, `GlassButton variant="secondary"`, "Save and add
another" (Behaviour). Two stacked buttons is a divergence from `AddSheet`'s single one; the reason,
in the comment, is that venues are entered in a batch on the day the guest sets the sailing up and
drinks are entered one at a time at a bar. The coral cap holds: one filled control, one outline.

Remove, when offered, is a `ConfirmButton` at the foot below a hairline, exactly as `ProfileSheet`
places delete-my-data. `ConfirmButton`'s own default `className` is `btn btn-wide`
(`ConfirmButton.tsx:8`) and its armed state is a coral outline, never a fill, so it does not contest
the primary.

### Venue sheet (`src/features/ship/VenueSheet.tsx`)

For a user-made venue only, one text action, "Edit this venue", as a `button.row.pressable.venue-edit`
with `aria-haspopup="dialog"` and a single `.t-body` line, immediately after the blurb and before the
first `.hairline.venue-rule`. Reason, to be written in the JSX comment: the block above states what
this venue is, and editing changes exactly that; putting it under the drink list would separate the
control from the facts it edits. The published venues on a curated sailing show no such row.

It goes in its own wrapper `div`, for the reason B gives for `.entry-privacy`: `base.css:144` is
`.row:not(:only-child) { border-radius: 0 }`, and this row's siblings are the `<p>` above it and the
`<hr>` below, so unwrapped it would be the one squared, untinted row inside a sheet whose other
controls are all radius 12.

### Drinks (DESIGN.md · Screens · Drinks)

With a catalogue, modules unchanged. With none, modules 1 and 2 go with module 3: search over
nothing, a filter over nothing and a count line reading "0 drinks" are three controls with nothing
behind them, and DESIGN.md's own test is that every distinction pays rent. What is left is the
`.dempty` shape the screen already has (`Drinks.tsx:93-99`): one `p.t-body` and one
`GlassButton variant="primary"` inside `.dempty-acts`. One button, not the two the filter-empty
state shows, because there is no filter to drop.

The Package segment in `FilterPanel` disappears when the sailing declares no package prices, for the
same reason.

### Home (DESIGN.md · Screens · Home, module 2)

Module 2 keeps both its headings, "Today" aboard and "The ship" before sailing (`Home.tsx:204`).
Neither changes and no third heading is minted: DESIGN.md names those two and a screen that renamed
its own module would put the constitution out of date.

What changes is the row beneath, and in two cases, not one:

- **Before sailing with no venues** the three facts read "0 bars, 0 restaurants, 0 decks".
- **Aboard with no bars** the third fact reads "0 of 0 bars visited". This one bites on a sailing that
  has venues, if every one of them is a Restaurant or an Experience, so the test is `s.barsTotal === 0`
  and not the venue count.

Both are the structural zero DESIGN.md forbids ("never a structural zero", Screens · Home, module 2).
In both, the `div.facts` is replaced by one row, in the shape Home already uses for its own empty
state (the "No top drink yet" row, `Home.tsx:332-340`): a `Link` to `/ship` with a `.row-copy`
carrying a `.t-strong` primary line and a `.t-meta` second line. It needs no wrapper `div`: Home's
existing rows sit as siblings of a `.section-head` and are already squared by `base.css:144`, so a
wrapper here would make this one row the only rounded thing on the screen.

The hero keeps its position and its shape; only the sub-line's words change.

### First-open screen (workstream B's `src/features/cruise/`)

B does **not** build a list of sailings. Its spec (`2026-09-10-b-entry-first-open.md`, "The
multi-sailing branch", lines 264 to 273) makes module 2 an `h1.t-title` reading "Choose your sailing"
with the `Select` primitive beneath it under an `.f-label`, its options `${ship} · ${prettyRange(start, end)}`
built from `CRUISES` and its value the local `chosen` state. So there is no list to append a row to,
and BYO must not turn that `Select` into one.

BYO adds **one row directly beneath the `Select`**, before module 3 (name and colour). Its sibling is
B's own privacy row (`2026-09-10-b-entry-first-open.md`, module 5): `button.row.pressable.cruise-byo`
with a `.row-copy` carrying a `.t-strong` primary line and a `.t-meta` second line, no `Chevron`, and
`aria-haspopup="dialog"`. It takes B's row rather than Crew's "Set up a group" because it is on B's
screen and two rows on one screen must read the same way; Crew's row carries a `Chevron` because it
sits in a list of group rows that do, and B's does not.

- **It goes in its own wrapper `div`**, exactly as B wraps `.entry-privacy`, because
  `base.css:144` is `.row:not(:only-child) { border-radius: 0 }`: a row with siblings loses radius 12
  and its press tint squares off. Wrapped, it keeps both.
- `.cruise-byo` carries no style of its own. It exists so the QA shot can click it, as `.entry-done`,
  `.entry-privacy`, `.social-me` and `.d-open` do.
- **Height.** B budgets about 620 of 844 and asserts the entry screen does not scroll. This row is 48
  plus 12 above it, so about 680. It must still not scroll, and the shot asserts it.

Where `CRUISES` has one entry (nobody has made a sailing yet) B renders module 2 as the single-sailing
block, an `h1` and one `.t-meta` line, and the row sits beneath that instead. Both states are shot.

### Sailing sheet (new, `src/features/cruise/SailingSheet.tsx`)

`Sheet`, title, one `.sheet-meta` line, four fields, one primary button. Same skeleton as
`VenueForm` and `AddSheet`; nothing new.

### Banned tells

No eyebrow pill and no status dot anywhere in this work; no rule along any heading or card (the two
`.hairline.venue-rule` uses in `VenueSheet` are existing separators between control groups inside a
sheet, not a rule on a heading); no emoji as an icon (`Chevron` and the drawn set only); no wall of
identical boxes (every list here is `.row`s with hairlines on the ground, and the only `.panel` on
these screens stays the filter panel).

## Behaviour

Copy is written out verbatim. British English, sentence case, no em dashes.

### The reload contract

`VENUES`, `VENUE_KEYS`, `DECKS`, `CATEGORIES`, `DRINKS` and `Drinks.tsx`'s `VENUE_ORDER` are module
constants resolved once at load. A change to the catalogue therefore reloads the page, which is
already the app's mechanism for exactly this: `enterCruise` reloads when the cruise changes
(`store.ts:162-167`). Making the catalogue reactive is a separate, larger change and is out of scope
below. So: saving a venue writes it and confirms it in place, and the reload happens once, when the
sheet closes, and only when something was actually saved.

While the form is open and a field has been changed, a `p.t-meta` note sits above the primary button:

> Saving reloads the app, so the change shows on every screen.

It says "the app" and not "your passport": the passport is the guest's logged drinks, which is
exactly what does **not** change here, and telling someone their passport is about to reload would
read as a warning about their data.

### First-open screen, returning and first time

Beneath module 2 (B's single-sailing block, or its `Select` once a second sailing exists):

> **Set up your own sailing**
> For a ship that is not on this list

The primary line is `.t-strong` and the second `.t-meta`, as B's privacy row is. Tapping it opens the
sailing sheet. It is shown in both of B's module-2 states and its copy does not change between them:
"not on this list" is true of a one-line block as much as of a two-option `Select`.

### Sailing sheet, first time

> **Your sailing**
> The ship, the line and the dates. You add the bars next.

Fields, in order: "Ship" (`TextField`, required, autofocus), "Cruise line" (`TextField`, optional,
hint "Optional."), "First day" and "Last day" (`TextField type="date"`, both required). Then:

> Start your passport

- Empty ship name: the button is disabled. `AddSheet` returns early on an empty name
  (`AddSheet.tsx:23`) rather than disabling, so this diverges; the reason, in the comment, is that a
  button that does nothing when tapped is the state DESIGN.md's "Every control ships default,
  pressed, focus-visible, disabled" exists to prevent, and `AddSheet` is corrected the same way in
  step 13.
- **Every inline error is the `Field` primitive's own `error` prop**, never a hand-written `t-meta`.
  `src/ui/Field.tsx:16-24` already renders `span.field-hint.field-err` and wires `aria-invalid` and
  `aria-describedby` to it, and it replaces the hint rather than sitting beside it. A second error
  style on one screen is the divergent-sibling failure `canonical-patterns` exists to stop.
- Last day before first day: the button stays enabled and, on submit, the **Last day** field takes
  `error="The last day cannot be before the first day."`
- On success, in this order: `saveSailing()` writes the sailing to `spcc-sailings` **first**, then
  `enterCruise(<new id>)` runs. The order is load-bearing: `CRUISES` is memoised at module load, so
  until the reload the new id is not in it and `activeCruiseId()` would fall back to the published
  sailing. `enterCruise` reloads because the id differs from `cruiseId` (`store.ts:166`), and the
  reload rebuilds `CRUISES` from `spcc-sailings`, which the write has already put there.
- The page comes back on the new sailing's Home. No `Confirm` tick: the whole screen changes, so the
  result is already visible, and DESIGN.md keeps `Confirm` for results the guest cannot otherwise see.

### Sailing sheet, returning (editing the sailing you are on)

Same sheet, fields pre-filled, title "Your sailing", meta line:

> Change the ship or the dates. Your logged drinks stay where they are.

Button reads `Save`. The reload note appears once a field has changed. Below a hairline, a
`ConfirmButton`:

- label: `Delete this sailing`
- confirmLabel: `Tap again to delete`
- note: `Removes the sailing, its venues and the drinks you added to it from this phone. Your other sailings stay.`

On confirm, in this order:

```ts
const keys = Object.keys(venuesFor(id))          // read before the record goes
useStore.getState().forgetSailing(id, keys)      // custom drinks, their entries, those visits
deleteSailing(id)                                // the sailing and its venues in spcc-sailings
enterCruise(CRUISES.find((c) => c.id !== id)!.id)  // switches, and reloads because the id differs
```

The store call comes first because the keys are read out of `venuesFor(id)`, which `deleteSailing` is
about to remove. The non-null assertion on `find` is safe by construction: `CRUISES[0]` is always the
published sailing and a published sailing has no delete control, so there is always at least one
other entry. `forgetSailing` is specified in Data and state; without it the note above is false,
because `sailings.ts` holds no drinks and cannot delete any. Deleting is offered only for a user-made
sailing; a published sailing has no such control.

### Ship, empty

> Your sailing has no venues yet.
> Add the bars, cafés and restaurants you will drink at.
>
> [ Add a venue ]   (coral, primary)

### Ship, populated: the foot action

> Add a venue
> Bars, cafés and restaurants on this ship

### Venue form, adding

Title `Add a venue`, meta line:

> Where you will be drinking. Deck and name are what the app groups by.

Fields:

| Field | Control | Rules |
| --- | --- | --- |
| Name | `TextField`, required, autofocus | trimmed, 40 characters |
| Deck | `NumberField`, required, `min="1"`, `step="1"`, `inputMode="numeric"` | whole number 1 to 30 |
| Kind | `Select`, default `Bar` | Bar, Pub, Lounge, Café, Pool bar, Restaurant, Experience |
| Hours | `TextField`, optional, hint `Optional. For example, 4pm to late.` | 40 characters |
| Notes | `TextArea`, optional, 3 rows, hint `Optional. Anything you want to remember about it.` | 200 characters |

Buttons: `Add it` (primary, block) and, beneath it, `Save and add another` (secondary). "Kind"
rather than "Type" because the drink form's `Select` is already labelled Type and the two are
different things on the same screen; Restaurant and Experience are what `isRestaurant` counts as a
restaurant, and the list is the vocabulary the published dataset already uses.

- Empty name: the primary button is disabled.
- Deck not a whole number between 1 and 30: on submit, the Deck field takes
  `error="Deck must be a whole number between 1 and 30."` (the `Field` primitive's own `error` prop,
  as in the sailing sheet; never a hand-written `t-meta`).
- `Add it`: writes the venue, closes the sheet, reloads. The venue is then visible on Ship, so no
  tick.
- `Save and add another`: writes the venue, clears the fields, keeps focus on Name, and fires the
  `Confirm` tick with the label `<name> added` and `haptic()`. This is the one place a tick is
  right: the row it made is not on screen yet, which is DESIGN.md's own test for `Confirm`.
- Offline: nothing here touches the network. No offline state, no spinner, no error.

### Venue form, editing

Title is the venue's name, meta line:

> Change how this venue reads. The drinks logged here stay logged.

Button reads `Save`. Below a hairline, a `ConfirmButton`:

- When the venue holds no drinks the guest added and nothing is logged there:
  label `Remove this venue`, confirmLabel `Tap again to remove`, note
  `Removes it from the ship. Nothing is logged here.`
- When it holds drinks the guest added: label `Remove this venue`, confirmLabel `Tap again to remove`,
  note `Removes it and the 3 drinks you added to it, and everything you logged at them.` The count is
  the real number and the noun agrees: `the 1 drink you added to it`.

The count is read in the component, not in `sailings.ts`, which holds no drinks:
`useStore(s => s.custom).filter(d => d.venue === key && d.cruise === cruiseId).length`.

On confirm, in this order: `forgetVenue(cruiseId, key)` on the store (drops those custom drinks, the
`me.entries` under their ids, and `me.visits[key]`), then `removeVenue(cruiseId, key)`, then the
reload. Store first, for the same reason as `deleteSailing`. Without the store call the note is
false: `sailings.ts` can only remove the venue record.

A published venue is never removable and the form is never opened for one.

### Drinks, catalogue empty

The condition is `drinks.length === 0`, tested **before** the existing `results.length === 0` branch
(`Drinks.tsx:92`). Without that order an empty catalogue falls into the filter-empty copy and says
"No drink matches that search." with a Reset button, which is false: there is nothing to match and
nothing to reset.

In this state the search row (`.dsearch`), the filter panel and the count line in `.dtoolbar` are all
suppressed, because a search over nothing, a filter over nothing and "0 drinks" are three controls
with nothing behind them. The `.dempty` block is the whole screen under the title. Its shape is the
one `.dempty` already has (`Drinks.tsx:93-99`): a `p.t-body`, then `.dempty-acts` with one
`GlassButton variant="primary"`.

With at least one venue:

> Nothing on your list yet.
> [ Add a drink ]  (primary; opens the existing add sheet)

With no venues at all:

> Add a venue first, then the drinks you order there.
> [ Add a venue ]  (primary; a `Link` to `/ship`)

Rather than open a venue form from the Drinks screen, this navigates: the venue form belongs to Ship,
and a second entry point to the same sheet from another screen is the divergent-sibling failure
`canonical-patterns` exists to stop. It links to `/ship` plainly and does not deep-link the sheet
open; Ship with no venues is already the empty state whose one control is "Add a venue", so the guest
lands on the action either way and the app has one way of opening that sheet, not two.

The `.dtoolbar`'s "Add a missing drink" is also suppressed with no venues, so `AddSheet` is not
reachable from the toolbar; `/drinks?add` still is, and step 13 says what it renders.

### Add a drink, on a sailing with venues

Unchanged, except the venue `Select` now lists the user's own venues (they are in `VENUE_KEYS`) and
the type `Select` always has options (see Data and state). Ordering in the venue `Select` follows
`VENUE_KEYS`, which puts published venues first and user venues after, in the order they were made.

The Price field stays on a sailing with no package tiers, and so does the price on the drink's meta
line: what the drink cost is worth recording whether or not there is a package to measure it against.
What it does not do is classify: `pkgFields()` writes `plus`, `premier` and `extra` as `null`,
`pkgOf` answers `'unknown'`, and the Package filter is not rendered. A tier is a claim about a
package the sailing has not declared.

### Home

- Countdown chip (`Home.tsx:33`): `Day <n> of <DAYS.length> aboard`, so a ten-day sailing says ten
  and the Sun Princess still says fifteen. Before the first day and after the last, the existing
  "Sails in n days" and "Voyage complete" are unchanged.
- Hero readout (`Home.tsx:195`): with a catalogue, unchanged. With no drinks at all the percentage
  reads `0%` (the guard in Numeric guards) and the sub-line becomes `no drinks` / `yet` across the
  existing `<br />` in place of `{s.n} of {s.total}` / `tried`, so the element keeps its two-line
  shape and its measure.
- Module 2 keeps its heading, "Today" aboard and "The ship" before sailing. The `div.facts` is
  replaced by one `Link.row` to `/ship` in two cases, and the copy differs because the two states are
  different questions:

  - **Before sailing, no venues** (`VENUE_KEYS.length === 0`), under "The ship":

    > Add your first venue
    > Bars, cafés and restaurants you will drink at

  - **Aboard, no bars** (`s.barsTotal === 0`), under "Today":

    > Add a bar
    > Nothing to check in at on this sailing yet

  With venues but nothing logged, the existing three facts return and are true. The second line of
  the first case is the Ship empty state's own second line with its leading "Add the" trimmed, so the
  row and the screen it leads to say the same thing in the same words.

### Badges

- `Every Bar` reads `Check in at every venue` and its progress row shows the live count, `4 of 7`.
  It cannot be earned on a sailing with no venues.
- The ninety per cent badge is named from the sailing's ship: `Sun Princess Champion` on the
  published sailing, `<your ship> Champion` on yours.
- Adding a venue you have not checked into can un-earn `Every Bar`. That is honest and it is the
  point of the badge. Because `seenMedals` already holds it, re-earning it shows no second medal
  moment on Home. Stated here so it is not read as a bug.

### Crew, on a user sailing

Every sailing has its own id, so the friend and group feeds are scoped to it and nobody appears on
your sailing unless they are on the same one. Since a sailing cannot yet be handed to another phone,
in practice a user sailing has no crew. The sailing sheet says so once, as a `p.t-meta` directly under
the primary button and **above** the hairline and the `ConfirmButton` on the returning sheet, so the
last thing on the sheet is still the destructive control it was before:

> Crew and groups need a sailing you are both on, so for now they work on the published sailings.

It is on both the first-time and the returning sheet. Saying it once, before the sailing exists, is
what stops a guest building one and then finding out.

One consequence to expect rather than debug: `applyFeed` (`store.ts:305-310`) drops a confirmed
direct friend the cruise-scoped feed did not return, so the first sync on a user sailing empties the
visible roster. It refills on the first pull after switching back to a published sailing, and
silently, because `announceAdded` skips a pull whose previous roster was empty. Nothing is lost on
the server. This is the existing crew model meeting a second sailing, not a fault introduced here,
and it is one more reason the sheet says what it says.

### Offline and error, everywhere in this workstream

The catalogue is local. No screen in this spec waits on the network, so none of them has a loading,
offline or error state. The one network consequence is that the sailing rides in the account backup
(Data and state), which is best effort and already silent.

## Data and state

### One store, in the data layer

`model.ts` resolves its dataset at module load (`model.ts:7`, `const DATA = activeCruise().data`),
before the zustand store exists, so the catalogue cannot live in the store. It lives in its own
localStorage key next to `spcc-cruise`, read through the same try/catch idiom `activeCruiseId()`
already uses. New file `src/data/sailings.ts`:

```ts
export interface Sailing {
  id: string        // 'byo-XXXXXXXX'
  ship: string
  line: string      // '' when not given
  start: string     // YYYY-MM-DD
  end: string       // YYYY-MM-DD
  updatedAt: number
}

interface SailingStore {
  v: 1
  sailings: Sailing[]
  /** cruise id -> venue key -> venue. Holds a user sailing's whole venue list, and any venue
   *  added to a published sailing. One shape, so there is one lookup. */
  venues: Record<string, Record<string, VenueRaw>>
}
```

- **localStorage key:** `spcc-sailings`. Read with try/catch and a shape check; anything unreadable
  is treated as empty, exactly as `activeCruiseId()` treats a blocked store.
- **No read at module load.** The first call to `allSailings()` or `venuesFor()` reads and caches;
  the module body touches nothing. `cruises.ts` forces that first read anyway when it builds
  `CRUISES`, so nothing changes in the browser, but it means `sailings.ts` can be imported by a test
  file under `node --test`, where `localStorage` does not exist. Every write invalidates the cache
  and re-reads on the next call.
- **Cruise id:** `'byo-' + eight characters` from `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (the same
  ambiguity-free alphabet `share.ts:43` uses), from `crypto.getRandomValues`. Unique per sailing so
  the backend's per-cruise scoping does the right thing without a schema change.
- **Venue key:** `'u-' + slug(name).slice(0, 20) + '-' + four characters` from the same alphabet,
  lower-cased. `slug` keeps `[a-z0-9]` and collapses everything else to nothing; when it comes out
  empty (a name in a non-Latin script, or only punctuation) it falls back to `venue`, so a key is
  never `u--XXXX`. Four characters is 32⁴, about a million, which is not enough to assume uniqueness
  by itself: the generator retries until the key is absent from `venuesFor(cruiseId)`, capped at
  eight tries, after which it appends a second group of four. Published keys are `[a-z0-9]+` with no
  hyphen (verified: all 28 keys in `raw.ts` match `^[a-z0-9]+$`), so `u-` can never collide, and a
  `startsWith('u-')` test is enough to tell a user venue from a published one. Renaming a venue does
  not change its key, so nothing logged there is orphaned.
- **Exports:** `allSailings()`, `sailingById(id)`, `saveSailing(s)`, `deleteSailing(id)`,
  `venuesFor(cruiseId)`, `saveVenue(cruiseId, key, venue)`, `removeVenue(cruiseId, key)`,
  `newSailingId()`, `newVenueKey(cruiseId, name)`, `isUserVenue(key)`, `exportAll()` (every sailing
  with its venues, one object, so a future share codec is a codec and not a migration),
  `exportSailing(id)` (one of them, same shape), `importSailings(list)` for restore.
- **What it does not hold.** No drinks, no entries, no visits. Those are store state, so every
  removal is two calls, the store's first (see "Removing a sailing or a venue" below).

### `cruises.ts` merges once

`CRUISES` becomes `[SUN_PRINCESS, ...allSailings().map(toCruise)]`, memoised at module load.
`toCruise` builds a `Cruise` whose `data` is `{ START: s.start, END: s.end, VENUES: venuesFor(s.id),
COCKTAILS: [], WINES: [], BEERS: [] }` with `PLUS` and `PREM` absent, and whose `name` is
`` `${s.ship} Cocktail Passport` ``. The published cruise's `data.VENUES` becomes
`{ ...sunPrincess.VENUES, ...venuesFor('sun-princess-2026') }`, so a venue added to a published
sailing works through the same path.

`cruises.ts:37` today passes the namespace import straight through as `data: sunPrincess`. With
`VENUES` merged and `DECK_LABELS` added, the published entry becomes an explicit object
(`{ ...sunPrincess, VENUES: merged, DECK_LABELS: sunPrincess.DECK_LABELS }`) rather than the
namespace, because a namespace spread of a module is the one shape where a missing field is silent.

### `PLUS` and `PREM` become optional, and what that costs

`CruiseDataset` gains `PLUS?: number` and `PREM?: number`. Only two files read them
(`model.ts:8,10,43-45,54-55` and `AddSheet.tsx:2,40-42`), and both need work or `tsc` fails on
`number | undefined` and the runtime writes `NaN`:

- **`PLUS` and `PREM` are dropped from `model.ts:10`'s re-export.** They stay as module-local
  bindings off the line 8 destructure, and the exported surface becomes
  `export const HAS_PACKAGES = typeof PLUS === 'number' && typeof PREM === 'number'` plus
  `pkgFields()` below. Re-exporting a `number | undefined` invites exactly the comparison this
  section exists to stop, and after this change nothing outside `model.ts` reads either number
  directly: `grep -rn "PLUS\|PREM" src/` returns `cruises.ts` (the interface), `model.ts` itself and
  `AddSheet.tsx:2,40-42`, and step 13 routes `AddSheet` through `pkgFields()`. Removing them from
  the export makes `tsc` name any consumer this grep missed, rather than letting it compile against
  `undefined`.
- One helper, exported and used by both files, so the classification lives in one place as `pkgOf`
  already does:

```ts
/** The three package fields for a price. Null throughout when the sailing declares no package
 *  tiers, or the price is unknown: Math.max(0, p - undefined) is NaN, and NaN in `extra` is what
 *  a user sailing would otherwise store on every drink with a price. */
export function pkgFields(p: number | null): Pick<Drink, 'plus' | 'premier' | 'extra'> {
  if (p === null || !HAS_PACKAGES) return { plus: null, premier: null, extra: null }
  return { plus: p <= PLUS!, premier: p <= PREM!, extra: Math.max(0, p - PREM!) }
}
```

- `buildDrinks()` uses it in all three loops. The wine `desc` at `model.ts:54` also reads `PLUS`
  directly; it becomes `HAS_PACKAGES && w[2] <= PLUS! ? 'Within the Plus allowance.' : 'Premier tier.'`.
  Both wine loops are dead on a user sailing (`WINES` and `BEERS` are `[]`), but `tsc` still has to
  pass over them.
- `pkgOf` gains one line at the top: `if (d.plus === null || d.premier === null) return 'unknown'`.
  The dataset-level test is not enough on its own, because a drink can carry a price and still have
  no tier: on a package-less sailing every drink has `plus: null` with a real `price`, and today's
  `pkgOf` would fall through its two tests and return `'over'`, which is a claim about a package the
  sailing does not have.

### Custom drinks become cruise-scoped

`Drink` gains one optional field in `model.ts`:

```ts
  cruise?: string // set on a drink the guest added: it appears only on the sailing it was added to
```

`AddSheet` stamps `cruise: useStore.getState().cruiseId`, not `activeCruiseId()`. The two agree in
practice (`enterCruise` writes both), but `allDrinks()` filters against `cruiseId`, so stamping from
the same source removes any chance of a drink being written under one id and read under another.

`allDrinks()` and `useAllDrinks()` filter `custom.filter(d => !d.cruise || d.cruise === cruiseId)`;
the `!d.cruise` arm keeps a drink from an older backup visible rather than silently hiding it.

One consequence of that arm, stated so it is not read as a bug: a legacy drink with no `cruise` and a
published venue key shows up on a user sailing, where its key is not in `VENUES`. It lands in
`Drinks.tsx`'s existing `extra` group (`Drinks.tsx:63-64`), which is dead today and stops being dead
here, under its existing heading "Your own drinks". That is the right place for it and no copy
changes; the alternative, hiding it, would lose a drink the guest wrote.

### Removing a sailing or a venue: two new store actions

`sailings.ts` holds no drinks, entries or visits, so it cannot honour either removal note on its own.
`store.ts` gains two actions, both pure state edits with no network and no reload of their own:

```ts
/** Everything this phone holds for one sailing, dropped: the drinks added on it, their entries, and
 *  the visits on its venues. Called before deleteSailing(), which is what makes the venue keys
 *  readable. */
forgetSailing: (cruiseId: string, venueKeys: string[]) => void
/** The same, for one venue: the drinks added at it on this sailing, their entries, and its visit. */
forgetVenue: (cruiseId: string, venueKey: string) => void
```

Both drop the matching `custom` entries, then delete `me.entries[id]` for each dropped drink id and
`me.visits[k]` for each key. They touch `friends` and `profile` not at all. `me` changing fires the
existing `useStore.subscribe` in `sync.ts:173-175`, so the next publish carries the smaller passport;
nothing extra is needed for that.

**This is the one place the passport is written to on a sailing's behalf, and Out of scope says the
opposite for every other case.** "Per-sailing passports" below keeps `me.entries` and `me.visits` as
one map across sailings, and the sailing sheet's editing copy promises "your logged drinks stay where
they are". Both hold, because deleting is not editing and because these two actions only ever remove
keys that cannot resolve to anything once the sailing is gone: `c…` drink ids whose `Drink` record is
being deleted with them, and `u-…` venue keys belonging to this cruise id. A published venue key, a
`d…`/`w…`/`b…` id, and anything under another sailing are all unreachable from either argument.
Removing a venue while keeping the entry for a drink that no longer exists would leave a passport
counting drinks it cannot name, which is the dishonest number DESIGN.md's "Honest" forbids.

### Persist version bump and migrate

**Version 10.** The store is at 8 today (`store.ts:350`); B takes 9 for `enteredCruise`
(`2026-09-10-b-entry-first-open.md`, "Data and state") and C's spec explicitly stays at 8 and adds no
step. If `store.ts` on `product` carries a different number when BYO starts, take the next one after
it and keep the step last in the chain. Appended after the `from < 9` block and before
`return persisted`:

```ts
if (from < 10 && persisted) {
  // Custom drinks are now scoped to the sailing they were added on. Everything that already exists
  // was added on the sailing this phone is in: there was only one until now.
  try {
    const cid = persisted.cruiseId || activeCruiseId()
    const list = Array.isArray(persisted.custom) ? persisted.custom : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persisted.custom = list.map((d: any) => (d && d.cruise ? d : { ...d, cruise: cid }))
  } catch { /* a corrupt custom list must not cost the guest their passport */ }
}
```

`activeCruiseId` is already imported at `store.ts:3`, so the step adds no import. The `try/catch` and
the `Array.isArray` guard are there for the same reason the `from < 8` step has one: `migrate` runs
over a blob the app did not write this session, and a throw here loses the whole persisted store.

**Every existing user keeps everything.** The step adds one field to each custom drink and touches no
other key. The `!d.cruise` arm in `allDrinks()` means that even a drink the step somehow missed stays
visible. Nothing is deleted, renamed or reordered, and `me`, `friends`, `profile`, `groups` and
`seenMedals` are not read.

`partialize` is unchanged: venues and sailings are not store state. No other store field moves.

### localStorage keys after this change

| Key | Owner | Holds |
| --- | --- | --- |
| `spcc-cruise` | `src/data/cruises.ts` | the active cruise id (unchanged) |
| `spcc-sailings` | `src/data/sailings.ts` | user sailings and every user venue (new) |
| `spcc2` | zustand persist | the passport, custom drinks, crew, profile (version 8 to 10) |

Three keys, not four: sailings and venues share `spcc-sailings` because they are read together, at
module load, by the same caller, and splitting them would give two reads that must not disagree. The
QA fixtures write all three (Verification), which is the whole reason the seed block is inline in
`<head>`.

### Model derivations that stop being hard-coded

- `DECKS` becomes `Array.from(new Set(VENUE_KEYS.map(k => VENUES[k].deck))).sort((a, b) => a - b)`.
  **Verified against the data, not counted by eye**: parsing the 28 venue records in `raw.ts` gives
  decks `[7, 8, 9, 15, 17, 18]` at counts 9, 6, 4, 1, 6, 2, so the derivation returns exactly the
  array it replaces and Ship, Stats and the filter panel render identically on the published sailing.
- `deckLabel(deck)` reads a new optional `DECK_LABELS` field on `CruiseDataset` and returns
  `DECK_LABELS?.[deck] ?? String(deck)`, so a user sailing with no labels prints the number. `raw.ts`
  gains `export const DECK_LABELS: Record<number, string> = { 15: '15/16' }` (an added export, not an
  edited value; the file header forbids editing values, not adding a derived fact), which is where
  the "Deck 15/16" fact belongs: it exists today only as two inline conditionals in
  `FilterPanel.tsx:71` and `:79`. The field is spelled `DECK_LABELS`, exactly as `raw.ts` exports it
  and exactly as `START`, `PLUS` and `PREM` are, and step 2 replaces the namespace pass-through at
  `cruises.ts:37` with an explicit object so a mis-spelled field is a `tsc` error rather than a
  silent `undefined`. `Ship`, `Stats` and `FilterPanel` all call `deckLabel`, which also fixes the
  existing inconsistency where the filter panel says 15/16 and Ship says 15.
- `CATEGORIES` becomes the union of the active catalogue's categories and a base vocabulary, sorted:
  `['Classic', 'Signature', 'Martini', 'Margarita', 'Spritz', 'Frozen', 'Coffee', 'Dessert',
  'Mocktail', 'Wine', 'Beer']`. Every one of those is a category the published dataset already
  uses, so nothing is invented; the four the badges key off (`Martini`, `Margarita`, `Coffee`,
  `Wine`) are in it, so those badges stay reachable on a user sailing. The two Princess brand names
  in the data, `Beyond` and `Cocktail Magic`, are deliberately not in the base list and still appear
  on the published sailing because they come from its catalogue.

  **Verified on the published data, not asserted.** Parsing `raw.ts` gives 166 cocktails, 21 wines
  and 27 beers, and its thirteen categories are `Beer, Beyond, Classic, Cocktail Magic, Coffee,
  Dessert, Frozen, Margarita, Martini, Mocktail, Signature, Spritz, Wine`. The eleven base entries
  are a subset of those thirteen, so on the published sailing the union is the same thirteen in the
  same sorted order and `AddSheet`'s Type select and `FilterPanel`'s Type chips do not move. That is
  what makes this change safe to ship on the October sailing.
- `VENUE_TYPES` is exported from `model.ts` as
  `['Bar', 'Pub', 'Lounge', 'Café', 'Pool bar', 'Restaurant', 'Experience']`, the seven types the
  published dataset uses and nothing else (verified: those are exactly the `type` values across the
  28 venues, at counts 5, 1, 2, 3, 7, 8, 2). It is the venue form's Kind list and the source
  `isRestaurant` is read against, so the two cannot drift.
- `SHIP` is exported from `model.ts` as `activeCruise().ship`, so the four places that print
  "Sun Princess" print the sailing's ship instead. Verified: `grep -rn "Sun Princess" src/` returns
  exactly those four runtime literals (`AddCrewSheet.tsx:110`, `Wrapped.tsx:154`, `Wrapped.tsx:249`,
  `wrappedImage.ts:213`) plus the champion badge, the published cruise's own registry entry
  (`cruises.ts:32,33`, which is data about that sailing and stays), and two file-header comments.
- `WRAPPED_TOTAL` **is not `DRINKS.length`.** On a user sailing `DRINKS` is empty, because
  `COCKTAILS`, `WINES` and `BEERS` are all `[]` and every drink is custom, so that constant would be
  `0` for ever and `wrappedData.ts:154` would compute `stats.n / 0 * 100`, which is `NaN` on a
  passport with nothing logged and `Infinity` on one with something. Wrapped is reachable there:
  `wrappedUnlocked` (`wrappedData.ts:212-213`) also unlocks on `now > END`, and a guest can enter a
  sailing whose last day has passed. So the constant becomes a function of the list actually in play:

```ts
/** Every drink on this sailing, the guest's own included. A user sailing has no published
 *  catalogue, so the total is the catalogue they built. Zero-guarded: an empty sailing that has
 *  reached Wrapped by date must read 0%, not NaN%. */
export const wrappedTotal = (drinks: Drink[]): number => drinks.length
```

  `deriveWrapped` already holds `drinks`, so `pct` becomes
  `drinks.length ? Math.min(100, stats.n / drinks.length * 100) : 0`. `Wrapped.tsx:164` and `:228`
  take `wrappedTotal(drinks)` off the `useAllDrinks()` they already read. On the published sailing
  the number changes from a hard-coded 214 to `drinks.length`, which is 214 for a guest with no
  custom drinks and 217 for one who added three; that is a correction, not a regression, because the
  hero beside it has always said 217.
- `isRestaurant` becomes `const v = VENUES[key]; return !!v && VENUE_TYPES_RESTAURANT.includes(v.type)`
  where `VENUE_TYPES_RESTAURANT` is `['Restaurant', 'Experience']`, kept beside `VENUE_TYPES` so the
  venue form's Kind list and this test are read from adjacent lines.

### Numeric guards

Three divisions and one comparison can go wrong once a catalogue can be empty or a venue key unknown.

- `computeStats` (`stats.ts:119`): `const pct = drinks.length ? (tried.length / drinks.length) * 100 : 0`.
  Without this an empty catalogue paints `NaN%` in the hero (`Home.tsx:194`, via
  `Math.min(100, NaN)`).
- `deriveWrapped` (`wrappedData.ts:154`): the same guard, against `drinks.length`. See
  `wrappedTotal` above.
- `everybar` (`badges.ts:35`): `test: (s) => s.totalVenues > 0 && s.venues >= s.totalVenues`. Without
  this it is earned instantly on a sailing with no venues, because `0 >= 0`. With it, `progressOf`
  (`Badges.tsx:61-65`) returns `null` for `need <= 0`, so the badge lands in **Locked**, not in Close
  and not in Earned. That is the right place: it is not close, and it cannot be earned yet.
- `computeStats` (`stats.ts:77`): `tried.forEach(d => { if (VENUES[d.venue]) vset[d.venue] = 1 })`.
  Today `badgeStat.venues` counts the venue of every tried drink without checking it is a venue on
  this sailing, so a legacy custom drink carrying a published venue key (the `!d.cruise` arm above)
  would push `venues` above `totalVenues` on a user sailing and earn `Every Bar` off a bar that is
  not on the ship. `checked` at `stats.ts:75` is already filtered against `VENUE_KEYS`; this makes
  the other half agree. **On the published sailing it is a no-op**: no drink can carry a venue key
  outside `VENUES` there, because `AddSheet` only ever offered keys from `VENUE_KEYS`, so the
  regression sweep must show no change from this line.

### Share payload

`buildPayload` skips user venue keys the way it already skips custom drink ids:

```ts
for (const [k, v] of Object.entries(me.visits)) if (v.visited && !isUserVenue(k)) s[k] = 1
```

`parseFriend` drops incoming visit keys that are not in `VENUES` (`share.ts:151-152`), so a code from
a phone on a different sailing cannot put keys into the roster that resolve to nothing.

One thing this does **not** fix, recorded so it is not filed as a bug: `parseFriend` already filters
an incoming entry's date to the active sailing's window (`share.ts:145`, `pe.d >= START && pe.d <= END`).
On a user sailing with different dates, a friend's dates are dropped and their drinks arrive undated.
It is invisible in practice because a user sailing has no crew until the share codec exists (Out of
scope), and fixing it means either carrying the sender's window in the payload or dropping the check,
both of which belong with that codec.

## Backend

No new table, no new RPC, no RLS change, no `supabase/config.toml` change.

`backups.state` is `jsonb` with primary key `(user_id, cruise_id)`, so a user sailing's backup is
simply another row under its own cruise id and needs no schema work. One change to the payload:
`publishBackend()` in `src/state/sync.ts` writes

```ts
void publishBackup(s.cruiseId, { me: s.me, custom: s.custom, profile: s.profile, sailings: exportAll() })
```

where `exportAll()` is every sailing with its venues. It rides in **every** backup row, including the
published sailing's, so that a phone restoring the default cruise id learns the user's own sailings
too. The payload is a few kilobytes.

**That is not sufficient on its own.** A row exists only for a cruise the guest has actually been on.
Someone who set up their own sailing on their first open and never entered the Sun Princess has
exactly one `backups` row, under `byo-…`, and C's `restoreNow()` asks for `fetchBackup(cruiseId)`
with `cruiseId` = the default on a fresh phone. It would find nothing and the sailing would be lost,
which is the failure this section exists to prevent.

So `src/state/backend.ts` gains one function, and no migration:

```ts
/** Every backup row this user owns, newest first. `backups` RLS is own-row
 *  (`0001_init.sql:85`, "own backup" for all using auth.uid() = user_id), so a plain select is the
 *  whole query: no RPC, no policy change, no schema change. */
export async function listBackups(): Promise<{ cruiseId: string; state: unknown; updatedAt: string }[] | null>
```

It holds the file's standing contract, which the brief restates: it never throws, returns `null` for
"did not answer", and `[]` for "you own none". `null` and `[]` are different answers and the caller
must not conflate them, or a failed request would read as "you have no sailings" and the phone would
adopt nothing while reporting success.

C's `restoreNow()` (its spec, "`restoreNow()`: `restore: 'working'`; `fetchProfile()` and
`fetchBackup(cruiseId)` in parallel") gains `listBackups()` to that same `Promise.all`. On a non-null
result it merges the sailings out of every row and writes them with `importSailings()`. The passport
merge is untouched: it still comes from `fetchBackup(cruiseId)` for the active cruise only.

**The merge itself is pure and lives in `restore.ts`, under C's import rule.** C's spec is explicit
that `restore.ts` carries "only `import type` declarations, never an inline `type` modifier inside a
value import", because `data/model.ts` and anything reaching it read `location` at module level and
throw under `node --test`. `sailings.ts` is in that class the moment it is imported for a value. So:

```ts
// restore.ts: pure, no runtime import from src. Sailings union by id, newer updatedAt wins; venues
// merged per cruise id, the backup's copy winning only on a key the phone does not hold, so a venue
// the guest renamed on this phone is not overwritten by an older name from the server.
export function mergeSailings(local: SailingExport, remote: SailingExport): SailingExport
```

`SailingExport` is declared in `restore.ts` structurally (`{ sailings: {...}[]; venues: Record<string, Record<string, {...}>> }`),
not imported from `sailings.ts`, for the same reason. The caller in `sync.ts` or `ProfileSheet` does
the `importSailings()` write; `restore.ts` never touches `localStorage`.

## Implementation steps

Each step is one commit, in order. Steps 1 to 6 change no pixels.

1. **`src/data/sailings.ts`, new.** The `Sailing` interface, `SailingStore`, the lazy cached
   `spcc-sailings` read and the write, both in try/catch, `newSailingId()`,
   `newVenueKey(cruiseId, name)` with its retry, `isUserVenue(key)`, and the exports listed in Data
   and state. No imports beyond `type VenueRaw` from `./raw`, and **no read at module load**.
2. **`src/data/cruises.ts`.** `PLUS?`, `PREM?` and `DECK_LABELS?` optional on `CruiseDataset`;
   `toCruise(sailing)`; `CRUISES` as the published cruise plus the user sailings; the published
   cruise's `VENUES` merged with `venuesFor('sun-princess-2026')`; the `data: sunPrincess` namespace
   pass-through at line 37 replaced by an explicit object. Memoise the merge at module load.
3. **`src/data/raw.ts`.** Add `export const DECK_LABELS: Record<number, string> = { 15: '15/16' }`
   with a comment citing `FilterPanel.tsx:71,79` as its source. Add nothing else and edit no value.
4. **`src/data/model.ts`.** `Drink.cruise?`; `HAS_PACKAGES` and `pkgFields()`; `buildDrinks` and the
   wine `desc` at line 54 through them; `DECKS` derived; `deckLabel()`; `CATEGORIES` as the union
   with the base vocabulary; `VENUE_TYPES` and `VENUE_TYPES_RESTAURANT` exported; `SHIP` exported;
   `pkgOf` gaining the null-tier test; `isRestaurant` guarded.
5. **`src/features/drinks/facets.ts`.** Two changes, and the second is the one an implementer
   misses: `matchQuery` (line 20) uses `VENUES[d.venue]?.name || ''`; `GROUPS.decks` (line 27) uses
   `pass: (d, f) => !f.decks.length || f.decks.indexOf(VENUES[d.venue]?.deck ?? -1) > -1` **and**
   `tokens: (d) => { const v = VENUES[d.venue]; return v ? [v.deck] : [] }`. Without the `tokens`
   half, a drink at an unknown venue tallies a facet count under the key `"undefined"` and the filter
   panel grows a chip labelled `Deck undefined`. `GROUPS.pkg` is unchanged (`pkgOf` now answers
   `'unknown'`).
6. **`src/state/stats.ts` and `src/data/badges.ts`.** The `pct` zero guard and the `vset` venue guard
   in `computeStats`; the `everybar` `totalVenues > 0` guard and its new hint; the champion badge
   named from `SHIP`. `badges.ts` takes `SHIP` from `../data/model`, not `activeCruise()` from
   `../data/cruises`, so there is one source for the ship name. Check the import graph as you do it:
   `store.ts` and `stats.ts` both import `badges.ts`, and `badges.ts` importing `model.ts` is a new
   edge. It is acyclic (`model.ts` imports neither) but it does make `badges.ts` require
   `localStorage` at import, so `restore.ts` must not import it. It does not.
7. **`src/state/store.ts`.** `Drink.cruise` filtering in `allDrinks()` and `useAllDrinks()`;
   `forgetSailing` and `forgetVenue`; the persist version bump to 10 and its migrate step.
8. **`src/state/share.ts`.** Skip user venue keys in `buildPayload`; drop unknown visit keys in
   `parseFriend`.
9. **`src/features/ship/VenueForm.tsx`, new.** The add and edit sheet, `Save and add another` with
   the `Confirm` tick, the `ConfirmButton` remove path, the reload-on-close note, and the reload
   itself fired from the close handler only when something was saved.
10. **`src/features/ship/Ship.tsx`.** `deckLabel` in the deck heading; the empty state; the foot
    action opening `VenueForm`, on a row carrying the class `ship-add` (the class QA clicks).
11. **`src/features/ship/VenueSheet.tsx`.** Guard the shared-list line
    (`VENUES[venue.shares]?.name`); omit the blurb paragraph when the blurb is empty; drop the
    trailing comma in the meta line when there are no hours; add the "Edit this venue" row for a
    user venue. The form **replaces** this sheet rather than opening over it, exactly as the drink
    sheet already does at `VenueSheet.tsx:24-26` (`if (openId) return <DrinkSheet …/>`). A sheet over
    a sheet is glass on glass, which DESIGN.md's Material section forbids outright.
12. **`src/features/cruise/SailingSheet.tsx`, new**, and one `button.row.pressable.cruise-byo` in its
    own wrapper `div`, placed beneath B's module 2 (Design placement · First-open screen). B builds a
    `Select`, not a list, so there is nothing to append to and nothing of B's is restyled. Read B's
    shipped code before writing this step, and re-check its height assertion still holds.
13. **`src/features/drinks/Drinks.tsx` and `AddSheet.tsx`.** The two catalogue-empty states, branched
    on `drinks.length === 0` **before** the `results.length === 0` test at line 92, with the search
    row, filter panel, count line and "Add a missing drink" suppressed in that state; the `cruise`
    stamp on a new drink, from `useStore.getState().cruiseId`; `pkgFields()` in place of the three
    inline computations at `AddSheet.tsx:40-42`; and `AddSheet`'s no-venue branch. That branch
    renders the sheet title, its meta line and the same `Link` to `/ship` the Drinks empty state
    uses, in place of the form. It does **not** disable the venue `Select`: `src/ui/Select.tsx` has
    no `disabled` prop (only per-option `disabled` and a `placeholder`), and minting one would mean a
    registry entry in `DESIGN.md` and a sweep of every other `Select`, for a state that is reachable
    only through the `/drinks?add` deep link once the toolbar control is suppressed.
14. **`src/features/drinks/FilterPanel.tsx`.** `deckLabel` at lines 71 and 79; hide the Package
    segment (lines 57 to 58) when `!HAS_PACKAGES`.
15. **`src/features/home/Home.tsx`.** `DAYS.length` in `countdown()` (line 33); both module-2 zero
    branches, on `VENUE_KEYS.length === 0` before sailing and `s.barsTotal === 0` aboard; the hero
    sub-line when there are no drinks (line 195).
16. **`src/features/stats/Stats.tsx`, `src/features/wrapped/wrappedData.ts`,
    `src/features/wrapped/Wrapped.tsx`, `src/features/wrapped/wrappedImage.ts`,
    `src/features/friends/AddCrewSheet.tsx`.** `deckLabel` in the Stats deck rows (line 147);
    `wrappedTotal(drinks)` replacing `WRAPPED_TOTAL` at `wrappedData.ts:6,154` and
    `Wrapped.tsx:164,228`, with the zero guard; `SHIP` in place of the four "Sun Princess" literals
    at `Wrapped.tsx:154`, `Wrapped.tsx:249`, `wrappedImage.ts:213` and `AddCrewSheet.tsx:110`.
17. **`src/state/sync.ts`, `src/state/backend.ts` and `src/state/restore.ts`.** `sailings:
    exportAll()` in the backup payload at `sync.ts:67`; `listBackups()` in `backend.ts` under the
    never-throws contract; `mergeSailings()` in `restore.ts` with type-only imports; and the call
    site, `listBackups()` added to `restoreNow()`'s `Promise.all` with the `importSailings()` write
    on a non-null result. All four, or the function exists and nothing uses it.
18. **`index.html`.** The three QA fixtures (Verification), inside the existing seed block and
    behind the existing untouched-passport guard, returning before the demo seed's own `spcc2` write
    so the two never both run.
19. **Docs.** `docs/DESIGN.md`: the Ship and Drinks screen sections gain their new states, and the
    registry gains `Sailing`/`venuesFor` and `VenueForm`. `CLAUDE.md`: a line under "Where things
    are" for `src/data/sailings.ts` and the reload contract. `STATE.md` and `PROJECTS.md` updated in
    the same turn. Merge into these files; never rewrite them.

## Verification

One dev server on 5173 (`npm run dev`), never a second. Every screenshot at 390×844, written to
`tools/qa/shots/`.

### Gates

```bash
npx tsc -p tsconfig.app.json --noEmit     # no output, exit 0
npm run lint                              # 0 errors; 28 warnings, verified as the count on `product`
npm run design:check                      # "design:check: N files, clean", exit 0
node tools/qa/scan.mjs src/features/ship src/features/cruise src/features/drinks src/features/home
```

`scan.mjs` without `--check` prints one `<file>: clean` line per file and **never exits non-zero**
(`scan.mjs:98-104`), so it is for reading, not for gating: every file it lists must say `clean`, or
its suspect lines must be justified. `npm run design:check` is `scan.mjs --check src` and is the
gate that fails (`process.exit(1)`); it is also what CI runs before the build.

### Fixtures

`shot.mjs` always appends a bare `seed` (`shot.mjs:33`), so a fixture is selected by a second
parameter the seed block reads. The block is an inline `<script>` in `<head>` (`index.html:36-89`),
ahead of `<script type="module" src="/src/main.tsx">` at line 93, which is why it can write the
catalogue keys at all: `cruises.ts` and `model.ts` resolve their dataset at module load, and the
fixture has to be in `localStorage` before that.

Each fixture writes **three** keys, not one: `spcc2`, `spcc-cruise` and `spcc-sailings`. It returns
immediately after, before the demo seed's own `spcc2` write at line 86, so the two never both run.

**`spcc2` must be written at the store's current persist version, not at 2.** The existing seed
writes `version: 2` (`index.html:86`) and lets `migrate` bring it forward, which is fine for the Sun
Princess demo but fatal here: the `from < 5` and `from < 6` steps set `enteredCruise = true`, and
workstream B's `from < 9` step sets it unconditionally. A fixture that wants the first-open screen
has to write the current version so no migrate step runs over it. Write `seenMedals: []` explicitly
for the same reason: at the current version the `from < 8` step does not run to seed it.

**Fixture dates are fixed, not relative to today.** "Five days from today" cannot be pinned with
`?day=`, and both the countdown chip and Home's module 2 branch on whether today is inside the
sailing, so a relative fixture makes those two shots say something different every week. The fixture
sailing runs **2027-03-01 to 2027-03-10**, ten days, chosen because ten is not fifteen: the whole
point of the `countdown()` change is that the chip stops saying "of 15", and a fifteen-day fixture
could not tell the two apart. The dates are far enough ahead that the unpinned shots reliably land in
the pre-sailing branch, and `?day=2027-03-04` pins the aboard branch.

Three fixtures, all obviously synthetic and marked as such in the block's comment:

- `?fixture=byo-new`: `spcc2` at the current version with `enteredCruise: false`, an empty
  `spcc-sailings`, and no `spcc-cruise`. `CRUISES` has one entry, so B renders its single-sailing
  module 2 and the BYO row sits beneath it.
- `?fixture=byo-empty`: `spcc-sailings` with one sailing (ship "QA Sailing", line "QA Line", id
  `byo-QAFIXTR0`, 2027-03-01 to 2027-03-10) and an empty venue record for it; `spcc-cruise` set to
  that id; `spcc2` at the current version with `cruiseId` matching, `enteredCruise: true`, no
  entries, no visits, no custom drinks, `seenMedals: []`.
- `?fixture=byo`: the same sailing, with three venues in `spcc-sailings` under its id
  ("Fixture Bar One" deck 4 Bar, "Fixture Café" deck 4 Café, "Fixture Bar Two" deck 5 Bar) and three
  custom drinks in `spcc2`'s `custom` stamped with that cruise id, two of them logged with a date
  inside the sailing.

No fixture names a real ship, bar or drink, and no price is invented (`price: null` throughout, and
`plus`, `premier` and `extra` all `null` with them).

### Screenshots

**`&nosync` on every one of them.** The brief's own rule is "QA against the live backend creates
anonymous users; prefer `?seed&nosync`", and the dev server on 5173 carries the real Supabase env
vars, so a sweep without it signs in thirteen anonymous users against a project that rate-limits
sign-ins per IP and where real users have existed since 3 September. `qaNoSync()` reads the exact
parameter (`model.ts:135-137`).

```bash
node tools/qa/shot.mjs byo-picker        "home?fixture=byo-new&entry&nosync"
node tools/qa/shot.mjs byo-picker-multi  "home?fixture=byo-empty&entry&nosync"
node tools/qa/shot.mjs byo-sailing-sheet "home?fixture=byo-new&entry&nosync" --click ".cruise-byo" --after 3000
node tools/qa/shot.mjs byo-ship-empty    "ship?fixture=byo-empty&nosync"
node tools/qa/shot.mjs byo-venue-form    "ship?fixture=byo-empty&nosync" --click ".ship-add" --after 3000
node tools/qa/shot.mjs byo-ship          "ship?fixture=byo&nosync" --full
node tools/qa/shot.mjs byo-drinks        "drinks?fixture=byo&nosync" --full
node tools/qa/shot.mjs byo-drinks-empty  "drinks?fixture=byo-empty&nosync"
node tools/qa/shot.mjs byo-filters       "drinks?fixture=byo&openf&nosync" --full
node tools/qa/shot.mjs byo-home          "home?fixture=byo&nosync" --full
node tools/qa/shot.mjs byo-home-aboard   "home?fixture=byo&day=2027-03-04&nosync" --full
node tools/qa/shot.mjs byo-home-empty    "home?fixture=byo-empty&nosync" --full
node tools/qa/shot.mjs byo-badges        "badges?fixture=byo-empty&nosync" --full
node tools/qa/shot.mjs byo-venue-sheet   "ship?fixture=byo&nosync" --click ".venue-row" --after 3000
```

`?entry` is workstream B's QA override, which renders the entry screen whatever the store says. Both
entry shots go through it rather than relying on `enteredCruise` alone, because B's `from < 9`
migrate step exists precisely to mark stores entered.

What each must show:

- `byo-picker`: B's single-sailing module 2 (ship, one meta line), then "Set up your own sailing" as
  a two-line row beneath it, **no chevron** (it is B's privacy row, not Crew's group row), no pill,
  no dot, no rule under any heading, corners rounded not squared, and the screen does not scroll.
- `byo-picker-multi`: **the first render of B's multi-sailing branch in the app's history.** B's spec
  says that branch "cannot render today" and is "verified by `tsc` only"; BYO is what makes
  `CRUISES.length > 1`, so BYO is what has to look at it. It must show the "Choose your sailing"
  `h1`, the `Select` under its `.f-label` with two options, then the BYO row. **The `Select` must
  read "QA Sailing", not "Sun Princess"**: its value is B's `chosen`, initialised from
  `activeCruiseId()`, and the fixture sets `spcc-cruise` to `byo-QAFIXTR0`, so a `Select` sitting on
  Sun Princess means `activeCruiseId()` did not resolve a BYO id through the rebuilt `CRUISES` and
  step 2 is wrong. Without that clause the shot passes on a broken registry. Nobody else will check
  this.
- `byo-sailing-sheet`: four fields, one primary button, the crew limitation line at the foot.
- `byo-ship-empty`: the two lines and one coral button, nothing else, no empty deck sections, and
  **no foot action** (the two never render together).
- `byo-venue-form`: five fields in the order named, `Add it` then `Save and add another`.
- `byo-ship`: "Deck 5 · 0 of 1" above "Deck 4 · 2 of 2", each venue a row with a meter, the foot
  action last.
- `byo-drinks`: three drinks under two venue headings reading "Fixture Bar One · Deck 4", the count
  line, and "Add a missing drink".
- `byo-drinks-empty`: the "Add a venue first" copy and one primary button, and **no search field, no
  filter control, no count line and no "Add a missing drink"**.
- `byo-filters`: **no Package segment**, deck chips 4 and 5, venue chips under each deck heading.
- `byo-home` (pre-sailing, the fixture starts in 2027): the chip reading "Sails in n days", module 2
  under "The ship" showing 3 bars, 0 restaurants, 2 decks, and no `NaN` anywhere. Three bars, not
  two: `isRestaurant` counts only Restaurant and Experience, so the fixture's Café is a bar here.
- `byo-home-aboard` (`?day=` inside the sailing): the chip reading "Day 4 of 10 aboard". This is the
  shot that proves `countdown()` stopped saying 15; the unpinned one cannot, because it never enters
  the aboard branch. Module 2 shows "Today" with three facts, none of them `0 of 0`.
- `byo-home-empty`: the hero at `0%` with `no drinks` / `yet`, and module 2 under "The ship" as the
  single "Add your first venue" row rather than three zeros.
- `byo-badges`: "Every Bar" **not** in Earned, and present under Locked.
- `byo-venue-sheet`: title, one meta line with no trailing comma, the "Edit this venue" row rounded
  and tinted like the sheet's other controls, the visited switch, the progress line.

Every run must print no `HORIZONTAL OVERFLOW` and no `console: EXC`.

### The guards, asserted rather than eyeballed

A screenshot cannot tell `0%` from `0%`-that-was-nearly-`NaN%`, and it certainly cannot tell 10 from
15 at a glance. Three assertions, each read off the printed `eval:` line:

```bash
node tools/qa/shot.mjs byo-pct    "home?fixture=byo-empty&nosync" --eval "document.querySelector('.sea-pct').textContent"
node tools/qa/shot.mjs byo-chip   "home?fixture=byo&day=2027-03-04&nosync" --eval "document.querySelector('.sea-count').textContent"
node tools/qa/shot.mjs byo-medals "badges?fixture=byo-empty&nosync" --eval "JSON.stringify([...document.querySelectorAll('.badge-medal-name')].map(e=>e.textContent))"
```

1. Must print `"0%"`, never `NaN%`. `.sea-pct` is `Home.tsx:194`.
2. Must print a string containing `of 10`. If it contains `of 15` the `countdown()` change is not
   in, and no other check in this spec would catch it.
3. Must print `[]`. `.badge-medal-name` is the Earned grid only (`Badges.tsx:121`), so an empty array
   is the whole assertion: on a sailing with no venues and nothing logged, no badge is earned.

### Regression on the published sailing

`compare.mjs` reads both prefixes out of **one** `OUT` directory (`compare.mjs:16`), so the three
commands must share a `SHOTS_DIR`. Two sweeps written to different folders produce a montage with
zero cells and still exit 0, which is a gate that always passes:

```bash
SHOTS_DIR=shots-byo node tools/qa/shots.mjs http://127.0.0.1:5173 before   # before step 1
SHOTS_DIR=shots-byo node tools/qa/shots.mjs http://127.0.0.1:5173 after    # after step 19
SHOTS_DIR=shots-byo node tools/qa/compare.mjs before after                 # must print "pairs 11"
```

`compare.mjs` renders a montage for the eye; it does not diff pixels and it does not fail. The
mechanical first pass is a hash of the pairs, and anything that differs is then looked at in the
montage:

```bash
node -e "const{createHash}=require('crypto'),fs=require('fs'),p='tools/qa/shots-byo';const h=f=>createHash('sha1').update(fs.readFileSync(p+'/'+f)).digest('hex').slice(0,12);for(const f of fs.readdirSync(p).filter(f=>f.startsWith('before-')))console.log(h(f)===h(f.replace('before-','after-'))?'same ':'DIFF ',f.slice(7))"
```

**The intended differences on the published sailing, and there are three, not one:**

1. Ship gains the "Add a venue" row at the foot, so `ship` and `ship-full` differ.
2. Ship's deck 15 heading becomes "Deck 15/16" through `deckLabel`, and so does the Stats deck row,
   so `ship` and `stats` differ for that reason too. This is the deliberate fix of the existing
   inconsistency where the filter panel said 15/16 and Ship said 15; it is a change on the October
   sailing and Charles sees it in the montage.
3. The entry screen gains the "Set up your own sailing" row, which the sweep does not cover (it has
   no entry shot); `byo-picker` above is where it is checked.

`home` is expected to be identical, but the CSS fallback sea keys off the real clock (`nowHour()`),
so a `DIFF` on `home` across an hour boundary is the clock, not a regression: re-run the two sweeps
back to back before treating it as one. Every other pair must hash `same`.

`node tools/qa/gestures.mjs` must still print PASS on every case and exit 0. It drives the shared
`Sheet` primitive, which the two new sheets use unchanged, so a failure there means one of them
broke the gesture contract rather than that a new case is needed.

### Tests

Workstream C **does** establish a runner: its spec builds `src/state/restore.ts` as pure functions
with tests and turns on the `import type` rule specifically so `node --test` can load the file. So
BYO adds two test files to it rather than hedging:

- `src/data/sailings.test.ts`: a generated venue key never collides with a published key and never
  comes out as `u--`; `newVenueKey` retries rather than returning a key already in that sailing;
  `venuesFor` returns an empty record for an unknown cruise id; `exportAll` round-trips through
  `importSailings`. It can import `sailings.ts` because that file does no read at module load
  (Data and state); the tests stub `globalThis.localStorage` with a `Map`-backed object.
- `mergeSailings` cases added to C's `restore.test.ts`: newer `updatedAt` wins; a sailing only the
  backup holds is adopted; a venue only the phone holds survives; a venue both hold keeps the
  phone's copy.

Run with `node --test` as C's spec does. If `product` somehow carries no runner when BYO starts, say
so in the commit message rather than inventing one here, and the three assertions above are the
evidence.

## Files touched

The brief's contention map covers A, B and C only, so this is BYO's. It runs strictly after A, C, B
and E have landed, so no file here has a second writer at the time.

**In the workstream's own read list:** `src/data/cruises.ts`, `src/data/model.ts`, `src/data/raw.ts`,
`src/state/store.ts`, `src/state/stats.ts`, `src/state/share.ts`, `src/features/ship/Ship.tsx`,
`src/features/drinks/facets.ts`, `src/features/drinks/Drinks.tsx`.

**New:** `src/data/sailings.ts` (the catalogue store, the whole point of the workstream);
`src/features/ship/VenueForm.tsx` (the venue sheet, sibling of `AddSheet`);
`src/features/cruise/SailingSheet.tsx` (the sailing sheet, in B's folder because it belongs to the
entry screen).

**Additions, one line of justification each:**

- `src/data/badges.ts`: `everybar`'s zero guard and its hint naming a fixed 28; the champion
  badge naming a ship the guest may not be on.
- `src/features/ship/VenueSheet.tsx`: the unguarded `VENUES[venue.shares].name`, the empty
  blurb and hours, and the edit action for a user venue.
- `src/features/ship/ship.css`: classes for the foot action and the empty state, on the
  existing scale; no new token.
- `src/features/drinks/AddSheet.tsx`: stamps the cruise on a new drink, routes its three package
  fields through `pkgFields()`, and handles a sailing with no venues to pick.
- `src/features/drinks/FilterPanel.tsx`: `deckLabel` and hiding the Package segment when the
  sailing declares no package prices.
- `src/features/home/Home.tsx`: the hard-coded "of 15", both structural zeros in module 2, and
  the hero sub-line on an empty catalogue.
- `src/features/stats/Stats.tsx`: `deckLabel` in the deck rows.
- `src/features/wrapped/wrappedData.ts`, `Wrapped.tsx`, `wrappedImage.ts`,
  `src/features/friends/AddCrewSheet.tsx`: `WRAPPED_TOTAL = 214` and the four "Sun Princess"
  literals, which are false on a user sailing.
- `src/features/cruise/` (B's entry screen): one row and its wrapper, beneath B's module 2. B's own
  markup is not restyled and its `Select` is not replaced.
- `src/state/sync.ts`, `src/state/backend.ts` and `src/state/restore.ts` (C's files): the sailing
  rides in the account backup and is read back off every row, or a signed-in user who changes phone
  loses the sailing and keeps the passport. `backend.ts` gains `listBackups()` only; nothing existing
  in it changes.
- `index.html`: the three QA fixtures, inside the existing seed block.
- `docs/DESIGN.md`, `CLAUDE.md`, `STATE.md`, `E:\claude-projects\PROJECTS.md`: the standing
  documentation rule.

Honest size: nineteen commits across **thirty-two files**, three of them new, plus two test files if
C's runner is in. Counted: `sailings.ts`, `cruises.ts`, `raw.ts`, `model.ts`, `facets.ts`,
`stats.ts`, `badges.ts`, `store.ts`, `share.ts`, `VenueForm.tsx`, `Ship.tsx`, `ship.css`,
`VenueSheet.tsx`, `SailingSheet.tsx`, B's entry component, `Drinks.tsx`, `drinks.css`,
`AddSheet.tsx`, `FilterPanel.tsx`, `Home.tsx`, `Stats.tsx`, `wrappedData.ts`, `Wrapped.tsx`,
`wrappedImage.ts`, `AddCrewSheet.tsx`, `sync.ts`, `backend.ts`, `restore.ts`, `index.html`,
`DESIGN.md`, `CLAUDE.md`, `STATE.md` and `PROJECTS.md`. It is by a distance the largest of the five
workstreams, which is why the brief puts it last and why it must not start until the other four are
merged.

**One file is not touched and it is worth saying so.** `index.html`'s `<title>`, description and Open
Graph tags all name the Sun Princess. They are static markup read by crawlers, not by the app, and a
user sailing will show "Sun Princess Cocktail Passport" in the browser tab. Changing them is a
question about what the product is called and what it advertises, which is workstream E's, not a data
model change; BYO leaves them alone rather than half-solving it.

## Out of scope

- **A reactive catalogue.** Adding a venue reloads the page. Making it reactive means `venueKeys()`
  and `decks()` as functions rather than constants in `model.ts`, `VENUE_ORDER` moved into a
  `useMemo` in `Drinks.tsx:16`, new dependencies in `Ship`, `Stats` and `FilterPanel`, and a
  catalogue-version counter in the store. Worth doing if BYO is used enough to make the reload
  annoying; not worth doing to ship it.
- **Sharing a sailing.** `exportSailing()` returns one self-contained object with stable ids, so the
  work is a codec and a route, not a migration: an `SPS`-prefixed code through the same `b64url` and
  deflate helpers `share.ts` already has, a `/sail#SPS…` route beside `/add`, and an import that
  writes the sailing and its venues under the sender's ids. Until that exists, a user sailing has no
  crew, and the sailing sheet says so.
- **Per-sailing passports.** `me.entries` and `me.visits` stay one map across sailings. This is safe
  today because drink ids and venue keys do not collide: user venues carry a `u-` prefix, custom
  drinks a `c` prefix, and there is only one published catalogue. A **second** published sailing
  would reuse `d0`, `w0`, `b0` and collide, so it cannot ship until the passport is scoped by
  sailing. Recorded here because it is the constraint on the second curated menu Charles is gating.
- **Deleting a custom drink on its own.** Drinks go with their venue. A standalone remove belongs in
  the drink sheet and is its own change.
- **A second published sailing**, per the brief: nothing is invented, so the any-sailing layer is
  verified through BYO.
- **Wrapped's story copy** beyond the ship name and the total. Its cards read correctly from the
  sailing's own data, and every card is already conditional on having something to say
  (`wrappedData.ts:162-177`), so an empty sailing renders the cover and the finale and nothing else.
  Note that a user sailing can reach Wrapped with nothing logged: `wrappedUnlocked`
  (`wrappedData.ts:212-213`) unlocks on `now > END` as well as on twenty-five drinks, and a guest can
  type dates that have already passed. That is why the `wrappedTotal` zero guard is a guard and not a
  formality. Whether Wrapped should refuse to open on an empty passport is a separate change.

## Open questions for Charles

Two of these stop the workstream and two are confirmations. The gates are marked.

1. **Gate. Is BYO worth shipping without a way to hand a sailing to a friend?** As specified, a guest
   can build their own sailing and log against it alone; crew, groups and the "For you" shelf need
   somebody else on the same sailing, which needs the share codec in Out of scope. Ship it solo
   first and add sharing later, or hold BYO until sharing is in it? An answer of "hold" means BYO
   does not start, so it is asked first.
2. **Gate. Package tiers on a user sailing.** As specified, a sailing you set up declares no package
   prices, so the Plus/Premier/Extra segment disappears and every drink is "unknown". The
   alternative is two `NumberField`s in the sailing sheet ("drinks included up to", "and up to"),
   which is two more fields on the first screen a new user meets, and which would make `HAS_PACKAGES`
   per-sailing rather than per-dataset. It changes the sailing sheet, `pkgFields`, the filter panel
   and the `byo-filters` shot, so it is decided before step 1, not after.
3. **Confirmation. Is "Set up your own sailing" shown to everyone?** The default here is yes, to
   every visitor, with no gate. Whether it eventually sits behind whatever is sold is workstream E's
   question and the price line waits there; nothing in BYO assumes an answer, and if it is later
   gated the change is one condition around one row.
4. **Confirmation. The champion badge.** It takes the sailing's ship name, so a guest who typed
   "Norwegian Epic" earns "Norwegian Epic Champion" and the October crowd still earns "Sun Princess
   Champion". It is the one badge name that changes with the data, so it is worth a look rather than
   an assumption.

The QA fixture names are not a question. "QA Sailing", "Fixture Bar One", "Fixture Café" and
"Fixture Bar Two" are synthetic on purpose, so that no screenshot can be mistaken for a real menu and
no reviewer has to check whether a ship exists. They stay as they are.
