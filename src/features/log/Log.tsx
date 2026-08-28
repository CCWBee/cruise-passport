import { useMemo, useState } from 'react'
import { DAYS, VENUES, prettyDay } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { computeStats } from '../../state/stats'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { IconStar } from '../../ui/Icon'
import './log.css'

export function Log() {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const stats = useMemo(() => computeStats(drinks, me), [drinks, me])
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="wrap page log-page">
      <p className="log-lead muted tnum">Fifteen days · 3 to 17 October</p>
      <div className="log-days reveal">
        {DAYS.map((iso, i) => {
          const dayDrinks = stats.byDay[iso] || []

          return (
            <section className={`log-day glass${dayDrinks.length ? ' has-drinks' : ' empty'}`} key={iso}>
              <div className="log-day-head">
                <div className="log-day-title">
                  <strong className="t-strong tnum">Day {i + 1}</strong>
                  <span className="log-date muted tnum">{prettyDay(iso)}</span>
                </div>
                <span className="log-count tnum">{dayDrinks.length ? dayDrinks.length : '–'}</span>
              </div>

              {dayDrinks.length ? (
                <div className="log-drinks">
                  {dayDrinks.map((drink) => {
                    const rating = me.entries[drink.id]?.rating || 0

                    return (
                      <button
                        className="log-drink pressable"
                        key={drink.id}
                        type="button"
                        onClick={() => setOpenId(drink.id)}
                      >
                        <span className="log-drink-copy">
                          <strong>{drink.name}</strong>
                          <span className="log-venue muted">{VENUES[drink.venue]?.name || drink.venue}</span>
                        </span>
                        {rating ? (
                          <span className="log-rating tnum" aria-label={`Rated ${rating} out of 5 stars`}>
                            <IconStar size={15} filled />
                            {rating}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </div>
  )
}
