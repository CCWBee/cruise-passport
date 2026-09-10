import type { CSSProperties } from 'react'
import { FRIEND_COLOURS, useStore } from '../../state/store'
// friends.css is where .f-field input, .fpick and .fpick-dot are actually styled; base.css carries
// only .f-field and .f-label. Without this import the inputs render borderless and the colour dots
// collapse, wherever this pair is used. Social.tsx keeps its own import of the same file, which is
// idempotent.
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
          value={draft}
          maxLength={24}
          autoComplete="name"
          placeholder="Your name"
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
              style={{ '--fc': `var(--fruit-${colour})` } as CSSProperties}
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
