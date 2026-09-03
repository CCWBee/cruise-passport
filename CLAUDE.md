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
   `npx tsc -p tsconfig.app.json --noEmit`. `tools/qa/README.md` has the loop.

`npm run design:check` also runs in CI before the build, so an off-system value fails the deploy.
Accepted exceptions live in `tools/qa/design-allow.txt` with their reasons.

## Where things are

- `docs/DESIGN.md`, `docs/DESIGN-AUDIT.md`: design contract and its history.
- `docs/RATIONALISATION.md`: the 1 September pass that left one host, one backend, one crew model.
- `docs/PRODUCTIONISATION.md`, `docs/BACKEND_SETUP.md`: hosting and Supabase setup.
- `src/styles/` tokens and base; `src/ui/` the controls; `src/features/<screen>/` one folder per
  screen; `src/state/` store, social, sync, share codec; `src/data/` the ported drinks and venues
  (`raw.ts` is Isabel's data; change it deliberately).
- `tools/qa/`: the screenshot and scan harness (zero dependencies).
- `redirect/`: the GitHub Pages redirector for the old address.

## Operating notes

- **Deploy:** every push to `main` builds and deploys to Cloudflare Pages (`.github/workflows/deploy.yml`).
  Work on a branch; merge to `main` to ship. Secrets are repo secrets by name only
  (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`);
  never write a value into a doc.
- **Backend:** Supabase project `qpmrfoglxohmjhjtvkac`, separate from every other project's. Guest
  first; login stays optional. Migrations in `supabase/migrations/`.
- **Seed:** `?seed` on any URL loads sample data and two friends (the block in `index.html`). QA runs
  against the live backend create anonymous users; purge them afterwards (see the memory notes).
- **Do not push to Isabel's repo** (`isabelgillam21-sketch/Princess-Cruise-Drinks`). This is
  `CCWBee/cruise-passport`.
- **Headless screenshots** show the CSS fallback sea, not the WebGL one; the sea hero needs a real
  device for a final look. Everything else is what a phone renders.
- Copy: British English, no em dashes, sentence case, dry. See `docs/DESIGN.md` Copy.
