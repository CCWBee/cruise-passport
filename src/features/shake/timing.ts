/** The shaker's timings, in ms. They belong to the drawing, so they live in their own module beside it (a component file that exports anything else loses fast refresh): the sheet runs
 *  its phases on them, the rattle lays its sound on them, and shake.css holds the same numbers in its
 *  keyframes (`keyframes.mjs` writes those from this object, so the two cannot drift).
 *
 *    0 to 1800     the shake, set down on the bar on the rattle's clack at 1800, one small rebound
 *    knocks        the dice knock from inside, twice; the cap lifts off the neck on each
 *    popMs         the pop: the cap flies, the burst, the glass comes out of the mouth
 *    popMs+landMs  the glass has overshot and settled: the thock, the haptic, the card's first line
 *    closeMs       Shake again: the glass sinks and the cap goes back on before the next shake */
export const SHAKER = {
  shakeMs: 1800,
  knocks: [1970, 2100],
  popMs: 2300,
  landMs: 540,
  closeMs: 260,
}
