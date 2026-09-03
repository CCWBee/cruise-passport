// Smart social, woven in: what the crew has found together, who shares your palate, and drinks
// they loved that you haven't tried (ranked by taste affinity). Insight, never a ranking.
// Invisible until a friend is added; the taste-twin claim waits for enough shared ratings.
import { useMemo } from 'react'
import { useStore } from '../../state/store'
import { useSources, tasteTwin, groupReach, recommendedForYou, type FriendPick } from '../../state/social'
import { FriendDot } from '../../ui/FriendDot'
import './discover.css'

function byPhrase(p: FriendPick): string {
  const names = p.by.map((s) => s.name)
  const who = names.length === 1 ? names[0]
    : names.length === 2 ? `${names[0]} and ${names[1]}`
      : `${names[0]} and ${names.length - 1} more`
  return `${who} loved it`
}

export function DiscoverTogether({ onOpen }: { onOpen: (id: string) => void }) {
  const me = useStore((s) => s.me)
  const friends = useStore((s) => s.friends)
  const srcs = useSources()
  const twin = useMemo(() => tasteTwin(me, srcs), [me, srcs])
  const reach = useMemo(() => groupReach(srcs), [srcs])
  const recs = useMemo(() => recommendedForYou(me, srcs, 3), [me, srcs])

  if (friends.length === 0) return null

  return (
    <section className="section discover">
      <div className="section-head"><h2 className="t-h2">Discover together</h2></div>

      {twin && (
        <p className="t-body disc-twin">
          {/* 28 everywhere a person appears: the initial inside a dot is .45 of it, and 24 puts that
              under the 12px floor */}
          <FriendDot name={twin.source.name} colour={twin.source.colour} size={28} />
          <span><b>{twin.source.name}</b> shares your taste</span>
        </p>
      )}

      <p className="t-meta disc-reach">
        <b className="tnum">{reach.triedTogether}</b> of {reach.total} tried between you
        {reach.onlyFriends > 0 && <> · <b className="tnum">{reach.onlyFriends}</b> that only they have tried</>}
      </p>

      {recs.map((p) => (
        <button key={p.drink.id} type="button" className="row pressable" onClick={() => onOpen(p.drink.id)}>
          <span className="fstack disc-rec-dots">
            {p.by.slice(0, 2).map((s) => <FriendDot key={s.id} name={s.name} colour={s.colour} size={28} />)}
          </span>
          <span className="row-copy">
            {/* the drink is the object of the row, so it reads at the heading size Drinks uses */}
            <span className="t-h2">{p.drink.name}</span>
            <span className="t-meta">{byPhrase(p)}</span>
          </span>
        </button>
      ))}
    </section>
  )
}
