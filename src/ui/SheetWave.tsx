// The signature wash: the pop-up washes up onto the screen AS sea-water — a foam wave crest
// leads its top edge — then the water drains away to leave a clear pane of Liquid Glass.
// The crest is the forefront of the pane. Plays once; skipped under reduced-motion.
import { useEffect, useState } from 'react'

export function SheetWave() {
  const [gone, setGone] = useState(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (gone) return
    const t = setTimeout(() => setGone(true), 1000)
    return () => clearTimeout(t)
  }, [gone])
  if (gone) return null

  return (
    <div className="sheet-wash" aria-hidden>
      <div className="sw-water" />
      <svg className="sw-crest" viewBox="0 0 120 26" preserveAspectRatio="none">
        <path d="M0,15 C20,5 40,5 60,12 C80,19 100,19 120,10 L120,26 L0,26 Z" fill="var(--sea-hi)" />
        <path className="sw-foam" d="M0,15 C20,5 40,5 60,12 C80,19 100,19 120,10"
          fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}
