import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Segmented } from '../../ui/Segmented'
import './you.css'

export type YouSegment = 'stats' | 'badges' | 'log'

const SEGMENTS: { value: YouSegment; label: string }[] = [
  { value: 'stats', label: 'Stats' },
  { value: 'badges', label: 'Badges' },
  { value: 'log', label: 'Log' },
]

// The "You" tab: one page, three views. Each view keeps its own route (/stats, /badges, /log) so
// existing links and the browser's back button behave; the segmented control just navigates.
export function You({ segment, children }: { segment: YouSegment; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="wrap page you">
      <div className="you-head">
        <h1 className="t-title">You</h1>
        <Segmented options={SEGMENTS} value={segment} onChange={(v) => navigate('/' + v, { viewTransition: true })} ariaLabel="Your pages" />
      </div>
      {children}
    </div>
  )
}
