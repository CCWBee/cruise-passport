# STATE

Open work for the Cocktail Passport. One-line status lives in `E:\claude-projects\PROJECTS.md`;
agent context in `CLAUDE.md`; the reconciled checklist in `docs/PRODUCTIONISATION.md`; the product
architecture in `docs/specs/2026-09-10-product-brief.md`.

## Where it stands (10 September 2026)

- Charles ruled on the fork: (b), a product for any sailing. Build under way on branch `product`,
  with workflows and subagents, one workstream at a time in the order A, C, B, E, BYO
  (the brief has the reasons and the file-contention map).
- `main` now carries the 5 September ops-review apply run as one commit (his 13 paths, committed
  10 September, not pushed). Pushing `main` deploys the `?seed` guard: asked, awaiting his answer.
- Live is `62cdf04` (last green Deploy run, 5 September). Baseline on `product` at `83e16e7`, 10
  September: `design:check` 31 files clean, `lint` 0 errors (28 known warnings, per `CLAUDE.md`), `tsc` clean. One dev
  server is up on 127.0.0.1:5173 (background task `blo717sae`). Sellability assessment of 10 September
  is folded into the brief; evidence under `tools/qa/shots-live-audit/` (gitignored).

## Open threads

- Phase 1 done 10 September (run `wf_59cea1ba-a91`, 10 agents, 0 errors): five specs in
  `docs/specs/2026-09-10-*.md`, committed. Verdicts: A ready, B ready, E ready (after B lands),
  C needs-charles (dashboard gates; anonymous path and merge buildable now), BYO needs-charles.
- Pass A done 10 September (run `wf_a90270f3-7d1`): six commits `b42483a`..`7414857` on `product`;
  review verdict pass, five minor harness findings folded into pass C's step 0. `tools/qa/update.mjs`
  prints three PASS lines and fails on the old `main.tsx` (negative control run).
- Pass C done 10 September (run `wf_d78557ca-8a2`): fourteen build commits `dd1a9fa`..`9ff1563`,
  review verdict fail (two blockers: an em dash in a new `sync.ts` comment; `mergeCustom` kept
  duplicate ids), four fix commits, HEAD `39676d1`, all gates green (17 tests, tsc, design:check,
  lint 28/0). Live launch-order proven: the backups select precedes the first upsert. Not
  exercisable here: Google, `linkIdentity`, the `fresh` path, a genuinely missing backup. Residual
  one-line fixes left to the defaults: `restoreNow` snapshots state before its awaits; the
  return-leg restore has no manual trigger. The fix commits carry two co-author lines (Opus 5
  wrote them; the session line is Fable), which is accurate.
- Anonymous QA users created on the live backend on 10 September, all profile name Alex, zero
  edges and zero memberships, nine in total: two from the sellability shots (about 11:00), builder
  codes QR9Y-NYC3 and QAZ9-2TPD (12:43, 12:46), reviewer codes HCBC-6FT7 and PZQ5-W9FN plus one
  uncaptured at about 13:07 (13:03 to 13:07), fixer codes 3QJT-1FC5 and BDHC-KF9X (13:20, 13:22).
  Purge under the `CLAUDE.md` rule; never blanket-purge. Pass B's hand check adds one more.
- Pass B done 10 September (run `wf_ad2def83-9b8`): fifteen build commits `41f724e`..`3cc7f0f`,
  review verdict fail (one major: a false height figure in the new DESIGN.md Entry section), two
  docs-only fix commits, HEAD `a6e0e17`, all gates green (17 tests, tsc, design:check 32 files,
  lint 28/0). Proven on the wire: zero backend calls before Done, sync resumes after it; version-2
  and version-8 stores migrate to entered and are not re-asked.
- Follow-ups B surfaced, not B's to fix (small, need Charles's yes because they change semantics):
  (1) After Delete my data, if sync is live the next round trip mints a fresh anonymous user and
  republishes the same passport and name under it (`deleteMyData` signs out, `resetSocialIdentity`
  keeps the name, `ensureSession` creates a new user). Erasure severs the identity but not the
  upload. Coherent fix now that consent exists: erasure also sets `enteredCruise` false, so the
  entry screen asks again before anything publishes; the privacy note's Deleting it paragraph then
  says so. (2) In the offline state the disabled "Keep it with Google" looks identical to the
  enabled one (`:disabled` falls to the plain surface the plain button already has); one rule in
  `base.css`. (3) A stacked sheet covers the one beneath exactly (both cap at 88svh); if the
  layering should read, inset or scale the covered pane in `src/ui/Sheet.tsx`.
- QA users from pass B: builder created three (uid `d7ffee51-…` code BGY1-YHH7, deleted;
  uid `f07921a5-…`, deleted; one uncaptured at about 12:48:44 UTC, NOT deleted, minted by the
  republish seam above, profile name Alex, zero edges); reviewer created one (uid `4cf630c9-…`
  code NFD1-ETK8, deleted). So ten anonymous Alex users with profile rows to purge, plus three
  auth-only rows whose profiles are already deleted (find by uid: `d7ffee51`, `f07921a5`,
  `4cf630c9`).
- Pass E build LANDED but its workflow died on the Fable monthly spend cap (10 September) before the
  builder returned, so the review and fix phases never ran. Eleven commits `56893b8`..`6fcdcdd` are
  on `product` (HEAD `6fcdcdd`): the landing at `/` and `/get`, `.qr-plate` and `.quiet-action`
  minted in `base.css` and swept, `SHOT_W`/`SHOT_H` on `shot.mjs`. tsc clean, tests 17/17,
  design:check 33 files clean, but lint is 29 warnings: E introduced one, `Landing.tsx:21`
  `react(only-export-components)` from exporting `isDesktopVisitor()` beside the component (the
  29th-warning regression the A spec avoided). E is UNREVIEWED. Do not resume run `wf_2a3dddfc-aa1`:
  its build agent is cached as an error, so a resume re-runs the build over the eleven commits that
  already exist.
- In flight: pass E review and fix only (build already on the branch), one stream, on `product`,
  launched 11 September from `6fcdcdd`. The reviewer reads the diff `a6e0e17..HEAD`, re-runs the
  spec's shots and probes at 390x844 and 1280x800, and must catch the lint regression; the fixer
  moves `isDesktopVisitor` off `Landing.tsx` (candidate: beside `qaLanding` in `src/data/model.ts`)
  and applies any other findings. Resume handle recorded here once the run id exists. No live-backend
  action. After E: BYO (gated on Charles's two rulings), then a short polish pass for the three
  follow-ups above.
- Spend note: the 10 September cap was Fable's monthly limit; session is back on Opus 4.8 as of
  11 September. Workflows pass `model: "opus"` explicitly. If the cap fires again it is an account
  wall only Charles can lift; keep every pass resumable.
- Rulings and copy still Charles's, per spec: C: what a "fresh" sign-in erases (spec deletes the
  guest's own profile, passport and backup rows and leaves memberships), and whether a lost
  `sessionStorage` trigger should have a manual restore. B: the privacy contact address
  (`PRIVACY_CONTACT`), retention wording, whether a dated consent record is wanted, and whether
  being added by a friend should need acceptance (`befriend` writes both edges today). E: the price
  sentence, whether a desktop visitor may open the passport in the browser, generalising the
  `index.html` titles off "Sun Princess". BYO: ship without a way to hand a sailing to a friend, or
  hold; package tiers on a user sailing (default: none).
- Then per workstream: implement → gate review → fix, each a resumable workflow, committed on
  `product` per pass.
- Console gates for Charles (listed in the 10 September reply): Google provider + manual linking,
  Google Cloud OAuth client, redirect allow-list + Site URL, any 0004 migration, purge two Alex users,
  what is sold and at what price, a second real menu.

## Next action

Launch the Phase 1 spec workflow (all agents `model: 'opus'`), record its handles here, review the
drafted specs, commit them on `product`, then start one dev server on 5173 and run pass A.

## Gotchas

- `tools/qa/shot.mjs` always appends `?seed` and hits `SHOT_BASE`; against live it signs in an
  anonymous user per run. For a live look use `tools/qa/cold.mjs`; for offline, `tools/qa/offline.mjs`.
- The Claude-in-Chrome automation tab freezes `requestAnimationFrame` and force-darkens the page.
- A phone or Brave showing an older design is not a failed deploy: it is workstream A.
- Node on Windows needs `file:///E:/...` for an absolute ESM import; QA scripts import `./cdp.mjs`.
- Never two workflow writers on one file; never a second dev server on 5173.
