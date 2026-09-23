import { useId, useState, type CSSProperties } from 'react'
import type { BadgeDef } from '../../data/badges'
import { SHIP, START } from '../../data/model'
import { haptic } from '../../ui/haptic'
import { EMBLEMS } from './emblems-data'
import './coin.css'

// The medal (docs/DESIGN.md, Material, The medals): prototype C's struck coin, one SVG per face,
// used wherever a medal appears. Light comes from the top left, as on the glass. From the outside
// in: B's turned rim (a conic behind the SVG, because SVG has no conic), its light and its shade, the
// milled ring, the bevel falling into the field, the field struck down below the rim (shaded wall
// top left, lit wall bottom right), then the emblem from emblems-data.ts struck three times (a
// shadow down and right, a highlight up and left, the face), a sheen and a glint on the upper rim.
//
// Bronze, silver and gold take A's polished field, a darker mirror band past the middle: C's pale
// radial field under a pale emblem is what made Gin Explorer faint at 96px. The Champion is a gilt
// rim round blue enamel. A medal not yet earned is a gunmetal blank with nothing struck into it,
// never a grey copy of the earned coin; one in reach carries an amber ring filling to its progress.

export type CoinState = 'earned' | 'reach' | 'locked'

interface CoinProps {
  badge: BadgeDef
  state: CoinState
  /** 0 to 1, drawn as the amber ring round a coin in reach */
  progress?: number
  /** the outer box in px; a ringed coin draws its metal inside it */
  size?: number
  /** one turn on entry, then still (Home's new medal) */
  turn?: boolean
  /** a tap turns it over to the reverse (the medal sheet's large coin); earned coins only */
  flip?: boolean
  className?: string
}

type Stops = [offset: number, colour: string][]
type MetalName = 'bronze' | 'silver' | 'gold' | 'special' | 'blank'

interface Metal {
  /** the turned rim's conic: hi, mid, lo */
  rim: [string, string, string]
  /** the bevel, the rim's metal reversed as it falls into the field */
  bevel: Stops
  /** a polished field (a diagonal with the mirror band) or a domed one (radial) */
  field: { band: Stops } | { dome: Stops; r: number }
  /** the struck emblem's face */
  face: Stops
  /** the relief's highlight and shadow copies */
  relief: [light: string, dark: string]
  /** the milled edge seen side on, dark and lit */
  edge: [string, string]
}

// C's metals (prototypes/2026-09-23/c/index.html, the shared defs) with A's polished fields
// (a/a.js, METAL[x].band). The Champion borrows gold's rim, bevel and face round its own enamel.
const GOLD: Omit<Metal, 'field'> = {
  rim: ['#FFF4C8', '#F2C35A', '#B98423'],
  bevel: [[0, '#FFE9A6'], [0.5, '#D19A33'], [1, '#7A520F']],
  face: [[0, '#FFF7D6'], [0.6, '#F0C458'], [1, '#C08A28']],
  relief: ['#FFF8E0', '#6B4708'],
  edge: ['#7A520F', '#E8B54A'],
}

const METALS: Record<MetalName, Metal> = {
  gold: {
    ...GOLD,
    field: { band: [[0, '#FFEDB0'], [0.34, '#E7B94A'], [0.56, '#B27F1D'], [0.78, '#D9A638'], [1, '#F3D273']] },
  },
  silver: {
    rim: ['#FFFFFF', '#D9E0E8', '#8E99A8'],
    bevel: [[0, '#F4F7FA'], [0.5, '#A9B3C0'], [1, '#5D6776']],
    field: { band: [[0, '#EDF1F5'], [0.34, '#B4BECA'], [0.56, '#7D8996'], [0.78, '#A3AEBA'], [1, '#D3D9E0']] },
    face: [[0, '#FFFFFF'], [0.6, '#D5DCE4'], [1, '#9AA5B2']],
    relief: ['#FFFFFF', '#46505F'],
    edge: ['#5D6776', '#DCE3EA'],
  },
  bronze: {
    rim: ['#FFD9B3', '#D48C52', '#94532A'],
    bevel: [[0, '#F6C69A'], [0.5, '#B26A36'], [1, '#5E3216']],
    field: { band: [[0, '#F3C79D'], [0.34, '#CC8A55'], [0.56, '#8C522A'], [0.78, '#B97444'], [1, '#DCA273']] },
    face: [[0, '#FFE2C4'], [0.6, '#DC9660'], [1, '#A05E30']],
    relief: ['#FFE6CC', '#4E2A10'],
    edge: ['#5E3216', '#D28E55'],
  },
  special: {
    ...GOLD,
    field: { dome: [[0, '#3D63D6'], [0.55, '#1D3C9A'], [1, '#0E2263']], r: 0.9 },
    relief: ['#FFF4C8', '#081338'],
  },
  // the unstruck blank: gunmetal, nothing struck, so face and relief are never drawn on it
  blank: {
    rim: ['#6A7488', '#4E586C', '#2A3142'],
    bevel: [[0, '#4E586C'], [1, '#1C2230']],
    field: { dome: [[0, '#3C4558'], [1, '#232A38']], r: 0.85 },
    face: [[0, '#6A7488'], [1, '#3A4356']],
    relief: ['#6A7488', '#1A202D'],
    edge: ['#1C2230', '#4E586C'],
  },
}

// Each emblem's drawn extent in its 100 box (C, measured with getBBox in Brave on 23 September
// 2026). The emblems were drawn for a badge, not a coin, and several sit low in the box, so on a
// coin each is centred on the field and scaled to one size.
const EMBOX: Record<string, [number, number, number, number]> = {
  champion: [16, 16, 68, 68], coffee: [20, 16, 60, 65.5], everybar: [14, 14, 72, 72], fifty: [20, 22, 60, 58],
  first: [18, 50, 64, 30], frozen: [16.6, 16, 66.9, 68], gin: [21, 17, 58, 66], hundred: [20, 20, 60, 60],
  margarita: [23, 18, 54, 66], martini: [22, 14, 56, 65], master: [32, 13.8, 36, 70.2], onefifty: [20, 19.5, 60, 60.5],
  rum: [10, 10, 80, 80], ten: [18, 35, 64, 45], twentyfive: [18, 30, 64, 50], twohundred: [20, 16, 60, 64],
  whiskey: [22, 19.5, 56, 61], wine: [29, 15, 39, 65],
}

function emblemFit(id: string): string {
  const [x, y, w, h] = EMBOX[id] ?? [16, 16, 68, 68]
  const s = Math.min(0.78, 50 / Math.max(w, h))
  return `translate(50 50) scale(${s.toFixed(3)}) translate(${(-(x + w / 2)).toFixed(1)} ${(-(y + h / 2)).toFixed(1)})`
}

// the reverse: the liner in silhouette over the ship's name and the sailing's year
const SHIP_ART = '<path d="M6 33 H144 L133 47 Q131 49 126 49 H24 Q19 49 17 47 Z"/><path d="M31 33 V24 H119 V33 Z M45 24 V17 H105 V24 Z M74 17 V12 H102 V17 Z"/><path d="M53 17 L56 5 H67 L70 17 Z"/>'
const SHIP_FIT = 'translate(50 44) scale(.44) translate(-75 -27)'
const YEAR = START.slice(0, 4)

const RING_R = 54
const RING_C = 2 * Math.PI * RING_R

const metalOf = (badge: BadgeDef, earned: boolean): MetalName =>
  earned ? (badge.tier ?? 'bronze') : 'blank'

const stops = (list: Stops) =>
  list.map(([offset, colour]) => <stop key={offset} offset={offset} stopColor={colour} />)

interface FaceProps {
  badge: BadgeDef
  metal: MetalName
  size: number
  ring: number | null
  reverse?: boolean
}

function CoinFace({ badge, metal, size, ring, reverse = false }: FaceProps) {
  // one set of gradient ids per face, so two coins on a screen (or the two faces of one) never
  // share an id; React's id carries characters that url(#...) does not take kindly to
  const u = 'coin' + useId().replace(/[^\w-]/g, '')
  const m = METALS[metal]
  const earned = metal !== 'blank'
  const ringed = ring !== null
  // A's relief scaled to the coin (a/a.js line 468): 110 / px coin units, held between 0.8 and 2.6,
  // so the strike is about a pixel deep on a 44px coin and on the 196px one alike
  const px = ringed ? (size * 100) / 116 : size
  const k = Math.max(0.8, Math.min(2.6, 110 / px))
  const art = reverse ? SHIP_ART : (EMBLEMS[badge.id] ?? '')
  const fit = reverse ? SHIP_FIT : emblemFit(badge.id)
  // the rim sits at r 49 of the box; with a ring the box is 116 across, so the rim is inset further
  const rimInset = ringed ? `${((58 - 49) / 116) * 100}%` : '1%'

  // the legend struck the way the emblem is; a guest's own ship name can be long, so past thirteen
  // characters it is fitted to the field rather than run off it
  const legend = (y: number, fontSize: number, text: string) => {
    const fitWidth = text.length > 13 ? { textLength: 66, lengthAdjust: 'spacingAndGlyphs' as const } : {}
    const t = { x: 50, y, textAnchor: 'middle' as const, fontSize, fontWeight: 700, ...fitWidth }
    return (
      <>
        <text {...t} fill={m.relief[1]} opacity={0.85} transform={`translate(${0.6 * k} ${0.7 * k})`}>{text}</text>
        <text {...t} fill={m.relief[0]} transform={`translate(${-0.35 * k} ${-0.4 * k})`}>{text}</text>
        <text {...t} fill={`url(#${u}e)`}>{text}</text>
      </>
    )
  }

  return (
    <span
      className="coin"
      style={{
        width: size, height: size, fontSize: size / 100,
        '--m-hi': m.rim[0], '--m-mid': m.rim[1], '--m-lo': m.rim[2],
      } as CSSProperties}
      aria-hidden="true"
    >
      <span className="coin-metal" style={{ inset: rimInset }} />
      <svg className="coin-svg" viewBox={ringed ? '-8 -8 116 116' : '0 0 100 100'} focusable="false">
        <defs>
          <linearGradient id={`${u}b`} x1="1" y1="1" x2="0" y2="0">{stops(m.bevel)}</linearGradient>
          {'band' in m.field
            ? <linearGradient id={`${u}f`} x1=".1" y1="0" x2=".9" y2="1">{stops(m.field.band)}</linearGradient>
            : <radialGradient id={`${u}f`} cx=".36" cy=".3" r={m.field.r}>{stops(m.field.dome)}</radialGradient>}
          <linearGradient id={`${u}e`} x1="0" y1="0" x2="1" y2="1">{stops(m.face)}</linearGradient>
          {/* B's rim light: the turned metal catches the light top left and falls away bottom right */}
          <radialGradient id={`${u}rl`} cx=".3" cy=".24" r=".46">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${u}rs`} cx=".46" cy=".45" r=".5">
            <stop offset=".9" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".28" />
          </radialGradient>
          {/* B's strike: the field sits below the rim, its wall in shade top left and lit bottom right */}
          <radialGradient id={`${u}ws`} cx=".535" cy=".545" r=".5">
            <stop offset=".9" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".34" />
          </radialGradient>
          <radialGradient id={`${u}wl`} cx=".465" cy=".455" r=".5">
            <stop offset=".92" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".45" />
          </radialGradient>
          <radialGradient id={`${u}s`} cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {ringed && (
          <>
            <circle className="coin-track" cx="50" cy="50" r={RING_R} strokeWidth="3.4" />
            <circle
              className="coin-arc" cx="50" cy="50" r={RING_R} strokeWidth="3.4"
              strokeDasharray={`${(Math.max(0, Math.min(1, ring)) * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`}
              transform="rotate(-90 50 50)"
            />
          </>
        )}

        {/* the rim itself is .coin-metal's conic, behind this drawing */}
        <circle cx="50" cy="50" r="49" fill={`url(#${u}rl)`} />
        <circle cx="50" cy="50" r="49" fill={`url(#${u}rs)`} />
        {/* a hairline, so a white rim holds its edge on the day room's pale sky */}
        <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(14, 26, 46, .18)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="50" r="47" fill="none" stroke={`url(#${u}b)`} strokeWidth="2.4" strokeDasharray="1 1.1" opacity=".8" />
        <circle cx="50" cy="50" r="44.2" fill={`url(#${u}b)`} />
        <circle cx="50" cy="50" r="41" fill={`url(#${u}f)`} />
        <circle cx="50" cy="50" r="41" fill={`url(#${u}ws)`} />
        <circle cx="50" cy="50" r="41" fill={`url(#${u}wl)`} />
        <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(0, 0, 0, .3)" strokeWidth=".8" />

        {earned && art && (
          <>
            {/* struck three times: B's shadow at .8, A's highlight, then the face */}
            <g transform={`translate(${k} ${1.2 * k})`} fill={m.relief[1]} opacity=".8">
              <g transform={fit} dangerouslySetInnerHTML={{ __html: art }} />
            </g>
            <g transform={`translate(${-0.7 * k} ${-0.8 * k})`} fill={m.relief[0]} opacity=".95">
              <g transform={fit} dangerouslySetInnerHTML={{ __html: art }} />
            </g>
            <g transform={fit} fill={`url(#${u}e)`} dangerouslySetInnerHTML={{ __html: art }} />
          </>
        )}
        {earned && reverse && (
          <>
            {legend(69, 8, SHIP)}
            {legend(79.5, 7, YEAR)}
          </>
        )}

        <ellipse cx="37" cy="30" rx="30" ry="17" fill={`url(#${u}s)`} transform="rotate(-32 37 30)" opacity={earned ? 1 : 0.35} />
        <path
          d="M9.5 42 A41 41 0 0 1 42 9.5" fill="none" strokeWidth="1.1" strokeLinecap="round"
          stroke={earned ? 'rgba(255, 255, 255, .85)' : 'rgba(255, 255, 255, .3)'}
        />
      </svg>
    </span>
  )
}

export function Coin({ badge, state, progress, size = 56, turn = false, flip = false, className }: CoinProps) {
  const earned = state === 'earned'
  const metal = metalOf(badge, earned)
  const ring = state === 'reach' && typeof progress === 'number' ? progress : null
  const [flipped, setFlipped] = useState(false)
  const [turning, setTurning] = useState(turn)

  // a flat coin is one face; only a coin that turns carries the edge and the reverse
  if (!earned || (!turn && !flip)) {
    return (
      <span className={`coin-flat${className ? ' ' + className : ''}`} style={{ width: size, height: size }}>
        <CoinFace badge={badge} metal={metal} size={size} ring={ring} />
      </span>
    )
  }

  // C's coin in 3D: the front, a milled edge of stacked discs, and the reverse behind it
  const thick = Math.max(3, Math.round(size * 0.05))
  const layers = Math.min(14, thick * 2)
  const m = METALS[metal]
  const spin = (
    <span
      className={`coin-spin${turning ? ' is-turning' : ''}`}
      style={{
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        '--thick': `${thick}px`, '--edge-lo': m.edge[0], '--edge-hi': m.edge[1],
      } as CSSProperties}
    >
      <span className="coin-face"><CoinFace badge={badge} metal={metal} size={size} ring={null} /></span>
      {Array.from({ length: layers - 1 }, (_, i) => (
        <i key={i} className="coin-edge" style={{ transform: `translateZ(${(-((i + 1) * thick) / layers).toFixed(2)}px)` }} />
      ))}
      <span className="coin-face coin-face-rev"><CoinFace badge={badge} metal={metal} size={size} ring={null} reverse /></span>
    </span>
  )
  const box = { width: size, height: size }

  if (!flip) {
    return <span className={`coin3d${className ? ' ' + className : ''}`} style={box} aria-hidden="true">{spin}</span>
  }
  return (
    <button
      type="button"
      className={`coin3d coin-flip${className ? ' ' + className : ''}`}
      style={box}
      aria-label={flipped ? 'Turn the coin back' : 'Turn the coin over'}
      onClick={() => {
        // the entry turn's fill would hold rotateY(360) and run the flip backwards, so it goes first
        setTurning(false)
        setFlipped((f) => !f)
        haptic()
      }}
    >
      {spin}
    </button>
  )
}
