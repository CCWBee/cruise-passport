import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { extractShareCode } from '../state/share'
import { useStore } from '../state/store'
import { CruisePicker } from '../features/cruise/CruisePicker'
import { Shell } from './Shell'
import { Home } from '../features/home/Home'
import { Drinks } from '../features/drinks/Drinks'
import { Ship } from '../features/ship/Ship'
import { Social } from '../features/social/Social'
import { Stats } from '../features/stats/Stats'
import { Badges } from '../features/badges/Badges'
import { Log } from '../features/log/Log'
import { Wrapped } from '../features/wrapped/Wrapped'

function WrappedRoute() {
  const navigate = useNavigate()
  return <Wrapped onClose={() => navigate('/')} />
}

// Friend invite link. /add#SPP… carries the sender's whole passport in the fragment, so a tap adds
// them fully offline. (The code-only /add/:code form is reserved for the online resolve in Lane 2.)
function AddRoute() {
  const navigate = useNavigate()
  const [msg, setMsg] = useState('Adding your friend…')
  useEffect(() => {
    const raw = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get('c') || ''
    let decoded = raw
    try { decoded = decodeURIComponent(raw) } catch { /* keep raw */ }
    const code = extractShareCode(decoded)
    if (!code.startsWith('SPP')) {
      setMsg('That add link looks incomplete. Ask your friend to share it again.')
      const t = setTimeout(() => navigate('/social'), 1600)
      return () => clearTimeout(t)
    }
    useStore.getState().ensureIdentity()
    let alive = true
    void useStore.getState().importCode(code).then((result) => {
      if (!alive) return
      setMsg(result.ok ? `Added ${result.name}. Taking you to your crew…` : (result.reason || 'Could not read that add link.'))
      setTimeout(() => navigate('/social'), result.ok ? 1100 : 1700)
    })
    return () => { alive = false }
  }, [navigate])
  return (
    <div className="wrap page">
      <div className="glass card center"><p className="t-body">{msg}</p></div>
    </div>
  )
}

function Soon({ title }: { title: string }) {
  return (
    <div className="wrap page">
      <div className="glass card">
        <div className="eyebrow">{title}</div>
        <p className="muted t-body" style={{ marginTop: 6 }}>Being rebuilt in the Liquid Sea Glass pass.</p>
      </div>
    </div>
  )
}

export default function App() {
  const enteredCruise = useStore((s) => s.enteredCruise)
  // First run: choose a cruise before entering its passport. Existing users are migrated to entered.
  if (!enteredCruise) return <CruisePicker />
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/drinks" element={<Drinks />} />
          <Route path="/ship" element={<Ship />} />
          <Route path="/social" element={<Social />} />
          <Route path="/add" element={<AddRoute />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/log" element={<Log />} />
          <Route path="*" element={<Soon title="Not found" />} />
        </Route>
        <Route path="/wrapped" element={<WrappedRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
