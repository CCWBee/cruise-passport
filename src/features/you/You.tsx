import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BADGES } from '../../data/badges'
import { computeStats } from '../../state/stats'
import { useAllDrinks, useStore } from '../../state/store'
import { IconChevron } from '../../ui/Icon'
import { Segmented } from '../../ui/Segmented'
import { Coin } from '../badges/Coin'
import { medalGroups } from '../badges/medals'
import './you.css'

export type YouSegment = 'stats' | 'badges' | 'log'

const SEGMENTS: { value: YouSegment; label: string }[] = [
  { value: 'stats', label: 'Stats' },
  { value: 'badges', label: 'Badges' },
  { value: 'log', label: 'Diary' },
]

// The "You" tab: one page, three views. Each view keeps its own route (/stats, /badges, /log) so
// existing links and the browser's back button behave; the segmented control just navigates, in
// place: a whole-page view transition would snapshot the dock and play its droplet twice.
export function You({ segment, children }: { segment: YouSegment; children: ReactNode }) {
  const navigate = useNavigate()
  const drinks = useAllDrinks()
  const passport = useStore((state) => state.me)
  const groups = useMemo(() => medalGroups(computeStats(drinks, passport).badgeStat), [drinks, passport])
  const earned = groups.earned.length
  const next = groups.reach[0]?.badge.name

  return (
    <div className="wrap page you">
      <div className="you-head">
        <h1 className="t-title">You</h1>
        <Segmented options={SEGMENTS} value={segment} onChange={(v) => navigate('/' + v)} ariaLabel="Your pages" />
      </div>

      {/* C's small case: You shows the medals rather than a row about them. On Stats only, which is
          what You opens on: Badges is the full case, where this would say the count twice, and Diary
          is the log of days. Not drawn until a medal is won, since an empty case is a structural zero and
          Stats' own empty state already says what to do. */}
      {segment === 'stats' && earned > 0 && (
        <button
          type="button"
          className="case case-you pressable"
          data-room="night"
          onClick={() => navigate('/badges')}
          aria-label={`Medals, ${earned} of ${BADGES.length} earned${next ? `, ${next} next` : ''}. Open the case.`}
        >
          <span className="case-you-head">
            <span className="row-copy">
              <span className="t-strong">Medals</span>
              <span className="t-meta tnum">
                {earned} of {BADGES.length} earned{next ? ` · ${next} next` : ''}
              </span>
            </span>
            <IconChevron className="case-go" />
          </span>
          <span className="case-coins">
            {groups.earned.slice(0, 6).map((badge) => <Coin key={badge.id} badge={badge} state="earned" size={44} />)}
          </span>
        </button>
      )}

      {children}
    </div>
  )
}
