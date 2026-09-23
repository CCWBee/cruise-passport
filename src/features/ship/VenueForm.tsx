import { useRef, useState, type FormEvent } from 'react'
import { VENUE_TYPES, type Venue } from '../../data/model'
import { newVenueKey, removeVenue, saveVenue } from '../../data/sailings'
import { useStore } from '../../state/store'
import { ConfirmButton } from '../friends/ConfirmButton'
import { useConfirm } from '../../ui/Confirm'
import { NumberField, TextArea, TextField } from '../../ui/Field'
import { GlassButton } from '../../ui/GlassButton'
import { Select } from '../../ui/Select'
import { Sheet } from '../../ui/Sheet'
import './ship.css'

const NAME_MAX = 40
const HOURS_MAX = 40
const NOTES_MAX = 200
const DECK_MIN = 1
const DECK_MAX = 30

// A venue the guest is adding to the sailing they are on, or one they are changing. The skeleton is
// AddSheet's: the same Sheet, the same title and one meta line, the same ui/ controls in the same
// idiom, the same block primary at the foot. The field list is not the same, and does not pretend to
// be: a venue has five facts and a drink has six, and they are different facts. What matches is how
// it reads, because these are the two "add a thing" sheets in the app.
export function VenueForm({ cruiseId, venueKey, venue, onClose }: {
  cruiseId: string
  /** absent when adding: the key is minted from the name on save */
  venueKey?: string
  venue?: Venue
  onClose: () => void
}) {
  const editing = !!venueKey
  const custom = useStore((s) => s.custom)
  const forgetVenue = useStore((s) => s.forgetVenue)
  const [tick, showTick] = useConfirm()

  const [name, setName] = useState(venue?.name ?? '')
  const [deck, setDeck] = useState(venue ? String(venue.deck) : '')
  const [kind, setKind] = useState(venue?.type ?? VENUE_TYPES[0])
  const [hours, setHours] = useState(venue?.hours ?? '')
  const [notes, setNotes] = useState(venue?.blurb ?? '')
  const [deckErr, setDeckErr] = useState('')

  // VENUES, VENUE_KEYS, DECKS and CATEGORIES are module constants resolved once at load, so a
  // catalogue change reloads the page: the app's own mechanism for exactly this (enterCruise,
  // store.ts). The reload happens once, from the close handler, and only when something was saved,
  // so a sheet opened and dismissed costs nothing.
  const saved = useRef(false)
  const close = () => {
    onClose()
    if (saved.current && typeof location !== 'undefined') location.reload()
  }

  const cleanName = name.trim().slice(0, NAME_MAX)

  /** The venue as it would be written, or null with the Deck field's error set. The error is the
   *  Field primitive's own `error` prop and never a hand-written meta line: a second error style on
   *  one screen is the divergent sibling canonical-patterns exists to stop. */
  const read = (): Venue | null => {
    const n = Number(deck)
    if (!deck.trim() || !Number.isInteger(n) || n < DECK_MIN || n > DECK_MAX) {
      setDeckErr(`Deck must be a whole number between ${DECK_MIN} and ${DECK_MAX}.`)
      return null
    }
    setDeckErr('')
    return {
      name: cleanName,
      deck: n,
      type: kind,
      hours: hours.trim().slice(0, HOURS_MAX),
      blurb: notes.trim().slice(0, NOTES_MAX),
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cleanName) return
    const next = read()
    if (!next) return
    saveVenue(cruiseId, venueKey ?? newVenueKey(cruiseId, cleanName), next)
    saved.current = true
    close()
  }

  // Venues are entered in a batch on the day the sailing is set up; drinks are entered one at a time
  // at a bar. That is why this sheet offers a second button and AddSheet does not, and the coral cap
  // holds: one filled control, one outline. The tick is right here and nowhere else in this flow,
  // because the row it made is not on screen yet, which is DESIGN.md's own test for Confirm.
  const addAnother = () => {
    if (!cleanName) return
    const next = read()
    if (!next) return
    saveVenue(cruiseId, newVenueKey(cruiseId, cleanName), next)
    saved.current = true
    showTick(`${next.name} added`)
    setName('')
    setDeck('')
    setKind(VENUE_TYPES[0])
    setHours('')
    setNotes('')
    document.getElementById('venue-name')?.focus()
  }

  // Read in the component, because sailings.ts holds no drinks and cannot count them.
  const mine = custom.filter((d) => d.venue === venueKey && d.cruise === cruiseId).length
  const removeNote = mine === 0
    ? 'Removes it from the ship. Nothing is logged here.'
    : `Removes it and the ${mine} ${mine === 1 ? 'drink' : 'drinks'} you added to it, and everything you logged at them.`

  // The store first, then the record: the drinks, their entries and the visit are the store's, and
  // without that call the note above is false. sailings.ts can only remove the venue.
  const remove = () => {
    if (!venueKey) return
    forgetVenue(cruiseId, venueKey)
    removeVenue(cruiseId, venueKey)
    saved.current = true
    close()
  }

  return (
    <Sheet onClose={close} labelledBy="venue-form-title">
      <h2 className="t-h2 sheet-title" id="venue-form-title">{editing ? venue?.name : 'Add a venue'}</h2>
      {/* the one fact the fields below do not show: what is required, or what an edit leaves alone */}
      <p className="sheet-meta">
        {editing ? 'The drinks logged here stay logged.' : 'Only the deck and name are needed.'}
      </p>
      <form onSubmit={submit} autoComplete="off">
        <TextField
          id="venue-name"
          label="Name"
          name="name"
          required
          autoFocus
          maxLength={NAME_MAX}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <NumberField
          id="venue-deck"
          label="Deck"
          name="deck"
          required
          min={DECK_MIN}
          step="1"
          inputMode="numeric"
          error={deckErr || undefined}
          value={deck}
          onChange={(event) => { setDeckErr(''); setDeck(event.target.value) }}
        />
        {/* AddSheet's own Select wrapper, verbatim: a plain span.field-label inside div.field. Which
            of the two label shapes in the app is right is not this sheet's to settle. "Kind" rather
            than "Type" because the drink form's Select is already labelled Type and the two are
            different things. */}
        <div className="field">
          <span className="field-label" id="venue-kind-label">Kind</span>
          <Select
            value={kind}
            onChange={setKind}
            options={VENUE_TYPES.map((type) => ({ value: type, label: type }))}
            ariaLabel="Kind"
          />
        </div>
        <TextField
          id="venue-hours"
          label="Hours"
          name="hours"
          placeholder="4pm to late"
          maxLength={HOURS_MAX}
          value={hours}
          onChange={(event) => setHours(event.target.value)}
        />
        <TextArea
          id="venue-notes"
          label="Notes"
          name="notes"
          rows={3}
          maxLength={NOTES_MAX}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {/* Disabled rather than an early return on submit: a button that does nothing when tapped is
            the state DESIGN.md's "Every control ships default, pressed, focus-visible, disabled"
            exists to prevent. */}
        <GlassButton variant="primary" size="lg" block type="submit" className="venue-form-submit" disabled={!cleanName}>
          {editing ? 'Save' : 'Add it'}
        </GlassButton>
        {!editing && (
          <GlassButton variant="secondary" block type="button" className="venue-form-again" disabled={!cleanName} onClick={addAnother}>
            Add another
          </GlassButton>
        )}
      </form>
      {editing && (
        <>
          <hr className="hairline venue-rule" />
          <ConfirmButton
            label="Remove this venue"
            confirmLabel="Tap again to remove"
            note={removeNote}
            className="venue-form-remove"
            onConfirm={remove}
          />
        </>
      )}
      {tick}
    </Sheet>
  )
}
