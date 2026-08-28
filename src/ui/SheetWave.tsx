// The signature wash: a blue-tinted pane of Liquid Glass washes over the sheet, its foam
// crest leading, then drains downward to reveal the clear glass pane behind. It is ONE moving
// edge travelling across the pane — a wave, not a flash. Plays once; skipped under reduced-motion.
import { useEffect, useState } from 'react'

export function SheetWave() {
  const [gone, setGone] = useState(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (gone) return
    const t = setTimeout(() => setGone(true), 1650) // must outlast the CSS sw-drain (1600ms)
    return () => clearTimeout(t)
  }, [gone])
  if (gone) return null

  return (
    <div className="sheet-wash" aria-hidden>
      <div className="sw-wave">
        <div className="sw-body" />
        <svg className="sw-crest" viewBox="0 0 120 20" preserveAspectRatio="none">
          <path className="sw-crest-fill" d="M0,11 C22,3 42,3 62,9 C82,15 102,15 120,7 L120,20 L0,20 Z" />
          <path className="sw-foam" d="M0,11 C22,3 42,3 62,9 C82,15 102,15 120,7"
            fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
