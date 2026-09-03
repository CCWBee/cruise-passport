import { Suspense, lazy, useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BADGES, type BadgeDef, type BadgeStat } from '../../data/badges'
import { computeStats } from '../../state/stats'
import { useAllDrinks, useStore } from '../../state/store'
import { IconTrophy } from '../../ui/Icon'
import { Sheet } from '../../ui/Sheet'
import { EMBLEMS } from './emblems-data'
import './badges.css'

const Medallion = lazy(() => import('./Medallion'))

interface MedalDiscProps {
  badge: BadgeDef
  earned: boolean
  large?: boolean
}

// Bronze, silver and gold are ranks here, not colours: the ladder is four steps of ink, and the
// rank is said in words in the sheet so the disc is not carrying it alone.
const TIER_NAME: Record<NonNullable<BadgeDef['tier']>, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  special: 'Special',
}

// A coin, not a rosette: one metal face, a 1px hairline rim, the emblem struck pale into it.
function MedalDisc({ badge, earned, large = false }: MedalDiscProps) {
  const tier = badge.tier ?? 'bronze'
  const size = large ? 116 : 72
  const emblem = EMBLEMS[badge.id]
  const art = large ? 60 : 42

  return (
    <span
      className={`medal-disc medal-tier medal-${tier} ${earned ? 'is-earned' : 'is-locked'}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg className="medal-art" viewBox="0 0 64 64" width={size} height={size} focusable="false">
        <circle className="medal-face" cx="32" cy="32" r="31.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="medal-emblem">
        {emblem ? (
          <svg
            className="medal-emblem-svg"
            viewBox="0 0 100 100"
            width={art}
            height={art}
            dangerouslySetInnerHTML={{ __html: emblem }}
          />
        ) : (
          <IconTrophy size={large ? 44 : 26} />
        )}
      </span>
    </span>
  )
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
          <p className="t-meta tnum">{earned.length} of {BADGES.length} earned</p>
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
                <MedalDisc badge={badge} earned />
                <span className="badge-medal-name t-meta">{badge.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className="t-meta">Badges arrive as you log drinks.</p>
            <Link className="badge-empty-action" to="/drinks">Log a drink</Link>
          </>
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
              aria-label={`${badge.name}, ${cur} of ${need}`}
            >
              <span className="row-copy">
                <span className="t-strong">{badge.name}</span>
                <span className="t-meta">{badge.hint}</span>
              </span>
              <span className="badge-meter">
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
                <span className="t-meta tnum">{cur} of {need}</span>
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
              <Suspense fallback={<MedalDisc badge={selectedBadge} earned={selectedEarned} large />}>
                <Medallion badge={selectedBadge} earned={selectedEarned} />
              </Suspense>
            </div>

            <p className="t-body badge-state">
              {selectedEarned
                ? 'Earned'
                : selectedProgress
                  ? `Not earned yet: ${selectedProgress.cur} of ${selectedProgress.need}`
                  : 'Not earned yet'}
            </p>
          </div>
        </Sheet>
      )}
    </div>
  )
}
