import { useMemo } from 'react'
import { Sheet } from '../../ui/Sheet'
import { DRINK_BY_ID, money, pkgOf, VENUES, START, END, today, type Drink } from '../../data/model'
import { useStore, useAllDrinks } from '../../state/store'
import { commentsFor, groupRating, recommendationsFor, useSources } from '../../state/social'
import { IconStar, IconCheck, IconHeart, IconBookmark, IconCamera } from '../../ui/Icon'
import { Soon } from '../../ui/Soon'
import { FriendDot } from '../../ui/FriendDot'
import './drinksheet.css'

const ABV = ['', 'Light, roughly 8 to 12% in the glass', 'Moderate, roughly 12 to 16%', 'Standard, roughly 16 to 22%', 'Strong, roughly 22 to 30%', 'Spirit forward, 30% and up']

function listNames(names: string[]) {
  if (names.length < 2) return names[0] || ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function Meter({ label, n }: { label: string; n: number }) {
  return (
    <div className="mt">
      <div className="mt-l eyebrow">{label}</div>
      <div className="mt-dots">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}</div>
    </div>
  )
}

export function DrinkSheet({ id, onClose, onOpen }: { id: string; onClose: () => void; onOpen: (id: string) => void }) {
  const all = useAllDrinks()
  const d: Drink | undefined = DRINK_BY_ID[id] || all.find((x) => x.id === id)
  const e = useStore((s) => s.me.entries[id]) || {}
  const setRating = useStore((s) => s.setRating)
  const toggle = useStore((s) => s.toggle)
  const toggleTried = useStore((s) => s.toggleTried)
  const toggleRec = useStore((s) => s.toggleRec)
  const setNotes = useStore((s) => s.setNotes)
  const setComment = useStore((s) => s.setComment)
  const setDate = useStore((s) => s.setDate)
  const srcs = useSources()
  const group = useMemo(() => groupRating(id, srcs), [id, srcs])
  const recs = useMemo(() => recommendationsFor(id, srcs).filter((r) => !r.source.isSelf), [id, srcs])
  const comments = useMemo(() => commentsFor(id, srcs).filter((c) => !c.source.isSelf), [id, srcs])
  if (!d) return null
  const v = VENUES[d.venue]
  const tier = pkgOf(d)
  const also = all.filter((x) => x.venue === d.venue && x.id !== id).slice(0, 6)

  const Toggle = ({ k, label, Icon, on, tone }: { k: 'tried' | 'fav' | 'wish' | 'again' | 'rec'; label: string; Icon: typeof IconCheck; on: boolean; tone: string }) => (
    <button className={'tg pressable' + (on ? ' on tg-' + tone : '')} aria-pressed={on}
      onClick={() => (k === 'tried' ? toggleTried(id) : k === 'rec' ? toggleRec(id) : toggle(id, k))}>
      <Icon size={19} filled={on} /> {label}
    </button>
  )

  return (
    <Sheet onClose={onClose} eyebrow={<div className="sheet-eyebrow eyebrow">{v.name} · Deck {v.deck} · {d.category}</div>}>
      <div className="ds-hero"><IconCamera size={26} /><span>Photos</span><Soon label="Coming soon" /></div>
      <h2 className="ds-title t-title">{d.name}</h2>
      {!d.verified && <div className="ds-warn">Named in trip reports but not confirmed on a published menu. Have a look at the bar.</div>}
      <p className="ds-ing t-strong">{d.ingredients}</p>
      <p className="muted t-body">{d.desc}</p>

      <div className="ds-tags">
        {tier === 'plus' && <span className="tag tag-plus">Plus</span>}
        {tier === 'prem' && <span className="tag tag-prem">Premier</span>}
        {tier === 'over' && <span className="tag tag-over">+{money(d.extra)}</span>}
        {d.price !== null && <span className="tag tag-price">{money(d.price)}</span>}
        {d.price === null && <span className="tag">Price not published</span>}
        {d.frozen && <span className="tag">Frozen</span>}
        {d.flavors.map((fl) => <span key={fl} className="tag">{fl}</span>)}
      </div>

      <div className="ds-meters">
        <Meter label="Sweetness" n={d.sweet} />
        <Meter label="Strength" n={d.strength} />
      </div>
      <p className="muted t-body ds-abv">{d.strength === 0 ? 'Alcohol free' : ABV[d.strength]}</p>

      <div className="ds-rate-row">
        <div className="ds-rate-label eyebrow">Your rating</div>
        {group.count > 1 && (
          <div className="ds-group tnum">
            <IconStar size={13} filled /> {group.avg.toFixed(1)}
            <span className="muted"> · {group.count} aboard</span>
          </div>
        )}
      </div>
      {recs.length > 0 && (
        <div className="ds-recby">
          <span className="fstack">
            {recs.slice(0, 3).map((r) => <FriendDot key={r.source.id} {...r.source} size={20} />)}
          </span>
          <span className="muted t-body">Recommended by {listNames(recs.map((r) => r.source.name))}</span>
        </div>
      )}
      <div className="ds-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={'ds-star pressable' + (n <= (e.rating || 0) ? ' on' : '')} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(id, n)}>
            <IconStar size={30} filled={n <= (e.rating || 0)} />
          </button>
        ))}
      </div>

      <div className="ds-toggles">
        <Toggle k="tried" label="Tried" Icon={IconCheck} on={!!e.tried} tone="mint" />
        <Toggle k="fav" label="Favourite" Icon={IconHeart} on={!!e.fav} tone="coral" />
        <Toggle k="wish" label="Wishlist" Icon={IconBookmark} on={!!e.wish} tone="lilac" />
        <Toggle k="again" label="Order again" Icon={IconCheck} on={!!e.again} tone="sky" />
        <Toggle k="rec" label="Recommend" Icon={IconStar} on={!!e.rec} tone="gold" />
      </div>

      {e.tried && (
        <label className="ds-field">
          <span className="eyebrow">Date tried</span>
          <input type="date" min={START} max={END} value={e.date || today()} onChange={(ev) => setDate(id, ev.target.value)} />
        </label>
      )}
      <div className="ds-note-fields">
        <label className="ds-field">
          <span className="eyebrow">Notes <span className="ds-private muted">· Private to you</span></span>
          <textarea rows={3} placeholder="Glass, garnish, who made it, whether it was worth the walk." defaultValue={e.notes || ''} onChange={(ev) => setNotes(id, ev.target.value)} />
        </label>
        <label className="ds-field">
          <span className="eyebrow">Comment · shared with friends</span>
          <textarea rows={2} maxLength={140} placeholder="One line others will see." defaultValue={e.comment || ''} onChange={(ev) => setComment(id, ev.target.value)} />
        </label>
      </div>

      {comments.length > 0 && (
        <>
          <div className="ds-friends-label eyebrow">What friends said</div>
          <div className="ds-friends">
            {comments.map((c) => (
              <div className="ds-friend-row" key={c.source.id}>
                <FriendDot {...c.source} size={26} />
                <div className="ds-friend-copy">
                  <div className="t-strong">
                    {c.source.name}
                    {c.rating ? (
                      <span className="ds-friend-stars muted" aria-label={`${c.rating} star${c.rating > 1 ? 's' : ''}`}>
                        {Array.from({ length: c.rating }, (_, i) => <IconStar key={i} size={11} filled />)}
                      </span>
                    ) : null}
                  </div>
                  <p className="muted t-body">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {also.length > 0 && (
        <>
          <div className="ds-also-label eyebrow">Also at {v.name}</div>
          <div className="ds-also">
            {also.map((x) => (
              <button key={x.id} className="mini pressable" onClick={() => onOpen(x.id)}>{x.name}</button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  )
}
