import type { CSSProperties } from 'react'
import { FRIEND_COLOURS, useStore } from '../../state/store'
// friends.css is where .fpick and .fpick-dot are styled; base.css carries .f-field and .f-label, and
// the input is Field's own .field-ctrl, so ui/field.css comes too. Without these the colour dots
// collapse and the input loses its well, wherever this pair is used. Social.tsx keeps its own import
// of friends.css, which is idempotent.
import '../../ui/field.css'
import '../friends/friends.css'

// The name and colour pair, lifted out of NameCard so the entry screen uses the mechanism rather
// than a copy of it. The name is a draft the caller owns, because the two callers commit it at
// different moments; the colour is written to the store on tap, as it is in ProfileSheet, because it
// is local until something is published and there is nothing to undo.
export function NameFields({ draft, onDraft }: { draft: string; onDraft: (v: string) => void }) {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)

  return (
    <>
      <label className="f-field">
        <span className="f-label">Your name</span>
        <input
          className="field-ctrl"
          value={draft}
          maxLength={24}
          autoComplete="name"
          onChange={(event) => onDraft(event.target.value)}
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
              style={{ '--fc': `var(--friend-${colour})` } as CSSProperties}
              aria-label={`Use ${colour}`}
              aria-pressed={profile.colour === colour}
              onClick={() => setProfile({ colour })}
            />
          ))}
        </div>
      </div>
    </>
  )
}
