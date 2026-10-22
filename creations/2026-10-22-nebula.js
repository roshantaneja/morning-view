import { lerpMulti, SHADE } from '../src/theme.js'

export const title = 'Nebula'
export const description =
  'Hydrogen glows rose, oxygen breathes teal — somewhere in the dust between the stars, a new sun is stirring'
export const fps = 2

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}

function parseH(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}

function mixH(a, b, t) {
  const [r1, g1, b1] = parseH(a)
  const [r2, g2, b2] = parseH(b)
  return c2h(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const sx = xf * xf * (3 - 2 * xf)
  const sy = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi) + (hash(xi + 1, yi) - hash(xi, yi)) * sx
  const b = hash(xi, yi + 1) + (hash(xi + 1, yi + 1) - hash(xi, yi + 1)) * sx
  return a + (b - a) * sy
}

function fbm(x, y, o) {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < o; i++) { v += a * vnoise(x * f, y * f); a *= 0.5; f *= 2 }
  return v
}

const MAG = ['#060004', '#180820', '#381060', '#6828a0', '#9840c0', '#c860e0', '#e090f8']
const TEA = ['#000608', '#041820', '#0c3850', '#1c6888', '#38a0b8', '#60c8d8', '#98e8f0']
const GLD = ['#040200', '#180c00', '#382808', '#685020', '#987838', '#c0a050', '#e8d080']

const BRIGHT_STARS = [
  { nx: 0.43, ny: 0.34 },
  { nx: 0.57, ny: 0.42 },
  { nx: 0.36, ny: 0.50 },
  { nx: 0.62, ny: 0.30 },
]

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const stars = []
  const n = Math.floor(W * H * 0.005)
  for (let i = 0; i < n; i++) {
    stars.push({
      x: Math.floor(hash(i * 7 + 13, i * 3 + 7) * W),
      y: Math.floor(hash(i * 11 + 5, i * 13 + 3) * H),
      b: 0.3 + hash(i * 17, i * 19) * 0.7,
      s: 0.4 + hash(i * 23, i * 29) * 2.5,
      p: hash(i * 31, i * 37) * 6.283,
      big: hash(i * 41, i * 43) > 0.88,
    })
  }
  return { stars, t: 0 }
}

function draw(canvas, state) {
  const W = canvas.width, H = canvas.height
  const t = state.t
  const dr = t * 0.012

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = x / W, ny = y / H
      const sx = nx * 3.5, sy = ny * 5

      const wx = fbm(sx + 50 + dr, sy + 50, 3) - 0.5
      const wy = fbm(sx + 100, sy + 100 + dr * 0.7, 3) - 0.5
      const wsx = sx + wx * 0.9, wsy = sy + wy * 0.9

      let d = fbm(wsx + dr * 0.3, wsy + dr * 0.2, 4)
      d += fbm(wsx * 2 + 20, wsy * 2 + 20, 3) * 0.25

      const ex = nx - 0.50, ey = (ny - 0.40) * 0.85
      const dist = Math.sqrt(ex * ex + ey * ey)
      d *= Math.pow(Math.max(0, 1 - dist * 1.35), 0.65)

      const dust = fbm(sx * 1.8 + 200, sy * 1.8 + 200 + dr * 0.08, 3)
      if (dust > 0.56) d *= Math.max(0.05, 1 - (dust - 0.56) * 5)

      for (const bs of BRIGHT_STARS) {
        const bd = Math.sqrt((nx - bs.nx) ** 2 + ((ny - bs.ny) * 0.7) ** 2)
        if (bd < 0.05) d += Math.pow(1 - bd / 0.05, 2) * 0.25
      }

      d = Math.max(0, Math.min(1, d * 1.4))

      const reg = fbm(sx * 0.5 + 300, sy * 0.5 + 300, 2)

      let color
      if (d < 0.03) {
        const v = 2 + Math.floor(hash(x, y) * 5)
        const bt = Math.floor(hash(x + 500, y + 500) * 4)
        color = c2h(v, v, v + bt)
      } else if (reg >= 0.33 && reg < 0.37) {
        color = mixH(lerpMulti(MAG, d), lerpMulti(TEA, d), (reg - 0.33) / 0.04)
      } else if (reg >= 0.57 && reg < 0.63) {
        color = mixH(lerpMulti(TEA, d), lerpMulti(GLD, d), (reg - 0.57) / 0.06)
      } else if (reg < 0.35) {
        color = lerpMulti(MAG, d)
      } else if (reg < 0.60) {
        color = lerpMulti(TEA, d)
      } else {
        color = lerpMulti(GLD, d)
      }

      let ch, fg, bg
      if (d < 0.05) {
        ch = ' '; fg = null; bg = color
      } else if (d < 0.18) {
        ch = SHADE[0]; fg = color; bg = c2h(2, 2, 5)
      } else if (d < 0.35) {
        ch = SHADE[1]; fg = color; bg = mixH('#020006', color, 0.25)
      } else if (d < 0.55) {
        ch = SHADE[2]; fg = color; bg = mixH('#020006', color, 0.45)
      } else {
        ch = SHADE[3]; fg = color; bg = color
      }

      canvas.setCell(x, y, ch, fg, bg)
    }
  }

  for (const bs of BRIGHT_STARS) {
    const bx = Math.floor(bs.nx * W), by = Math.floor(bs.ny * H)
    if (bx >= 0 && bx < W && by >= 0 && by < H) {
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.8 + bs.nx * 20)
      const bri = Math.floor(230 * pulse)
      const cell = canvas.getCell(bx, by)
      const bgc = (cell && cell.bg) || '#020006'
      canvas.setCell(bx, by, '★', c2h(bri, bri, Math.min(255, bri + 20)), bgc)
    }
  }

  for (const st of state.stars) {
    if (st.x < 0 || st.x >= W || st.y < 0 || st.y >= H) continue
    const tw = 0.35 + 0.65 * Math.sin(t * st.s + st.p)
    const bri = Math.floor(st.b * tw * 255)
    if (bri < 25) continue
    const cell = canvas.getCell(st.x, st.y)
    const bgc = (cell && cell.bg) || '#020006'
    canvas.setCell(st.x, st.y, st.big ? '✦' : '·', c2h(bri, bri, Math.min(255, bri + 25)), bgc)
  }
}

export function render(canvas, data, state) { draw(canvas, state) }

export function update(canvas, data, frame, state) {
  state.t = frame.elapsed
  draw(canvas, state)
}
