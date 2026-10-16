import { lerpMulti, BOX, SHADE } from '../src/theme.js'

export const title = 'Bismuth'
export const description =
  'Staircase crystals grown from cooling metal — each iridescent step a different thickness of oxide, a different stolen wavelength of light'
export const fps = 2

const IRIS = [
  '#D4A740', '#D87850', '#D04878', '#A838B0',
  '#6838C8', '#3058E0', '#2098C8', '#30B090',
  '#58C058', '#A0C040', '#D4A740',
]

function iriColor(t) {
  return lerpMulti(IRIS, ((t % 1) + 1) % 1)
}

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}

function darken(h, f) {
  return c2h(
    parseInt(h.slice(1, 3), 16) * f,
    parseInt(h.slice(3, 5), 16) * f,
    parseInt(h.slice(5, 7), 16) * f,
  )
}

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function drawRect(canvas, x, y, w, h, fg) {
  if (w < 2 || h < 2) return
  const W = canvas.width, H = canvas.height
  const b = BOX.heavy
  const ok = (xx, yy) => xx >= 0 && xx < W && yy >= 0 && yy < H

  if (ok(x, y)) canvas.setCell(x, y, b.tl, fg)
  if (ok(x + w - 1, y)) canvas.setCell(x + w - 1, y, b.tr, fg)
  if (ok(x, y + h - 1)) canvas.setCell(x, y + h - 1, b.bl, fg)
  if (ok(x + w - 1, y + h - 1)) canvas.setCell(x + w - 1, y + h - 1, b.br, fg)
  for (let i = 1; i < w - 1; i++) {
    if (ok(x + i, y)) canvas.setCell(x + i, y, b.h, fg)
    if (ok(x + i, y + h - 1)) canvas.setCell(x + i, y + h - 1, b.h, fg)
  }
  for (let j = 1; j < h - 1; j++) {
    if (ok(x, y + j)) canvas.setCell(x, y + j, b.v, fg)
    if (ok(x + w - 1, y + j)) canvas.setCell(x + w - 1, y + j, b.v, fg)
  }
}

function drawCrystal(canvas, cr, t) {
  const { cx, cy, w, h, steps, dx, dy, phase } = cr
  const W = canvas.width, H = canvas.height

  for (let i = 0; i < steps; i++) {
    const frac = i / steps
    const sw = Math.max(3, Math.round(w * (1 - frac * 0.9)))
    const sh = Math.max(2, Math.round(h * (1 - frac * 0.9)))
    const sx = Math.round(cx - sw / 2 + i * dx)
    const sy = Math.round(cy - sh / 2 + i * dy)

    const colorT = frac * 0.85 + phase + t * 0.05
    const edgeCol = iriColor(colorT)
    const fillBg = darken(iriColor(colorT + 0.02), 0.25)
    const fillFg = darken(edgeCol, 0.5)

    if (i < steps - 2) {
      for (let yy = sy + 1; yy < sy + sh - 1; yy++) {
        for (let xx = sx + 1; xx < sx + sw - 1; xx++) {
          if (xx >= 0 && xx < W && yy >= 0 && yy < H) {
            canvas.setCell(xx, yy, SHADE[0], fillFg, fillBg)
          }
        }
      }
    }

    drawRect(canvas, sx, sy, sw, sh, edgeCol)
  }
}

function drawScene(canvas, state) {
  const W = canvas.width, H = canvas.height
  const t = state.time

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = hash(x, y)
      const v = 5 + Math.floor(n * 10)
      canvas.setCell(x, y, ' ', null, c2h(v, v + 1, v + 3))

      if (hash(x + 999, y + 777) > 0.993) {
        const bri = 35 + Math.floor(Math.sin(t * 1.5 + x * 0.3 + y * 0.7) * 20 + 20)
        canvas.setCell(x, y, '·', c2h(bri, bri, bri + 8))
      }
    }
  }

  const sorted = [...state.crystals].sort((a, b) => (b.w * b.h) - (a.w * a.h))
  for (const cr of sorted) {
    drawCrystal(canvas, cr, t)
  }
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  return {
    crystals: [
      { cx: W * 0.42, cy: H * 0.33, w: W * 0.52, h: H * 0.44, steps: 14, dx: 1.1, dy: 0.8, phase: 0 },
      { cx: W * 0.74, cy: H * 0.63, w: W * 0.32, h: H * 0.28, steps: 9, dx: -1.0, dy: 0.9, phase: 0.33 },
      { cx: W * 0.20, cy: H * 0.70, w: W * 0.26, h: H * 0.22, steps: 8, dx: 0.8, dy: -0.7, phase: 0.55 },
      { cx: W * 0.76, cy: H * 0.16, w: W * 0.18, h: H * 0.15, steps: 5, dx: -0.9, dy: 0.8, phase: 0.15 },
      { cx: W * 0.12, cy: H * 0.16, w: W * 0.14, h: H * 0.12, steps: 4, dx: 0.8, dy: 0.8, phase: 0.7 },
    ],
    time: 0,
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state)
}

export function update(canvas, data, frame, state) {
  state.time = frame.elapsed
  drawScene(canvas, state)
}
