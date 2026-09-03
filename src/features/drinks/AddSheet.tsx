import { useId, useState, type FormEvent } from 'react'
import { CATEGORIES, PLUS, PREM, VENUES, VENUE_KEYS, type Drink } from '../../data/model'
import { useStore } from '../../state/store'
import { TextField, TextArea, NumberField } from '../../ui/Field'
import { GlassButton } from '../../ui/GlassButton'
import { Select } from '../../ui/Select'
import { Sheet } from '../../ui/Sheet'
import './addsheet.css'

export function AddSheet({ onClose }: { onClose: () => void }) {
  const addCustom = useStore((s) => s.addCustom)
  const titleId = useId()
  const [name, setName] = useState('')
  const [venue, setVenue] = useState(VENUE_KEYS[0])
  const [category, setCategory] = useState(CATEGORIES[0] || 'Cocktail')
  const [spirits, setSpirits] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [price, setPrice] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    const parsed = price.trim() === '' ? null : Number(price)
    const finalPrice = parsed !== null && Number.isFinite(parsed) ? parsed : null
    const drink: Drink = {
      id: 'c' + Date.now(),
      name: cleanName,
      venue,
      category,
      spirits: spirits.split(',').map((spirit) => spirit.trim()).filter(Boolean),
      ingredients: ingredients.trim() || 'Ingredients not recorded',
      flavors: [],
      sweet: 3,
      strength: 3,
      frozen: false,
      price: finalPrice,
      desc: 'Added to your personal passport.',
      verified: true,
      plus: finalPrice === null ? null : finalPrice <= PLUS,
      premier: finalPrice === null ? null : finalPrice <= PREM,
      extra: finalPrice === null ? null : Math.max(0, finalPrice - PREM),
    }
    addCustom(drink)
    onClose()
  }

  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <h2 className="t-title sheet-title" id={titleId}>Add a drink</h2>
      <p className="sheet-meta">Something new, or missing from the published menus.</p>
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
          hint="Separate more than one with commas."
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
        <GlassButton variant="primary" block type="submit" className="add-submit">Add it</GlassButton>
      </form>
    </Sheet>
  )
}
