import { lerp, lerpMulti, BLOCK } from '../src/theme.js'

export const title = 'Saharan Twilight'
export const description = 'Endless dunes hold the last warmth of day as the first stars begin their watch'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const FS = [35, 22, 48]
const FL = [100, 68, 78]
const NS = [90, 48, 24]
const NL = [225, 170, 65]

function sand(d, li) {
  const sr = FS[0] + (NS[0] - FS[0]) * d
  const sg = FS[1] + (NS[1] - FS[1]) * d
  const sb = FS[2] + (NS[2] - FS[2]) * d
  const lr = FL[0] + (NL[0] - FL[0]) * d
  const lg = FL[1] + (NL[1] - FL[1]) * d
  const lb = FL[2] + (NL[2] - FL[2]) * d
  return col(
    Math.max(0, Math.min(255, Math.floor(sr + (lr - sr) * li))),
    Math.max(0, Math.min(255, Math.floor(sg + (lg - sg) * li))),
    Math.max(0, Math.min(255, Math.floor(sb + (lb - sb) * li)))
  )
}

export function setup(canvas) {
  const rng = srand(829)
  const w = canvas.width, h = canvas.height
  const horizon = Math.floor(h * 0.37)

  const stars = []
  for (let i = 0; i < Math.floor(w * 0.55); i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * (horizon - 3) + 1),
      bri: 0.1 + rng() * 0.9,
      sp: 0.3 + rng() * 1.8,
      ph: rng() * Math.PI * 2,
      big: rng() > 0.9,
    })
  }

  const shooters = []
  for (let i = 0; i < 4; i++) {
    shooters.push({
      x0: Math.floor(w * (0.15 + rng() * 0.5)),
      y0: Math.floor(3 + rng() * horizon * 0.35),
      len: 5 + Math.floor(rng() * 7),
      dir: rng() > 0.5 ? 1 : -1,
      per: 22 + rng() * 38,
      off: rng() * 60,
    })
  }

  const dunes = []
  for (let i = 0; i < 7; i++) {
    const d = i / 6
    dunes.push({
      base: horizon + Math.floor((h - horizon) * (0.03 + d * 0.50)),
      amp: 2 + Math.floor(d * d * 22),
      f1: 0.008 + rng() * 0.012, a1: 0.5 + rng() * 0.35,
      f2: 0.02 + rng() * 0.018,  a2: 0.2 + rng() * 0.15,
      f3: 0.05 + rng() * 0.04,   a3: 0.05 + rng() * 0.08,
      sh: rng() * 200,
      ws: d * 0.4,
      d,
      rip: d > 0.2,
      rf: 0.2 + rng() * 0.35,
    })
  }

  const particles = []
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: rng(), y: 0.55 + rng() * 0.40,
      vx: 0.004 + rng() * 0.012,
      ph: rng() * Math.PI * 2,
      bri: 0.2 + rng() * 0.5,
    })
  }

  return { stars, shooters, dunes, particles, horizon }
}

function prof(dune, x) {
  const v = x + dune.sh
  return dune.a1 * Math.sin(v * dune.f1)
       + dune.a2 * Math.sin(v * dune.f2 + 1.7)
       + dune.a3 * Math.sin(v * dune.f3 + 3.1)
}

function draw(c, s, t) {
  const w = c.width, h = c.height

  const skyC = ['#050015', '#080022', '#0e083a', '#16105a', '#221870',
                '#302878', '#443570', '#5a4560', '#7a5848', '#9c6c30', '#bb8018']
  for (let y = 0; y < h; y++) {
    const yt = Math.min(1, y / Math.max(1, s.horizon + 3))
    const bg = lerpMulti(skyC, yt)
    for (let x = 0; x < w; x++) c.setCell(x, y, ' ', null, bg)
  }

  const sgx = Math.floor(w * 0.12), sgy = s.horizon - 1
  const sgR = Math.floor(Math.min(w, h) * 0.26)
  for (let dy = -sgR; dy <= 4; dy++) {
    for (let dx = -sgR; dx <= sgR; dx++) {
      const px = sgx + dx, py = sgy + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const d = Math.sqrt(dx * dx + (dy * 1.2) * (dy * 1.2))
      if (d >= sgR) continue
      const f = Math.pow(1 - d / sgR, 2.8) * 0.16
      if (f < 0.004) continue
      const cell = c.getCell(px, py)
      if (cell && cell.bg)
        c.setCell(px, py, ' ', null, lerp(cell.bg, '#ff6a10', f))
    }
  }

  for (const st of s.stars) {
    const tw = Math.sin(t * st.sp + st.ph)
    const b = st.bri + tw * 0.25
    if (b < 0.1) continue
    const v = Math.floor(80 + b * 175)
    const warm = st.y / s.horizon
    c.setCell(st.x, st.y,
      st.big ? '✦' : (b > 0.55 ? '·' : '.'),
      col(Math.min(255, v + Math.floor(warm * 30)),
          Math.min(255, v + Math.floor(warm * 10)), v))
  }

  const mx = Math.floor(w * 0.70), my = Math.floor(h * 0.10)
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const d1 = Math.sqrt(dx * dx + dy * dy)
      const d2 = Math.sqrt((dx + 1.7) * (dx + 1.7) + dy * dy)
      if (d1 <= 3 && d2 > 2.4) {
        const px = mx + dx, py = my + dy
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const bri = 0.6 + (1 - d1 / 3) * 0.4
          c.setCell(px, py, BLOCK.full,
            col(Math.floor(220 * bri), Math.floor(205 * bri), Math.floor(160 * bri)))
        }
      }
    }
  }
  for (let dy = -7; dy <= 7; dy++) {
    for (let dx = -7; dx <= 7; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 3 && d <= 7) {
        const px = mx + dx, py = my + dy
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const f = Math.pow(1 - (d - 3) / 4, 2) * 0.05
          if (f < 0.003) continue
          const cell = c.getCell(px, py)
          if (cell && cell.bg)
            c.setCell(px, py, cell.char, cell.fg, lerp(cell.bg, '#ffe8bb', f))
        }
      }
    }
  }

  for (const sh of s.shooters) {
    const cyc = ((t + sh.off) % sh.per) / sh.per
    if (cyc > 0.05) continue
    const p = cyc / 0.05
    for (let i = 0; i < sh.len; i++) {
      const fade = (1 - i / sh.len) * Math.min(1, (p - i * 0.04) * 12)
      if (fade <= 0) break
      const px = sh.x0 + Math.floor(sh.dir * sh.len * p) - i * sh.dir
      if (px < 0 || px >= w || sh.y0 >= s.horizon) continue
      const v = Math.floor(155 + fade * 100)
      c.setCell(px, sh.y0, i === 0 ? '✧' : (fade > 0.4 ? '─' : '·'),
        col(v, v, Math.floor(v * 0.7)))
    }
  }

  for (const dune of s.dunes) {
    for (let x = 0; x < w; x++) {
      const p = prof(dune, x)
      const topY = dune.base - Math.floor(p * dune.amp)
      const pn = prof(dune, x + 1)
      const slope = pn - p

      for (let y = Math.max(0, topY); y < h; y++) {
        const dt = y - topY
        const dep = Math.min(1, dt / Math.max(1, h - topY))

        let li = Math.max(0, Math.min(1, 0.5 + slope * 2.0))
        li *= (1 - dep * 0.35)

        if (dune.rip && dt < dune.amp * 2) {
          li += Math.sin(x * dune.rf + t * dune.ws + y * 0.06) * 0.055 * (1 - dep)
        }

        li = Math.max(0.05, Math.min(1, li))
        c.setCell(x, y, ' ', null, sand(dune.d, li))
      }

      if (topY >= 0 && topY < h && slope < -0.1) {
        c.setCell(x, topY, BLOCK.upper, sand(dune.d,
          Math.min(1.35, 0.85 + Math.abs(slope) * 2)))
      }
    }
  }

  for (const p of s.particles) {
    let px = (p.x + t * p.vx) % 1
    if (px < 0) px += 1
    const ix = Math.floor(px * w)
    const iy = Math.floor((p.y + Math.sin(t * 0.5 + p.ph) * 0.012) * h)
    if (ix < 4 || ix >= w - 4 || iy < 3 || iy >= h - 4) continue
    const pulse = Math.sin(t * 0.7 + p.ph) * 0.2 + 0.8
    if (p.bri * pulse < 0.15) continue
    const v = Math.floor(130 + p.bri * pulse * 120)
    c.setCell(ix, iy, '·', col(v, Math.floor(v * 0.78), Math.floor(v * 0.4)))
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
