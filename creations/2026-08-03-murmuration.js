import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Murmuration'
export const description = 'A thousand wings turn as one through the last light of day'
export const fps = 3

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SKY = [
  '#080c24', '#0c1030', '#10163a', '#181e46',
  '#202652', '#28305c', '#323a68', '#3c4474',
  '#464e7e', '#525a88', '#606892', '#70769c',
  '#8282a2', '#9490a4', '#a89ea4', '#bcaea4',
  '#cec0a8', '#dcd0b0', '#e8dcba', '#f0e6c6',
]

const LAND = '#060610'

const TWO_PI = Math.PI * 2

export function setup(canvas) {
  const rng = srand(803)
  const w = canvas.width
  const h = canvas.height

  const birds = []
  const N = 700
  const clusters = [
    { cx: 0, cy: 0, rx: 0.8, ry: 0.5, n: 0.42 },
    { cx: 0.50, cy: -0.10, rx: 0.45, ry: 0.25, n: 0.20 },
    { cx: -0.35, cy: 0.20, rx: 0.50, ry: 0.20, n: 0.15 },
    { cx: 0.10, cy: -0.35, rx: 0.25, ry: 0.40, n: 0.13 },
    { cx: -0.55, cy: -0.10, rx: 0.30, ry: 0.15, n: 0.10 },
  ]

  for (let i = 0; i < N; i++) {
    let pick = rng()
    let cl = clusters[0]
    for (const c of clusters) { pick -= c.n; if (pick <= 0) { cl = c; break } }
    const a = rng() * TWO_PI
    const r = Math.pow(rng(), 0.55)
    birds.push({
      lx: cl.cx + r * Math.cos(a) * cl.rx,
      ly: cl.cy + r * Math.sin(a) * cl.ry,
      jf: 0.4 + rng() * 1.8,
      jp: rng() * TWO_PI,
      jax: 0.003 + rng() * 0.008,
      jay: 0.002 + rng() * 0.006,
    })
  }

  const land = new Array(w)
  for (let x = 0; x < w; x++) {
    land[x] = Math.floor(h * 0.86
      + Math.sin(x * 0.012 + 0.5) * 5
      + Math.sin(x * 0.028 + 1.8) * 3
      + Math.sin(x * 0.005) * 7
      + Math.sin(x * 0.06 + 2.5) * 1.5)
  }

  const trees = []
  for (let i = 0; i < 30; i++) {
    trees.push({
      x: Math.floor(rng() * w),
      h: 3 + Math.floor(rng() * 6),
      w: 1 + Math.floor(rng() * 3),
    })
  }

  const stars = []
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * h * 0.28),
      b: 0.1 + rng() * 0.9,
      ph: rng() * TWO_PI,
      sp: 0.2 + rng() * 0.8,
    })
  }

  return { birds, land, trees, stars }
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height

  for (let y = 0; y < h; y++) {
    const c = lerpMulti(SKY, Math.min(1, y / h))
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, c)
  }

  const g0 = Math.floor(h * 0.64)
  const g1 = Math.floor(h * 0.88)
  for (let y = g0; y < g1; y++) {
    const s = Math.sin((y - g0) / (g1 - g0) * Math.PI) * 0.12
    for (let x = 0; x < w; x++) {
      const cell = canvas.getCell(x, y)
      if (cell && cell.bg) canvas.setCell(x, y, ' ', null, lerp(cell.bg, '#e0c080', s))
    }
  }

  const cb = Math.floor(h * 0.72)
  for (let y = cb; y < cb + 4 && y < h; y++) {
    const ct = (y - cb) / 4
    for (let x = 0; x < w; x++) {
      const n = Math.sin(x * 0.05 + y * 0.2 + t * 0.008)
        * Math.sin(x * 0.12 + y * 0.1 + 2) * 0.5 + 0.5
      if (n > 0.55) {
        const cell = canvas.getCell(x, y)
        if (cell && cell.bg) {
          const a = (n - 0.55) * 2 * Math.sin(ct * Math.PI) * 0.10
          canvas.setCell(x, y, ' ', null, lerp(cell.bg, '#d0c0a0', a))
        }
      }
    }
  }

  for (const s of state.stars) {
    const b = s.b * (Math.sin(t * s.sp + s.ph) * 0.35 + 0.65)
    if (b < 0.15 || s.x < 4 || s.x >= w - 4 || s.y < 3) continue
    canvas.setCell(s.x, s.y, b > 0.5 ? '·' : '.', lerp('#080c24', '#a0a0b8', b * 0.45), null)
  }

  for (let x = 0; x < w; x++) {
    const ly = state.land[x]
    for (let y = Math.max(0, ly); y < h; y++) canvas.setCell(x, y, ' ', null, LAND)
    if (ly >= 0 && ly < h) canvas.setCell(x, ly, BLOCK.upper, '#0a0a18', null)
  }

  for (const tr of state.trees) {
    const tx = Math.max(0, Math.min(tr.x, w - 1))
    const base = state.land[tx]
    for (let dy = 0; dy < tr.h; dy++) {
      const y = base - dy - 1
      if (y < 0 || y >= h) continue
      const tw = Math.floor((1 - dy / tr.h) * tr.w + 0.5)
      for (let dx = -tw; dx <= tw; dx++) {
        const px = tr.x + dx
        if (px >= 0 && px < w) canvas.setCell(px, y, BLOCK.full, LAND, null)
      }
    }
  }

  const fcx = 0.50 + Math.sin(t * 0.025) * 0.14 + Math.sin(t * 0.018 + 1.2) * 0.07
  const fcy = 0.35 + Math.sin(t * 0.035 + 0.5) * 0.07 + Math.sin(t * 0.012 + 2.4) * 0.04

  const rot = t * 0.04 + Math.sin(t * 0.03) * 0.3
  const strX = 1.0 + Math.sin(t * 0.05) * 0.25
  const strY = 1.0 - Math.sin(t * 0.05) * 0.12
  const bend = Math.sin(t * 0.03) * 0.35
  const shear = Math.sin(t * 0.025 + 1) * 0.25
  const cosR = Math.cos(rot)
  const sinR = Math.sin(rot)
  const ripDir = t * 0.12
  const ripCos = Math.cos(ripDir + 1.57)
  const ripSin = Math.sin(ripDir + 1.57)
  const ripDirCos = Math.cos(ripDir)
  const ripDirSin = Math.sin(ripDir)
  const scale = 0.19

  const density = new Map()
  for (const bird of state.birds) {
    let lx = bird.lx * strX
    let ly = bird.ly * strY
    ly += lx * lx * bend
    lx += ly * shear
    const rT = lx * ripDirCos + ly * ripDirSin
    const rip = Math.sin(rT * 6 + t * 0.6) * 0.022
    lx += rip * ripCos
    ly += rip * ripSin
    const rx = lx * cosR - ly * sinR
    const ry = lx * sinR + ly * cosR
    const wx = fcx + rx * scale * 1.6 + Math.sin(t * bird.jf + bird.jp) * bird.jax
    const wy = fcy + ry * scale + Math.cos(t * bird.jf * 0.8 + bird.jp) * bird.jay
    const px = Math.round(wx * w)
    const py = Math.round(wy * h)
    if (px < 4 || px >= w - 4 || py < 3 || py >= h - 3) continue
    if (py >= state.land[Math.max(0, Math.min(px, w - 1))]) continue
    const key = py * w + px
    density.set(key, (density.get(key) || 0) + 1)
  }

  for (const [key, count] of density) {
    const py = Math.floor(key / w)
    const px = key % w
    const skyT = py / h
    const col = skyT > 0.45 ? '#060610' : skyT > 0.25 ? '#0c0c18' : '#141420'
    let ch
    if (count >= 5) ch = BLOCK.full
    else if (count >= 3) ch = SHADE[3]
    else if (count >= 2) ch = SHADE[2]
    else ch = SHADE[1]
    if (count >= 3) {
      const cell = canvas.getCell(px, py)
      canvas.setCell(px, py, ch, col,
        cell && cell.bg ? lerp(cell.bg, '#040408', 0.12) : null)
    } else {
      canvas.setCell(px, py, ch, col, null)
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
