import { SHIP } from '../../data/model'
import { certificateRows, voyageDateRange, type WrappedFinale } from './wrappedData'

// The certificate, redrawn as a 1080x1920 poster for the share sheet. It carries the same numbers
// and the same sentence-case labels as the card on screen, in the room the guest saved it from: the
// certificate on screen sits in that room, and the picture is of it. A detached canvas cannot
// resolve CSS custom properties, so each room below is transcribed from src/styles/tokens.css.
type RoomName = 'day' | 'evening' | 'night'

interface Pool { colour: string; clear: string; x: number; y: number; r: number }

interface Palette {
  room: [string, string, string]
  pools: Pool[]
  ink: string
  ink2: string
  line: string
  film: string
  hair: string
}

const W = 1080
const H = 1920

// A pool of light where the room puts it (tokens.css --pool-*-x and -y, as fractions of the frame)
// and as wide against the poster as its layer is against a 390 phone (base.css: .pool-a 580 across,
// -b 520, -c 460), so the picture is lit as the screen is. Its clear stop is the same colour at
// nothing, never `transparent`, which a canvas gradient may run through grey.
const POOL_R = [290 / 390, 260 / 390, 230 / 390]
const pool = (rgb: string, alpha: number, x: number, y: number, i: number): Pool =>
  ({ colour: `rgba(${rgb}, ${alpha})`, clear: `rgba(${rgb}, 0)`, x, y, r: POOL_R[i] * W })

// The certificate's film is the medium sheet's (--sheet-film), which it reads at on screen. A canvas
// has no blur, and over gradients this soft that loses nothing. At the worst point under it the
// meta ink holds 8.9:1 in the evening, 9.5 at night and 9.1 by day (WCAG, by arithmetic), and the
// address at the foot 6.3:1 or more.
const NIGHT: Palette = {
  room: ['#0B1222', '#0F1121', '#130F1F'],
  pools: [pool('255, 77, 109', .36, 0, .58, 0), pool('255, 159, 67', .30, .96, .38, 1), pool('74, 99, 255', .22, .08, .06, 2)],
  ink: '#F6F1E9',
  ink2: 'rgba(246, 241, 233, .84)',
  line: 'rgba(246, 241, 233, .14)',
  film: 'rgba(14, 20, 36, .40)',
  hair: 'rgba(255, 255, 255, .16)',
}

const PALETTES: Record<RoomName, Palette> = {
  night: NIGHT,
  evening: {
    ...NIGHT,
    room: ['#1A1830', '#18132A', '#140E22'],
    pools: [pool('255, 91, 120', .32, 0, .58, 0), pool('255, 166, 64', .32, .96, .38, 1), pool('255, 212, 140', .20, .08, .06, 2)],
  },
  day: {
    room: ['#DCEBF4', '#BFE0EC', '#A7D8DC'],
    pools: [pool('40, 170, 163', .22, .12, .88, 0), pool('255, 244, 214', .9, .92, .04, 1), pool('127, 182, 222', .28, .06, .30, 2)],
    ink: '#0E1A2E',
    ink2: '#2A4058',
    line: 'rgba(14, 26, 46, .14)',
    film: 'rgba(255, 255, 255, .64)',
    hair: 'rgba(255, 255, 255, .55)',
  },
}

// the room <html> is in, as the inline script in index.html and room.ts set it; night if neither ran
function roomNow(): RoomName {
  const room = document.documentElement.dataset.room
  return room === 'day' || room === 'evening' ? room : 'night'
}

const PANEL_X = 96
const PANEL_W = W - PANEL_X * 2
const PAD = 74

// Canvas silently ignores a font shorthand it cannot parse, so keep the rounded stack only where
// it actually sticks (iPhone) and drop to plain system fonts everywhere else.
const ROUNDED = 'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", Quicksand, system-ui, sans-serif'
const PLAIN = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string }

interface Block { h: number; gap: number; draw: (top: number) => void }

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

// Two weights only, and no tracking: the poster follows the same type rules as the screen.
function setFont(ctx: Ctx, stack: string, weight: number, size: number) {
  ctx.font = `${weight} ${size}px ${stack}`
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}

// Greedy wrap, with a character break for a single word wider than the column.
function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of String(text || '').split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else line = candidate
    while (ctx.measureText(line).width > maxWidth && line.length > 1) {
      let cut = line.length - 1
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut -= 1
      lines.push(line.slice(0, cut))
      line = line.slice(cut)
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function clip(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text.length
  while (cut > 1 && ctx.measureText(`${text.slice(0, cut)}…`).width > maxWidth) cut -= 1
  return `${text.slice(0, cut).trimEnd()}…`
}

// The room, as base.css paints it: the vertical gradient, then the three pools of light over it,
// each fading to nothing at its edge. No glow of its own behind the certificate.
function paintRoom(ctx: Ctx, p: Palette) {
  const room = ctx.createLinearGradient(0, 0, 0, H)
  room.addColorStop(0, p.room[0])
  room.addColorStop(.55, p.room[1])
  room.addColorStop(1, p.room[2])
  ctx.fillStyle = room
  ctx.fillRect(0, 0, W, H)
  for (const light of p.pools) {
    const x = light.x * W
    const y = light.y * H
    const glow = ctx.createRadialGradient(x, y, 0, x, y, light.r)
    glow.addColorStop(0, light.colour)
    glow.addColorStop(1, light.clear)
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
  }
}

export async function renderWrappedImage(card: WrappedFinale): Promise<Blob> {
  // Fonts first: an unloaded face would measure at fallback widths and wrap wrongly.
  try { await document.fonts?.ready } catch { /* no font manager, draw with what we have */ }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d') as Ctx | null
  if (!ctx) throw new Error('No 2D canvas context')

  ctx.textBaseline = 'top'
  setFont(ctx, ROUNDED, 700, 32)
  const stack = ctx.font.includes('32px') ? ROUNDED : PLAIN

  const p = PALETTES[roomNow()]
  paintRoom(ctx, p)

  const inner = PANEL_W - PAD * 2
  const left = PANEL_X + PAD
  const centre = W / 2
  const count = Math.max(0, Math.round(Number(card.count) || 0))
  const pct = Number.isFinite(card.pct) ? Math.max(0, card.pct) : 0
  const rows = certificateRows(card)

  const blocks: Block[] = []

  blocks.push({
    h: 58,
    gap: 32,
    draw: (top) => {
      setFont(ctx, stack, 600, 52)
      ctx.fillStyle = p.ink
      ctx.textAlign = 'center'
      ctx.fillText(clip(ctx, 'Cruise Wrapped', inner), centre, top)
    },
  })

  blocks.push({
    h: 130,
    gap: 16,
    draw: (top) => {
      setFont(ctx, stack, 700, 128)
      ctx.fillStyle = p.ink
      ctx.textAlign = 'center'
      ctx.fillText(String(count), centre, top)
    },
  })

  blocks.push({
    h: 34,
    gap: 48,
    draw: (top) => {
      setFont(ctx, stack, 400, 30)
      ctx.fillStyle = p.ink2
      ctx.textAlign = 'center'
      ctx.fillText(`drinks tried, ${pct.toFixed(0)}% complete`, centre, top)
    },
  })

  const valueMax = inner * .58
  rows.forEach((row, rowIndex) => {
    setFont(ctx, stack, 600, 30)
    const lines = wrap(ctx, row.value, valueMax).slice(0, 2)
    if (lines.length === 2) lines[1] = clip(ctx, lines[1], valueMax)
    const last = rowIndex === rows.length - 1
    blocks.push({
      h: 34 + (lines.length - 1) * 38,
      gap: last ? 48 : 32,
      draw: (top) => {
        if (rowIndex > 0) {
          ctx.lineWidth = 2
          ctx.strokeStyle = p.line
          ctx.beginPath()
          ctx.moveTo(left, top - 16)
          ctx.lineTo(left + inner, top - 16)
          ctx.stroke()
        }
        setFont(ctx, stack, 400, 30)
        ctx.fillStyle = p.ink2
        ctx.textAlign = 'left'
        ctx.fillText(row.label, left, top)
        setFont(ctx, stack, 600, 30)
        ctx.fillStyle = p.ink
        ctx.textAlign = 'right'
        lines.forEach((line, i) => ctx.fillText(line, left + inner, top + i * 38))
      },
    })
  })

  blocks.push({
    h: 32,
    gap: 0,
    draw: (top) => {
      setFont(ctx, stack, 400, 28)
      ctx.fillStyle = p.ink2
      ctx.textAlign = 'center'
      ctx.fillText(clip(ctx, `${SHIP} · ${voyageDateRange()}`, inner), centre, top)
    },
  })

  const contentH = blocks.reduce((sum, block, i) => sum + block.h + (i < blocks.length - 1 ? block.gap : 0), 0)
  const panelH = contentH + PAD * 2
  // centred, a little above the middle, so the address at the foot keeps a clear band of room
  const panelY = Math.max(120, (H - panelH) / 2 - 60)

  // The certificate as the glass it is on screen: the film and the glass's white hairline, then the
  // specular lit from the top left and gone by the middle, as base.css lights .glass. Last, the
  // inner rule a certificate is allowed. No shadow, no glow.
  roundRect(ctx, PANEL_X, panelY, PANEL_W, panelH, 40)
  ctx.fillStyle = p.film
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = p.hair
  ctx.stroke()
  const spec = ctx.createLinearGradient(PANEL_X, panelY, PANEL_X + PANEL_W / 2, panelY + panelH / 2)
  spec.addColorStop(0, 'rgba(255, 255, 255, .9)')
  spec.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.lineWidth = 3
  ctx.strokeStyle = spec
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.strokeStyle = p.line
  roundRect(ctx, PANEL_X + 24, panelY + 24, PANEL_W - 48, panelH - 48, 24)
  ctx.stroke()

  let y = panelY + PAD
  blocks.forEach((block) => {
    block.draw(y)
    y += block.h + block.gap
  })

  setFont(ctx, stack, 600, 26)
  ctx.fillStyle = p.ink2
  ctx.textAlign = 'center'
  ctx.fillText('cruise.charlesbee.org', centre, H - 104)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas produced no image'))),
      'image/png',
    )
  })
}
