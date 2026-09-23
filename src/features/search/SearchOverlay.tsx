import { useCallback, useMemo, useRef, useState } from 'react'
import { useAllDrinks, useStore } from '../../state/store'
import { currentBar } from '../../state/stats'
import { VENUES, deckLabel, menuFor, type Drink } from '../../data/model'
import { useToast } from '../../ui/Toast'
import { TopBar } from '../../app/TopBar'
import { matchQuery } from '../drinks/facets'
import { DrinkCard } from '../drinks/DrinkCard'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { useLogSearch } from './log'
import { byVenue, emptyLists, rankMatches, MATCH_CAP } from './lists'
// the rows are Drinks' own, so their stylesheet comes with them wherever the search opens
import '../drinks/drinks.css'
import './search.css'

const venueName = (key: string) => VENUES[key]?.name || 'Your own drinks'
const venueHead = (key: string) => {
  const v = VENUES[key]
  return v ? `${v.name} · Deck ${deckLabel(v.deck)}` : venueName(key)
}

// What Log opens, over the current screen (docs/DESIGN.md, Search). The field is the dock's (Nav.tsx);
// this is the page under it. With nothing typed it is the bar the guest is in, "Still to try at
// Crooners" (prototype B), then their wishlist; typed, it is every drink the Drinks search would
// find, grouped under their bars. Each row is Drinks' row, and its tick logs the drink with an Undo
// (C). The reason a list is there is said once, in its heading, never on every row.
export function SearchOverlay({ sheetUp }: { sheetUp: boolean }) {
  const q = useLogSearch((s) => s.q)
  const drinks = useAllDrinks()
  const toggleTried = useStore((s) => s.toggleTried)
  const toast = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  // The empty field's lists are taken as the search opens and then held: a drink ticked off "Still
  // to try" keeps its row, ticked, under the thumb that ticked it, so the Undo has somewhere to land,
  // and a tick at another bar does not swap the heading for that bar's list mid-search.
  const [opened] = useState(() => {
    const me = useStore.getState().me
    return { entries: me.entries, bar: currentBar(drinks, me) }
  })
  const bar = opened.bar
  const empty = useMemo(
    () => emptyLists(bar ? menuFor(bar, drinks) : null, drinks, opened.entries),
    [bar, drinks, opened],
  )
  const needle = q.trim().toLowerCase()
  const found = useMemo(() => (needle ? drinks.filter((d) => matchQuery(d, needle)) : []), [drinks, needle])
  const groups = useMemo(() => byVenue(rankMatches(found, needle)), [found, needle])
  // the wishlist spans bars and its rows do not say where they are, so it runs bar by bar, each run
  // under the bar's name as a label line
  const wishRuns = useMemo(() => byVenue(empty.wish), [empty.wish])

  const onTried = useCallback((d: Drink, on: boolean) => {
    if (!on) return
    toast({
      title: `Logged ${d.name}`,
      tone: 'success',
      action: {
        label: 'Undo',
        // only if it is still ticked: the guest may have unticked it by hand in the meantime
        onClick: () => { if (useStore.getState().me.entries[d.id]?.tried) toggleTried(d.id) },
      },
    })
  }, [toast, toggleTried])

  const rows = (list: Drink[]) => (
    <div className="dlist">
      {list.map((d) => <DrinkCard key={d.id} d={d} onOpen={setOpenId} onTried={onTried} />)}
    </div>
  )

  const count = found.length === 0 ? 'Nothing on board matches that.'
    : found.length > MATCH_CAP ? `The first ${MATCH_CAP} of ${found.length} matches`
      : `${found.length} ${found.length === 1 ? 'match' : 'matches'}`

  return (
    <div className="search-layer">
      <TopBar title="Log a drink" scroller={scrollRef} off={sheetUp} />
      <div className="search-scroll" ref={scrollRef}>
        <div className="wrap search-page">
          <h1 className="t-title">Log a drink</h1>
          {needle ? (
            <>
              <p className="t-meta tnum search-count" role="status">{count}</p>
              {groups.map((g) => (
                <section className="section" key={g.venue}>
                  <div className="section-head"><h2 className="t-h2">{venueHead(g.venue)}</h2></div>
                  {rows(g.list)}
                </section>
              ))}
            </>
          ) : (
            <>
              {bar && empty.still.length > 0 && (
                <section className="section">
                  <div className="section-head"><h2 className="t-h2">Still to try at {venueName(bar)}</h2></div>
                  {rows(empty.still)}
                </section>
              )}
              {wishRuns.length > 0 && (
                <section className="section">
                  <div className="section-head"><h2 className="t-h2">Your wishlist</h2></div>
                  {wishRuns.map((run) => (
                    <div className="search-run" key={run.venue}>
                      <p className="t-meta search-where">{venueHead(run.venue)}</p>
                      {rows(run.list)}
                    </div>
                  ))}
                </section>
              )}
              {empty.still.length === 0 && wishRuns.length === 0 && (
                <p className="t-body search-none">Nothing on your wishlist yet.</p>
              )}
            </>
          )}
        </div>
      </div>
      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}
