import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react'
import { encodeShare, buildPayload } from '../../state/share'
import { FRIEND_COLOURS, useStore } from '../../state/store'
import { syncNow, useSyncStore } from '../../state/sync'
import { FriendDot } from '../../ui/FriendDot'
import { Qr } from '../../ui/Qr'
import { Sheet } from '../../ui/Sheet'
import '../drinks/drinksheet.css'
import './friends.css'

// The camera scanner pulls in jsQR; load it only when someone opens it, keeping it off first paint.
const ScanSheet = lazy(() => import('./ScanSheet').then((m) => ({ default: m.ScanSheet })))

export function FriendsSheet({ onClose }: { onClose: () => void }) {
  const { profile, friends, setProfile, setGroup, removeFriend, importCode, ensureIdentity } = useStore()
  const sync = useSyncStore()
  const [paste, setPaste] = useState('')
  const [status, setStatus] = useState('')
  const [group, setGroupInput] = useState(profile.groupCode)
  const [spp, setSpp] = useState('') // my full passport as a share code, for the QR + link
  const [copied, setCopied] = useState('')
  const [scan, setScan] = useState(false)
  // The group section only appears once a sync backend is configured (Worker deployed + VITE_SYNC_URL
  // set, or a per-profile override). Until then the app is offline-only and QR/paste are the path.
  const syncEnabled = Boolean(import.meta.env.VITE_SYNC_URL || profile.syncUrl)

  // Ensure a stable identity, then build my shareable passport for the QR + link (snapshot on open).
  useEffect(() => {
    ensureIdentity()
    let alive = true
    void (async () => {
      const s = useStore.getState()
      const code = await encodeShare(buildPayload(s.me, s.profile))
      if (alive) setSpp(code)
    })()
    return () => { alive = false }
  }, [ensureIdentity, profile.name, profile.colour])

  const addLink = spp ? `${location.origin}${import.meta.env.BASE_URL}add#${spp}` : ''

  const flash = (label: string) => { setCopied(label); setTimeout(() => setCopied(''), 1400) }
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard?.writeText(text); flash(label) } catch { /* clipboard blocked */ }
  }
  const share = async () => {
    if (!addLink) return
    const data = { title: 'Add me on the Cocktail Passport', text: `${profile.name || 'A friend'} on the Sun Princess`, url: addLink }
    try {
      if (navigator.share) await navigator.share(data)
      else await copy(addLink, 'Link copied')
    } catch { /* user dismissed the share sheet */ }
  }

  const updateProfile = (next: { name?: string; colour?: string }) => setProfile(next)

  const add = async () => {
    const result = await importCode(paste)
    setStatus(result.ok ? `Added ${result.name}.` : (result.reason || 'Could not add that friend.'))
    if (result.ok) setPaste('')
  }

  const saveGroup = () => {
    setGroup(group)
    setGroupInput(useStore.getState().profile.groupCode)
  }

  const syncText = sync.status === 'off'
    ? 'Sync off'
    : sync.status === 'held'
      ? 'Held: will sync when you’re back online'
      : sync.status === 'syncing'
        ? 'Syncing…'
        : sync.status === 'error'
          ? 'Sync failed. Try again.'
          : sync.lastSyncedAt
            ? 'Synced just now'
            : 'Ready to sync'

  return (
    <Sheet onClose={onClose} eyebrow={<div className="sheet-eyebrow eyebrow">Sailing together</div>}>
      <div className="friends-sheet">
        <h2 className="t-title friends-title">Friends</h2>

        <label className="ds-field">
          <span className="eyebrow">Your name</span>
          <input
            value={profile.name}
            maxLength={24}
            autoComplete="name"
            placeholder="Your name"
            onChange={(event) => updateProfile({ name: event.target.value })}
          />
        </label>

        <div className="ds-field">
          <span className="eyebrow">Your colour</span>
          <div className="fpick">
            {FRIEND_COLOURS.map((colour) => (
              <button
                type="button"
                key={colour}
                className={'fpick-dot pressable' + (profile.colour === colour ? ' on' : '')}
                style={{ '--fc': `var(--fruit-${colour})` } as CSSProperties}
                aria-label={`Use ${colour}`}
                aria-pressed={profile.colour === colour}
                onClick={() => updateProfile({ colour })}
              />
            ))}
          </div>
        </div>

        <div className="addme" data-noswipe>
          <div className="addme-qr">{spp ? <Qr value={spp} size={200} /> : <div className="addme-qr-skel" aria-hidden />}</div>
          <p className="muted t-body addme-hint">Let a friend scan this to add you, with everything you have logged.</p>
          {profile.code && (
            <div className="addme-code">
              <span className="eyebrow">Your code</span>
              <div className="addme-code-row">
                <code className="tnum addme-code-val">{profile.code}</code>
                <button type="button" className="mini pressable" onClick={() => copy(profile.code!, 'Code copied')}>Copy</button>
              </div>
            </div>
          )}
          <div className="addme-actions">
            <button type="button" className="btn btn-wide" onClick={share} disabled={!addLink}>Share my link</button>
            <button type="button" className="btn btn-coral btn-wide" onClick={() => setScan(true)}>Scan a friend</button>
          </div>
          {copied && <p className="muted t-body friends-status" role="status">{copied}</p>}
        </div>

        {syncEnabled && (
        <div className="friends-group">
          <label className="ds-field">
            <span className="eyebrow">Cruise group</span>
            <input
              value={group}
              maxLength={64}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setGroupInput(event.target.value.replace(/[^A-Za-z0-9_-]/g, ''))}
              placeholder="Group code"
            />
          </label>
          <button type="button" className="btn btn-wide friends-action" onClick={saveGroup}>
            {profile.groupCode ? (group ? 'Update group' : 'Leave group') : 'Join group'}
          </button>
          <p className="muted t-body friends-status" role="status">{syncText}</p>
          <button
            type="button"
            className="btn btn-wide friends-action"
            onClick={() => { void syncNow() }}
            disabled={sync.status === 'off' || sync.status === 'syncing'}
          >
            Sync now
          </button>
        </div>
        )}

        <label className="ds-field friends-paste">
          <span className="eyebrow">Or paste a friend’s code</span>
          <textarea
            className="tnum"
            rows={3}
            value={paste}
            onChange={(event) => { setPaste(event.target.value); setStatus('') }}
            placeholder="SPP…"
            spellCheck={false}
          />
        </label>
        <button type="button" className="btn btn-wide friends-action" onClick={add} disabled={!paste.trim()}>Add friend</button>
        {status && <p className="muted t-body friends-status" role="status">{status}</p>}

        {friends.length > 0 && (
          <div className="friends-roster" aria-label="Friends roster">
            {friends.map((friend) => (
              <div className="friend-row" key={friend.id}>
                <FriendDot name={friend.name} colour={friend.colour} size={30} />
                <div className="friend-copy">
                  <strong>{friend.name}</strong>
                  <small className="muted tnum">
                    {friend.pending ? 'Waiting to connect' : `${Object.keys(friend.passport.entries).length} logged`}
                  </small>
                </div>
                <button
                  type="button"
                  className="mini pressable friend-remove"
                  onClick={() => removeFriend(friend.id)}
                  aria-label={`Remove ${friend.name}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {scan && (
        <Suspense fallback={null}>
          <ScanSheet onClose={() => setScan(false)} onAdded={(name) => setStatus(`Added ${name}.`)} />
        </Suspense>
      )}
    </Sheet>
  )
}
