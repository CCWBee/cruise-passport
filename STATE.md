# STATE

Open work for the Cocktail Passport. One-line status lives in `E:\claude-projects\PROJECTS.md`;
agent context in `CLAUDE.md`; the reconciled checklist in `docs/PRODUCTIONISATION.md`; the product
architecture in `docs/specs/2026-09-10-product-brief.md`, one spec per workstream beside it.

## Where it stands (17 September 2026)

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

### Polish pass: items 2 and 3 done, item 1 held for Charles

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

### In flight: the shaker (branch `shake`), launched 17 September

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
window's clipping fix). Harness: build steps 8 to 12 -> review -> fix. Handle recorded below.
Run `wf_dc5809ec-9c7`. Resume (only if something must be re-run):
`Workflow({ scriptPath: "C:\Users\Charles\.claude\projects\E--claude-projects-cruise-passport\10468e48-0258-48b8-84c7-deaaceda11ba\workflows\scripts\cruise-shake-wf_dc5809ec-9c7.js", resumeFromRunId: "wf_dc5809ec-9c7" })`.
If a fix agent dies on the spend cap with the review done, apply the findings in the main loop as
the BYO fix was; if the builder dies, its commits are on `shake`, run review and fix separately.

## Next action

The shaker revision (lid off, the drop pops out) is building; when green it merges to `main` (a deploy;
Charles has said push it for the shaker, so the revision ships on the same instruction unless he
says otherwise). Then everything remaining is Charles's: enable two-step verification on the Google
account so the OAuth client can be created, the
dashboard gates for sign-in, the held spec rulings, polish item 1's go (one small change built to the
spec's default), the Cloudflare token roll, and the QA-user purge. Nothing else is buildable without
him: the whole any-sailing product plus the two ruling-free polish items are on the branch, green.

## Gotchas

- `tools/qa/shot.mjs` always appends `?seed` and hits `SHOT_BASE`; against live it signs in an
  anonymous user per run. For a live look use `tools/qa/cold.mjs`; offline `tools/qa/offline.mjs`;
  the update reload `tools/qa/update.mjs`; the first-open sync gate `tools/qa/first-open.mjs`. The
  BYO screens shoot from `?seed&fixture=byo-new|byo-empty|byo` (see `CLAUDE.md`).
- Delete my data on a QA run must be on a `?nosync` page, or the erased user is replaced by an
  unreachable one (polish item 1; `CLAUDE.md` Seed).
- The Claude-in-Chrome automation tab freezes `requestAnimationFrame` and force-darkens the page.
- Node on Windows needs `file:///E:/...` for an absolute ESM import; there is no `python3`, only
  `python`; QA scripts import `./cdp.mjs` relatively.
- Never two workflow writers on one file; never a second dev server on 5173.
- Every workflow here passes `model: "opus"` explicitly. The spend cap fired three times (10 and 17
  September); it is an account monthly wall only Charles can lift. Keep every pass resumable; when a
  fix agent dies with the review already done, apply the finding in the main loop rather than
  re-running the capped agent, as the BYO fix was.
