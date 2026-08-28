import { memo } from 'react'
import { money, pkgOf, VENUES, type Drink } from '../../data/model'
import { useSources } from '../../state/social'
import { useStore } from '../../state/store'
import { FriendDot } from '../../ui/FriendDot'
import { IconCheck, IconHeart, IconBookmark } from '../../ui/Icon'

function Tags({ d }: { d: Drink }) {
  const tier = pkgOf(d)
  return (
    <div className="d-tags">
      <span className="tag">{d.category}</span>
      {d.frozen && <span className="tag">Frozen</span>}
      {tier === 'plus' && <span className="tag tag-plus">Plus</span>}
      {tier === 'prem' && <span className="tag tag-prem">Premier</span>}
      {tier === 'over' && <span className="tag tag-over">+{money(d.extra)}</span>}
      {d.price !== null && <span className="tag tag-price">{money(d.price)}</span>}
    </div>
  )
}

export const DrinkCard = memo(function DrinkCard({ d, onOpen }: { d: Drink; onOpen: (id: string) => void }) {
  const e = useStore((s) => s.me.entries[d.id]) || {}
  const srcs = useSources()
  const toggleTried = useStore((s) => s.toggleTried)
  const toggle = useStore((s) => s.toggle)
  const v = VENUES[d.venue]
  const fr = srcs.filter((s) => !s.isSelf && s.passport.entries[d.id]?.rating)

  return (
    <article className={'dcard glass' + (e.tried ? ' done' : '')}>
      <button className="d-open" onClick={() => onOpen(d.id)}>
        <div className="d-line1">
          <h3 className="d-name">
            {d.name}
            {!d.verified && <span className="d-unverified" aria-label="Not confirmed on a published menu">!</span>}
          </h3>
          {e.rating ? <span className="d-stars" aria-label={`${e.rating} out of 5`}>{'★'.repeat(e.rating)}</span> : null}
        </div>
        <div className="d-venue t-meta">
          <span>{v.name} · Deck {v.deck}</span>
          {fr.length > 0 && (
            <span className="d-social">
              <span className="fstack">
                {fr.slice(0, 3).map((s) => <FriendDot key={s.id} {...s} size={16} />)}
              </span>
              {fr.length > 3 && <span className="muted tnum">+{fr.length - 3}</span>}
            </span>
          )}
        </div>
        <p className="d-ing">{d.ingredients}</p>
      </button>
      <div className="d-foot">
        <Tags d={d} />
        <div className="d-acts">
          <button className={'d-act' + (e.tried ? ' on tried' : '')} aria-pressed={!!e.tried} aria-label="Tried" onClick={() => toggleTried(d.id)}>
            <IconCheck size={20} filled={!!e.tried} />
          </button>
          <button className={'d-act' + (e.fav ? ' on fav' : '')} aria-pressed={!!e.fav} aria-label="Favourite" onClick={() => toggle(d.id, 'fav')}>
            <IconHeart size={20} filled={!!e.fav} />
          </button>
          <button className={'d-act' + (e.wish ? ' on wish' : '')} aria-pressed={!!e.wish} aria-label="Wishlist" onClick={() => toggle(d.id, 'wish')}>
            <IconBookmark size={20} filled={!!e.wish} />
          </button>
        </div>
      </div>
    </article>
  )
})
