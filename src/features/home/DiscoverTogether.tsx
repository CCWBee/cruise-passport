// Smart social, woven in: what the crew has found together, who shares your palate, and drinks
// they loved that you haven't tried (ranked by taste affinity). Insight, never a ranking.
// Invisible until a friend is added; the taste-twin claim waits for enough shared ratings.
import { useMemo, type ReactNode } from 'react'
import { useStore } from '../../state/store'
import { useSources, tasteTwin, groupReach, recommendedForYou, type FriendPick } from '../../state/social'
import { glassFamily } from '../../data/glass'
import { VENUES, money } from '../../data/model'
import { FriendDot } from '../../ui/FriendDot'
import { GlassIcon } from '../../ui/Icon'
import './discover.css'

function whoPhrase(by: FriendPick['by']): string {
  const names = by.map((s) => s.name)
  return names.length === 1 ? names[0]
    : names.length === 2 ? `${names[0]} and ${names[1]}`
      : `${names[0]} and ${names.length - 1} more`
}
const byPhrase = (p: FriendPick): string => `${whoPhrase(p.by)} loved it`

// the same people behind a pick, whatever order they came in
const whoKey = (p: FriendPick): string => p.by.map((s) => s.id).sort().join(' ')

/** A row's own meta when its reason is said above the rows: DrinkCard's order, the price first, then
 *  where it is poured. */
function whereLine(p: FriendPick): ReactNode {
  const venue = VENUES[p.drink.venue]?.name || p.drink.venue
  return p.drink.price !== null ? <><span className="tnum">{money(p.drink.price)}</span> · {venue}</> : venue
}

export function DiscoverTogether({ onOpen }: { onOpen: (id: string) => void }) {
  const me = useStore((s) => s.me)
  const friends = useStore((s) => s.friends)
  const srcs = useSources()
  const twin = useMemo(() => tasteTwin(me, srcs), [me, srcs])
  const reach = useMemo(() => groupReach(srcs), [srcs])
  const recs = useMemo(() => recommendedForYou(me, srcs, 3), [me, srcs])

  if (friends.length === 0) return null

  // Said once: when every pick comes from the same people, who loved them is said above the rows and
  // each row says where its drink is poured, rather than "Sam loved it" three rows running under
  // "Sam shares your taste" (DESIGN.md, Copy: each thing is said once). Picks from different people
  // keep the reason on the row, since there it tells the rows apart.
  const shared = recs.length > 1 && recs.every((p) => whoKey(p) === whoKey(recs[0])) ? recs[0].by : null
  // the twin carries the line when the picks are all theirs, so the name is not said twice running
  const twinCarries = !!(twin && shared && shared.length === 1 && shared[0].id === twin.source.id)

  const twinLine = twin && (
    <p className="t-body disc-twin">
      {/* 28 everywhere a person appears: the initial inside a dot is .45 of it, and 24 puts that
          under the 12px floor */}
      <FriendDot name={twin.source.name} colour={twin.source.colour} size={28} />
      <span>
        <b>{twin.source.name}</b> shares your taste{twinCarries && ' and loved these'}
      </span>
    </p>
  )

  return (
    <section className="section discover">
      <div className="section-head"><h2 className="t-h2">Discover together</h2></div>

      {!twinCarries && twinLine}

      <p className="t-meta disc-reach">
        <b className="tnum">{reach.triedTogether}</b> of {reach.total} tried between you
        {reach.onlyFriends > 0 && <> · <b className="tnum">{reach.onlyFriends}</b> that only they have tried</>}
      </p>

      {/* the line that says whose picks these are sits next to the rows it speaks for */}
      {twinCarries && twinLine}
      {shared && !twinCarries && <p className="t-meta disc-who">{whoPhrase(shared)} loved these</p>}

      {/* no dots on these rows: the line above, or the row's own meta, already names the friend. The
          glass leads, as it does on every row that names a drink */}
      {recs.map((p) => (
        <button key={p.drink.id} type="button" className="row pressable" onClick={() => onOpen(p.drink.id)}>
          {/* the glass at DrinkCard's size, so a drink row reads the same here as on Drinks */}
          <GlassIcon family={glassFamily(p.drink)} size={30} className="row-lead" />
          <span className="row-copy">
            {/* the drink is the object of the row, so it reads as Drinks' row names do: body at
                weight 600. The heading size is 21 now, which in a row read as a section title. */}
            <span className="t-strong">{p.drink.name}</span>
            <span className="t-meta">{shared ? whereLine(p) : byPhrase(p)}</span>
          </span>
        </button>
      ))}
    </section>
  )
}
