import { lerpMulti, lerp } from '../src/theme.js'

export const title = 'Paper Theater'
export const description = 'Layered silhouettes drift in a shadow box, each cut from a deeper shade of twilight'
export const fps = 2

const TWO_PI = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function hex2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

const SKY = ['#04041a', '#081024', '#0c162e', '#101c38', '#142242', '#1a284e']
const LCOL = ['#3a4e6e', '#2e4060', '#223252', '#162644', '#0c1a36']

export function setup(canvas) {
  const rng = srand(812)
  const w = canvas.width
  const h = canvas.height

  const stars = []
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: 6 + Math.floor(rng() * (w - 12)),
      y: 5 + Math.floor(rng() * (h * 0.26)),
      b: 0.1 + rng() * 0.9, ph: rng() * TWO_PI, sp: 0.15 + rng() * 0.6,
    })
  }

  const trees = [[], [], [], [], []]
  const cfgs = [
    [0, 0, 0, 0, 0],
    [18, 2, 5, 1.5, 3],
    [12, 4, 9, 2, 4],
    [7, 9, 18, 3, 6],
    [0, 0, 0, 0, 0],
  ]
  for (let li = 0; li < 5; li++) {
    const [n, minH, maxH, minW, maxW] = cfgs[li]
    for (let i = 0; i < n; i++) {
      trees[li].push({
        cx: rng() * w,
        th: minH + rng() * (maxH - minH),
        tw: minW + rng() * (maxW - minW),
      })
    }
  }

  const grass = new Float32Array(w)
  for (let x = 0; x < w; x++) {
    grass[x] = Math.sin(x * 0.16) * 1.5 + Math.sin(x * 0.42 + 2) * 0.8 + Math.sin(x * 0.07 + 5) * 2
  }

  const motes = []
  for (let i = 0; i < 14; i++) {
    motes.push({
      bx: 0.1 + rng() * 0.8, by: 0.36 + rng() * 0.40,
      ph: rng() * TWO_PI, sp: 0.3 + rng() * 0.5,
      ax: 3 + rng() * 8, ay: 1 + rng() * 4,
    })
  }

  return { stars, trees, grass, motes }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }
export function update(canvas, data, frame, state) { drawScene(canvas, state, frame.elapsed) }

function drawScene(canvas, state, t) {
  const w = canvas.width, h = canvas.height

  for (let y = 0; y < h; y++) {
    const bg = lerpMulti(SKY, Math.min(1, y / (h * 0.6)))
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, bg)
  }

  const hz = Math.floor(h * 0.34)
  for (let dy = -5; dy <= 3; dy++) {
    const py = hz + dy
    if (py < 0 || py >= h) continue
    const s = Math.max(0, 1 - Math.abs(dy) / 5) * 0.06
    for (let x = 0; x < w; x++) {
      const c = canvas.getCell(x, py)
      if (c && c.bg) canvas.setCell(x, py, ' ', null, lerp(c.bg, '#584030', s))
    }
  }

  const mx = Math.floor(w * 0.70), my = Math.floor(h * 0.10)
  for (let dy = -9; dy <= 9; dy++) {
    for (let dx = -18; dx <= 18; dx++) {
      const px = mx + dx, py = my + dy
      if (px < 5 || px >= w - 5 || py < 4 || py >= h - 4) continue
      const nd = dx / 2, dist = Math.sqrt(nd * nd + dy * dy)
      if (dist > 9) continue
      const glow = Math.pow(Math.max(0, 1 - dist / 9), 2) * 0.10
      if (glow > 0.003) {
        const c = canvas.getCell(px, py)
        if (c && c.bg) canvas.setCell(px, py, ' ', null, lerp(c.bg, '#8898b8', glow))
      }
      if (dist <= 3.8) {
        const sh = Math.sqrt((nd - 1.6) * (nd - 1.6) + dy * dy)
        if (sh >= 3.8 * 0.72) canvas.setCell(px, py, ' ', null, lerp('#7888a8', '#b8c0d8', 1 - dist / 3.8))
      }
    }
  }

  for (const s of state.stars) {
    const bri = s.b * (Math.sin(t * s.sp + s.ph) * 0.3 + 0.7)
    if (bri < 0.08) continue
    const v = Math.min(255, Math.floor(50 + bri * 205))
    canvas.setCell(s.x, s.y, bri > 0.55 ? '·' : '.', '#' + hex2(v) + hex2(v) + hex2(Math.floor(v * 0.88)))
  }

  const drift = [
    Math.sin(t * 0.030) * 0.6,
    Math.sin(t * 0.040 + 0.5) * 1.6,
    Math.sin(t * 0.050 + 1.0) * 3.0,
    Math.sin(t * 0.060 + 1.5) * 5.0,
    Math.sin(t * 0.050 + 2.0) * 2.0,
  ]
  const bases = [h * 0.36, h * 0.46, h * 0.57, h * 0.69, h * 0.83]

  layerFill(canvas, w, h, LCOL[0], x => {
    const sx = x - drift[0]
    return bases[0] + Math.sin(sx * 0.007 + 0.5) * 9 + Math.sin(sx * 0.02 + 1.7) * 4 + Math.sin(sx * 0.04 + 3.2) * 2
  })

  for (let li = 1; li <= 3; li++) {
    const tr = state.trees[li], base = bases[li], d = drift[li]
    layerFill(canvas, w, h, LCOL[li], x => {
      const sx = x - d
      let y0 = base
        + Math.sin(sx * (0.009 + li * 0.002) + li * 1.1) * (7 - li)
        + Math.sin(sx * (0.022 + li * 0.003) + li * 2.3) * (3 - li * 0.5)
      for (const tree of tr) {
        const dist = Math.abs(sx - tree.cx)
        if (dist < tree.tw) {
          const top = base - tree.th * (1 - dist / tree.tw)
          if (top < y0) y0 = top
        }
      }
      return y0
    })
  }

  layerFill(canvas, w, h, LCOL[4], x => {
    const sx = x - drift[4]
    const ix = ((Math.floor(sx) % w) + w) % w
    return bases[4] + (state.grass[ix] || 0) + Math.sin(sx * 0.01 + t * 0.08) * 1
  })

  for (const m of state.motes) {
    const px = Math.floor(m.bx * w + Math.sin(t * 0.07 + m.ph) * m.ax)
    const py = Math.floor(m.by * h + Math.sin(t * 0.10 + m.ph + 1.5) * m.ay)
    if (px < 5 || px >= w - 5 || py < 4 || py >= h - 4) continue
    const pulse = Math.sin(t * m.sp + m.ph) * 0.4 + 0.6
    if (pulse < 0.15) continue
    const v = Math.min(255, Math.floor(pulse * 220))
    canvas.setCell(px, py, pulse > 0.6 ? '✦' : '·',
      '#' + hex2(v) + hex2(Math.floor(v * 0.82)) + hex2(Math.floor(v * 0.45)))
  }

  const fc = '#1a2238', bc = '#2c3450'
  for (let y = 0; y < 3; y++) for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, fc)
  for (let y = h - 3; y < h; y++) for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, fc)
  for (let y = 3; y < h - 3; y++) {
    for (let i = 0; i < 4; i++) canvas.setCell(i, y, ' ', null, fc)
    for (let i = w - 4; i < w; i++) canvas.setCell(i, y, ' ', null, fc)
  }
  for (let x = 4; x < w - 4; x++) {
    canvas.setCell(x, 2, '─', bc, fc)
    canvas.setCell(x, h - 3, '─', bc, fc)
  }
  for (let y = 3; y < h - 3; y++) {
    canvas.setCell(3, y, '│', bc, fc)
    canvas.setCell(w - 4, y, '│', bc, fc)
  }
  canvas.setCell(3, 2, '╭', bc, fc)
  canvas.setCell(w - 4, 2, '╮', bc, fc)
  canvas.setCell(3, h - 3, '╰', bc, fc)
  canvas.setCell(w - 4, h - 3, '╯', bc, fc)
}

function layerFill(canvas, w, h, color, fn) {
  for (let x = 0; x < w; x++) {
    const y0 = Math.floor(fn(x))
    for (let y = Math.max(0, y0); y < h; y++) canvas.setCell(x, y, ' ', null, color)
  }
}
