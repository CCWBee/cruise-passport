import type { ShakerVariant } from '../index'
import { Shaker } from './ShakerC'
import './c.css'

// Variant c, the dice roll: the drawing and its phases are in ShakerC.tsx, the motion in c.css, and
// the timings the sheet reads are here (docs/specs/2026-09-22-shaker-v2.md).
export const variant: ShakerVariant = {
  id: 'c',
  Shaker,
  // the rattle's own 1.8s schedule unstretched, so its ticks land on the ends of the strokes drawn
  // in c.css and its clack on the slam
  shakeMs: 1800,
  // the slam, a settle, two knocks from inside, then the pop
  popMs: 2100,
  // the flight, two quarter turns and the rock back: the thock lands on the settle
  landMs: 800,
  closeMs: 240,
}
