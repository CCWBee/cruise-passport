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
- **Seed:** `?seed` loads sample data and two friends from the inline block in `index.html`. It needs
  the exact `?seed` parameter, not the substring, and a production build only seeds a passport nobody
  has touched: any entry, visit, friend, group, custom drink or profile name and it returns without
  writing, so a shared link cannot wipe a real user, including one who has joined and named
  themselves but not yet logged a drink. The dev server still overwrites unconditionally, which is
  what `tools/qa` relies on. The seed profile is named Alex. QA runs against the live backend create
  anonymous users; purge only anonymous sessions created that day with profile name Alex and zero
  edges or memberships. Real users have existed since 3 September, so never blanket-purge. Pass
  `?seed&nosync` to keep a headless run off the backend entirely.
- **Accounts:** there is no sign-in and no restore yet. `publishBackup` writes to `backups`; nothing
  reads it. The Google sign-in and `fetchBackup` adapter code was written in 037be89 and removed in
  7d4e3c6; recover it with `git show 037be89:src/state/backend.ts` rather than rewriting it.
- **Do not push to Isabel's repo** (`isabelgillam21-sketch/Princess-Cruise-Drinks`). This is
  `CCWBee/cruise-passport`.
- **Headless screenshots** show the CSS fallback sea, not the WebGL one; the sea hero needs a real
  device for a final look. Everything else is what a phone renders.
- Copy: British English, no em dashes, sentence case, dry. See `docs/DESIGN.md` Copy.
