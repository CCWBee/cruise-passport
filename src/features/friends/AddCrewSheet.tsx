import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { befriend, findProfiles, hasBackend, type FoundProfile } from '../../state/backend'
import { joinGroupFlow } from '../../state/groups'
import { buildCard, buildPayload, encodeShare, normaliseCode } from '../../state/share'
import { useStore } from '../../state/store'
import { refreshNow } from '../../state/sync'
import { FriendDot } from '../../ui/FriendDot'
import { IconCamera } from '../../ui/Icon'
import { Qr } from '../../ui/Qr'
import { Sheet } from '../../ui/Sheet'
import './friends.css'

// The camera scanner pulls in jsQR; load it only when someone opens it, keeping it off first paint.
const ScanSheet = lazy(() => import('./ScanSheet').then((m) => ({ default: m.ScanSheet })))

// Server-first (docs/DESIGN.md, Crew > "Add to your crew"). The backend can find a person by name and
// `befriend` writes both edges, so typing their name is the front door and the phone-to-phone routes
// are the fallback below it: the link (which is also AirDrop and Nearby Share, the web having no
// contact-tap of its own), the QR and the code, then a pasted code. The QR encodes the /add# LINK
// rather than a bare code, so a phone's own camera app opens the app with no instructions. Online it
// carries an identity card (small, so the QR stays sparse) and the passport follows through the feed;
// offline it carries the whole passport, because nothing else will.

const DEBOUNCE_MS = 250
/** The search's five states. Waiting and "nobody" are different answers and must not share a line. */
type Find = 'idle' | 'searching' | 'ready' | 'offline'

export function AddCrewSheet({ onClose, onDone }: {
  onClose: () => void
  /** something landed that the guest cannot otherwise see: the caller ticks and closes this sheet.
   *  `code` is who, so the roster can mark the row that just appeared. */
  onDone: (label: string, code?: string) => void
}) {
  const profile = useStore((s) => s.profile)
  const friends = useStore((s) => s.friends)
  const importCode = useStore((s) => s.importCode)
  const importFriendPayload = useStore((s) => s.importFriendPayload)
  const ensureIdentity = useStore((s) => s.ensureIdentity)
  const [link, setLink] = useState('')
  const [scan, setScan] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [invite, setInvite] = useState('')
  const [joining, setJoining] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [paste, setPaste] = useState('')
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<FoundProfile[]>([])
  const [find, setFind] = useState<Find>('idle')
  const online = hasBackend()

  // Stamp an identity first: the card is nothing without a code. Then snapshot the share link, so the
  // tap that shares it has nothing to wait for.
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

  // Anyone already on the roster, by code: a co-member from a group counts, so the row says so rather
  // than offering to add someone who is already there.
  const held = useMemo(
    () => new Set(friends.map((f) => f.code).filter((c): c is string => Boolean(c))),
    [friends],
  )

  // Debounced, and every response carries the number of the query that asked for it: a slow answer to
  // "sa" must never overwrite the answer to "sam", and "nobody" must never appear before the current
  // query has been answered. While a new one is in flight the previous rows stay on screen, so the
  // list does not blink empty between keystrokes; their Add is disabled for those few hundred
  // milliseconds, because adding writes an edge on a stranger's account and the rows on screen are
  // the answer to a question that has been abandoned.
  const seq = useRef(0)
  useEffect(() => {
    const term = query.trim()
    if (!online || term.length < 2) { seq.current++; setFound([]); setFind('idle'); return }
    const mine = ++seq.current
    setFind('searching')
    const timer = setTimeout(() => {
      void findProfiles(term).then((rows) => {
        if (mine !== seq.current) return
        if (!rows) { setFound([]); setFind('offline'); return }
        setFound(rows); setFind('ready')
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, online])
  // A response that lands after the sheet has gone belongs to nobody.
  useEffect(() => () => { seq.current++ }, [])

  // One live region for the whole sheet, at its foot: two of them meant the answer appeared in a
  // different place depending on which button was pressed. A success is not reported here at all —
  // it goes to the tick, which is the same everywhere in the app.
  const flash = (label: string) => {
    setStatus(label)
    setTimeout(() => setStatus((s) => (s === label ? '' : s)), 1400)
  }
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard?.writeText(text); flash(label) } catch { /* clipboard blocked */ }
  }
  // Called straight from the tap, not after an await: iOS opens the share sheet only inside the
  // gesture that asked for it, and the link is already in hand.
  const share = () => {
    if (!link) return
    const data = { title: 'Add me on the Cocktail Passport', text: `${profile.name || 'A friend'} on the Sun Princess`, url: link }
    if (navigator.share) void navigator.share(data).catch(() => { /* they dismissed the share sheet */ })
    else void copy(link, 'Link copied')
  }

  // A found person becomes a friend through the same card the QR and the /add# link take: id
  // "c:<code>" until their real one arrives with their passport, no entries, pending. Going through
  // that one merge path rather than a second hand-built upsert keeps the own-code guard, the
  // promotion of a group-only co-member, and the cancelling of a removal that never reached the
  // server. `needsEdge` would carry the edge to the next pull on its own; asking for it here is what
  // makes their passport land while the tick is still on screen.
  const addFound = (row: FoundProfile) => {
    const code = normaliseCode(row.code)
    const result = importFriendPayload({
      v: 2, id: 'c:' + code, n: row.name, c: row.colour, ts: 0, k: code, cd: 1, e: {}, s: {},
    })
    if (!result.ok) { setStatus(result.reason || 'Could not add them.'); return }
    void befriend(code).then(() => refreshNow())
    onDone(`${result.name} added`, code)
  }

  const join = async () => {
    setJoining(true); setStatus('')
    const result = await joinGroupFlow(invite)
    setJoining(false)
    // Queued is not joined: it is a promise about later, so it stays a line of text.
    if (result?.queued) { setStatus('You’ll join as soon as you’re online.'); setInvite('') }
    else if (result?.name) onDone(`Joined ${result.name}`)
    else setStatus('That invite did not work.')
  }

  const add = async () => {
    const result = await importCode(paste)
    if (result.ok) onDone(`${result.name} added`)
    else setStatus(result.reason || 'Could not add that friend.')
  }

  // One line under the field, and always the same element: a live region inserted with its text
  // already in it is not announced, only a change inside one that was already there. Idle it says
  // what to type; searching, nobody and no connection are three different answers and never share a
  // line. Once rows are on screen the rows are the answer, so the line becomes the count and hides
  // itself rather than repeating in ink what the list already shows.
  const rows = found.length
  const note = find === 'searching' ? 'Searching…'
    : find === 'offline' ? 'No connection, so the search cannot run. Your link still works.'
    : find === 'ready' && rows === 0 ? 'Nobody by that name yet. They may not have set a name.'
    : rows > 0 ? (rows === 1 ? '1 person found' : `${rows} people found`)
    : 'Their name, or the code at the top of their Crew page.'

  return (
    <Sheet onClose={onClose} labelledBy="add-crew-title">
      <div className="friends-sheet">
        <h2 className="t-title sheet-title" id="add-crew-title">Add to your crew</h2>
        {/* what the sheet is for, not the privacy trade: the one line under the field carries that */}
        <p className="sheet-meta">{online ? 'Find them by name, or send them your link.' : 'Send them your link, or scan their code.'}</p>

        {/* 1. the front door: the server knows who is aboard, so start by typing who you want */}
        {online && (
          <div className="addme-find">
            <div className="section-head"><h3 className="t-h2">Find them</h3></div>
            <label className="f-field">
              <span className="f-label">Their name or code</span>
              <input
                value={query}
                maxLength={40}
                inputMode="search"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => { setQuery(event.target.value); setStatus('') }}
              />
            </label>

            {found.length > 0 && (
              <div className="friends-roster addme-found" data-noswipe>
                {found.map((row) => {
                  const code = normaliseCode(row.code)
                  return (
                    <div className="row friend-row" key={code || row.name}>
                      <FriendDot name={row.name} colour={row.colour} size={28} />
                      <div className="row-copy">
                        <span className="t-body">{row.name}</span>
                        <span className="t-meta tnum">{row.code}</span>
                      </div>
                      {held.has(code)
                        ? <span className="t-meta addme-held">In your crew</span>
                        : (
                          <button
                            type="button"
                            className="mini pressable addme-add"
                            aria-label={`Add ${row.name}`}
                            disabled={find === 'searching'}
                            onClick={() => addFound(row)}
                          >
                            Add
                          </button>
                        )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* the one line the search speaks through, mounted whether it has anything to say or not */}
            <p className={rows > 0 ? 'sr-only' : 't-meta addme-note'} role="status">{note}</p>
          </div>
        )}

        {/* 2. the route that needs nothing from the server, and hands it to someone standing beside
            you. Offline it is not an alternative to anything, it is the route, so it drops the "Or"
            and the line above points at it rather than repeating it as a second button. */}
        <button type="button" className="btn btn-wide addme-send" onClick={share} disabled={!link}>
          {online && find !== 'offline' ? 'Or send your link' : 'Send your link'}
        </button>
        <p className="t-meta addme-hint">Standing together? AirDrop or Nearby Share it from the share sheet. Otherwise message it.</p>

        {/* 3. the two quiet routes for the phone that will not take a link */}
        <div className="addme-actions">
          <button type="button" className="btn" onClick={() => setScan(true)}>
            <IconCamera size={18} />
            Scan their code
          </button>
          <button type="button" className="btn" aria-expanded={showCode} onClick={() => setShowCode((v) => !v)}>
            {showCode ? 'Hide my code' : 'Show my code'}
          </button>
        </div>

        {showCode && (
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
          </div>
        )}

        {/* 4. a group someone else has already made */}
        {online && (
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

        {/* 5. the last resort, when the camera is refused and there is no signal for the search */}
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
          <ScanSheet onClose={() => setScan(false)} onDone={onDone} />
        </Suspense>
      )}
    </Sheet>
  )
}
