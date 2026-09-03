import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DAYS, DECKS, VENUES, VENUE_KEYS, menuFor, type Drink } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { bestRatedBars, useSources } from '../../state/social'
import { computeStats } from '../../state/stats'
import { IconStar } from '../../ui/Icon'
import { DrinkSheet } from '../drinks/DrinkSheet'
import './stats.css'

const dayLabel = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

// A named question, answered by rows. No box: the heading and the hairlines do the grouping.
function CountRows({ rows, ariaLabel }: { rows: { label: string; value: number }[]; ariaLabel: string }) {
  return (
    <div className="stats-list" role="list" aria-label={ariaLabel}>
      {rows.map((row) => (
        <div className="stats-line" role="listitem" key={row.label}>
          <span className="stats-line-label t-body">{row.label}</span>
          <span className="stats-line-value t-body tnum">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

// Completion by deck: the count carries the fact, the bar carries the shape. No track behind it.
function DeckBars({ rows }: { rows: { label: string; value: number; total: number }[] }) {
  return (
    <div className="stats-decks">
      {rows.map((row) => (
        <div className="stats-deck" key={row.label}>
          <div className="stats-deck-head">
            <span className="t-body">{row.label}</span>
            <span className="t-meta tnum">{row.value} of {row.total}</span>
          </div>
          <div className="stats-deck-bar" aria-hidden="true">
            {row.value > 0 && row.total > 0 && (
              <span style={{ width: `${(row.value / row.total) * 100}%` }} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Axis labels live in HTML so they stay at a true 12px whatever the plot is stretched to.
function VoyageChart({ byDay }: { byDay: Record<string, Drink[]> }) {
  const width = 300
  const height = 100
  const values = DAYS.map((day) => byDay[day]?.length || 0)
  const max = Math.max(1, ...values)
  // The plot is inset by the stroke at both ends, so the 2px line never overdraws the axis hairline
  // and a run of empty days reads as a line just above the axis rather than as the axis itself.
  const top = 1
  const base = height - 3
  const x = (index: number) => (index / (DAYS.length - 1)) * width
  const y = (value: number) => base - (value / max) * (base - top)
  const line = `M ${values.map((value, index) => `${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(' L ')}`
  const description = values.map((value, index) => `${dayLabel(DAYS[index])} ${value}`).join(', ')

  return (
    <div className="stats-chart">
      <div className="stats-chart-y" aria-hidden="true">
        <span className="t-micro tnum">{max}</span>
        <span className="t-micro tnum">0</span>
      </div>
      <svg
        className="stats-chart-plot"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Drinks logged per day. ${description}`}
      >
        <path
          d={line}
          fill="none"
          stroke="var(--sea-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span />
      <div className="stats-chart-x" aria-hidden="true">
        <span className="t-micro tnum">{dayLabel(DAYS[0])}</span>
        <span className="t-micro tnum">{dayLabel(DAYS[DAYS.length - 1])}</span>
      </div>
    </div>
  )
}

function RatedRows({ drinks, entries, onOpen }: {
  drinks: Drink[]
  entries: Record<string, { rating?: number }>
  onOpen: (id: string) => void
}) {
  return (
    <div className="stats-list">
      {drinks.map((drink) => {
        const rating = entries[drink.id]?.rating || 0

        return (
          <button
            className="row pressable stats-rated"
            key={drink.id}
            type="button"
            onClick={() => onOpen(drink.id)}
          >
            <span className="row-copy">
              <span className="t-body">{drink.name}</span>
              <span className="t-meta">{VENUES[drink.venue]?.name || drink.venue}</span>
            </span>
            <span className="stats-star tnum" aria-label={`${rating} out of 5 stars`}>
              <IconStar size={16} filled />
              {rating}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Stats() {
  const drinks = useAllDrinks()
  const me = useStore((state) => state.me)
  const friends = useStore((state) => state.friends)
  const srcs = useSources()
  const [openId, setOpenId] = useState<string | null>(null)
  const stats = useMemo(() => computeStats(drinks, me), [drinks, me])
  const bars = useMemo(() => bestRatedBars(srcs, { minRatings: 2, barsOnly: true }).slice(0, 6), [srcs])

  const deckRows = useMemo(() => DECKS.slice().reverse().map((deck) => {
    const deckDrinks = new Map(
      VENUE_KEYS
        .filter((key) => VENUES[key].deck === deck)
        .flatMap((key) => menuFor(key, drinks))
        .map((drink) => [drink.id, drink]),
    )
    const menu = Array.from(deckDrinks.values())

    return {
      label: `Deck ${deck}`,
      value: menu.filter((drink) => me.entries[drink.id]?.tried).length,
      total: menu.length,
    }
  }), [drinks, me.entries])

  const categories = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }))
  const venues = Object.entries(stats.byVenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, value]) => ({ label: VENUES[key]?.name || key, value }))
  const spirits = Object.entries(stats.bySpirit)
    .filter(([name]) => name !== 'Wine' && name !== 'Beer')
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }))
  const highest = stats.rated
    .slice()
    .sort((a, b) => (me.entries[b.id]?.rating || 0) - (me.entries[a.id]?.rating || 0) || a.name.localeCompare(b.name))
    .slice(0, 5)
  // A drink never appears in both lists: with only a few ratings, "Lowest rated" simply does not show.
  const top5 = new Set(highest.map((drink) => drink.id))
  const lowest = stats.rated
    .slice()
    .filter((drink) => !top5.has(drink.id))
    .sort((a, b) => (me.entries[a.id]?.rating || 0) - (me.entries[b.id]?.rating || 0) || a.name.localeCompare(b.name))
    .slice(0, 3)
  const crewBars = friends.length > 0 && bars.length > 0
  const noVerdict = highest.length === 0 && !crewBars

  if (!stats.n) {
    return (
      <div className="stats stats-empty">
        <p className="t-body">Your stats appear once you log a drink.</p>
        <Link className="btn btn-coral" to="/drinks">Log a drink</Link>
      </div>
    )
  }

  return (
    <div className="stats">
      <section className="section">
        <h2 className="t-h2">Where you have been</h2>
        <DeckBars rows={deckRows} />
        {venues.length > 0 && (
          <>
            <h3 className="t-strong stats-sub">Bars you drink at most</h3>
            <CountRows rows={venues} ariaLabel="Bars you drink at most, drinks tried at each" />
          </>
        )}
      </section>

      <section className="section">
        <h2 className="t-h2">What you drink</h2>
        <h3 className="t-strong stats-sub">Categories</h3>
        <CountRows rows={categories} ariaLabel="Drinks tried by category" />
        {spirits.length > 0 && (
          <>
            <h3 className="t-strong stats-sub">Spirits</h3>
            <CountRows rows={spirits} ariaLabel="Drinks tried by spirit, excluding wine and beer" />
          </>
        )}
      </section>

      <section className="section">
        <h2 className="t-h2">Best and worst</h2>
        {noVerdict && <p className="t-meta">Rate a drink to see your best and worst.</p>}
        {highest.length > 0 && (
          <>
            <h3 className="t-strong stats-sub">Highest rated</h3>
            <RatedRows drinks={highest} entries={me.entries} onOpen={setOpenId} />
          </>
        )}
        {lowest.length > 0 && (
          <>
            <h3 className="t-strong stats-sub">Lowest rated</h3>
            <RatedRows drinks={lowest} entries={me.entries} onOpen={setOpenId} />
          </>
        )}
        {crewBars && (
          <>
            <h3 className="t-strong stats-sub">Best rated bars, you and your crew</h3>
            <div className="stats-list">
              {bars.map((bar) => (
                <div className="stats-line" key={bar.venueKey}>
                  <span className="row-copy">
                    <span className="t-body">{bar.name}</span>
                    <span className="t-meta tnum">{bar.count} ratings</span>
                  </span>
                  <span className="stats-star tnum" aria-label={`${bar.avg.toFixed(1)} out of 5 stars`}>
                    <IconStar size={16} filled />
                    {bar.avg.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="section">
        <h2 className="t-h2">Drinks logged per day</h2>
        <VoyageChart byDay={stats.byDay} />
      </section>

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </div>
  )
}
