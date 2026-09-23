import { useId, useMemo, useState } from 'react'
import { BADGES, TIER_WORD, badgeCount, type BadgeDef } from '../../data/badges'
import { computeStats } from '../../state/stats'
import { useAllDrinks, useStore } from '../../state/store'
import { GlassButton } from '../../ui/GlassButton'
import { Sheet } from '../../ui/Sheet'
import { openLog } from '../search/log'
import { Coin } from './Coin'
import { medalGroups, progressOf, remainder, struckLine, unstruckLine } from './medals'
import './badges.css'

// The medal case, the Badges segment of You (docs/DESIGN.md, Screens, You): what is won lies on the
// velvet, large and in tier order; what is in reach is a ringed blank with what is left; what is
// locked is a blank with what earns it. Home's tray opens this in one tap.
export function Badges() {
  const drinks = useAllDrinks()
  const passport = useStore((state) => state.me)
  const badgeStat = useMemo(
    () => computeStats(drinks, passport).badgeStat,
    [drinks, passport],
  )
  // deep link: /badges?badge=<id> opens with that medal's sheet up (Home's new medal, and QA)
  const [selected, setSelected] = useState<BadgeDef | null>(() => {
    const id = new URLSearchParams(location.search).get('badge')
    return BADGES.find((x) => x.id === id) ?? null
  })
  // a coin tapped in the case turns as the sheet rises (C); a deep link opens it still
  const [tapped, setTapped] = useState(false)
  const titleId = useId()

  const { earned, reach, locked } = useMemo(() => medalGroups(badgeStat), [badgeStat])
  const open = (badge: BadgeDef) => { setTapped(true); setSelected(badge) }

  const selectedEarned = selected ? selected.test(badgeStat) : false
  const selectedProgress = selected ? progressOf(selected, badgeStat) : null
  // the dated line replays the passport once per day logged, so it is worked out for the sheet
  // that is open and not for every coin in the case
  const line = useMemo(() => {
    if (!selected) return ''
    return selected.test(badgeStat)
      ? struckLine(selected, drinks, passport)
      : unstruckLine(selected, progressOf(selected, badgeStat))
  }, [selected, badgeStat, drinks, passport])

  return (
    <div className="badges">
      <section className="section">
        <div className="section-head">
          <h2 className="t-h2">Earned</h2>
          {earned.length > 0 && <p className="t-meta tnum">{earned.length} of {BADGES.length}</p>}
        </div>

        {earned.length ? (
          // The velvet belongs to the night bar in every room, so it carries night's light and ink
          // (DESIGN.md, You): a silver coin reads as metal on dark cloth and as plastic on a pale one
          <div className="case case-full" data-room="night">
            <div className="case-grid">
              {earned.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  className="case-item pressable"
                  onClick={() => open(badge)}
                  aria-label={`${badge.name}, ${TIER_WORD[badge.tier ?? 'bronze']}`}
                >
                  <Coin badge={badge} state="earned" size={92} />
                  <span className="case-name">{badge.name}</span>
                  <span className="case-tier">{TIER_WORD[badge.tier ?? 'bronze']}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p className="t-body">Badges arrive as you log drinks.</p>
            {/* secondary: the dock's Log is this screen's one coral fill, and the same action */}
            <GlassButton variant="secondary" onClick={openLog}>Log a drink</GlassButton>
          </div>
        )}
      </section>

      {reach.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="t-h2">In reach</h2>
          </div>
          {reach.map(({ badge, progress }) => (
            <button
              key={badge.id}
              type="button"
              className="row medal-row"
              onClick={() => open(badge)}
              aria-label={`${badge.name}, ${badgeCount(badge, progress.cur, progress.need)}, ${remainder(badge, progress)}`}
            >
              {/* the ring is the measure, so the row carries no bar of its own */}
              <span className="medal-lead">
                <Coin badge={badge} state="reach" progress={progress.pct / 100} size={52} />
              </span>
              <span className="row-copy">
                <span className="t-strong">{badge.name}</span>
                <span className="t-meta">{remainder(badge, progress)}</span>
              </span>
              <span className="medal-count t-meta tnum">{badgeCount(badge, progress.cur, progress.need)}</span>
            </button>
          ))}
        </section>
      )}

      {locked.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="t-h2">Locked</h2>
          </div>
          {locked.map((badge) => (
            <button
              key={badge.id}
              type="button"
              className="row medal-row"
              onClick={() => open(badge)}
              aria-label={`${badge.name}, locked. ${badge.hint}`}
            >
              <span className="medal-lead">
                <Coin badge={badge} state="locked" size={44} />
              </span>
              {/* the hint is the only place here that says what earns it */}
              <span className="row-copy">
                <span className="t-strong">{badge.name}</span>
                <span className="t-meta">{badge.hint}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      {selected && (
        <Sheet height="medium" onClose={() => { setSelected(null); setTapped(false) }} labelledBy={titleId}>
          {/* C's order: the coin is what the sheet is about, so it leads, and the title and its one
              meta line follow it */}
          <div className="medal-sheet">
            <Coin
              key={selected.id}
              badge={selected}
              state={selectedEarned ? 'earned' : selectedProgress && selectedProgress.cur > 0 ? 'reach' : 'locked'}
              progress={selectedProgress ? selectedProgress.pct / 100 : undefined}
              size={196}
              flip={selectedEarned}
              turn={selectedEarned && tapped}
              className="medal-sheet-coin"
            />
            <h2 className="t-h2 sheet-title" id={titleId}>{selected.name}</h2>
            <p className="sheet-meta">{TIER_WORD[selected.tier ?? 'bronze']} · {selected.hint}</p>
            {line && <p className="t-body medal-sheet-line">{line}</p>}
          </div>
        </Sheet>
      )}
    </div>
  )
}
