import { useState, type CSSProperties } from 'react'
import { encodeShare, buildPayload, ensureMyId } from '../../state/share'
import { FRIEND_COLOURS, useStore } from '../../state/store'
import { FriendDot } from '../../ui/FriendDot'
import { Sheet } from '../../ui/Sheet'
import '../drinks/drinksheet.css'
import './friends.css'

export function FriendsSheet({ onClose }: { onClose: () => void }) {
  const { profile, friends, setProfile, removeFriend, importCode } = useStore()
  const [code, setCode] = useState('')
  const [paste, setPaste] = useState('')
  const [status, setStatus] = useState('')

  const updateProfile = (next: { name?: string; colour?: string }) => {
    setProfile(next)
    setCode('')
  }

  const makeMine = async () => {
    if (!profile.id) setProfile({ id: ensureMyId(profile) })
    const state = useStore.getState()
    setCode(await encodeShare(buildPayload(state.me, state.profile)))
  }

  const add = async () => {
    const result = await importCode(paste)
    setStatus(result.ok ? `Added ${result.name}.` : (result.reason || 'Could not add that friend.'))
    if (result.ok) setPaste('')
  }

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

        <button type="button" className="btn btn-wide friends-action" onClick={makeMine}>Show my code</button>
        {code && (
          <div className="friends-code">
            <label className="ds-field">
              <span className="eyebrow">Your code</span>
              <textarea className="tnum" readOnly rows={3} value={code} spellCheck={false} />
            </label>
            <button
              type="button"
              className="btn btn-coral btn-wide friends-action"
              onClick={() => navigator.clipboard?.writeText(code)}
            >
              Copy code
            </button>
          </div>
        )}

        <label className="ds-field friends-paste">
          <span className="eyebrow">Paste a friend’s code</span>
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
                  <small className="muted tnum">{Object.keys(friend.passport.entries).length} logged</small>
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
    </Sheet>
  )
}
