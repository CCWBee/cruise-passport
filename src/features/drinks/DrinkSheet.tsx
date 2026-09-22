import { useId, useMemo } from 'react'
import { Sheet } from '../../ui/Sheet'
import { DRINK_BY_ID, ingredientsOf, money, pkgOf, VENUES, START, END, today, type Drink } from '../../data/model'
import { useStore, useAllDrinks } from '../../state/store'
import { commentsFor, groupRating, recommendationsFor, useSources } from '../../state/social'
import { IconStar } from '../../ui/Icon'
import { TextField, TextArea } from '../../ui/Field'
import { FriendDot } from '../../ui/FriendDot'
import './drinksheet.css'

function listNames(names: string[]) {
  if (names.length < 2) return names[0] || ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
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

// Package tier and price as one plain phrase, then the flavours. No pills. A missing price says
// nothing, as the list row does; a price with no tier (a sailing that declares no packages) is the
// price alone, never "$12, – over Premier".
function factsLine(d: Drink): string {
  const tier = pkgOf(d)
  const price = d.price === null ? null
    : tier === 'plus' ? `Plus ${money(d.price)}`
      : tier === 'prem' ? `Premier ${money(d.price)}`
        : tier === 'over' ? `${money(d.price)}, ${money(d.extra)} over Premier`
          : money(d.price)
  const notes = [...d.flavors, ...(d.frozen ? ['Frozen'] : [])].join(', ')
  return [price, notes].filter(Boolean).join(' · ')
}

export function DrinkSheet({ id, onClose }: { id: string; onClose: () => void }) {
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
  if (!d) return null
  const v = VENUES[d.venue]
  // A drink the guest added is theirs alone: share.ts never sends a custom id to the crew, and its
  // sweetness and strength are defaults nobody measured. So it shows no dots, no Recommend and no
  // Comment, and its blurb (never the guest's words) is not printed.
  const custom = id[0] === 'c'
  const facts = factsLine(d)

  const chip = (k: 'tried' | 'fav' | 'wish' | 'rec', label: string, on: boolean, mint?: boolean) => (
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

      {ingredientsOf(d) && <p className="ds-ing t-body">{ingredientsOf(d)}</p>}
      {d.desc && !custom && <p className="ds-desc t-meta">{d.desc}</p>}
      {facts && <p className="ds-facts t-meta">{facts}</p>}
      {!d.verified && <p className="ds-warn t-meta">Not on a published menu. Check at the bar.</p>}

      {!custom && (
        <>
          <div className="ds-meters">
            <Meter label="Sweetness" n={d.sweet} />
            <Meter label="Strength" n={d.strength} />
          </div>
          {/* five empty rings cannot say "none"; every other strength is the dots alone */}
          {d.strength === 0 && <p className="ds-abv t-meta">Alcohol free</p>}
        </>
      )}

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
        {!custom && chip('rec', 'Recommend', !!e.rec)}
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
        label="Private notes"
        rows={3}
        defaultValue={e.notes || ''}
        onChange={(ev) => setNotes(id, ev.target.value)}
      />
      {!custom && (
        <TextArea
          id={`${titleId}-comment`}
          label="Comment for your crew"
          rows={2}
          maxLength={140}
          defaultValue={e.comment || ''}
          onChange={(ev) => setComment(id, ev.target.value)}
        />
      )}

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
    </Sheet>
  )
}
