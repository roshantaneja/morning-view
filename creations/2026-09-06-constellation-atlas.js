import { hex, bgHex, DIM } from '../src/theme.js'

export const title = 'Constellation Atlas'
export const description = 'The old cartographers drew what they saw — we still look up and find the same geometry'
export const fps = 2

const TAU = Math.PI * 2
const ASPECT = 2.0

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
}
function colRgb(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const STAR_CHARS = ['·', '•', '✦', '★']

const NEBULAE = [
  { cx: 0.25, cy: -0.25, r: 0.18, rgb: [20, 8, 30] },
  { cx: -0.30, cy: 0.15, r: 0.14, rgb: [8, 18, 30] },
  { cx: 0.05, cy: 0.45, r: 0.12, rgb: [25, 15, 5] },
]

const DEFS = [
  {
    name: 'ORION',
    cx: 0.02, cy: 0.30, scale: 0.20,
    stars: [
      [-0.30, -1.00, 3], [0.35, -0.85, 2],
      [-0.12, -0.15, 2], [0.04, -0.15, 2], [0.20, -0.15, 2],
      [-0.35, 0.60, 3],  [0.30, 0.65, 2],
    ],
    lines: [[0,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]],
  },
  {
    name: 'URSA MAJOR',
    cx: -0.35, cy: -0.35, scale: 0.18,
    stars: [
      [-1.00, 0.35, 2], [-0.55, 0.15, 2], [-0.15, -0.05, 2],
      [0.15, -0.30, 2], [0.55, -0.10, 2], [0.40, 0.40, 2],
      [0.00, 0.50, 2],
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]],
  },
  {
    name: 'CASSIOPEIA',
    cx: 0.40, cy: -0.40, scale: 0.13,
    stars: [
      [-1.00, 0.30, 2], [-0.45, -0.50, 2], [0.00, 0.20, 3],
      [0.45, -0.40, 2], [1.00, 0.30, 2],
    ],
    lines: [[0,1],[1,2],[2,3],[3,4]],
  },
  {
    name: 'CYGNUS',
    cx: 0.42, cy: 0.05, scale: 0.15,
    stars: [
      [0.00, -1.00, 3], [0.00, -0.20, 2],
      [-0.70, 0.00, 1], [0.70, 0.00, 1], [0.00, 0.80, 2],
    ],
    lines: [[0,1],[1,4],[2,1],[1,3]],
  },
  {
    name: 'SCORPIUS',
    cx: -0.42, cy: 0.18, scale: 0.16,
    stars: [
      [-0.20, -1.00, 3], [-0.35, -0.40, 1], [-0.25, 0.00, 1],
      [0.00, 0.40, 1], [0.30, 0.65, 1], [0.60, 0.75, 2],
      [0.75, 0.45, 1],
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]],
  },
  {
    name: 'LYRA',
    cx: 0.32, cy: 0.48, scale: 0.09,
    stars: [
      [0.00, -1.00, 3], [-0.60, 0.20, 1], [0.60, 0.20, 1],
      [-0.45, 1.00, 1], [0.45, 1.00, 1],
    ],
    lines: [[0,1],[0,2],[1,3],[2,4],[3,4]],
  },
  {
    name: 'GEMINI',
    cx: -0.05, cy: -0.55, scale: 0.12,
    stars: [
      [-0.50, -0.80, 3], [0.50, -0.70, 3],
      [-0.35, -0.10, 1], [0.30, 0.00, 1],
      [-0.20, 0.50, 1],  [0.15, 0.60, 1],
    ],
    lines: [[0,2],[2,4],[1,3],[3,5]],
  },
]

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(906)
  const cx = Math.floor(W / 2)
  const cy = Math.floor(H / 2)
  const radius = Math.min(
    Math.floor((W - 14) / (2 * ASPECT)),
    Math.floor((H - 14) / 2)
  )
  const xr = radius * ASPECT

  const bgGrid = []
  for (let y = 0; y < H; y++) {
    bgGrid[y] = []
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / xr
      const dy = (y - cy) / radius
      const d = Math.sqrt(dx * dx + dy * dy)
      let r, g, b
      if (d > 1.02) { r = 3; g = 4; b = 10 }
      else if (d > 0.92) { r = 5; g = 8; b = 20 }
      else if (d > 0.6) { r = 8; g = 14; b = 28 }
      else { r = 12; g = 18; b = 34 }
      for (const neb of NEBULAE) {
        const ndx = dx - neb.cx, ndy = dy - neb.cy
        const nd = Math.sqrt(ndx * ndx + ndy * ndy)
        if (nd < neb.r) {
          const f = (1 - nd / neb.r) * 0.6
          r += neb.rgb[0] * f
          g += neb.rgb[1] * f
          b += neb.rgb[2] * f
        }
      }
      bgGrid[y][x] = colRgb(r, g, b)
    }
  }

  const bgStars = []
  for (let i = 0; i < 300; i++) {
    const a = rng() * TAU
    const r = Math.sqrt(rng()) * radius * 0.93
    const sx = Math.round(cx + r * Math.cos(a) * ASPECT)
    const sy = Math.round(cy + r * Math.sin(a))
    if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
      bgStars.push({ x: sx, y: sy, b: 0.15 + rng() * 0.85, ph: rng() * TAU, sp: 0.3 + rng() * 2.5 })
    }
  }

  const constellations = DEFS.map(def => {
    const stars = def.stars.map(([nx, ny, mag]) => ({
      x: Math.round(cx + (def.cx + nx * def.scale) * xr),
      y: Math.round(cy + (def.cy + ny * def.scale) * radius),
      mag, ph: rng() * TAU,
    }))
    const avgX = Math.round(stars.reduce((s, st) => s + st.x, 0) / stars.length)
    const maxY = Math.max(...stars.map(st => st.y))
    return { name: def.name, stars, lines: def.lines, lx: avgX - Math.floor(def.name.length / 2), ly: maxY + 2 }
  })

  const borderMap = new Map()
  for (let a = 0; a < 360; a++) {
    const rad = a * Math.PI / 180
    const bx = Math.round(cx + radius * Math.cos(rad) * ASPECT)
    const by = Math.round(cy + radius * Math.sin(rad))
    if (bx < 0 || bx >= W || by < 0 || by >= H) continue
    const key = by * W + bx
    let pri = 0
    if (a % 90 === 0) pri = 2
    else if (a % 15 === 0) pri = 1
    const prev = borderMap.get(key)
    if (!prev || pri > prev.pri) borderMap.set(key, { x: bx, y: by, pri })
  }
  const border = [...borderMap.values()]

  const innerRing = []
  const seenI = new Set()
  for (let a = 0; a < 360; a += 2) {
    const rad = a * Math.PI / 180
    const ix = Math.round(cx + radius * 0.55 * Math.cos(rad) * ASPECT)
    const iy = Math.round(cy + radius * 0.55 * Math.sin(rad))
    const key = iy * W + ix
    if (ix >= 0 && ix < W && iy >= 0 && iy < H && !seenI.has(key)) {
      seenI.add(key)
      innerRing.push({ x: ix, y: iy })
    }
  }

  return { cx, cy, radius, xr, bgGrid, bgStars, constellations, border, innerRing, W, H }
}

function draw(canvas, state, t) {
  const { cx, cy, radius, xr, bgGrid, bgStars, constellations, border, innerRing, W, H } = state

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bgHex(bgGrid[y][x]))
    }
  }

  for (const p of innerRing) canvas.setCell(p.x, p.y, '·', hex('#10182a'))

  for (let i = -radius + 2; i <= radius - 2; i++) {
    const hx = Math.round(cx + i * ASPECT)
    if (hx >= 0 && hx < W && i % 3 === 0) canvas.setCell(hx, cy, '·', hex('#0a1018'))
    const vy = cy + i
    if (vy >= 0 && vy < H && i % 2 === 0) canvas.setCell(cx, vy, '·', hex('#0a1018'))
  }

  for (const p of border) {
    if (p.pri === 2) canvas.setCell(p.x, p.y, '◦', hex('#5a5238'))
    else if (p.pri === 1) canvas.setCell(p.x, p.y, '·', hex('#3a3830'))
    else canvas.setCell(p.x, p.y, '·', hex('#1a2038'))
  }

  canvas.drawText(cx - 1, cy - radius - 2, ' N ', hex('#6a5a3a'))
  canvas.drawText(cx - 1, cy + radius + 2, ' S ', hex('#6a5a3a'))
  const ePos = Math.round(cx + xr) + 2
  if (ePos < W) canvas.drawText(ePos, cy, 'E', hex('#6a5a3a'))
  const wPos = Math.round(cx - xr) - 2
  if (wPos >= 0) canvas.drawText(wPos, cy, 'W', hex('#6a5a3a'))

  for (const s of bgStars) {
    const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))
    const v = Math.floor(28 + s.b * tw * 68)
    canvas.setCell(s.x, s.y, '·', hex(colRgb(v, v, v + 5)))
  }

  for (const c of constellations) {
    for (const [i, j] of c.lines) {
      canvas.drawLine(c.stars[i].x, c.stars[i].y, c.stars[j].x, c.stars[j].y, '·', hex('#283048'))
    }
  }

  for (const c of constellations) {
    for (const st of c.stars) {
      const tw = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + st.ph))
      const ch = STAR_CHARS[st.mag]
      let sc
      if (st.mag === 3) { const v = Math.floor(195 + 60 * tw); sc = colRgb(v, v - 5, v - 35) }
      else if (st.mag === 2) { const v = Math.floor(135 + 70 * tw); sc = colRgb(v, v, v + 8) }
      else { const v = Math.floor(85 + 55 * tw); sc = colRgb(v, v, v + 4) }
      canvas.setCell(st.x, st.y, ch, hex(sc))
      if (st.mag >= 3) {
        const gv = Math.floor(20 + 14 * tw)
        const gc = hex(colRgb(gv, gv, gv + 3))
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const gx = st.x + dx, gy = st.y + dy
          if (gx >= 0 && gx < W && gy >= 0 && gy < H) {
            const cell = canvas.getCell(gx, gy)
            if (cell && (cell.char === ' ' || cell.char === '·')) canvas.setCell(gx, gy, '·', gc)
          }
        }
      }
    }
    if (c.ly >= 0 && c.ly < H && c.lx >= 0 && c.lx + c.name.length < W) {
      canvas.drawText(c.lx, c.ly, c.name, hex('#7a6a42') + DIM)
    }
  }

  const heading = '✦  ATLAS  CŒLESTIS  ✦'
  canvas.drawText(canvas.centerX(heading), 2, heading, hex('#5a4a30') + DIM)
  const sub = 'SEPTEMBER · MMXXVI'
  canvas.drawText(canvas.centerX(sub), 4, sub, hex('#3a3228') + DIM)
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
