import { hex, bgHex, SHADE } from '../src/theme.js'

export const title = 'Autumn Canopy'
export const description = 'Lie back on the forest floor and look up — the September sky burns amber through the last turning leaves'
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

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  return (hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx) * (1 - sy) +
         (hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx) * sy
}

function fbm(x, y, oct) {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < oct; i++) { v += smoothNoise(x * f, y * f) * a; a *= 0.5; f *= 2 }
  return v
}

const LEAVES = [
  [185, 35, 20], [210, 50, 25], [195, 40, 18],
  [225, 85, 30], [240, 105, 40], [205, 70, 28],
  [225, 145, 48], [240, 160, 58], [215, 130, 42],
  [220, 185, 50], [205, 170, 40], [235, 200, 60],
  [175, 180, 50], [155, 165, 42],
  [78, 130, 48], [68, 120, 42], [88, 140, 55],
]

const LEAF_CHARS = ['•', '·', '°', '*', '♦']

function growBranch(segs, x, y, angle, dist, thick, curve, aspect, W, H, rng, depth) {
  if (depth > 3 || dist < 5) return
  const steps = Math.ceil(dist / 3)
  let px = x, py = y, a = angle
  for (let s = 0; s < steps; s++) {
    const nx = px + Math.cos(a) * 3
    const ny = py + Math.sin(a) * 3 / aspect
    const t = Math.max(1, Math.ceil(thick * (1 - s / steps * 0.7)))
    segs.push({ x1: px, y1: py, x2: nx, y2: ny, thick: t })
    px = nx; py = ny
    a += curve + (rng() - 0.5) * 0.03
    if (s > steps * 0.2 && rng() < 0.09) {
      const sa = a + (rng() > 0.5 ? 1 : -1) * (0.35 + rng() * 0.7)
      growBranch(segs, px, py, sa, dist * (0.2 + rng() * 0.25) * (1 - s / steps),
        Math.max(1, t - 1), (rng() - 0.5) * 0.005, aspect, W, H, rng, depth + 1)
    }
  }
}

function rasterSeg(map, seg, W, H) {
  const { x1, y1, x2, y2, thick } = seg
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const steps = Math.max(1, Math.ceil(len))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = Math.floor(x1 + (x2 - x1) * t)
    const y = Math.floor(y1 + (y2 - y1) * t)
    const halfT = Math.floor(thick / 2)
    for (let dx = -halfT; dx <= halfT; dx++) {
      const px = x + dx
      if (px >= 0 && px < W && y >= 0 && y < H) {
        map[y * W + px] = Math.max(map[y * W + px], thick)
      }
    }
  }
}

function mkLeaf(rng, W, H, fromTop) {
  return {
    x: 4 + rng() * (W - 8),
    y: fromTop ? -1 - rng() * 15 : rng() * H,
    vx: (rng() - 0.5) * 0.7,
    vy: 0.25 + rng() * 0.5,
    wp: rng() * TAU,
    wa: 0.5 + rng() * 1.2,
    wf: 0.04 + rng() * 0.04,
    ch: LEAF_CHARS[Math.floor(rng() * LEAF_CHARS.length)],
    col: LEAVES[Math.floor(rng() * LEAVES.length)]
  }
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(925)
  const aspect = 2.0

  const cx = Math.floor(W * 0.47)
  const cy = Math.floor(H * 0.40)

  const segs = []
  const numMain = 6 + Math.floor(rng() * 3)
  for (let i = 0; i < numMain; i++) {
    const a0 = (TAU / numMain) * i + (rng() - 0.5) * 0.5
    const len = (0.28 + rng() * 0.35) * Math.max(W, H * 0.6)
    growBranch(segs, cx, cy, a0, len, 2 + Math.floor(rng() * 2),
      (rng() - 0.5) * 0.003, aspect, W, H, rng, 0)
  }

  const branchMap = new Uint8Array(W * H)
  for (const s of segs) rasterSeg(branchMap, s, W, H)

  const density = new Float32Array(W * H)
  const colorIdx = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      const nx = x / W * 7 + 50, ny = y / H * 9 + 50
      let d = fbm(nx, ny, 5)

      const dx = (x - cx) / (W * 0.48)
      const dy = (y - cy) / (H * 0.44)
      const r = Math.sqrt(dx * dx + dy * dy)
      d = d * 0.5 + Math.max(0, 1 - Math.abs(r - 0.55) * 2.5) * 0.5

      const gn = fbm(nx * 0.35 + 200, ny * 0.35 + 200, 3)
      if (gn < 0.28) d *= gn / 0.28

      if (branchMap[idx]) d = Math.max(d, 0.42)

      density[idx] = d
      colorIdx[idx] = Math.floor(hash(x * 3.71, y * 2.93) * LEAVES.length)
    }
  }

  const falling = []
  for (let i = 0; i < 16; i++) falling.push(mkLeaf(rng, W, H, false))

  return { W, H, cx, cy, branchMap, density, colorIdx, falling, rng, t: 0 }
}

function draw(canvas, state) {
  const { W, H, branchMap, density, colorIdx, falling, t } = state

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      const d = density[idx]
      const br = branchMap[idx]

      if (br > 0) {
        const bv = 18 + br * 6
        canvas.setCell(x, y, '█', hex(c2h(bv + 12, bv + 4, bv - 2)), bgHex(c2h(bv, bv - 4, bv - 6)))
      } else if (d > 0.30) {
        const lc = LEAVES[colorIdx[idx]]
        const shimmer = (Math.sin(t * 0.5 + x * 0.09 + y * 0.07) + 1) * 0.5
        const glow = shimmer * 0.12
        const fg = c2h(lc[0] + glow * 55, lc[1] + glow * 45, lc[2] + glow * 20)
        const bg = c2h(lc[0] * 0.3, lc[1] * 0.3, lc[2] * 0.25)
        const ch = d > 0.68 ? SHADE[3] : d > 0.56 ? SHADE[2] : d > 0.44 ? SHADE[1] : d > 0.36 ? SHADE[0] : '·'
        canvas.setCell(x, y, ch, hex(fg), bgHex(bg))
      } else {
        const sy = y / H
        const edgeMix = d / 0.30
        const warmth = edgeMix * 0.3
        const sky = c2h(
          55 + sy * 45 + warmth * 95,
          110 + sy * 35 + warmth * 55,
          195 + sy * 20 - warmth * 65
        )
        canvas.setCell(x, y, ' ', null, bgHex(sky))
      }
    }
  }

  for (const l of falling) {
    const lx = Math.floor(l.x), ly = Math.floor(l.y)
    if (lx >= 1 && lx < W - 1 && ly >= 0 && ly < H - 3) {
      canvas.setCell(lx, ly, l.ch, hex(c2h(l.col[0], l.col[1], l.col[2])))
    }
  }
}

export function render(canvas, data, state) {
  draw(canvas, state)
}

export function update(canvas, data, frame, state) {
  state.t += 0.15
  for (const l of state.falling) {
    l.wp += l.wf
    l.x += l.vx + Math.sin(l.wp) * l.wa * 0.3
    l.y += l.vy
    if (l.y > state.H + 2 || l.x < -3 || l.x > state.W + 3) {
      Object.assign(l, mkLeaf(state.rng, state.W, state.H, true))
    }
  }
  draw(canvas, state)
}
