import { lerp, lerpMulti } from '../src/theme.js'

export const title = 'Orrery'
export const description = 'Brass planets trace ancient paths around a golden sun — clockwork whispering the music of the spheres'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const AR = 0.55

const SUN_GLOW = ['#fff8e0', '#ffdd88', '#eebb44', '#cc8811', '#884400', '#442200']

const ORBITS = [
  { rF: 0.12, sp: 0.45, fg: '#b0a090' },
  { rF: 0.19, sp: 0.33, fg: '#eedd99' },
  { rF: 0.27, sp: 0.25, fg: '#5888cc' },
  { rF: 0.36, sp: 0.18, fg: '#cc6644' },
  { rF: 0.50, sp: 0.09, fg: '#ddaa55', big: true },
  { rF: 0.66, sp: 0.045, fg: '#ccbb88', big: true, ring: true },
]

export function setup(canvas) {
  const rng = srand(817)
  const w = canvas.width, h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h * 0.38)
  const maxR = Math.floor(Math.min(w * 0.43, h * 0.32 / AR))

  const stars = []
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.floor(rng() * w), y: Math.floor(rng() * h),
      b: 0.1 + rng() * 0.9, ph: rng() * 6.28, sp: 0.1 + rng() * 0.5,
    })
  }

  const planets = ORBITS.map(o => ({
    ...o, angle: rng() * 6.28, oR: Math.floor(maxR * o.rF),
  }))

  const motes = []
  for (let i = 0; i < 25; i++) {
    motes.push({
      bx: cx + (rng() - 0.5) * maxR * 1.4,
      by: cy + (rng() - 0.5) * maxR * AR * 1.2,
      ph: rng() * 6.28, spd: 0.04 + rng() * 0.09,
      ax: 2 + rng() * 5, ay: 1 + rng() * 3,
      bri: 0.15 + rng() * 0.45,
    })
  }

  return { cx, cy, maxR, stars, planets, motes, standY: Math.floor(h * 0.76) }
}

export function render(c, data, st) { drawScene(c, st, 0) }

export function update(c, data, frame, st) {
  for (const p of st.planets) p.angle += p.sp * frame.dt
  drawScene(c, st, frame.elapsed)
}

function drawScene(c, s, t) {
  const w = c.width, h = c.height
  const fl = 1 + Math.sin(t * 2.1) * 0.02 + Math.sin(t * 3.5) * 0.015

  bgAndGlow(c, w, h, s, fl)
  drawStars(c, w, h, s, t)
  drawTracks(c, w, h, s)
  drawStand(c, w, h, s, t)
  drawArms(c, w, h, s, fl)
  drawSun(c, w, h, s, fl, t)
  drawPlanets(c, w, h, s, t)
  drawMotes(c, w, h, s, t, fl)
}

function bgAndGlow(c, w, h, s, fl) {
  const glowR = s.maxR * 1.6
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const grain = (Math.sin(x * 0.06 + y * 0.02) * 0.5 + 0.5) * 0.6
                  + (Math.sin(x * 0.14 - y * 0.05 + 3) * 0.5 + 0.5) * 0.4
      const r = 12 + grain * 12 + (y / h) * 4
      const g = 8 + grain * 8 + (y / h) * 2
      const b = 3 + grain * 4
      let bg = col(r, g, b)

      const dx = x - s.cx
      const dy = (y - s.cy) / AR
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < glowR) {
        const intensity = Math.pow(1 - dist / glowR, 2.2) * 0.14 * fl
        if (intensity > 0.003) bg = lerp(bg, '#aa7730', intensity)
      }

      c.setCell(x, y, ' ', null, bg)
    }
  }
}

function drawStars(c, w, h, s, t) {
  for (const star of s.stars) {
    if (star.x < 4 || star.x >= w - 4 || star.y < 4 || star.y >= h - 5) continue
    const dx = star.x - s.cx, dy = (star.y - s.cy) / AR
    if (Math.sqrt(dx * dx + dy * dy) < s.maxR * 0.72) continue
    const bri = star.b * (Math.sin(t * star.sp + star.ph) * 0.3 + 0.7)
    if (bri < 0.15) continue
    const v = Math.floor(18 + bri * 48)
    c.setCell(star.x, star.y, bri > 0.55 ? '·' : '.', col(v, v, Math.floor(v * 0.8)))
  }
}

function drawTracks(c, w, h, s) {
  for (const p of s.planets) {
    const steps = Math.max(100, Math.floor(p.oR * 6))
    for (let i = 0; i < steps; i++) {
      if (i % 3 !== 0) continue
      const a = (i / steps) * 6.2832
      const ox = Math.floor(s.cx + Math.cos(a) * p.oR)
      const oy = Math.floor(s.cy + Math.sin(a) * p.oR * AR)
      if (ox < 4 || ox >= w - 4 || oy < 4 || oy >= h - 5) continue
      c.setCell(ox, oy, '·', '#382818')
    }
  }
}

function drawStand(c, w, h, s, t) {
  const topY = s.cy + 4

  if (s.cx >= 6 && s.cx < w - 6 && topY >= 4 && topY < h - 5) {
    c.setCell(s.cx - 2, topY, '╶', '#806838')
    c.setCell(s.cx - 1, topY, '─', '#806838')
    c.setCell(s.cx, topY, '┬', '#806838')
    c.setCell(s.cx + 1, topY, '─', '#806838')
    c.setCell(s.cx + 2, topY, '╴', '#806838')
  }

  for (let y = topY + 1; y < s.standY; y++) {
    const yf = (y - topY) / Math.max(1, s.standY - topY)
    c.setCell(s.cx, y, '│', lerp('#806838', '#604828', yf))
  }

  if (s.standY >= 4 && s.standY < h - 5) {
    c.setCell(s.cx - 2, s.standY, '╶', '#705830')
    c.setCell(s.cx - 1, s.standY, '─', '#705830')
    c.setCell(s.cx, s.standY, '┴', '#705830')
    c.setCell(s.cx + 1, s.standY, '─', '#705830')
    c.setCell(s.cx + 2, s.standY, '╴', '#705830')
  }

  const bw = Math.floor(w * 0.15)
  for (let dy = 0; dy < 4; dy++) {
    const py = s.standY + 1 + dy
    if (py >= h - 4) continue
    const cw = bw - dy
    for (let dx = -cw; dx <= cw; dx++) {
      const px = s.cx + dx
      if (px < 4 || px >= w - 4) continue
      const edge = Math.abs(dx) / (cw + 1)
      const fade = 1 - dy * 0.12
      const r = Math.floor((60 + (1 - edge) * 30) * fade)
      const g = Math.floor((42 + (1 - edge) * 22) * fade)
      const b = Math.floor((18 + (1 - edge) * 10) * fade)
      c.setCell(px, py, dy === 0 ? '▔' : ' ',
        dy === 0 ? col(r + 20, g + 15, b + 8) : null, col(r, g, b))
    }
  }

  drawGear(c, w, h, s.cx - 8, s.standY - 1, 2.5, 6, t * 0.15, '#685030')
  drawGear(c, w, h, s.cx + 8, s.standY - 1, 2.5, 6, -t * 0.15 + 0.26, '#604828')
}

function drawGear(c, w, h, gx, gy, gr, teeth, rot, fg) {
  const n = teeth * 2
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * 6.2832
    const tooth = i % 2 === 0
    const r = tooth ? gr + 1 : gr
    const px = Math.floor(gx + Math.cos(a) * r * 1.5)
    const py = Math.floor(gy + Math.sin(a) * r * AR)
    if (px < 4 || px >= w - 4 || py < 4 || py >= h - 5) continue
    c.setCell(px, py, tooth ? '■' : '·', fg)
  }
  const igx = Math.floor(gx), igy = Math.floor(gy)
  if (igx >= 4 && igx < w - 4 && igy >= 4 && igy < h - 5) {
    c.setCell(igx, igy, '◎', lerp(fg, '#bb9955', 0.3))
  }
}

function drawArms(c, w, h, s, fl) {
  for (const p of s.planets) {
    const px = s.cx + Math.cos(p.angle) * p.oR
    const py = s.cy + Math.sin(p.angle) * p.oR * AR
    const steps = Math.max(8, Math.floor(p.oR))
    for (let i = 3; i < steps; i++) {
      const pt = i / steps
      const lx = Math.floor(s.cx + (px - s.cx) * pt)
      const ly = Math.floor(s.cy + (py - s.cy) * pt)
      if (lx < 4 || lx >= w - 4 || ly < 4 || ly >= h - 5) continue
      const v = Math.floor((40 + pt * 35) * fl)
      c.setCell(lx, ly, '·', col(v + 25, v + 10, Math.floor(v * 0.4)))
    }
  }
}

function drawSun(c, w, h, s, fl, t) {
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const px = s.cx + dx, py = s.cy + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const dist = Math.sqrt(dx * dx / 4.5 + dy * dy)
      if (dist > 3) continue
      const nD = dist / 3
      const bg = lerpMulti(SUN_GLOW, nD * 0.85)
      c.setCell(px, py, dx === 0 && dy === 0 ? '◉' : ' ',
        dx === 0 && dy === 0 ? '#fff8e0' : null, bg)
    }
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.2832 + t * 0.04
    const len = 4 + Math.sin(t * 0.3 + i * 1.5) * 2
    for (let r = 0; r < len + 7; r++) {
      const rx = Math.floor(s.cx + Math.cos(a) * (r + 1) * 2)
      const ry = Math.floor(s.cy + Math.sin(a) * (r + 1))
      if (rx < 4 || rx >= w - 4 || ry < 4 || ry >= h - 5) continue
      const sdx = rx - s.cx, sdy = ry - s.cy
      if (sdx * sdx / 4.5 + sdy * sdy <= 10) continue
      const falloff = Math.max(0, 1 - r / (len + 7))
      if (falloff < 0.08) continue
      const cell = c.getCell(rx, ry)
      if (cell && cell.bg) {
        c.setCell(rx, ry, ' ', null, lerp(cell.bg, '#ffcc55', falloff * 0.16 * fl))
      }
    }
  }
}

function drawPlanets(c, w, h, s, t) {
  for (let i = 0; i < s.planets.length; i++) {
    const p = s.planets[i]
    const px = Math.floor(s.cx + Math.cos(p.angle) * p.oR)
    const py = Math.floor(s.cy + Math.sin(p.angle) * p.oR * AR)
    if (px < 4 || px >= w - 4 || py < 4 || py >= h - 5) continue

    c.setCell(px, py, '●', p.fg)
    if (p.big) {
      if (px - 1 >= 4) c.setCell(px - 1, py, '◖', lerp(p.fg, '#000000', 0.35))
      if (px + 1 < w - 4) c.setCell(px + 1, py, '◗', lerp(p.fg, '#000000', 0.35))
    }
    if (p.ring) {
      if (px - 2 >= 4) c.setCell(px - 2, py, '─', '#a89858')
      if (px + 2 < w - 4) c.setCell(px + 2, py, '─', '#a89858')
      if (px - 3 >= 4) c.setCell(px - 3, py, '╶', '#887040')
      if (px + 3 < w - 4) c.setCell(px + 3, py, '╴', '#887040')
    }

    if (i === 2) {
      const mA = t * 2.5 + 1.3
      const mx = Math.floor(px + Math.cos(mA) * 2.5)
      const my = Math.floor(py + Math.sin(mA) * 1.5)
      if (mx >= 4 && mx < w - 4 && my >= 4 && my < h - 5) {
        c.setCell(mx, my, '·', '#aaaaaa')
      }
    }
  }
}

function drawMotes(c, w, h, s, t, fl) {
  for (const m of s.motes) {
    const mx = Math.floor(m.bx + Math.sin(t * m.spd + m.ph) * m.ax)
    const my = Math.floor(m.by + Math.cos(t * m.spd * 0.7 + m.ph + 1.3) * m.ay)
    if (mx < 4 || mx >= w - 4 || my < 4 || my >= h - 5) continue
    const pulse = Math.sin(t * 0.25 + m.ph) * 0.5 + 0.5
    const bri = m.bri * pulse * fl
    if (bri < 0.08) continue
    const v = Math.floor(45 + bri * 120)
    c.setCell(mx, my, bri > 0.25 ? '·' : '.', col(v, Math.floor(v * 0.78), Math.floor(v * 0.38)))
  }
}
