import { useState, type CSSProperties } from 'react'
import { deleteMyData, hasBackend } from '../../state/backend'
import { FRIEND_COLOURS, useStore } from '../../state/store'
import { useSyncStore } from '../../state/sync'
import { Sheet } from '../../ui/Sheet'
import { ConfirmButton } from './ConfirmButton'
import '../drinks/drinksheet.css'
import './friends.css'

// Who you are to the crew: the name and colour that ride on every shared drink, how the sync is
// getting on, and the one way out. Nothing here is an account; there is nothing to log in to.
export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const resetSocialIdentity = useStore((s) => s.resetSocialIdentity)
  const sync = useSyncStore()
  const [status, setStatus] = useState('')

  const syncLine = sync.status === 'off' ? ''
    : sync.status === 'syncing' ? 'Syncing…'
      : sync.status === 'held' ? 'Offline · will sync when you’re back'
        : sync.status === 'error' ? 'Sync failed · will retry'
          : sync.lastSyncedAt ? 'Synced just now' : ''

  // The only promise the app makes about the server. Forgetting the identity when the erasure failed
  // would leave every row on the server under a code no phone can reach again, and say nothing.
  const erase = async () => {
    setStatus('Deleting…')
    if (!(await deleteMyData())) { setStatus('Could not delete your data. Try again when you are online.'); return }
    resetSocialIdentity()
    setStatus('Deleted. Your phone’s copy stays.')
  }

  return (
    <Sheet onClose={onClose} labelledBy="profile-title" eyebrow={<div className="sheet-eyebrow eyebrow">You</div>}>
      <div className="friends-sheet">
        <h2 className="t-title friends-title" id="profile-title">Your details</h2>

        <label className="ds-field">
          <span className="eyebrow">Your name</span>
          <input
            value={profile.name}
            maxLength={24}
            autoComplete="name"
            placeholder="Your name"
            onChange={(event) => setProfile({ name: event.target.value })}
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
                onClick={() => setProfile({ colour })}
              />
            ))}
          </div>
        </div>

        {profile.code && (
          <div className="ds-field">
            <span className="eyebrow">Your code</span>
            <code className="tnum addme-code-val">{profile.code}</code>
          </div>
        )}

        {syncLine && <p className="muted t-body friends-status" role="status">{syncLine}</p>}

        {hasBackend() && (
          <div className="friends-danger">
            <ConfirmButton
              label="Delete my data"
              confirmLabel="Tap again to delete"
              note="Removes your shared passport, friends and groups from the server. Your phone’s copy stays."
              className="btn btn-wide"
              onConfirm={() => { void erase() }}
            />
            {status && <p className="muted t-body friends-status" role="status">{status}</p>}
          </div>
        )}
      </div>
    </Sheet>
  )
}
