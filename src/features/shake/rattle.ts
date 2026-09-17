// Two dice in a metal shaker, synthesised. No asset: the sound is a few short noise bursts through a
// bandpass, which is cheaper than a file, never waits on the network and cannot be a 404 in a bar.
//
// Everything here is best effort. A missing AudioContext, a context that will not resume, a browser
// that throws on a parameter ramp: each one leaves the shake silent and otherwise unchanged. The
// answer on screen is the point; the noise is the theatre around it.

export interface Rattle {
  /** Cut it short: the sheet closed, or the guest shook again. */
  stop(): void
  /** The window clearing: one soft thock as the answer surfaces. */
  reveal(): void
}

const SILENT: Rattle = { stop() { /* nothing was started */ }, reveal() { /* nothing to sound */ } }

// The schedule, in seconds from the press. The ticks accelerate with the shake's three phases, so
// the ear hears the same build-up the shaker draws: gentle, harder, violent, then the stop.
const PHASES = [
  { from: 0, to: 0.6, every: 0.23 },
  { from: 0.6, to: 1.3, every: 0.15 },
  { from: 1.3, to: 1.8, every: 0.095 },
]
const STOP_AT = 1.8          // the hard stop upright; the hold after it is silent on purpose
const GAIN_FROM = 0.05       // the first tick, barely there
const GAIN_TO = 0.16         // the last one, still not loud
const MASTER = 0.6           // nothing here is loud in a bar at midnight

// A die is a small hard thing: high, short and dry. Ice would be lower and wetter, so the band sits
// at 3.2 to 4.6kHz with a per-tick jitter (two dice never land the same way twice) and the decay is
// 22 to 35ms. The clack at the stop is the tin itself, lower and longer.
const BAND_LOW = 3200, BAND_HIGH = 4600, BAND_Q = 1.4
const DECAY_LOW = 0.022, DECAY_HIGH = 0.035
const ATTACK = 0.002
const CLACK_HZ = 1900, CLACK_DECAY = 0.08, CLACK_GAIN = 0.2
const THOCK_FROM = 220, THOCK_TO = 150, THOCK_MS = 0.11, THOCK_GAIN = 0.1

type Ctor = { new(): AudioContext }
type Win = { AudioContext?: Ctor; webkitAudioContext?: Ctor }

// One context for the life of the tab. Making a second on every press is how a page runs out of them
// on iOS, and this one is created inside the press handler, which is the user gesture Safari wants.
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null

function context(): AudioContext | null {
  try {
    if (ctx) return ctx
    const w = window as unknown as Win
    const Ctx = w.AudioContext || w.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
    return ctx
  } catch {
    return null
  }
}

/** White noise, made once and shared: every burst is a window onto the same 200ms of it. */
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === c.sampleRate) return noise
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.2), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  noise = buf
  return buf
}

const quietWanted = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Start the rattle. Call it inside the press handler, never on mount: the context is created here so
 * the gesture is still live, which is the only way iOS lets a page make a sound at all.
 * A no-op, silently, when the guest chose quiet, when reduced motion is set, or when there is no
 * AudioContext to build on.
 */
export function startRattle(quiet: boolean): Rattle {
  if (quiet || quietWanted()) return SILENT
  const c = context()
  if (!c) return SILENT

  try {
    // resume() is fire and forget: a context that stays suspended plays nothing, which is the same
    // outcome as the guest choosing quiet and needs no branch of its own.
    void c.resume?.()

    const master = c.createGain()
    master.gain.value = MASTER
    master.connect(c.destination)
    const sources: AudioScheduledSourceNode[] = []
    const t0 = c.currentTime

    const burst = (at: number, gain: number, hz: number, decay: number) => {
      const src = c.createBufferSource()
      src.buffer = noiseBuffer(c)
      const band = c.createBiquadFilter()
      band.type = 'bandpass'
      band.frequency.value = hz
      band.Q.value = BAND_Q
      const amp = c.createGain()
      amp.gain.setValueAtTime(0.0001, at)
      amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), at + ATTACK)
      amp.gain.exponentialRampToValueAtTime(0.0001, at + decay)
      src.connect(band).connect(amp).connect(master)
      src.start(at)
      src.stop(at + decay + 0.01)
      sources.push(src)
    }

    // One pass over the whole schedule, laid down now against the clock. Nothing here is a timer, so
    // a busy main thread cannot stretch the rhythm out and the whole thing is finite by construction.
    for (const phase of PHASES) {
      for (let t = phase.from; t < phase.to - 0.0001; t += phase.every) {
        const rise = GAIN_FROM + (GAIN_TO - GAIN_FROM) * (t / STOP_AT)
        const hz = BAND_LOW + Math.random() * (BAND_HIGH - BAND_LOW)
        const decay = DECAY_LOW + Math.random() * (DECAY_HIGH - DECAY_LOW)
        burst(t0 + t, rise, hz, decay)
      }
    }
    burst(t0 + STOP_AT, CLACK_GAIN, CLACK_HZ, CLACK_DECAY)

    const hush = () => {
      try {
        master.gain.cancelScheduledValues(c.currentTime)
        master.gain.setValueAtTime(0, c.currentTime)
        for (const s of sources) { try { s.stop() } catch { /* already stopped, or never started */ } }
        sources.length = 0
      } catch { /* a sound is never worth an exception */ }
    }

    return {
      stop: hush,
      reveal() {
        try {
          // The answer surfacing through the liquid: a sine falling a fifth in a tenth of a second.
          // The only oscillator in the piece, and the only sound after the stop.
          const at = c.currentTime
          const osc = c.createOscillator()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(THOCK_FROM, at)
          osc.frequency.exponentialRampToValueAtTime(THOCK_TO, at + THOCK_MS)
          const amp = c.createGain()
          amp.gain.setValueAtTime(0.0001, at)
          amp.gain.exponentialRampToValueAtTime(THOCK_GAIN, at + ATTACK)
          amp.gain.exponentialRampToValueAtTime(0.0001, at + THOCK_MS)
          osc.connect(amp).connect(master)
          osc.start(at)
          osc.stop(at + THOCK_MS + 0.02)
          sources.push(osc)
        } catch { /* a sound is never worth an exception */ }
      },
    }
  } catch {
    return SILENT
  }
}
