import { Suspense, lazy, useId, useMemo, useState } from 'react'
import { BADGES, type BadgeDef, type BadgeStat } from '../../data/badges'
import { computeStats } from '../../state/stats'
import { useAllDrinks, useStore } from '../../state/store'
import { IconTrophy } from '../../ui/Icon'
import { Sheet } from '../../ui/Sheet'
import './badges.css'

const Medallion = lazy(() => import('./Medallion'))

interface MedalDiscProps {
  badge: BadgeDef
  earned: boolean
  large?: boolean
}

function MedalDisc({ badge, earned, large = false }: MedalDiscProps) {
  const id = useId().replace(/:/g, '')
  const tier = badge.tier ?? 'bronze'

  return (
    <div
      className={`medal-disc medal-${tier} ${earned ? 'is-earned' : 'is-locked'}${large ? ' is-large' : ''}`}
      aria-hidden="true"
    >
      <svg className="medal-art" viewBox="0 0 80 88" focusable="false">
        <defs>
          <linearGradient id={`${id}-rim`} x1="14" y1="7" x2="66" y2="68" gradientUnits="userSpaceOnUse">
            <stop className="medal-stop-bright" />
            <stop className="medal-stop-deep" offset="1" />
          </linearGradient>
          <linearGradient id={`${id}-face`} x1="22" y1="11" x2="59" y2="63" gradientUnits="userSpaceOnUse">
            <stop className="medal-stop-bright" />
            <stop className="medal-stop-deep" offset="1" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="29" y1="9" x2="39" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" stopOpacity=".68" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {earned && (
          <g className="medal-ribbons">
            <path d="M25 55h15l-3 31-7-7-9 5z" />
            <path d="M40 55h15l4 29-9-5-7 7z" />
          </g>
        )}

        <circle className="medal-rim" cx="40" cy="36" r="34" fill={`url(#${id}-rim)`} />
        <circle className="medal-face" cx="40" cy="36" r="29" fill={`url(#${id}-face)`} />
        <ellipse
          className="medal-specular"
          cx="32"
          cy="20"
          rx="18"
          ry="10"
          fill={`url(#${id}-shine)`}
          transform="rotate(-17 32 20)"
        />
        <circle className="medal-inner-highlight" cx="40" cy="36" r="26" />
      </svg>
      <span className="medal-emblem">
        <IconTrophy size={large ? 38 : 27} />
      </span>
    </div>
  )
}

interface BadgeCardProps {
  badge: BadgeDef
  stat: BadgeStat
  onOpen: () => void
}

function BadgeCard({ badge, stat, onOpen }: BadgeCardProps) {
  const earned = badge.test(stat)
  const progress = badge.progress?.(stat)
  const progressPercent = progress
    ? Math.min(100, Math.max(0, (progress.cur / progress.need) * 100))
    : 0

  return (
    <button
      type="button"
      className={`badge-card glass pressable ${earned ? 'is-earned' : 'is-locked'}`}
      onClick={onOpen}
      aria-label={`${badge.name}, ${earned ? 'earned' : 'locked'}`}
    >
      <MedalDisc badge={badge} earned={earned} />
      <span className="badge-name t-strong">{badge.name}</span>
      <span className="badge-hint muted">{badge.hint}</span>

      {!earned && progress && (
        <span className="badge-progress">
          <span
            className="badge-progress-track"
            role="progressbar"
            aria-label={`${badge.name} progress`}
            aria-valuemin={0}
            aria-valuemax={progress.need}
            aria-valuenow={Math.min(progress.cur, progress.need)}
          >
            <span className="badge-progress-fill" style={{ width: `${progressPercent}%` }} />
          </span>
          <span className="badge-progress-copy tnum">
            {progress.cur} of {progress.need}
          </span>
        </span>
      )}
    </button>
  )
}

export function Badges() {
  const drinks = useAllDrinks()
  const passport = useStore((state) => state.me)
  const badgeStat = useMemo(
    () => computeStats(drinks, passport).badgeStat,
    [drinks, passport],
  )
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null)

  const earnedCount = BADGES.filter((badge) => badge.test(badgeStat)).length
  const selectedEarned = selectedBadge ? selectedBadge.test(badgeStat) : false

  return (
    <div className="wrap page badges-page">
      <p className="badges-lead muted tnum">
        {earnedCount} of {BADGES.length} earned
      </p>

      <div className="badge-grid reveal">
        {BADGES.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            stat={badgeStat}
            onOpen={() => setSelectedBadge(badge)}
          />
        ))}
      </div>

      {selectedBadge && (
        <Sheet
          onClose={() => setSelectedBadge(null)}
          eyebrow={<div className="eyebrow">Badge collection</div>}
        >
          <div className="badge-sheet center">
            <div className="medal-mount">
              <Suspense fallback={<MedalDisc badge={selectedBadge} earned={selectedEarned} large />}>
                <Medallion badge={selectedBadge} earned={selectedEarned} />
              </Suspense>
            </div>
            <h2 className="t-title">{selectedBadge.name}</h2>
            <p className="badge-sheet-hint muted t-body">{selectedBadge.hint}</p>
            <span className={`badge-status tag ${selectedEarned ? 'is-earned' : 'is-locked'}`}>
              {selectedEarned ? 'Earned' : 'Locked'}
            </span>
          </div>
        </Sheet>
      )}
    </div>
  )
}
