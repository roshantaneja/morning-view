import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Rose Window'
export const description = 'Cathedral light filters through ancient stained glass'
export const fps = 2

const GLASS = [
  ['#4a0010', '#881830', '#cc2848', '#ee4868', '#ff7898'],
  ['#001050', '#1848aa', '#2870dd', '#48a0ff', '#78ccff'],
  ['#002010', '#0a5828', '#1a8840', '#38b860', '#60e088'],
  ['#382000', '#886008', '#bb8810', '#ddaa28', '#ffcc50'],
  ['#200040', '#481080', '#6828bb', '#8848dd', '#aa68ff'],
  ['#400020', '#801848', '#bb2868', '#dd4890', '#ff70b8'],
]

const GOLD = ['#503800', '#887010', '#bbaa28', '#ddcc48', '#ffee80']
const STONE_BG = ['#0c0c10', '#0e0e14', '#101018', '#12121c']
const MORTAR = '#08080c'
const LEAD = '#050508'
const ASPECT = 2.0

function normA(a) {
  return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
}

export function setup(canvas) {
  const cx = Math.floor(canvas.width / 2)
  const cy = Math.floor(canvas.height / 2)
  const maxR = Math.min(cx - 3, (cy - 3) * ASPECT)

  const rings = [
    { inner: 0.00, outer: 0.10, segs: 1,  off: 0 },
    { inner: 0.12, outer: 0.25, segs: 6,  off: 0 },
    { inner: 0.27, outer: 0.42, segs: 12, off: 0 },
    { inner: 0.44, outer: 0.60, segs: 6,  off: Math.PI / 6 },
    { inner: 0.62, outer: 0.78, segs: 12, off: 0 },
    { inner: 0.80, outer: 0.96, segs: 24, off: Math.PI / 24 },
  ]

  const motes = Array.from({ length: 10 }, () => ({
    x: cx + (Math.random() - 0.5) * maxR * 0.7,
    y: cy - maxR / ASPECT * 0.4 + Math.random() * maxR / ASPECT * 0.8,
    vy: 0.08 + Math.random() * 0.15,
    drift: Math.random() * Math.PI * 2,
  }))

  return { cx, cy, maxR, rings, motes }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const { cx, cy, maxR } = state
  for (const m of state.motes) {
    m.y += m.vy
    m.x += Math.sin(frame.elapsed * 0.25 + m.drift) * 0.05
    if (m.y > cy + maxR / ASPECT * 0.9) {
      m.y = cy - maxR / ASPECT * 0.9
      m.x = cx + (Math.random() - 0.5) * maxR * 0.5
    }
  }
  canvas.clear()
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, time) {
  drawStone(canvas)
  drawGlow(canvas, state, time)
  drawWindow(canvas, state, time)
  drawFrame(canvas, state)
  drawMotes(canvas, state, time)
}

function drawStone(canvas) {
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const row = Math.floor(y / 3)
      const shift = (row % 2) * 4
      const bx = (x + shift) % 8
      const by = y % 3

      if (bx === 0 || by === 0) {
        canvas.setCell(x, y, ' ', null, MORTAR)
      } else {
        const n = Math.sin(x * 1.7 + y * 0.9) * 0.3 + Math.sin(x * 0.4 + y * 2.1) * 0.2
        const t = Math.max(0, Math.min(1, n + 0.5))
        const color = lerpMulti(STONE_BG, t)
        const grain = Math.sin(x * 3.1 + y * 2.7) * 0.5 + 0.5
        if (grain > 0.85) {
          canvas.setCell(x, y, SHADE[0], lerp(color, '#18181c', 0.3), color)
        } else {
          canvas.setCell(x, y, ' ', null, color)
        }
      }
    }
  }
}

function drawGlow(canvas, state, time) {
  const { cx, cy, maxR } = state
  const la = time * 0.12

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - cx
      const dy = (y - cy) * ASPECT
      const d = Math.sqrt(dx * dx + dy * dy) / maxR

      if (d < 0.97 || d > 1.4) continue

      const fade = Math.max(0, 1 - (d - 0.97) / 0.43)
      const angle = Math.atan2(dy, dx)
      let ad = Math.abs(angle - la)
      ad = Math.min(ad, Math.PI * 2 - ad)
      const str = Math.max(0, 1 - ad / 1.0) * fade * fade * 0.22

      if (str > 0.01) {
        const cell = canvas.getCell(x, y)
        const bg = (cell && cell.bg) || '#101014'
        canvas.setCell(x, y, ' ', null, lerp(bg, '#443318', Math.min(str, 0.45)))
      }
    }
  }
}

function drawWindow(canvas, state, time) {
  const { cx, cy, maxR, rings } = state
  const la = time * 0.12
  const pulse = 0.6 + Math.sin(time * 0.35) * 0.4

  const xMin = Math.max(0, Math.floor(cx - maxR - 1))
  const xMax = Math.min(canvas.width, Math.ceil(cx + maxR + 1))
  const yMin = Math.max(0, Math.floor(cy - maxR / ASPECT - 1))
  const yMax = Math.min(canvas.height, Math.ceil(cy + maxR / ASPECT + 1))

  for (let y = yMin; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      const dx = x - cx
      const dy = (y - cy) * ASPECT
      const r = Math.sqrt(dx * dx + dy * dy)
      const d = r / maxR

      if (d > 0.97) continue

      const angle = Math.atan2(dy, dx)

      let ring = null, ri = -1
      for (let i = 0; i < rings.length; i++) {
        if (d >= rings[i].inner && d < rings[i].outer) {
          ring = rings[i]
          ri = i
          break
        }
      }

      if (!ring) {
        canvas.setCell(x, y, ' ', null, LEAD)
        continue
      }

      if (ring.segs > 1) {
        const sw = (Math.PI * 2) / ring.segs
        const a = normA(angle - ring.off)
        const pos = a % sw
        const thresh = 1.0 / Math.max(r, 1)
        if (pos < thresh || pos > sw - thresh) {
          canvas.setCell(x, y, ' ', null, LEAD)
          continue
        }
      }

      const sw = (Math.PI * 2) / Math.max(ring.segs, 1)
      const a = normA(angle - ring.off)
      const si = Math.floor(a / sw)
      const pi = (si + ri * 2) % GLASS.length
      const pal = ri === 0 ? GOLD : GLASS[pi]

      const rf = (d - ring.inner) / (ring.outer - ring.inner)
      const sf = (a - si * sw) / sw

      const panelX = 1 - 2 * Math.abs(sf - 0.5)
      const panelY = 1 - 2 * Math.abs(rf - 0.5)
      const interior = 0.4 + panelX * 0.3 + panelY * 0.3

      let base = lerpMulti(pal, rf * 0.6 + 0.2)
      if (ri === 0) base = lerpMulti(pal, pulse * 0.5 + 0.25)

      let ad = Math.abs(angle - la)
      ad = Math.min(ad, Math.PI * 2 - ad)
      const beam = Math.max(0, 1 - ad / 0.85)
      const light = beam * beam

      const bright = (0.25 + light * 0.75) * interior
      let color = lerp('#000000', base, Math.min(bright * 1.5, 1))
      if (light > 0.15) color = lerp(color, '#ffffff', light * 0.2)

      let ch
      if (bright > 0.75) ch = SHADE[3]
      else if (bright > 0.50) ch = SHADE[2]
      else if (bright > 0.30) ch = SHADE[1]
      else ch = SHADE[0]

      canvas.setCell(x, y, ch, color, lerp(LEAD, color, 0.2 + light * 0.15))
    }
  }
}

function drawFrame(canvas, state) {
  const { cx, cy, maxR } = state

  const xMin = Math.max(0, Math.floor(cx - maxR - 2))
  const xMax = Math.min(canvas.width, Math.ceil(cx + maxR + 2))
  const yMin = Math.max(0, Math.floor(cy - maxR / ASPECT - 2))
  const yMax = Math.min(canvas.height, Math.ceil(cy + maxR / ASPECT + 2))

  for (let y = yMin; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      const dx = x - cx
      const dy = (y - cy) * ASPECT
      const d = Math.sqrt(dx * dx + dy * dy) / maxR
      if (d >= 0.95 && d < 1.01) {
        const t = (d - 0.95) / 0.06
        canvas.setCell(x, y, BLOCK.full, lerp('#2a2a32', '#161620', t))
      }
    }
  }
}

function drawMotes(canvas, state, time) {
  const { cx, cy, maxR } = state
  const la = time * 0.12

  for (const m of state.motes) {
    const x = Math.floor(m.x)
    const y = Math.floor(m.y)
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue

    const dx = x - cx
    const dy = (y - cy) * ASPECT
    const d = Math.sqrt(dx * dx + dy * dy) / maxR
    if (d > 0.94) continue

    const angle = Math.atan2(dy, dx)
    let ad = Math.abs(angle - la)
    ad = Math.min(ad, Math.PI * 2 - ad)
    if (ad > 0.6) continue

    const b = Math.max(0, 1 - ad / 0.6) * 0.5
    if (b > 0.1) {
      canvas.setCell(x, y, '·', lerp('#333340', '#ffeecc', b))
    }
  }
}
