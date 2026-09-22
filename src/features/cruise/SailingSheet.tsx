import { useRef, useState, type FormEvent } from 'react'
import { CRUISES, setActiveCruise } from '../../data/cruises'
import { deleteSailing, newSailingId, saveSailing, venuesFor, type Sailing } from '../../data/sailings'
import { useStore } from '../../state/store'
import { ConfirmButton } from '../friends/ConfirmButton'
import { TextField } from '../../ui/Field'
import { GlassButton } from '../../ui/GlassButton'
import { Sheet } from '../../ui/Sheet'
import './cruise.css'

// The sailing a guest sets up for themselves, and the one they are already on. Same skeleton as
// VenueForm and AddSheet: Sheet, title, one meta line, the fields, one block primary at the foot.
export function SailingSheet({ sailing, onClose }: { sailing?: Sailing; onClose: () => void }) {
  const editing = !!sailing
  const [ship, setShip] = useState(sailing?.ship ?? '')
  const [line, setLine] = useState(sailing?.line ?? '')
  const [start, setStart] = useState(sailing?.start ?? '')
  const [end, setEnd] = useState(sailing?.end ?? '')
  const [endErr, setEndErr] = useState('')

  // The same reload contract the venue form keeps: START, END and the whole catalogue are module
  // constants resolved at load, so a change to them reloads, once, from the one close handler, and
  // only when something was saved.
  const saved = useRef(false)
  const close = () => {
    onClose()
    if (saved.current && typeof location !== 'undefined') location.reload()
  }

  const cleanShip = ship.trim()
  // Every required field gates the button rather than failing on tap, for the reason DESIGN.md gives
  // under States: a control that does nothing when pressed is the state the disabled state exists to
  // show. AddSheet's early return on an empty name is corrected the same way in step 13.
  const ready = !!cleanShip && !!start && !!end

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ready) return
    if (end < start) {
      setEndErr('The last day cannot be before the first day.')
      return
    }
    setEndErr('')
    const id = sailing?.id ?? newSailingId()
    // saveSailing first, always: CRUISES is memoised at module load, so until the reload the new id
    // is not in it and activeCruiseId() would fall back to the published sailing. The reload rebuilds
    // CRUISES from spcc-sailings, which this write has already put there.
    saveSailing({ id, ship: cleanShip, line: line.trim(), start, end, updatedAt: 0 })
    if (!editing) {
      // setActiveCruise and cruiseId, never enterCruise: that sets enteredCruise, which is the sync
      // gate, and turning sync on for a guest who has not yet tapped Done would make the consent line
      // on the screen underneath this sheet false. The page comes back on the entry screen, on the
      // new sailing, with Done still to tap.
      setActiveCruise(id)
      useStore.setState({ cruiseId: id })
    }
    saved.current = true
    close()
  }

  // The store first, because the venue keys are read out of the record deleteSailing is about to
  // remove, and because sailings.ts holds no drinks and cannot honour the note on its own. The
  // non-null assertion is safe by construction: CRUISES[0] is always the published sailing and a
  // published sailing has no delete control, so there is always another entry to switch to.
  const remove = () => {
    if (!sailing) return
    const keys = Object.keys(venuesFor(sailing.id))
    useStore.getState().forgetSailing(sailing.id, keys)
    deleteSailing(sailing.id)
    onClose()
    useStore.getState().enterCruise(CRUISES.find((c) => c.id !== sailing.id)!.id)
  }

  return (
    <Sheet onClose={close} labelledBy="sailing-sheet-title">
      <h2 className="t-title sheet-title" id="sailing-sheet-title">Your sailing</h2>
      {/* the one fact the fields below do not show: what is required, or what an edit leaves alone.
          Saying what is required here is what lets the cruise line carry no "Optional." hint. */}
      <p className="sheet-meta">
        {editing
          ? 'Your logged drinks stay where they are.'
          : 'Only the ship and dates are needed. You add the bars next.'}
      </p>
      <form onSubmit={submit} autoComplete="off">
        <TextField
          id="sailing-ship"
          label="Ship"
          name="ship"
          required
          autoFocus
          value={ship}
          onChange={(event) => setShip(event.target.value)}
        />
        <TextField
          id="sailing-line"
          label="Cruise line"
          name="line"
          value={line}
          onChange={(event) => setLine(event.target.value)}
        />
        <TextField
          id="sailing-start"
          label="First day"
          name="start"
          type="date"
          required
          value={start}
          onChange={(event) => { setEndErr(''); setStart(event.target.value) }}
        />
        {/* the error is the Field primitive's own error prop, which replaces the hint and wires
            aria-invalid and aria-describedby: one error style on the screen, not two */}
        <TextField
          id="sailing-end"
          label="Last day"
          name="end"
          type="date"
          required
          error={endErr || undefined}
          value={end}
          onChange={(event) => { setEndErr(''); setEnd(event.target.value) }}
        />
        <GlassButton variant="primary" block type="submit" className="sailing-submit" disabled={!ready}>
          {editing ? 'Save' : 'Start your passport'}
        </GlassButton>
      </form>
      {/* Said once, before the sailing exists, rather than found out after it is built, and so not
          on the returning sheet. Every sailing has its own id and the crew feeds are scoped to it,
          and a sailing cannot yet be handed to another phone, so in practice a sailing you set up has
          no crew. */}
      {!editing && <p className="t-meta sailing-crew">Crew and groups only work on the published sailings for now.</p>}
      {editing && (
        <>
          <hr className="hairline sailing-rule" />
          <ConfirmButton
            label="Delete this sailing"
            confirmLabel="Tap again to delete"
            note="Removes the sailing, its venues and the drinks you added to it from this phone. Your other sailings stay."
            className="btn btn-wide sailing-delete"
            onConfirm={remove}
          />
        </>
      )}
    </Sheet>
  )
}
