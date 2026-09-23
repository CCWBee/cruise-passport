import { useEffect, useId, useMemo, useState } from 'react'
import { BADGES, badgeCount, type BadgeDef, type BadgeStat } from '../../data/badges'
import { computeStats } from '../../state/stats'
import { useAllDrinks, useStore } from '../../state/store'
import { Sheet } from '../../ui/Sheet'
import { openLog } from '../search/log'
import { Coin } from './Coin'
import './badges.css'

// The rank is said in words in the sheet, so the metal is not carrying it alone.
const TIER_NAME: Record<NonNullable<BadgeDef['tier']>, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  special: 'Special',
}

function progressOf(badge: BadgeDef, stat: BadgeStat) {
  const p = badge.progress?.(stat)
  if (!p || p.need <= 0) return null
  return { ...p, pct: Math.min(100, Math.max(0, (p.cur / p.need) * 100)) }
}

export function Badges() {
  const drinks = useAllDrinks()
  const passport = useStore((state) => state.me)
  const badgeStat = useMemo(
    () => computeStats(drinks, passport).badgeStat,
    [drinks, passport],
  )
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null)
  const titleId = useId()

  // deep link: /badges?badge=<id> opens that medal (also used for QA)
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('badge')
    if (id) { const b = BADGES.find((x) => x.id === id); if (b) setSelectedBadge(b) }
  }, [])

  // three groups: what you have, what is within reach, what has not started
  const { earned, close, locked } = useMemo(() => {
    const earned: BadgeDef[] = []
    const close: { badge: BadgeDef; cur: number; need: number; pct: number }[] = []
    const locked: BadgeDef[] = []

    for (const badge of BADGES) {
      if (badge.test(badgeStat)) { earned.push(badge); continue }
      const p = progressOf(badge, badgeStat)
      if (p && p.cur > 0) close.push({ badge, ...p })
      else locked.push(badge)
    }
    close.sort((a, b) => b.pct - a.pct)
    return { earned, close, locked }
  }, [badgeStat])

  const selectedEarned = selectedBadge ? selectedBadge.test(badgeStat) : false
  const selectedProgress = selectedBadge ? progressOf(selectedBadge, badgeStat) : null

  return (
    <div className="badges">
      <section className="section">
        <div className="section-head">
          <h2 className="t-h2">Earned</h2>
          {earned.length > 0 && <p className="t-meta tnum">{earned.length} of {BADGES.length}</p>}
        </div>

        {earned.length ? (
          <div className="badge-grid">
            {earned.map((badge) => (
              <button
                key={badge.id}
                type="button"
                className="badge-medal pressable"
                onClick={() => setSelectedBadge(badge)}
                aria-label={`${badge.name}, earned`}
              >
                <Coin badge={badge} state="earned" size={72} />
                <span className="badge-medal-name t-meta">{badge.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="t-body">Badges arrive as you log drinks.</p>
            <button type="button" className="btn btn-coral" onClick={openLog}>Log a drink</button>
          </div>
        )}
      </section>

      {close.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="t-h2">Close</h2>
          </div>
          {close.map(({ badge, cur, need, pct }) => (
            <button
              key={badge.id}
              type="button"
              className="row badge-row"
              onClick={() => setSelectedBadge(badge)}
              aria-label={`${badge.name}, ${badgeCount(badge, cur, need)}`}
            >
              {/* the hint is the sheet's meta line, one tap away; here the count says what is left */}
              <span className="row-copy">
                <span className="t-strong">{badge.name}</span>
              </span>
              <span className="badge-meter">
                <span className="t-meta tnum">{badgeCount(badge, cur, need)}</span>
                <span
                  className="badge-track"
                  role="progressbar"
                  aria-label={`${badge.name} progress`}
                  aria-valuemin={0}
                  aria-valuemax={need}
                  aria-valuenow={Math.min(cur, need)}
                >
                  <span className="badge-fill" style={{ width: `${pct}%` }} />
                </span>
              </span>
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
              className="row badge-row"
              onClick={() => setSelectedBadge(badge)}
              aria-label={`${badge.name}, locked`}
            >
              <span className="row-copy">
                <span className="t-strong">{badge.name}</span>
                <span className="t-meta">{badge.hint}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      {selectedBadge && (
        <Sheet onClose={() => setSelectedBadge(null)} labelledBy={titleId}>
          <div className="badge-sheet">
            <h2 className="t-title sheet-title" id={titleId}>{selectedBadge.name}</h2>
            <p className="sheet-meta">{selectedBadge.hint} · {TIER_NAME[selectedBadge.tier ?? 'bronze']} tier</p>

            <div className="medal-mount">
              <Coin
                badge={selectedBadge}
                state={selectedEarned ? 'earned' : selectedProgress && selectedProgress.cur > 0 ? 'reach' : 'locked'}
                progress={selectedProgress ? selectedProgress.pct / 100 : undefined}
                size={196}
                flip={selectedEarned}
              />
            </div>

            <p className="t-body badge-state">
              {selectedEarned
                ? 'Earned'
                : selectedProgress
                  ? badgeCount(selectedBadge, selectedProgress.cur, selectedProgress.need)
                  : 'Not earned yet'}
            </p>
          </div>
        </Sheet>
      )}
    </div>
  )
}
