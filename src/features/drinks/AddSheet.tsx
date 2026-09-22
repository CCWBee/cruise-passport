import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, pkgFields, VENUES, VENUE_KEYS, type Drink } from '../../data/model'
import { useStore } from '../../state/store'
import { TextField, TextArea, NumberField } from '../../ui/Field'
import { GlassButton } from '../../ui/GlassButton'
import { Select } from '../../ui/Select'
import { Sheet } from '../../ui/Sheet'
import './addsheet.css'

/** `venue` presets the bar, when the sheet is opened from that bar's own empty list */
export function AddSheet({ onClose, venue: preset }: { onClose: () => void; venue?: string }) {
  const addCustom = useStore((s) => s.addCustom)
  const titleId = useId()
  const [name, setName] = useState('')
  const [venue, setVenue] = useState(preset && VENUES[preset] ? preset : VENUE_KEYS[0] ?? '')
  const [category, setCategory] = useState(CATEGORIES[0] || 'Cocktail')
  const [spirits, setSpirits] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [price, setPrice] = useState('')

  const cleanName = name.trim()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cleanName) return
    const parsed = price.trim() === '' ? null : Number(price)
    const finalPrice = parsed !== null && Number.isFinite(parsed) ? parsed : null
    const drink: Drink = {
      id: 'c' + Date.now(),
      name: cleanName,
      venue,
      category,
      spirits: spirits.split(',').map((spirit) => spirit.trim()).filter(Boolean),
      // Nothing is written that the guest did not type: an empty ingredients line and no blurb, and
      // the sheet renders neither. Sweetness and strength are the Drink type's required numbers and
      // the drink sheet never shows them for a drink the guest added.
      ingredients: ingredients.trim(),
      flavors: [],
      sweet: 3,
      strength: 3,
      frozen: false,
      price: finalPrice,
      desc: '',
      verified: true,
      // Stamped from the store and not from activeCruiseId(): the two agree in practice, but
      // allDrinks() filters against this field, so writing it from the same source it is read
      // against removes any chance of a drink saved under one id and looked for under another.
      cruise: useStore.getState().cruiseId,
      ...pkgFields(finalPrice),
    }
    addCustom(drink)
    onClose()
  }

  // Reachable only through /drinks?add once the toolbar control is suppressed, and it renders the
  // same way out as the Drinks empty state rather than a form whose venue Select has nothing in it.
  // The Select is not disabled instead: src/ui/Select.tsx has no disabled prop, and minting one
  // would mean a registry entry in DESIGN.md and a sweep of every other Select for this one state.
  if (VENUE_KEYS.length === 0) {
    return (
      <Sheet onClose={onClose} labelledBy={titleId}>
        <h2 className="t-title sheet-title" id={titleId}>Add a drink</h2>
        <p className="sheet-meta">Only you will see it.</p>
        <p className="t-body add-noven">Add a venue first, then the drinks you order there.</p>
        <div className="dempty-acts">
          <Link to="/ship" className="gbtn gbtn-primary gbtn-md" onClick={onClose} viewTransition>Add a venue</Link>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <h2 className="t-title sheet-title" id={titleId}>Add a drink</h2>
      <p className="sheet-meta">Only you will see it.</p>
      <form onSubmit={submit} autoComplete="off">
        <TextField id="add-name" label="Name" name="name" required autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        <div className="field">
          <span className="field-label" id="add-venue-label">Venue</span>
          <Select
            value={venue}
            onChange={setVenue}
            options={VENUE_KEYS.map((key) => ({ value: key, label: `${VENUES[key].name}, deck ${VENUES[key].deck}` }))}
            ariaLabel="Venue"
          />
        </div>
        <div className="field">
          <span className="field-label" id="add-type-label">Type</span>
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map((type) => ({ value: type, label: type }))}
            ariaLabel="Type"
          />
        </div>
        <TextField
          id="add-spirits"
          label="Spirits"
          name="spirits"
          value={spirits}
          onChange={(event) => setSpirits(event.target.value)}
          placeholder="Gin, liqueur"
        />
        <TextArea id="add-ing" label="Ingredients" name="ingredients" rows={3} value={ingredients} onChange={(event) => setIngredients(event.target.value)} />
        <NumberField
          id="add-price"
          label="Price"
          name="price"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Leave blank if unknown"
        />
        {/* disabled rather than an early return on submit: a button that does nothing when tapped
            is the state DESIGN.md's "Every control ships default, pressed, focus-visible, disabled"
            exists to prevent, and the venue form is written the same way */}
        <GlassButton variant="primary" block type="submit" className="add-submit" disabled={!cleanName}>Add it</GlassButton>
      </form>
    </Sheet>
  )
}
