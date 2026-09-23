import { Chip } from '../../ui/Chip'
import { GlassButton } from '../../ui/GlassButton'
import { Segmented, type SegOption } from '../../ui/Segmented'
import { DECKS, SPIRITS, FLAVOURS, CATEGORIES, HAS_PACKAGES, VENUES, deckLabel } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import type { Filters } from '../../state/store'
import { nChosen, type Counts } from './facets'
import './filterpanel.css'

export function FilterPanel({ counts }: { counts: Counts }) {
  const f = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const clear = useStore((s) => s.clearFilters)
  const c = (g: string, key: string | number) => counts[g]?.[String(key)] || 0
  // A deck none of the drinks is filed on (Deck 15/16 pours THE MIX's list, filed under THE MIX) would
  // be a chip that can never be chosen: a structural zero, so it is not drawn. One that is chosen stays.
  const all = useAllDrinks()
  const decks = DECKS.filter((d) => f.decks.includes(d) || all.some((x) => VENUES[x.venue]?.deck === d))

  const toggleMulti = <K extends 'decks' | 'spirits' | 'flavors' | 'cats'>(g: K, val: Filters[K][number]) => {
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

  const whereSummary = f.decks.length ? `${f.decks.length} deck${f.decks.length > 1 ? 's' : ''}` : 'Any'
  const listSummary = (arr: string[]) => (arr.length ? arr.join(', ') : 'Any')

  return (
    <div className="fpanel panel">
      {/* The count line under the panel is the one count; the head holds Clear all, and only when
          there is something to clear. It shares the row with Status's label, which is always a
          44 row, so the first choice does not push every control down under the thumb that made it
          (a head of its own appeared above Status and moved the panel 60px). */}
      <div className="fhead">
        <div className="f-label">Status</div>
        {nChosen(f) > 0 && <GlassButton variant="ghost" onClick={clear}>Clear all</GlassButton>}
      </div>
      <Segmented ariaLabel="Status" options={statusOpts} value={statusVal}
        onChange={(v) => setFilters({ tried: v === 'yes' ? true : v === 'no' ? false : null })} />

      {/* A sailing the guest set up declares no package tiers, so every drink on it is 'unknown'
          and a Plus / Premier / Extra segment would be a filter with nothing behind it. */}
      {HAS_PACKAGES && (
        <>
          <div className="f-label">Package</div>
          <Segmented ariaLabel="Package" options={pkgOpts} value={f.pkg} onChange={(v) => setFilters({ pkg: v })} />
        </>
      )}

      <div className="fquick">
        {bool('frozen', 'Frozen')}
        {bool('fav', 'Favourites')}
        {bool('wish', 'Wishlist')}
        {bool('top', 'Rated 4+')}
      </div>

      {/* Where is the decks alone. A bar is found by typing its name, which the search matches, or
          from its own sheet on Ship; a chip per venue was a fourth route to the same place. */}
      <details className="fgrp" open={f.decks.length > 0}>
        <summary><span>Where</span><span className="fsum">{whereSummary}</span></summary>
        <div className="fcloud">
          {decks.map((d) => (
            <Chip key={d} label={'Deck ' + deckLabel(d)} count={c('decks', d)} on={f.decks.includes(d)} disabled={c('decks', d) === 0} onClick={() => toggleMulti('decks', d)} />
          ))}
        </div>
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
