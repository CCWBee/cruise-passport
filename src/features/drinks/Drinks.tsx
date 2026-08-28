import { useEffect, useMemo, useState } from 'react'
import { useAllDrinks, useStore } from '../../state/store'
import { facets, nChosen, loosest, GROUP_LABEL } from './facets'
import { DrinkCard } from './DrinkCard'
import { FilterPanel } from './FilterPanel'
import { DrinkSheet } from './DrinkSheet'
import { IconSearch, IconClose, IconSlider } from '../../ui/Icon'
import './drinks.css'

export function Drinks() {
  const drinks = useAllDrinks()
  const entries = useStore((s) => s.me.entries)
  const filters = useStore((s) => s.filters)
  const showFilters = useStore((s) => s.showFilters)
  const setShowFilters = useStore((s) => s.setShowFilters)
  const clear = useStore((s) => s.clearFilters)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  // deep link: /drinks?openf opens the filter panel (also used for QA)
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    if (p.has('openf')) setShowFilters(true)
    if (p.get('q')) setQ(p.get('q')!)
    if (p.get('drink')) setOpenId(p.get('drink'))
  }, [setShowFilters])

  const { results, counts } = useMemo(
    () => facets(drinks, filters, q, (id) => entries[id] || {}),
    [drinks, filters, q, entries],
  )
  const chosen = nChosen(filters)
  const constrained = chosen - filters.venues.length > 0 || q.trim().length > 0
  const drop = results.length === 0 ? loosest(drinks, filters, q, (id) => entries[id] || {}) : null

  return (
    <div className="wrap page drinks">
      <div className="dsearch glass-live">
        <IconSearch size={19} />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} inputMode="search"
          placeholder="Drink, ingredient, bar, spirit" aria-label="Search drinks"
        />
        {q && <button className="dsearch-x" aria-label="Clear search" onClick={() => setQ('')}><IconClose size={16} /></button>}
        <button
          className={'dfbtn' + (chosen > 0 ? ' on' : '')}
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        >
          <IconSlider size={16} />
          <span className="tnum">{results.length}</span>
        </button>
      </div>

      {showFilters && <FilterPanel counts={counts} resultN={results.length} constrained={constrained} />}

      <div className="dcount">{results.length} of {drinks.length} drinks</div>

      {results.length === 0 ? (
        <div className="glass card center dempty">
          <p className="muted">Nothing matches all of those.</p>
          <div className="dempty-acts">
            {drop && <button className="btn" onClick={() => clear()}>Drop {GROUP_LABEL[drop.key]} (+{drop.n})</button>}
            <button className="btn btn-coral" onClick={() => { clear(); setQ('') }}>Reset</button>
          </div>
        </div>
      ) : (
        <div className="dlist reveal" key={q + '|' + results.length}>
          {results.map((d) => <DrinkCard key={d.id} d={d} onOpen={setOpenId} />)}
        </div>
      )}

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </div>
  )
}
