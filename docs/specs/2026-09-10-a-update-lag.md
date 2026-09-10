# The first open after a deploy shows the previous build

Workstream A of `docs/specs/2026-09-10-product-brief.md`. Branch `product`. Nothing in this spec
renders, and nothing in it touches the backend.

## Purpose

A guest who opens the app after a deploy is served the build their phone already has, and keeps it
until they kill the app and reopen it, so a fix shipped in the morning is not on their phone at the
bar that evening. This makes the running page reload itself once the new service worker takes
control of it, so the first open after a deploy ends on the current build without the guest doing
anything.

How long that takes is not under our control and the spec does not pretend otherwise. The new worker
precaches the whole shell before it activates: today that is sixteen entries and 1,745 KiB (the
`PWA v1.3.0 / precache 16 entries (1744.91 KiB)` line at the end of `npm run build`). All of it has
to download before the worker activates, so on the ship's wifi the reload can land well into the
session rather than at the moment of opening. That is exactly why the guard below exists: a reload
that arrives mid-use must never cost the guest what they were in the middle of, so it waits while a
`Sheet` is mounted.

## What exists

**`src/main.tsx`** (14 lines, read in full). The entry: three stylesheet imports (lines 3 to 5), two
side-effect module imports (`./state/sync` at line 6, `./ui/avatarSpring` at line 7), then
`createRoot(...).render(<StrictMode><App /></StrictMode>)` at lines 10 to 14. Nothing here mentions
the service worker. Reuse: the file's shape, and the comment habit of saying why a side-effect import
is there.

**`src/vite-env.d.ts`** (10 lines, read in full). Line 1 is `/// <reference types="vite/client" />`;
lines 3 to 6 declare `ImportMetaEnv` with the two Supabase variables and lines 8 to 10 declare
`ImportMeta`. Reuse: line 1 is the pattern the new reference line copies. Note `tsconfig.app.json`
sets `"types": ["vite/client"]`, which governs *automatic* type inclusion only; an explicit
triple-slash reference in an included file is still resolved, so the new line works without editing
`tsconfig.app.json`.

**`node_modules/vite-plugin-pwa/client.d.ts`** (6 lines, read in full). It is six imports of the
per-framework declaration files. The one that matters is `vanillajs.d.ts`, which is
`declare module 'virtual:pwa-register'` exporting `registerSW(options?: RegisterSWOptions)`. The
others declare `virtual:pwa-register/vue` and friends; each carries its own `@ts-ignore` on the
framework import (`vue.d.ts` line 4), and `tsconfig.app.json` sets `skipLibCheck: true` in any case,
so referencing `client` rather than `vanillajs` costs nothing. `client` is what the plugin documents,
so that is what goes in.

**`src/ui/Sheet.tsx`** (233 lines, read in full). Line 10 holds the module-level stack,
`const openSheets: symbol[] = []`, with the comment explaining that registration is mount-only.
Lines 21 to 40 are `lockBody()` / `unlockBody()`. The mount effect is lines 65 to 82: a symbol is
pushed at line 67, `if (openSheets.length === 1) lockBody()` at line 68, Escape is bound at 69 to
72, the dialog is focused at line 75, and the cleanup at lines 76 to 81 splices the symbol out at 77
and calls `if (!openSheets.length) unlockBody()` at 78. The drag-to-dismiss effect is lines 91 to
215. The portal is lines 217 to 232: `.sheet-x` (the close button) at 225, `.sheet-scroll` at 226.
Reuse: the first-open / last-close pair at lines 68 and 78 is exactly the signal this workstream
needs, and the new dispatches sit on those two existing conditions rather than adding a third. Line
130, `try { sheet.setPointerCapture(id) } catch { }`, is the house habit the new registration copies:
a nicety that must never throw into the app.

**`vite.config.ts`** (47 lines, read in full). `VitePWA` at lines 14 to 45: `registerType:
'autoUpdate'` (line 15), the manifest (17 to 32), the workbox block (33 to 43) with `globPatterns`,
`navigateFallback: 'index.html'`, `navigateFallbackDenylist: [/^\/api\//]` and
`cleanupOutdatedCaches: true`, and `devOptions: { enabled: false }` (line 44). Unchanged by this
workstream. Three consequences of what is already set:

- `injectRegister` is left at its default `'auto'`, and with `registerType: 'autoUpdate'` the plugin
  forces `workbox.skipWaiting = true` and `workbox.clientsClaim = true`
  (`node_modules/vite-plugin-pwa/dist/index.js`, lines 874 to 876, inside the options resolver, which
  runs at `configResolved` and therefore before either place that later clears `injectRegister`). So
  a new worker already installs, activates and claims the page without being asked. Only the reload
  is missing. The built `dist/sw.js` confirms it: `self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([...])`.
- Importing the virtual module is what stops the injection, in two places, both real:
  `dist/index.js` lines 388 to 392 (`BuildPlugin`'s `transformIndexHtml`, `enforce: 'post'`) turns
  `injectRegister: 'auto'` into `null` when `useImportRegister` is set, so no tag is written into the
  HTML; `dist/index.js` lines 253 to 254 turn it into `false` in `generateBundle`, so the
  `registerSW.js` asset is never emitted (the emit at line 255 only fires for `'script'` or
  `'script-defer'`). `ctx.useImportRegister` is set to `true` in the plugin's `load` hook for
  `virtual:pwa-register` (line 1019). Either hook may run first; both orders end with no injection.
- `devOptions.enabled` is `false`, so in `vite dev` the virtual module resolves to the dev stub. The
  `load` hook (`dist/index.js`, lines 1013 onward) takes the `build` branch only when
  `command === 'serve' && devOptions.enabled`; otherwise it generates from
  `client/dev/register.js`, which is `function registerSW(_options = {}) { return async (_reloadPage = true) => {} }`
  and nothing else. Importing `registerSW` therefore changes nothing on port 5173, and the screenshot
  loop is unaffected.

**`node_modules/vite-plugin-pwa/dist/client/build/register.js`** (99 lines, read in full). This is
the module `virtual:pwa-register` resolves to in a build, with `__SW_AUTO_UPDATE__` replaced by
`"true"` (`dist/index.js`, lines 165 to 169, `generateRegisterSW2`), so `auto === true` at line 4.
**When the autoUpdate client reloads, exactly:** lines 39 to 47 (line 38 is `if (!autoDestroy) {`),

```js
if (auto) {
  wb.addEventListener("activated", (event) => {
    if (event.isUpdate || event.isExternal) {
      if (onNeedReload) onNeedReload();
      else window.location.reload();
    }
  });
```

That is workbox-window's **`activated`** event, gated on `isUpdate || isExternal`, and
`window.location.reload()` runs **only when `onNeedReload` is not supplied**. The brief's
verification line says the client reloads "on `controlling` with `isUpdate`"; that is the other
branch. `controlling` with `event.isUpdate` (lines 57 to 64) sits inside `showSkipWaitingPrompt`,
which is only reachable in the `else` of `if (auto)`, that is under `registerType: 'prompt'`. It
never runs in this app. The brief's mechanism is otherwise right, and the correction does not change
what A builds; it changes which event the implementer must reason about.

Also in that file: line 84, `wb.register({ immediate })`, with `immediate` defaulting to `false`
(line 8), so registration waits for the window `load` event. That is the same timing as the injected
`registerSW.js` this replaces. The emitted file is one line and is sitting in the current `dist/`:

```js
if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/sw.js', { scope: '/' })})}
```

So `immediate` is not passed and first paint is unchanged. That one line is also the whole of what
every phone with the app installed is running today, which is why the deploy that ships A is still
stale once (see Behaviour).

Line 27 of `register.js` is `await import("workbox-window")`. That dynamic import is new work for the
app bundle: `workbox-window` is a direct dependency of `vite-plugin-pwa` (its `package.json`
`dependencies`) and is present at `node_modules/workbox-window/`, hoisted, so it resolves. It will
appear as one more chunk under `dist/assets/`, which `globPatterns: ['**/*.{js,css,html,svg,png,woff2}']`
precaches. Verification step 2 checks that rather than guessing the chunk's name.

**`node_modules/vite-plugin-pwa/types/index.d.ts`** (read in full to line 20). `RegisterSWOptions.onNeedReload`
at line 9, documented at lines 3 to 8 as "Called when the service worker has taken control and the
page would normally reload. Useful to fully control the reload flow (for example, to defer reload
until the next SPA navigation)." Supplying it is the supported way to take the reload over, not a
trick.

**`node_modules/workbox-core/clientsClaim.js`** (18 lines, read in full). Line 16 is the whole of it:
`self.addEventListener('activate', () => self.clients.claim());`, with **no** `event.waitUntil`. So
`controllerchange` firing before workbox-window's `activated` is what happens in practice, not
something the specification guarantees. The guard below arms from both events for that reason, and
the code comment must say "in practice", not "so".

**`tools/qa/offline.mjs`** (31 lines, read in full). Loads a base twice (install, then let the worker
control), prints the worker state, cuts the network with
`Network.emulateNetworkConditions { offline: true }`, reloads and screenshots. Takes the base as
`argv[2]`, defaulting to the live site. Reuse as is: it is the regression gate that the precache
still serves the shell after the registration route changes.

**`tools/qa/cdp.mjs`** (81 lines, read in full). `launch({width,height})` returns `{ user, send, close }`;
a user gives `goto`, `eval` (with `awaitPromise`), `shot(label)`, `url()`, `sleep`, `logs` and
`sessionId`. Each `user()` is an isolated browser context with its own storage. `eval` **throws** on
a page exception and the underlying CDP call rejects if the document is navigating, which matters for
a script whose whole point is to provoke a reload: every poll tick is wrapped. Output goes to `OUT`
(`tools/qa/shots/`, or `SHOTS_DIR`). This is what the new QA script is built on; it adds no
dependency.

**Siblings for the signal.** `src/state/sync.ts` line 134 dispatches
`window.dispatchEvent(new CustomEvent('crew:added', { detail: { name } }))`, and `src/app/Shell.tsx`
lines 11 to 22 listens for it (the listener is added at line 18). A plain window event between two
modules that must not import each other is already the house pattern; the sheet signal copies it,
without a `detail` because it carries nothing. Grep confirms `sheet:open`, `sheet:closed`,
`controllerchange`, `registerSW` and `virtual:pwa` appear nowhere in `src/` or `index.html` today, so
neither name collides.

**What "a half-filled sheet" means, concretely.** `src/features/drinks/DrinkSheet.tsx` lines 163 to
181 write notes and comment into the persisted store on every keystroke (`onChange` calls `setNotes`
and `setComment` directly), so a reload there costs the open sheet and the caret, not the text.
`src/features/drinks/AddSheet.tsx` lines 13 to 18 hold the whole form (`name`, `venue`, `category`,
`spirits`, `ingredients`, `price`) in component `useState`; `submit` is declared at line 20 and is the
only thing that commits, at line 44 (`addCustom(drink)`). That form, and `AddCrewSheet`'s in-flight
search, are what a reload would actually destroy. The verification below uses `AddSheet` for that
reason.

**`.oxlintrc.json`** sets `react/only-export-components` to `["warn", { "allowConstantExport": true }]`.
Exporting a non-component helper such as `sheetsOpen()` from `Sheet.tsx` would raise a twenty-ninth
warning against the twenty-eight `CLAUDE.md` records as known. `npm run lint` on the baseline was run
for this spec and prints exactly 28 warnings and 0 errors, so `CLAUDE.md` is right and `STATE.md`'s
"4 known warnings" line is stale. The window-event signal avoids the extra warning, which is the
deciding reason for that shape.

**`src/state/store.ts`** lines 349, 350 and 396: persist `name: 'spcc2'`, `version: 8`, `partialize`.
Read to confirm this workstream leaves them alone, and to know what a reload throws away: `partialize`
keeps `me`, `custom`, `friends`, `profile`, `cruiseId`, `enteredCruise`, `groups`, `pendingInvites`,
`pendingUnfriends` and `seenMedals`, and deliberately drops `filters` and `showFilters` ("UI
resets each session"). That is the honest cost of a reload and it is written into Behaviour.

**`src/features/home/Home.tsx`** lines 125 to 146: the "new medal" moment is spent in the effect's
**cleanup**, on a `setTimeout(..., 0)` scheduled when Home unmounts. A full-page reload never runs a
React cleanup, so `markMedalsSeen` does not fire and the moment replays after the reload rather than
vanishing. Read only to state that; nothing here changes.

## Design placement

Nothing renders. No screen changes, no module joins or leaves a rank order, no primitive is minted
or restyled, no state colour is used. The registry in `docs/DESIGN.md` is unchanged and needs no new
row.

That is the design decision, not an absence of one. The alternative shape for this feature is an
"update available, tap to reload" banner or chip, which would be a new element on every screen, a
second thing competing with the one coral action, and, in the form it is usually drawn, banned tell
one (a pill with a status dot). The brief already chose `autoUpdate` over `prompt`; a page that
quietly becomes current is the Calm and Honest reading of that choice, and the guest is never asked
a question they have no way to answer. No toast, no chip, no version string anywhere: `DESIGN.md`
Copy says no version, no "beta".

The one thing the guest can see is the reload itself, and it is placed by borrowing an existing
rule rather than inventing one. `Sheet.tsx` already holds a global truth about "the page must not
move now" (`lockBody` / `unlockBody`, lines 21 to 40, first open and last close at lines 68 and 78).
The reload guard hangs off exactly that condition: while the body is locked because a sheet is open,
the page does not reload either. The sibling for the cross-module signal is `crew:added`
(`sync.ts` line 134 to `Shell.tsx` line 18).

After the reload the guest is on the same URL and the same route, with the store rehydrated from
`spcc2`, so the visible difference is that Home's count-up and the sea's first paint run again
(`docs/DESIGN.md`, Motion: the hero count-up on first paint). That is one of the four authored
moments replaying, not a fifth motion.

## Behaviour

There is no user-facing copy in this workstream. No string is added, changed or removed anywhere in
`src/`, and nothing is announced to a screen reader. The states below are states of the page, and
the "what the guest sees" column is the whole of it.

**First open, ever (no worker yet).** The page loads from the network, `registerSW` registers on the
window `load` event, the worker installs and precaches, and `clients.claim()` claims this page.
`controllerchange` fires with no previous controller. The guard does nothing: the shell on screen is
already the build that was just installed, and reloading it would be a flash for no reason. This is
the case the `hadController` gate exists for. It then treats the page as controlled, so a deploy
that lands while this same guest keeps the app open is still caught, which matters on 3 October when
half the crowd installs the app for the first time and a fix goes out the same day.

**Returning open, no deploy since.** `registerSW` calls `navigator.serviceWorker.register` for a
scope that already has a worker, which is itself an update check; the browser re-fetches `sw.js`,
finds it byte-identical, and stops. No new worker, no `activated`, no `controllerchange`, no reload.
The guard costs three listeners and nothing else.

**Returning open, a deploy since (the case this exists for).** The old worker serves the old shell
instantly, so the app is usable straight away. In the background that same registration call
re-fetches `sw.js`, the browser finds it changed, the new worker installs and precaches the whole
shell (see Purpose on how long that can take), `skipWaiting()` activates it and `clientsClaim()`
takes this page over. `controllerchange` fires, the guard is armed, and, with no sheet mounted, the
page reloads. The reloaded navigation is served out of the new worker's precache, so it is fast and
works with no signal at all, at the same URL and the same route.

What the guest keeps across that reload is what `partialize` persists: the passport, custom drinks,
crew, groups, profile and `seenMedals`. What the reload costs, stated rather than glossed:
`filters` and `showFilters` (excluded from `partialize` by design, so an open filter panel and any
chosen filters clear), scroll position beyond the browser's own restoration, focus and the soft
keyboard, anything typed into the Drinks search field, and the guest's position inside Wrapped, which
is a route rather than a sheet and so is not held. None of that is data; all of it is a few seconds
of work. The medal moment is the one thing that survives by accident and in the right direction: it
is spent in a React cleanup (`Home.tsx` lines 133 to 146) that a reload never runs, so it replays.

**Returning open with a sheet mounted.** Identical up to the point of arming, then the reload is
held. The sheet stays exactly as it was: `AddSheet`'s half-typed form, `AddCrewSheet`'s search, the
drink sheet's notes field with the caret in it. When the last sheet closes, `sheet:closed` fires and
the reload runs then. If the guest never closes the sheet, the reload never happens in this page
session, which is correct: killing the app and reopening it lands on the new build anyway.

**One sheet replaced by another.** Closing one sheet to open a second empties and refills
`openSheets` inside a single React commit, so `sheet:closed` and `sheet:open` both fire before the
browser yields. The release is therefore scheduled one task later rather than run inline, and by the
time it runs `sheetOpen` is true again and it bails. The same mechanism covers `StrictMode`'s
open, closed, open in dev.

**A second tab or window updates first (`isExternal`).** The other tab's worker claims this page
too, so `controllerchange` fires here as well and this page reloads under the same rules.

**A page that is uncontrolled at load.** A hard reload (Ctrl+Shift+R, or DevTools "bypass for
network") loads the document without the service worker, so `navigator.serviceWorker.controller` is
null and `hadController` starts false even though a worker is installed. The next deploy's
`clients.claim()` is then read as a first install and swallowed once; the open after that behaves
normally. Rare, developer-only in practice, and accepted rather than worked around: distinguishing it
would need a `sessionStorage` key, which buys nothing for a guest at a bar.

**Offline.** No update can be found, so nothing arms and nothing reloads. `sw.js` is only re-fetched
when there is a network to fetch it from, and the precache keeps serving the build already installed.
This is the state `tools/qa/offline.mjs` proves is intact.

**The deploy that ships A itself.** Every phone that already has the app is running the old injected
`registerSW.js`, quoted in full above, which has no reload in it. When A is deployed, that old client
will install and activate the new worker and claim the page, but the code on screen has no listener,
so it does nothing. That first open still shows the previous build, once, on every existing install.
The following open is the new build, and from that build onwards every deploy is caught. Do not read
that one stale open as A having failed.

**Deviation from the brief, stated plainly.** The brief says to "defer to the next route change or
visibility change". This spec releases the held reload on one signal, the last sheet closing, and
here is why. The only thing that ever holds the reload is a mounted sheet, so the only event that
can release it is that sheet going away. A route change while a sheet is open unmounts the sheet and
therefore fires `sheet:closed` anyway, so a route listener would be a second path to the same event.
A `visibilitychange` release would either fire when nothing is held, which is dead code, or fire with
a sheet still open, which drops the half-filled form this workstream exists to protect. The narrower
signal is the same intent with one less moving part, and it is named in Open questions as the second
thing Charles is told rather than asked.

**Taps.** None. No control is added, so nothing responds to a tap that did not before.

## Data and state

- **Store fields:** none added, renamed or removed.
- **Persist version:** unchanged, `version: 8` in `src/state/store.ts` line 350. No `migrate` step,
  because there is no shape change, and therefore no migration that could lose an existing user's
  data: every passport on a phone today rehydrates through the same path it does now. (Workstream B
  bumps the version; A must not, or B's migration lands on the wrong number.)
- **`partialize`:** unchanged (line 396). Its exclusions are what a reload costs; see Behaviour.
- **`localStorage` keys:** none added. `spcc2` is read and written exactly as it is today, and the
  reload is what makes it worth having: the page is thrown away and the passport is not.
- **`sessionStorage`:** none. Loop protection is the module-level `reloading` flag plus the fact that
  a worker that has already activated does not activate again, so no key is needed across documents.
- **New runtime state**, all module-local to `src/main.tsx` and none of it persisted:
  `hadController` (seeded at module load, before registration, and flipped true by the first
  controller this page ever gets), `armed`, `sheetOpen`, `reloading`.
- **New window events**, the only new contract between modules:
  `sheet:open` and `sheet:closed`, dispatched by `src/ui/Sheet.tsx` when the stack becomes non-empty
  and when it empties. No `detail`. They are plain `Event`s, not `CustomEvent`s, because there is
  nothing to carry.

## Backend

None. No RPC, no table, no row-level-security implication, no change to `supabase/config.toml`, no
migration. The service worker and the precache are static hosting concerns; the reload does not
touch the network beyond what the worker already does.

## Implementation steps

Each step is one commit.

0. **Baseline shots first, before any edit.** With the dev server already running on 5173:

   ```bash
   SHOTS_DIR=shots-a-before node tools/qa/shot.mjs a-home "home?nosync"
   SHOTS_DIR=shots-a-before node tools/qa/shot.mjs a-add-sheet "drinks?nosync" --click ".dtoolbar button" --after 3000
   ```

   These are the reference for verification step 6. Without them "identical to before" cannot be
   checked. `tools/qa/shots-a-before/` is already gitignored by the `tools/qa/shots*/` rule. The
   `?nosync` is the brief's last rule: `shot.mjs` appends `?seed` itself and a run against the live
   backend signs in an anonymous user, so the route carries `nosync` through (`shot.mjs` turns
   `home?nosync` into `/?nosync&seed` and `drinks?nosync` into `/drinks?nosync&seed`).

1. **`src/vite-env.d.ts`: declare the virtual module.** Add
   `/// <reference types="vite-plugin-pwa/client" />` immediately under the existing
   `/// <reference types="vite/client" />` on line 1. Nothing else in the file moves. Check with
   `npx tsc -p tsconfig.app.json --noEmit` before and after; it must stay clean.

2. **`src/ui/Sheet.tsx`: the mounted-sheet signal.** In the mount effect (lines 65 to 82), on the two
   conditions that already exist:

   ```ts
   if (openSheets.length === 1) { lockBody(); window.dispatchEvent(new Event('sheet:open')) }
   ```

   at line 68, and in the cleanup at line 78:

   ```ts
   if (!openSheets.length) { unlockBody(); window.dispatchEvent(new Event('sheet:closed')) }
   ```

   Nothing else in the file changes: no new export (which would raise a
   `react/only-export-components` warning against a file that exports a component), no new effect, no
   change to the Escape stack or to either drag effect. Add one comment line above the mount effect
   saying what the two events are for and who listens (`src/main.tsx`, the update reload). Stacked
   sheets are already correct without a third condition: opening the scanner over the add sheet takes
   the stack 1 to 2 and closing it 2 to 1, and neither crosses the boundary. `StrictMode`'s dev
   double-mount fires open, closed, open, and the listener in `main.tsx` handles that with the same
   deferral it uses for a sheet swap, so nothing is needed here.

3. **`src/main.tsx`: register the worker and own the reload.** Add
   `import { registerSW } from 'virtual:pwa-register'` after the `react-dom/client` import, then a
   `startUpdates()` function above the render, **called after** `createRoot(...).render(...)` and
   wrapped in `try`/`catch`. It must not be exported and must not be assigned to an unused variable
   (`noUnusedLocals` is on). The comment block carries the facts an implementer would otherwise have
   to rediscover: which event the plugin's autoUpdate client reloads on, why `onNeedReload` is
   supplied, why the reload waits for control rather than running at activation, and why the call
   sits below the render.

   ```tsx
   // ── The build the guest is looking at ─────────────────────────────────────────────────────────
   // autoUpdate already installs a deploy in the background: vite-plugin-pwa sets skipWaiting and
   // clientsClaim for registerType 'autoUpdate' (dist/index.js, lines 874 to 876). What was missing
   // is the reload, so the page kept running the shell it loaded and the first open after a deploy
   // showed the previous build until the app was killed.
   //
   // The plugin's own client would reload for us: in dist/client/build/register.js, lines 39 to 47,
   // the autoUpdate branch listens for workbox's 'activated' and calls window.location.reload() when
   // event.isUpdate or event.isExternal, unless onNeedReload is supplied. ('controlling' with
   // isUpdate, lines 57 to 64, is the prompt branch and never runs here.) Supplying onNeedReload is
   // the documented way to take the reload over (vite-plugin-pwa/types/index.d.ts, line 9).
   //
   // We take it because a reload while a sheet is open destroys what is half-filled in it: AddSheet's
   // form is component state, not the store. And because reloading once the new worker controls this
   // page is served out of its precache, where reloading at activation can fall through to the
   // network, which on a ship is a white screen. clientsClaim() is a bare activate listener with no
   // waitUntil (workbox-core/clientsClaim.js, line 16), so in practice controllerchange arrives
   // first; we arm from both and reload once.
   // Not a const: a page that installed the worker itself has no controller at load, and must still
   // catch the deploy that lands while it stays open. The first controllerchange is that install
   // claiming the page, and the shell on screen is already what it just installed; from then on a
   // change of controller is an update.
   let hadController = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)

   function startUpdates() {
     if (!('serviceWorker' in navigator)) return
     let armed = false      // a new worker has taken this page over
     let sheetOpen = false  // a Sheet is mounted: hold, whatever else happens
     let reloading = false

     const reload = () => {
       if (!armed || sheetOpen || reloading) return
       reloading = true
       window.location.reload()
     }

     navigator.serviceWorker.addEventListener('controllerchange', () => {
       if (!hadController) { hadController = true; return }   // the first install claiming this page
       armed = true
       reload()
     })
     window.addEventListener('sheet:open', () => { sheetOpen = true })
     window.addEventListener('sheet:closed', () => {
       sheetOpen = false
       // One task later, not inline: closing one sheet to open another empties and refills the stack
       // inside a single React commit, so the next sheet's 'sheet:open' has already run by the time
       // this fires and reload() bails. Same reason it is safe under StrictMode's open/closed/open.
       window.setTimeout(reload, 0)
     })

     registerSW({
       // Registration timing is unchanged: immediate defaults to false, so this still registers on
       // the window load event, exactly as the injected registerSW.js did.
       onNeedReload() { if (hadController) { armed = true; reload() } },
     })
   }

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <App />
     </StrictMode>,
   )

   // Below the render on purpose: an update that cannot arm is a stale build, a throw above the
   // render is a white screen. Nothing is lost by the order. render() returns before React commits,
   // so these listeners are attached before any Sheet can mount, and registerSW waits for the window
   // load event, so no worker can claim the page before this line has run.
   try { startUpdates() } catch { /* the app matters more than the update */ }
   ```

4. **`tools/qa/update.mjs`: the simulated-update harness.** New zero-dependency script, built on
   `./cdp.mjs`, specified in full under Verification. It takes two built trees, serves one, installs
   it, swaps to the other and asserts what the page does without ever being navigated again.

5. **`tools/qa/README.md`: one table row for `update.mjs`**, placed after the `gestures.mjs` row and
   in the same voice as the rows around it:

   > | `update.mjs` | The simulated deploy: copies `dist/` into two trees, renames the shell chunk in the second, serves one on `127.0.0.1:4180` and swaps to the other without navigating the page. Asserts that the page reloads itself onto the new shell, and that it holds that reload while a sheet is open with the form intact. Needs `npm run build` first. Prints PASS/FAIL per case and exits 1 on any failure. Run it after touching `src/main.tsx` or the PWA options in `vite.config.ts`. |

6. **`CLAUDE.md`: two sentences merged in, nothing rewritten.** Append to the existing **Deploy**
   bullet under Operating notes, in place, leaving every word already there:

   > A page that is open when a deploy lands now reloads itself once the new worker takes control, so
   > the first open after a deploy is the current build (`src/main.tsx`, `startUpdates`). The reload
   > is held while a sheet is open and runs when the last one closes, so a half-typed "Add a missing
   > drink" form is never dropped; `tools/qa/update.mjs` is the check.

## Verification

One dev server on 5173 only if one is already running; none of these commands start a second. Step 3
starts `vite preview` on 4173 and step 5 starts a plain `node:http` server on 4180, neither of which
touches 5173.

**1. Types and lint.**

```bash
npx tsc -p tsconfig.app.json --noEmit     # no output, exit 0
npm run lint                              # 0 errors; the warning count must still read 28
npm run design:check                      # must print exactly: design:check: 31 files, clean
```

The 28 was confirmed against the baseline while this spec was written; `STATE.md`'s "4 known
warnings" is stale, so trust `CLAUDE.md` and this line. `design:check` prints a count and the word
`clean`, not "no suspects"; no CSS changes here, so it is a pure regression check.

**2. The registration route actually changed.**

```bash
npm run build                             # exit 0
grep -c registerSW dist/index.html || true   # must print 0. grep exits 1 when the count is 0, so
                                             # the || true is there to stop that reading as a failure
test ! -e dist/registerSW.js && echo "registerSW.js not emitted"
grep -c registerSW dist/sw.js || true        # must print 0: the precache manifest no longer lists it
node -e "const s=require('fs').readFileSync('dist/sw.js','utf8'); console.log('skipWaiting', /self\.skipWaiting\(\)/.test(s), 'clientsClaim', /clientsClaim\(\)/.test(s))"
# must print: skipWaiting true clientsClaim true
node -e "const fs=require('fs'); const s=fs.readFileSync('dist/sw.js','utf8'); const urls=new Set([...s.matchAll(/url:\"([^\"]+)\"/g)].map(m=>m[1])); const js=fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')); console.log(js.length, 'chunks,', js.filter(f=>urls.has('assets/'+f)).length, 'precached'); console.log(js.filter(f=>!urls.has('assets/'+f)))"
# the two numbers must be equal and the trailing array must be empty
```

`dist/registerSW.js` is not merely unreferenced but never emitted: the two hooks named under What
exists (`dist/index.js` lines 388 to 392, and 253 to 254) both clear `injectRegister` once the
virtual module has been loaded, and the asset is only emitted for `'script'` or `'script-defer'`.
The chunk count in the last command was 4 on the baseline (`ScanSheet`, `Medallion`, the entry
`index-*`, and `dist-*`) and is expected to be 5 after the change, because `register.js` line 27 does
`await import("workbox-window")`. If the bundler inlines it instead the count stays 4, which is also
fine. What must hold is that the trailing array is empty: every `assets/*.js` on disk is in the
precache manifest, so the app is still whole offline.

**3. Offline still works against a preview build.** In one terminal `npm run preview` (Vite's own
port 4173, not 5173), then:

```bash
node tools/qa/offline.mjs http://127.0.0.1:4173
```

Must print `worker before the cut: {"controller":true,"hasReg":true,"active":true}` and an
`offline render:` line whose `title` is `Sun Princess Cocktail Passport` and whose `bodyLen` is in
the hundreds, not `0`. It writes `tools/qa/shots/offline-reload-full.png`; open it and confirm it is
the app, not a browser error page.

**4. The gesture contract, because `src/ui/Sheet.tsx` was touched.** With the dev server on 5173:

```bash
node tools/qa/gestures.mjs
```

Every case must print `PASS` and the script must exit 0. `CLAUDE.md` and `tools/qa/README.md` both
require this after any change to `Sheet.tsx`. The two dispatched events are inside the mount effect
rather than either drag effect, so nothing here is expected to move; run it anyway.

**5. The simulated update: `node tools/qa/update.mjs`.** This is the verification the brief asks for,
and it is a script rather than a unit test because there is no test runner in this repo (no `vitest`,
no `test` script, no `*.test.ts` anywhere) and because what has to be proved, a service worker taking
over a live page, is not reachable from a unit test. Adding a test runner is a larger change than
the feature; workstream C is where pure functions with tests actually pay, and it is C's call.

Two full builds are needed, and the script makes the second one itself so no source file is edited
and reverted. Run `npm run build` first, on the branch with the change, or case 1 tests the wrong
code.

```
npm run build
node tools/qa/update.mjs
```

It does the following, in order, and fails loudly with a named reason at every assertion.

1. **Prepare the two trees.** Requires `dist/` to exist (print `run npm run build first` and exit 1
   if it does not). `fs.rmSync(root, { recursive: true, force: true })` on
   `tools/qa/shots-update/`, then `fs.cpSync` copies `dist` to `tools/qa/shots-update/a` and to
   `tools/qa/shots-update/b`, both `{ recursive: true }`. A stale tree from a previous run must never
   be reused. That parent path is chosen because `.gitignore` already carries `tools/qa/shots*/`, so
   no new ignore rule is needed.

2. **Make `b` a genuinely different build.** Two edits, both asserted.

   *The shell chunk.* Match `b/index.html` against `/\/assets\/(index-[A-Za-z0-9_-]+\.js)/`; if there
   is no match, print the first `<script type="module">` tag found and exit 1. Rename
   `b/assets/<old>` to `b/assets/index-BBBBBBBB.js`, then `replaceAll(old, new)` in `b/index.html`
   and in `b/sw.js`. On the current build the old name occurs **exactly once** in each file, so
   assert exactly one replacement in each and exit 1 on any other count rather than proceeding with a
   half-renamed tree. (The shell is in the precache manifest as
   `{url:"assets/index-<hash>.js",revision:null}`, which is why its URL carries the hash and why
   renaming it is enough to change the manifest.)

   *The `index.html` precache revision.* Without this the new worker decides `index.html` is
   unchanged, copies the old cache entry forward and serves a shell pointing at a file that no longer
   exists. The built `sw.js` is minified JavaScript, **not** JSON: the entry today reads
   `{url:"index.html",revision:"7601b76511f0c61026149a12e0a08338"}`, with unquoted keys and `url`
   first. Match with one alternation that tolerates either key style and either field order:

   ```js
   const REV = /\{(?:"?url"?:"\/?index\.html","?revision"?:"([0-9a-f]{32})"|"?revision"?:"([0-9a-f]{32})","?url"?:"\/?index\.html")\}/
   ```

   Take the first match. The alternation has two capture groups, one per branch, so the captured run
   is `m[1] ?? m[2]`, whichever branch matched; do not assume `m[1]`. Replace that 32-hex run with
   `'b'.repeat(32)` **inside the matched substring only**, and splice that back into `b/sw.js` at the
   match index. If `REV` does not match, print 240 characters of `b/sw.js`
   either side of the first occurrence of `index.html` and exit 1 rather than guessing. Finally
   assert `b/sw.js !== a/sw.js`, because a worker whose bytes are identical is never treated as an
   update and the whole run would silently pass nothing.

3. **Serve.** A `node:http` server on `127.0.0.1:4180` (not 5173, not 4173) reading from a mutable
   `current` directory on every request, so the swap needs no restart. `127.0.0.1` is a secure
   context, so service workers register. **Resolve `new URL(req.url, 'http://x').pathname` only, and
   drop the query**: workbox-precaching fetches revisioned entries as
   `index.html?__WB_REVISION__=<hash>`, and a server that resolves `req.url` verbatim 404s every one
   of them, so the new worker never finishes installing and the run times out with no useful reason.
   Resolve that pathname under `current`, reject any `..`, and fall back to `index.html` for any path
   that does not exist on disk, because case 2 loads `/drinks` before any worker exists and would
   otherwise 404. Send `Cache-Control: no-store` on everything, so the swapped `sw.js` is genuinely
   re-fetched. MIME map: `.html` `text/html`, `.js` `text/javascript`, `.css` `text/css`, `.json`
   `application/json`, `.webmanifest` `application/manifest+json`, `.svg` `image/svg+xml`, `.png`
   `image/png`, `.woff2` `font/woff2`, `.ico` `image/x-icon`.

4. **The shell probe, used by both cases.** One helper, because the page it reads may be navigating:

   ```js
   const shell = async (u) => { try { return await u.eval("document.querySelector('script[type=module][src]')?.src || ''") } catch { return '' } }
   ```

   `[src]` matters: `index.html` carries an inline classic `<script>` (the `?seed` block) at line 36
   and the module entry at line 93, and only the entry has a `src`. The `try` matters because
   `cdp.mjs`'s `eval` throws on a page exception and the CDP call rejects mid-navigation, which is
   precisely what this script provokes; a poll tick that cannot read must return empty and be retried,
   not abort the run.

5. **Case 1, no sheet open.** `launch({ width: 390, height: 844 })`, `chrome.user('update')`, then
   `goto('http://127.0.0.1:4180/?seed&nosync')`, `sleep(3000)` (registration is on `load`, then the
   install), `goto` the same URL again, `sleep(2000)`. Assert `navigator.serviceWorker.controller` is
   truthy and that `shell(u)` contains the `a` chunk name. Set `current = b`. Evaluate
   `navigator.serviceWorker.getRegistration().then(r => r ? r.update() : Promise.reject(new Error('no registration'))).then(() => 'ok')`,
   which is what the browser itself does on a navigation, and is the only thing the script does after
   the swap: from here it never navigates or reloads, so any change it sees came from the app. Poll
   `shell(u)` every 500ms for up to 30 seconds (the precache is 1.7 MiB and installs before
   activation). It must become `index-BBBBBBBB.js`. Print
   `PASS  no sheet: reloaded itself onto the new shell in <n>ms`.

6. **Case 2, a sheet open.** Reset `current = a`, take a fresh isolated context
   (`chrome.user('update-sheet')`, its own storage, so it installs `a` from scratch), and
   `goto('http://127.0.0.1:4180/drinks?seed&nosync')` twice with the same waits. Assert controller
   and the `a` chunk. Open the add sheet: `document.querySelector('.dtoolbar button').click()`
   (`src/features/drinks/Drinks.tsx` line 89, the "Add a missing drink" `GlassButton`; `.dtoolbar`
   opens at line 85 and holds only the count line and that button), `sleep(800)`, assert
   `document.querySelector('.sheet')` is present. Then **focus `#add-name` explicitly** before typing:
   the field carries `autoFocus`, but `Sheet.tsx` line 75 calls `sheetRef.current?.focus()` in its own
   mount effect, so focus ends on the dialog element and not on the input. Do not simplify this away
   or the field stays empty and the case proves nothing. Send
   `chrome.send('Emulation.setFocusEmulationEnabled', { enabled: true }, u.sessionId)` first: case 1's
   target is still alive, so this context's page is not the focused one, and without focus emulation
   `element.focus()` can leave `activeElement` where it was and `Input.insertText` types into nothing.
   Nothing in `tools/qa/` types today (`gestures.mjs` is touch only), so this is the harness's first
   use of it. Type with
   `chrome.send('Input.insertText', { text: 'Test negroni' }, u.sessionId)`, which React sees as a
   real input event, and assert `document.querySelector('#add-name').value === 'Test negroni'` before
   going further. Set `current = b` and call `registration.update()` as above. Wait 12 seconds, then
   assert all three of: `shell(u)` still contains the `a` chunk name, `.sheet` is still in the
   document, and `#add-name` still reads `Test negroni`. Screenshot as `update-held`. Print
   `PASS  sheet open: reload held, form intact`. Then `document.querySelector('.sheet-x').click()`
   (`Sheet.tsx` line 225) and poll `shell(u)` for up to 20 seconds; it must become
   `index-BBBBBBBB.js`. Screenshot as `update-after`. Print
   `PASS  sheet closed: reloaded onto the new shell in <n>ms`.

7. **Close.** `chrome.close()` and `server.close()` in a `finally`. Exit 1 if any assertion failed,
   printing `FAIL` and which one; exit 0 with three `PASS` lines otherwise.

**6. Screenshots.** Nothing renders, so there is no new screen to shoot and no new label to add to
`shots.mjs`. Two shots are taken to prove the app is undamaged, against the dev server already
running on 5173, at 390×844, and compared against the baseline pair from implementation step 0:

```bash
SHOTS_DIR=shots-a-after node tools/qa/shot.mjs a-home "home?nosync"
SHOTS_DIR=shots-a-after node tools/qa/shot.mjs a-add-sheet "drinks?nosync" --click ".dtoolbar button" --after 3000
```

Open `tools/qa/shots-a-before/a-home.png` beside `tools/qa/shots-a-after/a-home.png` and the same for
`a-add-sheet`, and check by eye: Home's rank order unchanged (greeting, hero, Today above the fold),
the sea hero's CSS fallback painting as before, the add sheet open over Drinks with its title, meta
line, focused Name field and the rest of the form, and the sheet's scrim and glass film unchanged.
Neither run may print `HORIZONTAL OVERFLOW`, and neither may print a `console:` line the before shots
did not already print. The two shots from `update.mjs` (`update-held`, `update-after`) are the
evidence for the guard itself.

## Files touched

Within the brief's contention map for A:

- `src/main.tsx` (map).
- `src/vite-env.d.ts` (map).
- `src/ui/Sheet.tsx` (map, "mounted-sheet signal").

Additions, each with its reason:

- `tools/qa/update.mjs`: the map allows "tests"; this repo has no test runner, and a service worker
  taking over a live page is not testable in one anyway, so the harness stands in for it. No other
  workstream writes `tools/qa/`.
- `tools/qa/README.md`: one table row, so the harness is findable by the next agent rather than
  living only in this spec. No other workstream writes it.
- `CLAUDE.md`: two sentences appended to the existing Deploy bullet, as the brief's rules require.
  A runs first and alone, so there is no writer contention on it.

Not touched, deliberately: `vite.config.ts` (the plugin options are already right),
`src/state/store.ts` (B owns the persist bump), `src/app/App.tsx` and `src/app/Shell.tsx` (B, and the
deviation above removes any reason to reach for `useLocation`), `.gitignore` (both new QA trees sit
under the existing `tools/qa/shots*/` rule), `tools/qa/shots.mjs` (nothing new renders), `STATE.md`
(Charles's file; its stale "4 known warnings" and its workstream-A gotcha line are for him).

## Out of scope

- **A periodic update check** for an app left open for days, and a check when a backgrounded PWA is
  resumed without a navigation. The browser checks `sw.js` when `registerSW` registers, which is
  every cold open, and on navigation; nothing here polls, and adding a timer or a `visibilitychange`
  probe is a separate decision.
- **A prompt, banner, toast or "what's new" note.** The brief chose `autoUpdate`; see Design
  placement.
- **Anything that renders**, including the landing and install work (workstream E).
- **Restoring scroll position, filters or the open sheet after a reload.** The browser's own scroll
  restoration is what ships; `filters` and `showFilters` are excluded from `partialize` by an existing
  decision this workstream does not reopen; the reload is deferred precisely so there is nothing to
  re-open.
- **The seed guard and the `main` push question** recorded in `STATE.md`; A ships on `product`.
- **`STATE.md`'s gotcha line**, "A phone or Brave showing an older design is not a failed deploy: it
  is workstream A", which stops being true one deploy after A merges. It is Charles's file to update
  when he merges, not this workstream's edit.
- **A test runner.** Named here so the next workstream does not assume A left one behind: workstream
  C is where pure functions with tests earn it.

## Open questions for Charles

None. Everything in this workstream is decided by the brief, by the installed plugin's source, or by
the design constitution, and none of it needs a dashboard, spends money, or is a taste call between
two defensible directions. Two things are worth telling him rather than asking him:

1. The deploy that ships A will still show the old build once on every phone that already has the app
   installed, because the client code doing the reload is the thing being deployed. From the open
   after that, it is fixed.
2. The brief says the held reload defers to "the next route change or visibility change"; this spec
   releases it on the last sheet closing instead, for the reasons in Behaviour. If he wants the wider
   signal anyway it is a small change, but it can only fire when nothing is held or drop the form it
   was meant to protect.
