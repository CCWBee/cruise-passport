# BYO reconcile: the spec against the branch as shipped (17 September 2026)

`docs/specs/2026-09-10-byo-own-sailing.md` was drafted on 10 September against the **specs** of
workstreams A, C, B and E, before any of them was written. All four have since landed on `product`
(`45da690` is the head as this was written; `62cdf04` is the last commit before the product work
began). Their code differs from their specs in places, so some of the BYO spec's anchors point at
files, lines, classes and symbols that have moved or changed shape.

This document is read **beside** the spec, not instead of it. It softens nothing: every design
ruling, every copy string and all nineteen implementation steps stand. What changes is where the
builder points, and five instructions that would not work against the branch as it is.

Everything below was checked by opening the file on `product`, and the measurements were taken by
running the harness against the dev server already on 5173 with `&nosync`. Baselines measured on
17 September: `npx tsc -p tsconfig.app.json --noEmit` silent and exit 0; `npm run lint` 0 errors and
**28 warnings**; `npm run design:check` prints `design:check: 33 files, clean`; `npm test` prints
`# pass 17 # fail 0`.

The four rulings the orchestrator has taken are not reopened here: BYO ships solo with no sharing and
the sailing sheet carries the crew limitation line; a user sailing declares no package tiers; the
"Set up your own sailing" row shows to everyone; the champion badge takes the sailing's ship name.

---

## Anchors that moved

Twenty entries. Where a file is listed as holding, its line numbers were re-read and are still the
ones the spec quotes, which matters as much as the ones that moved.

1. **B's privacy row is `.privacy-open`, not `.entry-privacy`.** The spec's Design placement cites
   `.entry-privacy` twice, once for the BYO row on the entry screen and once for the "Edit this
   venue" row's wrapper. B renamed it before it shipped, for the reason it gives: the identical row
   is rendered from two screens and a name tied to one of them would read as a divergent sibling.
   On the branch it is `button.row.pressable.privacy-open` at `Entry.tsx:106-116` and again at
   `ProfileSheet.tsx:163`. **Builder:** copy `.privacy-open`'s markup exactly (a `span.row-copy`
   holding a `span.t-strong` then a `span.t-meta`, `aria-haspopup="dialog"`, no chevron), and keep
   BYO's own class names `.cruise-byo` and `.venue-edit`. Never add a third copy under a fourth name.

2. **`CruisePicker.tsx` is gone; the file is `src/features/cruise/Entry.tsx`** (129 lines), exporting
   `Entry({ onDone })`. `prettyRange` is `Entry.tsx:11-18` and is unchanged.

3. **Module 2's shape, in both branches, is a `<header>`.** The spec describes the multi-sailing
   branch as "an `h1.t-title` reading 'Choose your sailing' with the `Select` primitive beneath it
   under an `.f-label`". What shipped wraps each branch in a `<header>` element:
   - single sailing (`Entry.tsx:74-79`): `<header>` holding `div.section-head > h1.t-title` with the
     ship, then `p.t-meta.tnum` with line, middle dot and dates.
   - many sailings (`Entry.tsx:56-72`): `<header>` holding `div.section-head > h1.t-title`
     "Choose your sailing", then a `div.entry-fields > div.f-field` holding `span.f-label`
     "Your sailing" and the `Select`.

   **Builder:** the BYO row and its wrapper `div` go as a direct child of `.entry-in`
   (`Entry.tsx:55`), immediately after the closing `</header>` of whichever branch rendered, and
   before the `div.entry-fields` that holds `NameFields` at `Entry.tsx:86-88`. There is nothing to
   append to inside either branch, and neither `<header>` is restyled. `.entry-in` is a grid with
   `gap: var(--s5)` (`cruise.css:19`), so the row needs no margin of its own.

4. **The `?entry` override and the App gate.** `qaFirstOpen()` is `model.ts:163-165`, below
   `qaLanding()` and `isDesktopVisitor()` rather than beside `qaNoSync()`. The gate is
   `App.tsx:204`, `if (!enteredCruise || forced) return <Entry onDone={…} />`, and E's landing gate
   now sits **above** it at `App.tsx:198-199`. BYO changes neither.

5. **Persist is at 9 and the `from < 9` step exists.** `store.ts:376` is `version: 9`; the step is
   `store.ts:419-424`; `return persisted` is `store.ts:425`. See the persist section below for the
   quoted tail. `activeCruiseId` is still imported at `store.ts:3`, so the BYO step adds no import,
   exactly as the spec says.

6. **C's `restoreNow()` is module-private and has four exits.** It is `sync.ts:301-339`, not
   exported, so the spec's "the caller in `sync.ts` or `ProfileSheet`" collapses to `sync.ts` alone.
   Its `Promise.all` is `sync.ts:307`, `const [profileRow, backupRow] = await Promise.all([fetchProfile(), fetchBackup(s.cruiseId)])`.
   The exits are: line 304 (the session is not signed in), line 310 (either call returned `null`, so
   `restore: 'failed'`), lines 319 to 334 (no backup row: it still adopts the canonical code, then
   `settle('empty', 0)`), and lines 336 to 338 (the merge path).

7. **`restore.ts` holds C's import rule and `restore.test.ts` already covers the merge.**
   `restore.ts:10-11` is two whole `import type` statements and the file imports no runtime value
   from `src`. `backend.ts:9` imports `readOAuthError` from it, so the dependency runs
   `backend.ts → restore.ts` and never the other way. `restore.test.ts` is 17 tests and they all
   pass: `isUntouched`, the wholesale adoption, date ties, the later date winning, a dated entry
   beating an undated one, a loser-only field surviving, `tried` never untried, visit dates, the
   custom union, duplicate ids, name and colour, `canonicalCode` and `codeChanged`, `adopted`,
   `readBackup` refusing garbage and stripping a retired field, and `readOAuthError`. **Builder:**
   `mergeSailings` cases are added to that file; nothing in it is rewritten.

8. **E's `qaLanding()` and `isDesktopVisitor()` live in `src/data/model.ts`, not `Landing.tsx`**
   (`model.ts:142-146` and `153-158`, moved there in `ce1d64d` so `Landing.tsx` only exports its
   component). `model.ts` has grown to 178 lines, but `qaNoSync()` is still exactly `135-137`, which
   is the line the spec's `&nosync` note cites, so that one reference needs no change.

9. **`.qr-plate` and `.quiet-action` are in `base.css`** (`98-107` and `110` onwards), swept out of
   `friends.css`. BYO renders neither, but the mint is why `base.css` has grown, which is what moved
   the next two anchors.

10. **`base.css:144` is now `base.css:169`.** `.row:not(:only-child) { border-radius: 0 }` is line
    169. The spec cites 144 three times (the Ship foot action, the `.venue-edit` wrapper, the
    `.cruise-byo` wrapper) and each of those arguments still holds; only the number is stale.

11. **`base.css:148` is now `base.css:173`.** `.row-copy > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }`.
    The one-line clamp on every row's copy is unchanged, so BYO's two-line row strings must still
    fit about 50 characters at 13px. "For a ship that is not on this list" is 35, and
    "Bars, cafés and restaurants on this ship" is 40. Both clear it.

12. **Crew's "Set up a group" row is `Social.tsx:161-167`, not `186-192`.** Shape unchanged: a
    `button.row.pressable` with `aria-haspopup="dialog"`, a `span.row-copy` holding `span.t-body`
    then `span.t-meta`, and a `<Chevron />`. It is the sibling the Ship foot action copies.

13. **`Social.tsx:207` is now `Social.tsx:182`, and it has no fallback.** The spec lists it among
    the readers that "already fall back". It reads
    `{VENUES[d.venue]?.name} · Deck {VENUES[d.venue]?.deck}`: optional-chained, so it cannot throw,
    but with no `|| key` it would render a bare " · Deck ". It is unreachable either way, because
    `undiscovered()` (`social.ts:105-112`) iterates `DRINK_BY_ID`, which holds published drinks only
    and is empty on a user sailing. **Builder:** leave it alone, and do not cite it as the precedent
    for a fallback; the precedents are `Home.tsx:29`, `Log.tsx:69`, `Stats.tsx:115` and `:159`.

14. **`sync.ts` anchors.** `publishBackup` is `sync.ts:166` inside `publishBackend` (the spec says
    67); the store subscription is `sync.ts:410-419` (the spec says 173 to 175) and now carries B's
    `enteredCruise` branch as its first test; `mode()` is `sync.ts:58-61` and reads `enteredCruise`
    before anything else.

15. **`store.ts` anchors.** `enterCruise` is `165-170` (the reload test is line 169); `toggleVisit`
    `196-201`; `addCustom` `203`; `applyFeed`'s drop-a-confirmed-friend rule is `308-313`, which is
    the behaviour the spec's Crew section tells the builder to expect rather than debug;
    `applyRestore` `343-362`; `partialize` `428-431`; `allDrinks` and `useAllDrinks` `442-446`.

16. **`model.ts` anchors, all holding:** `DECKS` 76, `CATEGORIES` 77, `pkgOf` 80-85, `menuFor` 93-98,
    `VENUE_KEYS` 100, `isRestaurant` **unguarded** at 101, `START`/`END` re-exported at 10,
    `buildDrinks` 35-69 with the wine `desc` reading `PLUS` at line 54. The four lookups that would
    throw are still `facets.ts:20`, `facets.ts:27`, `model.ts:101` and `VenueSheet.tsx:34`.

17. **The screens the spec reads are unchanged since it was written, and their numbers hold.**
    `Drinks.tsx` (121 lines): `VENUE_ORDER` 16-18, grouping 55-65 with the dead `extra` branch at
    63-64, the `results.length === 0` test at 92, `.dempty` 93-99, `.dtoolbar` 85-90.
    `FilterPanel.tsx`: the Package segment 57-58, `DECKS` chips with the inline "Deck 15/16" at 71
    and 79, `venuesByDeck` 42. `AddSheet.tsx` (97 lines): `VENUE_KEYS[0]` 14, `CATEGORIES[0]` 15,
    the early return 23, `'c' + Date.now()` 27, the three package computations 40-42, the venue
    `Select` 56-61. `Ship.tsx` (71 lines): deep link 18-21, `VENUES[key].deck` 23, the heading 37-39,
    the rows 46-62, the sheet 68. `VenueSheet.tsx` (71 lines): null 19, meta 31, blurb 32, the
    unguarded `shares` line 34, the drink-sheet replacement 24-26, the empty case 67.
    `Home.tsx` (399 lines): `drinkVenue` 29, `countdown()` 31-37 with "of 15" on line 33, `.sea-pct`
    194, the hero sub-line 195, module 2 at 203-226 with its heading on 204 and the three
    pre-sailing facts at 219-223, the "No top drink yet" row at 332-340.
    `Stats.tsx`: the deck rows 137-151 with `label: \`Deck ${deck}\`` at 147.
    `wrappedData.ts`: `WRAPPED_TOTAL` 6, `pct` 154, `wrappedUnlocked` 212.
    The four "Sun Princess" runtime literals are exactly where the spec says: `AddCrewSheet.tsx:110`,
    `Wrapped.tsx:154`, `Wrapped.tsx:249`, `wrappedImage.ts:213`, and `WRAPPED_TOTAL` is read at
    `Wrapped.tsx:164` and `:228`.

18. **`index.html` holds its shape, and the fixture branch has one correct position.** The seed block
    is the inline classic `<script>` at `36-89`; the `?seed` test is line 45; the production
    untouched guard is `46-56` and is **skipped on the dev server** (`var DEV = '%MODE%' !== 'production'`
    at line 46); the demo data is built from line 57; the `spcc2` write at `version: 2` is line 86;
    the module entry `<script type="module" src="/src/main.tsx">` is line 93. **Builder:** the
    fixture branch reads `q.get('fixture')` (the `URLSearchParams` is already in hand at line 44),
    sits immediately after the guard block closes at line 56 and before `var DAYS` at line 57, writes
    its three keys and `return`s before line 86. It adds no new `<script>` tag of any kind
    (see the seams).

19. **`shot.mjs` as it now is.** `SHOT_W`/`SHOT_H` are read at `shot.mjs:25` and default to 390×844,
    so BYO's shots need no environment variable. `home?…` is rewritten to `/?…` at line 20 and every
    other route gets a leading slash at line 21; `seed` is appended with the right separator at line
    34, before any `#` fragment; `--click` and `--click2` run at 36-42 and `--after` (default 1600)
    is read **inside** the click loop, so it is ignored without a click; `--wait` (default 2200) is
    the settle after `goto`; `--eval` runs at 43-44, before the geometry line at 45-46; `--full`
    writes `<label>-full.png` at 48-51. `OUT` is `tools/qa/<SHOTS_DIR or shots>` and `u.shot(label)`
    writes `<label>.png` (`cdp.mjs:11` and `:72`).

20. **`shots.mjs` and the pair count.** Its labels are `home drinks drink-sheet ship venue-sheet
    social add-sheet stats badges log wrapped`: eleven, and `compare.mjs:12-16` filters the same
    eleven by the existence of `<prefix>-<label>.png`, so **"pairs 11" is right** (it is printed by
    `compare.mjs:42` as `… height <h> pairs 11`). Note that a sweep writes **19** files per prefix,
    not eleven: the eight full-page screens also write `<prefix>-<label>-full.png`, and the three
    sheets do not. The spec's hash one-liner walks all nineteen, which is correct and was run to
    confirm it still executes (`node -e` is CommonJS here despite `"type": "module"`).

**Also worth having in hand:** `ConfirmButton`'s default `className` is still `btn btn-wide`
(`ConfirmButton.tsx:8`) and its note renders at line 37; `Field.tsx` renders `span.field-hint.field-err`
and wires `aria-invalid` and `aria-describedby` at `16-24`, so the spec's "every inline error is the
`Field` primitive's own `error` prop" needs no adaptation; `Select.tsx` still has no `disabled` prop,
only per-option `disabled` and `placeholder`, so step 13's reasoning holds. One idiom to copy rather
than improve: `AddSheet.tsx:54-62` wraps a `Select` in `div.field` with a plain
`span.field-label` and no `.eyebrow`, while `Field.tsx` labels carry `field-label eyebrow`. The venue
form's Kind select copies `AddSheet`'s wrapper verbatim; changing which of the two is right is not
BYO's to settle.

---

## Spec assumptions that are now false, and the corrected instruction

1. **"If `product` somehow carries no runner when BYO starts, say so in the commit message rather
   than inventing one."** There is a runner. `package.json` has
   `"test": "node --test \"src/**/*.test.ts\""` and it prints `# pass 17 # fail 0`. **Corrected:**
   run `npm test`, not a bare `node --test src/state/restore.test.ts`. The glob picks up
   `src/data/sailings.test.ts` with no change to `package.json`, and `tsconfig.app.json`'s
   `include: ["src"]` typechecks it, so the new test file needs `/// <reference types="node" />` on
   line 1 and must import `./sailings.ts` **with the extension**, exactly as `restore.test.ts:1` and
   `:13` do.

2. **The regression sweep as written is a live-backend action, which this workstream forbids.**
   `shots.mjs:28` loads `${BASE}/?seed` and every later route with no `nosync`. The seed migrates the
   store to entered, so `mode()` (`sync.ts:58-61`) returns `'backend'`, the block at `sync.ts:431-438`
   fires `syncNow()`, and `ensureSession()` signs in an anonymous user against the live project.
   Two sweeps would do it twice, over eleven page loads each. `tools/qa/*.mjs` is read-only in this
   workstream, so `shots.mjs` cannot be given a `nosync`. **Corrected:** take both sweeps with
   eleven `shot.mjs` runs each into one `SHOTS_DIR`, labelled to match what `compare.mjs` looks for.
   The commands are in the verification section below.

3. **"The intended differences on the published sailing, and there are three, not one."** There is a
   fourth, and it is the most visible of them. `badges.ts:35`'s `everybar` hint changes from
   "Check in at all 28 venues" to "Check in at every venue", and that string is rendered on the
   Badges screen in both the Close rows (`Badges.tsx:148`) and the Locked rows (`Badges.tsx:183`).
   Measured on the seeded published sailing: the "Every Bar" row sits at `top: 750` of an 844
   viewport, so **`badges` and `badges-full` both differ**. **Corrected:** the expected set is six
   files and three compare pairs, set out in the sweep section below.

4. **"On success, in this order: `saveSailing()` … then `enterCruise(<new id>)` runs."** On the
   branch, `enterCruise` (`store.ts:165-170`) sets `enteredCruise: true`, and B made that flag the
   sync gate (`sync.ts:59`). Calling it from the sailing sheet would turn sync on for a guest who has
   never seen the consent line, let alone tapped Done, which contradicts `DESIGN.md`'s Entry section
   ("Nothing has left the phone when this renders, and nothing does until Done") and the copy on the
   screen underneath the sheet. **Corrected, and it changes nothing else in the flow:** on success
   the sheet writes the sailing with `saveSailing()`, then `setActiveCruise(newId)` and
   `useStore.setState({ cruiseId: newId })`, then reloads. It does **not** set `enteredCruise`.
   After the reload `CRUISES` has been rebuilt from `spcc-sailings`, `activeCruiseId()` resolves the
   new id, and the entry screen renders again in its multi-sailing branch with `chosen` already on
   the new sailing, the BYO row beneath it, and Done still to tap. Done then calls
   `enterCruise(chosen)`, which does not reload a second time because `cruiseId` already matches
   (`store.ts:166`). This also corrects the spec's "The page comes back on the new sailing's Home":
   it comes back on the entry screen, on the new sailing, which is what `byo-picker-multi` is already
   specified to show.

5. **The returning sailing sheet has no door on this branch.** The only opener BYO places is the
   `.cruise-byo` row on the entry screen, and `App.tsx:204` renders that screen only while
   `!enteredCruise` (or under `?entry`). So "Sailing sheet, returning (editing the sailing you are
   on)", its `Save`, its reload note and its `Delete this sailing` `ConfirmButton` are unreachable
   for anybody who has entered, which is everybody with a sailing. `forgetSailing` and
   `deleteSailing` would ship with no caller. **This is a placement question, not a defect to patch
   in passing**, and it is the one thing in this workstream that cannot be built as specified: see
   Stop the build at the foot.

6. **The `.cruise-byo` height budget, and what asserts it.** The spec says "B budgets about 620 of
   844 … This row is 48 plus 12 above it, so about 680. It must still not scroll, and the shot
   asserts it." Measured on the branch at 390×844 headless: `.entry-in` is **563**, `.entry-body` is
   **802** with 32 of padding top and bottom, so **738** is usable; the gap between modules is
   **24**, not 12; and `.privacy-open`, the row BYO copies, is **56** tall, not 48. The BYO row
   therefore costs 24 + 56 = **80**, taking `.entry-in` to about **643 of 738**, with roughly 95 to
   spare, or about 46 on a real iPhone once the insets are taken. It holds, with less room than the
   spec implies. **Corrected assertion:** `docHeight` is always exactly 844 on this screen, because
   `.entry` is `min-height: 100dvh` (`cruise.css:4-9`), so the geometry line proves nothing.
   `DESIGN.md` already says to measure `.entry-in` against the body. Use:

   ```bash
   node tools/qa/shot.mjs byo-picker "home?fixture=byo-new&entry&nosync" \
     --eval "(() => { const i = document.querySelector('.entry-in').getBoundingClientRect().height, b = document.querySelector('.entry-body'), s = getComputedStyle(b); return { inner: Math.round(i), room: Math.round(b.getBoundingClientRect().height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)) } })()"
   ```

   `inner` must be less than `room`, and the same probe belongs on `byo-picker-multi`.

7. **"The caller in `sync.ts` or `ProfileSheet` does the `importSailings()` write."** `restoreNow` is
   private to `sync.ts` (anchor 6), so `ProfileSheet` is not an option. **Corrected:** add
   `listBackups()` as the third element of the `Promise.all` at `sync.ts:307`. Keep it **out** of the
   null test on line 310: a `null` list means the call did not answer and nothing is adopted, but it
   must not set `restore: 'failed'` and shut the publish gate, because the passport merge did answer.
   Do the `mergeSailings` and `importSailings()` once, between line 310 and line 312, guarded on
   `Array.isArray`, so the `!remote` path at 319-334 and the merge path at 336-338 both get it.
   Nothing inside `restoreNow` may reload the page: `CRUISES` is memoised at module load, so a
   sailing restored from the server appears on the next open, and the spec's reload contract covers
   only a change the guest just made.

8. **`listBackups()`'s stated return type does not match its sibling.** The spec writes
   `updatedAt: string`; `fetchBackup` (`backend.ts:212-220`) returns
   `{ state: unknown; updatedAt: number }` from `new Date(data.updated_at).getTime()`. **Corrected:**
   `Promise<{ cruiseId: string; state: unknown; updatedAt: number }[] | null>`, so the two readers of
   `backups` agree. The never-throws contract, and the `null` against `[]` distinction, stand exactly
   as written, and nothing else in `backend.ts` changes.

9. **VenueSheet's two data guards are dead on the published sailing.** Step 11 asks for the blurb
   paragraph to be omitted when the blurb is empty and the trailing comma dropped when there are no
   hours. Parsed from `raw.ts`: all 28 venues carry a non-empty `hours` and a non-empty `blurb`.
   **Corrected expectation:** both guards are for user venues only, and `venue-sheet` must hash
   `same` in the regression sweep. If it differs, the change reached the published data and is a
   defect. (The sweep's `venue-sheet` shot clicks the first `.venue-row`, which is `sunbar` on deck
   18, and `sunbar` carries `shares: 'themix'`, so that shot is also the one that exercises the
   `VENUES[venue.shares]?.name` guard: guarded or not, it renders the same name.)

10. **Step 19 leaves `DESIGN.md` stale, and that is a blocker under this workstream's rules.**
    `DESIGN.md`'s Entry section, module 2, ends "that branch cannot render while `CRUISES` has one
    entry". BYO is what makes `CRUISES.length > 1`, and BYO adds a row to that screen. Step 19 names
    only the Ship and Drinks screen sections and the registry, and any change outside the named
    insertions is a blocker. **Corrected:** the builder does not quietly widen the edit. It stops and
    asks for the insertion list to be extended by one sentence in the Entry section (that the branch
    now renders once a guest has made a sailing, and that the "Set up your own sailing" row sits
    beneath module 2), and leaves the constitution untouched until that is granted.

11. **`base.css:144` and `:148`, cited five times between them, are 169 and 173.** See anchors 10 and
    11. Every argument built on them is still correct.

12. **The `design:check` file count has moved.** C's spec expected 31 files; the branch prints
    `design:check: 33 files, clean` (B added `privacy.css`, E added `landing.css`). BYO adds no
    stylesheet of its own beyond rules in the existing `ship.css`, `cruise.css` and `drinks.css`, so
    it must still print **33**. A 34 means a stylesheet was minted that the spec does not ask for.

13. **The fixture's persist version is 10, and the guard it sits behind does not run in dev.** The
    spec says "at the store's current persist version"; on the branch that is 9 before step 7 and
    **10** after it, and the fixtures are written in step 18, so they write `version: 10`. Write
    `seenMedals: []` explicitly, as the spec says, and `enteredCruise` explicitly in every fixture:
    at version 10 no migrate step runs, so nothing sets it. Note also that the "existing
    untouched-passport guard" the spec puts the fixture behind (`index.html:46-56`) is inside
    `if (!DEV)`, so on the dev server every fixture writes unconditionally, which is what the shots
    rely on; in a production build a `?seed&fixture=byo` link still cannot overwrite a real
    passport, which is the property the placement exists to keep.

14. **Step 19's "`STATE.md` and `PROJECTS.md` updated in the same turn" is superseded.** Both files
    belong to the orchestrator in this workstream and are not to be touched. The rest of step 19
    stands.

---

## Cross-workstream seams the builder must not break

**A, the update harness, reads `index.html`'s module script.** `tools/qa/update.mjs` finds the shell
chunk by matching the built `index.html` against `/\/assets\/(index-[A-Za-z0-9_-]+\.js)/`, and its
shell probe is `document.querySelector('script[type=module][src]')?.src`, which works only because
the seed block is an inline **classic** script with no `src` and the entry at `index.html:93` is the
one module script with one. Step 18 therefore adds its fixtures **inside the existing inline
`<script>`**: no second `<script>` tag, no `type="module"`, no `src`, and no import. A second module
script with a `src` would make the probe ambiguous and the harness would report a reload that never
happened. `main.tsx` is untouched, so `startUpdates` and the sheet-held reload are unaffected; the
two new sheets use the shared `Sheet` unchanged, which is why `node tools/qa/gestures.mjs` is still
the check that they did not break the gesture contract.

**B, `first-open.mjs` and the sync gate on `enteredCruise`.** `tools/qa/first-open.mjs` opens the root
with no query in a fresh context and asserts two things: that `.entry-done` exists, and that nothing
matching `\.supabase\.co` or `node_modules[^"']*supabase` was fetched. BYO adds a row and a sheet to
that same screen, so: `.entry-done` must stay exactly where it is (`Entry.tsx:122`); `sailings.ts` and
`SailingSheet.tsx` must reach nothing that leads to `backend.ts` at import time, which they do not if
`sailings.ts` keeps to `import type { VenueRaw } from './raw'` and does no read at module load; and
nothing in the sailing flow may set `enteredCruise` before Done (assumption 4 above). Run
`node tools/qa/first-open.mjs` after step 12 and again after step 18, and expect
`PASS first open: entry screen, 0 supabase requests`.

**C, the launch order and the `leaving` flag.** `const booting = restoreOnLaunch()` is `sync.ts:401`;
`runSync()` awaits it at `sync.ts:246`; the startup block fires `void booting.then(() => syncNow())`
at `sync.ts:437`; `if (leaving) return` is `sync.ts:242`. Step 17 adds work inside `restoreNow`,
which `booting` awaits, so anything slow or throwing there delays or breaks the first publish for
every user. `listBackups()` inherits the never-throws contract for that reason, its `null` must not
reach the `'failed'` branch (assumption 7), and `restoreNow` must not call `syncNow`, `refreshNow` or
`location.reload()`. The `sailings: exportAll()` addition to the payload at `sync.ts:166` rides the
existing best-effort `void publishBackup(...)` and must stay unawaited.

**E, the gate at `/` and `/get`, and its `Masthead` reuse.** `App.tsx:198-199` is
`if ((!enteredCruise || qaLanding()) && !skipLanding && (atRoot() || atGet()) && isDesktopVisitor())`,
sitting above B's entry gate, with `path()`, `base()`, `atRoot()` and `atGet()` at `App.tsx:38-41`.
BYO does not touch `App.tsx` and must not. Two consequences to know: at 390×844 the gate is inert,
because only the width leg of `isDesktopVisitor()` can fail headless (`model.ts:157`), so every BYO
shot reaches `Entry` as intended and no BYO route needs `?landing=`; and `Landing.tsx` renders
`<Masthead />` from `src/app/Masthead.tsx`, the same component `Entry.tsx:53` and `Shell` render, so
`Masthead` must stay a single component. The BYO row is not a landing concern and adds nothing to
`/get`.

---

## Persist version: `store.ts` is at 9, BYO takes 10

`store.ts:376` reads `version: 9`. The tail of `migrate`, verbatim, lines 419 to 426:

```ts
        if (from < 9 && persisted) {
          // The picker is now the first-open screen for everyone, not only for a second sailing. Anyone
          // with a persisted store has been in the app, and has been syncing under the terms the privacy
          // note now states, so they are entered and are not asked again.
          persisted.enteredCruise = true
        }
        return persisted
      },
```

BYO's `from < 10` block goes between line 424 (`}`) and line 425 (`return persisted`), exactly as the
spec writes it. `activeCruiseId` is imported at `store.ts:3`, so the step adds no import. `partialize`
(`store.ts:428-431`) is unchanged: venues and sailings are not store state.

The one knock-on the spec does not spell out: the three QA fixtures in step 18 write `spcc2` at
`version: 10` once step 7 has landed, and steps 1 to 6 change no pixels, so a fixture written before
step 7 would migrate through `from < 10` harmlessly. Write 10 from the start and the fixtures are
correct at every commit in between.

---

## The regression sweep: labels, counts, and what is expected to differ

`shots.mjs`'s eleven labels are `home`, `drinks`, `drink-sheet`, `ship`, `venue-sheet`, `social`,
`add-sheet`, `stats`, `badges`, `log`, `wrapped`. `compare.mjs` pairs the same eleven, so
**`pairs 11` is the right expectation**. A sweep writes **19 files** per prefix, because the eight
screens also get a `-full.png` and the three sheets do not, and the hash one-liner walks all 19.

Because `shots.mjs` cannot be given `&nosync` and this workstream takes no live-backend action
(assumption 2), take both sweeps with `shot.mjs`, into one `SHOTS_DIR`, with the labels
`before-<name>` and `after-<name>` so `compare.mjs` finds them. Run the whole block before step 1 and
again after step 19, **in the same hour and on the same day**: the CSS fallback sea keys off
`nowHour()` and the seed pins no date, so "Sails in N days" and the greeting both move at midnight
and the sky moves on the hour.

```bash
export SHOTS_DIR=shots-byo; P=before      # and P=after for the second run
node tools/qa/shot.mjs $P-home        "home?nosync"   --wait 3500 --full
node tools/qa/shot.mjs $P-drinks      "drinks?nosync" --wait 2500 --full
node tools/qa/shot.mjs $P-drink-sheet "drinks?nosync" --wait 2500 --click ".dcard .d-open" --after 3200
node tools/qa/shot.mjs $P-ship        "ship?nosync"   --wait 2500 --full
node tools/qa/shot.mjs $P-venue-sheet "ship?nosync"   --wait 2500 --click ".venue-row" --after 3200
node tools/qa/shot.mjs $P-social      "social?nosync" --wait 2500 --full
node tools/qa/shot.mjs $P-add-sheet   "social?nosync" --wait 2500 --click ".social-add" --after 3200
node tools/qa/shot.mjs $P-stats       "stats?nosync"  --wait 2500 --full
node tools/qa/shot.mjs $P-badges      "badges?nosync" --wait 2500 --full
node tools/qa/shot.mjs $P-log         "log?nosync"    --wait 2500 --full
node tools/qa/shot.mjs $P-wrapped     "wrapped?nosync" --wait 3000 --full
```

Then `SHOTS_DIR=shots-byo node tools/qa/compare.mjs before after`, which must print `pairs 11`, and
the spec's hash one-liner over `tools/qa/shots-byo`, which walks the 19 files.

**Expected to differ: six files, three of the eleven compare pairs.** Each position was measured on
the branch against the seeded published sailing at 390×844.

| File | Why |
| --- | --- |
| `ship` | The deck 15 heading sits at `top: 627` of 844, inside the viewport, and becomes "Deck 15/16" through `deckLabel` (step 10). |
| `ship-full` | The same, plus the "Add a venue" foot action, which only a full-page capture reaches: the document is 1888 tall. |
| `stats` | The first section on the screen is `DeckBars`; its "Deck 15" row is at `top: 280` and becomes "Deck 15/16" (step 16). |
| `stats-full` | The same row, in the full page. |
| `badges` | "Every Bar" is at `top: 750` and its hint changes from "Check in at all 28 venues" to "Check in at every venue" (step 6). |
| `badges-full` | The same row, in the full page. |

The deck-label change on `ship` and `stats` is the deliberate fix of the existing inconsistency where
the filter panel said 15/16 and Ship and Stats said 15. It is a change on the October sailing and
Charles sees it in the montage.

**Expected to hash `same`, and why each could have moved but does not:**
`home`, `home-full` (`countdown()` reads `DAYS.length`, which is 15 on this sailing; module 2's three
facts are non-zero because the sailing has venues; the hero is unchanged), `drinks`, `drinks-full`
(`CATEGORIES` becomes a union with an eleven-entry base vocabulary, and parsing `raw.ts` confirms the
published catalogue's thirteen categories are a superset of those eleven, so the sorted union is the
same thirteen; `pkgOf`'s new null-tier test cannot fire on a drink that carries a price),
`drink-sheet` (`DrinkSheet.tsx:80,98` were already guarded and are not edited), `venue-sheet`
(assumption 9), `social`, `social-full`, `add-sheet` (this is `AddCrewSheet`, whose only BYO edit is
the "Sun Princess" literal at line 110, which is inside the Web Share payload and is not rendered;
`SHIP` resolves to "Sun Princess" there anyway), `log`, `log-full`, `stats`'s other sections,
`wrapped`, `wrapped-full` (`wrappedTotal(drinks)` is `drinks.length`, which is 214 for the seeded
passport, the number `WRAPPED_TOTAL` hard-coded).

`home` and `home-full` differing is the clock, not a regression, whether the gap is an hour or a day.
Re-run the two sweeps back to back before treating it as one. Anything else that differs is
unintended, and `stats.ts:77`'s new `vset` venue guard in particular must show no change: no drink on
the published sailing can carry a venue key outside `VENUES`, so that line is a no-op there and a
`DIFF` on `stats` beyond the deck label means it is not.

The entry screen's new row is not covered by this sweep, which has no entry shot; `byo-picker` and
`byo-picker-multi` are where it is checked.

---

## Verification commands as they should now be written

**Gates.** All four as the spec writes them, with the numbers the branch actually prints:

```bash
npx tsc -p tsconfig.app.json --noEmit          # no output, exit 0
npm run lint                                   # 0 errors; 28 warnings is the baseline, verified 17 Sep
npm run design:check                           # "design:check: 33 files, clean"  (not 31)
npm test                                       # "# pass N  # fail 0"; 17 today, more once BYO's tests land
node tools/qa/scan.mjs src/features/ship src/features/cruise src/features/drinks src/features/home
```

Two corrections. `npm test` replaces the spec's bare `node --test src/state/restore.test.ts`: the
script exists, its glob picks up `src/data/sailings.test.ts` without edit, and running the whole set
is what catches a BYO change that breaks a restore test. And the `scan.mjs` line **prints one suspect
today and that is correct**: `src/features/home/sea.css:25 endless animation … ship-bob`, which is
allow-listed at `tools/qa/design-allow.txt:32`. It is not a new suspect and nothing is added to that
file.

**Fixtures and shots.** Every route keeps `&nosync` and the labels are unchanged. Three corrections
to the spec's block:

- `byo-picker` and `byo-picker-multi` take the `.entry-in` against `.entry-body` probe in assumption
  6 rather than relying on the `docHeight` line, which is always 844 on that screen.
- No BYO shot needs `SHOT_W`/`SHOT_H` or `?landing=`: at 390 the landing gate is inert.
- `--after` without a `--click` is ignored (`shot.mjs:36-42`), so it is dropped from the shots that
  do not click.

The three assertion probes stand as written and their selectors were re-checked on the branch:
`.sea-pct` is `Home.tsx:194`, `.sea-count` is `Home.tsx:192`, and `.badge-medal-name` is
`Badges.tsx:121` and appears in the Earned grid only. One addition worth making, because it is the
one thing the spec leaves to the eye on the screen that matters most:

```bash
node tools/qa/shot.mjs byo-multi-probe "home?fixture=byo-empty&entry&nosync" \
  --eval "document.querySelector('.sel-value')?.textContent"
```

must print `"QA Sailing · 1 to 10 March 2027"` and never anything containing "Sun Princess". That is
the `byo-picker-multi` clause the spec calls the one nobody else will check, turned into a string
rather than a look at a PNG. `.sel-value` is `Select.tsx:168`.

**The sweep.** As set out in the section above: eleven `shot.mjs` runs per prefix into
`SHOTS_DIR=shots-byo`, not two `shots.mjs` runs, because `shots.mjs` would sign anonymous users in
against the live project.

**Gestures.** `node tools/qa/gestures.mjs` must still print PASS on every case and exit 0, unchanged.
It warms the dev server itself, so a cold first run is not a failure.

**The one dev server.** Everything above runs against the instance already on
`http://127.0.0.1:5173`. Never start a second.

---

## Stop the build

One item, scoped as narrowly as it can honestly be scoped.

**Step 12's returning mode has no entry point and cannot be built as specified.** The sailing sheet's
returning shape (fields pre-filled, `Save`, the reload note, the `Delete this sailing` `ConfirmButton`
and its `forgetSailing` call) is opened only from the `.cruise-byo` row on the entry screen, and
`App.tsx:204` renders that screen only while `!enteredCruise`. A guest who has made a sailing has
entered it, so they can never open the sheet again: they cannot correct a mis-typed ship name, change
the dates, or delete the sailing, and `forgetSailing` and `deleteSailing` would ship with no caller.
That is a placement decision, and placement is Charles's: the candidates are a row on Ship beside
"Add a venue", a row in the Profile sheet, or a `.quiet-action` at the foot of Ship. It is not for
the builder to pick one on the way past.

**Steps 1 to 11, step 12's first-time mode, and steps 13 to 19 are unaffected** and can be built in
order today. Step 12 ships its first-time half (the row, the sheet, the four fields, the crew
limitation line, "Start your passport") and stops there; the returning half waits on the ruling. If
the ruling does not come before step 19, say so in that commit rather than implying the sheet is
complete.

One further item that is not a stop but needs a word from Charles before step 19 runs: the Entry
section of `docs/DESIGN.md` goes stale the moment BYO ships, and step 19's insertion list does not
cover it (assumption 10).
