import { memo } from 'react'
import { glassFamily } from '../../data/glass'
import { ingredientsOf, money, type Drink } from '../../data/model'
import { useStore } from '../../state/store'
import { GlassIcon, IconStar } from '../../ui/Icon'

// The tried check, prototype C's: a ring, and when ticked a mint disc that springs in under a tick
// that draws itself. It is the row's control rather than an icon, so it is drawn here and not with
// IconCheck: the disc springs and the tick draws, which a static glyph cannot. The glow of a ticked
// check is the ring widened behind the disc, a stroke rather than a filter on a list of two hundred.
function TriedMark() {
  return (
    <svg className="d-mark" viewBox="0 0 24 24" aria-hidden>
      <circle className="d-ring" cx="12" cy="12" r="9.2" />
      <circle className="d-disc" cx="12" cy="12" r="10" />
      <path className="d-tick" d="M7.8 12.3l2.8 2.8 5.6-5.8" />
    </svg>
  )
}

// A drink is a row, not a card (prototype C's): the glass it comes in, lit in its family's hue, then
// name and rating on the first line and one meta line, and the tried check at the right edge. The
// glass says what kind of drink it is before a word is read (a pint, a flute, a cup). The venue lives
// in the heading above the group, so it leaves the row.
// onTried hears the check's answer, for a caller that says more than the check does (the search's
// Undo toast); the check itself is the confirmation everywhere else.
export const DrinkCard = memo(function DrinkCard({ d, onOpen, onTried }: {
  d: Drink
  onOpen: (id: string) => void
  onTried?: (d: Drink, tried: boolean) => void
}) {
  const e = useStore((s) => s.me.entries[d.id]) || {}
  const toggleTried = useStore((s) => s.toggleTried)
  // The price leads the meta line, as plain text and never a pill: after the ingredients the
  // ellipsis always cut it off (C's second pass). The category stays in the sheet's meta line and the
  // Type filter, since within a venue group it is usually the same row after row.
  const price = d.price !== null ? money(d.price) : ''
  const ingredients = ingredientsOf(d)

  return (
    <article className="dcard">
      <button className="d-open" onClick={() => onOpen(d.id)}>
        <GlassIcon family={glassFamily(d)} size={30} className="row-lead" />
        <span className="d-copy">
          <span className="d-line1">
            <span className="d-name">{d.name}</span>
            {e.rating ? (
              <span className="d-stars" aria-label={`${e.rating} out of 5`}>
                {Array.from({ length: e.rating }, (_, i) => <IconStar key={i} size={13} filled />)}
              </span>
            ) : null}
          </span>
          {(price || ingredients) && (
            <span className="d-meta">
              {price && <span className="tnum">{price}</span>}
              {price && ingredients ? ' · ' : ''}
              {ingredients}
            </span>
          )}
        </span>
      </button>
      <button
        className={'d-try' + (e.tried ? ' on' : '')}
        aria-pressed={!!e.tried}
        aria-label={`Tried, ${d.name}`}
        onClick={() => { const on = toggleTried(d.id); onTried?.(d, on) }}
      >
        <TriedMark />
      </button>
    </article>
  )
})
