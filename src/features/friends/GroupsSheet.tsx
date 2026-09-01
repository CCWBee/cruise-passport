import { useState } from 'react'
import { createGroupFlow, groupInviteLink, joinGroupFlow } from '../../state/groups'
import { useStore } from '../../state/store'
import { Qr } from '../../ui/Qr'
import { Sheet } from '../../ui/Sheet'
import './friends.css'

// Create a group and share one link, or join by a link/code. Everyone in a group sees each other's
// picks, no pairwise adds. Online only (needs a backend); the sheet is hidden otherwise.
export function GroupsSheet({ onClose }: { onClose: () => void }) {
  const groups = useStore((s) => s.groups)
  const [name, setName] = useState('')
  const [invite, setInvite] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState('') // invite code of a group just created

  const flash = (t: string) => setStatus(t)

  const create = async () => {
    setBusy(true); setStatus('')
    const result = await createGroupFlow(name)
    setBusy(false)
    if (result) { setCreated(result.invite); flash('Group created. Share the link to fill it.'); setName('') }
    else flash('Could not create the group. Are you online?')
  }

  const join = async () => {
    setBusy(true); setStatus('')
    const result = await joinGroupFlow(invite)
    setBusy(false)
    if (result) { flash(`Joined ${result.name}.`); setInvite('') }
    else flash('That invite code did not work.')
  }

  const share = async (code: string) => {
    const link = groupInviteLink(code)
    try {
      if (navigator.share) await navigator.share({ title: 'Join our group on the Cocktail Passport', url: link })
      else { await navigator.clipboard?.writeText(link); flash('Invite link copied.') }
    } catch { /* dismissed */ }
  }

  return (
    <Sheet onClose={onClose} eyebrow={<div className="sheet-eyebrow eyebrow">Sailing together</div>}>
      <div className="friends-sheet" data-noswipe>
        <h2 className="t-title friends-title">Groups</h2>

        {groups.length > 0 && (
          <div className="friends-roster" aria-label="Your groups">
            {groups.map((g) => (
              <div className="friend-row" key={g.id}>
                <div className="grp-badge" aria-hidden>{g.name.slice(0, 1).toUpperCase()}</div>
                <div className="friend-copy">
                  <strong>{g.name}</strong>
                  <small className="muted tnum">{g.members} aboard{g.role === 'owner' ? ' · you host' : ''}</small>
                </div>
                <button type="button" className="mini pressable" onClick={() => share(g.invite)}>Share</button>
              </div>
            ))}
          </div>
        )}

        <div className="grp-section">
          <label className="ds-field">
            <span className="eyebrow">Create a group</span>
            <input value={name} maxLength={40} placeholder="Family, cabin 10842…" onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="button" className="btn btn-coral btn-wide friends-action" onClick={create} disabled={busy}>Create group</button>
          {created && (
            <div className="addme" data-noswipe>
              <div className="addme-qr"><Qr value={groupInviteLink(created)} size={180} /></div>
              <p className="muted t-body addme-hint">Let the crew scan this, or share the link, to join.</p>
              <div className="addme-code"><span className="eyebrow">Invite code</span>
                <div className="addme-code-row"><code className="tnum addme-code-val">{created}</code>
                  <button type="button" className="mini pressable" onClick={() => share(created)}>Share</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grp-section">
          <label className="ds-field">
            <span className="eyebrow">Join a group</span>
            <input value={invite} maxLength={12} autoCapitalize="characters" autoCorrect="off" spellCheck={false}
              placeholder="Invite code" onChange={(e) => { setInvite(e.target.value); setStatus('') }} />
          </label>
          <button type="button" className="btn btn-wide friends-action" onClick={join} disabled={busy || !invite.trim()}>Join group</button>
        </div>

        {status && <p className="muted t-body friends-status" role="status">{status}</p>}
      </div>
    </Sheet>
  )
}
