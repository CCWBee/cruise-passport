// The Social tab, top to bottom: who you are, how people get in, the crew, your groups, and what the
// crew has found. Crew = direct friends plus group co-members, one roster, tagged by how you got them.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { VENUES } from '../../data/model'
import { hasBackend } from '../../state/backend'
import { FRIEND_COLOURS, useStore } from '../../state/store'
import { useSources, undiscovered } from '../../state/social'
import { useConfirm } from '../../ui/Confirm'
import { FriendDot } from '../../ui/FriendDot'
import { IconChevron } from '../../ui/Icon'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { AddCrewSheet } from '../friends/AddCrewSheet'
import { ConfirmButton } from '../friends/ConfirmButton'
import { GroupSheet } from '../friends/GroupSheet'
import { ProfileSheet } from '../friends/ProfileSheet'
import { DiscoverTogether } from '../home/DiscoverTogether'
import '../friends/friends.css'
import './social.css'

// Nothing shared before this is answered would carry a name: everything would read "A friend". A form
// with its own boundary, so it is the one panel on the screen.
export function NameCard({ lead }: { lead?: string }) {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const [draft, setDraft] = useState('')
  // On /join the card is the whole page, so its question is that page's h1. On Crew it sits above
  // "Your crew", which is the h1 there, so it steps down rather than shipping a second level one.
  const Heading = lead ? 'h1' : 'h2'

  return (
    <section className="panel social-name">
      <Heading className="t-h2">What should your crew call you?</Heading>
      {lead && <p className="t-meta social-name-lead">{lead}</p>}
      <label className="f-field">
        <span className="f-label">Your name</span>
        <input
          value={draft}
          maxLength={24}
          autoComplete="name"
          placeholder="Your name"
          onChange={(event) => setDraft(event.target.value)}
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
      {/* the fill arrives with the name: an empty draft leaves a plain disabled control rather than
          coral text on a coral wash, which is the one thing on this card nobody could read */}
      <button
        type="button"
        className={'btn btn-wide social-name-done' + (draft.trim() ? ' btn-coral' : '')}
        disabled={!draft.trim()}
        onClick={() => setProfile({ name: draft.trim() })}
      >
        Done
      </button>
    </section>
  )
}

// a row's forward affordance, from the one icon set
const Chevron = () => <IconChevron className="social-go" />

export function Social() {
  const friends = useStore((s) => s.friends)
  const groups = useStore((s) => s.groups)
  const profile = useStore((s) => s.profile)
  const removeFriend = useStore((s) => s.removeFriend)
  const srcs = useSources()
  const [openId, setOpenId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [groupSheet, setGroupSheet] = useState<{ id?: string } | null>(null)
  // The tick lives here, not in the sheet: a sheet that closes on success takes its own confirmation
  // down with it, and the guest is left looking at a list wondering whether anything happened.
  const [confirmNode, confirm] = useConfirm()
  // The tick names who was added but not where they landed, and a new row arrives in name order
  // rather than at the end. Marking the row holds the answer for a few seconds. Kept by code, not by
  // id: the pull that follows replaces the placeholder "c:CODE" with their real one.
  const [justAdded, setJustAdded] = useState('')
  const newTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const markNew = (code: string) => {
    setJustAdded(code)
    if (newTimer.current) clearTimeout(newTimer.current)
    newTimer.current = setTimeout(() => setJustAdded(''), 4000)
  }
  useEffect(() => () => { if (newTimer.current) clearTimeout(newTimer.current) }, [])
  const undisc = useMemo(() => undiscovered(srcs, 4), [srcs])
  const online = hasBackend()
  const named = Boolean(profile.name.trim())

  const groupName = (ids?: string[]) =>
    ids?.map((id) => groups.find((g) => g.id === id)?.name).find(Boolean) || ''

  return (
    <div className="wrap page social-page">
      {!named && <NameCard />}

      <div className="social-head">
        <h1 className="t-title">Your crew</h1>
        <button
          type="button"
          className="social-me pressable"
          onClick={() => setProfileOpen(true)}
          aria-haspopup="dialog"
          aria-label="Your details"
        >
          <FriendDot name={profile.name || '?'} colour={profile.colour} size={28} />
          <span className="social-me-copy">
            <span className="t-strong">{profile.name || 'You'}</span>
            {profile.code && <span className="t-meta tnum">{profile.code}</span>}
          </span>
        </button>
      </div>

      {/* the one filled control on the screen: until there is a name, that is Done on the card above,
          because everything shared before it would go out as "A friend" */}
      <button type="button" className={'btn btn-wide social-add' + (named ? ' btn-coral' : '')} onClick={() => setAddOpen(true)} aria-haspopup="dialog">
        Add to your crew
      </button>

      <section className="section" aria-label="Sailing with">
        <div className="section-head"><h2 className="t-h2">Sailing with</h2></div>
        {friends.length === 0 ? (
          <p className="t-meta social-empty">Nobody yet. Add someone with the button above.</p>
        ) : (
          <div className="friends-roster">
            {friends.map((friend) => {
              const via = groupName(friend.groupIds)
              // Counted on `tried`, as Ship, Stats and the venue sheet do, or the same person reads
              // as two different numbers depending on the screen.
              const logged = Object.values(friend.passport.entries).filter((e) => e.tried).length
              const state = friend.pending ? 'Waiting to connect' : logged ? `${logged} logged` : 'Nothing logged yet'
              const sub = state + (via ? ` · ${via}` : '')
              return (
                <div className={'row friend-row' + (friend.code && friend.code === justAdded ? ' friend-row-new' : '')} key={friend.id}>
                  <FriendDot name={friend.name} colour={friend.colour} size={28} />
                  <div className="row-copy">
                    <span className="t-body">{friend.name}</span>
                    <span className="t-meta tnum">{sub}</span>
                  </div>
                  {/* Cutting both edges is irreversible and the row is a thumb's width from the
                      name, so it takes the same two-tap confirm as every other one-way action. */}
                  {!friend.groupOnly && (
                    <ConfirmButton
                      className="mini pressable friend-remove"
                      label="Remove"
                      confirmLabel="Tap again"
                      ariaLabel={`Remove ${friend.name}`}
                      onConfirm={() => { void removeFriend(friend.id) }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {online && (
        <section className="section" aria-label="Your groups">
          <div className="section-head"><h2 className="t-h2">Groups</h2></div>
          {groups.map((g) => (
            <button type="button" key={g.id} className="row pressable" onClick={() => setGroupSheet({ id: g.id })} aria-haspopup="dialog">
              <span className="row-copy">
                <span className="t-body">{g.name}</span>
                <span className="t-meta tnum">{g.members} aboard{g.role === 'owner' ? ' · you host' : ''}</span>
              </span>
              <Chevron />
            </button>
          ))}
          {/* Joining with a code someone read out lives in the add sheet, beside the other ways in. */}
          <button type="button" className="row pressable" onClick={() => setGroupSheet({})} aria-haspopup="dialog">
            <span className="row-copy">
              <span className="t-body">Set up a group</span>
              <span className="t-meta">One link, everyone joins</span>
            </span>
            <Chevron />
          </button>
        </section>
      )}

      <DiscoverTogether onOpen={setOpenId} />

      {friends.length > 0 && undisc.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="t-h2">Nobody has tried these yet</h2></div>
          {undisc.map((d) => (
            <button key={d.id} type="button" className="row pressable" onClick={() => setOpenId(d.id)}>
              {/* a drink name is the object of the row, so it takes the heading role here exactly as
                  it does on Drinks: the same thing must not read at two sizes across screens */}
              <span className="row-copy">
                <span className="t-h2">{d.name}</span>
                <span className="t-meta">{VENUES[d.venue]?.name} · Deck {VENUES[d.venue]?.deck}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}
      {addOpen && (
        <AddCrewSheet
          onClose={() => setAddOpen(false)}
          onDone={(label, code) => { setAddOpen(false); confirm(label); if (code) markNew(code) }}
        />
      )}
      {groupSheet && <GroupSheet groupId={groupSheet.id} onClose={() => setGroupSheet(null)} />}
      {confirmNode}
    </div>
  )
}
