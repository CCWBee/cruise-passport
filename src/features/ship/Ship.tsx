import { useMemo, useState, type CSSProperties } from 'react'
import { DECKS, VENUES, VENUE_KEYS, menuFor, type Drink } from '../../data/model'
import { bestRatedBars, useSources } from '../../state/social'
import { useAllDrinks, useStore } from '../../state/store'
import { IconCheck, IconLink, IconStar } from '../../ui/Icon'
import { VenueSheet } from './VenueSheet'
import './ship.css'

const DECK_COLOURS = [
  'var(--fruit-melon)',
  'var(--fruit-aqua)',
  'var(--fruit-mango)',
  'var(--fruit-grape)',
  'var(--fruit-lime)',
  'var(--fruit-pine)',
]

const DECK_INSETS = ['9%', '4%', '1%', '0%', '2%', '5%']

type DeckStyle = CSSProperties & {
  '--deck-colour': string
  '--deck-inset': string
}

function uniqueMenu(keys: string[], drinks: Drink[]) {
  return Array.from(new Map(keys.flatMap((key) => menuFor(key, drinks)).map((d) => [d.id, d])).values())
}

export function Ship() {
  const drinks = useAllDrinks()
  const friends = useStore((s) => s.friends)
  const srcs = useSources()
  const entries = useStore((s) => s.me.entries)
  const visits = useStore((s) => s.me.visits)
  const [openVenue, setOpenVenue] = useState<string | null>(null)
  const top = bestRatedBars(srcs, { minRatings: 2 })[0]?.venueKey
  const decks = useMemo(() => DECKS.slice().reverse().map((deck, index) => {
    const keys = VENUE_KEYS.filter((key) => VENUES[key].deck === deck)
    const menu = uniqueMenu(keys, drinks)
    return {
      deck,
      keys,
      total: menu.length,
      done: menu.filter((d) => entries[d.id]?.tried).length,
      style: {
        '--deck-colour': DECK_COLOURS[index],
        '--deck-inset': DECK_INSETS[index],
      } as DeckStyle,
    }
  }), [drinks, entries])

  return (
    <div className="wrap page ship-page">
      <p className="page-lead muted">Bow to stern. Tap a bar to see its list.</p>
      <div className="ship-stack reveal" aria-label="Venues by deck, highest to lowest">
        {decks.map(({ deck, keys, total, done, style }) => (
          <section className="deck-row glass" key={deck} style={style} aria-labelledby={`deck-${deck}`}>
            <div className="deck-plate">
              <span className="deck-label eyebrow">Deck</span>
              <strong className="deck-number tnum" id={`deck-${deck}`}>{deck}</strong>
              <span className="deck-count tnum" aria-label={`${done} of ${total} drinks tried`}>{done}/{total}</span>
            </div>
            <div className="deck-venues">
              <span className="deck-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} aria-hidden />
              {keys.map((key) => {
                const venue = VENUES[key]
                const menu = menuFor(key, drinks)
                const tried = menu.filter((d) => entries[d.id]?.tried).length
                const complete = menu.length > 0 && tried === menu.length
                const state = complete ? ' complete' : tried ? ' partial' : ''
                return (
                  <button
                    key={key}
                    className={`venue-pill pressable${state}${venue.shares ? ' shared' : ''}`}
                    onClick={() => setOpenVenue(key)}
                    aria-label={`${venue.name}, ${tried} of ${menu.length} tried${venue.shares ? ', shared list' : ''}${visits[key]?.visited ? ', visited' : ''}`}
                  >
                    <span className="venue-name">{venue.name}</span>
                    <span className="venue-meta tnum">
                      {venue.shares && <IconLink size={13} />}
                      {friends.length > 0 && key === top && <IconStar className="venue-top-star" size={13} filled />}
                      <span>{tried}/{menu.length}</span>
                      {visits[key]?.visited && <IconCheck size={14} filled />}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      {openVenue && <VenueSheet venueKey={openVenue} onClose={() => setOpenVenue(null)} />}
    </div>
  )
}
