import { useState, type FormEvent } from 'react'
import { CATEGORIES, PLUS, PREM, VENUES, VENUE_KEYS, type Drink } from '../../data/model'
import { useStore } from '../../state/store'
import { IconPlus } from '../../ui/Icon'
import { Sheet } from '../../ui/Sheet'
import './drinksheet.css'
import './addsheet.css'

export function AddSheet({ onClose }: { onClose: () => void }) {
  const addCustom = useStore((s) => s.addCustom)
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
    <Sheet onClose={onClose} eyebrow={<div className="sheet-eyebrow eyebrow">Personal passport</div>}>
      <div className="add-title"><IconPlus size={23} /><h2 className="t-title">Add a drink</h2></div>
      <p className="muted t-body add-lead">Add something new or missing from the published menus.</p>
      <form onSubmit={submit} autoComplete="off">
        <label className="ds-field">
          <span className="eyebrow">Name</span>
          <input name="name" type="text" required autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="ds-field">
          <span className="eyebrow">Venue</span>
          <select name="venue" className="tnum" value={venue} onChange={(event) => setVenue(event.target.value)}>
            {VENUE_KEYS.map((key) => <option key={key} value={key}>{VENUES[key].name} · Deck {VENUES[key].deck}</option>)}
          </select>
        </label>
        <label className="ds-field">
          <span className="eyebrow">Type</span>
          <select name="type" value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="ds-field">
          <span className="eyebrow">Spirits</span>
          <input name="spirits" type="text" value={spirits} onChange={(event) => setSpirits(event.target.value)} placeholder="Gin, liqueur" />
          <small className="add-help muted">Separate more than one with commas.</small>
        </label>
        <label className="ds-field">
          <span className="eyebrow">Ingredients</span>
          <textarea name="ingredients" rows={3} value={ingredients} onChange={(event) => setIngredients(event.target.value)} />
        </label>
        <label className="ds-field">
          <span className="eyebrow">Price</span>
          <input name="price" className="tnum" type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Leave blank if unknown" />
        </label>
        <button type="submit" className="btn btn-coral btn-wide add-submit"><IconPlus size={18} />Add it</button>
      </form>
    </Sheet>
  )
}
