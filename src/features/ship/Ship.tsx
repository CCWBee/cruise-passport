import { useEffect, useMemo, useState } from 'react'
import { activeCruiseId } from '../../data/cruises'
import { DECKS, VENUES, VENUE_KEYS, deckLabel, menuFor, type Drink } from '../../data/model'
import { sailingById } from '../../data/sailings'
import { useAllDrinks, useStore } from '../../state/store'
import { SailingSheet } from '../cruise/SailingSheet'
import { GlassButton } from '../../ui/GlassButton'
import { IconCheck, IconChevron } from '../../ui/Icon'
import { VenueForm } from './VenueForm'
import { VenueSheet } from './VenueSheet'
// social.css owns .social-go, the chevron colour on the row this screen's foot action copies. Taken
// rather than reproduced, exactly as NameFields takes friends.css for the classes it reuses: a
// second chevron class doing the same job is the divergent sibling canonical-patterns stops.
import '../social/social.css'
import './ship.css'

function uniqueMenu(keys: string[], drinks: Drink[]) {
  return Array.from(new Map(keys.flatMap((key) => menuFor(key, drinks)).map((d) => [d.id, d])).values())
}

export function Ship() {
  const drinks = useAllDrinks()
  const entries = useStore((s) => s.me.entries)
  const visits = useStore((s) => s.me.visits)
  const [openVenue, setOpenVenue] = useState<string | null>(null)
  const [addVenue, setAddVenue] = useState(false)
  const [changeSailing, setChangeSailing] = useState(false)
  // The catalogue was built from this id (cruises.ts), so the venues written here land in the record
  // the next load reads back. A sailing found in spcc-sailings is one the guest set up; the
  // published sailing is not in there, so it is never offered a new name, new dates or a delete.
  const cruiseId = activeCruiseId()
  const sailing = sailingById(cruiseId)
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
      {/* The empty state is the action, as the Badges screen does it (Badges.tsx). Two lines rather
          than one, because Badges' list fills itself as a side effect of using the app and nothing
          fills this screen except this control, so the second line says what a venue is for; and a
          filled primary rather than a text link, because this is the only way to make the screen
          exist. Ship spends no coral otherwise, so the cap of one filled control holds.
          It and the foot row carry the same class, because they are the same action and QA clicks
          one selector, and they never render together: with no venues DECKS is empty, so no deck
          section renders and the foot row is not reached. */}
      {VENUE_KEYS.length === 0 && (
        <div className="ship-empty">
          <p className="t-body">Your sailing has no venues yet.</p>
          <p className="t-meta">Add the bars, cafés and restaurants you will drink at.</p>
          <GlassButton variant="primary" className="ship-add" aria-haspopup="dialog" onClick={() => setAddVenue(true)}>
            Add a venue
          </GlassButton>
        </div>
      )}
      <div className="ship-decks" aria-label="Venues by deck, highest to lowest">
        {decks.map(({ deck, keys, total, done }) => (
          <section className="section" key={deck} aria-labelledby={`deck-${deck}`}>
            {/* the deck heading is one plain line, per DESIGN.md: "Deck 17 · 6 of 65". The unit is
                carried in text a screen reader reads rather than an aria-label on a bare span. */}
            <h2 className="t-h2 tnum" id={`deck-${deck}`}>
              Deck {deckLabel(deck)} · {done} of {total}<span className="sr-only"> drinks tried</span>
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
      {/* One row after the last deck, below the fold, which is where a rare action belongs on a
          screen opened for its list. It is Crew's "Set up a group" row (Social.tsx) exactly, chevron
          and all. It will be the one rounded row on Ship and that is the intent: base.css squares
          any row with siblings, so the venue rows inside each deck section are square-cornered;
          alone in its own section this one keeps radius 12, because it is not another venue and
          should not read as one. The section carries no heading: a heading over a single action
          would name the action twice. No new colour, so the screen's coral budget stays unspent. */}
      {VENUE_KEYS.length > 0 && (
        <section className="section">
          <button
            type="button"
            className="row pressable ship-add"
            aria-haspopup="dialog"
            onClick={() => setAddVenue(true)}
          >
            <span className="row-copy">
              <span className="t-body">Add a venue</span>
              <span className="t-meta">Bars, cafés and restaurants on this ship</span>
            </span>
            <IconChevron className="social-go" />
          </button>
        </section>
      )}
      {/* The sailing's name and dates are what this screen is about, and changing them is rare, so
          the registered shape for the quietest text action at a screen's foot is what carries it. It
          spends no colour, and it renders on a sailing the guest set up only. It sits outside the
          foot row's section, so neither of the two squares the other's corners. */}
      {sailing && (
        <button
          type="button"
          className="quiet-action ship-sailing"
          aria-haspopup="dialog"
          onClick={() => setChangeSailing(true)}
        >
          Change this sailing
        </button>
      )}
      {openVenue && <VenueSheet venueKey={openVenue} onClose={() => setOpenVenue(null)} />}
      {addVenue && <VenueForm cruiseId={cruiseId} onClose={() => setAddVenue(false)} />}
      {changeSailing && sailing && <SailingSheet sailing={sailing} onClose={() => setChangeSailing(false)} />}
    </div>
  )
}
