export const title = 'Morphogenesis'
export const description = 'Two chemicals, patient and invisible, teaching themselves to draw — the same math that paints the leopard and tiles the nautilus'
export const fps = 2

const F = 0.035
const K = 0.065
const DU = 0.16
const DV = 0.08
const STEPS = 4
const WARMUP = 800

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v }

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function cb(n) { return Math.max(0, Math.min(255, Math.round(n))) }
function c2h(r, g, b) {
  return '#' + cb(r).toString(16).padStart(2, '0')
             + cb(g).toString(16).padStart(2, '0')
             + cb(b).toString(16).padStart(2, '0')
}

const PAL = [
  [6, 8, 24],
  [10, 22, 48],
  [16, 44, 62],
  [24, 72, 74],
  [42, 104, 80],
  [88, 128, 66],
  [148, 132, 56],
  [192, 128, 56],
  [224, 144, 78],
  [240, 188, 128],
  [248, 225, 185],
]

function vColor(val) {
  const t = clamp01(val * 3.5) * (PAL.length - 1)
  const i = Math.min(Math.floor(t), PAL.length - 2)
  const frac = t - i
  const a = PAL[i], b = PAL[i + 1]
  return c2h(a[0] + (b[0] - a[0]) * frac,
             a[1] + (b[1] - a[1]) * frac,
             a[2] + (b[2] - a[2]) * frac)
}

function sim(u, v, uo, vo, W, H) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      const uc = u[idx], vc = v[idx]
      const lu = u[((y - 1 + H) % H) * W + x] + u[((y + 1) % H) * W + x]
               + u[y * W + ((x - 1 + W) % W)] + u[y * W + ((x + 1) % W)] - 4 * uc
      const lv = v[((y - 1 + H) % H) * W + x] + v[((y + 1) % H) * W + x]
               + v[y * W + ((x - 1 + W) % W)] + v[y * W + ((x + 1) % W)] - 4 * vc
      const uvv = uc * vc * vc
      uo[idx] = clamp01(uc + DU * lu - uvv + F * (1 - uc))
      vo[idx] = clamp01(vc + DV * lv + uvv - (F + K) * vc)
    }
  }
}

export function setup(canvas) {
  const W = canvas.width
  const SH = canvas.height * 2
  const size = W * SH
  const rng = srand(1015)

  let u = new Float32Array(size).fill(1)
  let v = new Float32Array(size).fill(0)
  let uo = new Float32Array(size)
  let vo = new Float32Array(size)

  const n = 18 + Math.floor(rng() * 8)
  for (let p = 0; p < n; p++) {
    const cx = 8 + Math.floor(rng() * (W - 16))
    const cy = 8 + Math.floor(rng() * (SH - 16))
    const r = 2 + Math.floor(rng() * 4)
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const nx = cx + dx, ny = cy + dy
          if (nx >= 0 && nx < W && ny >= 0 && ny < SH) {
            const idx = ny * W + nx
            u[idx] = 0.5 + rng() * 0.1
            v[idx] = 0.25 + rng() * 0.05
          }
        }
      }
    }
  }

  for (let i = 0; i < WARMUP; i++) {
    sim(u, v, uo, vo, W, SH)
    ;[u, uo] = [uo, u]
    ;[v, vo] = [vo, v]
  }

  return { u, v, uo, vo, W, SH }
}

function draw(canvas, v, W) {
  const H = canvas.height
  for (let ty = 0; ty < H; ty++) {
    for (let x = 0; x < W; x++) {
      const top = vColor(v[(ty * 2) * W + x])
      const bot = vColor(v[(ty * 2 + 1) * W + x])
      canvas.setCell(x, ty, '▀', top, bot)
    }
  }
}

export function render(canvas, data, state) {
  draw(canvas, state.v, state.W)
}

export function update(canvas, data, frame, state) {
  for (let i = 0; i < STEPS; i++) {
    sim(state.u, state.v, state.uo, state.vo, state.W, state.SH)
    ;[state.u, state.uo] = [state.uo, state.u]
    ;[state.v, state.vo] = [state.vo, state.v]
  }
  draw(canvas, state.v, state.W)
}
