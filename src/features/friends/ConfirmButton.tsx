import { useEffect, useState } from 'react'
import { GlassButton } from '../../ui/GlassButton'
import './friends.css'

// One two-tap confirm for every irreversible action (delete my data, leave, delete a group, remove a
// friend, a venue or a sailing). The first tap arms and explains, the second commits, and it disarms
// itself after a few seconds so a stray tap on a phone in a pocket cannot destroy anything. It is
// GlassButton inside: a wide secondary at the foot of a sheet by default, the ghost beside a name in
// a roster. `className` carries the caller's spacing only.
export function ConfirmButton({
  label, confirmLabel, note, variant = 'secondary', block = true, className = '', ariaLabel, onConfirm,
}: {
  label: string
  confirmLabel: string
  note?: string
  variant?: 'secondary' | 'ghost'
  block?: boolean
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
          accent, and a fill here would be a second. */}
      <GlassButton
        type="button"
        variant={variant}
        block={block}
        className={[className, armed && 'armed'].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        onClick={() => { if (armed) { setArmed(false); onConfirm() } else setArmed(true) }}
      >
        {armed ? confirmLabel : label}
      </GlassButton>
      {armed && note && <p className="muted t-body confirm-note" role="status">{note}</p>}
    </div>
  )
}
