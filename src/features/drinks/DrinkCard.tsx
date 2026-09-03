import { memo } from 'react'
import { money, type Drink } from '../../data/model'
import { useStore } from '../../state/store'
import { IconCheck, IconStar } from '../../ui/Icon'

// A drink is a row, not a card: name and rating on the first line, one meta line, a tried target
// at the right edge. The venue lives in the heading above the group, so it leaves the row.
export const DrinkCard = memo(function DrinkCard({ d, onOpen }: { d: Drink; onOpen: (id: string) => void }) {
  const e = useStore((s) => s.me.entries[d.id]) || {}
  const toggleTried = useStore((s) => s.toggleTried)
  // Tier and price as plain text at the end of the meta line, never pills, and one middle dot at
  // most: the unconfirmed warning belongs to the sheet, where there is room to say what it means.
  const fold = [d.category, d.price !== null ? money(d.price) : null].filter(Boolean).join(' · ')

  return (
    <article className="dcard">
      <button className="d-open" onClick={() => onOpen(d.id)}>
        <span className="d-line1">
          <span className="d-name">{d.name}</span>
          {e.rating ? (
            <span className="d-stars" aria-label={`${e.rating} out of 5`}>
              {Array.from({ length: e.rating }, (_, i) => <IconStar key={i} size={13} filled />)}
            </span>
          ) : null}
        </span>
        <span className="d-meta">
          <span className="d-ing">{d.ingredients}</span>
          <span className="d-fold tnum">{fold}</span>
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
