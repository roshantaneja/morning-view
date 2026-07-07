import { lerpMulti, SHADE } from '../src/theme.js'

export const title = 'Tidal Loom'
export const description = 'Interference fringes weave through overlapping wave fields'
export const fps = 2

const PALETTE = [
  '#02010c', '#06021e', '#0c0438', '#140854',
  '#1c1070', '#241c8c', '#2c28a4', '#3038b8',
  '#304cc4', '#3064cc', '#3080cc', '#389cc4',
  '#48b4b8', '#60c8a8', '#80dc98', '#a8f088',
  '#d8fcc0', '#f4fff0',
]

const BG_PALETTE = [
  '#01000a', '#030114', '#060220', '#0a042a',
  '#0e0838', '#120e46', '#161454', '#181c5c',
  '#1a2662', '#1a3268', '#1a406a', '#1c4e64',
  '#265a5c', '#306454', '#40704c', '#547844',
  '#6c7e60', '#7a8078',
]

const ASPECT = 2.0

export function setup(canvas) {
  return { phase: 0 }
}

export function render(canvas, data, state) {
  const w = canvas.width
  const h = canvas.height
  const p = state ? state.phase : 0

  const base = p * 0.12
  const a1 = base
  const a2 = base + Math.PI * 2 / 3
  const a3 = base + Math.PI * 4 / 3

  const cos1 = Math.cos(a1), sin1 = Math.sin(a1)
  const cos2 = Math.cos(a2), sin2 = Math.sin(a2)
  const cos3 = Math.cos(a3), sin3 = Math.sin(a3)

  const f1 = 0.16, f2 = 0.19, f3 = 0.22
  const p1 = p * 0.20, p2 = p * 0.14, p3 = p * 0.26

  for (let y = 0; y < h; y++) {
    const wy = y * ASPECT
    for (let x = 0; x < w; x++) {
      const v1 = Math.sin((x * cos1 + wy * sin1) * f1 + p1)
      const v2 = Math.sin((x * cos2 + wy * sin2) * f2 + p2)
      const v3 = Math.sin((x * cos3 + wy * sin3) * f3 + p3)

      const raw = (v1 + v2 + v3 + 3) / 6

      const nx = (x / w - 0.5) * 2
      const ny = (y / h - 0.5) * 2
      const vig = Math.max(0, 1 - (nx * nx + ny * ny) * 0.22)

      const t = Math.max(0, Math.min(1, raw * vig))

      const fg = lerpMulti(PALETTE, t)
      const bg = lerpMulti(BG_PALETTE, t)

      let char
      if (t < 0.10) char = ' '
      else if (t < 0.25) char = SHADE[0]
      else if (t < 0.45) char = SHADE[1]
      else if (t < 0.65) char = SHADE[2]
      else char = SHADE[3]

      canvas.setCell(x, y, char, fg, bg)
    }
  }
}

export function update(canvas, data, frame, state) {
  state.phase += 0.05
}
