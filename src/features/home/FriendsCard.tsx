import { useState } from 'react'
import { useStore } from '../../state/store'
import { FriendDot } from '../../ui/FriendDot'
import { FriendsSheet } from '../friends/FriendsSheet'

const MAX_DOTS = 5

export function FriendsCard() {
  const friends = useStore((state) => state.friends)
  const [open, setOpen] = useState(false)
  const extra = Math.max(0, friends.length - MAX_DOTS)

  return (
    <>
      <button
        type="button"
        className="glass card home-friends pressable"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {friends.length === 0 ? (
          <span className="muted t-body">Sailing with friends? Add their code.</span>
        ) : (
          <>
            <span className="home-friends-roster">
              <span className="fstack">
                {friends.slice(0, MAX_DOTS).map((friend) => (
                  <FriendDot key={friend.id} name={friend.name} colour={friend.colour} size={24} />
                ))}
              </span>
              {extra > 0 && <span className="muted tnum">+{extra}</span>}
            </span>
            <span className="home-friends-add">Add</span>
          </>
        )}
      </button>
      {open && <FriendsSheet onClose={() => setOpen(false)} />}
    </>
  )
}
