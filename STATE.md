# STATE

Open work for the Cocktail Passport. One-line status lives in `E:\claude-projects\PROJECTS.md`;
agent context in `CLAUDE.md`; the reconciled checklist in `docs/PRODUCTIONISATION.md`; the product
architecture in `docs/specs/2026-09-10-product-brief.md`, one spec per workstream beside it.

## Where it stands (23 September 2026)

- **LIVE 23 September at `6f54560`** (deploy run 35797903930 green, shell `index-B8nC17Lm.js`), on
  Charles's "verify and push it" and "continue ... sexy up, declutter": the shaker second pass (a
  cobbler from his reference photograph, cap off, the drink's glass rising out of the neck), the
  declutter of every screen, polish item 1 (Delete my data asks for consent again), the sea as one
  long swell the liner rides, the glass a drink is served in leading every drink row (classified by
  Jev, ruled on by hand), a shaker glyph on Home's shake row, Crew's classes renamed so Brave's
  blocking no longer hides its heading, and the page declared light-only. Detail in the thread below.

- Charles ruled the fork: (b), a product for any sailing, and later "complete anything remaining".
  The whole any-sailing build is on branch `product`, done with workflows and subagents one
  workstream at a time (build, gate review, fix each).
- **All five workstreams are shipped on `product`, HEAD `91240ba`:** A (the first open after a
  deploy reloads onto the new build), C (optional Google sign-in and a tested restore merge), B
  (the first-open screen, the sync gate behind it, the masthead on Home, the privacy note), E (the
  desktop landing and install path at `/` and `/get`), BYO (a guest sets up their own sailing and
  venues and logs against them). 89 commits since `main`, 69 files, +9071/-306.
- All gates green on HEAD: `npm run lint` 28 warnings 0 errors, `tsc` clean, `design:check` 33 files
  clean, `npm test` 32/32, and `npm run build` exits 0 (PWA precache 16 entries).
- **LIVE.** On Charles's explicit go (17 September, "push and merge"), `main` was pushed at `8b2ca89`
  (seed guard, deploy green) and then fast-forwarded to `product` and pushed at `f1d9d92`; that deploy
  is green and cruise.charlesbee.org serves shell `index-PBbi6Q4N.js` carrying the entry screen,
  sign-in, landing and BYO. Further work goes on branch `shake` (the shaker feature) and merges to
  `main` when it ships. Every phone with the app installed shows the old build once more before
  the A-pass reload takes over (documented in workstream A).
- The **polish pass** (`docs/specs/2026-09-17-polish.md`): items 2 and 3 shipped 17 September
  (`91240ba`, detail below); item 1 changes what Delete my data means, so it waits for Charles's yes.
  Nothing else is buildable without him.
- **The shaker is LIVE with its lid revision** (18 September, on Charles's "push it"): `main`
  fast-forwarded to `33cbe50`, deploy run 35401254485 green, production serves shell
  `index-iwDlGEbk.js`. Probed on production with `tools/qa/shake-live.mjs` over `?seed&nosync`: no
  `.shaker-window` in the DOM, the reveal at lid -105° and drop -84px with the card at opacity 1 and
  the live line read, one sheet at Go get it, and the return from the drink sheet `is-open is-still`
  at the end values in every sample from 120ms to 1s with the live line empty. Branch `shake`
  equals `main`. One visual left for Charles: the drop's glyph (IconDrinks at 20px in the 44px
  disc, as the spec names) reads closer to a numeral 7 than to a glass; 24px is the offer.

## The five passes, for the record

- Phase 1 specs `wf_59cea1ba-a91`. A `wf_a90270f3-7d1` (`b42483a`..`7414857`, review pass).
  C `wf_d78557ca-8a2` (`dd1a9fa`..`9ff1563` + 4 fixes to `39676d1`; two blockers caught). B
  `wf_ad2def83-9b8` (`41f724e`..`3cc7f0f` + 2 fixes to `a6e0e17`; a false height figure caught).
  E build `wf_2a3dddfc-aa1` died on the Fable cap unreviewed with a lint regression; review+fix
  `wf_fade852e-771` (`ce1d64d`) put it right.
- BYO `wf_dc035ce5-972`: the reconcile stage wrote `docs/specs/2026-09-17-byo-reconcile.md`
  (`4f1e291`) and stopped on one hole (the returning sailing sheet had no opener once entered); I
  ruled it opens from a `.quiet-action` at the foot of Ship, edited the script, and resumed. Data
  and screens built (`a686d22`..`90cd5d1`); the review found one major (the multi-sailing entry
  branch scrolled 3 to 15px on a notched phone) and four minors, then the fix agent died on the
  spend cap. I applied the fix in the main loop 17 September: `c7f8a37` drops the doubled sailing
  field label so the multi branch is 669 of 738, clear of the notch floor at every size (single
  unchanged at 643), and corrects the stale DESIGN figure; `c128da0` routes the Drinks group
  heading through `deckLabel`. The other three minors need no code (the venue-sheet sweep DIFF is
  the sheet's backdrop sampling the Deck 15/16 change behind it; the DESIGN Ship-section sentence is
  rule-6 required; the commit count is four defensible extras). All re-verified green: tsc, lint
  28/0, design:check 33, tests 32/32, first-open, gestures 18/18, build.
- Attribution oddity, on record, not worth a history rewrite: E's eleven build commits and C's four
  fix commits and BYO's commits carry "Co-Authored-By: Claude Opus 5 (1M context)" (a non-existent
  model) plus a Fable or Opus line; cannot fix without amend/rebase (forbidden). Cosmetic, unpushed.

## Open threads

### QA harness leaks a Chrome profile per run (found 22 September, not fixed)

`tools/qa/cdp.mjs` makes `%TEMP%\cruise-qa-profile-<pid>-<ms>` on every launch and `close()` only
taskkills Chrome, so the profile stays. Each is about 1,160 files and 47 MB; on 22 September there
were 886 of them, about 40 GB. Their first appearance (3 September, 23:02) lines up with Windows
logon on this PC going from about 40 s to about 7 minutes (the User Profile Service step, which now
spends over five minutes of CPU on a per-file pass), and the growth follows each batch. Proposed fix, held for
Charles: in `close()`, wait for the Chrome process to exit, then `rmSync(profile, { recursive:
true, force: true })` with a few retries, as `design/tools/qa/cdp.mjs` already does; and sweep stale
`cruise-qa-profile-*` at launch so a crashed run cannot leak. Removing the existing 886 is his call.

### Polish pass: all three items done (item 1 live 23 September)

Spec `docs/specs/2026-09-17-polish.md`. Done in the main loop 17 September (`91240ba`): item 2, a
disabled `.btn` now drops its fill to a ghost (transparent, hairline, `--ink-2`) so it reads as
inactive next to the filled enabled buttons, measured `rgba(0,0,0,0)` against `rgb(253,250,242)`;
item 3, the privacy note replaces the Profile sheet the way the venue sheet opens the drink sheet
(one `.sheet` in the DOM, closing returns to Your details), `Sheet.tsx` untouched. DESIGN registry,
States and Sheets corrected to match. Verified: tsc, lint 28/0, design:check 33, tests 32/32,
gestures 18/18, first-open, build. Item 1 (erasure re-asks consent) is held for Charles because it
changes what Delete my data does; the spec has it built to a stated default when he says go.

### Charles's gates and rulings (nothing below is blocked on me)

- Push `main` and merge `product`: DONE 17 September on his go (see Where it stands).
- **Dashboard gates for sign-in**, being cleared in Brave 17 September on Charles's go: DONE in
  Supabase project `qpmrfoglxohmjhjtvkac`: Site URL `https://cruise.charlesbee.org` (was the
  GitHub Pages address); redirect list now eight entries (both slash forms of localhost:5173,
  localhost:4173 and cruise.charlesbee.org, plus the two old github.io ones left in place, harmless);
  Allow manual linking ON (saved, "Successfully updated settings"); anonymous sign-ins were already
  ON. REMAINING: a Google Cloud OAuth client (Web) with redirect URI
  `https://qpmrfoglxohmjhjtvkac.supabase.co/auth/v1/callback`, then its Client ID into the Supabase
  Google panel, the Client Secret pasted by Charles himself (a secret never goes through this
  transcript), Enable Sign in with Google ON, Save. Bobble's own Supabase project and OAuth client
  are not touched. BLOCKED 17 September: console.cloud.google.com refuses the signed-in Google
  account with "Google Cloud access blocked: two-step verification" (Google enforces 2SV for the
  console since May 2025). Enabling 2SV is a security setting on Charles's Google account and is
  his alone; once on (and a few minutes for it to take), the OAuth client is one console visit.
  The Supabase Google panel is left open in Brave, ready for the id and secret.
- **Spec rulings, each built to a stated default so none blocked the build:** C: what a "fresh"
  sign-in erases (default: the guest's own rows, memberships left), and a lost `sessionStorage`
  trigger (default: no manual restore). B: the privacy contact address (`PRIVACY_CONTACT`, empty so
  its two sentences do not render), retention wording, a dated consent record, whether being added
  should need acceptance. E: the price sentence (`PRICE_LINE` null), whether a desktop visitor may
  open the passport in the browser (default yes), generalising the `index.html` titles off "Sun
  Princess". BYO: shipped solo (no sharing yet, the sailing sheet says so), no package tiers, the
  row shown to everyone, the champion badge named from the ship; the returning sailing sheet opens
  from a `.quiet-action` at the foot of Ship (my ruling on the reconcile's one stop).
- **Roll the Cloudflare API token** (pasted in chat 1 September; rotation register in
  `project-management/README.md`).

### Anonymous QA users to purge from the Supabase dashboard (all profile name Alex, zero edges/memberships)

- 10 September, all zero edges: sellability shots two (codes not recorded, ~11:00); pass C builder
  QR9Y-NYC3, QAZ9-2TPD; reviewer HCBC-6FT7, PZQ5-W9FN and one uncaptured (~13:03 to 13:07); fixer
  3QJT-1FC5, BDHC-KF9X. Pass B one uncaptured ~12:48:44 (the republish seam, polish item 1).
  Deleted-profile auth rows still present, by uid: `d7ffee51`, `f07921a5`, `4cf630c9`.
- BYO (17 September) created none: every check was local (fixtures, `node --test`, `?nosync` shots).
- Never blanket-purge; real users have existed since 3 September.

### The shaker (branch `shake`), 17 to 18 September: done and live

Charles's brief: a lootbox-style build-up and reveal, but the object is a 2D cocktail shaker with
dice in it and the reveal is 8-ball style; press, it shakes with noise and haptics, holds a beat,
and a drink to go and get surfaces in the shaker's window. Spec `docs/specs/2026-09-17-shake.md`
(mine: placement at the foot of For you, one coral in the sheet, an honest untried pick weighted
by the For-you signals, a synthesised dice rattle with a persisted quiet toggle, the fifth authored
motion moment with a reduced-motion fade). Harness: build -> refute-by-default review -> fix, one
stream, all agents Opus. DONE 17 September: eight build commits `c838edf`..`619bec5`, review
verdict fail on one major (17 of 214 drink names clipped in the window with nothing carrying them in
full) fixed by `b37dda4` (the full name renders beneath the shaker only when the window clips,
measured) and `6166158` (docs); the one minor was the spec contradicting itself on the window's
colour pair (the built reveal is ink on a cream window, 10.4:1, which is right). Gates green:
46/46 tests, tsc, lint 28/0, design:check 34 files, no allow-list change, build exit 0. My own read
of the four renders: holds the constitution and has the build-up. The reviewer could not make the
pick name a tried drink across 2,000 catalogue cases. LIVE 18 September on Charles's "push it":
`main` fast-forwarded to `96ed788`, deploy green, shell `index-rrIOdR1a.js`.
REVISION in flight (branch `shake`, base `96ed788`): Charles: "shakers don't have windows, so should
be the top come off and it pops out like a lootbox lootcrate drop". The spec's Revision section
(18 September) replaces the window: the lid flips open at the reveal, a drawn token pops out of the
mouth and hangs, and the name resolves beneath the shaker as the card (which also retires the
window's clipping fix). The build run `wf_89d0b4ac-795` died with its session after landing six
commits (`141e56d`..`a70e83a`) and one uncommitted edit, which I committed and then had to correct
(`518a494`, `b41822f`: a JSX comment in an invalid position had broken tsc). Do not resume that run:
its build agent has no cached result, so a resume rebuilds over commits that exist. Review and fix
run separately: run `wf_5a75f3f7-e50` (review over `96ed788..HEAD`, then fix). Resume:
`Workflow({ scriptPath: "C:\Users\Charles\.claude\projects\E--claude-projects-cruise-passport\10468e48-0258-48b8-84c7-deaaceda11ba\workflows\scripts\cruise-shake-lid-review-fix-wf_5a75f3f7-e50.js", resumeFromRunId: "wf_5a75f3f7-e50" })`.
DONE 18 September: the review's verdict was fail on one major (Go get it replaces the sheet with
DrinkSheet, so closing it remounted at phase 'revealed' and the lid, the drop and the card's fade all
ran again from their first frames, the answer blanking for two thirds of a second and the live
region coming back already holding its once-only line) and four minors; the choreography otherwise
measured to spec beat for beat. The fix phase landed `d1f082b` (a `still` flag set beside
`setOpenDrink` with the live line cleared, released at the top of `press()` rather than in `run()`
so the 240ms reverse before a Shake again survives; `.is-still` takes the animations off the lid,
the drop and the card and leaves the end values `.is-open` carries, last in the file because it ties
on specificity with the reduced-motion rules) and `ed28d97` (registry: five phases). I folded the
two spec-words minors into `33cbe50` (the hinge is the left-hand end of the rim line; the
reduced-motion fade is `var(--t-panel)`, 200ms, not 300). The two remaining minors are Charles's
taste: the drop's glyph size and nothing else. Merged, deployed and probed on production, see Where
it stands.
Original build run, for the record. Resume (do not):
`Workflow({ scriptPath: "C:\Users\Charles\.claude\projects\E--claude-projects-cruise-passport\10468e48-0258-48b8-84c7-deaaceda11ba\workflows\scripts\cruise-shake-lid-wf_89d0b4ac-795.js", resumeFromRunId: "wf_89d0b4ac-795" })`.
Run `wf_dc5809ec-9c7`. Resume (only if something must be re-run):
`Workflow({ scriptPath: "C:\Users\Charles\.claude\projects\E--claude-projects-cruise-passport\10468e48-0258-48b8-84c7-deaaceda11ba\workflows\scripts\cruise-shake-wf_dc5809ec-9c7.js", resumeFromRunId: "wf_dc5809ec-9c7" })`.
If a fix agent dies on the spend cap with the review done, apply the findings in the main loop as
the BYO fix was; if the builder dies, its commits are on `shake`, run review and fix separately.

### Shaker second pass, declutter, polish item 1 (branch `shake-declutter`), 22 to 23 September: done and live

Charles, 22 September: "The shaker animation isn't there yet like it doesn't look great also check
out any pending work and verify and push it, also make sure we've declutterred the ui as it's a bit
dense wordy", pointing at `jakubkrehel/skills` and `emilkowalski/skills` on skills.sh (read from
shallow clones in the session scratchpad; the rules taken from them are written into the specs).
His "verify and push it" is the go for the pending work, which is polish item 1 (erasure re-asks
consent, `docs/specs/2026-09-17-polish.md`), the drop's glyph and the DESIGN.md sentence on
sheets returned to after a replacement.

- Filmed the shipped shaker (`tools/qa/film.mjs`, new): it reads as a pedal bin, the shake is a
  wobble, the lid hinges like a bin lid, the prize reads as a 7, no build-up into the pop, and the
  sheet grew twice mid-moment. `73537b9` fixes the growth (held answer slot, held Shake again) and
  makes the shaker a swappable variant (`src/features/shake/variants/`, `?shaker=a|b|c`).
- Workflow A `wf_e3866d7c-5a7`, done: mid-run Charles sent a reference photograph of a polished
  cobbler ("More what I conceptualise a cocktail shaker looking like"); I stopped the run, wrote its
  proportions into the spec (the photo itself sits gitignored in `.qa/reference/`, the repo being
  public), swapped the Boston-tins angle for "the top comes off", and resumed (five finished audit
  lenses replayed from cache). Three cobbler variants were built and filmed (`4c8f764` keeps them),
  and three judges scored them: motion A 8, B 7, C 6.5; drawing A 8, C 6, B 5.5; brief B 8, A 7.
  I ruled A (its reveal keeps the shaker; B's leaves a tumbler under the glass), with grafts from B
  and C: `docs/specs/2026-09-22-shaker-fold.md`. The audit found about 90 cuts on 17 surfaces; I
  ruled its twelve open questions, each towards fewer elements: `docs/specs/2026-09-22-declutter.md`.
- Workflow B `wf_d3288a12-b10` built the fold (`5a03277`..`b5140e4`) and six declutter streams in
  worktrees; I stopped it while the fold ran a last slow grep and merged the streams by hand
  (`--no-ff`, no conflicts), then finished their leftovers (`0b1195c`). The follow-up review run
  `wf_e306cb1f-de7` died with its session a minute in; on 23 September Charles ruled out headless
  Chrome ("use brave browser mcp tool to verify stuff not headless chrome it nukes cpu perf"), so
  the review ran as a browser-free code review (no must-fix; two should-fixes applied in `a004cfb`)
  and a docs pass (`0b3d969`), and every render was checked by me in Brave.
- 23 September, in the main loop, verified in Brave: the quiet actions centred again and the glass
  chosen by drink (`aacf654`); Charles: "the wavyness of the water should be lower frequency so the
  boat is actually interacting fewer bigger waves", so one long swell the liner rides, pitch damped
  to a third (`9f40e16`); the page declared light-only, because Dark Reader in Brave inverted it
  (`9f40e16`); Charles: "maybe an icon by drinks by type ... can always use JEV to classify them", so
  `tools/glass-classify.mjs` (Jev jev-1.13.0, $0.0054, twelve hand rulings in
  `tools/glass-classify.overrides.json`) and a glass leading every drink row (`634e699`, `cd01492`);
  Brave Shields hid `.social-head`, the only door onto Your details, so Crew's classes are `crew-*`
  (`6a2d592`). Merged and deployed at `6f54560`.

## Next action

Nothing is in flight. The overhaul is live at `6f54560`. Open from the code review, none blocking:
an erase can race a sync already in flight (`ProfileSheet.tsx` erase against `sync.ts` runSync:
hold syncs before the RPC); Shake again lands the prize about 100ms past the 3.0s budget because the
260ms reverse comes first; dead code (`Filters.venues` and facets' venues group, the store's
`'again'` toggle, `computeStats().best`). Housekeeping: the six stream worktrees under
`.claude/worktrees/` can go now `main` carries their work (their branches stay). Charles's: two-step
verification on the Google account for the OAuth client, the held spec rulings, the Cloudflare
token roll, the QA-user purge (the polish item 1 live run's two users deleted themselves), and the
QA harness's leaked Chrome profiles (thread above).

## Gotchas

- `tools/qa/shot.mjs` always appends `?seed` and hits `SHOT_BASE`; against live it signs in an
  anonymous user per run. For a live look use `tools/qa/cold.mjs`; offline `tools/qa/offline.mjs`;
  the update reload `tools/qa/update.mjs`; the first-open sync gate `tools/qa/first-open.mjs`; the
  shaker end to end on production `tools/qa/shake-live.mjs` (Home is `/`, not `/home`). The
  BYO screens shoot from `?seed&fixture=byo-new|byo-empty|byo` (see `CLAUDE.md`).
- Delete my data on a QA run must be on a `?nosync` page, or the erased user is replaced by an
  unreachable one (polish item 1; `CLAUDE.md` Seed).
- Verify in Brave (the extension, an iframe wrapper at 390 wide, `?seed&nosync`; CLAUDE.md step 4).
  The automation tab is hidden, so `requestAnimationFrame` runs only when a screenshot is taken and
  no animation advances between calls; timers still run. Dark Reader in Brave rewrote every colour
  (signature: background `rgb(24, 26, 27)`, text `rgb(232, 230, 227)`) until the page locked it; a
  cached old service worker in Brave serves an old shell on the first load after a deploy, and the
  second load is current. Never `?seed` on the live origin in Brave: it shares storage with any
  real passport there.
- Node on Windows needs `file:///E:/...` for an absolute ESM import; there is no `python3`, only
  `python`; QA scripts import `./cdp.mjs` relatively.
- Never two workflow writers on one file; never a second dev server on 5173.
- Every workflow here passes `model: "opus"` explicitly. The spend cap fired three times (10 and 17
  September); it is an account monthly wall only Charles can lift. Keep every pass resumable; when a
  fix agent dies with the review already done, apply the finding in the main loop rather than
  re-running the capped agent, as the BYO fix was.
