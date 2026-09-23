// A tap the guest can feel, where the platform gives one. Nothing in the app depends on it.
//
// Two platforms, two mechanisms, and they do not overlap:
//
// Android and Chrome have the Vibration API, which `haptic()` drives: any pattern, from any code
// path, a timer included once the page has had a tap.
//
// iOS has no Vibration API (caniuse "vibration": no Safari on iOS up to 26.6) and exactly one web
// haptic: the system tick WebKit plays when an `<input type="checkbox" switch>` is toggled by a
// trusted click (WebKit CheckboxInputType::willDispatchClick). Since iOS 26.5 a click from script,
// `label.click()` included, is untrusted and plays nothing (WebKit fc1ef83eae, bug 309082), and
// before that it still had to run while a real gesture was being processed. So on an iPhone the tick
// can only come from the guest's own finger landing on a label wired to a switch: `pressHaptic()`
// lays one, invisibly, over a button. It fires for that press and for nothing else; no web page can
// make an iPhone buzz on a timer, so the shaker's knocks and its landing are felt on Android only.

type Kind = 'success' | 'tap' | 'shake'

const PATTERNS: Record<Kind, number[]> = {
  success: [14, 40, 22], // two beats: the action landed
  tap: [10],
  // The shaker's build-up. Buzzes that lengthen while the gaps between them close, mirroring the
  // rattle's ticks accelerating from 230ms to 95ms, so the hand feels the same acceleration the ear
  // hears. It runs about 500ms of the 1.8s shake, which is as long as a phone should be asked to
  // buzz for a button press. Its first pulse is the press tap, so the press fires this and not both.
  shake: [12, 90, 14, 70, 16, 55, 18, 45, 20, 40, 24],
}

/** The Vibration API's pattern for `kind`, where there is one (Android). Silent on iOS, which has
 *  no API a script can call: the press haptic there is `pressHaptic()`'s, from the finger itself. */
export function haptic(kind: Kind = 'tap'): void {
  try {
    const vibrate = typeof navigator === 'undefined' ? undefined : navigator.vibrate?.bind(navigator)
    vibrate?.(PATTERNS[kind])
  } catch { /* a haptic is never worth an exception */ }
}

/** iPhone, iPod and iPad, including an iPad that reports itself as a Mac. Every browser on them is
 *  WebKit, so the switch tick is the same in Safari, Chrome and the home-screen app. */
const isIOS = (): boolean => {
  try {
    const n = navigator
    return /iPhone|iPad|iPod/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1)
  } catch {
    return false
  }
}

export interface PressHaptic {
  /** Whether a tap on the button should tick. Off while the button does nothing (disabled), and off
   *  when the press is not the one being felt, so a tap never buzzes with nothing happening. */
  enable(on: boolean): void
  /** Take the overlay out of the button. */
  remove(): void
}

const NONE: PressHaptic = { enable() { /* no overlay */ }, remove() { /* no overlay */ } }

/**
 * The iPhone press haptic, for one button: a transparent `<label>` laid over the whole button and
 * wired to a switch of its own. The finger lands on the label, WebKit forwards that trusted tap to
 * the switch as a trusted click, the switch toggles and the system plays its light tick. The tap
 * still reaches the button's own click handler as usual, by bubbling from the label; the switch's
 * forwarded click is stopped at the switch, so the handler runs once.
 *
 * The switch is never under the finger (a touch on a switch starts its drag tracking and cancels a
 * scroll), keeps its native appearance (WebKit animates, and ticks, only a switch that has one) and
 * is invisible by opacity. The label is hidden from assistive tech and out of the tab order; the
 * button keeps its own name, role and keyboard behaviour, and a keyboard press does not tick.
 *
 * A no-op anywhere but iOS: Android's press haptic is `haptic()`. Call `remove()` on unmount.
 */
export function pressHaptic(button: HTMLElement | null | undefined): PressHaptic {
  if (!button || typeof document === 'undefined' || !isIOS()) return NONE
  try {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.dataset.pressHaptic = ''
    Object.assign(label.style, {
      position: 'absolute', inset: '0', zIndex: '1', borderRadius: 'inherit',
      touchAction: 'manipulation', cursor: 'inherit', userSelect: 'none',
    })
    label.style.setProperty('-webkit-tap-highlight-color', 'transparent')
    label.style.setProperty('-webkit-touch-callout', 'none')
    label.style.setProperty('-webkit-user-select', 'none')

    const input = document.createElement('input')
    input.type = 'checkbox'
    // an attribute React cannot type, which is one reason the node is built by hand
    input.setAttribute('switch', '')
    input.tabIndex = -1
    Object.assign(input.style, {
      position: 'absolute', top: '0', left: '0', width: '1px', height: '1px',
      margin: '0', opacity: '0', pointerEvents: 'none',
    })
    // The label's forwarded click, and the change it makes, go no further than the switch: the
    // button has already had the tap itself, and a second click would press it twice.
    const stop = (e: Event) => e.stopPropagation()
    input.addEventListener('click', stop)
    input.addEventListener('input', stop)
    input.addEventListener('change', stop)

    label.appendChild(input)
    if (getComputedStyle(button).position === 'static') button.style.position = 'relative'
    button.appendChild(label)

    return {
      // The label only stops taking taps. The switch is never disabled: the press that turns the
      // overlay off (Shake becoming Shaking) commits in React before WebKit forwards that same tap to
      // the switch, and a disabled switch would swallow the tick of the very press that asked for it.
      enable(on) {
        label.style.pointerEvents = on ? '' : 'none'
      },
      remove() {
        input.removeEventListener('click', stop)
        input.removeEventListener('input', stop)
        input.removeEventListener('change', stop)
        label.remove()
      },
    }
  } catch {
    return NONE
  }
}
