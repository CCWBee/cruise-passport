import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { decodeShare, extractShareCode, parseFriend, type SharePayload } from '../state/share'
import { joinGroupFlow } from '../state/groups'
import { hasBackend } from '../state/backend'
import { Confirm } from '../ui/Confirm'
import { CRUISES } from '../data/cruises'
import { useStore } from '../state/store'
import { CruisePicker } from '../features/cruise/CruisePicker'
import { Shell } from './Shell'
import { Home } from '../features/home/Home'
import { Drinks } from '../features/drinks/Drinks'
import { Ship } from '../features/ship/Ship'
import { NameCard, Social } from '../features/social/Social'
import { Stats } from '../features/stats/Stats'
import { Badges } from '../features/badges/Badges'
import { Log } from '../features/log/Log'
import { Wrapped } from '../features/wrapped/Wrapped'
import { You } from '../features/you/You'

function WrappedRoute() {
  const navigate = useNavigate()
  return <Wrapped onClose={() => navigate('/')} />
}

// Friend invite link. /add#SPP… carries the sender's identity card (or, on an offline build, their
// whole passport) in the fragment, so a tap adds them with no internet either way.
// Both invite routes report the same way: on success a short line and an automatic hop to the crew;
// on failure the screen stops, says why, and offers the way on. A two-sentence instruction shown for
// a second and a half, to the guest least likely to read fast, is not a message at all.
function InviteScreen({ msg, failed }: { msg: string; failed: boolean }) {
  return (
    <div className="wrap page">
      <div className="panel card center">
        <p className="t-body" role="status">{msg}</p>
        {failed && <Link to="/social" className="btn btn-wide" style={{ marginTop: 16 }}>Go to your crew</Link>}
      </div>
    </div>
  )
}

// The name comes first, exactly as it does on /join: `befriend` writes both edges, so adding before
// there is a name publishes "A friend" to the sender's roster, and it stays there. The card is
// decoded before any of that, so the question can say who is asking.
function AddRoute() {
  const navigate = useNavigate()
  const named = useStore((s) => Boolean(s.profile.name.trim()))
  const [payload, setPayload] = useState<SharePayload | null>(null)
  // it says what is happening until either the tick or a reason replaces it
  const [msg, setMsg] = useState('Adding your friend…')
  const [failed, setFailed] = useState(false)
  const [added, setAdded] = useState('')

  useEffect(() => {
    const raw = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get('c') || ''
    let decoded = raw
    try { decoded = decodeURIComponent(raw) } catch { /* keep raw */ }
    const code = extractShareCode(decoded)
    if (!code.startsWith('SPP')) {
      setMsg('That add link looks incomplete. Ask your friend to share it again.')
      setFailed(true)
      return
    }
    let alive = true
    void decodeShare(code).then((p) => { if (alive) setPayload(p) }).catch(() => {
      if (!alive) return
      setMsg('Could not read that add link.')
      setFailed(true)
    })
    return () => { alive = false }
  }, [])

  // Sanitised through the same parser the roster uses, so a hostile link cannot put anything but a
  // 24-character name in front of the guest.
  const from = useMemo(() => (payload ? parseFriend(payload).name : ''), [payload])

  useEffect(() => {
    if (!payload || !named || added) return
    useStore.getState().ensureIdentity()
    const result = useStore.getState().importFriendPayload(payload)
    if (result.ok) { setMsg(''); setAdded(`${result.name} added`) }
    else { setMsg(result.reason || 'Could not read that add link.'); setFailed(true) }
  }, [payload, named, added])

  // A link that never decoded has nothing to ask a name for: say so instead.
  if (!named && !failed) {
    return (
      <div className="wrap page">
        <NameCard lead={from && from !== 'A friend'
          ? `${from} is adding you. Tell them who you are, then we’ll add you both.`
          : 'Tell them who you are, then we’ll add you.'} />
      </div>
    )
  }
  return (
    <>
      {msg ? <InviteScreen msg={msg} failed={failed} /> : <div className="wrap page" />}
      {added && <Confirm label={added} onDone={() => navigate('/social')} />}
    </>
  )
}

// Group invite link. /join#INVITE joins the group online, then drops you on Social. The name comes
// first: both group RPCs resolve a member through their profile row, so joining before there is a
// name puts "A friend" in front of everyone already in the group.
function JoinRoute() {
  const navigate = useNavigate()
  const named = useStore((s) => Boolean(s.profile.name.trim()))
  const [msg, setMsg] = useState('Joining the group…')
  const [failed, setFailed] = useState(false)
  const [joined, setJoined] = useState('')
  useEffect(() => {
    if (!named) return
    const invite = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get('g') || ''
    if (!invite) { setMsg('That invite link looks incomplete.'); setFailed(true); return }
    // hasBackend() is a build-time flag, not connectivity: telling someone on full ship Wi-Fi to try
    // again when they are online would have them retrying all week.
    if (!hasBackend()) {
      setMsg('Group invites are not available in this version of the app. Ask your friend to send their own add link instead.')
      setFailed(true)
      return
    }
    useStore.getState().ensureIdentity()
    let alive = true
    void joinGroupFlow(invite).then((result) => {
      if (!alive) return
      // Joined: the tick says so, and takes them on. Tapped on the coach with no signal: the invite
      // is held and replayed on the next pull, which is a promise about later, not a confirmation.
      if (result && !result.queued) { setMsg(''); setJoined(`Joined ${result.name}`); return }
      setMsg(result?.queued ? 'You’ll join as soon as you’re online. Taking you to your crew…'
        : 'That invite did not work. Ask for the code again.')
      if (result) setTimeout(() => navigate('/social'), 1100)
      else setFailed(true)
    })
    return () => { alive = false }
  }, [named, navigate])
  if (!named) {
    return (
      <div className="wrap page">
        <NameCard lead="Tell the group who you are, then we’ll add you." />
      </div>
    )
  }
  return (
    <>
      {msg ? <InviteScreen msg={msg} failed={failed} /> : <div className="wrap page" />}
      {joined && <Confirm label={joined} onDone={() => navigate('/social')} />}
    </>
  )
}

// Catch-all. Every real screen has a route, so anything landing here is a mistyped or stale link.
function NotFound() {
  return (
    <div className="wrap page">
      <h1 className="t-title">Not found</h1>
      <p className="muted t-body">That link does not go anywhere here.</p>
      <Link to="/" className="btn" style={{ marginTop: 16 }}>Back to your passport</Link>
    </div>
  )
}

export default function App() {
  const enteredCruise = useStore((s) => s.enteredCruise)
  // Choosing a voyage is only a question when there is more than one; with a single sailing the
  // picker is a card in front of every invite link, so it does not render.
  if (!enteredCruise && CRUISES.length > 1) return <CruisePicker />
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/drinks" element={<Drinks />} />
          <Route path="/ship" element={<Ship />} />
          <Route path="/social" element={<Social />} />
          <Route path="/add" element={<AddRoute />} />
          <Route path="/join" element={<JoinRoute />} />
          <Route path="/you" element={<Navigate to="/stats" replace />} />
          <Route path="/stats" element={<You segment="stats"><Stats /></You>} />
          <Route path="/badges" element={<You segment="badges"><Badges /></You>} />
          <Route path="/log" element={<You segment="log"><Log /></You>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/wrapped" element={<WrappedRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
