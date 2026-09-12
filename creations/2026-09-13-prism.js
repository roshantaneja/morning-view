import { hex, bgHex, lerp } from '../src/theme.js'

export const title = 'Prism'
export const description = 'A beam of white finds the heart of crystal and remembers every color it has ever been'
export const fps = 2

const TAU = Math.PI * 2
const BEAM_HW = 3.5
const BAND_HW = 2.0
const BAND_SPREAD = 0.055
const FAN_WIDTH = 1.2

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const BANDS = [
  [220, 30, 50],
  [245, 110, 20],
  [245, 205, 30],
  [50, 205, 60],
  [30, 125, 235],
  [70, 40, 185],
  [145, 30, 195],
]

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(913)

  const pcx = Math.floor(W / 2)
  const topY = Math.floor(H * 0.22)
  const botY = Math.floor(H * 0.40)
  const halfBase = Math.floor((botY - topY) * 0.82)

  const prismTL = { x: pcx - halfBase, y: topY }
  const prismTR = { x: pcx + halfBase, y: topY }
  const prismBot = { x: pcx, y: botY }
  const rainOrigin = { x: pcx, y: botY }

  const downAngle = Math.PI / 2
  const bandAngles = BANDS.map((_, i) =>
    downAngle + (i / (BANDS.length - 1) - 0.5) * FAN_WIDTH
  )

  const bgMap = []
  for (let y = 0; y < H; y++) {
    const row = []
    for (let x = 0; x < W; x++) {
      const vx = (x / W - 0.5) * 2
      const vy = (y / H - 0.38) * 2
      const vig = Math.sqrt(vx * vx + vy * vy)
      const v = Math.max(1, Math.floor(5 - vig * 2.5))
      row.push(col(v, v, v + 1))
    }
    bgMap.push(row)
  }

  const dust = Array.from({ length: 80 }, () => ({
    x: Math.floor(rng() * W),
    y: Math.floor(rng() * H),
    ph: rng() * TAU,
    br: 0.15 + rng() * 0.85,
    sp: 0.2 + rng() * 0.5,
  }))

  const caustics = Array.from({ length: 30 }, () => ({
    x: Math.floor(W * 0.15 + rng() * W * 0.7),
    y: Math.floor(H * 0.82 + rng() * H * 0.15),
    ph: rng() * TAU,
    sp: 0.4 + rng() * 0.8,
  }))

  return { W, H, prismTL, prismTR, prismBot, pcx, topY, botY, halfBase, rainOrigin, bandAngles, bgMap, dust, caustics }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }
export function update(canvas, data, frame, state) { drawScene(canvas, state, frame.elapsed) }

function inTri(px, py, a, b, c) {
  const d1 = (px - b.x) * (a.y - b.y) - (a.x - b.x) * (py - b.y)
  const d2 = (px - c.x) * (b.y - c.y) - (b.x - c.x) * (py - c.y)
  const d3 = (px - a.x) * (c.y - a.y) - (c.x - a.x) * (py - a.y)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

function dSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2))
  return Math.sqrt((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2)
}

function drawScene(canvas, state, t) {
  const { W, H, prismTL, prismTR, prismBot, pcx, topY, botY, halfBase, rainOrigin, bandAngles, bgMap, dust, caustics } = state

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      canvas.setCell(x, y, ' ', null, bgHex(bgMap[y][x]))

  for (let y = 0; y < topY; y++) {
    for (let dx = -15; dx <= 15; dx++) {
      const x = pcx + dx
      if (x < 0 || x >= W) continue
      const d = Math.abs(dx)
      if (d <= BEAM_HW || d > 15) continue
      const glow = Math.pow(1 - (d - BEAM_HW) / (15 - BEAM_HW), 2.5) * 0.035
      const p = 0.92 + 0.08 * Math.sin(t * 0.4)
      if (glow * p > 0.002)
        canvas.setCell(x, y, ' ', null, bgHex(lerp(bgMap[y][x], '#ffffff', glow * p)))
    }
  }

  for (let y = 0; y <= topY; y++) {
    for (let dx = Math.ceil(-BEAM_HW * 1.5); dx <= Math.ceil(BEAM_HW * 1.5); dx++) {
      const x = pcx + dx
      if (x < 0 || x >= W) continue
      const fade = Math.max(0, 1 - Math.abs(dx) / BEAM_HW)
      const pulse = 0.88 + 0.12 * Math.sin(t * 0.5 + y * 0.02)
      const b = fade * fade * pulse
      if (b > 0.04) {
        const v = Math.min(255, Math.floor(b * 245))
        const bv = Math.min(255, Math.floor(b * 50))
        const ch = b > 0.55 ? '█' : b > 0.3 ? '▓' : b > 0.12 ? '▒' : '░'
        canvas.setCell(x, y, ch, hex(col(v, v, v)), bgHex(col(bv, bv, bv + 2)))
      }
    }
  }

  const maxDist = H - botY
  const minA = bandAngles[0] - 0.2
  const maxA = bandAngles[BANDS.length - 1] + 0.2

  for (let y = Math.max(0, botY - 1); y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - rainOrigin.x
      const dy = y - rainOrigin.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1) continue

      const angle = Math.atan2(dy, dx)
      if (angle < minA || angle > maxA) continue

      let tR = 0, tG = 0, tB = 0, tA = 0

      for (let bi = 0; bi < BANDS.length; bi++) {
        let diff = angle - bandAngles[bi]
        if (diff > Math.PI) diff -= TAU
        if (diff < -Math.PI) diff += TAU

        const perp = Math.abs(diff) * dist
        const width = BAND_HW + dist * BAND_SPREAD

        if (perp < width) {
          const ef = 1 - perp / width
          const df = 1 - Math.pow(dist / maxDist, 2.5)
          const pulse = 0.92 + 0.08 * Math.sin(t * 0.35 + bi * 0.7)
          const bright = ef * ef * Math.max(0, df) * pulse

          tR += BANDS[bi][0] * bright
          tG += BANDS[bi][1] * bright
          tB += BANDS[bi][2] * bright
          tA += bright
        }
      }

      if (tA > 0.04) {
        const mc = Math.max(tR, tG, tB, 1)
        const sc = mc > 255 ? 255 / mc : 1
        const r = Math.floor(tR * sc)
        const g = Math.floor(tG * sc)
        const b = Math.floor(tB * sc)
        const dens = Math.min(1, tA * 0.65)
        const bgr = Math.max(1, Math.floor(r * 0.1))
        const bgg = Math.max(1, Math.floor(g * 0.1))
        const bgb = Math.max(1, Math.floor(b * 0.1))
        const ch = dens > 0.5 ? '█' : dens > 0.3 ? '▓' : dens > 0.13 ? '▒' : '░'
        canvas.setCell(x, y, ch, hex(col(r, g, b)), bgHex(col(bgr, bgg, bgb)))
      }
    }
  }

  for (let y = topY; y <= botY; y++) {
    for (let x = Math.floor(prismTL.x) - 1; x <= Math.floor(prismTR.x) + 1; x++) {
      if (x < 0 || x >= W) continue
      if (!inTri(x, y, prismTL, prismTR, prismBot)) continue

      const fy = (y - topY) / Math.max(1, botY - topY)
      const fx = halfBase > 0 ? (x - pcx) / halfBase : 0

      const ed = Math.min(
        dSeg(x, y, prismTL.x, prismTL.y, prismTR.x, prismTR.y),
        dSeg(x, y, prismTL.x, prismTL.y, prismBot.x, prismBot.y),
        dSeg(x, y, prismTR.x, prismTR.y, prismBot.x, prismBot.y)
      )

      if (ed < 1.0) {
        const eb = (1 - ed) * 0.6 + 0.4
        const ev = Math.floor(80 + eb * 80)
        canvas.setCell(x, y, '░', hex(col(ev, ev + 5, ev + 18)), bgHex(col(30, 35, 50)))
      } else {
        const rt = Math.max(0, Math.min(1, (fx + 1) / 2))
        const ri = Math.min(BANDS.length - 2, Math.floor(rt * (BANDS.length - 1)))
        const rf = rt * (BANDS.length - 1) - ri
        const cr = BANDS[ri][0] * (1 - rf) + BANDS[ri + 1][0] * rf
        const cg = BANDS[ri][1] * (1 - rf) + BANDS[ri + 1][1] * rf
        const cb = BANDS[ri][2] * (1 - rf) + BANDS[ri + 1][2] * rf

        const shimmer = 0.85 + 0.15 * Math.sin(x * 0.3 + y * 0.2 + t * 0.7)
        const base = 30 + (1 - fy) * 35
        const tint = (0.18 + fy * 0.15) * shimmer

        const r = Math.min(255, Math.floor(base + cr * tint))
        const g = Math.min(255, Math.floor(base + 4 + cg * tint))
        const b = Math.min(255, Math.floor(base + 14 + cb * tint))

        canvas.setCell(x, y, '▒',
          hex(col(Math.min(255, r + 20), Math.min(255, g + 20), Math.min(255, b + 20))),
          bgHex(col(r, g, b)))
      }
    }
  }

  for (let dy = 0; dy < 3; dy++) {
    const py = topY + dy
    if (py > botY) break
    for (let dx = -3; dx <= 3; dx++) {
      const px = pcx + dx
      if (px < prismTL.x || px > prismTR.x || px < 0 || px >= W) continue
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 4) continue
      const br = Math.max(0, 1 - d / 4) * (0.8 + 0.2 * Math.sin(t * 0.6))
      if (br > 0.1) {
        const v = Math.min(255, Math.floor(60 + br * 150))
        canvas.setCell(px, py, '▓',
          hex(col(v, v, v)),
          bgHex(col(Math.floor(v * 0.4), Math.floor(v * 0.4), Math.floor(v * 0.45))))
      }
    }
  }

  for (const d of dust) {
    const pulse = d.br * (0.3 + 0.7 * Math.sin(t * d.sp + d.ph))
    if (pulse < 0.25) continue
    if (d.x < 0 || d.x >= W || d.y < 0 || d.y >= H) continue

    let lit = false
    if (d.y < topY && Math.abs(d.x - pcx) < BEAM_HW * 2) lit = true
    if (!lit && d.y > botY) {
      const rdx = d.x - rainOrigin.x
      const rdy = d.y - rainOrigin.y
      const rd = Math.sqrt(rdx * rdx + rdy * rdy)
      if (rd > 2) {
        const ra = Math.atan2(rdy, rdx)
        if (ra >= minA && ra <= maxA) lit = true
      }
    }

    if (lit) {
      const v = Math.min(255, Math.floor(pulse * 170))
      canvas.setCell(d.x, d.y, '·', hex(col(v, v, Math.min(255, v + 12))))
    }
  }

  for (let i = 0; i < caustics.length; i++) {
    const c = caustics[i]
    if (c.x < 0 || c.x >= W || c.y < 0 || c.y >= H) continue
    const pulse = Math.sin(t * c.sp + c.ph)
    if (pulse < 0.3) continue

    const cdx = c.x - rainOrigin.x
    const cdy = c.y - rainOrigin.y
    const ca = Math.atan2(cdy, cdx)
    let bi = 0, md = Infinity
    for (let j = 0; j < bandAngles.length; j++) {
      const diff = Math.abs(ca - bandAngles[j])
      if (diff < md) { md = diff; bi = j }
    }

    const bright = (pulse - 0.3) / 0.7
    const [cr, cg, cb] = BANDS[bi]
    canvas.setCell(c.x, c.y, '✦', hex(col(
      Math.min(255, Math.floor(cr * bright * 0.6 + 100)),
      Math.min(255, Math.floor(cg * bright * 0.6 + 100)),
      Math.min(255, Math.floor(cb * bright * 0.6 + 100))
    )))
  }

  const edges = [[prismTL, prismTR], [prismTL, prismBot], [prismTR, prismBot]]
  for (let i = 0; i < 7; i++) {
    const tt = t * 1.3 + i * 2.5
    if (Math.sin(tt * 1.6) < 0.35) continue
    const frac = Math.sin(tt * 0.55 + i * 1.3) * 0.35 + 0.5
    const [ea, eb] = edges[i % 3]
    const sx = Math.floor(ea.x + (eb.x - ea.x) * frac)
    const sy = Math.floor(ea.y + (eb.y - ea.y) * frac)
    if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
      const ci = (i * 2) % BANDS.length
      canvas.setCell(sx, sy, '✧', hex(col(
        Math.min(255, BANDS[ci][0] + 55),
        Math.min(255, BANDS[ci][1] + 55),
        Math.min(255, BANDS[ci][2] + 55)
      )))
    }
  }
}
