// A tap the guest can feel, where the platform gives one. Nothing in the app depends on it.
//
// Android and Chrome have the Vibration API. iOS Safari has none, and the only web haptic known to
// work on an iPhone is toggling a switch-styled checkbox (iOS 17.4+), which is undocumented, needs a
// transient activation, and may well do nothing at all: treat an iPhone buzz as a bonus, never as
// confirmation. The visible tick is the confirmation.

const PATTERNS: Record<'success' | 'tap', number[]> = {
  success: [14, 40, 22], // two beats: the action landed
  tap: [10],
}

let switchLabel: HTMLLabelElement | null = null

/** The iOS trick: one hidden switch, made once and kept. Clicking its label toggles it, and the
 *  system plays the switch's own haptic. `switch` is an attribute React cannot type, so the node is
 *  built by hand. Visually hidden by .sr-only, never focusable, never announced. */
function iosSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined' || !document.body) return null
  if (switchLabel?.isConnected) return switchLabel
  try {
    const label = document.createElement('label')
    label.className = 'sr-only'
    label.setAttribute('aria-hidden', 'true')
    label.tabIndex = -1
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    switchLabel = label
    return label
  } catch {
    return null
  }
}

export function haptic(kind: 'success' | 'tap' = 'tap'): void {
  try {
    const vibrate = typeof navigator === 'undefined' ? undefined : navigator.vibrate?.bind(navigator)
    if (vibrate) { vibrate(PATTERNS[kind]); return }
    iosSwitch()?.click()
  } catch { /* a haptic is never worth an exception */ }
}
