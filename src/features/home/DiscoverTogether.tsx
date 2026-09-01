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
  const crew = friends.length === 1 ? friends[0].name : 'the crew'

  return (
    <section className="glass card discover">
      <div className="eyebrow disc-eyebrow">Discover together</div>

      {twin && (
        <p className="disc-line disc-twin">
          <FriendDot name={twin.source.name} colour={twin.source.colour} size={22} />
          <span><b>{twin.source.name}</b> shares your taste</span>
        </p>
      )}

      <p className="disc-line disc-reach t-body">
        Between you, <b className="tnum">{reach.triedTogether}</b> of {reach.total} tried
        {reach.onlyFriends > 0 && <> · <b className="tnum">{reach.onlyFriends}</b> {crew} found you haven't</>}
      </p>

      {recs.length > 0 && (
        <div className="disc-recs">
          {recs.map((p) => (
            <button key={p.drink.id} type="button" className="disc-rec pressable" onClick={() => onOpen(p.drink.id)}>
              <span className="fstack disc-rec-dots">
                {p.by.slice(0, 2).map((s) => <FriendDot key={s.id} name={s.name} colour={s.colour} size={20} />)}
              </span>
              <span className="disc-rec-copy">
                <span className="disc-rec-name t-strong">{p.drink.name}</span>
                <span className="disc-rec-by muted">{byPhrase(p)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
