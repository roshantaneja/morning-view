import { hex, bgHex } from '../src/theme.js'

export const title = 'Orb Weaver'
export const description =
  "The garden's geometer sleeps — her night's work hangs perfect and still, each thread beaded with the morning"
export const fps = 2

const TAU = Math.PI * 2
const N_RAD = 24
const N_RING = 28

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}

function plotLine(bR, bG, bB, W, H, x0, y0, x1, y1, r, g, b, a) {
  const dx = x1 - x0, dy = y1 - y0
  const n = Math.max(Math.ceil(Math.sqrt(dx * dx + dy * dy) * 1.4), 1)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const px = Math.round(x0 + dx * t)
    const py = Math.round(y0 + dy * t)
    if (px >= 0 && px < W && py >= 0 && py < H) {
      const idx = py * W + px
      bR[idx] = Math.min(255, bR[idx] + r * a)
      bG[idx] = Math.min(255, bG[idx] + g * a)
      bB[idx] = Math.min(255, bB[idx] + b * a)
    }
  }
}

function mkFall(rng, cx, cy, maxR) {
  return {
    x: cx + (rng() - 0.5) * maxR * 0.7,
    y: cy + (rng() - 0.3) * maxR * 0.5,
    vy: 0.3 + rng() * 0.5,
    life: 0.7 + rng() * 0.3,
    br: 0.3 + rng() * 0.7,
  }
}

export function setup(canvas) {
  const W = canvas.width
  const BH = canvas.height * 2
  const rng = srand(1017)

  const cx = W * 0.50
  const cy = BH * 0.40
  const maxR = Math.min(W * 0.47, BH * 0.37)
  const hubR = maxR * 0.055

  const rads = []
  for (let i = 0; i < N_RAD; i++) {
    rads.push({
      a: (i / N_RAD) * TAU + (rng() - 0.5) * (TAU / N_RAD) * 0.12,
      len: maxR * (0.86 + rng() * 0.14),
    })
  }

  const ringR = []
  for (let i = 0; i < N_RING; i++) {
    const t = (i + 1) / (N_RING + 1)
    ringR.push(hubR + (maxR - hubR) * Math.pow(t, 0.88))
  }

  const dew = []
  for (let ri = 0; ri < N_RING; ri++) {
    for (let si = 0; si < N_RAD; si++) {
      if (ringR[ri] > rads[si].len) continue
      if (rng() > 0.58) continue
      dew.push({ ri, si, sz: 0.2 + rng() * 0.8, ph: rng() * TAU, fr: 0.5 + rng() * 1.8 })
    }
  }

  const stars = []
  for (let i = 0; i < 50; i++) {
    stars.push({ x: Math.floor(rng() * W), y: Math.floor(rng() * BH),
                 br: 0.15 + rng() * 0.85, ph: rng() * TAU, fr: 0.3 + rng() * 1.5 })
  }

  const anchors = []
  for (let i = 0; i < N_RAD; i++) {
    if (rng() > 0.35) continue
    anchors.push({ i, ext: 12 + rng() * 25 })
  }

  const gx = W * 0.80, gy = BH * 0.72

  const fall = []
  for (let i = 0; i < 4; i++) fall.push(mkFall(rng, cx, cy, maxR))

  const sz = W * BH
  return {
    W, BH, CH: canvas.height, cx, cy, maxR, hubR,
    rads, ringR, dew, stars, gx, gy, anchors, fall, rng,
    bR: new Float32Array(sz), bG: new Float32Array(sz), bB: new Float32Array(sz),
  }
}

function draw(canvas, st, t) {
  const { W, BH, CH, cx, cy, maxR, hubR, rads, ringR, dew, stars,
          gx, gy, anchors, fall, bR, bG, bB } = st

  bR.fill(0); bG.fill(0); bB.fill(0)

  const wx = Math.sin(t * 0.32) * 1.6
  const wy = Math.cos(t * 0.26) * 0.9

  function wp(angle, r) {
    const f = 1 - (r / maxR) * 0.55
    return [cx + Math.cos(angle) * r + wx * f, cy + Math.sin(angle) * r + wy * f]
  }

  function bl(px, py) {
    const dx = (px - gx) / (W * 0.5), dy = (py - gy) / (BH * 0.4)
    return Math.pow(Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)), 1.8)
  }

  for (let y = 0; y < BH; y++) {
    const yf = y / BH
    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      const gdx = (x - gx) / (W * 0.5), gdy = (y - gy) / (BH * 0.4)
      const glow = Math.pow(Math.max(0, 1 - Math.sqrt(gdx * gdx + gdy * gdy)), 3.2)
      bR[idx] = 3 + yf * 4 + glow * 38
      bG[idx] = 4 + yf * 5 + glow * 18
      bB[idx] = 13 + yf * 6 + glow * 5
    }
  }

  for (const s of stars) {
    if (s.x < 0 || s.x >= W || s.y < 0 || s.y >= BH) continue
    const tw = 0.35 + 0.65 * Math.sin(t * s.fr + s.ph)
    const br = s.br * tw
    const idx = s.y * W + s.x
    bR[idx] += 95 * br
    bG[idx] += 108 * br
    bB[idx] += 158 * br
  }

  function tc(px, py) {
    const b = bl(px, py)
    return [48 + b * 130, 56 + b * 88, 70 + b * 44]
  }

  for (const anch of anchors) {
    const rad = rads[anch.i]
    const [x0, y0] = wp(rad.a, rad.len)
    const ex = cx + Math.cos(rad.a) * (rad.len + anch.ext)
    const ey = cy + Math.sin(rad.a) * (rad.len + anch.ext)
    const [r, g, b] = tc((x0 + ex) / 2, (y0 + ey) / 2)
    plotLine(bR, bG, bB, W, BH, x0, y0, ex, ey, r * 0.35, g * 0.35, b * 0.35, 0.3)
  }

  for (const rad of rads) {
    const [x0, y0] = wp(rad.a, hubR * 0.3)
    const [x1, y1] = wp(rad.a, rad.len)
    const [r, g, b] = tc((x0 + x1) / 2, (y0 + y1) / 2)
    plotLine(bR, bG, bB, W, BH, x0, y0, x1, y1, r, g, b, 0.7)
  }

  for (let ri = 0; ri < ringR.length; ri++) {
    const rr = ringR[ri]
    for (let si = 0; si < N_RAD; si++) {
      const ni = (si + 1) % N_RAD
      if (rr > rads[si].len || rr > rads[ni].len) continue
      let a0 = rads[si].a, a1 = rads[ni].a
      if (a1 < a0 - Math.PI) a1 += TAU
      if (a0 < a1 - Math.PI) a0 += TAU
      const segs = 3
      for (let s = 0; s < segs; s++) {
        const ta = a0 + (a1 - a0) * (s / segs)
        const tb = a0 + (a1 - a0) * ((s + 1) / segs)
        const wa = 1 + Math.sin(ta * 7.5 + ri * 0.4) * 0.012
        const wb = 1 + Math.sin(tb * 7.5 + ri * 0.4) * 0.012
        const [x0, y0] = wp(ta, rr * wa)
        const [x1, y1] = wp(tb, rr * wb)
        const [r, g, b] = tc((x0 + x1) / 2, (y0 + y1) / 2)
        plotLine(bR, bG, bB, W, BH, x0, y0, x1, y1, r, g, b, 0.5)
      }
    }
  }

  for (let h = 0; h < 5; h++) {
    const rr = hubR * (0.3 + h * 0.16)
    for (let si = 0; si < N_RAD; si++) {
      const ni = (si + 1) % N_RAD
      let a0 = rads[si].a, a1 = rads[ni].a
      if (a1 < a0 - Math.PI) a1 += TAU
      if (a0 < a1 - Math.PI) a0 += TAU
      const [x0, y0] = wp(a0, rr)
      const [x1, y1] = wp(a1, rr)
      plotLine(bR, bG, bB, W, BH, x0, y0, x1, y1, 42, 50, 62, 0.45)
    }
  }

  for (const d of dew) {
    const rr = ringR[d.ri]
    const [px, py] = wp(rads[d.si].a, rr)
    const shimmer = 0.4 + 0.6 * Math.sin(t * d.fr + d.ph)
    const brightness = d.sz * (0.35 + shimmer * 0.65)
    const backl = bl(px, py)
    const glR = 1.0 + brightness * 1.8
    const ix0 = Math.max(0, Math.floor(px - glR - 1))
    const ix1 = Math.min(W - 1, Math.ceil(px + glR + 1))
    const iy0 = Math.max(0, Math.floor(py - glR - 1))
    const iy1 = Math.min(BH - 1, Math.ceil(py + glR + 1))
    for (let y = iy0; y <= iy1; y++) {
      for (let x = ix0; x <= ix1; x++) {
        const ddx = x - px, ddy = y - py
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dist > glR) continue
        const fo = Math.pow(1 - dist / glR, 2.2)
        const I = brightness * fo * 0.5
        const idx = y * W + x
        bR[idx] += (110 + backl * 145) * I
        bG[idx] += (125 + backl * 78) * I
        bB[idx] += (150 + backl * 28) * I
      }
    }
  }

  for (const f of fall) {
    if (f.life <= 0.1) continue
    const fx = Math.round(f.x), fy = Math.round(f.y)
    if (fx >= 0 && fx < W && fy >= 0 && fy < BH) {
      const idx = fy * W + fx
      const brightness = f.br * f.life
      bR[idx] += 85 * brightness
      bG[idx] += 105 * brightness
      bB[idx] += 135 * brightness
    }
  }

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
  draw(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const { fall, rng, cx, cy, maxR, BH } = state
  for (const f of fall) {
    f.y += f.vy
    f.life -= 0.012
    if (f.life <= 0 || f.y > BH) Object.assign(f, mkFall(rng, cx, cy, maxR))
  }
  draw(canvas, state, frame.elapsed)
}
