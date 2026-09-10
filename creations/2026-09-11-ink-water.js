import { lerpMulti } from '../src/theme.js'

export const title = 'Ink in Water'
export const description = 'Drops of pigment bloom through still water — each tendril finding its own way'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function clr(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function makeNoise(size, rng) {
  const d = new Array(size * size)
  for (let i = 0; i < d.length; i++) d[i] = rng()
  return { d, size }
}

function sampleNoise(n, x, y) {
  const s = n.size
  const ix = ((Math.floor(x) % s) + s) % s
  const iy = ((Math.floor(y) % s) + s) % s
  const x1 = (ix + 1) % s, y1 = (iy + 1) % s
  const fx = x - Math.floor(x), fy = y - Math.floor(y)
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = n.d[iy * s + ix], b = n.d[iy * s + x1]
  const c = n.d[y1 * s + ix], dd = n.d[y1 * s + x1]
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + dd) * sx * sy
}

function fbm(n, x, y, oct) {
  let v = 0, amp = 1, freq = 1, total = 0
  for (let i = 0; i < oct; i++) {
    v += sampleNoise(n, x * freq, y * freq) * amp
    total += amp; amp *= 0.5; freq *= 2
  }
  return v / total
}

const INKS = [
  { r: 215, g: 38, b: 65 },
  { r: 25, g: 68, b: 195 },
  { r: 45, g: 180, b: 105 },
  { r: 195, g: 125, b: 22 },
]

const WATER = ['#020407', '#03060e', '#040814', '#050b1a']

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(911)
  const noise = makeNoise(64, rng)

  const drops = INKS.map((ink, i) => ({
    ...ink,
    cx: Math.floor(W * (0.28 + (i % 2) * 0.44) + (rng() - 0.5) * W * 0.06),
    cy: Math.floor(H * (0.2 + Math.floor(i / 2) * 0.38) + (rng() - 0.5) * H * 0.05),
    radius: Math.floor(Math.min(W, H) * (0.22 + rng() * 0.05)),
    ns: rng() * 100,
    ph: rng() * TAU,
  }))

  const bubbles = Array.from({ length: 25 }, () => ({
    x: Math.floor(rng() * W),
    y: Math.floor(rng() * H),
    ph: rng() * TAU,
    sp: 0.4 + rng() * 1.2,
  }))

  return { drops, noise, bubbles, W, H }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const { drops, noise, bubbles, W, H } = state
  const shades = ['·', '░', '▒', '▓', '█']

  for (let y = 0; y < H; y++) {
    const bg = lerpMulti(WATER, y / H)

    for (let x = 0; x < W; x++) {
      let tR = 0, tG = 0, tB = 0, tA = 0

      for (const drop of drops) {
        const dx = x - drop.cx
        const dy = (y - drop.cy) * 1.9
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > drop.radius * 1.6) continue

        const ang = Math.atan2(dy, dx)
        const s = drop.ns

        const n1 = fbm(noise, Math.cos(ang) * 4 + s, Math.sin(ang) * 4 + s + t * 0.015, 3) - 0.5
        const n2 = fbm(noise, Math.cos(ang * 4) * 6 + s + 30, Math.sin(ang * 4) * 6 + s + 30 + t * 0.01, 3) - 0.5
        const n3 = fbm(noise, Math.cos(ang * 9) * 9 + s + 70, Math.sin(ang * 9) * 9 + s + 70, 2) - 0.5

        const pulse = Math.sin(t * 0.4 + drop.ph) * 0.07
        const mod = 1 + n1 * 0.5 + n2 * 0.32 + n3 * 0.18 + pulse
        const maxR = drop.radius * mod

        if (dist < maxR) {
          const ratio = dist / maxR
          const alpha = Math.pow(1 - ratio, 1.5)
          const core = Math.pow(Math.max(0, 1 - dist / (drop.radius * 0.2)), 2.5)
          const bright = Math.min(1.4, alpha + core * 0.5)
          tR += drop.r * bright
          tG += drop.g * bright
          tB += drop.b * bright
          tA += bright
        }
      }

      if (tA > 0.04) {
        const inv = 1 / tA
        const r = Math.min(255, Math.round(tR * inv))
        const g = Math.min(255, Math.round(tG * inv))
        const b = Math.min(255, Math.round(tB * inv))
        const ci = Math.min(shades.length - 1, Math.floor(Math.min(tA, 1) * shades.length))
        canvas.setCell(x, y, shades[ci], clr(r, g, b), bg)
      } else {
        canvas.setCell(x, y, ' ', null, bg)
      }
    }
  }

  for (const bub of bubbles) {
    const v = 0.3 + Math.sin(t * bub.sp + bub.ph) * 0.35
    if (v > 0.4) {
      const c = Math.floor(25 + v * 45)
      canvas.setCell(bub.x, bub.y, '·', clr(c, c + 12, c + 25))
    }
  }
}
