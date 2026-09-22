import type { ShakerVariant } from '../index'
import { ShakerA } from './ShakerA'
import './a.css'

// Variant a, the cobbler with its cap off (docs/specs/2026-09-22-shaker-v2.md). The timings are the
// drawing's and a.css holds the same numbers beside its keyframes:
//
//   0 to 1800     the shake: a dip, then travel up the diagonal and back, gentle, harder, violent,
//                 set down upright on the last knock, where the rattle's clack lands
//   1800 to 2220  the held beat: the tin trembles and the cap lifts on the pressure
//   2220          the pop: the cap flies up and tumbles away, the burst, the glass starts to rise
//   2780          the glass has overshot and settled, the thock lands, the card starts to arrive
//   3240          the card's third line is in
export const variant: ShakerVariant = {
  id: 'a',
  Shaker: ShakerA,
  shakeMs: 1800,
  popMs: 2220,
  landMs: 560,
  closeMs: 240,
}
