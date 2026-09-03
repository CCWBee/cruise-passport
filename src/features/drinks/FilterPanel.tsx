import { Chip } from '../../ui/Chip'
import { GlassButton } from '../../ui/GlassButton'
import { Segmented, type SegOption } from '../../ui/Segmented'
import { DECKS, SPIRITS, FLAVOURS, CATEGORIES, VENUES, VENUE_KEYS } from '../../data/model'
import { useStore } from '../../state/store'
import type { Filters } from '../../state/store'
import { nChosen, type Counts } from './facets'
import './filterpanel.css'

export function FilterPanel({ counts, resultN, total, constrained }: { counts: Counts; resultN: number; total: number; constrained: boolean }) {
  const f = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const clear = useStore((s) => s.clearFilters)
  const c = (g: string, key: string | number) => counts[g]?.[String(key)] || 0

  const toggleMulti = <K extends 'venues' | 'decks' | 'spirits' | 'flavors' | 'cats'>(g: K, val: Filters[K][number]) => {
    const arr = [...(f[g] as Array<Filters[K][number]>)]
    const i = arr.indexOf(val)
    if (i > -1) arr.splice(i, 1); else arr.push(val)
    setFilters({ [g]: arr } as unknown as Partial<Filters>)
  }

  const statusOpts: SegOption<'any' | 'yes' | 'no'>[] = [
    { value: 'any', label: 'Any' },
    { value: 'yes', label: 'Tried', count: c('tried', 'yes'), disabled: c('tried', 'yes') === 0 },
    { value: 'no', label: 'Not yet', count: c('tried', 'no'), disabled: c('tried', 'no') === 0 },
  ]
  const statusVal = f.tried === true ? 'yes' : f.tried === false ? 'no' : 'any'

  const pkgOpts: SegOption<Filters['pkg']>[] = [
    { value: 'any', label: 'Any' },
    { value: 'plus', label: 'Plus', count: c('pkg', 'plus'), disabled: c('pkg', 'plus') === 0 },
    { value: 'prem', label: 'Premier', count: c('pkg', 'prem'), disabled: c('pkg', 'prem') === 0 },
    { value: 'over', label: 'Extra', count: c('pkg', 'over'), disabled: c('pkg', 'over') === 0 },
  ]

  const bool = (g: 'frozen' | 'fav' | 'wish' | 'top', label: string) => {
    const count = c(g, 'on'); const on = f[g]
    return <Chip label={label} count={count} on={on} disabled={count === 0} onClick={() => setFilters({ [g]: !on } as Partial<Filters>)} />
  }

  const venuesByDeck = (deck: number) => VENUE_KEYS.filter((k) => VENUES[k].deck === deck)
  const whereSummary = [f.decks.length ? `${f.decks.length} deck${f.decks.length > 1 ? 's' : ''}` : '', f.venues.length ? `${f.venues.length} bar${f.venues.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ') || 'Any'
  const listSummary = (arr: string[]) => (arr.length ? arr.join(', ') : 'Any')

  return (
    <div className="fpanel panel">
      <div className="fhead">
        <p className="t-strong tnum">{resultN} of {total}</p>
        {nChosen(f) > 0 && <GlassButton variant="ghost" onClick={clear}>Clear all</GlassButton>}
      </div>

      <div className="f-label">Status</div>
      <Segmented ariaLabel="Status" options={statusOpts} value={statusVal}
        onChange={(v) => setFilters({ tried: v === 'yes' ? true : v === 'no' ? false : null })} />

      <div className="f-label">Package</div>
      <Segmented ariaLabel="Package" options={pkgOpts} value={f.pkg} onChange={(v) => setFilters({ pkg: v })} />

      <div className="fquick">
        {bool('frozen', 'Frozen')}
        {bool('fav', 'Favourites')}
        {bool('wish', 'Wishlist')}
        {bool('top', 'Rated 4+')}
      </div>

      <details className="fgrp" open={f.decks.length > 0 || f.venues.length > 0}>
        <summary><span>Where</span><span className="fsum">{whereSummary}</span></summary>
        <div className="fcloud">
          {DECKS.map((d) => (
            <Chip key={d} label={d === 15 ? 'Deck 15/16' : 'Deck ' + d} count={c('decks', d)} on={f.decks.includes(d)} disabled={c('decks', d) === 0} onClick={() => toggleMulti('decks', d)} />
          ))}
        </div>
        {DECKS.map((deck) => {
          const vs = venuesByDeck(deck).filter((k) => !(constrained && c('venues', k) === 0 && !f.venues.includes(k)))
          if (!vs.length) return null
          return (
            <div key={deck} className="fvdeck">
              <div className="fvdeck-h">Deck {deck === 15 ? '15/16' : deck}</div>
              <div className="fcloud">
                {vs.map((k) => (
                  <Chip key={k} label={VENUES[k].name} count={c('venues', k)} on={f.venues.includes(k)} disabled={c('venues', k) === 0} onClick={() => toggleMulti('venues', k)} />
                ))}
              </div>
            </div>
          )
        })}
      </details>

      <details className="fgrp" open={f.spirits.length > 0}>
        <summary><span>Spirit</span><span className="fsum">{listSummary(f.spirits)}</span></summary>
        <div className="fcloud">
          {SPIRITS.map((x) => (<Chip key={x} label={x} count={c('spirits', x)} on={f.spirits.includes(x)} disabled={c('spirits', x) === 0} onClick={() => toggleMulti('spirits', x)} />))}
        </div>
      </details>

      <details className="fgrp" open={f.flavors.length > 0}>
        <summary><span>Flavour</span><span className="fsum">{listSummary(f.flavors)}</span></summary>
        <div className="fcloud">
          {FLAVOURS.map((x) => (<Chip key={x} label={x} count={c('flavors', x)} on={f.flavors.includes(x)} disabled={c('flavors', x) === 0} onClick={() => toggleMulti('flavors', x)} />))}
        </div>
      </details>

      <details className="fgrp" open={f.cats.length > 0}>
        <summary><span>Type</span><span className="fsum">{listSummary(f.cats)}</span></summary>
        <div className="fcloud">
          {CATEGORIES.map((x) => (<Chip key={x} label={x} count={c('cats', x)} on={f.cats.includes(x)} disabled={c('cats', x) === 0} onClick={() => toggleMulti('cats', x)} />))}
        </div>
      </details>
    </div>
  )
}
