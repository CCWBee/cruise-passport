import { useId, useState } from 'react'
import { VENUES, menuFor } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { DrinkCard } from '../drinks/DrinkCard'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { Sheet } from '../../ui/Sheet'
import { Switch } from '../../ui/Switch'
import '../drinks/drinks.css'
import './ship.css'

export function VenueSheet({ venueKey, onClose }: { venueKey: string; onClose: () => void }) {
  const drinks = useAllDrinks()
  const venue = VENUES[venueKey]
  const entries = useStore((s) => s.me.entries)
  const visited = !!useStore((s) => s.me.visits[venueKey]?.visited)
  const toggleVisit = useStore((s) => s.toggleVisit)
  const [openId, setOpenId] = useState<string | null>(null)
  const titleId = useId()
  if (!venue) return null
  const menu = menuFor(venueKey, drinks)
  const done = menu.filter((d) => entries[d.id]?.tried).length
  const pct = menu.length ? (done / menu.length) * 100 : 0

  if (openId) {
    return <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />
  }

  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <h2 className="t-title sheet-title" id={titleId}>{venue.name}</h2>
      <p className="sheet-meta tnum">Deck {venue.deck} · {venue.type}, {venue.hours}</p>
      <p className="t-body venue-blurb">{venue.blurb}</p>
      {venue.shares && (
        <p className="t-meta venue-shared">Same list as {VENUES[venue.shares].name}, shared across the ship.</p>
      )}

      <hr className="hairline venue-rule" />
      <div className="venue-visit">
        <Switch
          checked={visited}
          onChange={() => toggleVisit(venueKey)}
          label="Visited"
          labelId="venue-visit-label"
        />
      </div>
      <hr className="hairline venue-rule" />

      <div className="venue-progress">
        <p className="t-meta tnum">{done} of {menu.length} tried from this list</p>
        <div
          className="meter"
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
        <div className="dlist venue-drinks">
          {menu.map((d) => <DrinkCard key={d.id} d={d} onOpen={setOpenId} />)}
        </div>
      ) : (
        <p className="t-meta">No published drinks for this venue yet.</p>
      )}
    </Sheet>
  )
}
