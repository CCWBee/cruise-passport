import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { haptic } from './haptic'
import './confirm.css'

// The one success confirmation (docs/DESIGN.md, States > Confirmation): a filled-green liquid-glass
// disc, a white tick that draws in, one line naming what happened, and a haptic where there is one.
// It is for an action the guest cannot otherwise see landing — a friend added, a group joined.
// Anything whose result is already on screen (tried, rated, favourite) stays silent.
//
// The tick is drawn here rather than taken from Icon.tsx because it is an animation, not an icon: the
// path is stroked on over 300ms and needs its own geometry (a 40px box, a 3px stroke) to read at arm's
// length. The green film and the white mark come from .glass-mint; the rest from the shared glass classes.

const HOLD_MS = 1100
const FADE_MS = 200

export function Confirm({ label, onDone }: { label: string; onDone?: () => void }) {
  const [leaving, setLeaving] = useState(false)
  // The live region mounts empty and is filled a frame later: a region inserted already holding its
  // text is unreliably announced by VoiceOver and NVDA.
  const [announce, setAnnounce] = useState('')
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const fired = useRef(false)

  // Timers, not animationend: under reduced motion there is no animation to end, and the tick must
  // still clear itself.
  useEffect(() => {
    haptic('success')
    const frame = requestAnimationFrame(() => setAnnounce(label))
    const hold = setTimeout(() => setLeaving(true), HOLD_MS)
    const end = setTimeout(() => {
      if (fired.current) return
      fired.current = true
      doneRef.current?.()
    }, HOLD_MS + FADE_MS)
    return () => { cancelAnimationFrame(frame); clearTimeout(hold); clearTimeout(end) }
  }, [label])

  return createPortal(
    <div className={'tickc' + (leaving ? ' tickc-leaving' : '')}>
      <span className="sr-only" role="status">{announce}</span>
      <span className="tickc-disc glass-live glass-sm glass-edge glass-mint" aria-hidden>
        <svg className="tickc-mark" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
          <path
            d="M9.5 20.6 16.6 27.6 30.5 12.8"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="tickc-label t-strong glass-live glass-sm glass-edge" aria-hidden>{label}</span>
    </div>,
    document.body,
  )
}

/** The caller's whole share of it: render the node, call show when something lands.
 *  `after` runs when the tick has cleared, for the callers that navigate afterwards. */
export function useConfirm(): [ReactNode, (label: string, after?: () => void) => void] {
  const [shown, setShown] = useState<{ id: number; label: string; after?: () => void } | null>(null)
  const nextId = useRef(0)

  const show = useCallback((label: string, after?: () => void) => {
    nextId.current += 1
    setShown({ id: nextId.current, label, after })
  }, [])

  // Keyed by id, so a second confirmation restarts the tick rather than sitting there half-drawn.
  const node = shown
    ? (
      <Confirm
        key={shown.id}
        label={shown.label}
        onDone={() => { setShown((s) => (s?.id === shown.id ? null : s)); shown.after?.() }}
      />
      )
    : null
  return [node, show]
}
