import { lerpMulti, lerp } from '../src/theme.js'

export const title = 'Iridescence'
export const description = 'Thin films of light divide worlds of color, each wall a captured rainbow'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SPECTRUM = ['#6600cc', '#0044ff', '#00aacc', '#00cc44', '#aacc00', '#ff8800', '#ff2200', '#cc0066', '#6600cc']

const BASES = [
  '#1a0840', '#0c1858', '#083830', '#3a0a18', '#302a02',
  '#0c3040', '#2a0a38', '#143018', '#2a1808', '#0c2040',
  '#221058', '#0c3030', '#320c1a', '#2a2204', '#082048',
]

export function setup(canvas) {
  const rng = srand(808)
  const w = canvas.width
  const h = canvas.height

  const n = Math.max(18, Math.min(40, Math.floor(w * h / 380)))
  const seeds = []
  for (let i = 0; i < n; i++) {
    seeds.push({
      x: rng() * w,
      y: rng() * h,
      px: rng() * 6.283,
      py: rng() * 6.283,
      fx: 0.025 + rng() * 0.06,
      fy: 0.025 + rng() * 0.06,
      ax: 1.5 + rng() * 4,
      ay: 0.8 + rng() * 2.2,
      base: BASES[Math.floor(rng() * BASES.length)],
      phase: rng() * 6.283,
    })
  }

  return { seeds }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height
  const { seeds } = state

  const cx = new Float64Array(seeds.length)
  const cy = new Float64Array(seeds.length)
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]
    cx[i] = s.x + Math.sin(t * s.fx + s.px) * s.ax
    cy[i] = s.y + Math.sin(t * s.fy + s.py) * s.ay
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let d1 = Infinity, d2 = Infinity, idx = 0

      for (let i = 0; i < seeds.length; i++) {
        const dx = x - cx[i]
        const dy = (y - cy[i]) * 1.8
        const d = dx * dx + dy * dy
        if (d < d1) { d2 = d1; d1 = d; idx = i }
        else if (d < d2) d2 = d
      }

      d1 = Math.sqrt(d1)
      d2 = Math.sqrt(d2)

      const edge = (d2 - d1) / (d2 + d1 + 0.001)
      const s = seeds[idx]

      const irisT = ((d1 * 0.09 + t * 0.12 + s.phase) % 1 + 1) % 1
      const irisColor = lerpMulti(SPECTRUM, irisT)
      const irisStr = Math.max(0, 1 - edge * 7) * 0.5
      let color = lerp(s.base, irisColor, irisStr)

      const depth = Math.min(1, edge * 5)
      color = lerp('#010103', color, 0.2 + depth * 0.8)

      const hlAngle = Math.atan2(y - cy[idx], x - cx[idx])
      const hl = Math.pow(Math.max(0, Math.cos(hlAngle - 0.7 - t * 0.035)), 10)
      const hlDist = Math.max(0, 1 - d1 / 9)
      const hlStr = hl * hlDist * 0.55
      if (hlStr > 0.01) color = lerp(color, '#e0e8f8', hlStr)

      let ch = ' ', fg = null
      if (edge < 0.04) {
        const wallStr = 1 - edge / 0.04
        color = lerp(color, '#8898a8', wallStr * 0.6)
        if (wallStr > 0.4) {
          ch = '·'
          fg = lerp('#8898a8', '#c0d0e0', wallStr)
        }
      }

      canvas.setCell(x, y, ch, fg, color)
    }
  }
}
