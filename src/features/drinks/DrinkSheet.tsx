import { useId, useMemo } from 'react'
import { Sheet } from '../../ui/Sheet'
import { DRINK_BY_ID, money, pkgOf, VENUES, START, END, today, type Drink } from '../../data/model'
import { useStore, useAllDrinks } from '../../state/store'
import { commentsFor, groupRating, recommendationsFor, useSources, type GroupRating } from '../../state/social'
import { IconStar } from '../../ui/Icon'
import { TextField, TextArea } from '../../ui/Field'
import { FriendDot } from '../../ui/FriendDot'
import './drinksheet.css'

const ABV = ['', 'Light, roughly 8 to 12% in the glass', 'Moderate, roughly 12 to 16%', 'Standard, roughly 16 to 22%', 'Strong, roughly 22 to 30%', 'Spirit forward, 30% and up']

function listNames(names: string[]) {
  if (names.length < 2) return names[0] || ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// One factual line about the crew's ratings: who scored it 4 or more, or the range when they
// disagree. It states the numbers and never pins a low score to a friend by name.
function consensusLine(group: GroupRating): string | null {
  const friendBits = group.bits.filter((b) => !b.source.isSelf)
  if (!friendBits.length) return null
  const ratings = group.bits.map((b) => b.rating)
  const min = Math.min(...ratings), max = Math.max(...ratings)
  const mine = group.mine
  const high = friendBits.filter((b) => b.rating >= 4)
  if (max - min >= 2) return `Ratings ranged ${min} to ${max} aboard`
  if (mine != null && mine >= 4 && high.length) {
    if (friendBits.length === 1) return `You and ${friendBits[0].source.name} both rated this 4 or more`
    // "all" only when every friend is actually high; otherwise name the ones who were
    if (high.length === friendBits.length) return 'You and the crew all rated this 4 or more'
    return `You and ${listNames(high.slice(0, 2).map((b) => b.source.name))} rated this 4 or more`
  }
  if (high.length) return `${listNames(high.slice(0, 2).map((b) => b.source.name))} rated this 4 or more`
  return null
}

// Sweetness and strength: five ink dots, no meter, no gradient.
function Meter({ label, n }: { label: string; n: number }) {
  return (
    <div className="ds-meter">
      <span className="ds-label">{label}</span>
      <span className="ds-dots" role="img" aria-label={`${label}, ${n} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}
      </span>
    </div>
  )
}

// Package tier and price as one plain phrase, then the flavours. No pills.
function factsLine(d: Drink): string {
  const tier = pkgOf(d)
  const price = d.price === null ? 'Price not published'
    : tier === 'plus' ? `Plus ${money(d.price)}`
      : tier === 'prem' ? `Premier ${money(d.price)}`
        : `${money(d.price)}, ${money(d.extra)} over Premier`
  const notes = [...d.flavors, ...(d.frozen ? ['Frozen'] : [])].join(', ')
  return [price, notes].filter(Boolean).join(' · ')
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
  const titleId = useId()
  const group = useMemo(() => groupRating(id, srcs), [id, srcs])
  const recs = useMemo(() => recommendationsFor(id, srcs).filter((r) => !r.source.isSelf), [id, srcs])
  const comments = useMemo(() => commentsFor(id, srcs).filter((c) => !c.source.isSelf), [id, srcs])
  const consensus = useMemo(() => consensusLine(group), [group])
  if (!d) return null
  const v = VENUES[d.venue]
  const also = all.filter((x) => x.venue === d.venue && x.id !== id).slice(0, 6)

  const chip = (k: 'tried' | 'fav' | 'wish' | 'again' | 'rec', label: string, on: boolean, mint?: boolean) => (
    <button
      key={k}
      className={'ds-chip' + (on ? ' on' : '') + (mint ? ' ds-chip-mint' : '')}
      type="button"
      aria-pressed={on}
      onClick={() => (k === 'tried' ? toggleTried(id) : k === 'rec' ? toggleRec(id) : toggle(id, k))}
    >
      {label}
    </button>
  )

  return (
    <Sheet onClose={onClose} labelledBy={titleId}>
      <h2 className="t-title sheet-title" id={titleId}>{d.name}</h2>
      <p className="sheet-meta">{v ? `${v.name} · Deck ${v.deck} · ` : ''}{d.category}</p>

      <p className="ds-ing t-body">{d.ingredients}</p>
      <p className="ds-desc t-meta">{d.desc}</p>
      <p className="ds-facts t-meta">{factsLine(d)}</p>
      {!d.verified && (
        <p className="ds-warn t-meta">Named in trip reports but not confirmed on a published menu. Have a look at the bar.</p>
      )}

      <hr className="hairline ds-rule" />
      <div className="ds-meters">
        <Meter label="Sweetness" n={d.sweet} />
        <Meter label="Strength" n={d.strength} />
      </div>
      <p className="ds-abv t-meta">{d.strength === 0 ? 'Alcohol free' : ABV[d.strength]}</p>

      <hr className="hairline ds-rule" />
      <div className="ds-rate-head">
        <span className="ds-label">Your rating</span>
        {group.count > 1 && (
          <span className="ds-group tnum">{group.avg.toFixed(1)} average from {group.count} aboard</span>
        )}
      </div>
      <div className="ds-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={'ds-star' + (n <= (e.rating || 0) ? ' on' : '')}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(id, n)}
          >
            <IconStar size={26} filled={n <= (e.rating || 0)} />
          </button>
        ))}
      </div>
      {consensus && <p className="ds-consensus t-meta">{consensus}</p>}
      {recs.length > 0 && (
        <p className="ds-recby t-meta">
          <span className="fstack">
            {recs.slice(0, 3).map((r) => <FriendDot key={r.source.id} {...r.source} size={20} />)}
          </span>
          <span>Recommended by {listNames(recs.map((r) => r.source.name))}</span>
        </p>
      )}

      <div className="ds-chips">
        {chip('tried', 'Tried', !!e.tried, true)}
        {chip('fav', 'Favourite', !!e.fav)}
        {chip('wish', 'Wishlist', !!e.wish)}
        {chip('again', 'Order again', !!e.again)}
        {chip('rec', 'Recommend', !!e.rec)}
      </div>

      {e.tried && (
        <TextField
          id={`${titleId}-date`}
          label="Date tried"
          type="date"
          min={START}
          max={END}
          value={e.date || today()}
          onChange={(ev) => setDate(id, ev.target.value)}
        />
      )}
      <TextArea
        id={`${titleId}-notes`}
        label="Notes"
        hint="Private to you."
        rows={3}
        placeholder="Glass, garnish, who made it, whether it was worth the walk."
        defaultValue={e.notes || ''}
        onChange={(ev) => setNotes(id, ev.target.value)}
      />
      <TextArea
        id={`${titleId}-comment`}
        label="Comment"
        hint="Shared with your crew."
        rows={2}
        maxLength={140}
        placeholder="One line others will see."
        defaultValue={e.comment || ''}
        onChange={(ev) => setComment(id, ev.target.value)}
      />

      {comments.length > 0 && (
        <section className="section">
          <div className="section-head"><h3 className="t-h2">What the crew said</h3></div>
          <div className="ds-crew">
            {comments.map((c) => (
              <div className="ds-crew-row" key={c.source.id}>
                <FriendDot {...c.source} size={26} />
                <div className="ds-crew-copy">
                  <span className="ds-crew-name t-strong">
                    {c.source.name}
                    {c.rating ? (
                      <span className="ds-crew-stars" aria-label={`${c.rating} star${c.rating > 1 ? 's' : ''}`}>
                        {Array.from({ length: c.rating }, (_, i) => <IconStar key={i} size={12} filled />)}
                      </span>
                    ) : null}
                  </span>
                  <p className="t-meta">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {also.length > 0 && (
        <section className="section">
          <div className="section-head"><h3 className="t-h2">Also at {v ? v.name : 'this bar'}</h3></div>
          <div className="ds-also">
            {also.map((x) => (
              <button key={x.id} className="mini pressable" type="button" onClick={() => onOpen(x.id)}>{x.name}</button>
            ))}
          </div>
        </section>
      )}
    </Sheet>
  )
}
