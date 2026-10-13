import { hex, bgHex, SHADE } from '../src/theme.js'

export const title = 'Night Train'
export const description = 'Rain on the window, city lights sliding past — the quiet of being nowhere between two somewheres'
export const fps = 3

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + clamp(r).toString(16).padStart(2, '0')
             + clamp(g).toString(16).padStart(2, '0')
             + clamp(b).toString(16).padStart(2, '0')
}

const LIGHT_COLORS = [
  [255, 190, 90],
  [255, 170, 65],
  [255, 215, 135],
  [255, 145, 48],
  [238, 238, 205],
  [195, 212, 255],
  [255, 88, 115],
  [85, 185, 255],
  [125, 255, 148],
  [255, 115, 38],
]

function mkLight(rng, W, H) {
  const depth = 0.12 + rng() * 0.88
  return {
    x: rng() * W,
    y: H * 0.06 + rng() * H * 0.76,
    r: (1.5 + rng() * 4.5) * (0.7 + depth * 0.6),
    c: LIGHT_COLORS[Math.floor(rng() * LIGHT_COLORS.length)],
    br: 0.2 + rng() * 0.6,
    depth,
    fp: rng() * TAU,
    fr: 0.18 + rng() * 1.1,
  }
}

function mkDrop(rng, W, H, fromTop) {
  return {
    x: 2 + rng() * (W - 4),
    y: fromTop ? -1 - rng() * 5 : rng() * H,
    vy: 0.12 + rng() * 0.48,
    wp: rng() * TAU,
    wf: 0.018 + rng() * 0.035,
    wa: 0.1 + rng() * 0.35,
    big: rng() < 0.18,
  }
}

function mkStreak(rng, W, H) {
  return {
    x: 2 + rng() * (W - 4),
    y0: rng() * H * 0.2,
    y1: H * 0.2 + rng() * H * 0.7,
    wa: 0.15 + rng() * 0.65,
    wf: 0.04 + rng() * 0.09,
    ph: rng() * TAU,
    al: 0.05 + rng() * 0.12,
  }
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(1013)

  const horizonY = Math.floor(H * 0.50)

  const skyline = new Int32Array(W).fill(horizonY)
  let bx = 1
  while (bx < W - 1) {
    const bw = 2 + Math.floor(rng() * 10)
    const bh = 2 + Math.floor(rng() * 22)
    const gap = rng() < 0.3 ? 1 + Math.floor(rng() * 3) : 0
    for (let i = 0; i < bw && bx + i < W; i++) skyline[bx + i] = horizonY - bh
    bx += bw + gap
  }

  const bldgWins = []
  for (let x = 1; x < W - 1; x++) {
    const top = skyline[x]
    if (top >= horizonY) continue
    for (let y = top + 1; y < horizonY - 1; y++) {
      if (y % 2 === 0 && x % 3 !== 0 && rng() < 0.15)
        bldgWins.push({ x, y, br: 0.15 + rng() * 0.4, w: rng() })
    }
  }

  const lights = []
  for (let i = 0; i < 42; i++) lights.push(mkLight(rng, W, H))

  const drops = []
  for (let i = 0; i < 48; i++) drops.push(mkDrop(rng, W, H, false))

  const streaks = []
  for (let i = 0; i < 14; i++) streaks.push(mkStreak(rng, W, H))

  const bufR = new Float32Array(W * H)
  const bufG = new Float32Array(W * H)
  const bufB = new Float32Array(W * H)

  return { W, H, horizonY, skyline, bldgWins, lights, drops, streaks, rng, bufR, bufG, bufB }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  const { W, H, lights, drops, rng } = state

  for (const l of lights) {
    l.x -= 0.2 + l.depth * 0.85
    if (l.x < -l.r * 4) {
      Object.assign(l, mkLight(rng, W, H))
      l.x = W + rng() * 14
    }
  }

  for (const d of drops) {
    d.wp += d.wf
    d.x += Math.sin(d.wp) * d.wa * 0.05
    d.y += d.vy
    if (d.y > H + 2) Object.assign(d, mkDrop(rng, W, H, true))
  }

  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const { W, H, horizonY, skyline, bldgWins, lights, drops, streaks,
          bufR, bufG, bufB } = state

  for (let y = 0; y < H; y++) {
    const yf = y / H
    const hDist = Math.abs(yf - 0.50)
    const hGlow = Math.pow(Math.max(0, 1 - hDist * 2.2), 2.8)
    const below = y >= horizonY

    let bR, bG, bB
    if (below) {
      const gf = (y - horizonY) / Math.max(1, H - horizonY)
      bR = 3 + (1 - gf) * 6
      bG = 3 + (1 - gf) * 4
      bB = 7 + (1 - gf) * 2
    } else {
      bR = 3 + hGlow * 25
      bG = 3 + hGlow * 14
      bB = 9 + hGlow * 5
    }

    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      bufR[idx] = bR
      bufG[idx] = bG
      bufB[idx] = bB
    }
  }

  for (let x = 0; x < W; x++) {
    const top = skyline[x]
    for (let y = Math.max(0, top); y < horizonY && y < H; y++) {
      const idx = y * W + x
      bufR[idx] = 2
      bufG[idx] = 2
      bufB[idx] = 4
    }
  }

  for (const w of bldgWins) {
    if (w.x < 0 || w.x >= W || w.y < 0 || w.y >= H) continue
    const fl = 0.65 + 0.35 * Math.sin(t * 0.4 + w.x * 0.25 + w.y * 0.15)
    const idx = w.y * W + w.x
    bufR[idx] = (140 + w.w * 65) * w.br * fl * 0.2
    bufG[idx] = (100 + w.w * 35) * w.br * fl * 0.2
    bufB[idx] = (35 + (1 - w.w) * 50) * w.br * fl * 0.2
  }

  for (const l of lights) {
    const fl = 0.45 + 0.55 * Math.sin(t * l.fr + l.fp)
    const br = l.br * fl
    const er = l.r * (0.8 + l.depth * 0.5)
    const x0 = Math.max(0, Math.floor(l.x - er - 1))
    const x1 = Math.min(W - 1, Math.ceil(l.x + er + 1))
    const y0 = Math.max(0, Math.floor(l.y - er * 0.55 - 1))
    const y1 = Math.min(H - 1, Math.ceil(l.y + er * 0.55 + 1))

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - l.x
        const dy = (y - l.y) * 1.9
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > er) continue

        const falloff = Math.pow(1 - dist / er, 1.9)
        const intensity = br * falloff * 0.42
        const idx = y * W + x
        bufR[idx] += l.c[0] * intensity
        bufG[idx] += l.c[1] * intensity
        bufB[idx] += l.c[2] * intensity
      }
    }
  }

  for (const l of lights) {
    if (l.y > horizonY - 3) continue
    const fl = 0.45 + 0.55 * Math.sin(t * l.fr + l.fp)
    const br = l.br * fl * 0.12
    const refY = horizonY + (horizonY - l.y) * 0.25
    const er = l.r * 1.6
    const x0 = Math.max(0, Math.floor(l.x - er - 1))
    const x1 = Math.min(W - 1, Math.ceil(l.x + er + 1))
    const ry0 = Math.max(horizonY, Math.floor(refY - er * 0.3))
    const ry1 = Math.min(H - 1, Math.ceil(refY + er * 0.3))

    for (let y = ry0; y <= ry1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - l.x
        const dy = (y - refY) * 3.2
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > er) continue
        const falloff = Math.pow(1 - dist / er, 2.4)
        const intensity = br * falloff * 0.28
        const idx = y * W + x
        bufR[idx] += l.c[0] * intensity
        bufG[idx] += l.c[1] * intensity
        bufB[idx] += l.c[2] * intensity
      }
    }
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      const r = bufR[idx]
      const g = bufG[idx]
      const b = bufB[idx]
      const lum = (r + g + b) / 765

      if (lum > 0.045) {
        let ch
        if (lum > 0.38) ch = SHADE[3]
        else if (lum > 0.18) ch = SHADE[2]
        else if (lum > 0.08) ch = SHADE[1]
        else ch = SHADE[0]

        canvas.setCell(x, y, ch,
          hex(c2h(r * 1.25 + 6, g * 1.25 + 6, b * 1.25 + 6)),
          bgHex(c2h(r * 0.35, g * 0.35, b * 0.35))
        )
      } else {
        canvas.setCell(x, y, ' ', null, bgHex(c2h(r, g, b)))
      }
    }
  }

  for (const s of streaks) {
    for (let y = Math.floor(s.y0); y < Math.floor(s.y1) && y < H; y++) {
      if (y < 0) continue
      const sx = Math.floor(s.x + Math.sin(y * s.wf + s.ph + t * 0.04) * s.wa)
      if (sx < 1 || sx >= W - 1) continue
      const idx = y * W + sx
      const boost = s.al * 28
      canvas.setCell(sx, y, '│', hex(c2h(
        bufR[idx] * 0.4 + 18 + boost,
        bufG[idx] * 0.4 + 22 + boost,
        bufB[idx] * 0.4 + 28 + boost
      )))
    }
  }

  for (const d of drops) {
    const ix = Math.floor(d.x)
    const iy = Math.floor(d.y)
    if (ix < 2 || ix >= W - 2 || iy < 1 || iy >= H - 4) continue
    const idx = iy * W + ix
    const lr = bufR[idx], lg = bufG[idx], lb = bufB[idx]
    canvas.setCell(ix, iy, d.big ? '◦' : '·',
      hex(c2h(40 + lr * 0.65, 50 + lg * 0.65, 60 + lb * 0.65))
    )
  }
}
