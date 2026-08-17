import { lerp, lerpMulti } from '../src/theme.js'

export const title = 'Dawn Ascent'
export const description = 'Silk and flame ascending through amber dawn — the world below softens to watercolor'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const SKY = [
  '#040818', '#0c1030', '#181850', '#2a2268',
  '#442e78', '#683878', '#983868', '#c84838',
  '#e87020', '#ffa030', '#ffc850', '#ffe480', '#fff4b0'
]

export function setup(canvas) {
  const rng = srand(818)
  const w = canvas.width, h = canvas.height

  const balloons = [
    mkB(0.24, 0.26, 1.0, ['#cc1133','#ee2244','#ff4466','#ffee88','#ff4466','#ee2244','#cc1133'], 7, rng),
    mkB(0.73, 0.32, 0.85, ['#1155aa','#2277cc','#44aaee','#eeffff','#44aaee','#2277cc','#1155aa'], 7, rng),
    mkB(0.48, 0.16, 0.65, ['#dd7711','#ffaa22','#ffdd55','#ffaa22','#dd7711'], 5, rng),
    mkB(0.86, 0.22, 0.55, ['#117744','#22aa66','#44dd88','#22aa66','#117744'], 5, rng),
    mkB(0.14, 0.46, 0.38, ['#773399','#9955bb'], 3, rng),
    mkB(0.60, 0.50, 0.32, ['#cc5522','#ee7744'], 3, rng),
    mkB(0.38, 0.58, 0.18, ['#887766'], 1, rng),
  ]

  const clouds = []
  for (let i = 0; i < 10; i++) {
    clouds.push({
      cx: rng() * w, cy: h * (0.10 + rng() * 0.50),
      cw: 8 + Math.floor(rng() * 20), ch: 1 + Math.floor(rng() * 3),
      den: 0.015 + rng() * 0.04, drift: (rng() - 0.5) * 1.5,
    })
  }

  const stars = []
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.floor(rng() * w), y: Math.floor(rng() * h * 0.22),
      b: 0.2 + rng() * 0.8, ph: rng() * 6.28, sp: 0.1 + rng() * 0.3,
    })
  }

  const birds = []
  for (let i = 0; i < 5; i++) {
    birds.push({
      bx: rng() * w, by: h * (0.42 + rng() * 0.18),
      sp: 1.5 + rng() * 2.5, ph: rng() * 6.28, flap: 2 + rng() * 3,
    })
  }

  return { balloons, clouds, stars, birds }
}

function mkB(bx, by, sc, pal, nP, rng) {
  return {
    bx, by, sc, pal, nP,
    dxSp: 0.03 + rng() * 0.04,
    dxA: 1.5 * sc + rng() * sc,
    dySp: 0.02 + rng() * 0.03,
    dyA: 1.0 * sc + rng() * 0.5 * sc,
    swPh: rng() * 6.28,
  }
}

export function render(c, data, st) { drawScene(c, st, 0) }
export function update(c, data, frame, st) { drawScene(c, st, frame.elapsed) }

function drawScene(c, s, t) {
  const w = c.width, h = c.height
  drawSky(c, w, h)
  drawStars(c, w, h, s.stars, t)
  drawSunGlow(c, w, h, t)
  drawHills(c, w, h)
  drawFog(c, w, h, t)
  drawClouds(c, w, h, s.clouds, t)
  for (let i = s.balloons.length - 1; i >= 0; i--) drawBalloon(c, w, h, s.balloons[i], t)
  drawBirds(c, w, h, s.birds, t)
}

function drawSky(c, w, h) {
  for (let y = 0; y < h; y++) {
    const bg = lerpMulti(SKY, y / Math.max(1, h - 1))
    for (let x = 0; x < w; x++) c.setCell(x, y, ' ', null, bg)
  }
}

function drawStars(c, w, h, stars, t) {
  for (const s of stars) {
    if (s.x < 4 || s.x >= w - 4 || s.y < 1) continue
    const bri = s.b * (Math.sin(t * s.sp + s.ph) * 0.25 + 0.75)
    const fade = Math.max(0, 1 - s.y / (h * 0.18))
    if (bri * fade < 0.12) continue
    const v = Math.floor(50 + bri * fade * 80)
    c.setCell(s.x, s.y, bri > 0.5 ? '·' : '.', col(v, v, Math.floor(v * 0.85)))
  }
}

function drawSunGlow(c, w, h, t) {
  const sx = Math.floor(w * 0.45)
  const sy = Math.floor(h * 0.72)
  const R = Math.floor(Math.min(w, h) * 0.40)
  const pulse = 1 + Math.sin(t * 0.7) * 0.02

  for (let y = Math.max(0, sy - R); y < Math.min(h, sy + R); y++) {
    for (let x = Math.max(0, sx - R); x < Math.min(w, sx + R); x++) {
      const dx = x - sx, dy = (y - sy) * 1.4
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= R) continue
      const intensity = Math.pow(1 - dist / R, 2.2) * 0.22 * pulse
      if (intensity < 0.005) continue
      const cell = c.getCell(x, y)
      if (cell && cell.bg) c.setCell(x, y, ' ', null, lerp(cell.bg, '#ffe080', intensity))
    }
  }
}

function drawHills(c, w, h) {
  const L = [
    { base: 0.74, a1: 0.032, a2: 0.014, fg: '#2a1e40', al: 0.50 },
    { base: 0.80, a1: 0.025, a2: 0.012, fg: '#352850', al: 0.60 },
    { base: 0.86, a1: 0.020, a2: 0.010, fg: '#403060', al: 0.72 },
    { base: 0.92, a1: 0.014, a2: 0.007, fg: '#4a3870', al: 0.85 },
  ]
  for (const l of L) {
    for (let x = 0; x < w; x++) {
      const hy = Math.floor(h * l.base
        + Math.sin(x * 0.018 + l.base * 20) * h * l.a1
        + Math.sin(x * 0.045 + l.base * 40) * h * l.a2)
      for (let y = hy; y < h; y++) {
        const cell = c.getCell(x, y)
        if (cell && cell.bg) c.setCell(x, y, ' ', null, lerp(cell.bg, l.fg, l.al))
      }
    }
  }
}

function drawFog(c, w, h, t) {
  const fogY = Math.floor(h * 0.73)
  for (let x = 0; x < w; x++) {
    const wave = Math.sin(x * 0.022 + t * 0.10) * 3
    for (let dy = -5; dy <= 5; dy++) {
      const py = fogY + dy + Math.floor(wave)
      if (py < 0 || py >= h) continue
      const fi = Math.max(0, 1 - Math.abs(dy) / 5.5) * 0.10
      if (fi < 0.004) continue
      const cell = c.getCell(x, py)
      if (cell && cell.bg) c.setCell(x, py, ' ', null, lerp(cell.bg, '#ffecc8', fi))
    }
  }
}

function drawClouds(c, w, h, clouds, t) {
  for (const cl of clouds) {
    const ox = cl.cx + t * cl.drift
    for (let dy = -cl.ch; dy <= cl.ch; dy++) {
      const py = Math.floor(cl.cy + dy)
      if (py < 0 || py >= h) continue
      for (let dx = -cl.cw; dx <= cl.cw; dx++) {
        let px = Math.floor(ox + dx) % w
        if (px < 0) px += w
        const nx = dx / cl.cw, ny = dy / Math.max(1, cl.ch)
        const d2 = nx * nx + ny * ny
        if (d2 > 1) continue
        const den = (1 - d2) * cl.den
        if (den < 0.003) continue
        const cell = c.getCell(px, py)
        if (cell && cell.bg) c.setCell(px, py, ' ', null, lerp(cell.bg, '#fff8ee', den))
      }
    }
  }
}

function bProf(t) {
  if (t <= 0 || t >= 1) return 0
  const cap = Math.min(1, t / 0.12)
  const body = Math.pow(Math.sin(t * Math.PI), 0.6)
  const sq = 1 - Math.pow(t, 3)
  return cap * body * sq
}

function drawBalloon(c, w, h, b, t) {
  const bx = Math.floor(w * b.bx + Math.sin(t * b.dxSp + b.swPh) * b.dxA)
  const by = Math.floor(h * b.by + Math.sin(t * b.dySp + b.swPh * 1.7) * b.dyA)
  const bH = Math.max(4, Math.floor(14 * b.sc))
  const bW = Math.max(2, Math.floor(9 * b.sc))
  const haze = Math.max(0, 1 - b.sc * 2.2)

  for (let row = 0; row < bH; row++) {
    const rowT = row / Math.max(1, bH - 1)
    const hw = Math.max(0, Math.floor(bW * bProf(rowT)))
    if (hw <= 0) continue
    const py = by + row
    if (py < 1 || py >= h - 5) continue

    for (let dx = -hw; dx <= hw; dx++) {
      const px = bx + dx
      if (px < 4 || px >= w - 4) continue

      let pColor
      if (b.nP <= 1) {
        pColor = b.pal[0]
      } else {
        const ang = (dx + hw) / (2 * hw + 1)
        const pi = Math.floor(ang * b.nP) % b.pal.length
        pColor = b.pal[Math.min(pi, b.pal.length - 1)]
      }

      const lightR = 0.70 + 0.30 * ((dx + hw) / (2 * hw + 1))
      const edgeR = 1 - Math.pow(Math.abs(dx) / (hw + 1), 2) * 0.25
      const combined = lightR * edgeR

      const r = parseInt(pColor.slice(1, 3), 16) * combined
      const g = parseInt(pColor.slice(3, 5), 16) * combined
      const bl = parseInt(pColor.slice(5, 7), 16) * combined

      let fc = col(r, g, bl)
      if (haze > 0) fc = lerp(fc, '#ffd8a0', haze * 0.35)

      c.setCell(px, py, ' ', null, fc)
    }
  }

  if (bx >= 4 && bx < w - 4 && by >= 1 && by < h - 5) {
    let capC = b.pal[Math.floor(b.pal.length / 2)]
    if (haze > 0) capC = lerp(capC, '#ffd8a0', haze * 0.35)
    c.setCell(bx, by, '▄', capC)
  }

  if (b.sc < 0.25) return

  const throatY = by + bH
  const ropeL = Math.max(1, Math.floor(3 * b.sc))
  const bkW = Math.max(1, Math.floor(3 * b.sc))
  const bkH = Math.max(1, Math.floor(2 * b.sc))
  const bkY = throatY + ropeL

  if (b.sc >= 0.45 && throatY >= 1 && throatY < h - 5 && bx >= 4 && bx < w - 4) {
    const fl = Math.sin(t * 5 + b.swPh) * 0.3 + 0.7
    c.setCell(bx, throatY, '▲', col(255 * fl, 180 * fl, 40 * fl))
  }

  if (b.sc >= 0.35) {
    for (let ry = throatY + 1; ry < bkY; ry++) {
      if (ry < 1 || ry >= h - 5) continue
      if (bx - bkW >= 4 && bx - bkW < w - 4) c.setCell(bx - bkW, ry, '╲', '#7a6040')
      if (bx + bkW >= 4 && bx + bkW < w - 4) c.setCell(bx + bkW, ry, '╱', '#7a6040')
      if (b.sc >= 0.55 && bx >= 4 && bx < w - 4) c.setCell(bx, ry, '│', '#7a6040')
    }
  }

  for (let dy = 0; dy < bkH; dy++) {
    const py = bkY + dy
    if (py < 1 || py >= h - 5) continue
    for (let dx = -bkW; dx <= bkW; dx++) {
      const px = bx + dx
      if (px < 4 || px >= w - 4) continue
      c.setCell(px, py, '▒', '#9a7838', '#5a3818')
    }
  }
}

function drawBirds(c, w, h, birds, t) {
  for (const bird of birds) {
    const bx = Math.floor((bird.bx + t * bird.sp) % w)
    const by = Math.floor(bird.by + Math.sin(t * 0.5 + bird.ph) * 3)
    if (bx < 4 || bx >= w - 5 || by < 1 || by >= h - 5) continue
    const wing = Math.sin(t * bird.flap + bird.ph)
    const bc = '#1a0e18'
    if (wing > 0.3) {
      c.setCell(bx, by, '╱', bc)
      c.setCell(bx + 1, by, '╲', bc)
    } else if (wing > -0.3) {
      c.setCell(bx, by, '─', bc)
      c.setCell(bx + 1, by, '─', bc)
    } else {
      c.setCell(bx, by, '╲', bc)
      c.setCell(bx + 1, by, '╱', bc)
    }
  }
}
