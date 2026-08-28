import { useEffect, useRef, useState } from 'react'

/** Animate a number toward `target` with an ease-out. Snaps under reduced-motion. */
export function useCountUp(target: number, ms = 900): number {
  const [val, setVal] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setVal(target); return }
    const start = performance.now()
    const a = from.current
    const b = target
    if (a === b) { setVal(b); return }
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const e = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setVal(a + (b - a) * e)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else from.current = b
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])

  return val
}
