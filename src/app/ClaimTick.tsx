import { useEffect, useRef } from 'react'
import { useSyncStore } from '../state/sync'
import { useConfirm } from '../ui/Confirm'

// The Confirm tick "Passport back" when a recovery code brings a passport back. It lives at the
// app's root, in both of App's branches, not in the screen that asked: on the entry screen a claim
// enters the passport, which unmounts the entry screen before its own tick could draw. It fires on
// the change into 'done' (or on mount while the store says 'done', which is how a ?qa=claim:done
// render shows it), once; the store clears 'done' after eight seconds on its own.
export function ClaimTick() {
  const claim = useSyncStore((s) => s.claim)
  const [node, show] = useConfirm()
  const last = useRef<string | null>(null)
  useEffect(() => {
    if (claim === 'done' && last.current !== 'done') show('Passport back')
    last.current = claim
  }, [claim, show])
  return node
}
