import { lerp, lerpMulti, SHADE } from '../src/theme.js'

export const title = 'Tide Pool'
export const description = 'Between the rocks, a small world — anemone fingers sway in the current, a starfish rests on the sand, and caustic light plays across everything'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function hex2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

export function setup(canvas) {
  const rng = srand(815)
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h * 0.46)
  const rx = Math.floor(w * 0.39)
  const ry = Math.floor(h * 0.37)

  const edgeH = []
  for (let i = 0; i < 10; i++) {
    edgeH.push({
      freq: 2 + i * 0.8 + rng() * 0.4,
      amp: 0.065 / (1 + i * 0.35),
      phase: rng() * Math.PI * 2,
    })
  }

  const anemones = [
    { x: cx - Math.floor(rx * 0.30), y: cy + Math.floor(ry * 0.18), n: 20, r: 7, pal: 0, ph: rng() * 6.28, sp: 0.35 + rng() * 0.4 },
    { x: cx + Math.floor(rx * 0.36), y: cy - Math.floor(ry * 0.15), n: 16, r: 6, pal: 1, ph: rng() * 6.28, sp: 0.30 + rng() * 0.5 },
    { x: cx + Math.floor(rx * 0.06), y: cy + Math.floor(ry * 0.50), n: 14, r: 5, pal: 0, ph: rng() * 6.28, sp: 0.40 + rng() * 0.4 },
    { x: cx - Math.floor(rx * 0.50), y: cy - Math.floor(ry * 0.28), n: 12, r: 4, pal: 1, ph: rng() * 6.28, sp: 0.35 + rng() * 0.5 },
  ]

  const starfish = {
    x: cx - Math.floor(rx * 0.10),
    y: cy - Math.floor(ry * 0.30),
    ang: 0.3 + rng() * 0.5,
  }

  const seaweed = []
  for (let i = 0; i < 9; i++) {
    const a = rng() * 6.28
    const d = 0.20 + rng() * 0.55
    seaweed.push({
      bx: cx + Math.cos(a) * rx * d,
      by: cy + Math.sin(a) * ry * d,
      ht: 4 + Math.floor(rng() * 8),
      ph: rng() * 6.28,
      sp: 0.4 + rng() * 0.6,
    })
  }

  const pebbles = []
  for (let i = 0; i < 55; i++) {
    const a = rng() * 6.28
    const d = rng() * 0.80
    pebbles.push({
      x: cx + Math.cos(a) * rx * d,
      y: cy + Math.sin(a) * ry * d,
      sh: rng(),
      ch: rng() > 0.6 ? '·' : rng() > 0.3 ? '•' : '°',
    })
  }

  const sparkles = []
  for (let i = 0; i < 90; i++) {
    const a = rng() * 6.28
    const d = rng() * 0.76
    sparkles.push({
      bx: Math.cos(a) * d,
      by: Math.sin(a) * d,
      ph: rng() * 6.28,
      sp: 0.3 + rng() * 0.8,
      bri: 0.3 + rng() * 0.7,
    })
  }

  return { cx, cy, rx, ry, edgeH, anemones, starfish, seaweed, pebbles, sparkles }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function poolBound(angle, edgeH) {
  let r = 1.0
  for (const h of edgeH) r += Math.sin(angle * h.freq + h.phase) * h.amp
  return r
}

function poolDepth(x, y, s) {
  const nx = (x - s.cx) / s.rx
  const ny = (y - s.cy) / s.ry
  const r = Math.sqrt(nx * nx + ny * ny)
  return poolBound(Math.atan2(ny, nx), s.edgeH) - r
}

const PINK = ['#881133', '#bb2244', '#dd3366', '#ee5588', '#ff77aa']
const ORANGE = ['#884400', '#bb5511', '#dd7722', '#ee8833', '#ffaa55']

function drawScene(canvas, s, t) {
  const w = canvas.width
  const h = canvas.height

  for (let y = 0; y < h; y++) {
    const ambT = y / h
    for (let x = 0; x < w; x++) {
      const d = poolDepth(x, y, s)
      if (d <= 0) {
        drawRock(canvas, x, y, d, ambT)
      } else {
        drawWater(canvas, x, y, d, t)
      }
    }
  }

  for (const p of s.pebbles) {
    const ix = Math.floor(p.x)
    const iy = Math.floor(p.y)
    if (ix < 4 || ix >= w - 4 || iy < 4 || iy >= h - 5) continue
    if (poolDepth(ix, iy, s) < 0.04) continue
    const v = Math.floor(80 + p.sh * 60)
    canvas.setCell(ix, iy, p.ch, '#' + hex2(v) + hex2(Math.floor(v * 0.9)) + hex2(Math.floor(v * 0.7)))
  }

  for (const sw of s.seaweed) {
    for (let i = 0; i < sw.ht; i++) {
      const sway = Math.sin(t * sw.sp + sw.ph + i * 0.55) * (0.8 + i * 0.35)
      const ix = Math.floor(sw.bx + sway)
      const iy = Math.floor(sw.by - i)
      if (ix < 4 || ix >= w - 4 || iy < 4 || iy >= h - 5) continue
      if (poolDepth(ix, iy, s) < 0) continue
      const gt = i / sw.ht
      const col = '#' + hex2(25 + gt * 30) + hex2(60 + gt * 55) + hex2(30 + gt * 20)
      const ch = i === sw.ht - 1 ? '◌' : sway > 0.3 ? '╱' : sway < -0.3 ? '╲' : '│'
      canvas.setCell(ix, iy, ch, col)
    }
  }

  const sf = s.starfish
  for (let arm = 0; arm < 5; arm++) {
    const aa = sf.ang + arm * 1.2566
    for (let r = 1; r <= 4; r++) {
      const px = Math.floor(sf.x + Math.cos(aa) * r * 1.3)
      const py = Math.floor(sf.y + Math.sin(aa) * r * 0.55)
      if (px < 4 || px >= w - 4 || py < 4 || py >= h - 5) continue
      if (poolDepth(px, py, s) < 0) continue
      canvas.setCell(px, py, r >= 4 ? '·' : '●', lerp('#dd9933', '#994411', r / 4))
    }
  }
  if (sf.x >= 4 && sf.x < w - 4 && sf.y >= 4 && sf.y < h - 5) {
    canvas.setCell(sf.x, sf.y, '●', '#eeaa44')
  }

  for (const a of s.anemones) {
    const pal = a.pal === 0 ? PINK : ORANGE
    for (let i = 0; i < a.n; i++) {
      const ba = (i / a.n) * 6.2832
      const wave = Math.sin(t * a.sp + a.ph + i * 0.65) * 0.4
      const ta = ba + wave
      for (let r = 1; r <= a.r; r++) {
        const px = Math.floor(a.x + Math.cos(ta) * r * 1.3)
        const py = Math.floor(a.y + Math.sin(ta) * r * 0.55)
        if (px < 4 || px >= w - 4 || py < 4 || py >= h - 5) continue
        if (poolDepth(px, py, s) < 0) continue
        canvas.setCell(px, py, r === a.r ? '·' : '•', lerpMulti(pal, r / a.r))
      }
    }
    if (a.x >= 4 && a.x < w - 4 && a.y >= 4 && a.y < h - 5) {
      canvas.setCell(a.x, a.y, '◉', pal[2])
    }
  }

  for (const sp of s.sparkles) {
    const sx = s.cx + sp.bx * s.rx + Math.sin(t * 0.5 + sp.ph) * 5
    const sy = s.cy + sp.by * s.ry + Math.cos(t * 0.4 + sp.ph + 1.5) * 3
    const ix = Math.floor(sx)
    const iy = Math.floor(sy)
    if (ix < 4 || ix >= w - 4 || iy < 4 || iy >= h - 5) continue
    if (poolDepth(ix, iy, s) < 0.06) continue
    const pulse = Math.sin(t * sp.sp + sp.ph) * 0.5 + 0.5
    const bri = sp.bri * pulse
    if (bri < 0.15) continue
    const cell = canvas.getCell(ix, iy)
    if (!cell || !cell.bg) continue
    const hl = lerp(cell.bg, '#88ddcc', bri * 0.3)
    canvas.setCell(ix, iy, bri > 0.55 ? '✦' : '·', lerp('#88ddcc', '#ccffee', bri), hl)
  }
}

function drawRock(canvas, x, y, depth, ambT) {
  const n1 = Math.sin(x * 0.21 + y * 0.17) * 0.5 + 0.5
  const n2 = Math.sin(x * 0.13 - y * 0.27 + 2.5) * 0.5 + 0.5
  const n3 = Math.sin(x * 0.07 + y * 0.37 + 4.8) * 0.5 + 0.5
  const rt = n1 * 0.4 + n2 * 0.35 + n3 * 0.25
  const amb = 0.85 + ambT * 0.15

  const br = Math.floor((30 + rt * 50) * amb)
  const bg = Math.floor((24 + rt * 44) * amb)
  const bb = Math.floor((20 + rt * 36) * amb)
  const bgCol = '#' + hex2(br) + hex2(bg) + hex2(bb)

  let ch = ' '
  let fg = bgCol
  if (depth > -0.12) {
    ch = n1 > 0.55 ? SHADE[2] : SHADE[1]
    fg = lerp(bgCol, '#6a5e50', 0.3)
  } else if (n1 * n2 > 0.55) {
    ch = SHADE[0]
    fg = lerp(bgCol, '#5a4e40', 0.15)
  }
  canvas.setCell(x, y, ch, fg, bgCol)
}

function drawWater(canvas, x, y, depth, t) {
  const dn = Math.min(1, depth * 2.2)
  const r = Math.floor(30 + (8 - 30) * dn)
  const g = Math.floor(112 + (30 - 112) * dn)
  const b = Math.floor(112 + (48 - 112) * dn)

  let ch = ' '
  let fg = null
  if (depth < 0.06) {
    const shimmer = Math.sin(x * 0.35 + y * 0.25 + t * 2) * 0.5 + 0.5
    if (shimmer > 0.72) {
      ch = '·'
      fg = '#90b8b0'
    }
  }

  canvas.setCell(x, y, ch, fg, '#' + hex2(r) + hex2(g) + hex2(b))
}
