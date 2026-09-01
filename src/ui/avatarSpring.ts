// Avatar-group hover spring (Transitions.dev pattern), delegated to every `.fstack` on the page.
// Hover-in of one dot lifts + scales it and nudges its neighbours with a falloff; a springy ease-out
// settles them back. Hover-only: it does nothing on touch, so there is no mobile cost.
const LIFT = -4        // px the hovered dot rises
const SCALE = 1.14     // hovered dot pop
const FALLOFF = 0.45   // how fast the lift decays along the stack
const EASE_IN = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_OUT = 'cubic-bezier(0.34, 3.85, 0.64, 1)' // overshoot spring on the way back

function kidsOf(stack: HTMLElement) {
  return Array.from(stack.children) as HTMLElement[]
}
function apply(stack: HTMLElement, activeIdx: number) {
  kidsOf(stack).forEach((el, i) => {
    const d = Math.abs(i - activeIdx)
    el.style.transitionTimingFunction = EASE_IN
    el.style.setProperty('--shift', (LIFT * Math.pow(FALLOFF, d)).toFixed(2) + 'px')
    el.style.setProperty('--scale-active', i === activeIdx ? String(SCALE) : '1')
    el.style.zIndex = i === activeIdx ? '5' : ''
  })
}
function reset(stack: HTMLElement) {
  kidsOf(stack).forEach((el) => {
    el.style.transitionTimingFunction = EASE_OUT
    el.style.setProperty('--shift', '0px')
    el.style.setProperty('--scale-active', '1')
    el.style.zIndex = ''
  })
}
/** the direct child of `stack` that contains `node`, or null */
function directChild(stack: HTMLElement, node: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = node
  while (el && el.parentElement !== stack) el = el.parentElement
  return el
}

if (typeof window !== 'undefined' && typeof matchMedia !== 'undefined' && matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointerover', (e) => {
    const stack = (e.target as HTMLElement).closest?.('.fstack') as HTMLElement | null
    if (!stack) return
    const child = directChild(stack, e.target as HTMLElement)
    if (!child) return
    apply(stack, kidsOf(stack).indexOf(child))
  })
  document.addEventListener('pointerout', (e) => {
    const stack = (e.target as HTMLElement).closest?.('.fstack') as HTMLElement | null
    if (!stack) return
    const related = e.relatedTarget as HTMLElement | null
    if (related && stack.contains(related)) return // moved to another dot in the same stack
    reset(stack)
  })
}
