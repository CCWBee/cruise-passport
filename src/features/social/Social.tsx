// The Social tab, top to bottom: who you are, how people get in, your groups, the crew, and what the
// crew has found. Crew = direct friends plus group co-members, one roster, tagged by how you got them.
import { useMemo, useState, type CSSProperties } from 'react'
import { VENUES } from '../../data/model'
import { hasBackend } from '../../state/backend'
import { FRIEND_COLOURS, useStore } from '../../state/store'
import { useSources, undiscovered } from '../../state/social'
import { FriendDot } from '../../ui/FriendDot'
import { GlassButton } from '../../ui/GlassButton'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { AddCrewSheet } from '../friends/AddCrewSheet'
import { ConfirmButton } from '../friends/ConfirmButton'
import { GroupSheet } from '../friends/GroupSheet'
import { ProfileSheet } from '../friends/ProfileSheet'
import { DiscoverTogether } from '../home/DiscoverTogether'
import '../drinks/drinksheet.css'
import '../friends/friends.css'
import './social.css'

// Nothing shared before this is answered would carry a name: everything would read "A friend". On
// first run this card is the whole screen, so it takes the page's heading rather than sitting a
// level-two heading above the h1 below it.
export function NameCard({ lead }: { lead?: string }) {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const [draft, setDraft] = useState('')

  return (
    <section className="glass card social-name">
      <h1 className="t-h2">What should your crew call you?</h1>
      {lead && <p className="muted t-body social-sub">{lead}</p>}
      <label className="ds-field">
        <span className="eyebrow">Your name</span>
        <input
          value={draft}
          maxLength={24}
          autoComplete="name"
          placeholder="Your name"
          onChange={(event) => setDraft(event.target.value)}
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
      <GlassButton
        variant="primary"
        block
        className="social-name-done"
        disabled={!draft.trim()}
        onClick={() => setProfile({ name: draft.trim() })}
      >
        Done
      </GlassButton>
    </section>
  )
}

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
          <FriendDot name={profile.name || '?'} colour={profile.colour} size={26} />
          <span className="social-me-copy">
            <strong>{profile.name || 'You'}</strong>
            {profile.code && <small className="muted tnum">{profile.code}</small>}
          </span>
        </button>
      </div>

      <button type="button" className="glass card social-add pressable" onClick={() => setAddOpen(true)} aria-haspopup="dialog">
        <span className="social-add-copy">
          <strong className="t-h2">Add to your crew</strong>
          <small className="muted t-meta">Send a link, scan a code, or join a group</small>
        </span>
        <span className="social-go" aria-hidden>›</span>
      </button>

      {online && (
        <section className="glass card social-groups" aria-label="Your groups">
          <div className="eyebrow">Groups</div>
          {groups.map((g) => (
            <button type="button" key={g.id} className="social-row pressable" onClick={() => setGroupSheet({ id: g.id })} aria-haspopup="dialog">
              <span className="social-row-copy">
                <strong className="t-strong">{g.name}</strong>
                <small className="muted t-meta">{g.members} aboard{g.role === 'owner' ? ' · you host' : ''}</small>
              </span>
              <span className="social-go" aria-hidden>›</span>
            </button>
          ))}
          <button type="button" className="social-row pressable" onClick={() => setGroupSheet({})} aria-haspopup="dialog">
            <span className="social-row-copy">
              <strong className="t-strong">Set up a group</strong>
              <small className="muted t-meta">One link, everyone joins</small>
            </span>
            <span className="social-go" aria-hidden>›</span>
          </button>
          {/* Handed a code rather than a link, this is where people look. Without it the only field
              is a level down inside "Add to your crew", and creating a second group is the obvious
              wrong move. */}
          <button type="button" className="social-row pressable" onClick={() => setAddOpen(true)} aria-haspopup="dialog">
            <span className="social-row-copy">
              <strong className="t-strong">Join a group</strong>
              <small className="muted t-meta">Enter an invite code or link</small>
            </span>
            <span className="social-go" aria-hidden>›</span>
          </button>
        </section>
      )}

      <section className="glass card social-crew" aria-label="Sailing with">
        <div className="eyebrow">Sailing with</div>
        {friends.length === 0 ? (
          <p className="muted t-body social-sub">Nobody yet. Share my link, or scan a friend.</p>
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
                <div className="friend-row" key={friend.id}>
                  <FriendDot name={friend.name} colour={friend.colour} size={30} />
                  <div className="friend-copy">
                    <strong>{friend.name}</strong>
                    <small className="muted tnum">{sub}</small>
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

      <DiscoverTogether onOpen={setOpenId} />

      {friends.length > 0 && undisc.length > 0 && (
        <section className="glass card social-undisc">
          <div className="eyebrow social-eyebrow">Nobody’s tried these yet</div>
          <p className="muted t-body social-sub">Go and find them together.</p>
          <div className="social-picks">
            {undisc.map((d) => (
              <button key={d.id} type="button" className="social-pick pressable" onClick={() => setOpenId(d.id)}>
                <span className="social-pick-name t-strong">{d.name}</span>
                <span className="social-pick-venue muted t-meta">{VENUES[d.venue]?.name} · Deck {VENUES[d.venue]?.deck}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}
      {addOpen && <AddCrewSheet onClose={() => setAddOpen(false)} />}
      {groupSheet && <GroupSheet groupId={groupSheet.id} onClose={() => setGroupSheet(null)} />}
    </div>
  )
}
