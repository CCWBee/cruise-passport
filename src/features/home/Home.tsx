import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SeaHero } from './SeaHero'
import { useStore, useAllDrinks } from '../../state/store'
import {
  computeStats, nextBadge, countOn, lastVenueOn, venueProgress, biggestBar, deckCount,
  type NextBadge,
} from '../../state/stats'
import { useSources } from '../../state/social'
import { DAYS, START, today, VENUES } from '../../data/model'
import { useCountUp } from '../../ui/useCountUp'
import { IconStar } from '../../ui/Icon'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { VenueSheet } from '../ship/VenueSheet'
import { WrappedTeaser } from '../wrapped/WrappedTeaser'
import './home.css'

const drinkVenue = (key: string) => VENUES[key]?.name || key

function countdown(): { text: ReactNode } {
  const i = DAYS.indexOf(today())
  if (i > -1) return { text: <>Day <b>{i + 1}</b> of 15 aboard</> }
  const d = Math.ceil((+new Date(START + 'T00:00:00') - +new Date(today() + 'T00:00:00')) / 86400000)
  if (d > 0) return { text: <>Sails in <b>{d}</b> day{d === 1 ? '' : 's'}</> }
  return { text: <>Voyage complete</> }
}

// The remainder said in the badge's own unit, so the line reads as a sentence ("2 more gins").
// An id with no unit here is a percentage badge and is measured in per cent.
const BADGE_UNIT: Record<string, [string, string]> = {
  first: ['drink', 'drinks'], ten: ['drink', 'drinks'], twentyfive: ['drink', 'drinks'],
  fifty: ['drink', 'drinks'], hundred: ['drink', 'drinks'], onefifty: ['drink', 'drinks'],
  twohundred: ['drink', 'drinks'], everybar: ['venue', 'venues'],
  // "whiskey": the badge covers American whiskey and bourbon and its sheet is spelled that way,
  // so the row and the sheet it opens use one spelling.
  coffee: ['coffee cocktail', 'coffee cocktails'], whiskey: ['whiskey', 'whiskeys'],
  gin: ['gin', 'gins'], rum: ['rum', 'rums'], wine: ['wine', 'wines'],
}
function badgeRemainder(nb: NextBadge): string {
  const left = Math.max(1, nb.need - nb.cur)
  const unit = BADGE_UNIT[nb.badge.id]
  if (!unit) return `${left}% more of the list`
  return `${left} more ${left === 1 ? unit[0] : unit[1]}`
}

function Fact({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="fact">
      <div className="fact-v tnum">{value}</div>
      <div className="fact-l">{label}</div>
    </div>
  )
}

export function Home() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const srcs = useSources()
  const [openId, setOpenId] = useState<string | null>(null)
  const [openVenue, setOpenVenue] = useState<string | null>(null)
  const s = useMemo(() => computeStats(drinks, me), [drinks, me])
  const pct = Math.min(100, s.pct)
  const pctShown = useCountUp(pct)
  const cd = countdown()
  const day = today()
  const aboard = DAYS.indexOf(day) > -1
  const best = s.best
  const bestRating = best ? me.entries[best.id]?.rating || 0 : 0

  // ── the bar module. Aboard it is the venue of the last drink written today; with nothing
  // written today it falls back to the bar with most logged, and before sailing to the longest
  // list. Nothing here is inferred from the clock: a wrong bar called yours is a lie.
  const lastVenue = aboard ? lastVenueOn(drinks, me, day) : null
  const barKey = lastVenue || (aboard ? s.favVenue : null) || biggestBar(drinks)
  const barHead = lastVenue ? 'Last bar' : aboard && s.favVenue ? 'Your top bar' : 'Where to start'
  const bar = useMemo(
    () => (barKey ? venueProgress(drinks, me, barKey) : null),
    [drinks, me, barKey],
  )

  // ── up next: the badge nearest to earned, measured the way the Badges screen measures it
  const nb = useMemo(() => nextBadge(s.badgeStat), [s.badgeStat])
  // the top bar row is dropped when the module above already names that venue
  const showTopBar = !!s.favVenue && s.favVenue !== barKey

  // ── the crew line: today's count where there is one, the roster where there is not
  const crew = srcs.filter((x) => !x.isSelf)
  const crewTop = crew
    .map((x) => ({ name: x.name, n: countOn(x.passport, day) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))[0]
  const crewTried = crew.reduce(
    (a, x) => a + Object.keys(x.passport.entries).filter((id) => x.passport.entries[id]?.tried).length,
    0,
  )
  const crewNames = crew.map((x) => x.name)
  const crewRoster = crewNames.length < 3
    ? crewNames.join(' and ')
    : `${crewNames[0]} and ${crewNames.length - 1} others`
  const crewLine = crewTop && crewTop.n > 0 ? `${crewTop.name} logged ${crewTop.n} today` : crewRoster

  // the top drink: a row either way. With a rating it opens the sheet; empty, it goes to the
  // list that fills it, so the empty state ships the one action that ends it.
  const topDrink = (
    <span className="row-copy">
      <span className="t-strong">{best ? best.name : 'No top drink yet'}</span>
      <span className="t-meta">
        {best ? (
          <>
            <span className="home-stars" aria-label={`${bestRating} out of 5`}>
              {Array.from({ length: bestRating }, (_, i) => <IconStar key={i} size={13} filled />)}
            </span>
            {' · '}
            {drinkVenue(best.venue)}
          </>
        ) : 'Rate a drink and it appears here'}
      </span>
    </span>
  )

  return (
    <div className="wrap page home">
      <div className="home-hero">
        <SeaHero level={pct / 100} />
        <p className="sea-count glass-live glass-sm glass-edge">{cd.text}</p>
        <div className="sea-readout glass-live glass-sm glass-edge">
          <div className="sea-pct tnum">{pctShown.toFixed(0)}<small>%</small></div>
          <p className="sea-sub">{s.n} of {s.total}<br />tried</p>
        </div>
        {/* the one primary action on the app, floating on the water where the thumb rests */}
        <Link to="/drinks?log=1" className="sea-log glass-live glass-sm glass-edge glass-coral pressable" viewTransition>
          Log a drink
        </Link>
      </div>

      <section className="section">
        <div className="section-head"><h2 className="t-h2">{aboard ? 'Today' : 'The ship'}</h2></div>
        <div className="facts">
          {aboard ? (
            // Aboard, three numbers that move by the day. "Day n of 15" is not among them: the
            // hero chip already says it.
            <>
              <Fact value={countOn(me, day)} label="logged today" />
              <Fact value={s.streak} label="day streak" />
              <Fact value={`${s.bars} of ${s.barsTotal}`} label="bars visited" />
            </>
          ) : (
            // Before sailing there is no day, no streak and nothing logged, and "drinks to go"
            // is only the hero's own "58 of 214" turned round. So the row describes the ship:
            // three counts that are true and useful on a cold open with an empty passport, and
            // that lead into "Where to start" below.
            <>
              <Fact value={s.barsTotal} label="bars" />
              <Fact value={s.restTotal} label="restaurants" />
              <Fact value={deckCount()} label="decks" />
            </>
          )}
        </div>
      </section>

      {bar && (
        <section className="section">
          <div className="section-head"><h2 className="t-h2">{barHead}</h2></div>
          <button
            type="button"
            className="row pressable"
            onClick={() => setOpenVenue(bar.key)}
            aria-label={`${drinkVenue(bar.key)}, ${bar.done} of ${bar.total} tried here`}
          >
            <span className="row-copy">
              <span className="t-strong">{drinkVenue(bar.key)}</span>
              <span className="t-meta tnum">
                {bar.done} of {bar.total} tried here
                {bar.next ? ` · ${bar.next.name} next` : ''}
              </span>
            </span>
          </button>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="t-h2">Up next</h2></div>

        {nb && (
          <Link
            to={`/badges?badge=${nb.badge.id}`}
            className="row pressable"
            viewTransition
            aria-label={`${nb.badge.name}, ${nb.cur} of ${nb.need}`}
          >
            <span className="row-copy">
              <span className="t-strong">{nb.badge.name}</span>
              <span className="t-meta">{badgeRemainder(nb)}</span>
              {/* the remainder is already in words above, so the bar carries the count for
                  assistive technology only; the row never says the same number twice */}
              <span
                className="meter"
                role="progressbar"
                aria-label={`${nb.cur} of ${nb.need}`}
                aria-valuemin={0}
                aria-valuemax={nb.need}
                aria-valuenow={Math.min(nb.cur, nb.need)}
              >
                <span style={{ width: `${nb.pct}%` }} />
              </span>
            </span>
          </Link>
        )}

        {best ? (
          <button type="button" className="row pressable" onClick={() => setOpenId(best.id)}>
            {topDrink}
          </button>
        ) : (
          <Link
            to="/drinks"
            className="row pressable"
            viewTransition
            aria-label="No top drink yet, rate a drink"
          >
            {topDrink}
          </Link>
        )}

        {/* a bar name opens that bar, here as in the module above: two rows that look the same
            on one screen must not do two different things */}
        {showTopBar && (
          <button
            type="button"
            className="row pressable"
            onClick={() => setOpenVenue(s.favVenue!)}
            aria-label={`${drinkVenue(s.favVenue!)}, ${s.favVenueN} drinks logged`}
          >
            <span className="row-copy">
              <span className="t-strong">{drinkVenue(s.favVenue!)}</span>
              <span className="t-meta tnum">{s.favVenueN} drinks logged</span>
            </span>
          </button>
        )}

        {crew.length > 0 && (
          <Link to="/social" className="row pressable" viewTransition aria-label={`${crewLine}, open your crew`}>
            <span className="row-copy">
              <span className="t-strong">{crewLine}</span>
              <span className="t-meta tnum">{crewTried} drinks logged in your crew</span>
            </span>
          </Link>
        )}
      </section>

      <WrappedTeaser />

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
      {openVenue && <VenueSheet venueKey={openVenue} onClose={() => setOpenVenue(null)} />}
    </div>
  )
}
