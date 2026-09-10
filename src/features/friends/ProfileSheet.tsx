import { useState, type CSSProperties } from 'react'
import { deleteMyData, hasBackend } from '../../state/backend'
import { FRIEND_COLOURS, useStore } from '../../state/store'
import { keepAsGuest, startSignIn, useSyncStore } from '../../state/sync'
import { Sheet } from '../../ui/Sheet'
import { ConfirmButton } from './ConfirmButton'
import './friends.css'

// Who you are to the crew: the name and colour that ride on every shared drink, your code, whether
// this passport is kept anywhere but this phone, how the sync and any restore are getting on, and
// the one way out. Signing in is optional and sits below identity: the sheet's five-second read is
// still "who am I to the crew", and a guest never has to sign in to log a drink.
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

  // `held` is the app's offline signal (sync.ts): success is a confirmed response, never
  // navigator.onLine, so this is the only honest way to say "you are offline".
  const offline = sync.status === 'held'

  // The line under the button, which is where anything that stopped the sign-in is said. A gate
  // Charles has not opened yet, and a sign-in that failed, both keep the button live: a later
  // attempt should cost one tap.
  const signInHint = sync.restore === 'unavailable'
    ? 'Sign-in is not available yet. Your passport stays on this phone.'
    : sync.restore === 'failed-signin' ? 'That did not work. Try again in a moment.'
      : offline ? 'You are offline. Sign in when you are back.'
        : 'Sign in and your passport comes back on any phone. We use Google only to know it is you.'

  // Restore wins the status line while it has something to say, because it is the answer to the tap
  // the guest just made; the sync line comes back when it falls to 'idle'. One line, never two.
  const restoreLine = sync.restore === 'working' ? 'Bringing your passport back…'
    : sync.restore === 'done'
      ? (sync.restored === 0 ? 'Your passport is already up to date.'
        : sync.restored === 1 ? 'Brought back 1 drink.' : `Brought back ${sync.restored} drinks.`)
      : sync.restore === 'empty' ? 'Nothing to bring back yet. From now on this passport is kept.'
        : sync.restore === 'failed' ? 'Could not reach your backup. It will try again.' : ''
  const statusLine = restoreLine || syncLine

  // The only promise the app makes about the server. Forgetting the identity when the erasure failed
  // would leave every row on the server under a code no phone can reach again, and say nothing.
  const erase = async () => {
    setStatus('Deleting…')
    if (!(await deleteMyData())) { setStatus('Could not delete your data. Try again when you are online.'); return }
    resetSocialIdentity()
    setStatus('Deleted. Your phone’s copy stays.')
  }

  return (
    <Sheet onClose={onClose} labelledBy="profile-title">
      <div className="friends-sheet">
        <h2 className="t-title sheet-title" id="profile-title">Your details</h2>
        <p className="sheet-meta">The name and colour your crew sees on everything you share.</p>

        <label className="f-field">
          <span className="f-label">Your name</span>
          <input
            value={profile.name}
            maxLength={24}
            autoComplete="name"
            placeholder="Your name"
            onChange={(event) => setProfile({ name: event.target.value })}
          />
        </label>

        <div className="f-field">
          <span className="f-label">Your colour</span>
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
          <div className="f-field">
            <span className="f-label">Your code</span>
            <code className="tnum addme-code-val">{profile.code}</code>
          </div>
        )}

        {/* Rank 5: will I lose this. Above the sync line because it outranks "is the crew up to
            date", and directly above it because the restore result is reported on that line. An
            offline build has nothing to sign in to, so the block is gated exactly as the erasure
            block below it is. */}
        {sync.account !== 'off' && (
          <div className="friends-block">
            <div className="section-head"><h3 className="t-h2">Keep your passport</h3></div>

            {sync.restore === 'linked' ? (
              <>
                {/* "joins", not "replaces": the merge is a union and never drops a drink logged on
                    either side. The note names the two things that genuinely go and nothing else;
                    the crew is not among them, because every direct friend is re-befriended under
                    the new code on the next pull. */}
                <p className="t-body">This Google account already keeps a passport. Bringing it back joins it with the one on this phone, so no drink is lost.</p>
                <ConfirmButton
                  label="Bring that one back"
                  confirmLabel="Tap again to continue"
                  note="Your code changes to the one that account already uses, and any group you joined on this phone is left behind."
                  className="btn btn-wide friends-action"
                  onConfirm={() => { void startSignIn('fresh') }}
                />
                <button type="button" className="friends-quiet" onClick={keepAsGuest}>Or keep using this phone’s passport as a guest.</button>
              </>
            ) : sync.account === 'saved' ? (
              <p className="t-body">Kept with Google. Sign in on any phone and this passport comes back.</p>
            ) : (
              <>
                <p className="t-body">This passport is on this phone only. Clear your browser or change phone and it is gone, your friend code with it.</p>
                {/* A plain button, not coral: sign-in is optional and guest-first, and Crew has
                    already spent its one filled accent on "Add to your crew". */}
                <button type="button" className="btn btn-wide friends-action" disabled={offline} onClick={() => { void startSignIn() }}>
                  Keep it with Google
                </button>
                <p className="t-meta friends-hint">{signInHint}</p>
              </>
            )}
          </div>
        )}

        {statusLine && <p className="t-meta friends-status" role="status">{statusLine}</p>}

        {hasBackend() && (
          <div className="friends-danger">
            <ConfirmButton
              label="Delete my data"
              confirmLabel="Tap again to delete"
              note="Removes your shared passport, friends and groups from the server. Your phone’s copy stays."
              className="btn btn-wide"
              onConfirm={() => { void erase() }}
            />
            {status && <p className="t-meta friends-status" role="status">{status}</p>}
          </div>
        )}
      </div>
    </Sheet>
  )
}
