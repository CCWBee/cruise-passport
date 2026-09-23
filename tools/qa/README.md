# Design QA tools

**Verify in Brave, not headless Chrome.** Charles, 22 September 2026: "use brave to verify stuff not
headless chrome it nukes performance" (`E:\claude-projects\OPERATING_RULES.md`, "Verify in Brave,
not headless Chrome"). A render is checked in Brave through the browser extension, against the dev
server, at 390 wide through an iframe wrapper: the visual-verify skill
(`C:\Users\Charles\.claude\skills\visual-verify\SKILL.md`) has the method, and `docs/DESIGN.md`
Verification this app's version of it, including the Brave quirk that hid Crew's heading (its
content blocking hides class names that look like social-media widgets).

`scan.mjs` opens no browser and runs at any time; so do `npm run design:check`, `npm test`,
`npm run lint` and `npx tsc`. Every other script here is a zero-dependency Node script (Node 22) that
launches headless Chrome at the default Windows install path through `cdp.mjs`. They are kept, and
they run only when Charles asks for a headless run, `npm run design:shots` included.

The loop while working on a screen:

```bash
npm run dev                                   # once, leave it running (HMR)
# Brave, your own tab through the extension: open http://127.0.0.1:5173/?seed&nosync, write the
# iframe wrapper (390 by 844, src "/drinks?seed&nosync"), screenshot twice, look honestly, and
# read the frame's scrollWidth against 390
node tools/qa/scan.mjs src/features/drinks    # clear every line, or justify it
npm run design:check                          # what CI will run
```

## The scripts

| Script | What it does |
| --- | --- |
| `scan.mjs <css or dir> ...` / `scan.mjs --check src` | The mechanical scan against `docs/DESIGN.md`: sizes, weights, spacing, radii, shadows, blur, caps, easing, colours, gradients, endless motion. `--check` (wired as `npm run design:check`, run in CI before the build) fails on any suspect not listed in `design-allow.txt`. Opens no browser. |
| `shot.mjs <label> <route> [--click sel] [--click2 sel] [--after ms] [--wait ms] [--full] [--eval js]` | Headless. One screen, seeded, at 390×844 (viewport, and full page with `--full`). Routes go **without** the leading slash (`drinks`, `social`, `home`) because Git Bash rewrites `/drinks` into a Windows path. It appends `?seed` but not `nosync`, so put that in the route (`drinks?nosync`) or the run signs a throwaway user in to the live project. `--click` opens a sheet; `--after` is the settle time after each click, one value read once for both (a sheet's wave runs about 2.4s, so use `--after 3000` for a settled shot). Prints `HORIZONTAL OVERFLOW` if the page is wider than the viewport. |
| `shots.mjs [baseUrl] [prefix]` | Headless. Every screen and its main sheet in one run: `home drinks drink-sheet ship venue-sheet social add-sheet stats badges log wrapped`. The base defaults to the live site and the prefix to `live`; `npm run design:shots` points it at the dev server with the prefix `local`. Every load passes `nosync` (the first is `/?seed&nosync`), so a sweep never signs a throwaway user in to the live backend, which a sweep without it once did on every run. |
| `compare.mjs <beforePrefix> <afterPrefix> [outName]` | Headless. A before/after montage PNG from two `shots.mjs` sweeps. |
| `film.mjs <label> <route> [--click sel] [--after ms] [--click2 sel] [--after2 ms] [--press sel] [--record ms] [--every ms] [--crop sel] [--cols n] [--reduced]` | Headless. Films an interaction at 390×844, always with `?seed&nosync`: what a still cannot show is how a motion reads. It opens something first (`--click`, then `--after`, default 3000), optionally takes a second step (`--click2`, then `--after2`, default 4000: a first shake, to film Shake again), starts a screencast, clicks `--press` and records for `--record` ms (default 3200). Writes three files to `SHOTS_DIR/<label>/`: `sheet.png`, a contact sheet with a tile every `--every` ms (default 100) stamped with its time from the press and cropped to `--crop`'s box plus 24; `film.html`, a flipbook that plays the frames at their real timing and at a quarter speed, which is where a wrong beat shows; and `frames.json`, the timestamps. `--reduced` emulates `prefers-reduced-motion: reduce` to film the fallback. Unlike `shot.mjs` it does not read `home` as the root: Home is the empty route (`""`). |
| `gestures.mjs` | Headless. The sheet's gesture contract (`docs/DESIGN.md`, Sheets) driven with real touch events through CDP against the running dev server: a lazy short drag settles back, a long drag or a fast flick dismisses, a drag on a scrolled sheet scrolls, a sideways drag does nothing, the page never scrolls sideways. It warms the dev server before it starts timing. Prints PASS/FAIL per case and exits 1 on any failure. Run it after touching `src/ui/Sheet.tsx`, when Charles asks. |
| `shake-live.mjs [base]` | Headless. The shaker end to end without minting a user: loads `/?seed&nosync`, opens the Shake sheet from Home's shake row, presses, and asserts the reveal: the cap off, the glass hanging at its end values with its foot at least 16 clear of the neck and its family named on `data-glass`, the stage 275 as it was shut, every line of the card and Shake again in, the live line saying the card's sentence, the sheet not scrolling, and nothing of the old lid, token or window. Then it goes to the drink sheet, closes it and samples the return eight times: each must read `is-open is-still` at the same end values with the live line empty. Prints the served shell hash first, so a stale edge reads as one. The base defaults to the live site; pass `http://127.0.0.1:5173` for the dev server. Exits 1 on any failure. |
| `update.mjs` | Headless. The simulated deploy: copies `dist/` into two trees, renames the shell chunk in the second, serves one on `127.0.0.1:4180` and swaps to the other without navigating the page. Asserts that the page reloads itself onto the new shell, and that it holds that reload while a sheet is open with the form intact. Needs `npm run build` first. Prints PASS/FAIL per case and exits 1 on any failure. Run it after touching `src/main.tsx` or the PWA options in `vite.config.ts`, when Charles asks. |
| `first-open.mjs` | Headless. The sync gate: opens the root with **no query at all** in a fresh browser context and asserts that the entry screen is up and that nothing reached Supabase. `shot.mjs` cannot check this, because it always appends `?seed` and a seeded store is already entered, and a Brave tab cannot either, because it carries whatever the dev server's origin has stored. It never clicks Done, which would create a live anonymous user. Prints PASS/FAIL and exits 1 on failure. Run it after touching `src/state/sync.ts` or the first-open gate in `src/app/App.tsx`, when Charles asks. |
| `erase-live.mjs` | Headless, and **live**: polish item 1's check (`docs/specs/2026-09-17-polish.md`). In a fresh context with a fetch tap installed before navigation, it loads `/?seed` with sync live, waits for the anonymous signup and publish, taps Delete my data twice, and asserts that `delete_my_data` and the logout fired, the entry screen is up and nothing reached Supabase for ten seconds; then taps Done and asserts a signup and a publish within 3000ms; then erases again on a `nosync` load. Prints both identities' uids and codes for the purge ledger, then PASS or FAIL, and exits 1 on failure. It signs two anonymous users in to the live backend and deletes both, so it runs by hand, once, when erasure or the sync gate changes, and never in a sweep. `SHOT_BASE` picks the server (default the dev server, whose `.env` carries the live project's keys). |
| `recovery-live.mjs` | Headless, and **live**: the recovery code end to end (`docs/specs/2026-09-23-recovery-and-hardening.md`). Two contexts are two phones on the dev server with no `?seed` and no `nosync`: A enters, ticks two drinks and waits for Your details to show its code; B enters, tries a well-formed wrong code (the server path), then brings A's passport back with A's code and checks the drinks, name, friend code and code arrived; A must then show the moved status and mint no user; B erases. Run it by hand, once, when the recovery path changes, never in a sweep, and only inside `capped.ps1`. It leaves B's auth user behind (`delete_my_data` erases rows, not the user), so delete the users it made afterwards: their ids go to `IDS_OUT`, never to stdout. Env: `SHOT_BASE`, `IDS_OUT`, `SHOTS_DIR`. |
| `sweep.mjs [--only a,b] [--hours 13,19,23]` | Headless. Every screen and sheet in the three rooms at 390 by 844, the main screens at 320 by 568 (day and night) and the desktop landing at 1280 by 800, all on `?seed&nosync`. Writes `sweeps/<stamp>/` (gitignored) with a `manifest.json` per shot: width against scroll width, the room, and `glass`, the backdrop-filtered surfaces actually painted (a layer hidden by visibility or an opacity of 0 is not counted). `claim-done` runs alone after the rest, one hour at a time, because with the hours side by side its Confirm tick never reached the picture. Only inside `capped.ps1`. |
| `contact.py <sweep folder>` | Python and Pillow, no browser. Lays each state's three hours side by side, labelled with the manifest's numbers, in `<sweep>/contact/`, so a review reads one picture per state. |
| `capped.ps1 -CpuPercent 25 -Log <file> <command...>` | Runs a command in a Windows job object with a hard CPU cap and below-normal priority, so a headless run cannot take the machine over (Charles, 23 September 2026). Every child, Chrome included, inherits the job; the end line says how many processes ran in it. Every headless run goes through it. |
| `cold.mjs [base]` | Headless. The cold first run with no seed: loads `/`, `/drinks`, `/ship`, `/social` and `/you` with `?nosync`, each in its own fresh context, and takes a full-page shot of each, which shows the states `?seed` hides. The base defaults to the dev server; `nosync` makes it safe against the live site too. |
| `offline.mjs [base]` | Headless. Whether the installed app renders offline: loads twice so the worker installs and takes control, prints the worker's state, cuts the network at the CDP layer, reloads and shoots what came back. It needs a build with a worker (the live site, its default, or `vite preview`); a dev server has none. |
| `cdp.mjs` | The harness the others use: one headless Chrome per process (own debugging port, so parallel agents do not collide), isolated browser contexts, screenshots. `CDP_GPU=1` keeps WebGL on. |

## Query overrides

These work in a Brave render and a headless run alike. `?seed` is the demo block in `index.html`
(`shot.mjs` appends it to every URL so the screens are populated). `?nosync` keeps a load off the
backend entirely (no anonymous sign-in, so the live project's per-IP sign-in limit is not spent on
screenshots); use it for everything except a test of the sync itself, and always in Brave, because
the dev server's `.env` carries the live project's keys. `?day=YYYY-MM-DD` pins the date (the aboard
states) and `?hour=N` pins the hour (the sky and the greeting), both read in `src/data/model.ts`.
`?entry` (same file) renders the first-open screen once whatever the store says, which is the only
way to render it from a seeded store; it does not gate sync, so pass `&nosync` alongside it.
`?landing=desktop|phone` (same file) pins which branch of the landing renders, and `desktop` also
forces the root gate open, for the same reason `?entry` exists: a seeded store has already migrated
to entered, so the gate could never be reached otherwise.

## When Charles asks for a headless run

```bash
node tools/qa/shot.mjs drinks "drinks?nosync" --full
node tools/qa/shot.mjs sheet "drinks?nosync" --click ".dcard .d-open" --after 3000
```

Output goes to `tools/qa/shots/` (gitignored; `SHOTS_DIR=name` picks another folder). `SHOT_W` and
`SHOT_H` move `shot.mjs` off 390×844, which is what the landing's desktop branch needs; they change
nothing else, and `shots.mjs` carries its own size and is not affected. Screenshots are headless
Chrome with `--disable-gpu`, so the sea hero shows its CSS fallback and WebGL surfaces need a real
device for a final look; everything else is what a phone renders. `CDP_GPU=1` keeps WebGL on so the
live sea renders. `UPDATE_PORT=n` moves `update.mjs` off its default 4180 so two agents can run it
at once.

## Elsewhere in `tools/`

`tools/glass-classify.mjs` is not a QA tool, but it writes a file the app reads:
`src/data/glassByDrink.ts`, the glass each published drink is served in. Wines and beers are decided
in code; each cocktail is put to Jev (TypeSafe, `jev-1.13.0`) as one choice among the nine glasses of
`src/data/glass.ts`, over its name, category, spirits, ingredients, flavours, frozen flag and menu
note. Answers under 0.5 are printed for a person to rule on; the rulings in
`tools/glass-classify.overrides.json` are applied last, and each answer's probability goes to
`tools/glass-classify.report.json`. `--dry` asks and prints without writing. It calls a paid API
with `TYPESAFE_API_KEY` from `E:\claude-projects\jev-lab\.env` (the first run cost $0.0054), so ask
Charles before running it. A changed glass is a ruling in the overrides file, applied on the next run,
never an edit to the generated table.
