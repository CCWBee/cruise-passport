# Design QA tools

Zero-dependency Node scripts (Node 22, headless Chrome at the default Windows install path) that
make "verify with a real render" a one-line habit. They are how every screen in this app was checked,
and how the next change should be.

| Script | What it does |
| --- | --- |
| `shot.mjs <label> <route> [--click sel] [--click2 sel] [--after ms] [--full] [--eval js]` | One screen, seeded, at 390×844 (viewport, and full page with `--full`). Routes go **without** the leading slash (`drinks`, `social`, `home`) because Git Bash rewrites `/drinks` into a Windows path. `--click` opens a sheet; `--after` is the settle time after the click (a sheet's wave runs ~2.4s, so use `--after 3000` for a settled shot). Prints `HORIZONTAL OVERFLOW` if the page is wider than the viewport. |
| `shots.mjs <baseUrl> <prefix>` | Every screen and its main sheet in one run: `home drinks drink-sheet ship venue-sheet social add-sheet stats badges log wrapped`. |
| `compare.mjs <beforePrefix> <afterPrefix>` | A before/after montage PNG from two `shots.mjs` sweeps. |
| `gestures.mjs` | The sheet's gesture contract (`docs/DESIGN.md`, Sheets) driven with real touch events through CDP against the running dev server: a lazy short drag settles back, a long drag or a fast flick dismisses, a drag on a scrolled sheet scrolls, a sideways drag does nothing, the page never scrolls sideways. Prints PASS/FAIL per case and exits 1 on any failure. Run it after touching `src/ui/Sheet.tsx`. |
| `update.mjs` | The simulated deploy: copies `dist/` into two trees, renames the shell chunk in the second, serves one on `127.0.0.1:4180` and swaps to the other without navigating the page. Asserts that the page reloads itself onto the new shell, and that it holds that reload while a sheet is open with the form intact. Needs `npm run build` first. Prints PASS/FAIL per case and exits 1 on any failure. Run it after touching `src/main.tsx` or the PWA options in `vite.config.ts`. |
| `scan.mjs <css or dir> ...` / `scan.mjs --check src` | The mechanical scan against `docs/DESIGN.md`: sizes, weights, spacing, radii, shadows, blur, caps, easing, colours, gradients, endless motion. `--check` (wired as `npm run design:check`, run in CI before the build) fails on any suspect not listed in `design-allow.txt`. |
| `first-open.mjs` | The sync gate: opens the root with **no query at all** in a fresh browser context and asserts that the entry screen is up and that nothing reached Supabase. `shot.mjs` cannot check this, because it always appends `?seed` and a seeded store is already entered. It never clicks Done, which would create a live anonymous user. Prints PASS/FAIL and exits 1 on failure. Run it after touching `src/state/sync.ts` or the first-open gate in `src/app/App.tsx`. |
| `cdp.mjs` | The harness the others use: one headless Chrome per process (own debugging port, so parallel agents do not collide), isolated browser contexts, screenshots. `CDP_GPU=1` keeps WebGL on. |

Typical loop while working on a screen:

```bash
npm run dev                                   # once, leave it running (HMR)
node tools/qa/shot.mjs drinks drinks --full   # look at the PNG it prints, honestly
node tools/qa/shot.mjs sheet drinks --click ".dcard .d-open" --after 3000
node tools/qa/scan.mjs src/features/drinks    # clear every line, or justify it
npm run design:check                          # what CI will run
```

Output goes to `tools/qa/shots/` (gitignored; `SHOTS_DIR=name` picks another folder). `SHOT_W` and
`SHOT_H` move `shot.mjs` off 390×844, which is what the landing's desktop branch needs; they change
nothing else, and `shots.mjs` carries its own size and is not affected. Screenshots
are headless Chrome with `--disable-gpu`, so the sea hero shows its CSS fallback and WebGL surfaces
need a real device for a final look; everything else is what a phone renders. `?seed` is appended to
every URL so the screens are populated; it is the demo block in `index.html`. `?day=YYYY-MM-DD`
pins the date (the aboard states) and `?hour=N` pins the hour (the sky and the greeting), both read
in `src/data/model.ts`. `?entry` (same file) renders the first-open screen once whatever the store
says, which is the only way to shoot it from a seeded server; it does not gate sync, so pass
`&nosync` alongside it. `?landing=desktop|phone` (same file) pins which branch of the landing
renders, and `desktop` also forces the root gate open, for the same reason `?entry` exists: a seeded
store has already migrated to entered, so the gate could never be reached otherwise. `?nosync` keeps a run off the backend entirely (no anonymous sign-in, so
the live project's per-IP sign-in limit is not spent on screenshots; use it for everything except a
test of the sync itself). `CDP_GPU=1` keeps WebGL on so the live sea renders. `UPDATE_PORT=n` moves
`update.mjs` off its default 4180 so two agents can run it at once.
