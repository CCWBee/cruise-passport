import { useEffect, useState } from 'react'
import './friends.css'

// One two-tap confirm for every irreversible social action (delete my data, leave, delete a group).
// The first tap arms and explains, the second commits, and it disarms itself after a few seconds so
// a stray tap on a phone in a pocket cannot destroy anything.
export function ConfirmButton({
  label, confirmLabel, note, className = 'btn btn-wide', ariaLabel, onConfirm,
}: {
  label: string
  confirmLabel: string
  note?: string
  className?: string
  ariaLabel?: string // when the row's own label is too short to say who or what it acts on
  onConfirm: () => void
}) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 6_000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <div className="confirm">
      {/* Armed is a coral outline, never a coral fill: the screen has already spent its one filled
          accent, and a fill here landed on whatever plate the caller's class carried. */}
      <button
        type="button"
        className={className + (armed ? ' armed' : '')}
        aria-label={ariaLabel}
        onClick={() => { if (armed) { setArmed(false); onConfirm() } else setArmed(true) }}
      >
        {armed ? confirmLabel : label}
      </button>
      {armed && note && <p className="muted t-body confirm-note" role="status">{note}</p>}
    </div>
  )
}
