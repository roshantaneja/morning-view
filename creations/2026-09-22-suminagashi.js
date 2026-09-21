import { hex, bgHex, lerp } from '../src/theme.js'

export const title = 'Suminagashi'
export const description = 'Ink dropped on still water draws itself into rivers — each whorl a fingerprint of the current beneath'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const INKS = [
  { r: 20, g: 14, b: 56 },
  { r: 100, g: 22, b: 44 },
  { r: 24, g: 68, b: 58 },
  { r: 120, g: 88, b: 28 },
  { r: 44, g: 20, b: 72 },
]

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(922)

  const drops = []
  const N = 10 + Math.floor(rng() * 3)
  for (let i = 0; i < N; i++) {
    drops.push({
      cx: W * 0.05 + rng() * W * 0.9,
      cy: H * 0.05 + rng() * H * 0.9,
      freq: 0.06 + rng() * 0.12,
      ink: INKS[i % INKS.length],
      phase: rng() * TAU,
    })
  }

  return { W, H, drops }
}

function distort(x, y, t) {
  const dx = Math.sin(x * 0.020 + t * 0.10) * 16
           + Math.sin(y * 0.032 + t * 0.06 + 1.7) * 10
           + Math.sin(x * 0.050 + y * 0.025 - t * 0.08) * 6
           + Math.cos(x * 0.011 - y * 0.016 + t * 0.035) * 20
  const dy = Math.sin(y * 0.023 + t * 0.07) * 14
           + Math.sin(x * 0.037 - t * 0.04 + 2.3) * 9
           + Math.sin(y * 0.055 + x * 0.016 + t * 0.06) * 5
           + Math.cos(y * 0.013 + x * 0.020 - t * 0.05) * 18
  return [x + dx, y + dy]
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }
export function update(canvas, data, frame, state) { drawScene(canvas, state, frame.elapsed) }

function drawScene(canvas, state, t) {
  const { W, H, drops } = state

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [fx, fy] = distort(x, y, t)

      let totalVein = 0
      let vr = 0, vg = 0, vb = 0

      for (const drop of drops) {
        const ddx = fx - drop.cx
        const ddy = fy - drop.cy
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        const ring = Math.sin(dist * drop.freq + drop.phase + t * 0.15)
        const vein = Math.pow(Math.max(0, 1 - Math.abs(ring) * 3.2), 1.5)

        if (vein > 0.01) {
          vr += drop.ink.r * vein
          vg += drop.ink.g * vein
          vb += drop.ink.b * vein
          totalVein += vein
        }
      }

      const pn = (Math.sin(x * 0.19 + y * 0.27) * Math.sin(x * 0.11 - y * 0.14) + 1) * 0.5
      const paper = lerp('#e8e0cc', '#f5ede0', pn)

      if (totalVein > 0.05) {
        const inkCol = col(vr / totalVein, vg / totalVein, vb / totalVein)
        const strength = Math.min(1, totalVein * 0.85)
        const blended = lerp(paper, inkCol, strength)
        canvas.setCell(x, y, ' ', null, bgHex(blended))
      } else {
        canvas.setCell(x, y, ' ', null, bgHex(paper))
      }
    }
  }
}
