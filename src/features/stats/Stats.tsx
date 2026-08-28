import { useMemo, useState, type ReactNode } from 'react'
import { DAYS, DECKS, VENUES, VENUE_KEYS, menuFor, type Drink } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { bestRatedBars, useSources } from '../../state/social'
import { computeStats } from '../../state/stats'
import { IconStar } from '../../ui/Icon'
import { DrinkSheet } from '../drinks/DrinkSheet'
import './stats.css'

const PALETTE = [
  'var(--fruit-melon)',
  'var(--fruit-aqua)',
  'var(--fruit-mango)',
  'var(--fruit-grape)',
  'var(--fruit-lime)',
  'var(--fruit-pine)',
]

type BarRow = { label: string; value: number; total?: number }

function HeadStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="stats-head-cell">
      <strong className="stats-head-value tnum">{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass card stats-chart-card">
      <h2 className="t-h2">{title}</h2>
      {children}
    </section>
  )
}

function compactLabel(label: string) {
  return label.length > 21 ? `${label.slice(0, 19)}...` : label
}

function BarChart({ rows, palette = false, colour = 'var(--sea-hi)', ariaLabel }: {
  rows: BarRow[]
  palette?: boolean
  colour?: string
  ariaLabel: string
}) {
  const rowHeight = 34
  const max = Math.max(1, ...rows.map((row) => row.total ?? row.value))
  const description = rows
    .map((row) => `${row.label} ${row.value}${row.total === undefined ? '' : ` of ${row.total}`}`)
    .join(', ')

  return (
    <svg
      className="stats-bars"
      width="100%"
      height={rows.length * rowHeight}
      role="img"
      aria-label={`${ariaLabel}. ${description}`}
    >
      {rows.map((row, index) => {
        const denominator = row.total ?? max
        const fraction = denominator ? row.value / denominator : 0
        const centre = index * rowHeight + rowHeight / 2
        const fill = palette ? PALETTE[index % PALETTE.length] : colour

        return (
          <g key={row.label}>
            <text className="stats-bar-label" x="0" y={centre + 4}>{compactLabel(row.label)}</text>
            <rect className="stats-bar-track" x="35%" y={centre - 5} width="54%" height="10" rx="5" />
            {row.value > 0 && (
              <rect
                className="stats-bar-fill"
                x="35%"
                y={centre - 5}
                width={`${54 * fraction}%`}
                height="10"
                rx="5"
                fill={fill}
              />
            )}
            <text className="stats-bar-value" x="100%" y={centre + 4} textAnchor="end">
              {row.value}{row.total === undefined ? '' : `/${row.total}`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function CategoryDonut({ rows, total }: { rows: [string, number][]; total: number }) {
  const circumference = 2 * Math.PI * 42
  let used = 0

  return (
    <div className="stats-donut-layout">
      <svg
        className="stats-donut"
        viewBox="0 0 112 112"
        role="img"
        aria-label={`What you drink. ${rows.map(([label, count]) => `${label} ${count}`).join(', ')}`}
      >
        <circle className="stats-donut-bed" cx="56" cy="56" r="42" />
        {rows.map(([label, count], index) => {
          const length = (count / total) * circumference
          const offset = -used
          used += length

          return (
            <circle
              key={label}
              className="stats-donut-segment"
              cx="56"
              cy="56"
              r="42"
              stroke={PALETTE[index % PALETTE.length]}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={offset}
            />
          )
        })}
        <text className="stats-donut-total" x="56" y="54" textAnchor="middle">{total}</text>
        <text className="stats-donut-caption" x="56" y="69" textAnchor="middle">logged</text>
      </svg>

      <div className="stats-legend" aria-hidden="true">
        {rows.map(([label, count], index) => (
          <div className="stats-legend-row" key={label}>
            <i style={{ background: PALETTE[index % PALETTE.length] }} />
            <span>{label}</span>
            <strong className="tnum">{count}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function VoyageChart({ byDay }: { byDay: Record<string, Drink[]> }) {
  const width = 600
  const height = 210
  const left = 12
  const right = 12
  const top = 14
  const bottom = 30
  let running = 0
  const values = DAYS.map((day) => {
    running += byDay[day]?.length || 0
    return running
  })
  const max = Math.max(1, ...values)
  const x = (index: number) => left + (index / (DAYS.length - 1)) * (width - left - right)
  const y = (value: number) => top + (1 - value / max) * (height - top - bottom)
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
  const area = `${left},${height - bottom} ${points} ${width - right},${height - bottom}`

  return (
    <svg
      className="stats-voyage-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Cumulative drinks across the 15-day voyage, ending at ${running}`}
    >
      <defs>
        <linearGradient id="stats-voyage-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sea-hi)" stopOpacity=".3" />
          <stop offset="1" stopColor="var(--sea-lo)" stopOpacity=".03" />
        </linearGradient>
        <linearGradient id="stats-voyage-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--sea-hi)" />
          <stop offset="1" stopColor="var(--sea-lo)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#stats-voyage-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke="url(#stats-voyage-line)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {DAYS.map((day, index) => byDay[day]?.length ? (
        <circle
          key={day}
          cx={x(index)}
          cy={y(values[index])}
          r="4.5"
          fill="var(--glass-fallback)"
          stroke="var(--sea-lo)"
          strokeWidth="2.5"
        />
      ) : null)}
      <text x={left} y={height - 6}>3 Oct</text>
      <text x={width - right} y={height - 6} textAnchor="end">17 Oct</text>
    </svg>
  )
}

function RatingList({ drinks, entries, onOpen }: {
  drinks: Drink[]
  entries: Record<string, { rating?: number }>
  onOpen: (id: string) => void
}) {
  return (
    <div className="stats-rating-list">
      {drinks.map((drink) => {
        const rating = entries[drink.id]?.rating || 0

        return (
          <button
            className="stats-rating-row pressable"
            key={drink.id}
            type="button"
            onClick={() => onOpen(drink.id)}
          >
            <span className="stats-rating-copy">
              <strong>{drink.name}</strong>
              <small>{VENUES[drink.venue]?.name || drink.venue}</small>
            </span>
            <span className="stats-rating-stars" aria-label={`${rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span className={star <= rating ? 'is-filled' : ''} key={star}>
                  <IconStar size={14} filled={star <= rating} />
                </span>
              ))}
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

  const categories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])
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
  const lowest = stats.rated
    .slice()
    .sort((a, b) => (me.entries[a.id]?.rating || 0) - (me.entries[b.id]?.rating || 0) || a.name.localeCompare(b.name))
    .slice(0, 3)

  if (!stats.n) {
    return (
      <div className="wrap page stats-page">
        <div className="glass card center stats-empty">
          <p className="muted">Charts appear once you log your first drink.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap page stats-page">
      <section className="stats-head glass" aria-label="Voyage headline statistics">
        <HeadStat value={`${stats.pct.toFixed(1)}%`} label="complete" />
        <HeadStat value={`${stats.n}/${stats.total}`} label="tried" />
        <HeadStat value={stats.streak} label="day streak" />
        <HeadStat value={stats.avg ? stats.avg.toFixed(1) : '-'} label="avg rating" />
      </section>

      <ChartCard title="Completion by deck">
        <BarChart rows={deckRows} ariaLabel="Completion by deck" />
      </ChartCard>

      <ChartCard title="What you drink">
        <CategoryDonut rows={categories} total={stats.n} />
      </ChartCard>

      <ChartCard title="Across the voyage">
        <VoyageChart byDay={stats.byDay} />
      </ChartCard>

      <ChartCard title="Most visited bars">
        <BarChart rows={venues} palette ariaLabel="Most visited bars" />
      </ChartCard>

      {friends.length > 0 && bars.length > 0 && (
        <ChartCard title="Best rated bars · you and friends">
          <div className="stats-rating-list">
            {bars.map((bar) => (
              <div className="stats-rating-row" key={bar.venueKey}>
                <span className="stats-rating-copy">
                  <strong>{bar.name}</strong>
                  <small>{bar.count} ratings</small>
                </span>
                <span className="stats-rating-stars tnum">
                  <IconStar size={14} filled /> {bar.avg.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {spirits.length > 0 && (
        <ChartCard title="Favourite spirit">
          <BarChart rows={spirits} palette ariaLabel="Favourite spirits, excluding wine and beer" />
        </ChartCard>
      )}

      {highest.length > 0 && (
        <ChartCard title="Highest rated">
          <RatingList drinks={highest} entries={me.entries} onOpen={setOpenId} />
        </ChartCard>
      )}

      {lowest.length > 0 && (
        <ChartCard title="Lowest rated">
          <RatingList drinks={lowest} entries={me.entries} onOpen={setOpenId} />
        </ChartCard>
      )}

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </div>
  )
}
