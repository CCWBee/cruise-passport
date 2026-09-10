# Product brief: the any-sailing Cocktail Passport

10 September 2026. Charles ruled on the fork in `STATE.md`: the app becomes a product for any
sailing, not a single-voyage gift. This brief is the architecture. Each workstream below gets its own
spec in this folder, drafted from this brief, reviewed, and committed before its implementation runs.
Implementation is on the `product` branch; merging to `main` deploys and is Charles's call.

## The cut

The Sun Princess sails on 3 October 2026. Workstreams A, C and B are what that crowd needs and ship
first, in that order. E and BYO are product work and land after; they must not delay A, C and B.

## What already exists (compose from it, do not rebuild it)

- Backend: `supabase/migrations/0001` is cruise-scoped from day one. `passports`, `backups`, `groups`
  and both feeds carry `cruise_id`; `profiles` and `friends` are global by design (people follow you
  across sailings). Row-level security is own-row on every table, so `backups` can already be read
  back by its owner. No new migration is expected; if one is needed it is a gate for Charles (SQL
  editor paste).
- Registry: `src/data/cruises.ts` (`CRUISES`, `activeCruise`, `setActiveCruise`), one entry. The store
  carries `cruiseId` and `enteredCruise` (persist `spcc2`, version 8, with `migrate`).
- Entry: `src/features/cruise/CruisePicker.tsx`, mounted by `App.tsx` only when the registry has more
  than one sailing. `NameCard` (`src/features/social/Social.tsx`) already asks for name and colour on
  `/add`, `/join` and at the top of Crew.
- Sign-in adapter: `git show 037be89:src/state/backend.ts` has `isAnonymous`, `currentUserId`,
  `signInWithGoogle` (`linkIdentity` when anonymous, else `signInWithOAuth`), `signOut` and
  `fetchBackup`. Recover it; do not rewrite it. The current `backend.ts` contract (never throws; writes
  report `false`; feeds report `null` for "did not answer", never `[]`) applies to the recovered code.
- Profile and erasure: `src/features/friends/ProfileSheet.tsx` holds name, colour, code, sync line and
  delete-my-data. Sign-in, restore status and the guest honesty line belong there.
- Update mechanics: `vite-plugin-pwa` `^1.3.0`, `registerType: 'autoUpdate'`. The injected
  `registerSW.js` only registers; nothing listens for `controllerchange`.
- Design: `docs/DESIGN.md` is the constitution and the registry of primitives; `docs/DESIGN-AUDIT.md`
  is the record of how the app once read as a kit. Both are read in full before any render change.

## Workstreams, in build order

### A. The first open after a deploy shows the previous build

Import `registerSW` from `virtual:pwa-register` in `src/main.tsx` (the plugin then stops injecting
`registerSW.js`); add `/// <reference types="vite-plugin-pwa/client" />` to `src/vite-env.d.ts`.
Reload when the new worker takes control, except while a `Sheet` is mounted: then defer to the next
route change or visibility change, so a half-filled log sheet is never dropped.
Verification: `dist/index.html` no longer references `/registerSW.js`; the installed plugin's
autoUpdate client is confirmed to reload on `controlling` with `isUpdate`; `tools/qa/offline.mjs`
still passes against a preview build; a simulated update (two builds, second served after the first
is installed) shows the new shell hash without a manual reload.

### C. Sign-in and restore

Guest first, always. Sign-in is optional and lives in the Profile sheet as "Keep your passport"
(Google). An anonymous session upgrades through `linkIdentity`, so the user id, and every row under
it, survives. Restore is a defined self-only merge, in `src/state/restore.ts` as pure functions with
tests: on sign-in, and on launch when signed in and the local passport is untouched, `fetchBackup`
for the active cruise; adopt the canonical friend code from the backup when local is untouched;
entries merge newer-wins; custom drinks union by id; profile name from the backup when local is
empty. `publishBackup` keeps writing on every sync. The honesty line, in the same sheet, states what
a guest stands to lose (cache cleared or phone changed: passport and friend code, unrecoverable) and
that signing in is what makes it durable. When the Google provider is not switched on in the
dashboard, the button says so in one line rather than failing silently. `supabase/config.toml`
Site URL and redirect list move to cruise.charlesbee.org. Gates: the Supabase Google provider with
manual linking, the Google Cloud OAuth client, the redirect allow-list and Site URL, all Charles's;
the anonymous path and the merge are verified here without them.

### B. Entry and first open (with the honesty and privacy copy)

`CruisePicker` becomes the first-open screen and renders on first open even with one sailing (the
`CRUISES.length > 1` gate goes; `enteredCruise` decides). It carries, in this order: which sailing
(from the registry), name and colour (the `NameCard` mechanism, not a copy of it), one line of what
this is, and one consent line that says what syncs (an anonymous passport and profile to the app's
own backend, in the EU), what is never collected, and where to delete it. One Done. Home gains the
masthead Crew and You already have. Existing users (persist version bump) are treated as entered
and are not asked again. The in-app privacy note is a short sheet reachable from the consent line
and from the Profile sheet; it is the same text in both places.

### E. Landing and install

A phone visitor's landing is the first-open screen. A desktop visitor needs the install path: what
this is, open it on your phone (a QR of the live address), add to home screen, and a line on price
once Charles decides what is sold and for how much; until then no price appears. It composes from
the existing type and material and adds no marketing register: the thesis is an instrument, not a
brochure.

### BYO. Bring your own sailing

`Drink.venue` is a key into `VENUES`; Ship, the Drinks facets, `venueProgress`, `biggestBar`,
`deckCount` and the `everybar` badge all read it. A user-defined sailing therefore needs custom
venues, which is a data-model change touching four screens. It gets its own spec and is built last.
Without a second real menu to port (Charles's gate; nothing is invented), the any-sailing layer is
verified through BYO, not through a second curated sailing.

## File contention

A: `src/main.tsx`, `src/vite-env.d.ts`, `src/ui/Sheet.tsx` (mounted-sheet signal), tests.
C: `src/state/backend.ts`, `src/state/sync.ts`, `src/state/store.ts`, new `src/state/restore.ts`,
`src/features/friends/ProfileSheet.tsx`, `supabase/config.toml`, docs.
B: `src/features/cruise/*`, `src/app/App.tsx`, `src/features/home/Home.tsx`, `src/state/store.ts`,
new privacy sheet, docs.
`store.ts` and `ProfileSheet.tsx` are touched by more than one workstream, so workstreams run
sequentially and never two writers on one file.

## Rules that bind every implementer

- Read `docs/DESIGN.md` in full before touching anything that renders; place the feature in its
  screen's rank order; compose from the registry; the four banned tells apply.
- British English, no em dashes, sentence case, dry. Never an emoji as an icon.
- Merge into `CLAUDE.md` and the docs; never rewrite or strip them.
- Gate before reporting done: `npm run design:check`, `npm run lint` (0 errors; 28 warnings are
  known), `npx tsc -p tsconfig.app.json --noEmit`, and `node tools/qa/shot.mjs <label> <route>` at
  390×844 against the one dev server already running on 5173 (never start a second).
- Secrets stay in the gitignored `.env`; never a value in a doc or a prompt.
- QA against the live backend creates anonymous users; prefer `?seed&nosync`. Never blanket-purge.
