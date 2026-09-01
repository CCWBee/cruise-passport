// The Social tab: what you and the crew have found, whose palate matches yours, what to try next
// together. Invisible-until-a-friend still applies (the page shows an add prompt when alone).
import { useMemo, useState } from 'react'
import { VENUES } from '../../data/model'
import { hasBackend } from '../../state/backend'
import { useStore } from '../../state/store'
import { useSources, undiscovered } from '../../state/social'
import { FriendDot } from '../../ui/FriendDot'
import { GlassButton } from '../../ui/GlassButton'
import { DrinkSheet } from '../drinks/DrinkSheet'
import { FriendsSheet } from '../friends/FriendsSheet'
import { GroupsSheet } from '../friends/GroupsSheet'
import { DiscoverTogether } from '../home/DiscoverTogether'
import './social.css'

export function Social() {
  const friends = useStore((s) => s.friends)
  const groups = useStore((s) => s.groups)
  const srcs = useSources()
  const [openId, setOpenId] = useState<string | null>(null)
  const [manage, setManage] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const undisc = useMemo(() => undiscovered(srcs, 4), [srcs])
  const online = hasBackend()

  return (
    <div className="wrap page social-page">
      <div className="social-head">
        <h1 className="t-title">Sailing together</h1>
        <GlassButton size="sm" onClick={() => setManage(true)}>{friends.length ? 'Manage' : 'Add friends'}</GlassButton>
      </div>

      {online && (
        <button type="button" className="glass card social-groups pressable" onClick={() => setGroupsOpen(true)}>
          <div className="social-groups-copy">
            <div className="eyebrow">Groups</div>
            <span className="t-strong">
              {groups.length === 0 ? 'Create or join a group' : groups.length === 1 ? groups[0].name : `${groups.length} groups`}
            </span>
            <small className="muted t-meta">
              {groups.length === 0 ? 'One link, everyone joins' : `${groups.reduce((n, g) => Math.max(n, g.members), 0)} aboard · tap to manage`}
            </small>
          </div>
          <span className="social-groups-go" aria-hidden>›</span>
        </button>
      )}

      {friends.length === 0 ? (
        <div className="glass card center social-empty">
          <p className="muted t-body">Add a friend's code to see what the two of you have found, whose taste matches yours, and what to try next together.</p>
          <GlassButton variant="primary" onClick={() => setManage(true)} icon={undefined}>Add a friend</GlassButton>
        </div>
      ) : (
        <>
          <div className="glass card social-roster">
            <span className="fstack">
              {friends.slice(0, 6).map((f) => <FriendDot key={f.id} name={f.name} colour={f.colour} size={30} />)}
            </span>
            <span className="muted t-body">
              {friends.length === 1 ? `You and ${friends[0].name}` : `You and ${friends.length} others`}
            </span>
          </div>

          <DiscoverTogether onOpen={setOpenId} />

          {undisc.length > 0 && (
            <section className="glass card social-undisc">
              <div className="eyebrow social-eyebrow">Nobody's tried these yet</div>
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
        </>
      )}

      {openId && <DrinkSheet id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
      {manage && <FriendsSheet onClose={() => setManage(false)} />}
      {groupsOpen && <GroupsSheet onClose={() => setGroupsOpen(false)} />}
    </div>
  )
}
