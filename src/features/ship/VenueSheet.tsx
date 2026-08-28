import { useState } from 'react'
import { VENUES, menuFor } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { DrinkCard } from '../drinks/DrinkCard'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { IconLink, IconPin } from '../../ui/Icon'
import { Sheet } from '../../ui/Sheet'
import { Switch } from '../../ui/Switch'
import '../drinks/drinks.css'

export function VenueSheet({ venueKey, onClose }: { venueKey: string; onClose: () => void }) {
  const drinks = useAllDrinks()
  const venue = VENUES[venueKey]
  const entries = useStore((s) => s.me.entries)
  const visited = !!useStore((s) => s.me.visits[venueKey]?.visited)
  const toggleVisit = useStore((s) => s.toggleVisit)
  const [openId, setOpenId] = useState<string | null>(null)
  if (!venue) return null
  const menu = menuFor(venueKey, drinks)
  const done = menu.filter((d) => entries[d.id]?.tried).length
  const pct = menu.length ? (done / menu.length) * 100 : 0

  if (openId) {
    return <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />
  }

  return (
    <Sheet
      onClose={onClose}
      eyebrow={<div className="sheet-eyebrow eyebrow tnum">Deck {venue.deck} · {venue.type} · {venue.hours}</div>}
    >
      <div className="venue-sheet-title">
        <IconPin size={23} />
        <h2 className="t-title">{venue.name}</h2>
      </div>
      <p className="muted t-body venue-blurb">{venue.blurb}</p>

      <div className="venue-visit glass">
        <Switch
          checked={visited}
          onChange={() => toggleVisit(venueKey)}
          label={visited ? 'Visited' : 'Mark as visited'}
          labelId="venue-visit-label"
        />
      </div>

      {venue.shares && (
        <p className="venue-shared muted">
          <IconLink size={19} />
          <span>Pours the {VENUES[venue.shares].name} list, shared across the ship.</span>
        </p>
      )}

      <div className="venue-progress">
        <div className="venue-progress-copy">
          <span className="t-strong tnum">{done} of {menu.length}</span>
          <span className="muted t-meta">tried from this list</span>
        </div>
        <div
          className="venue-progress-track"
          role="progressbar"
          aria-label="Drinks tried from this list"
          aria-valuemin={0}
          aria-valuemax={menu.length}
          aria-valuenow={done}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      {menu.length ? (
        <div className="venue-drinks reveal">
          {menu.map((d) => <DrinkCard key={d.id} d={d} onOpen={setOpenId} />)}
        </div>
      ) : (
        <div className="glass card center"><p className="muted">No published drinks for this venue yet.</p></div>
      )}
    </Sheet>
  )
}
