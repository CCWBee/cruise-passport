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
4. Verify with a render in Brave, not headless Chrome (Charles, 22 September 2026: "use brave to
   verify stuff not headless chrome it nukes performance"; `OPERATING_RULES.md`, "Verify in Brave,
   not headless Chrome"). `npm run dev`, then in your own tab through the browser extension load the
   dev server with `?seed&nosync`, write an iframe wrapper into that tab on the same origin, 390 by
   844, pointing at the route with `?seed&nosync`, screenshot twice (the automation tab only renders
   when a screenshot is taken) and read overflow from the frame's `scrollWidth`. The visual-verify
   skill (`C:\Users\Charles\.claude\skills\visual-verify\SKILL.md`) has the method and
   `docs/DESIGN.md` Verification this app's version of it. Always pass `nosync`: the dev server's
   `.env` carries the live project's keys, so a load without it signs a throwaway anonymous user in.
   Brave's content blocking hides elements whose class names look like social-media widgets (it hid
   `.social-head` on 23 September 2026, so Crew's classes are `crew-*`): keep class names clear of
   social, share, ad, banner and promo. Then `node tools/qa/scan.mjs <files>`, `npm run
   design:check`, `npm run lint` (0 errors required; the 28 warnings are known), `npm test` and
   `npx tsc -p tsconfig.app.json --noEmit`, none of which opens a browser. `tools/qa/README.md` has
   the loop.

`npm run design:check` also runs in CI before the build, so an off-system value fails the deploy.
Accepted exceptions live in `tools/qa/design-allow.txt` with their reasons.

### Headless tools, run only when Charles asks for a headless run

Every script in `tools/qa/` except `scan.mjs` launches headless Chrome through `cdp.mjs`. They are
kept, `tools/qa/README.md` lists them, and none of them runs unless Charles asks for a headless run.
Beyond `shot.mjs`, the one-screen shot:

- `tools/qa/film.mjs` films an interaction: a contact sheet with a tile every `--every` ms from the
  press, cropped to one element, and a flipbook that plays the frames at real speed and at a quarter
  speed, which is how the shaker's timing is judged. It always appends `?seed&nosync`.
- `tools/qa/shots.mjs` sweeps every screen and its main sheet and passes `nosync` on every load, so a
  sweep never signs a throwaway user in to the live backend.
- `tools/qa/erase-live.mjs` is polish item 1's live check (Seed, below). By hand only, and never in a
  sweep: it signs two anonymous users in to the live backend and deletes both itself.
- `tools/qa/gestures.mjs` warms the dev server itself before it starts timing, so a cold server no
  longer fails the first run.

The traps, all still true of `shot.mjs`:

`shot.mjs` appends `?seed` to the route but not `nosync`. Put it in the route (`drinks?nosync`), or
the run signs a throwaway user in to the live project.

`shot.mjs` reads `--after` once and reuses it for both clicks, so a command carrying two of them
waits the first value after each: a shot meant to land 900ms after the second click waits 2200 and
arrives past the state it was for. The symptom is a PNG that disagrees with a CDP probe of the same
moment, a shake already over or a lid caught part-way through its flip. Pass one `--after`
that suits the shot you want, and read the state back in `--eval` beside the picture.

`document.querySelector('[aria-live]')` in a `--eval` finds the toast region, which is mounted
empty on every screen, and not the live line of the sheet you are looking at. Select the region you
mean (`.sr-only[aria-live]`), or a passing shot will report an announcement that never happened.
The same holds for a probe of the page from Brave.

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
- `src/data/sailings.ts`: the sailings a guest sets up for themselves and every venue they add, in
  `spcc-sailings` beside `spcc-cruise`, read lazily so the file can be imported under `node --test`.
  `cruises.ts` folds them into `CRUISES` at module load, which is the reload contract: `VENUES`,
  `VENUE_KEYS`, `DECKS`, `CATEGORIES` and `DRINKS` are resolved once, so saving a venue or a sailing
  reloads the page, once, from the sheet's close handler and only when something was actually saved.
  The three QA fixtures the BYO screens are shot from (`?seed&fixture=byo-new|byo-empty|byo`) are in
  the same inline block in `index.html` as the demo seed.
- `src/features/shake/`: the shaker, opened from the foot of Home's "For you". `pick.ts` is the
  decision (pure, tested), `rattle.ts` the synthesised dice, `Shaker.tsx` the drawing, `Glass.tsx`
  the nine prize glasses, `timing.ts` the timings (`SHAKER`) and `ShakeSheet.tsx` the states; the
  fifth authored moment, written up in `docs/DESIGN.md`. `keyframes.mjs` writes the computed
  keyframes at the foot of `shake.css` from `SHAKER`: to change a timing, edit `SHAKER` in
  `timing.ts`, then run `node src/features/shake/keyframes.mjs`, and read the two lines it prints
  (whether the cap clears the glass, whether anything leaves the top of the stage), because it warns
  rather than fails.
- `src/data/glass.ts`: which of the nine glasses a drink is served in, read by the drink row's icon
  (`GlassIcon` in `src/ui/Icon.tsx`) and the shaker's prize alike. A published drink takes its glass
  from `src/data/glassByDrink.ts`, a generated table never edited by hand; a drink the guest added
  takes the rules in `glass.ts` (name, then frozen, then category; pure, tested in `glass.test.ts`).
  `tools/glass-classify.mjs` writes the table: wines and beers in code, each cocktail put to Jev
  (TypeSafe, `jev-1.13.0`) as one choice among the nine glasses, the rulings in
  `tools/glass-classify.overrides.json` applied last, the probabilities in
  `tools/glass-classify.report.json`. It calls a paid API with `TYPESAFE_API_KEY` from
  `E:\claude-projects\jev-lab\.env` (the first run cost $0.0054), so ask Charles before running it;
  `--dry` asks and prints without writing. A changed glass is a ruling in the overrides file,
  applied on the next run.
- `tools/qa/`: the screenshot and scan harness (zero dependencies). All but `scan.mjs` are headless,
  so they run only when Charles asks (above).
- `.claude/`: the workflow worktrees (`.claude/worktrees/<run id>`), each a checkout of this repo
  whose branch holds one stream's work. Gitignored, and not the main tree: edit and commit in the
  repo root.
  **Never `git worktree remove` a worktree that holds a `node_modules` junction.** Symptom (23
  September 2026): after removing the six declutter worktrees, `node_modules/.bin`, the dot folders
  and every scoped package sorting before `@rolldown` were gone from the main tree. Cause: each
  worktree linked the main `node_modules` in as a junction, and git's recursive delete followed it,
  alphabetically, until it errored with "Invalid argument". Check: before removing a worktree,
  delete its junction on its own (`[System.IO.Directory]::Delete('<wt>\node_modules', $false)` in
  PowerShell, which removes the link and never follows it), then delete the folder; if it already
  happened, `npm install` in the main tree restores everything from the lockfile.
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
  `shot.mjs` cannot see, because it always appends `?seed` and a seeded store is already entered. It
  needs a browser context with nothing stored, which a Brave tab on the dev server is not (it carries
  whatever that origin has stored), so it runs headless, when Charles asks.
- **Landing and install:** `/get` is the install path (what this is, a code of the live address, the
  two steps to a home screen, and a price slot that is empty until Charles rules), and the same screen
  also renders at `/` for a desktop first open, above the entry gate, so a laptop visitor is never
  handed a name-and-colour card. `isDesktopVisitor()` (`src/data/model.ts`, beside the QA overrides so
  `Landing.tsx` only exports its component) decides it on width, hover and pointer together. It
  collects nothing and asks the network for nothing.
- **Rendering the landing:** `?landing=desktop|phone` pins the branch, and `desktop` also forces the
  root gate open, because `?seed` has always migrated the store to entered. In Brave, an iframe
  wrapper 1280 by 800 shows the desktop branch at the size it is for; in a headless run,
  `SHOT_W`/`SHOT_H` move `shot.mjs` off 390×844 to do the same.
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
  Since 23 September a load whose URL carries `seed` or `fixture` never syncs, whatever the store
  says (`qaDemo()` in `src/data/model.ts`, read by `mode()` in `sync.ts`; the status reads `'local'`),
  because both mark the store entered and that is how 124 of the live project's 166 accounts were
  made. `nosync` is still the rule for any other QA load against the dev server.
  **Delete my data no longer replaces the erased user with one you cannot reach.** Until 22 September
  `deleteMyData` signed the session out and `resetSocialIdentity()` minted a new local identity, so
  with sync live the next round trip signed in a *fresh* anonymous user and republished `profiles`,
  `passports` and `backups` under it, name and all; close the browser context and those rows were
  orphaned, because own-row RLS means only that session could have deleted them (measured on 10
  September, both ways). `resetSocialIdentity()` now also sets `enteredCruise` false, so the app
  returns to the entry screen with the name prefilled and `sync.ts`'s `mode()` stays `'off'` until
  Done: a stranger is asked again before anything leaves the phone, and erasing on a live-sync page
  leaves nothing behind. Tapping Done after that does sign in a new anonymous user, so a QA run that
  goes past the entry screen still owes a second erase. The check is the live run in
  `docs/specs/2026-09-17-polish.md` item 1. `tools/qa/erase-live.mjs` is that run: by hand, once,
  when erasure or the sync gate changes, never in a sweep. It signs two anonymous users in to the
  live backend, erases both itself (the second on a `nosync` load) and prints their uids and codes
  for the purge ledger; it is headless, so it also waits for Charles to ask.
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
- **The recovery code** (23 September 2026, `docs/specs/2026-09-23-recovery-and-hardening.md`,
  migration `0004_recovery.sql`) is how a passport comes back while Google is off
  (`googleSignInEnabled` is false in `backend.ts`; the Google paths stay, unreachable). The secret is
  pure and tested (`src/state/recovery.ts`): 20 Crockford characters, 100 bits, made on the phone,
  kept in the store (`recovery: { secret, confirmed }`), and registered as its SHA-256 through
  `set_recovery` after a round whose publish went through, every round until confirmed.
  `useRecoveryCode()` returns it grouped (`K7QM-3XPA-9RTC-W2HD-6NBF`) once confirmed, else null.
  `claimPassport(code)` pauses sync, awaits the round in flight, calls `claim_recovery` (which moves
  the whole identity onto this phone's session and deletes the old auth user), folds the backup in
  through the same `applyBackup()` the Google restore uses, takes the friend code, name and colour
  from the claimed profile, keeps the secret, enters and publishes. Its states are in
  `useSyncStore().claim`: `working`, `done` (clears after 8 s), `wrong`, `offline`, `failed`. The
  UI is added on night-bar after the merge; its copy is in the spec's section 1.
- **One identity on patchy Wi-Fi.** auth-js removes a session whose refresh it counts as final, and
  answers null for a minute after a retryable failure; the old `ensureSession()` minted a new
  anonymous user either way, which then fought the old one for the friend code. `supabase.ts` now
  gives the client a storage adapter that keeps a copy of the session unless the app itself signed
  out (`forgetSession()`), and `backend.ts`'s `resolveSession()` acts on the pure, tested decision in
  `src/state/session.ts`: use a live session; hold while the library still stores one; put the kept
  copy back with `setSession`; mint only on a phone that never had a user (the store's `syncUid`).
  Only a definite "gone" (`refresh_token_not_found`, `user_not_found`, `session_not_found`, or any
  other JSON 4xx from the auth server bar 408 and 429, such as `refresh_token_already_used`, which is
  refused the same way for ever; or a profile write refused on the friend code or the auth.users
  foreign key and confirmed by `getUser()` on the session's own token) retires the identity: sync
  stops with status `'moved'` and nothing new is minted until the guest claims the code back or
  calls `startAgain()`. A failed publish is no longer followed by a pull, so a lost
  identity cannot empty the crew list.
- **Timeouts and the erase.** Every Supabase request has a time limit (`src/state/timeout.ts`, 15 s,
  20 s for the claim), so a stalled request fails into the backoff instead of holding every later
  round. `deleteMyData()` pauses sync and awaits the round in flight, backup included, before
  `delete_my_data`; it never creates a session to erase (no session means nothing on the server);
  the pause lifts at the next Done. The three publish steps take the round's user id and write only
  while it is still the session's. The backup is awaited and counted in the round now.
- **Migrations are dry-run before they are applied:** `node supabase/tests/dryrun.mjs <nnnn>` runs
  the migration's own text and its assertions against the live project inside a DO block that ends
  by raising, so nothing persists, then confirms that with a read-only query (`docs/BACKEND_SETUP.md`
  step 3). Symptom it caught on the first run: a JavaScript `String.replace` with a string
  replacement read the migration's `$'` as its own pattern and spliced text into the SQL; the
  builder passes a function.
- **`?qa=` overrides** (QA only, `src/state/sync.ts`, the same family as `?seed`, `?nosync`, `?day=`
  and `?hour=`): `?qa=account:saved,restore:done,restored:58,sync:held` puts any sign-in or restore
  state on screen, and any of those four freezes the sync so nothing overwrites the state before the
  shutter. `?qa=signedin:1` is the opposite: it leaves sync running and makes the session read as
  signed in, so the whole restore path can be run against real rows with no Google account.
  For the recovery UI: `claim:working|done|wrong|offline|failed` (frozen, like the four),
  `sync:moved` and `sync:local`, and `code:1`, which makes `useRecoveryCode()` show a sample code on
  a nosync load without freezing anything.
- **Do not push to Isabel's repo** (`isabelgillam21-sketch/Princess-Cruise-Drinks`). This is
  `CCWBee/cruise-passport`.
- **The sea hero in a render:** a headless shot shows the CSS fallback sea, not the WebGL one, unless
  `CDP_GPU=1`. Brave paints WebGL on the real GPU, but the sea's motion does not advance between the
  extension's calls, so the sea hero still needs a real phone for a final look. Everything else is
  what a phone renders.
- Copy: British English, no em dashes, sentence case, dry. See `docs/DESIGN.md` Copy.
