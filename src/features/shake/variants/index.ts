import type { ComponentType } from 'react'
import type { Drink } from '../../../data/model'
import type { ShakePhase } from '../Shaker'
import { variant as now } from './now'
import { variant as a } from './a'
import { variant as b } from './b'
import { variant as c } from './c'

// The shaker moment as a swappable part, for one judging round (docs/specs/2026-09-22-shaker-v2.md).
// Each variant owns its drawing, its motion and its own timings; the sheet around it (the answer, the
// button, the sound, the pick) is shared and does not change between them. `?shaker=a|b|c` picks one
// on a QA load; everything else, and every guest, gets the default. When the round is judged the
// winner is folded back into Shaker.tsx and this folder goes.

export interface ShakerProps {
  phase: ShakePhase
  /** the reveal found where it was left on returning from the drink sheet: no animation replays */
  still?: boolean
  /** the drink the shaker is about to surface; set at the pop, so the prize can be the right kind */
  drink?: Drink
}

export interface ShakerVariant {
  id: string
  Shaker: ComponentType<ShakerProps>
  /** ms from the press to the last knock of the shake, where the rattle stops */
  shakeMs: number
  /** ms from the press to the pop: the shake plus the held beat before the tin opens */
  popMs: number
  /** ms from the pop to the prize landing, which is when the sheet reads 'revealed' */
  landMs: number
  /** ms of putting it back together before a second shake */
  closeMs: number
}

const VARIANTS: Record<string, ShakerVariant> = { now, a, b, c }

export function activeVariant(): ShakerVariant {
  try {
    const id = new URLSearchParams(location.search).get('shaker')
    if (id && VARIANTS[id]) return VARIANTS[id]
  } catch { /* no location: tests */ }
  return now
}
