import { useMemo, type ReactNode } from 'react'
import { SeaHero } from './SeaHero'
import { useStore, useAllDrinks } from '../../state/store'
import { computeStats } from '../../state/stats'
import { DAYS, START, today, VENUES } from '../../data/model'
import { useCountUp } from '../../ui/useCountUp'
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

export function Home() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const s = useMemo(() => computeStats(drinks, me), [drinks, me])
  const pct = Math.min(100, s.pct)
  const pctShown = useCountUp(pct)
  const cd = countdown()

  return (
    <div className="wrap page home">
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
        <Stat value={s.n} label="tried" />
        <Stat value={s.total - s.n} label="to go" />
        <Stat value={s.streak} label="day streak" />
        <Stat value={`${s.bars}/${s.barsTotal}`} label="bars" />
        <Stat value={`${s.rest}/${s.restTotal}`} label="restaurants" />
        <Stat value={s.avg ? s.avg.toFixed(1) : '–'} label="avg rating" />
      </div>

      <div className="two">
        <div className="glass card">
          <div className="eyebrow">Top drink</div>
          {s.best ? (
            <>
              <div className="t-strong">{s.best.name}</div>
              <div className="muted t-body" style={{ fontSize: 13 }}>{'★'.repeat(me.entries[s.best.id]?.rating || 0)} · {drinkVenue(s.best.venue)}</div>
            </>
          ) : (
            <p className="muted t-body">Rate something and it lands here.</p>
          )}
        </div>
        <div className="glass card">
          <div className="eyebrow">Top bar</div>
          {s.favVenue ? (
            <>
              <div className="t-strong">{drinkVenue(s.favVenue)}</div>
              <div className="muted t-body" style={{ fontSize: 13 }}>{s.favVenueN} drinks</div>
            </>
          ) : (
            <p className="muted t-body">Log a drink to start ranking.</p>
          )}
        </div>
      </div>

      <FriendsCard />
    </div>
  )
}
