import { useEffect, useMemo, useState } from 'react'
import { groupMembers, type MemberRow } from '../../state/backend'
import { createGroupFlow, deleteGroupFlow, groupInviteLink, leaveGroupFlow } from '../../state/groups'
import { useStore } from '../../state/store'
import { FriendDot } from '../../ui/FriendDot'
import { Qr } from '../../ui/Qr'
import { Sheet } from '../../ui/Sheet'
import { ConfirmButton } from './ConfirmButton'
import '../drinks/drinksheet.css'
import './friends.css'

/** Live connectivity, for the two actions that genuinely cannot work without it. */
function useOnline(): boolean {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

// One group, or the making of one. Create lands straight on the detail view with the invite ready to
// send, because a group with nobody in it is not the thing anyone wanted.
export function GroupSheet({ groupId, onClose }: { groupId?: string; onClose: () => void }) {
  const groups = useStore((s) => s.groups)
  const friends = useStore((s) => s.friends)
  const profile = useStore((s) => s.profile)
  const [id, setId] = useState(groupId ?? '')
  const [fresh, setFresh] = useState('') // invite code of a group just created, before the pull lands
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [roster, setRoster] = useState<MemberRow[]>([])
  const online = useOnline()

  const group = groups.find((g) => g.id === id)
  const invite = group?.invite || fresh
  const detail = Boolean(id || fresh)

  useEffect(() => {
    if (!id) return
    let alive = true
    void groupMembers(id).then((rows) => { if (alive) setRoster(rows) })
    return () => { alive = false }
  }, [id])

  // If the roster call fails (offline, or the RPC is not deployed yet), the crew already knows who
  // shares this group, so show that rather than an empty list.
  const fallback = useMemo<MemberRow[]>(() => [
    { code: profile.code || '', name: profile.name || 'You', colour: profile.colour, role: group?.role || 'member', joinedAt: 0 },
    ...friends.filter((f) => f.groupIds?.includes(id))
      .map((f) => ({ code: f.code || f.id, name: f.name, colour: f.colour, role: 'member', joinedAt: 0 })),
  ], [friends, id, profile, group])
  const shown = roster.length ? roster : fallback

  const create = async () => {
    setBusy(true); setStatus('')
    const result = await createGroupFlow(name)
    setBusy(false)
    if (!result) { setStatus('Could not create the group. Try again when you are online.'); return }
    setFresh(result.invite)
    const made = useStore.getState().groups.find((g) => g.invite === result.invite)
    if (made) setId(made.id)
  }

  const share = async () => {
    if (!invite) return
    const link = groupInviteLink(invite)
    try {
      if (navigator.share) await navigator.share({ title: 'Join our group on the Cocktail Passport', url: link })
      else { await navigator.clipboard?.writeText(link); setStatus('Invite link copied.') }
    } catch { /* they dismissed the share sheet */ }
  }
  // Read out over the phone as often as it is sent, so the code itself has to be copyable.
  const copyInvite = async () => {
    try { await navigator.clipboard?.writeText(invite); setStatus('Code copied.') } catch { /* clipboard blocked */ }
  }

  // Both round trips can take seconds on ship Wi-Fi, and these are the two most alarming buttons in
  // the app: silence after the confirming tap reads as nothing having happened.
  const leave = async () => {
    setBusy(true); setStatus('Leaving…')
    const ok = await leaveGroupFlow(id)
    setBusy(false)
    if (ok) onClose()
    else setStatus('Could not leave. Try again when you are online.')
  }
  const remove = async () => {
    setBusy(true); setStatus('Deleting…')
    const ok = await deleteGroupFlow(id)
    setBusy(false)
    if (ok) onClose()
    else setStatus('Could not delete the group. Try again when you are online.')
  }

  return (
    <Sheet onClose={onClose} labelledBy="group-title" eyebrow={<div className="sheet-eyebrow eyebrow">Groups</div>}>
      {/* Only the blocks a drag would fight carry data-noswipe: on the whole sheet it kills
          drag-to-dismiss, and the grab handle above then promises something it cannot do. */}
      <div className="friends-sheet">
        {/* Same fallback as createGroupFlow sends, or the heading changes under the guest when the
            pull lands. */}
        <h2 className="t-title friends-title" id="group-title">{detail ? (group?.name || name.trim() || 'Our group') : 'Set up a group'}</h2>

        {!detail && (
          <>
            <p className="muted t-body">One link, everyone joins. No codes to swap round the table.</p>
            <label className="ds-field">
              <span className="eyebrow">Group name</span>
              <input value={name} maxLength={40} placeholder="Family, cabin 10842…" onChange={(event) => setName(event.target.value)} />
            </label>
            <button type="button" className="btn btn-coral btn-wide friends-action" onClick={create} disabled={busy || !online}>{busy ? 'Creating…' : 'Create'}</button>
            {!online && <p className="muted t-body friends-status">Needs a connection</p>}
          </>
        )}

        {detail && (
          <>
            {invite && (
              <div className="addme" data-noswipe>
                <div className="addme-qr"><Qr value={groupInviteLink(invite)} size={200} label="Scan to join this group" /></div>
                <div className="addme-code">
                  <span className="eyebrow">Invite code</span>
                  {/* Copy sits beside the code, as on the add sheet; sharing is an action, so it
                      goes in the actions row where the add sheet keeps its own. */}
                  <div className="addme-code-row">
                    <code className="tnum addme-code-val">{invite}</code>
                    <button type="button" className="mini pressable" onClick={copyInvite}>Copy</button>
                  </div>
                </div>
                <div className="addme-actions addme-actions-one">
                  <button type="button" className="btn btn-coral btn-wide" onClick={share}>Share invite link</button>
                </div>
              </div>
            )}

            <div className="friends-roster" role="list" aria-label={`${shown.length} in this group`} data-noswipe>
              {shown.map((member) => (
                <div className="friend-row" role="listitem" key={member.code || member.name}>
                  <FriendDot name={member.name} colour={member.colour} size={30} />
                  <div className="friend-copy">
                    <strong>{member.name}</strong>
                    <small className="muted tnum">{member.role === 'owner' ? 'Hosts this group' : 'Aboard'}</small>
                  </div>
                </div>
              ))}
            </div>

            {id && (
              <div className="friends-danger" data-noswipe>
                {group?.role === 'owner' ? (
                  <ConfirmButton
                    label="Delete group"
                    confirmLabel="Tap again to delete"
                    note="Everyone loses the group. Their own passports are untouched."
                    onConfirm={() => { void remove() }}
                  />
                ) : (
                  <ConfirmButton
                    label="Leave group"
                    confirmLabel="Tap again to leave"
                    note="You stop seeing the group’s picks, and they stop seeing yours."
                    onConfirm={() => { void leave() }}
                  />
                )}
              </div>
            )}
          </>
        )}

        {status && <p className="muted t-body friends-status" role="status">{status}</p>}
      </div>
    </Sheet>
  )
}
