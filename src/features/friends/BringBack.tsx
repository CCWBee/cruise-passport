import { useState } from 'react'
import { formatSecret, normaliseSecret, RECOVERY_LENGTH } from '../../state/recovery'
import { claimPassport, useSyncStore, type ClaimState } from '../../state/sync'
import { GlassButton } from '../../ui/GlassButton'
import '../../ui/field.css'
import './friends.css'

// "Bring back a passport" (docs/specs/2026-09-23-recovery-and-hardening.md, section 1): the one route
// from a recovery code to a passport, on the entry screen and in Your details, and "Bring it back" on
// a copy whose passport has moved. One component, so the three cannot drift. Folded like the add
// sheet's join path: a .quiet-action that unfolds in place into the label, the field and the button.
// Success is not said here: ClaimTick (src/app/) shows the Confirm tick "Passport back" at the app's
// root, because on the entry screen a successful claim enters the passport and unmounts this.

// One line per answer, the spec's copy. 'working' is the button's own label, 'done' the tick.
const CLAIM_LINE: Record<ClaimState, string> = {
  idle: '',
  working: '',
  done: '',
  wrong: 'That code does not match a passport.',
  offline: 'No connection. Try again with a signal.',
  failed: 'That did not work. Try again in a moment.',
}

export function BringBack({ label = 'Bring back a passport', startOpen = false }: {
  label?: string
  /** Unfolded on arrival. Your details passes it when the passport has moved, because the code is
   *  then the way on rather than a rare route: folded, "Bring it back" was an underlined line of text
   *  above a full-width "Start again", so the one-way action outranked the likely one. */
  startOpen?: boolean
}) {
  const claim = useSyncStore((s) => s.claim)
  // Unfolded from the start when the store already holds an answer, so a ?qa=claim:… render and a
  // sheet reopened after a wrong code both show the line without a tap.
  const [open, setOpen] = useState(() => startOpen || (claim !== 'idle' && claim !== 'done'))
  const [tapped, setTapped] = useState(false)
  const [code, setCode] = useState('')
  // The answer belongs to the code that was sent: once the guest edits it, the line goes quiet
  // until the next attempt, rather than calling a half-corrected code wrong.
  const [edited, setEdited] = useState(false)
  const working = claim === 'working'

  // Grouped as it is typed, by formatSecret and never locally: the same K7QM-3XPA-… the guest was
  // shown. Capped at the code's length. Deleting a dash would reformat it straight back, so a
  // shorter value that formats to what is already there deletes the character before the dash.
  const onChange = (raw: string) => {
    let next = formatSecret(normaliseSecret(raw).slice(0, RECOVERY_LENGTH))
    if (raw.length < code.length && next === code) next = formatSecret(normaliseSecret(raw).slice(0, -1))
    setCode(next)
    setEdited(true)
  }

  const submit = async () => {
    setEdited(false)
    if ((await claimPassport(code)) === 'done') { setCode(''); setOpen(false) }
  }

  if (!open) {
    return (
      <button type="button" className="quiet-action" onClick={() => { setOpen(true); setTapped(true) }}>
        {label}
      </button>
    )
  }

  const line = edited ? '' : CLAIM_LINE[claim]
  return (
    // .friends-block, as the add sheet's unfolded join path is: 24 above, the field's own 16 collapsing
    // into it. .bring-back is the hook the entry screen's grid uses to give that 24 back to its gap.
    <div className="friends-block bring-back">
      <label className="f-field">
        <span className="f-label">Your recovery code</span>
        <input
          className="field-ctrl tnum"
          value={code}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          // the tap that unfolded this unmounted the button holding focus (the add sheet's join path
          // does the same); not on a render that opened already unfolded, which would raise a keyboard
          autoFocus={tapped}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !working) void submit() }}
        />
      </label>
      {/* plain, never primary: the entry screen's Done and the dock's Log are the filled controls.
          Disabled only while a claim is in flight, never on an empty or short field: claimPassport
          answers 'wrong' at once, with no request, for anything that is not a whole code, and a
          disabled ghost here let the one-way "Start again" below outrank the way back on a moved
          passport. */}
      <GlassButton block className="friends-action" disabled={working} onClick={() => { void submit() }}>
        {working ? 'Bringing it back…' : 'Bring it back'}
      </GlassButton>
      <p className={line ? 't-meta friends-status' : 'sr-only'} role="status">{line}</p>
    </div>
  )
}
