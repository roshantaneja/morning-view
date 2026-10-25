import { hex, bgHex } from '../src/theme.js'

export const title = 'Peacock'
export const description =
  'A hundred eyes open at once — each one a cosmos of blue and gold, watching the morning arrive'
export const fps = 2

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

function fanLen(a, hR, vR) {
  const cx = Math.cos(a), sy = Math.sin(a)
  return 1 / Math.sqrt((cx / hR) ** 2 + (sy / vR) ** 2)
}

function mkDust(rng, ox, oy, hR, vR) {
  return {
    x: ox + (rng() - 0.5) * hR * 1.8,
    y: oy - rng() * vR * 0.9,
    vx: (rng() - 0.5) * 0.15,
    vy: -0.12 - rng() * 0.18,
    br: 0.3 + rng() * 0.7,
    ph: rng() * TAU,
    fr: 0.4 + rng() * 1.2,
  }
}

export function setup(canvas) {
  const W = canvas.width
  const BH = canvas.height * 2
  const rng = srand(1025)

  const ox = W * 0.5
  const oy = BH * 0.85
  const hR = W * 0.44
  const vR = BH * 0.73
  const fanHalf = 1.12

  const baseR = Math.max(3.5, Math.min(W * 0.045, BH * 0.028))
  const eyes = []
  const arcs = [
    { f: 0.33, n: 5,  s: 0.72 },
    { f: 0.47, n: 7,  s: 0.82 },
    { f: 0.61, n: 10, s: 0.92 },
    { f: 0.75, n: 13, s: 1.00 },
    { f: 0.89, n: 15, s: 0.88 },
  ]
  for (const arc of arcs) {
    for (let i = 0; i < arc.n; i++) {
      const t = (i + 0.5) / arc.n
      const a = -Math.PI / 2 + (t - 0.5) * fanHalf * 2
      const fl = fanLen(a, hR, vR) * arc.f
      eyes.push({
        x: ox + Math.cos(a) * fl + (rng() - 0.5) * 1.2,
        y: oy + Math.sin(a) * fl + (rng() - 0.5) * 1.2,
        sz: baseR * arc.s,
        ph: rng() * TAU,
        fr: 0.25 + rng() * 0.75,
      })
    }
  }

  const shafts = []
  for (let i = 0; i < 50; i++) {
    const t = i / 49
    const a = -Math.PI / 2 + (t - 0.5) * fanHalf * 2
    shafts.push({ a, len: fanLen(a, hR, vR) * (0.94 + rng() * 0.06) })
  }

  const dust = []
  for (let i = 0; i < 20; i++) dust.push(mkDust(rng, ox, oy, hR, vR))

  const sz = W * BH
  return {
    W, BH, CH: canvas.height, ox, oy, hR, vR, fanHalf,
    eyes, shafts, dust, rng,
    bR: new Float32Array(sz), bG: new Float32Array(sz), bB: new Float32Array(sz),
  }
}

function fillOval(bR, bG, bB, W, BH, cx, cy, rx, ry, cr, cg, cb) {
  if (rx < 0.5 || ry < 0.5) return
  const x0 = Math.max(0, Math.floor(cx - rx - 1))
  const x1 = Math.min(W - 1, Math.ceil(cx + rx + 1))
  const y0 = Math.max(0, Math.floor(cy - ry - 1))
  const y1 = Math.min(BH - 1, Math.ceil(cy + ry + 1))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry
      const d2 = dx * dx + dy * dy
      if (d2 > 1.2) continue
      const a = Math.max(0, Math.min(1, (1 - Math.sqrt(d2)) * 2.5))
      const idx = y * W + x
      bR[idx] = bR[idx] * (1 - a) + cr * a
      bG[idx] = bG[idx] * (1 - a) + cg * a
      bB[idx] = bB[idx] * (1 - a) + cb * a
    }
  }
}

function draw(canvas, st, t) {
  const { W, BH, CH, ox, oy, hR, vR, fanHalf,
          eyes, shafts, dust, bR, bG, bB } = st
  bR.fill(0); bG.fill(0); bB.fill(0)

  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < W; x++) {
      const gx = (x - ox) / (W * 0.7), gy = (y - oy * 0.55) / (BH * 0.6)
      const gl = Math.pow(Math.max(0, 1 - Math.sqrt(gx * gx + gy * gy)), 5)
      const idx = y * W + x
      bR[idx] = 3 + gl * 12
      bG[idx] = 2 + gl * 6
      bB[idx] = 9 + gl * 4
    }
  }

  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - ox, dy = y - oy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 2) continue
      const a = Math.atan2(dy, dx)
      const off = Math.abs(a + Math.PI / 2)
      if (off > fanHalf * 1.04) continue
      const maxD = fanLen(a, hR, vR)
      if (dist > maxD * 1.01) continue
      const tR = dist / maxD
      if (tR < 0.03) continue

      const eFade = Math.max(0, Math.min(1, (fanHalf - off) / (fanHalf * 0.1)))
      const oFade = Math.max(0, 1 - tR * tR * tR * tR)
      const iFade = Math.min(1, (tR - 0.03) / 0.05)
      const fade = eFade * oFade * iFade
      if (fade <= 0) continue

      const barb = 0.78 + 0.22 * Math.sin(a * 55 + dist * 0.18)
      const idx = y * W + x
      bR[idx] += 7 * fade * barb
      bG[idx] += 22 * fade * barb
      bB[idx] += 10 * fade * barb
    }
  }

  for (const sh of shafts) {
    const n = Math.ceil(sh.len)
    for (let i = 0; i < n; i++) {
      const frac = i / n
      const px = Math.round(ox + Math.cos(sh.a) * sh.len * frac)
      const py = Math.round(oy + Math.sin(sh.a) * sh.len * frac)
      if (px < 0 || px >= W || py < 0 || py >= BH) continue
      const idx = py * W + px
      const f = 0.28 * (1 - frac * frac)
      bR[idx] = Math.min(255, bR[idx] + 5 * f)
      bG[idx] = Math.min(255, bG[idx] + 16 * f)
      bB[idx] = Math.min(255, bB[idx] + 5 * f)
    }
  }

  for (const eye of eyes) {
    const s1 = Math.sin(t * eye.fr + eye.ph) * 0.5 + 0.5
    const s2 = Math.sin(t * eye.fr * 0.6 + eye.ph + 1.8) * 0.5 + 0.5
    const gR = eye.sz * 1.6
    const ix0 = Math.max(0, Math.floor(eye.x - gR - 1))
    const ix1 = Math.min(W - 1, Math.ceil(eye.x + gR + 1))
    const iy0 = Math.max(0, Math.floor(eye.y - gR - 1))
    const iy1 = Math.min(BH - 1, Math.ceil(eye.y + gR + 1))

    for (let py = iy0; py <= iy1; py++) {
      for (let px = ix0; px <= ix1; px++) {
        const ddx = px - eye.x, ddy = py - eye.y
        const d = Math.sqrt(ddx * ddx + ddy * ddy)
        if (d > gR) continue
        const dn = d / eye.sz
        const idx = py * W + px
        let r, g, b, alpha

        if (dn < 0.28) {
          r = 5; g = 5; b = 14; alpha = 0.95
        } else if (dn < 0.52) {
          r = 15 + s1 * 30
          g = 50 + s1 * 55
          b = 160 + s1 * 85
          alpha = 0.93
        } else if (dn < 0.76) {
          r = 8 + s2 * 20
          g = 130 + s1 * 85
          b = 55 + s2 * 40
          alpha = 0.90
        } else if (dn < 1.03) {
          const lt = (dn - 0.76) / 0.27
          const fd = 1 - lt * 0.3
          r = (190 + s1 * 50) * fd
          g = (140 + s1 * 35) * fd
          b = (22 + s1 * 15) * fd
          alpha = 0.85 * fd
        } else {
          const fd = Math.max(0, 1 - (dn - 1.03) / 0.57)
          r = (75 + s1 * 20) * fd
          g = (50 + s1 * 15) * fd
          b = 8 * fd
          alpha = 0.22 * fd
        }

        if (alpha > 0.01) {
          bR[idx] = bR[idx] * (1 - alpha) + r * alpha
          bG[idx] = bG[idx] * (1 - alpha) + g * alpha
          bB[idx] = bB[idx] * (1 - alpha) + b * alpha
        }
      }
    }
  }

  const bcx = ox, bcy = oy + BH * 0.042
  const brx = W * 0.048, bry = BH * 0.022
  fillOval(bR, bG, bB, W, BH, bcx, bcy, brx, bry, 10, 14, 52)

  const headX = bcx - W * 0.03 + Math.sin(2.2) * W * 0.006
  const headY = bcy - bry * 0.5 - BH * 0.035
  for (let i = 0; i <= 14; i++) {
    const tt = i / 14
    const nx = bcx + (headX - bcx) * tt + Math.sin(tt * 2.2) * W * 0.006
    const ny = bcy - bry * 0.5 + (headY - bcy + bry * 0.5) * tt
    const w = brx * 0.28 * (1 - tt * 0.12)
    fillOval(bR, bG, bB, W, BH, nx, ny, w, w * 0.65, 10, 16, 58)
  }

  const hr = Math.max(1.8, Math.min(W, BH) * 0.011)
  fillOval(bR, bG, bB, W, BH, headX, headY, hr * 1.15, hr, 12, 20, 62)

  const epx = Math.round(headX - hr * 0.4)
  const epy = Math.round(headY - hr * 0.15)
  if (epx >= 0 && epx < W && epy >= 0 && epy < BH) {
    const idx = epy * W + epx
    bR[idx] = Math.min(255, bR[idx] + 80)
    bG[idx] = Math.min(255, bG[idx] + 70)
    bB[idx] = Math.min(255, bB[idx] + 40)
  }

  for (let i = 0; i < 5; i++) {
    const tt = i / 4
    const bpx = Math.round(headX - hr * 1.1 - tt * hr * 1.2)
    const bpy = Math.round(headY + hr * 0.2 * tt)
    if (bpx >= 0 && bpx < W && bpy >= 0 && bpy < BH) {
      const idx = bpy * W + bpx
      bR[idx] = Math.min(255, bR[idx] + 45)
      bG[idx] = Math.min(255, bG[idx] + 42)
      bB[idx] = Math.min(255, bB[idx] + 22)
    }
  }

  for (let c = 0; c < 3; c++) {
    const ca = -Math.PI * 0.5 - 0.2 + c * 0.2
    const cLen = hr * 4
    for (let s = 0; s < 12; s++) {
      const tt = s / 11
      const cpx = Math.round(headX + Math.cos(ca) * cLen * tt)
      const cpy = Math.round(headY + Math.sin(ca) * cLen * tt)
      if (cpx >= 0 && cpx < W && cpy >= 0 && cpy < BH) {
        const idx = cpy * W + cpx
        bR[idx] = Math.min(255, bR[idx] + 10)
        bG[idx] = Math.min(255, bG[idx] + 25)
        bB[idx] = Math.min(255, bB[idx] + 55)
      }
    }
    const tx = Math.round(headX + Math.cos(ca) * cLen)
    const ty = Math.round(headY + Math.sin(ca) * cLen)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx * dx + dy * dy > 1) continue
        const px = tx + dx, py = ty + dy
        if (px >= 0 && px < W && py >= 0 && py < BH) {
          const idx = py * W + px
          bR[idx] = Math.min(255, bR[idx] + 18)
          bG[idx] = Math.min(255, bG[idx] + 50)
          bB[idx] = Math.min(255, bB[idx] + 120)
        }
      }
    }
  }

  for (const d of dust) {
    const tw = (Math.sin(t * d.fr + d.ph) * 0.5 + 0.5) * d.br
    if (tw < 0.12) continue
    const px = Math.round(d.x), py = Math.round(d.y)
    if (px >= 0 && px < W && py >= 0 && py < BH) {
      const idx = py * W + px
      bR[idx] = Math.min(255, bR[idx] + 85 * tw)
      bG[idx] = Math.min(255, bG[idx] + 60 * tw)
      bB[idx] = Math.min(255, bB[idx] + 15 * tw)
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
  const { dust, ox, oy, hR, vR, W, BH, rng } = state
  for (const d of dust) {
    d.x += d.vx
    d.y += d.vy
    if (d.y < 0 || d.x < 0 || d.x >= W) {
      Object.assign(d, mkDust(rng, ox, oy, hR, vR))
    }
  }
  draw(canvas, state, frame.elapsed)
}
