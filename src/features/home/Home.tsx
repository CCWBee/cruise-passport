import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SeaHero } from './SeaHero'
import { useStore, useAllDrinks } from '../../state/store'
import { computeStats } from '../../state/stats'
import { DAYS, START, today, VENUES } from '../../data/model'
import { useCountUp } from '../../ui/useCountUp'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { WrappedTeaser } from '../wrapped/WrappedTeaser'
import { FriendsCard } from './FriendsCard'
import './home.css'

const drinkVenue = (key: string) => VENUES[key]?.name || key

function countdown(): { text: ReactNode } {
  const i = DAYS.indexOf(today())
  if (i > -1) return { text: <>Day <b>{i + 1}</b> of 15 aboard</> }
  const d = Math.ceil((+new Date(START + 'T00:00:00') - +new Date(today() + 'T00:00:00')) / 86400000)
  if (d > 0) return { text: <><b>{d}</b> sleeps to go</> }
  return { text: <>Voyage complete</> }
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="stat">
      <div className="stat-v tnum">{value}</div>
      <div className="stat-l">{label}</div>
    </div>
  )
}

function CountStat({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value, 600)
  return <Stat value={Math.round(shown)} label={label} />
}

export function Home() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const [openId, setOpenId] = useState<string | null>(null)
  const s = useMemo(() => computeStats(drinks, me), [drinks, me])
  const pct = Math.min(100, s.pct)
  const pctShown = useCountUp(pct)
  const cd = countdown()

  return (
    <div className="wrap page home reveal">
      <div className="home-hero">
        <SeaHero level={pct / 100} />
        <div className="sea-count">{cd.text}</div>
        <div className="sea-readout">
          <div className="sea-pct tnum">{pctShown.toFixed(1)}<small>%</small></div>
          <div className="sea-sub">{s.n} of {s.total}<br />sipped</div>
        </div>
      </div>

      <WrappedTeaser />

      <div className="stat-grid glass">
        <CountStat value={s.n} label="tried" />
        <CountStat value={s.total - s.n} label="to go" />
        <CountStat value={s.streak} label="day streak" />
        <Stat value={`${s.bars}/${s.barsTotal}`} label="bars" />
        <Stat value={`${s.rest}/${s.restTotal}`} label="restaurants" />
        <Stat value={s.avg ? s.avg.toFixed(1) : '–'} label="avg rating" />
      </div>

      <div className="two">
        <button
          type="button"
          className="glass card home-card pressable"
          disabled={!s.best}
          onClick={() => s.best && setOpenId(s.best.id)}
        >
          <span className="eyebrow">Top drink</span>
          {s.best ? (
            <>
              <span className="home-card-title t-strong">{s.best.name}</span>
              <span className="home-card-sub t-meta">
                <span className="hc-stars" aria-label={`${me.entries[s.best.id]?.rating || 0} out of 5`}>
                  {'★'.repeat(me.entries[s.best.id]?.rating || 0)}
                </span>
                <span>· {drinkVenue(s.best.venue)}</span>
              </span>
            </>
          ) : (
            <span className="muted t-body">Rate something and it lands here.</span>
          )}
        </button>
        <Link
          to="/ship"
          className="glass card home-card pressable"
          viewTransition
          aria-label={s.favVenue ? `${drinkVenue(s.favVenue)}, open the ship` : 'Open the ship'}
        >
          <span className="eyebrow">Top bar</span>
          {s.favVenue ? (
            <>
              <span className="home-card-title t-strong">{drinkVenue(s.favVenue)}</span>
              <span className="home-card-sub t-meta">{s.favVenueN} drinks</span>
            </>
          ) : (
            <span className="muted t-body">Log a drink to start ranking.</span>
          )}
        </Link>
      </div>

      <FriendsCard />
      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </div>
  )
}
