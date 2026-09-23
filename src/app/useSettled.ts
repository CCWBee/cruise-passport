import { useEffect, useState } from 'react'

/** True once `hidden` has held for `ms`, and false again the moment it stops. The chrome's hidden
 *  glass (the folded search pair, the capsule and Log under the search, the dock stepped down under a
 *  sheet, the top bar before it folds in) takes `.glass-off` with this, so its filters are dropped as
 *  the four-surface budget says (docs/DESIGN.md, Material), but only after its own hide has run:
 *  dropped at once, a field clipping away over 440ms would go flat for the length of the fold. */
export function useSettled(hidden: boolean, ms: number): boolean {
  const [settled, setSettled] = useState(hidden)
  useEffect(() => {
    if (!hidden) {
      setSettled(false)
      return
    }
    const timer = window.setTimeout(() => setSettled(true), ms)
    return () => window.clearTimeout(timer)
  }, [hidden, ms])
  return hidden && settled
}
