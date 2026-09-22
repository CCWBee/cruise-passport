import { Shaker } from '../../Shaker'
import type { ShakerVariant } from '../index'
import './c.css'

// Variant c: a placeholder that renders the shipped shaker until its builder replaces it. The
// builder owns this folder and nothing else (docs/specs/2026-09-22-shaker-v2.md).
export const variant: ShakerVariant = {
  id: 'c',
  Shaker,
  shakeMs: 1800,
  popMs: 2100,
  landMs: 580,
  closeMs: 240,
}
