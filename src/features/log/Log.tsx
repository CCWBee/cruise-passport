import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DAYS, prettyDay } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { computeStats } from '../../state/stats'
import { glassFamily } from '../../data/glass'
import { GlassIcon, IconStar } from '../../ui/Icon'
import { DrinkSheet } from '../drinks/DrinkSheet'
import './log.css'

// The log renders inside the You page, so it adds no wrapper of its own: one plain section per day,
// a heading with its date and count, then rows on the ground separated by hairlines. A row is the
// drink and its rating on one line; the bar is the drink sheet's meta line, one tap away. Days after
// the last logged one collapse to a single line so the tail of the voyage does not scroll as filler.
export function Log() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const stats = useMemo(() => computeStats(drinks, me), [drinks, me])
  const [openId, setOpenId] = useState<string | null>(null)

  let lastLogged = -1
  for (let i = DAYS.length - 1; i >= 0; i--) {
    if ((stats.byDay[DAYS[i]] || []).length) { lastLogged = i; break }
  }
  const restFrom = lastLogged + 2 // the first day number in the collapsed trailing run

  return (
    <>
      {lastLogged < 0 ? (
        <div className="empty-state">
          <p className="t-body">Nothing logged yet.</p>
          <Link className="btn btn-coral" to="/drinks">Log a drink</Link>
        </div>
      ) : null}

      {DAYS.slice(0, lastLogged + 1).map((iso, i) => {
        const dayDrinks = stats.byDay[iso] || []
        const dayLabelId = `log-day-${i + 1}`
        const dateId = `log-date-${i + 1}`

        return (
          <section
            className={`section${i === 0 ? ' log-first' : ''}`}
            key={iso}
            aria-labelledby={`${dayLabelId} ${dateId}`}
          >
            <div className="section-head">
              <div className="log-head">
                <h2 className="t-h2 tnum" id={dayLabelId}>Day {i + 1}</h2>
                <span className="t-meta" aria-hidden>·</span>
                <span className="t-meta tnum" id={dateId}>{prettyDay(iso)}</span>
              </div>
              {dayDrinks.length ? (
                <span
                  className="t-meta tnum"
                  aria-label={`${dayDrinks.length} drink${dayDrinks.length === 1 ? '' : 's'}`}
                >
                  {dayDrinks.length}
                </span>
              ) : null}
            </div>

            {dayDrinks.length ? dayDrinks.map((drink) => {
              const rating = me.entries[drink.id]?.rating || 0

              return (
                <button
                  className="row pressable log-row"
                  key={drink.id}
                  type="button"
                  onClick={() => setOpenId(drink.id)}
                >
                  <GlassIcon family={glassFamily(drink)} className="row-lead" />
                  <span className="row-copy">
                    <span className="t-body">{drink.name}</span>
                  </span>
                  {rating ? (
                    <span className="log-rating tnum" aria-label={`Rated ${rating} out of 5 stars`}>
                      <IconStar size={16} filled />
                      {rating}
                    </span>
                  ) : null}
                </button>
              )
            }) : (
              <p className="t-meta">Nothing logged</p>
            )}
          </section>
        )
      })}

      {lastLogged >= 0 && restFrom <= DAYS.length ? (
        <p className="t-meta tnum log-rest">
          {restFrom === DAYS.length ? `Day ${DAYS.length}` : `Days ${restFrom} to ${DAYS.length}`} · nothing logged yet
        </p>
      ) : null}

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
