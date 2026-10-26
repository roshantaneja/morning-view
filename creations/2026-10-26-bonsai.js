import { hex, bgHex } from '../src/theme.js'

export const title = 'Bonsai'
export const description =
  'A hundred years of wind, rain, and patient hands — one green exhalation greeting the morning'
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

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function fillOval(bR, bG, bB, W, BH, cx, cy, rx, ry, r, g, b, alpha) {
  if (rx < 0.3 || ry < 0.3) return
  const x0 = Math.max(0, Math.floor(cx - rx - 1))
  const x1 = Math.min(W - 1, Math.ceil(cx + rx + 1))
  const y0 = Math.max(0, Math.floor(cy - ry - 1))
  const y1 = Math.min(BH - 1, Math.ceil(cy + ry + 1))
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const dx = (px - cx) / rx, dy = (py - cy) / ry
      const d2 = dx * dx + dy * dy
      if (d2 > 1.2) continue
      const edge = Math.max(0, Math.min(1, (1 - Math.sqrt(d2)) * 2.5))
      const a = edge * alpha
      const idx = py * W + px
      bR[idx] = bR[idx] * (1 - a) + r * a
      bG[idx] = bG[idx] * (1 - a) + g * a
      bB[idx] = bB[idx] * (1 - a) + b * a
    }
  }
}

function spawnLeaf(rng, cx, topY, spread) {
  return {
    x: cx + (rng() - 0.5) * spread,
    y: topY + rng() * spread * 0.6,
    vx: (rng() - 0.5) * 0.25,
    vy: 0.18 + rng() * 0.2,
    phase: rng() * TAU,
    speed: 1.5 + rng() * 2,
    hue: rng(),
  }
}

export function setup(canvas) {
  const W = canvas.width
  const BH = canvas.height * 2
  const rng = srand(261026)

  const cx = W * 0.48
  const soilY = BH * 0.68
  const topY = BH * 0.18
  const treeH = soilY - topY

  const trunk = []
  const N = 25
  for (let i = 0; i <= N; i++) {
    const f = i / N
    const lean = Math.sin(f * Math.PI * 0.65) * W * 0.05
              - Math.sin(f * Math.PI * 1.5) * W * 0.015
    trunk.push({
      x: cx + lean + (rng() - 0.5) * 1.2,
      y: soilY - f * treeH,
      w: (1 - f * 0.65) * W * 0.022 + 0.6,
    })
  }

  const bDefs = [
    { t: 0.22, d: 1, a: 0.15, l: 0.25, ws: 0.55 },
    { t: 0.32, d:-1, a: 0.10, l: 0.20, ws: 0.50 },
    { t: 0.42, d: 1, a: 0.08, l: 0.30, ws: 0.50 },
    { t: 0.50, d:-1, a: 0.20, l: 0.16, ws: 0.45 },
    { t: 0.58, d: 1, a: 0.12, l: 0.22, ws: 0.42 },
    { t: 0.65, d:-1, a: 0.05, l: 0.28, ws: 0.40 },
    { t: 0.74, d: 1, a: 0.10, l: 0.16, ws: 0.35 },
    { t: 0.82, d:-1, a: 0.15, l: 0.12, ws: 0.30 },
    { t: 0.90, d: 1, a: 0.05, l: 0.10, ws: 0.25 },
  ]

  const branches = []
  for (const bd of bDefs) {
    const si = Math.round(bd.t * N)
    const sp = trunk[si]
    const bLen = treeH * bd.l
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const f = i / 12
      const droop = f * f * bLen * 0.08
      const curve = Math.sin(f * Math.PI * 0.8) * bLen * 0.04 * (rng() - 0.5)
      pts.push({
        x: sp.x + bd.d * f * bLen + curve,
        y: sp.y - f * bLen * bd.a + droop,
        w: Math.max(0.3, bd.ws * sp.w * (1 - f * 0.85)),
      })
    }
    branches.push(pts)
  }

  const pads = []
  for (const br of branches) {
    for (const along of [0.55, 0.75, 0.92, 1.0]) {
      const i = Math.min(Math.floor(along * (br.length - 1)), br.length - 1)
      const p = br[i]
      pads.push({
        x: p.x + (rng() - 0.5) * 4,
        y: p.y - 1 - rng() * 2,
        rx: 4 + rng() * 6,
        ry: 2.5 + rng() * 4,
        ph: rng() * TAU,
        gv: rng() * 0.3,
      })
    }
  }

  const apex = trunk[N]
  for (let i = 0; i < 5; i++) {
    const angle = (rng() - 0.5) * Math.PI * 0.8
    const dist = 2 + rng() * 8
    pads.push({
      x: apex.x + Math.cos(angle) * dist,
      y: apex.y + Math.sin(angle) * dist * 0.5 - rng() * 4,
      rx: 3 + rng() * 7,
      ry: 2 + rng() * 5,
      ph: rng() * TAU,
      gv: rng() * 0.3,
    })
  }

  const leaves = []
  for (let i = 0; i < 6; i++) leaves.push(spawnLeaf(rng, cx, topY, treeH * 0.5))

  return {
    W, BH, CH: canvas.height, cx, soilY, topY, treeH,
    trunk, branches, pads, leaves, rng,
    bR: new Float32Array(W * BH),
    bG: new Float32Array(W * BH),
    bB: new Float32Array(W * BH),
  }
}

function draw(canvas, st, t) {
  const { W, BH, CH, cx, soilY, trunk, branches, pads, leaves,
          bR, bG, bB } = st
  bR.fill(0); bG.fill(0); bB.fill(0)

  for (let y = 0; y < BH; y++) {
    const fy = y / BH
    for (let x = 0; x < W; x++) {
      const fx = x / W
      const vx = (fx - 0.48) * 2, vy = (fy - 0.4) * 1.8
      const vig = Math.max(0.6, 1 - (vx * vx + vy * vy) * 0.12)
      const idx = y * W + x
      bR[idx] = (225 + fy * 8) * vig
      bG[idx] = (212 + fy * 4) * vig
      bB[idx] = (182 - fy * 12) * vig
    }
  }

  for (const pad of pads) {
    fillOval(bR, bG, bB, W, BH, pad.x + 4, pad.y + 3,
      pad.rx * 1.1, pad.ry * 1.1, 195, 185, 160, 0.1)
  }

  const standY = soilY + BH * 0.065
  const standH = BH * 0.018
  const standHW = W * 0.155
  for (let y = Math.max(0, Math.floor(standY)); y < Math.min(BH, Math.ceil(standY + standH)); y++) {
    for (let x = Math.max(0, Math.floor(cx - standHW)); x < Math.min(W, Math.ceil(cx + standHW)); x++) {
      const gr = hash(x * 0.3, y * 0.15) * 14
      const idx = y * W + x
      bR[idx] = 88 + gr; bG[idx] = 54 + gr * 0.5; bB[idx] = 28 + gr * 0.3
    }
  }
  for (const side of [-1, 1]) {
    const lx = cx + side * standHW * 0.88
    const ly0 = standY + standH, ly1 = ly0 + BH * 0.022
    for (let y = Math.floor(ly0); y < Math.min(BH, Math.ceil(ly1)); y++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = Math.round(lx) + dx
        if (x >= 0 && x < W) {
          const idx = y * W + x
          bR[idx] = 78; bG[idx] = 46; bB[idx] = 24
        }
      }
    }
  }

  const potTop = soilY - BH * 0.005
  const potBot = soilY + BH * 0.055
  const ptHW = W * 0.065
  const pbHW = W * 0.048
  for (let y = Math.max(0, Math.floor(potTop - BH * 0.006)); y < Math.min(BH, Math.ceil(potTop)); y++) {
    for (let x = Math.max(0, Math.floor(cx - ptHW * 1.05)); x < Math.min(W, Math.ceil(cx + ptHW * 1.05)); x++) {
      const d = (x - cx) / (ptHW * 1.05)
      if (Math.abs(d) > 1) continue
      const sh = 0.85 + (1 - d * d) * 0.15
      const idx = y * W + x
      bR[idx] = 52 * sh; bG[idx] = 42 * sh; bB[idx] = 38 * sh
    }
  }
  for (let y = Math.max(0, Math.floor(potTop)); y < Math.min(BH, Math.ceil(potBot)); y++) {
    const fy = (y - potTop) / (potBot - potTop)
    const hw = ptHW + (pbHW - ptHW) * fy
    for (let x = Math.max(0, Math.floor(cx - hw)); x < Math.min(W, Math.ceil(cx + hw)); x++) {
      const d = (x - cx) / hw
      if (Math.abs(d) > 1) continue
      const sh = 0.7 + (1 - d * d) * 0.3
      const idx = y * W + x
      bR[idx] = 48 * sh; bG[idx] = 38 * sh; bB[idx] = 35 * sh
    }
  }

  for (let y = Math.max(0, Math.floor(potTop - 3)); y <= Math.min(BH - 1, Math.floor(potTop)); y++) {
    for (let x = Math.max(0, Math.floor(cx - ptHW * 0.88)); x < Math.min(W, Math.ceil(cx + ptHW * 0.88)); x++) {
      const gr = hash(x * 1.5, y * 1.5) * 14
      const idx = y * W + x
      if (hash(x * 2, y * 3) > 0.5) {
        bR[idx] = 30 + gr * 0.5; bG[idx] = 55 + gr; bB[idx] = 20 + gr * 0.3
      } else {
        bR[idx] = 48 + gr; bG[idx] = 34 + gr * 0.4; bB[idx] = 16 + gr * 0.2
      }
    }
  }

  for (let i = 0; i < trunk.length - 1; i++) {
    const p0 = trunk[i], p1 = trunk[i + 1]
    const len = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2)
    const steps = Math.max(1, Math.ceil(len))
    for (let s = 0; s <= steps; s++) {
      const f = s / steps
      const px = p0.x + (p1.x - p0.x) * f
      const py = p0.y + (p1.y - p0.y) * f
      const pw = p0.w + (p1.w - p0.w) * f
      const bark = hash(px * 0.4, py * 0.25) * 22
      fillOval(bR, bG, bB, W, BH, px, py, pw, pw * 0.9,
        82 + bark, 55 + bark * 0.5, 30 + bark * 0.3, 0.92)
    }
  }

  for (const br of branches) {
    for (let i = 0; i < br.length - 1; i++) {
      const p0 = br[i], p1 = br[i + 1]
      const len = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2)
      const steps = Math.max(1, Math.ceil(len))
      for (let s = 0; s <= steps; s++) {
        const f = s / steps
        const px = p0.x + (p1.x - p0.x) * f
        const py = p0.y + (p1.y - p0.y) * f
        const pw = p0.w + (p1.w - p0.w) * f
        const bark = hash(px * 0.35, py * 0.35) * 18
        fillOval(bR, bG, bB, W, BH, px, py, pw, pw * 0.85,
          75 + bark, 50 + bark * 0.5, 26 + bark * 0.3, 0.88)
      }
    }
  }

  for (const pad of pads) {
    const sway = Math.sin(t * 0.8 + pad.ph) * 1.2
    const pcx = pad.x + sway
    const n = 8 + Math.floor(pad.rx * 0.8)

    for (let i = 0; i < 3; i++) {
      const dx = (hash(i * 17, pad.x * 2) - 0.5) * pad.rx * 0.4
      const dy = (hash(i * 19, pad.y * 2) - 0.5) * pad.ry * 0.3
      fillOval(bR, bG, bB, W, BH, pcx + dx, pad.y + dy + 1,
        pad.rx * 0.3, pad.ry * 0.25, 12, 30, 8, 0.4)
    }

    for (let i = 0; i < n; i++) {
      const angle = hash(i + pad.ph * 100, pad.x) * TAU
      const dist = hash(i * 7 + pad.ph * 50, pad.y) * 0.55
      const fx = pcx + Math.cos(angle) * pad.rx * dist
      const fy = pad.y + Math.sin(angle) * pad.ry * dist
      const r = pad.rx * (0.32 + hash(i * 3, pad.ph * 30) * 0.22)
      const ry = pad.ry * (0.32 + hash(i * 5, pad.ph * 30) * 0.18)
      const gv = pad.gv + hash(i, pad.ph * 80) * 0.15
      const light = 0.8 + hash(i * 11, pad.y * 3) * 0.25
      fillOval(bR, bG, bB, W, BH, fx, fy, r, ry,
        (30 + gv * 28) * light,
        (80 + gv * 45) * light,
        (22 + gv * 12) * light, 0.62)
    }

    for (let i = 0; i < 4; i++) {
      const dx = (hash(i * 23, pad.x * 3) - 0.5) * pad.rx * 0.7
      const dy = (hash(i * 29, pad.y * 3) - 0.5) * pad.ry * 0.5
      fillOval(bR, bG, bB, W, BH, pcx + dx, pad.y + dy - 0.5,
        1.5, 1.0, 55, 125, 35, 0.3)
    }
  }

  for (const leaf of leaves) {
    const wb = Math.sin(t * leaf.speed + leaf.phase) * 2
    const px = leaf.x + wb
    if (leaf.y > soilY + BH * 0.08) continue
    const lr = 110 + leaf.hue * 70
    const lg = 120 + leaf.hue * 40
    const lb = 25 + leaf.hue * 20
    fillOval(bR, bG, bB, W, BH, px, leaf.y, 1.2, 0.8, lr, lg, lb, 0.6)
  }

  const stX = cx + W * 0.10, stY = standY - 1.5
  fillOval(bR, bG, bB, W, BH, stX, stY, 3, 1.8, 105, 100, 92, 0.7)
  fillOval(bR, bG, bB, W, BH, stX - 0.5, stY - 0.5, 2, 1.2, 120, 115, 105, 0.35)

  for (let ty = 0; ty < CH; ty++) {
    for (let x = 0; x < W; x++) {
      const ti = ty * 2 * W + x
      const bi = (ty * 2 + 1) * W + x
      canvas.setCell(x, ty, '▀',
        hex(c2h(bR[ti], bG[ti], bB[ti])),
        bgHex(c2h(bR[bi], bG[bi], bB[bi])))
    }
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  const { leaves, rng, cx, topY, treeH, soilY, BH } = state
  for (const leaf of leaves) {
    leaf.x += leaf.vx + Math.sin(frame.elapsed * leaf.speed + leaf.phase) * 0.12
    leaf.y += leaf.vy
    if (leaf.y > soilY + BH * 0.08)
      Object.assign(leaf, spawnLeaf(rng, cx, topY, treeH * 0.5))
  }
  draw(canvas, state, frame.elapsed)
}
