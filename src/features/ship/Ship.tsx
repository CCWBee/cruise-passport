import { useEffect, useMemo, useState } from 'react'
import { DECKS, VENUES, VENUE_KEYS, menuFor, type Drink } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { IconCheck } from '../../ui/Icon'
import { VenueSheet } from './VenueSheet'
import './ship.css'

function uniqueMenu(keys: string[], drinks: Drink[]) {
  return Array.from(new Map(keys.flatMap((key) => menuFor(key, drinks)).map((d) => [d.id, d])).values())
}

export function Ship() {
  const drinks = useAllDrinks()
  const entries = useStore((s) => s.me.entries)
  const visits = useStore((s) => s.me.visits)
  const [openVenue, setOpenVenue] = useState<string | null>(null)
  // deep link: /ship?venue=<key> opens that venue (also used for QA)
  useEffect(() => {
    const k = new URLSearchParams(location.search).get('venue')
    if (k && VENUES[k]) setOpenVenue(k)
  }, [])
  const decks = useMemo(() => DECKS.slice().reverse().map((deck) => {
    const keys = VENUE_KEYS.filter((key) => VENUES[key].deck === deck)
    const menu = uniqueMenu(keys, drinks)
    return { deck, keys, total: menu.length, done: menu.filter((d) => entries[d.id]?.tried).length }
  }), [drinks, entries])

  return (
    <div className="wrap page ship-page">
      <h1 className="t-title">The ship</h1>
      <p className="page-lead t-meta">Bars and cafés, from the top deck down.</p>
      <div className="ship-decks" aria-label="Venues by deck, highest to lowest">
        {decks.map(({ deck, keys, total, done }) => (
          <section className="section" key={deck} aria-labelledby={`deck-${deck}`}>
            {/* the deck heading is one plain line, per DESIGN.md: "Deck 17 · 6 of 65". The unit is
                carried in text a screen reader reads rather than an aria-label on a bare span. */}
            <h2 className="t-h2 tnum" id={`deck-${deck}`}>
              Deck {deck} · {done} of {total}<span className="sr-only"> drinks tried</span>
            </h2>
            {keys.map((key) => {
              const venue = VENUES[key]
              const menu = menuFor(key, drinks)
              const tried = menu.filter((d) => entries[d.id]?.tried).length
              const pct = menu.length ? (tried / menu.length) * 100 : 0
              return (
                <button
                  key={key}
                  className="row venue-row"
                  onClick={() => setOpenVenue(key)}
                  aria-label={`${venue.name}, ${tried} of ${menu.length} tried${visits[key]?.visited ? ', visited' : ''}`}
                >
                  <span className="row-copy">
                    <span className="venue-line">
                      <span className="t-body venue-name">{venue.name}</span>
                      {visits[key]?.visited && <IconCheck className="venue-visited" size={15} filled />}
                    </span>
                    <span className="meter" aria-hidden>
                      <span style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  <span className="t-meta tnum venue-count">{tried} of {menu.length}</span>
                </button>
              )
            })}
          </section>
        ))}
      </div>
      {openVenue && <VenueSheet venueKey={openVenue} onClose={() => setOpenVenue(null)} />}
    </div>
  )
}
