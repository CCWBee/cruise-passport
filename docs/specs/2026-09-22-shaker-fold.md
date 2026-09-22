# The shaker fold: variant A becomes the shaker

22 September 2026. Follows `docs/specs/2026-09-22-shaker-v2.md` (read it in full first: the brief,
Charles's words, his reference photograph and its proportions, what is settled). The round was
built and judged by `wf_e3866d7c-5a7`; the three variants are committed at `4c8f764` in
`src/features/shake/variants/` as a record, with their films in `tools/qa/shots-v2-*/`,
`tools/qa/shots-v2-judging/` and `tools/qa/shots-judge-*/`.

## The ruling

**A wins** (the cobbler, cap off). Two judges of three chose it (motion 8 against B 7 and C 6.5;
drawing 8 against C 6 and B 5.5); the brief judge chose B (8 against A 7) for taking "the top come
off" literally. A is chosen because its reveal keeps the shaker: the dome, band and body stay and the
guest sees a cocktail shaker with its cap off and the prize above it. B throws the whole top away
and what is left reads as a tumbler with a glass over it, in the frame the guest looks at longest
and returns to. The cap is the top of a cobbler, so A answers the correction too. A takes the best
of B and C as grafts, below.

## What the fold does

Variant A's drawing and motion become the shaker, the variant harness goes, and every defect the
judges named in A is fixed. Read `ShakerA.tsx`, `glasses.tsx`, `a.css` and `index.tsx` in
`src/features/shake/variants/a/` first, then B's and C's for the grafts.

### Structure

- `src/features/shake/Shaker.tsx` becomes A's shaker (the component, its stage SVG and its pivots).
  The category glasses move to `src/features/shake/Glass.tsx` (one component per family, and the
  category-to-family map, exported for the fold's own use only). `shake.css` takes A's CSS, scoped
  under `.shaker` as the shipped file was, with the shipped file's still-on-return, answer and
  reduced-motion blocks carried forward where they still apply.
- The timings live beside the drawing, exported from `Shaker.tsx` as one object (`SHAKER`, with
  `shakeMs`, `popMs`, `landMs`, `closeMs` and the knock times below), and `ShakeSheet.tsx` reads them
  from there. `src/features/shake/variants/` is deleted in full, with `?shaker=` and the registry:
  QA scaffolding for one round is not a feature.
- `ShakerProps` stays `{ phase, still, drink }`.

### The fixes (every one is a judge's finding; the frames are in the judging takes)

1. **The held beat reads.** It is the weakest part of A on every judge's film: a sub-pixel tremble a
   guest reads as a pause. Replace it with pressure a guest can see at arm's length: the dice knock
   from inside twice (the tin hops 3px, then 5px, the second harder and sooner; C's `sc-shake`
   93.33% to 99.29% is the pattern), and the cap lifts off the neck twice between them (at least 6px,
   then at least 10px, the second quicker and held longer; B's seal strain, applied to the cap only,
   with no squash of the steel: steel does not flex). Then a 60 to 80ms press-down of the cap by 1
   to 2px, and the pop is thrown from there: an opposite-direction wind-up into the release, as B's
   `sb-strain` ends at +2px before its throw. `popMs` may grow to hold this; the budget still binds
   (prize landed within 3.0s of the press, card in within 3.4s).
2. **The set-down.** C's hard landing: a linear slam onto the bar at the end of the shake, on the
   rattle's clack, then one 2.5px rebound, in place of A's 1.5° rock.
3. **The strokes turn, not jump.** Every travel segment of the shake is on `--e-out`, so the tin is
   at full speed straight after each reversal. Put the travel segments on a strong ease-in-out, a new
   token `--e-shake: cubic-bezier(.77, 0, .175, 1)` (Kowalski's `--ease-in-out`), registered in
   DESIGN.md Motion as a written exception with its reason; the set-down stays linear.
4. **The cap leaves and is gone.** It flies straight up, then falls on a sampled parabola (C's
   `c.css` 145 to 167: keyframes sampled from the arc with linear between samples, so it speeds up as
   it falls), tumbling, and is fully faded within 300ms of its apex. It never lingers beside the
   glass (the brief judge saw it for about 500ms).
5. **The burst registers.** Keep A's six ink strokes, but draw them outward from the mouth over about
   160ms and fade them by about 280ms, starting as the cap leaves, so they are on screen for at least
   200ms (they showed for about 110ms and one judging take missed them entirely).
6. **The glass comes out of the mouth.** Two faults: about 100ms of an open, empty neck after the cap
   goes, because the glass starts deep in the tin and spends its fast frames out of sight; and a
   63px glass rising from a 36px neck slides up from behind the dome's shoulders. Start the glass
   just under the neck, at a scale that fits the neck (neck width over glass width), so it shows
   within 40ms of the cap leaving and is never wider than the mouth while inside it; it grows to full
   size as it clears the neck, with its one overshoot and settle. Clip it to the neck's column while
   it is inside if the scale alone does not keep its edges in (clip-path is allowed).
7. **The hang.** Every glass's foot clears the neck by at least 16px at rest: the pint must not stack
   on the neck like a bottle cap, the saucer must not sit on it. The stage stays one fixed height in
   every phase.
8. **Drop the sea lines.** Two judges read them as a liquid level seen through the tin, which is the
   window Charles ruled out on 18 September. No engraving.
9. **One hero stroke.** The tin and the glasses take one stroke weight on screen, 2.4 as the shipped
   drawing, B and C used (A was 2.2); the cap's grooves are the one hairline, in `--ink-3`. Register
   both in DESIGN.md (Iconography, beside the icon set's 1.8).
10. **The steel light shows.** A's light is a literal `rgba(255,255,255,.7)` that barely registers on
    cream. Use a token: `--glass-rim` (white at .75, the precedent the spec names) or a new
    `--steel-light` registered beside it; then check a render actually shows the strip, and strengthen
    the shade (`--line`) on the far side if the light alone cannot read on cream.
11. **The best glass of each family.** Compare A's `glasses.tsx` with B's glass by glass and keep the
    stronger drawing of each, at the hero stroke. Take B's three-pass outline, so the `--line` drink
    never crosses the stroke, and B's olive on a pick and lime wedge where they are better. Every
    family must read at a glance: martini, margarita, wine, pint, cup and saucer, hurricane, highball.
12. **Keep the last drink by id** for the reverse (B's `drink.id !== kept?.id`), not by object
    identity.
13. **The reverse seats cleanly.** The glass sinks in about 180ms and the cap's return starts 40 to
    60ms later, so it seats on an empty neck; the whole reverse still ends within 260ms.
14. **The card.** Name, place and reason 80ms apart from the landing, each from opacity 0,
    `translateY(8px)` and `blur(4px)`, with the delays driven by one custom property (C's `--sc-at`)
    rather than a rule per child. The reason line may now be absent (the declutter's change, below),
    so the stagger must not leave a hole.
15. **The reveal's last frame.** "Shake again" appears by a visibility flip ahead of the card's first
    line; bring it in with the card's last line (a fade on the same clock). The Go get it button
    passes a frame with a white label on a pale ground on its way from the disabled ghost to coral:
    put its background, border and label colour on one transition. That transition is the `.btn`
    primitive's in `src/styles/base.css`; fix it there, once, for every button, and check a disabled
    to enabled change elsewhere (the add sheets) still reads right.
16. **Reduced motion.** The cap fades out before the glass fades in (the judges saw a double image of
    both at 400ms in B and the start of one in A); the card's lines land no later than the quiet
    action beneath them; everything inside `var(--t-panel)`. No travel, no rotation, no burst, no
    sound.
17. **The fold, measured.** After a reveal at 390×844 the sheet does not scroll, with room to spare:
    A measured 725 of the 742 a sheet may take, the tightest of the round. Bring the stage back to
    about 275 if the hang allows it, measure `.sheet-scroll` scrollHeight against clientHeight
    (skipping `.sr-only`, which the judging eval matched by mistake), and write the figure into the
    DESIGN.md Shake sheet section in place of "a box 70 taller".
18. **Sound and touch on the knocks.** `startRattle` takes the knock times (ms from the press) and
    lays a short low knock on each, from the same clock as the rest of the schedule; `haptic('tap')`
    fires on each knock from the sheet's own timer. Both stay silent under quiet and reduced motion.

### Copy (the declutter's share of this sheet, so one writer owns these files)

- `pick.ts`: `UNIFORM_REASON` becomes `''`; `ShakeSheet.tsx` renders the reason line only when it
  is non-empty; `pick.test.ts` changes with it (its two assertions of the old string). "One you have
  not tried" repeated the sheet's own meta line on the same screen.
- The sound toggle stays as text ("Shake quietly" / "Shake with sound"): the icon set has no speaker
  glyph and the words are plainer for this guest.
- Home's shake row loses its subtitle, but Home.tsx is the home stream's file: not this one.

### Docs and checks

- DESIGN.md, this stream's sections only: Motion (the shake paragraph rewritten for the cap, the
  knocks, the burst, the glass, the written exceptions: the prize's one overshoot, `--e-shake` on the
  strokes, the linear set-down and the linear-between-samples fall), Iconography (the hero stroke),
  the Shake sheet section (module 2 the drawing and the seven glasses; module 3 the reason list; the
  sound paragraph's knocks; the measured fold), and the registry rows for `Shaker`, the glasses,
  `ShakeSheet`, `startRattle` and `haptic('shake')`. Every other section of DESIGN.md belongs to the
  declutter's docs pass: do not touch it.
- `tools/qa/design-allow.txt`: any linear segment or literal the scan flags, each with its reason.
- `tools/qa/shake-live.mjs` reads the old lid and drop (`.shaker-lid` at -105°, `.shaker-token` at
  -84px). Rewrite its reads for the new drawing (the cap gone, the glass hanging, the card in, the
  live line, `is-still` on return) and run it against the dev server (`node tools/qa/shake-live.mjs
  http://127.0.0.1:5173`) as well as the films.
- Films, all read honestly: the normal take at `--every 120` and a fine take across the held beat
  and the pop at `--every 40`; the reduced take; the shake-again take; one take each for at least a
  martini, a pint, a coffee and a wine pick (reload until the pick lands on each, or seed the pick
  with a QA-only path if one exists; do not add one). Gates: `npm test`, `npx tsc -p
  tsconfig.app.json --noEmit`, `npm run lint` (0 errors, the 28 known warnings), `npm run
  design:check`, `node tools/qa/scan.mjs src/features/shake`.
