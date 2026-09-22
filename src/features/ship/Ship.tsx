import { useEffect, useMemo, useState } from 'react'
import { activeCruiseId } from '../../data/cruises'
import { DECKS, VENUES, VENUE_KEYS, deckLabel, menuFor } from '../../data/model'
import { sailingById } from '../../data/sailings'
import { useAllDrinks, useStore } from '../../state/store'
import { SailingSheet } from '../cruise/SailingSheet'
import { GlassButton } from '../../ui/GlassButton'
import { IconCheck, IconChevron } from '../../ui/Icon'
import { VenueForm } from './VenueForm'
import { VenueSheet } from './VenueSheet'
// social.css owns .crew-go, the chevron colour on the row this screen's foot action copies. Taken
// rather than reproduced, exactly as NameFields takes friends.css for the classes it reuses: a
// second chevron class doing the same job is the divergent sibling canonical-patterns stops.
import '../social/social.css'
import './ship.css'

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
  const decks = useMemo(() => DECKS.slice().reverse().map((deck) => ({
    deck,
    keys: VENUE_KEYS.filter((key) => VENUES[key].deck === deck),
  })), [])

  return (
    <div className="wrap page ship-page">
      <h1 className="t-title">The ship</h1>
      {/* The empty state is the action, as every empty list's is (.empty-state on You). Two lines
          rather than one, because the You lists fill themselves as a side effect of using the app and
          nothing fills this screen except this control, so the second line says what a venue is for;
          and a filled primary, because this is the only way to make the screen exist. Ship spends no coral otherwise, so the cap of one filled control holds.
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
        {decks.map(({ deck, keys }) => (
          <section className="section" key={deck} aria-labelledby={`deck-${deck}`}>
            {/* the deck heading is the deck alone, per DESIGN.md: "Deck 17". The rows beneath carry
                the counts and Stats' "Where you have been" carries completion by deck; a count here
                also counted a shared list once while the rows beneath counted it twice. */}
            <h2 className="t-h2" id={`deck-${deck}`}>Deck {deckLabel(deck)}</h2>
            {keys.map((key) => {
              const venue = VENUES[key]
              const menu = menuFor(key, drinks)
              const tried = menu.filter((d) => entries[d.id]?.tried).length
              // A venue with no drinks shows its name alone, because "0 of 0" is a structural zero.
              // The bar draws only once something is tried: an empty track says nothing the count at
              // the right does not.
              const count = menu.length ? `, ${tried} of ${menu.length} tried` : ''
              return (
                <button
                  key={key}
                  className="row venue-row"
                  onClick={() => setOpenVenue(key)}
                  aria-label={`${venue.name}${count}${visits[key]?.visited ? ', visited' : ''}`}
                >
                  <span className="row-copy">
                    <span className="venue-line">
                      <span className="t-body venue-name">{venue.name}</span>
                      {visits[key]?.visited && <IconCheck className="venue-visited" size={15} filled />}
                    </span>
                    {tried > 0 && (
                      <span className="meter" aria-hidden>
                        <span style={{ width: `${(tried / menu.length) * 100}%` }} />
                      </span>
                    )}
                  </span>
                  {menu.length > 0 && <span className="t-meta tnum venue-count">{tried} of {menu.length}</span>}
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
            </span>
            <IconChevron className="crew-go" />
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
