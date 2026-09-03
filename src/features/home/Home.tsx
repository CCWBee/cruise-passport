import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SeaHero } from './SeaHero'
import { useStore, useAllDrinks } from '../../state/store'
import { computeStats } from '../../state/stats'
import { DAYS, START, today, VENUES } from '../../data/model'
import { useCountUp } from '../../ui/useCountUp'
import { IconStar } from '../../ui/Icon'
import { DrinkSheet } from '../drinks/DrinkSheet'
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
  const [openId, setOpenId] = useState<string | null>(null)
  const s = useMemo(() => computeStats(drinks, me), [drinks, me])
  const pct = Math.min(100, s.pct)
  const pctShown = useCountUp(pct)
  const cd = countdown()
  const best = s.best
  const bestRating = best ? me.entries[best.id]?.rating || 0 : 0

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
        <p className="sea-count glass-live">{cd.text}</p>
        <div className="sea-readout glass-live">
          <div className="sea-pct tnum">{pctShown.toFixed(0)}<small>%</small></div>
          <p className="sea-sub">{s.n} of {s.total}<br />tried</p>
        </div>
      </div>

      <div className="facts">
        <Fact value={s.total - s.n} label="drinks to go" />
        <Fact value={s.streak} label="day streak" />
        <Fact value={`${s.bars} of ${s.barsTotal}`} label="bars visited" />
      </div>

      <section className="section">
        <div className="section-head"><h2 className="t-h2">Right now</h2></div>

        {best ? (
          <button
            type="button"
            className="row pressable home-top-drink"
            onClick={() => setOpenId(best.id)}
          >
            {topDrink}
          </button>
        ) : (
          <Link
            to="/drinks"
            className="row pressable home-top-drink"
            viewTransition
            aria-label="No top drink yet, rate a drink"
          >
            {topDrink}
          </Link>
        )}

        <Link
          to="/ship"
          className="row pressable home-row"
          viewTransition
          aria-label={s.favVenue ? `${drinkVenue(s.favVenue)}, open the ship` : 'Open the ship'}
        >
          <span className="row-copy">
            <span className="t-strong">{s.favVenue ? drinkVenue(s.favVenue) : 'No top bar yet'}</span>
            <span className="t-meta">
              {s.favVenue ? `${s.favVenueN} drinks logged` : 'Log a drink to start ranking'}
            </span>
          </span>
        </Link>
      </section>

      <WrappedTeaser />

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </div>
  )
}
