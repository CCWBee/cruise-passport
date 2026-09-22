import { Shaker } from '../Shaker'
import type { ShakerVariant } from './index'

// The shaker as it shipped on 18 September: the baseline the three variants are judged against.
export const variant: ShakerVariant = {
  id: 'now',
  Shaker,
  shakeMs: 1800,
  popMs: 2100,
  landMs: 580,
  closeMs: 240,
}
