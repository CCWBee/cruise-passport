import { lazy, Suspense, useEffect, useState } from 'react'
import { hasBackend } from '../../state/backend'
import { joinGroupFlow } from '../../state/groups'
import { buildCard, buildPayload, encodeShare } from '../../state/share'
import { useStore } from '../../state/store'
import { Qr } from '../../ui/Qr'
import { Sheet } from '../../ui/Sheet'
import './friends.css'

// The camera scanner pulls in jsQR; load it only when someone opens it, keeping it off first paint.
const ScanSheet = lazy(() => import('./ScanSheet').then((m) => ({ default: m.ScanSheet })))

// One way in, four routes: show a QR, send a link, scan a friend, or join a group. The QR encodes an
// /add# LINK rather than a bare code, so a phone's own camera app opens the app with no instructions.
// Online it carries an identity card (small, so the QR stays sparse) and the passport follows through
// the feed; offline it carries the whole passport, because nothing else will.
export function AddCrewSheet({ onClose }: { onClose: () => void }) {
  const profile = useStore((s) => s.profile)
  const importCode = useStore((s) => s.importCode)
  const ensureIdentity = useStore((s) => s.ensureIdentity)
  const [link, setLink] = useState('')
  const [scan, setScan] = useState(false)
  const [invite, setInvite] = useState('')
  const [joining, setJoining] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [paste, setPaste] = useState('')
  const [status, setStatus] = useState('')

  // Stamp an identity first: the card is nothing without a code. Then snapshot the share link.
  useEffect(() => {
    ensureIdentity()
    let alive = true
    void (async () => {
      const s = useStore.getState()
      const code = await encodeShare(hasBackend() ? buildCard(s.profile) : buildPayload(s.me, s.profile))
      if (alive) setLink(`${location.origin}${import.meta.env.BASE_URL}add#${code}`)
    })()
    return () => { alive = false }
  }, [ensureIdentity, profile.name, profile.colour])

  // One live region for the whole sheet, at its foot: two of them meant the answer appeared in a
  // different place depending on which button was pressed.
  const flash = (label: string) => {
    setStatus(label)
    setTimeout(() => setStatus((s) => (s === label ? '' : s)), 1400)
  }
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard?.writeText(text); flash(label) } catch { /* clipboard blocked */ }
  }
  const share = async () => {
    if (!link) return
    const data = { title: 'Add me on the Cocktail Passport', text: `${profile.name || 'A friend'} on the Sun Princess`, url: link }
    try {
      if (navigator.share) await navigator.share(data)
      else await copy(link, 'Link copied')
    } catch { /* they dismissed the share sheet */ }
  }

  const join = async () => {
    setJoining(true); setStatus('')
    const result = await joinGroupFlow(invite)
    setJoining(false)
    if (result?.queued) { setStatus('You’ll join as soon as you’re online.'); setInvite('') }
    else if (result?.name) { setStatus(`Joined ${result.name}.`); setInvite('') }
    else setStatus('That invite did not work.')
  }

  const add = async () => {
    const result = await importCode(paste)
    setStatus(result.ok ? `Added ${result.name}.` : (result.reason || 'Could not add that friend.'))
    if (result.ok) setPaste('')
  }

  return (
    <Sheet onClose={onClose} labelledBy="add-crew-title">
      <div className="friends-sheet">
        <h2 className="t-title sheet-title" id="add-crew-title">Add to your crew</h2>
        <p className="sheet-meta">Let them point a camera at this, or send the link.</p>

        <div className="addme" data-noswipe>
          <div className="panel addme-qr">{link ? <Qr value={link} size={200} /> : <div className="addme-qr-skel" aria-hidden />}</div>
          {profile.code && (
            <div className="addme-code">
              <span className="f-label">Your code</span>
              <div className="addme-code-row">
                <code className="tnum addme-code-val">{profile.code}</code>
                <button type="button" className="mini pressable" onClick={() => copy(profile.code!, 'Code copied')}>Copy</button>
              </div>
            </div>
          )}
          <div className="addme-actions">
            <button type="button" className="btn btn-wide" onClick={share} disabled={!link}>Share my link</button>
            <button type="button" className="btn btn-coral btn-wide" onClick={() => setScan(true)}>Scan a friend</button>
          </div>
        </div>

        {hasBackend() && (
          <div className="friends-block">
            <label className="f-field">
              <span className="f-label">Join a group</span>
              <input
                value={invite}
                maxLength={64}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Invite code or link"
                onChange={(event) => { setInvite(event.target.value); setStatus('') }}
              />
            </label>
            <button type="button" className="btn btn-wide friends-action" onClick={join} disabled={joining || !invite.trim()}>{joining ? 'Joining…' : 'Join group'}</button>
          </div>
        )}

        {showPaste ? (
          <div className="friends-block">
            <label className="f-field">
              <span className="f-label">Their passport code</span>
              <textarea
                className="tnum"
                rows={3}
                value={paste}
                onChange={(event) => { setPaste(event.target.value); setStatus('') }}
                placeholder="SPP…"
                spellCheck={false}
              />
            </label>
            <button type="button" className="btn btn-wide friends-action" onClick={add} disabled={!paste.trim()}>Add</button>
          </div>
        ) : (
          <button type="button" className="friends-quiet" onClick={() => setShowPaste(true)}>Paste a code instead</button>
        )}

        {status && <p className="t-meta friends-status" role="status">{status}</p>}
      </div>

      {scan && (
        <Suspense fallback={null}>
          <ScanSheet onClose={() => setScan(false)} onAdded={(name) => setStatus(`Added ${name}.`)} />
        </Suspense>
      )}
    </Sheet>
  )
}
