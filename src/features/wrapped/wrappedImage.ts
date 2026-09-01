import { BADGES } from '../../data/badges'
import { voyageDateRange, type WrappedFinale } from './wrappedData'

// The certificate, redrawn as a 1080x1920 poster for the share sheet. A detached canvas cannot
// resolve CSS custom properties, so the palette below is transcribed from src/styles/tokens.css.
const CREAM = '#FBF3E2'
const DAWN = '#FFEBCB'
const SKY = '#CDEBF7'
const INK = '#1C3C56'
const INK_2 = 'rgba(28, 60, 86, .66)'
const INK_3 = 'rgba(28, 60, 86, .44)'
const SEA_HI = '#28AAA3'
const SEA_LO = '#093755'
const CORAL_INK = '#D23A5C'

const W = 1080
const H = 1920
const SEA_TOP = 1500
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

function setFont(ctx: Ctx, stack: string, weight: number, size: number, tracking = 0) {
  ctx.font = `${weight} ${size}px ${stack}`
  // Tracking is Chrome/Safari-only; the eyebrow simply loses its spacing elsewhere.
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`
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

function paintGround(ctx: Ctx) {
  const ground = ctx.createLinearGradient(0, 0, W * .3, H)
  ground.addColorStop(0, SKY)
  ground.addColorStop(.44, CREAM)
  ground.addColorStop(1, DAWN)
  ctx.fillStyle = ground
  ctx.fillRect(0, 0, W, H)

  const dawn = ctx.createRadialGradient(W * .74, H * .16, 0, W * .74, H * .16, 620)
  dawn.addColorStop(0, 'rgba(255, 222, 143, .78)')
  dawn.addColorStop(1, 'rgba(255, 222, 143, 0)')
  ctx.fillStyle = dawn
  ctx.fillRect(0, 0, W, H)

  const glass = ctx.createRadialGradient(W * .1, H * .58, 0, W * .1, H * .58, 560)
  glass.addColorStop(0, 'rgba(79, 211, 198, .34)')
  glass.addColorStop(1, 'rgba(79, 211, 198, 0)')
  ctx.fillStyle = glass
  ctx.fillRect(0, 0, W, H)
}

function paintSea(ctx: Ctx) {
  const sea = ctx.createLinearGradient(0, SEA_TOP - 120, 0, H)
  sea.addColorStop(0, 'rgba(40, 170, 163, 0)')
  sea.addColorStop(.3, 'rgba(40, 170, 163, .58)')
  sea.addColorStop(.62, SEA_HI)
  sea.addColorStop(1, SEA_LO)
  ctx.fillStyle = sea
  ctx.fillRect(0, SEA_TOP - 120, W, H - SEA_TOP + 120)

  // Two slack crest lines, enough to read as water without turning into a pattern.
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255, 255, 255, .3)'
  for (const [y, dip] of [[SEA_TOP + 96, 26], [SEA_TOP + 214, -20]] as const) {
    ctx.beginPath()
    ctx.moveTo(-20, y)
    ctx.quadraticCurveTo(W / 2, y + dip, W + 20, y)
    ctx.stroke()
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

  paintGround(ctx)
  paintSea(ctx)

  const inner = PANEL_W - PAD * 2
  const left = PANEL_X + PAD
  const centre = W / 2
  const count = Math.max(0, Math.round(Number(card.count) || 0))
  const pct = Number.isFinite(card.pct) ? Math.max(0, card.pct) : 0

  const rows: { label: string; value: string }[] = []
  if (card.archetype?.name) rows.push({ label: 'Your taste', value: card.archetype.name })
  if (card.topBar) rows.push({ label: 'Top bar', value: card.topBar })
  if (card.spirit) rows.push({ label: 'Favourite spirit', value: card.spirit })
  if (card.medals > 0) rows.push({ label: 'Medals', value: `${card.medals} of ${BADGES.length}` })
  if (card.crew) {
    rows.push({
      label: 'Sailed with',
      value: card.crew.twinName ? `${card.crew.count} · twin ${card.crew.twinName}` : `${card.crew.count}`,
    })
  }

  const blocks: Block[] = []

  blocks.push({
    h: 30,
    gap: 34,
    draw: (top) => {
      setFont(ctx, stack, 800, 25, 2.6)
      ctx.fillStyle = INK_2
      ctx.textAlign = 'center'
      ctx.fillText('CERTIFICATE OF A VOYAGE', centre, top)
    },
  })

  blocks.push({
    h: 92,
    gap: 34,
    draw: (top) => {
      setFont(ctx, stack, 800, 86)
      ctx.fillStyle = INK
      ctx.textAlign = 'center'
      ctx.fillText(clip(ctx, 'Cruise Wrapped', inner), centre, top)
    },
  })

  blocks.push({
    h: 176,
    gap: 20,
    draw: (top) => {
      setFont(ctx, stack, 800, 192)
      ctx.fillStyle = INK
      ctx.textAlign = 'center'
      ctx.fillText(String(count), centre, top)
    },
  })

  blocks.push({
    h: 40,
    gap: 52,
    draw: (top) => {
      // Drawn in two runs so the percentage carries the one coral accent on the poster.
      setFont(ctx, stack, 650, 32)
      ctx.textAlign = 'left'
      const lead = 'drinks tried · '
      const tail = `${pct.toFixed(1)}% complete`
      const x = centre - (ctx.measureText(lead).width + ctx.measureText(tail).width) / 2
      ctx.fillStyle = INK_2
      ctx.fillText(lead, x, top)
      ctx.fillStyle = CORAL_INK
      ctx.fillText(tail, x + ctx.measureText(lead).width, top)
    },
  })

  const valueMax = inner * .62
  rows.forEach((row, rowIndex) => {
    setFont(ctx, stack, 700, 32)
    const lines = wrap(ctx, row.value, valueMax).slice(0, 2)
    setFont(ctx, stack, 700, 32)
    if (lines.length === 2) lines[1] = clip(ctx, lines[1], valueMax)
    blocks.push({
      h: 34 + (lines.length - 1) * 40,
      gap: rowIndex === rows.length - 1 ? 54 : 22,
      draw: (top) => {
        setFont(ctx, stack, 800, 22, 1.4)
        ctx.fillStyle = INK_3
        ctx.textAlign = 'left'
        ctx.fillText(row.label.toUpperCase(), left, top + 6)
        setFont(ctx, stack, 700, 32)
        ctx.fillStyle = INK
        ctx.textAlign = 'right'
        lines.forEach((line, i) => ctx.fillText(line, left + inner, top + i * 40))
      },
    })
  })

  blocks.push({
    h: 28,
    gap: 0,
    draw: (top) => {
      setFont(ctx, stack, 700, 24, 1)
      ctx.fillStyle = INK_3
      ctx.textAlign = 'center'
      ctx.fillText(clip(ctx, `Sun Princess · ${voyageDateRange()}`, inner), centre, top)
    },
  })

  const contentH = blocks.reduce((sum, block, i) => sum + block.h + (i < blocks.length - 1 ? block.gap : 0), 0)
  const panelH = contentH + PAD * 2
  const panelY = Math.max(120, (SEA_TOP - panelH) / 2)

  ctx.save()
  ctx.shadowColor = 'rgba(33, 58, 87, .16)'
  ctx.shadowBlur = 64
  ctx.shadowOffsetY = 26
  roundRect(ctx, PANEL_X, panelY, PANEL_W, panelH, 56)
  ctx.fillStyle = 'rgba(255, 255, 255, .6)'
  ctx.fill()
  ctx.restore()

  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255, 255, 255, .82)'
  roundRect(ctx, PANEL_X, panelY, PANEL_W, panelH, 56)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(28, 60, 86, .12)'
  roundRect(ctx, PANEL_X + 22, panelY + 22, PANEL_W - 44, panelH - 44, 38)
  ctx.stroke()

  let y = panelY + PAD
  blocks.forEach((block) => {
    block.draw(y)
    y += block.h + block.gap
  })

  setFont(ctx, stack, 700, 24, 2)
  ctx.fillStyle = 'rgba(255, 255, 255, .82)'
  ctx.textAlign = 'center'
  ctx.fillText('cruise.charlesbee.org', centre, H - 104)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas produced no image'))),
      'image/png',
    )
  })
}
