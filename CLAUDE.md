# Cocktail Passport

Charles's rebuild of Isabel's Sun Princess Cocktail Passport: an offline-first PWA logbook for a
fifteen-day cruise (3 to 17 October 2026, 214 drinks, 28 venues). Live at https://cruise.charlesbee.org.
Workspace-wide rules are in `E:\claude-projects\OPERATING_RULES.md`; this page holds what is specific
to this project. Status and next action live in `E:\claude-projects\PROJECTS.md`.

## Before touching anything that renders

Read `docs/DESIGN.md` in full. It is the design constitution: the thesis, the geometry, the colour and
type tables, the per-screen module order, and, at the foot, the working process and the registry of
primitives that already exist. `docs/DESIGN-AUDIT.md` records why the app once read as sloppy; read
it so you recognise the tells when they creep back. The short version of the process:

1. Read the constitution, the screen's section, the registry, and the neighbouring screen that does
   the same job. Grep before you build; most "new" is a sibling of something built.
2. Place a feature in its screen's rank order before drawing it. Features reinforce each other; one
   that repeats a number, invents a colour or brings its own container dilutes the rest.
3. Compose from the registry. Diverge only with a written reason. Mint a new primitive in
   `src/styles/base.css` or `src/ui/`, register it in `DESIGN.md`, sweep the siblings, all in one change.
4. Verify with a render: `npm run dev`, then `node tools/qa/shot.mjs <label> <route>` at 390×844
   (routes without the leading slash), `node tools/qa/scan.mjs <files>`, `npm run design:check`,
   `npm run lint` (0 errors required; the 28 warnings are known) and
   `npx tsc -p tsconfig.app.json --noEmit`. `tools/qa/README.md` has the loop. `tools/qa/gestures.mjs`
   warms the dev server itself before it starts timing, so a cold server no longer fails the first run.

`npm run design:check` also runs in CI before the build, so an off-system value fails the deploy.
Accepted exceptions live in `tools/qa/design-allow.txt` with their reasons.

## Where things are

- `docs/DESIGN.md`, `docs/DESIGN-AUDIT.md`: design contract and its history.
- `docs/RATIONALISATION.md`: the 1 September pass that left one host, one backend, one crew model.
- `docs/PRODUCTIONISATION.md`, `docs/BACKEND_SETUP.md`: hosting and Supabase setup.
  `docs/PRODUCTIONISATION.md` is the original plan; its checklist was reconciled against the code on
  5 September, so what is still unticked there is the real outstanding work.
  `docs/RATIONALISATION.md` is the decision record.
- `src/styles/` tokens and base; `src/ui/` the controls; `src/features/<screen>/` one folder per
  screen; `src/state/` store, social, sync, share codec; `src/data/` the ported drinks and venues
  (`raw.ts` is Isabel's data; change it deliberately).
- `tools/qa/`: the screenshot and scan harness (zero dependencies).
- `redirect/`: the GitHub Pages redirector for the old address.

## Operating notes

- **Deploy:** every push to `main` builds and deploys to Cloudflare Pages (`.github/workflows/deploy.yml`).
  Work on a branch; merge to `main` to ship. Secrets are repo secrets by name only
  (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`);
  never write a value into a doc. A page that is open when a deploy lands now reloads itself once
  the new worker takes control, so the first open after a deploy is the current build
  (`src/main.tsx`, `startUpdates`). The reload is held while a sheet is open and runs when the last
  one closes, so a half-typed "Add a missing drink" form is never dropped; `tools/qa/update.mjs` is
  the check.
- **Backend:** Supabase project `qpmrfoglxohmjhjtvkac`, separate from every other project's. Guest
  first; login stays optional. Migrations in `supabase/migrations/`.
- **First open:** `enteredCruise` (persist v9) decides the first screen, not the number of sailings,
  and `src/features/cruise/Entry.tsx` is what sets it. Until it is true `sync.ts`'s `mode()` is
  `'off'`, so a cold first open signs in to nothing and writes nothing: the consent line on that
  screen would be false otherwise. `tools/qa/first-open.mjs` is the check, and it is the one thing
  `shot.mjs` cannot see, because it always appends `?seed` and a seeded store is already entered.
- **Landing and install:** `/get` is the install path (what this is, a code of the live address, the
  two steps to a home screen, and a price slot that is empty until Charles rules), and the same screen
  also renders at `/` for a desktop first open, above the entry gate, so a laptop visitor is never
  handed a name-and-colour card. `isDesktopVisitor()` (`src/features/landing/Landing.tsx`) decides it
  on width, hover and pointer together. It collects nothing and asks the network for nothing.
- **Rendering it headlessly:** `?landing=desktop|phone` pins the branch, and `desktop` also forces the
  root gate open, because `?seed` has always migrated the store to entered; `SHOT_W`/`SHOT_H` move
  `shot.mjs` off 390×844, which is the only way to see the desktop branch at the size it is for.
- **Seed:** `?seed` loads sample data and two friends from the inline block in `index.html`. It needs
  the exact `?seed` parameter, not the substring, and a production build only seeds a passport nobody
  has touched: any entry, visit, friend, group, custom drink or profile name and it returns without
  writing, so a shared link cannot wipe a real user, including one who has joined and named
  themselves but not yet logged a drink. The dev server still overwrites unconditionally, which is
  what `tools/qa` relies on. `?entry` (`qaFirstOpen()`, `src/data/model.ts`) forces the first-open
  screen over any store, so it can be shot from a seeded server; it does not gate sync, so pass
  `&nosync` with it. The seed profile is named Alex. QA runs against the live backend create
  anonymous users; purge only anonymous sessions created that day with profile name Alex and zero
  edges or memberships. Real users have existed since 3 September, so never blanket-purge. Pass
  `?seed&nosync` to keep a headless run off the backend entirely.
  **Tap Delete my data on a page loaded with `?nosync`, or the QA user you just erased is replaced by
  one you cannot reach.** `deleteMyData` signs the session out and `resetSocialIdentity()` mints a new
  local identity, so with sync live the next round trip immediately signs in a *fresh* anonymous user
  and republishes `profiles`, `passports` and `backups` under it, name and all. That is right for a
  real guest and wrong for a QA run: close the browser context and its rows are orphaned, because
  own-row RLS means only that session could have deleted them. Measured on 10 September, both ways.
- **Accounts:** guest first, and signing in stays optional. "Keep your passport" in the Profile sheet
  offers Google: an anonymous session upgrades through `linkIdentity`, so the user id and every row
  under it survive. The merge is pure and tested (`src/state/restore.ts`, `npm test`); `sync.ts` owns
  the calls, the states and the launch order. That order is the load-bearing part: `restoreOnLaunch()`
  is one named promise, the first sync and every `runSync()` wait on it, and without that the first
  publish would write an empty passport over a good backup on a new phone. A restore runs on an
  explicit sign-in, or on launch when signed in and nothing has been done on this phone; never
  silently on a phone in use. The canonical friend code is read from the signed-in user's own
  `profiles` row and adopted, because a stale code collides on `profiles.code unique` and orphans
  every friend edge. Until Charles opens the dashboard gates (`docs/BACKEND_SETUP.md` steps 2 and 4)
  the button says "Sign-in is not available yet" rather than failing silently. There is no sign-out
  control on purpose: signing out drops to no session and the next `ensureSession()` mints a fresh
  anonymous user, which orphans every edge. Google itself has never been exercised end to end here.
  The server no longer stores the literal `A friend`: `publishBackend` writes `profile.name` as it
  stands, so `profiles.name`, the column `find_profiles` and both feeds read, is never fabricated,
  and an unnamed guest is not findable rather than findable under an invented name. The sixteen old
  rows are overwritten with an empty name the next time each of those users syncs. The four
  client-side display fallbacks are unchanged, and `share.ts` still puts the literal in
  `passports.payload.n`, which no SQL reads.
- **`?qa=` overrides** (QA only, `src/state/sync.ts`, the same family as `?seed`, `?nosync`, `?day=`
  and `?hour=`): `?qa=account:saved,restore:done,restored:58,sync:held` puts any sign-in or restore
  state on screen, and any of those four freezes the sync so nothing overwrites the state before the
  shutter. `?qa=signedin:1` is the opposite: it leaves sync running and makes the session read as
  signed in, so the whole restore path can be run against real rows with no Google account.
- **Do not push to Isabel's repo** (`isabelgillam21-sketch/Princess-Cruise-Drinks`). This is
  `CCWBee/cruise-passport`.
- **Headless screenshots** show the CSS fallback sea, not the WebGL one; the sea hero needs a real
  device for a final look. Everything else is what a phone renders.
- Copy: British English, no em dashes, sentence case, dry. See `docs/DESIGN.md` Copy.
