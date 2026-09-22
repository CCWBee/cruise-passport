import { useId, useState } from 'react'
import { activeCruiseId } from '../../data/cruises'
import { VENUES, menuFor } from '../../data/model'
import { isUserVenue } from '../../data/sailings'
import { useAllDrinks, useStore } from '../../state/store'
import { DrinkCard } from '../drinks/DrinkCard'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { Sheet } from '../../ui/Sheet'
import { Switch } from '../../ui/Switch'
import { VenueForm } from './VenueForm'
import '../drinks/drinks.css'
import './ship.css'

export function VenueSheet({ venueKey, onClose }: { venueKey: string; onClose: () => void }) {
  const drinks = useAllDrinks()
  const venue = VENUES[venueKey]
  const entries = useStore((s) => s.me.entries)
  const visited = !!useStore((s) => s.me.visits[venueKey]?.visited)
  const toggleVisit = useStore((s) => s.toggleVisit)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const titleId = useId()
  if (!venue) return null
  const menu = menuFor(venueKey, drinks)
  const sharesWith = venue.shares ? VENUES[venue.shares] : undefined
  const mine = isUserVenue(venueKey)
  const done = menu.filter((d) => entries[d.id]?.tried).length

  if (openId) {
    return <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />
  }
  // The form replaces this sheet rather than opening over it, exactly as the drink sheet does above.
  // A sheet over a sheet is glass on glass, which DESIGN.md's Material section forbids outright.
  if (editing) {
    return <VenueForm cruiseId={activeCruiseId()} venueKey={venueKey} venue={venue} onClose={() => setEditing(false)} />
  }

  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <h2 className="t-title sheet-title" id={titleId}>{venue.name}</h2>
      {/* no trailing comma with nothing after it: a venue the guest added need not keep hours */}
      <p className="sheet-meta tnum">Deck {venue.deck} · {venue.type}{venue.hours ? `, ${venue.hours}` : ''}</p>
      {venue.blurb && <p className="t-body venue-blurb">{venue.blurb}</p>}
      {/* guarded: a venue's shares link can name a key this sailing does not hold, and reading .name
          off the miss was one of the four lookups that used to be a white screen. With no venue to
          name there is no sentence to write, so the line goes rather than half-renders. */}
      {sharesWith && (
        <p className="t-meta venue-shared">Same list as {sharesWith.name}.</p>
      )}
      {/* A venue the guest made can be changed, and the control sits directly under the block that
          states what this venue is, because that is exactly what editing changes; under the drink
          list it would be separated from the facts it edits. Its own wrapper div, because
          .row:not(:only-child) (base.css) would otherwise square the one untinted row in a sheet
          whose other controls are all radius 12. A published venue shows no such row. */}
      {mine && (
        <div>
          <button
            type="button"
            className="row pressable venue-edit"
            aria-haspopup="dialog"
            onClick={() => setEditing(true)}
          >
            <span className="t-body">Edit this venue</span>
          </button>
        </div>
      )}

      {/* Space separates the switch from the facts above and the list below; a hairline in a sheet
          is for rows in a list, never for fencing a group. */}
      <div className="venue-visit">
        <Switch
          checked={visited}
          onChange={() => toggleVisit(venueKey)}
          label="Visited"
          labelId="venue-visit-label"
        />
      </div>

      {/* The count is text alone: the row behind this sheet shows it and every drink below carries
          its own tried check, so a meter would be the same number a third time. With no drinks there
          is no count to give, because "0 of 0" is a structural zero. */}
      {menu.length ? (
        <>
          <p className="t-meta tnum venue-progress">{done} of {menu.length} tried</p>
          <div className="dlist venue-drinks">
            {menu.map((d) => <DrinkCard key={d.id} d={d} onOpen={setOpenId} />)}
          </div>
        </>
      ) : (
        <p className="t-meta venue-progress">No drinks here yet.</p>
      )}
    </Sheet>
  )
}
