import { hex, bgHex, lerp, lerpMulti } from '../src/theme.js'

export const title = 'Pendulum Wave'
export const description = 'Fifteen pendulums drift between chaos and harmony — order emerges, dissolves, and returns again'
export const fps = 2

const N = 15
const SWING = 0.24

const BOBS = [
  '#ffd54f', '#ffb74d', '#ff9a4d', '#ff7c5a', '#ff5e6e',
  '#f44486', '#d63da0', '#b740b8', '#9548cc', '#7250dd',
  '#5762e8', '#4078e8', '#338fdd', '#33a5c8', '#40b8aa',
]

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function pos(p, t) {
  const th = SWING * Math.cos(2 * Math.PI * t / p.T)
  return [p.x0 + p.L * Math.sin(th), p.y0 + p.L * Math.cos(th)]
}

export function setup(canvas) {
  const w = canvas.width, h = canvas.height
  const barY = Math.floor(h * 0.08)
  const mx = Math.floor(w * 0.14)
  const sp = (w - 2 * mx) / (N - 1)

  const base = 20, cyc = 60
  const maxL = Math.floor(h * 0.52), minL = Math.floor(h * 0.36)
  const tHi = cyc / base, tLo = cyc / (base + N - 1)

  const pends = []
  for (let i = 0; i < N; i++) {
    const T = cyc / (base + i)
    const f = (T - tLo) / (tHi - tLo)
    pends.push({ x0: Math.floor(mx + sp * i), y0: barY + 2, L: minL + f * (maxL - minL), T })
  }

  const rng = srand(903)
  const stars = []
  for (let i = 0; i < 50; i++) {
    const sy = Math.floor(rng() * h)
    if (sy >= barY - 1 && sy <= barY + 3) continue
    stars.push({ x: Math.floor(rng() * w), y: sy, b: rng(), v: 0.4 + rng() * 1.8 })
  }

  return { pends, barY, stars }
}

function draw(canvas, state, t) {
  const w = canvas.width, h = canvas.height
  const { pends, barY, stars } = state

  for (let y = 0; y < h; y++) {
    const bg = lerpMulti(['#040410', '#08081c', '#060616', '#040410'], y / h)
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, bgHex(bg))
  }

  for (const s of stars) {
    const fl = 0.3 + 0.7 * Math.sin(t * s.v + s.b * 25)
    const v = Math.floor(22 + fl * 48)
    canvas.setCell(s.x, s.y, s.b > 0.78 ? '✦' : '·', hex(col(v, v, Math.min(255, v + 12))))
  }

  for (let x = 0; x < w; x++) {
    canvas.setCell(x, barY,     ' ', null, bgHex('#b89050'))
    canvas.setCell(x, barY + 1, ' ', null, bgHex('#9a7840'))
    canvas.setCell(x, barY + 2, ' ', null, bgHex('#6a5028'))
  }
  for (const p of pends) {
    if (p.x0 >= 0 && p.x0 < w) canvas.setCell(p.x0, barY + 1, '◆', hex('#ddc080'))
  }

  for (let i = 0; i < N; i++) {
    const p = pends[i]
    const [bx, by] = pos(p, t)
    const rx = Math.round(bx), ry = Math.round(by)

    for (let tr = 5; tr >= 1; tr--) {
      const [px, py] = pos(p, t - tr * 0.15)
      const prx = Math.round(px), pry = Math.round(py)
      if (prx >= 0 && prx < w && pry >= 0 && pry < h) {
        canvas.setCell(prx, pry, '•', hex(lerp('#08081c', BOBS[i], (6 - tr) / 6 * 0.3)))
      }
    }

    canvas.drawLine(p.x0, p.y0, rx, ry, '·', hex('#333348'))

    if (rx >= 0 && rx < w && ry >= 0 && ry < h) {
      const gc = lerp(BOBS[i], '#040410', 0.65)
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const gx = rx + dx, gy = ry + dy
        if (gx >= 0 && gx < w && gy >= 0 && gy < h) canvas.setCell(gx, gy, '·', hex(gc))
      }
      canvas.setCell(rx, ry, '●', hex(BOBS[i]))
    }
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
