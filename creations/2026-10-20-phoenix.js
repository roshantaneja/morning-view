import { hex, bgHex } from '../src/theme.js'

export const title = 'Phoenix'
export const description =
  'What the fire takes, the fire returns — every ending just another word for wings'
export const fps = 3

const TAU = Math.PI * 2

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function fireColor(i) {
  i = Math.max(0, Math.min(1, i))
  if (i < 0.12) { const t = i / 0.12; return [t * 70, 0, 0] }
  if (i < 0.30) { const t = (i - 0.12) / 0.18; return [70 + t * 185, t * 40, 0] }
  if (i < 0.50) { const t = (i - 0.30) / 0.20; return [255, 40 + t * 130, t * 8] }
  if (i < 0.70) { const t = (i - 0.50) / 0.20; return [255, 170 + t * 55, 8 + t * 55] }
  if (i < 0.88) { const t = (i - 0.70) / 0.18; return [255, 225 + t * 25, 63 + t * 110] }
  { const t = (i - 0.88) / 0.12; return [255, 250 + t * 5, 173 + t * 82] }
}

function bez(t, a, cp, b) {
  const mt = 1 - t
  return mt * mt * a + 2 * mt * t * cp + t * t * b
}

function spawnEmber(rng, cx, cy, W, BH) {
  return {
    x: cx + (rng() - 0.5) * W * 0.3,
    y: cy + rng() * BH * 0.12,
    vx: (rng() - 0.5) * 0.5,
    vy: -(0.3 + rng() * 1.0),
    life: rng(),
    maxLife: 0.45 + rng() * 0.55,
    bright: 0.3 + rng() * 0.7,
  }
}

export function setup(canvas) {
  const W = canvas.width
  const BH = canvas.height * 2
  const rng = srand(2020)

  const embers = []
  for (let i = 0; i < 55; i++)
    embers.push(spawnEmber(rng, W * 0.5, BH * 0.42, W, BH))

  return {
    W, BH, CH: canvas.height,
    embers, rng,
    bR: new Float32Array(W * BH),
    bG: new Float32Array(W * BH),
    bB: new Float32Array(W * BH),
  }
}

function splat(bR, bG, bB, W, BH, px, py, radius, intensity, t) {
  const flicker = 0.82 + 0.18 * Math.sin(t * 5.5 + px * 0.12 + py * 0.08)
  const [fr, fg, fb] = fireColor(intensity * flicker)
  const r2 = radius * radius
  const ri = Math.ceil(radius)
  const xMin = Math.max(0, Math.floor(px) - ri)
  const xMax = Math.min(W - 1, Math.ceil(px) + ri)
  const yMin = Math.max(0, Math.floor(py) - ri)
  const yMax = Math.min(BH - 1, Math.ceil(py) + ri)

  for (let y = yMin; y <= yMax; y++) {
    const dy = y - py
    const dy2 = dy * dy
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - px
      const d2 = dx * dx + dy2
      if (d2 >= r2) continue
      const fo = 1 - d2 / r2
      const a = fo * fo * 0.38
      const idx = y * W + x
      bR[idx] += fr * a
      bG[idx] += fg * a
      bB[idx] += fb * a
    }
  }
}

function drawAll(st, t) {
  const { W, BH, embers, bR, bG, bB } = st
  bR.fill(0); bG.fill(0); bB.fill(0)

  const cx = W * 0.5
  const cy = BH * 0.42
  const wingSpan = W * 0.40
  const bodyH = BH * 0.36
  const bodyTop = cy - bodyH * 0.55
  const bodyBot = cy + bodyH * 0.45

  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / (W * 0.30)
      const dy = (y - cy * 0.95) / (BH * 0.35)
      const d = Math.sqrt(dx * dx + dy * dy)
      const glow = Math.pow(Math.max(0, 1 - d * 0.45), 3.2)
      const idx = y * W + x
      bR[idx] = 2 + glow * 32
      bG[idx] = 1 + glow * 7
      bB[idx] = 5 + (y / BH) * 3
    }
  }

  for (let i = 0; i <= 35; i++) {
    const f = i / 35
    const py = bodyBot - f * bodyH
    const sway = Math.sin(f * TAU * 0.5 + t * 0.9) * 1.6
    const w = (0.25 + Math.sin(f * Math.PI) * 0.75) * 3.8
    const intens = 0.55 + Math.sin(f * Math.PI) * 0.45
    splat(bR, bG, bB, W, BH, cx + sway, py, w * 2.6, intens, t)
  }

  for (let i = 0; i <= 12; i++) {
    const f = i / 12
    const py = bodyTop - f * BH * 0.05
    const sway = Math.sin(t * 1.4 + f * 1.8) * 1.0
    const w = (1 - f * 0.55) * 2.8
    splat(bR, bG, bB, W, BH, cx + sway, py, w * 2.6, 0.92 - f * 0.25, t)
  }

  const crestBase = bodyTop - BH * 0.05
  for (let c = -2; c <= 2; c++) {
    for (let i = 0; i <= 8; i++) {
      const f = i / 8
      const angle = -Math.PI * 0.5 + c * 0.22 + Math.sin(t * 2.2 + c * 0.9) * 0.12
      const r = f * BH * 0.048
      const px = cx + Math.cos(angle) * r * 1.8 + c * 0.3
      const py = crestBase - r * 0.85
      splat(bR, bG, bB, W, BH, px, py, (1 - f) * 5, (1 - f) * 0.55, t)
    }
  }

  for (let side = -1; side <= 1; side += 2) {
    const ax = cx, ay = cy - BH * 0.06
    const tipX = cx + side * wingSpan
    const tipY = cy - BH * 0.22
    const cpX = cx + side * wingSpan * 0.55
    const cpY = cy - BH * 0.38

    for (let i = 0; i <= 45; i++) {
      const f = i / 45
      const px = bez(f, ax, cpX, tipX)
      const py = bez(f, ay, cpY, tipY)
      const wave = Math.sin(f * TAU * 1.5 + t * 1.8 * side + side * 0.5) * (f * 3.5)
      const w = (0.45 + Math.sin(f * Math.PI * 0.75) * 0.55) * 3.5
      const intens = 0.4 + (1 - f * 0.45) * 0.5
      splat(bR, bG, bB, W, BH, px, py + wave, w * 2.5, intens, t)
    }

    for (let feather = 0; feather < 7; feather++) {
      const baseF = 0.12 + feather * 0.11
      const bx = bez(baseF, ax, cpX, tipX)
      const by = bez(baseF, ay, cpY, tipY)
      const featherLen = (1 - baseF * 0.55) * BH * 0.14

      for (let i = 0; i <= 10; i++) {
        const f = i / 10
        const sway = Math.sin(t * 1.8 + feather * 0.55 + f * 1.2) * (f * 2.5)
        const px = bx + side * f * featherLen * 0.08 + sway
        const py = by + f * featherLen
        const w = (1 - f) * 2.0
        const intens = (1 - f * 0.75) * (1 - baseF * 0.3) * 0.48
        splat(bR, bG, bB, W, BH, px, py, w * 2.3, intens, t)
      }
    }

    for (let w = -1; w <= 1; w++) {
      for (let i = 0; i <= 6; i++) {
        const f = i / 6
        const angle = Math.PI * 0.3 * side + w * 0.25 + Math.sin(t * 2.8 + w) * 0.15
        const r = f * BH * 0.035
        const px = tipX + Math.cos(angle) * r * 1.5
        const py = tipY + Math.sin(angle) * r
        splat(bR, bG, bB, W, BH, px, py, (1 - f) * 4.5, (1 - f) * 0.45, t)
      }
    }
  }

  for (let tail = -3; tail <= 3; tail++) {
    for (let i = 0; i <= 18; i++) {
      const f = i / 18
      const len = BH * 0.22 + Math.abs(tail) * BH * 0.015
      const sway = Math.sin(f * Math.PI * 1.0 + t * 1.1 + tail * 0.35) * (2.5 + f * 6)
      const px = cx + f * tail * 3.5 + sway
      const py = bodyBot + f * len
      const w = (1 - f * 0.6) * (3.2 - Math.abs(tail) * 0.35)
      const intens = (1 - f * 0.75) * (1 - Math.abs(tail) / 4.5) * 0.6
      if (w > 0.3 && intens > 0.02)
        splat(bR, bG, bB, W, BH, px, py, Math.max(1, w * 2.3), intens, t)
    }
  }

  for (const e of embers) {
    if (e.life <= 0) continue
    const lifeFrac = e.life / e.maxLife
    splat(bR, bG, bB, W, BH, e.x, e.y, 2.5, lifeFrac * e.bright * 0.5, t)
  }
}

function blit(canvas, st) {
  const { W, CH, bR, bG, bB } = st
  for (let ty = 0; ty < CH; ty++) {
    for (let x = 0; x < W; x++) {
      const ti = (ty * 2) * W + x
      const bi = (ty * 2 + 1) * W + x
      canvas.setCell(x, ty, '▀',
        hex(c2h(bR[ti], bG[ti], bB[ti])),
        bgHex(c2h(bR[bi], bG[bi], bB[bi])))
    }
  }
}

export function render(canvas, data, state) {
  drawAll(state, 0)
  blit(canvas, state)
}

export function update(canvas, data, frame, state) {
  const { embers, rng, W, BH } = state
  const cx = W * 0.5, cy = BH * 0.42

  for (const e of embers) {
    e.x += e.vx + Math.sin(frame.elapsed * 1.5 + e.y * 0.03) * 0.2
    e.y += e.vy
    e.life -= 0.016

    if (e.life <= 0 || e.y < 0 || e.x < 0 || e.x >= W) {
      Object.assign(e, spawnEmber(rng, cx, cy, W, BH))
    }
  }

  drawAll(state, frame.elapsed)
  blit(canvas, state)
}
