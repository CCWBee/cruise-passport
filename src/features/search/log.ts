// The search the Log button opens (docs/DESIGN.md, Search): whether it is open and what has been
// typed, shared by the dock's field (app/Nav.tsx), the overlay under it (SearchOverlay.tsx) and every
// "Log a drink" elsewhere in the app, which calls openLog() rather than routing to Drinks.
import { create } from 'zustand'

interface LogSearch {
  open: boolean
  q: string
  setQ: (q: string) => void
  close: () => void
}

export const useLogSearch = create<LogSearch>((set) => ({
  open: false,
  q: '',
  setQ: (q) => set({ q }),
  close: () => set({ open: false, q: '' }),
}))

// The dock's field, registered by Nav when it mounts. iOS raises the keyboard only for a focus taken
// inside the tap that asked for it, so opening focuses the field first, synchronously, while the
// handler that called it is still running; the state change that shows the overlay comes after.
let field: HTMLInputElement | null = null
export function registerLogField(el: HTMLInputElement | null) { field = el }

/** Open the search from a tap: the field takes focus inside the tap, then the overlay shows. */
export function openLog() {
  field?.focus({ preventScroll: true })
  useLogSearch.setState({ open: true, q: '' })
}
