import { hex, bgHex, lerpMulti, hexToRgb, BLOCK } from '../src/theme.js'

export const title = 'Star Trails'
export const description = 'The patient camera watches the heavens wheel — in each arc of light, the memory of a star'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + clamp(r).toString(16).padStart(2, '0') +
               clamp(g).toString(16).padStart(2, '0') +
               clamp(b).toString(16).padStart(2, '0')
}

const SPECTRAL = ['#aaccff', '#d0e4ff', '#ffffff', '#fff4dd', '#ffcc88', '#ff9966', '#ff7744']

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(923)

  const poleX = Math.floor(W * 0.47)
  const poleY = Math.floor(H * 0.26)
  const aspect = 2.0

  const stars = []
  for (let i = 0; i < 110; i++) {
    const radius = 2 + rng() * 44
    const c = lerpMulti(SPECTRAL, rng())
    const [cr, cg, cb] = hexToRgb(c)
    stars.push({
      radius,
      a0: rng() * TAU,
      bright: 0.15 + rng() * 0.85,
      thick: rng() > 0.82 ? 2 : 1,
      cr, cg, cb,
    })
  }
  stars.sort((a, b) => a.radius - b.radius)

  const tree1 = []
  for (let x = 0; x < W; x++) {
    let h = H * 0.79
    h += Math.sin(x * 0.025 + 0.5) * H * 0.04
    h += Math.sin(x * 0.065 + 1.8) * H * 0.022
    const sp = Math.sin(x * 0.38) * Math.sin(x * 0.17 + 0.3)
    if (sp > 0.3) h -= sp * H * 0.05
    tree1.push(Math.floor(h))
  }

  const tree2 = []
  for (let x = 0; x < W; x++) {
    let h = H * 0.86
    h += Math.sin(x * 0.03 + 3.1) * H * 0.028
    h += Math.sin(x * 0.085 + 0.7) * H * 0.016
    const sp = Math.sin(x * 0.33 + 1.5) * Math.sin(x * 0.21 + 2.1)
    if (sp > 0.25) h -= sp * H * 0.048
    tree2.push(Math.floor(h))
  }

  const meteors = []
  for (let i = 0; i < 5; i++) {
    meteors.push({
      t0: 2 + rng() * 30,
      x0: Math.floor(W * 0.08 + rng() * W * 0.84),
      y0: Math.floor(H * 0.04 + rng() * H * 0.32),
      dx: (rng() - 0.4) * 30,
      dy: (0.3 + rng() * 0.7) * 20,
      len: 5 + Math.floor(rng() * 12),
      dur: 0.5 + rng() * 0.5,
    })
  }

  const glow = new Float32Array(W * H * 3)

  return { W, H, poleX, poleY, aspect, stars, tree1, tree2, meteors, glow }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }
export function update(canvas, data, frame, state) { drawScene(canvas, state, frame.elapsed) }

function drawScene(canvas, state, t) {
  const { W, H, poleX, poleY, aspect, stars, tree1, tree2, meteors, glow } = state

  const rot = t * TAU / 36
  const trail = Math.min(rot, TAU * 0.72)

  glow.fill(0)

  for (const s of stars) {
    const cur = s.a0 + rot
    const st = cur - trail
    const eR = s.radius * aspect
    const step = Math.min(0.05, 1.2 / Math.max(1, eR))
    const inv = 1 / Math.max(0.001, trail)

    for (let a = st; a <= cur; a += step) {
      const sx = Math.round(poleX + Math.cos(a) * eR)
      const sy = Math.round(poleY + Math.sin(a) * s.radius)
      if ((sx >>> 0) >= W || (sy >>> 0) >= H) continue

      const f = (a - st) * inv
      const intensity = s.bright * (0.04 + 0.96 * f * f) * s.thick * 0.2
      const idx = (sy * W + sx) * 3
      glow[idx] += s.cr * intensity
      glow[idx + 1] += s.cg * intensity
      glow[idx + 2] += s.cb * intensity
    }

    const hx = Math.round(poleX + Math.cos(cur) * eR)
    const hy = Math.round(poleY + Math.sin(cur) * s.radius)
    if ((hx >>> 0) < W && (hy >>> 0) < H) {
      const idx = (hy * W + hx) * 3
      const hi = s.bright * s.thick * 0.3
      glow[idx] += s.cr * hi
      glow[idx + 1] += s.cg * hi
      glow[idx + 2] += s.cb * hi
    }
  }

  const me = t % 35
  for (const m of meteors) {
    const dt = me - m.t0
    if (dt < 0 || dt > m.dur) continue
    const prog = dt / m.dur
    for (let i = 0; i < m.len; i++) {
      const f = i / m.len
      const p = prog - f * 0.12
      if (p < 0) continue
      const mx = Math.round(m.x0 + m.dx * p)
      const my = Math.round(m.y0 + m.dy * p)
      if ((mx >>> 0) >= W || (my >>> 0) >= H) continue
      const b = (1 - f) * (1 - prog * 0.5) * 0.65
      const idx = (my * W + mx) * 3
      glow[idx] += 255 * b
      glow[idx + 1] += 240 * b
      glow[idx + 2] += 200 * b
    }
  }

  for (let y = 0; y < H; y++) {
    const yf = y / H
    const bR = 2 + yf * 5
    const bG = 3 + yf * 7
    const bB = 10 + yf * 10

    for (let x = 0; x < W; x++) {
      const mwd = Math.abs(y - (H * 0.43 + (x - W * 0.5) * 0.28)) / (H * 0.13)
      let mr = 0, mg = 0, mb = 0
      if (mwd < 1) {
        const n = (Math.sin(x * 0.14 + y * 0.21) * Math.sin(x * 0.08 - y * 0.12) + 1) * 0.5
        const mi = (1 - mwd * mwd) * 0.04 * (0.4 + n * 0.6)
        mr = 22 * mi; mg = 28 * mi; mb = 42 * mi
      }

      const idx = (y * W + x) * 3
      canvas.setCell(x, y, ' ', null, bgHex(c2h(
        bR + glow[idx] + mr,
        bG + glow[idx + 1] + mg,
        bB + glow[idx + 2] + mb
      )))
    }
  }

  const pp = 0.6 + 0.4 * Math.sin(t * 1.8)
  const pv = Math.floor(160 + 95 * pp)
  if (poleX < W && poleY < H) {
    canvas.setCell(poleX, poleY, '✦', hex(c2h(pv, pv, Math.min(255, pv + 25))))
  }

  for (let x = 0; x < W; x++) {
    const top = tree1[x]
    const bot = Math.min(H, tree2[x])
    for (let y = top; y < bot; y++) {
      if (y === top) canvas.setCell(x, y, BLOCK.upper, hex('#0c140c'))
      else canvas.setCell(x, y, ' ', null, bgHex('#070f07'))
    }
  }

  for (let x = 0; x < W; x++) {
    const top = tree2[x]
    for (let y = top; y < H; y++) {
      if (y === top) canvas.setCell(x, y, BLOCK.upper, hex('#050905'))
      else canvas.setCell(x, y, ' ', null, bgHex('#020402'))
    }
  }
}
