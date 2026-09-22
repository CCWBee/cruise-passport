import { memo } from 'react'
import { glassFamily } from '../../data/glass'
import { ingredientsOf, money, type Drink } from '../../data/model'
import { useStore } from '../../state/store'
import { GlassIcon, IconCheck, IconStar } from '../../ui/Icon'

// A drink is a row, not a card: the glass it comes in, then name and rating on the first line and
// one meta line, and a tried target at the right edge. The glass says what kind of drink it is
// before a word is read (a pint, a flute, a cup), which the category on the row used to try to say in
// a word nobody needed repeated. The venue lives in the heading above the group, so it leaves the row.
export const DrinkCard = memo(function DrinkCard({ d, onOpen }: { d: Drink; onOpen: (id: string) => void }) {
  const e = useStore((s) => s.me.entries[d.id]) || {}
  const toggleTried = useStore((s) => s.toggleTried)
  // The price as plain text at the end of the meta line, never a pill. The category stays in the
  // sheet's meta line and the Type filter: within a venue group it is usually the same row after row,
  // and the ingredients need the room. The unconfirmed warning belongs to the sheet too.
  const price = d.price !== null ? money(d.price) : ''
  const ingredients = ingredientsOf(d)
  const meta = ingredients || price

  return (
    <article className="dcard">
      <button className="d-open" onClick={() => onOpen(d.id)}>
        <GlassIcon family={glassFamily(d)} className="row-lead" />
        <span className="d-copy">
        <span className="d-line1">
          <span className="d-name">{d.name}</span>
          {e.rating ? (
            <span className="d-stars" aria-label={`${e.rating} out of 5`}>
              {Array.from({ length: e.rating }, (_, i) => <IconStar key={i} size={13} filled />)}
            </span>
          ) : null}
        </span>
        {meta && (
          <span className="d-meta">
            <span className="d-ing">{ingredients}</span>
            {price && <span className="d-fold tnum">{price}</span>}
          </span>
        )}
        </span>
      </button>
      <button
        className={'d-try' + (e.tried ? ' on' : '')}
        aria-pressed={!!e.tried}
        aria-label="Tried"
        onClick={() => toggleTried(d.id)}
      >
        <IconCheck size={22} filled={!!e.tried} />
      </button>
    </article>
  )
})
