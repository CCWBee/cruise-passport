// The title the top bar folds a screen's large title into (docs/DESIGN.md, Navigation). A screen that
// has a large title of its own says it here, once, with the words it prints; one that says nothing
// gets its tab's name.
import { useEffect } from 'react'
import { create } from 'zustand'

export const useTopBarTitle = create<{ title: string }>(() => ({ title: '' }))

/** Name the screen for the top bar while it is mounted: `useScreenTitle('Evening, Isabel')`. */
export function useScreenTitle(title: string) {
  useEffect(() => {
    useTopBarTitle.setState({ title })
    return () => { if (useTopBarTitle.getState().title === title) useTopBarTitle.setState({ title: '' }) }
  }, [title])
}
