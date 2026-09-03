import { useEffect, useMemo, useState } from 'react'
import { emptyFilters, useAllDrinks, useStore, type Filters } from '../../state/store'
import { VENUES, VENUE_KEYS, type Drink } from '../../data/model'
import { facets, nChosen, loosest, GROUP_LABEL } from './facets'
import { DrinkCard } from './DrinkCard'
import { FilterPanel } from './FilterPanel'
import { DrinkSheet } from './DrinkSheet'
import { AddSheet } from './AddSheet'
import { SearchField } from '../../ui/SearchField'
import { GlassButton } from '../../ui/GlassButton'
import { IconSlider } from '../../ui/Icon'
import './drinks.css'

// Venue order is fixed, by deck then name, so a heading keeps its place from day one to day fifteen.
// A filter or a search shrinks a group or removes it; it never reshuffles the landmarks.
const VENUE_ORDER = VENUE_KEYS.slice().sort(
  (a, b) => VENUES[a].deck - VENUES[b].deck || VENUES[a].name.localeCompare(VENUES[b].name),
)

export function Drinks() {
  const drinks = useAllDrinks()
  const entries = useStore((s) => s.me.entries)
  const filters = useStore((s) => s.filters)
  const showFilters = useStore((s) => s.showFilters)
  const setShowFilters = useStore((s) => s.setShowFilters)
  const clear = useStore((s) => s.clearFilters)
  const setFilters = useStore((s) => s.setFilters)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // deep link: /drinks?openf opens the filter panel (also used for QA); ?log=1 is Home's
  // "Log a drink" arriving, so the search field takes focus and shows its ring. The keyboard is
  // the platform's to raise and iOS will not raise one from a route change.
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    if (p.has('openf')) setShowFilters(true)
    if (p.get('q')) setQ(p.get('q')!)
    if (p.get('drink')) setOpenId(p.get('drink'))
    if (p.has('add')) setShowAdd(true)
    if (p.has('log')) document.querySelector<HTMLInputElement>('.dsearch .sfield-input')?.focus()
  }, [setShowFilters])

  const { results, counts } = useMemo(
    () => facets(drinks, filters, q, (id) => entries[id] || {}),
    [drinks, filters, q, entries],
  )
  const chosen = nChosen(filters)
  const constrained = chosen - filters.venues.length > 0 || q.trim().length > 0
  const drop = results.length === 0 ? loosest(drinks, filters, q, (id) => entries[id] || {}) : null
  // The escape hatch drops the one group it names and keeps every other choice the guest made.
  const dropGroup = (key: string) =>
    setFilters({ [key]: emptyFilters()[key as keyof Filters] } as unknown as Partial<Filters>)

  const groups = useMemo(() => {
    const by = new Map<string, Drink[]>()
    for (const d of results) {
      const list = by.get(d.venue)
      if (list) list.push(d)
      else by.set(d.venue, [d])
    }
    const known = VENUE_ORDER.filter((k) => by.has(k))
    const extra = [...by.keys()].filter((k) => !VENUES[k])
    return [...known, ...extra].map((k) => ({ key: k, name: VENUES[k]?.name || 'Your own drinks', deck: VENUES[k]?.deck, list: by.get(k)! }))
  }, [results])

  return (
    <div className="wrap page drinks">
      <div className="dsearch">
        <SearchField value={q} onChange={setQ} ariaLabel="Search drinks" placeholder="Drink, bar or spirit" />
        <button
          className={'dfbtn' + (chosen > 0 ? ' on' : '')}
          type="button"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        >
          <IconSlider size={18} />
          <span>Filters</span>
          {chosen > 0 && <span className="tnum">{chosen}</span>}
        </button>
      </div>

      {showFilters && <FilterPanel counts={counts} resultN={results.length} total={drinks.length} constrained={constrained} />}

      <div className="dtoolbar">
        <p className="t-meta tnum">
          {results.length === drinks.length ? `${drinks.length} drinks` : `${results.length} of ${drinks.length} drinks`}
        </p>
        <GlassButton variant="ghost" type="button" aria-haspopup="dialog" onClick={() => setShowAdd(true)}>Add a missing drink</GlassButton>
      </div>

      {results.length === 0 ? (
        <div className="dempty">
          <p className="t-body">{chosen > 0 ? 'Nothing matches all of those.' : 'No drink matches that search.'}</p>
          <div className="dempty-acts">
            {drop && <GlassButton onClick={() => dropGroup(drop.key)}>Drop {GROUP_LABEL[drop.key]} for {drop.n} more</GlassButton>}
            <GlassButton variant="primary" onClick={() => { clear(); setQ('') }}>Reset</GlassButton>
          </div>
        </div>
      ) : (
        groups.map((g) => {
          const tried = g.list.filter((d) => entries[d.id]?.tried).length
          return (
            <section className="dgroup" key={g.key}>
              <div className="section-head dgroup-head">
                <h2 className="t-h2">{g.name}{g.deck ? ` · Deck ${g.deck}` : ''}</h2>
                <span className="t-meta tnum dgroup-n">{tried} of {g.list.length} tried</span>
              </div>
              <div className="dlist">
                {g.list.map((d) => <DrinkCard key={d.id} d={d} onOpen={setOpenId} />)}
              </div>
            </section>
          )
        })
      )}

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
      {showAdd && <AddSheet onClose={() => setShowAdd(false)} />}
    </div>
  )
}
