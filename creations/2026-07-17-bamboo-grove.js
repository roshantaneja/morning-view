import { lerpMulti, lerp, SHADE } from '../src/theme.js'

export const title = 'Bamboo Grove'
export const description = 'Morning mist threads between bamboo stalks at first light'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SKY = ['#020a08', '#041008', '#061610', '#081c14', '#0a2218']
const DAWN = '#302810'
const BPAL = [
  ['#081408', '#0c1c0c', '#102410'],
  ['#0c1c0c', '#142c14', '#1c3c1e'],
  ['#102410', '#1c3818', '#284c24'],
  ['#143014', '#244e24', '#347838'],
  ['#1a3c1a', '#2c5c2c', '#3e8c3e'],
]
const NODE_COL = '#0a140a'
const MIST_DIM = '#0e1e18'
const MIST_BRIGHT = '#1c3428'
const GND = ['#040806', '#060c08', '#081010', '#0a1412']
const GND_MOSS = '#102810'

export function setup(canvas) {
  const rng = srand(717)
  const w = canvas.width
  const stalks = []
  const count = Math.floor(w / 4) + 4

  for (let i = 0; i < count; i++) {
    const depth = rng()
    const topFrac = 0.02 + rng() * 0.22
    const leaves = []
    for (let j = 0, n = 1 + Math.floor(rng() * 4); j < n; j++) {
      leaves.push({
        yFrac: topFrac + rng() * 0.25,
        dir: rng() > 0.5 ? 1 : -1,
        len: 1 + Math.floor(rng() * 3),
        ph: rng() * Math.PI * 2,
      })
    }
    stalks.push({
      x: Math.floor(rng() * (w - 8)) + 4,
      topFrac, depth,
      thick: depth > 0.45 && rng() > 0.35,
      sway: rng() * Math.PI * 2,
      amp: 0.3 + rng() * 1.0,
      nodeGap: 4 + Math.floor(rng() * 4),
      nodeOff: Math.floor(rng() * 5),
      leaves,
    })
  }
  stalks.sort((a, b) => a.depth - b.depth)
  return { stalks, phase: 0 }
}

export function render(canvas, data, state) { paint(canvas, state) }

export function update(canvas, data, frame, state) {
  state.phase += 0.04
  paint(canvas, state)
}

function paint(canvas, state) {
  const w = canvas.width, h = canvas.height
  const groundY = h - Math.max(3, Math.floor(h * 0.04))
  const { stalks, phase } = state

  for (let y = 0; y < h; y++) {
    const yt = y / h
    const sky = lerpMulti(SKY, yt)
    for (let x = 0; x < w; x++) {
      const dt = Math.max(0, (x / w) * 0.5 + (1 - yt) * 0.5 - 0.35) * 0.3
      canvas.setCell(x, y, ' ', null, lerp(sky, DAWN, dt))
    }
  }

  for (let y = groundY; y < h; y++) {
    const gt = Math.min(1, (y - groundY) / Math.max(1, h - groundY))
    const gc = lerpMulti(GND, gt)
    for (let x = 0; x < w; x++) {
      const tex = Math.sin(x * 0.8 + y * 1.1) * 0.5 + 0.5
      canvas.setCell(x, y, tex > 0.7 ? SHADE[1] : SHADE[0], tex > 0.7 ? GND_MOSS : gc, gc)
    }
  }

  let si = 0, mi = 0
  const mists = [
    { at: 0.25, yf: 0.42, hf: 0.14, o: 0.14, sd: 0 },
    { at: 0.55, yf: 0.30, hf: 0.10, o: 0.16, sd: 1 },
    { at: 0.80, yf: 0.55, hf: 0.09, o: 0.11, sd: 2 },
  ]

  while (si < stalks.length) {
    while (mi < mists.length && stalks[si].depth >= mists[mi].at) {
      drawMist(canvas, w, h, phase, mists[mi])
      mi++
    }
    drawStalk(canvas, w, h, stalks[si], phase, groundY)
    si++
  }
  while (mi < mists.length) { drawMist(canvas, w, h, phase, mists[mi]); mi++ }

  drawRays(canvas, w, h, phase)
}

function drawStalk(canvas, w, h, s, phase, groundY) {
  const di = Math.min(4, Math.floor(s.depth * 5))
  const pal = BPAL[di]
  const topY = Math.floor(h * s.topFrac)
  const baseY = Math.min(groundY + 1, h - 1)
  const sway = Math.sin(phase + s.sway) * s.amp
  const span = Math.max(1, baseY - topY)

  for (let y = topY; y <= baseY; y++) {
    const p = (y - topY) / span
    const x = Math.round(s.x + sway * (1 - p * p))
    if (x < 1 || x >= w - 2) continue

    const t = Math.min(1, Math.max(0, 0.2 + (1 - p) * 0.5 + (x / w) * 0.2))
    const col = lerpMulti(pal, t)

    if (((y + s.nodeOff) % s.nodeGap) === 0) {
      canvas.setCell(x, y, '━', NODE_COL)
      if (s.thick) canvas.setCell(x + 1, y, '━', NODE_COL)
    } else {
      canvas.setCell(x, y, SHADE[3], col)
      if (s.thick) canvas.setCell(x + 1, y, SHADE[2], lerp(col, '#000000', 0.2))
    }
  }

  for (const leaf of s.leaves) {
    const ly = Math.floor(h * leaf.yFrac)
    if (ly >= groundY) continue
    const lp = Math.min(1, (ly - topY) / span)
    const lx = Math.round(s.x + sway * (1 - lp * lp))
    const sw = Math.sin(phase * 1.3 + leaf.ph) * 0.4
    for (let i = 1; i <= leaf.len; i++) {
      const fx = lx + leaf.dir * i + Math.round(sw)
      const fy = ly + Math.floor(i * 0.5)
      if (fx >= 0 && fx < w && fy >= 0 && fy < h)
        canvas.setCell(fx, fy, leaf.dir > 0 ? '\\' : '/', pal[2])
    }
  }
}

function drawMist(canvas, w, h, phase, m) {
  const sy = Math.floor(h * m.yf)
  const bh = Math.max(1, Math.floor(h * m.hf))
  const ey = Math.min(h, sy + bh)

  for (let y = sy; y < ey; y++) {
    const fade = Math.sin(((y - sy) / bh) * Math.PI)
    for (let x = 0; x < w; x++) {
      const d = Math.sin(x * 0.02 + phase * 0.6 + m.sd * 2.5)
            + Math.sin(x * 0.05 - phase * 0.25 + y * 0.12 + m.sd * 1.3) * 0.5
      const intensity = fade * m.o * (d * 0.5 + 0.5)
      if (intensity > 0.04) {
        const col = lerp(MIST_DIM, MIST_BRIGHT, Math.min(1, intensity * 5))
        canvas.setCell(x, y, '░', col)
      }
    }
  }
}

function drawRays(canvas, w, h, phase) {
  const rays = [
    { xf: 0.75, bi: 0.7, sp: 0.5, ph: 0 },
    { xf: 0.55, bi: 0.5, sp: 0.3, ph: 1.5 },
    { xf: 0.85, bi: 0.6, sp: 0.4, ph: 3.0 },
    { xf: 0.40, bi: 0.35, sp: 0.35, ph: 4.5 },
  ]
  const rh = Math.floor(h * 0.7)

  for (const r of rays) {
    const pulse = Math.sin(phase * r.sp + r.ph) * 0.35 + 0.65
    const ri = r.bi * pulse
    if (ri < 0.2) continue
    const sx = Math.floor(w * r.xf)
    const rw = 1 + Math.floor(ri * 3)

    for (let y = 0; y < rh; y++) {
      const x0 = sx - Math.floor(y * 0.25)
      for (let dx = 0; dx < rw; dx++) {
        const rx = x0 + dx
        if (rx < 0 || rx >= w) continue
        const edge = 1 - Math.abs(dx - rw / 2) / (rw / 2 + 0.01)
        const hf = Math.pow(1 - y / rh, 0.6)
        const intensity = ri * edge * hf * 0.12
        if (intensity < 0.01) continue

        const cell = canvas.getCell(rx, y)
        if (!cell) continue
        if (cell.char === ' ' && cell.bg) {
          canvas.setCell(rx, y, ' ', null, lerp(cell.bg, DAWN, intensity))
        } else if (cell.char === '░') {
          const fg = cell.fg || MIST_DIM
          const bg = cell.bg || '#020a08'
          canvas.setCell(rx, y, '░', lerp(fg, DAWN, intensity * 0.5), lerp(bg, DAWN, intensity))
        }
      }
    }
  }
}
