import { lerp, lerpMulti, SHADE } from '../src/theme.js'

export const title = 'Terrarium'
export const description = 'A world entire beneath glass — ferns uncurl, moss breathes, and time slows to the pace of roots'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function mkCol(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function jarD(x, y, s) {
  if (y < s.domeTop || y > s.botY) return -1
  const nx = (x - s.cx) / s.rx
  if (y <= s.domeY) {
    const ny = (y - s.domeY) / s.domeR
    return 1 - Math.sqrt(nx * nx + ny * ny)
  }
  return 1 - Math.abs(nx)
}

const GLASS = 0.07

export function setup(canvas) {
  const rng = srand(816)
  const w = canvas.width, h = canvas.height

  const cx = Math.floor(w / 2)
  const rx = Math.floor(w * 0.28)
  const domeY = Math.floor(h * 0.22)
  const domeR = Math.floor(h * 0.13)
  const domeTop = domeY - domeR
  const botY = Math.floor(h * 0.78)
  const surfY = botY + 1
  const soilLine = Math.floor(domeY + (botY - domeY) * 0.55)

  const soilW = new Float32Array(w)
  for (let x = 0; x < w; x++) {
    soilW[x] = Math.sin(x * 0.10) * 1.0 + Math.sin(x * 0.24 + 1.8) * 0.5
  }

  const ferns = []
  for (let i = 0; i < 8; i++) {
    ferns.push({
      x: cx + (rng() - 0.5) * rx * 1.3,
      ht: 5 + Math.floor(rng() * 12),
      lean: (rng() - 0.5) * 0.25,
      ph: rng() * 6.28,
      sp: 0.10 + rng() * 0.18,
      fl: 2 + Math.floor(rng() * 3),
      ci: Math.floor(rng() * 3),
    })
  }

  const moss = []
  for (let i = 0; i < 22; i++) {
    moss.push({
      x: cx + (rng() - 0.5) * rx * 1.4,
      mw: 2 + Math.floor(rng() * 5),
      g: rng(),
    })
  }

  const shrooms = []
  for (let i = 0; i < 5; i++) {
    shrooms.push({
      x: cx + (rng() - 0.5) * rx * 0.9,
      sz: rng() > 0.5 ? 2 : 1,
      hu: rng(),
      ph: rng() * 6.28,
    })
  }

  const pebs = []
  for (let i = 0; i < 50; i++) {
    pebs.push({
      x: cx + (rng() - 0.5) * rx * 1.5,
      dy: Math.floor(rng() * 5),
      ch: ['·', '•', '°', '◦'][Math.floor(rng() * 4)],
      v: rng(),
    })
  }

  const drops = []
  for (let i = 0; i < 40; i++) {
    const side = rng() > 0.5 ? 1 : -1
    drops.push({
      x: cx + side * rx * (0.88 + rng() * 0.07),
      y: domeY + 2 + Math.floor(rng() * (botY - domeY - 4)),
      ph: rng() * 6.28,
      sp: 0.18 + rng() * 0.4,
    })
  }

  const mist = []
  for (let i = 0; i < 30; i++) {
    mist.push({
      nx: (rng() - 0.5) * 0.55,
      ny: domeTop + domeR * 0.4 + rng() * (soilLine - domeTop - domeR * 0.4) * 0.7,
      ph: rng() * 6.28,
      sp: 0.06 + rng() * 0.10,
      ax: 2 + rng() * 5,
      ay: 0.5 + rng() * 2,
      b: 0.03 + rng() * 0.08,
    })
  }

  const rocks = []
  for (let i = 0; i < 12; i++) {
    rocks.push({
      x: cx + (rng() - 0.5) * rx * 1.2,
      ch: rng() > 0.5 ? '▪' : '◆',
      shade: rng(),
    })
  }

  return { cx, rx, domeY, domeR, domeTop, botY, surfY, soilLine, soilW,
           ferns, moss, shrooms, pebs, drops, mist, rocks }
}

export function render(c, data, st) { drawScene(c, st, 0) }
export function update(c, data, f, st) { drawScene(c, st, f.elapsed) }

function drawScene(c, s, t) {
  const w = c.width, h = c.height
  const flicker = 1 + Math.sin(t * 1.8) * 0.015 + Math.sin(t * 3.1) * 0.01

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dp = jarD(x, y, s)

      if (y >= s.surfY) {
        drawWood(c, x, y, h, s)
      } else if (dp < 0) {
        drawBg(c, x, y, w, h, s)
      } else if (dp < GLASS) {
        drawGlass(c, x, y, dp, s, flicker)
      } else {
        drawInterior(c, x, y, w, s, flicker)
      }
    }
  }

  drawPebbles(c, w, s)
  drawMoss(c, w, s)
  drawFerns(c, w, s, t)
  drawRocks(c, w, s)
  drawShrooms(c, w, s, t)
  drawMist(c, w, s, t)
  drawDroplets(c, w, s, t)
  drawKnob(c, w, s)
  drawLightSpot(c, w, h, s, flicker)
  drawGlassHighlight(c, w, s)
}

function drawBg(c, x, y, w, h, s) {
  const dx = (x - s.cx) / (w * 0.5)
  const dy = (y - s.domeY) / (h * 0.5)
  const glow = Math.max(0, 0.04 - (dx * dx + dy * dy) * 0.04)
  c.setCell(x, y, ' ', null, lerp('#07070c', '#111820', glow))
}

function drawWood(c, x, y, h, s) {
  const wd = (y - s.surfY) / Math.max(1, h - s.surfY)
  const grain = Math.sin(x * 0.27 + y * 0.06) * 0.5 + 0.5
  const ring = Math.sin(x * 0.08 + 3.2) * 0.5 + 0.5
  const base = lerp('#30241a', '#281c14', wd * 0.3)
  c.setCell(x, y, ' ', null, lerp(base, '#241a10', grain * 0.1 + ring * 0.04))
}

function drawGlass(c, x, y, dp, s, flicker) {
  const gn = dp / GLASS
  const rightness = Math.max(0, (x - s.cx) / s.rx)
  const topness = y <= s.domeY ? Math.max(0, 1 - (y - s.domeTop) / s.domeR) * 0.15 : 0
  const highlight = (rightness * 0.35 + topness) * flicker
  const base = lerp('#162838', '#2a4858', gn * 0.4)
  c.setCell(x, y, ' ', null, lerp(base, '#6aa0b8', highlight))
}

function drawInterior(c, x, y, w, s, flicker) {
  const sw = s.soilW[Math.max(0, Math.min(w - 1, x))] || 0
  const soilY = s.soilLine + sw

  if (y >= soilY) {
    const sd = (y - soilY) / Math.max(1, s.botY - s.soilLine)
    let bg
    if (sd > 0.58) {
      bg = lerpMulti(['#38342c', '#423e34', '#3a362e'], (sd - 0.58) / 0.42)
    } else if (sd > 0.48) {
      bg = lerp('#1c1a18', '#181614', (sd - 0.48) / 0.10)
    } else {
      bg = lerpMulti(['#2e1e12', '#26180e', '#20140a'], sd / 0.48)
    }
    c.setCell(x, y, ' ', null, bg)
  } else {
    const airH = Math.max(1, soilY - s.domeTop)
    const airT = (y - s.domeTop) / airH
    const light = Math.max(0, 0.025 * (1 - airT * airT)) * flicker
    const green = airT * 0.015
    c.setCell(x, y, ' ', null, lerp(
      lerp('#0c0e10', '#0e1410', green),
      '#181e24', light))
  }
}

function drawPebbles(c, w, s) {
  for (const p of s.pebs) {
    const py = s.botY - 2 - p.dy
    const px = Math.floor(p.x)
    if (px < 5 || px >= w - 5) continue
    if (jarD(px, py, s) < GLASS + 0.02) continue
    const v = Math.floor(90 + p.v * 65)
    c.setCell(px, py, p.ch, mkCol(v, Math.floor(v * 0.92), Math.floor(v * 0.80)))
  }
}

function drawMoss(c, w, s) {
  const MC = ['#3a6028', '#4a7032', '#567838']
  for (const m of s.moss) {
    const bx = Math.floor(m.x)
    if (bx < 5 || bx >= w - 5) continue
    const sw = s.soilW[Math.max(0, Math.min(w - 1, bx))] || 0
    const my = Math.floor(s.soilLine + sw)
    for (let dx = 0; dx < m.mw; dx++) {
      const px = bx + dx
      if (px < 5 || px >= w - 5) continue
      if (jarD(px, my, s) < GLASS + 0.02) continue
      c.setCell(px, my, SHADE[Math.floor(m.g * 2)], MC[Math.floor(m.g * 2.9)])
      if (m.g > 0.5 && dx % 2 === 0 && jarD(px, my - 1, s) > GLASS + 0.02) {
        c.setCell(px, my - 1, '╻', lerp(MC[2], '#7aaa50', 0.3))
      }
    }
  }
}

function drawFerns(c, w, s, t) {
  const FC = [
    ['#1c4220', '#2c5a30', '#3a6c3a'],
    ['#286830', '#38983e', '#48aa4e'],
    ['#307a38', '#40a248', '#52b858'],
  ]
  for (const f of s.ferns) {
    const sway = Math.sin(t * f.sp + f.ph) * 1.0
    const cols = FC[f.ci]
    const bx = Math.floor(f.x)
    const sw = s.soilW[Math.max(0, Math.min(w - 1, bx))] || 0
    const baseY = Math.floor(s.soilLine + sw)

    for (let i = 0; i < f.ht; i++) {
      const prog = i / f.ht
      const sy = baseY - 1 - i
      const sx = Math.floor(f.x + f.lean * i + sway * prog)
      if (sx < 5 || sx >= w - 5) continue
      if (jarD(sx, sy, s) <= GLASS + 0.01) continue

      c.setCell(sx, sy, '│', cols[0])

      if (i >= 2 && i < f.ht - 1) {
        const side = i % 2 === 0 ? 1 : -1
        const fl = Math.max(1, Math.floor(f.fl * (1 - prog * 0.6)))
        for (let j = 1; j <= fl; j++) {
          const fx = sx + j * side
          if (fx < 5 || fx >= w - 5) break
          if (jarD(fx, sy, s) <= GLASS + 0.01) break
          c.setCell(fx, sy, j === fl ? '·' : side > 0 ? '╲' : '╱',
            lerp(cols[1], cols[2], j / fl))
        }
      }
    }
    const ty = baseY - f.ht
    const tx = Math.floor(f.x + f.lean * f.ht + sway)
    if (tx >= 5 && tx < w - 5 && jarD(tx, ty, s) > GLASS + 0.01) {
      c.setCell(tx, ty, '◌', cols[2])
    }
  }
}

function drawRocks(c, w, s) {
  for (const r of s.rocks) {
    const rx = Math.floor(r.x)
    if (rx < 5 || rx >= w - 5) continue
    const sw = s.soilW[Math.max(0, Math.min(w - 1, rx))] || 0
    const ry = Math.floor(s.soilLine + sw) - 1
    if (jarD(rx, ry, s) <= GLASS + 0.02) continue
    const v = Math.floor(50 + r.shade * 40)
    c.setCell(rx, ry, r.ch, mkCol(v + 10, v + 5, v))
  }
}

function drawShrooms(c, w, s, t) {
  for (const m of s.shrooms) {
    const mx = Math.floor(m.x)
    if (mx < 5 || mx >= w - 5) continue
    const sw = s.soilW[Math.max(0, Math.min(w - 1, mx))] || 0
    const my = Math.floor(s.soilLine + sw)
    if (jarD(mx, my, s) <= GLASS + 0.02) continue
    const glow = Math.sin(t * 0.35 + m.ph) * 0.08
    const cap = lerp(m.hu > 0.5 ? '#c8a878' : '#b89060', '#ffe0c0', Math.max(0, glow))
    if (m.sz >= 2) {
      c.setCell(mx, my, '│', '#887960')
      if (jarD(mx, my - 1, s) > GLASS + 0.02) {
        if (mx - 1 >= 5) c.setCell(mx - 1, my - 1, '◖', cap)
        c.setCell(mx, my - 1, '●', cap)
        if (mx + 1 < w - 5) c.setCell(mx + 1, my - 1, '◗', cap)
      }
    } else {
      c.setCell(mx, my, '╷', '#887960')
      if (jarD(mx, my - 1, s) > GLASS + 0.02) {
        c.setCell(mx, my - 1, '•', cap)
      }
    }
  }
}

function drawMist(c, w, s, t) {
  for (const m of s.mist) {
    const mx = Math.floor(s.cx + m.nx * s.rx + Math.sin(t * m.sp + m.ph) * m.ax)
    const my = Math.floor(m.ny + Math.sin(t * m.sp * 0.6 + m.ph + 1.2) * m.ay)
    if (mx < 5 || mx >= w - 5) continue
    if (jarD(mx, my, s) <= GLASS + 0.03) continue
    const pulse = Math.sin(t * 0.2 + m.ph) * 0.5 + 0.5
    const bri = m.b * pulse
    if (bri < 0.01) continue
    const cell = c.getCell(mx, my)
    if (cell && cell.bg) {
      c.setCell(mx, my, bri > 0.04 ? '·' : ' ', '#8aaa88',
        lerp(cell.bg, '#c0d8c0', bri))
    }
  }
}

function drawDroplets(c, w, s, t) {
  for (const dr of s.drops) {
    const dx = Math.floor(dr.x)
    const dy = dr.y
    if (dx < 5 || dx >= w - 5) continue
    const dp = jarD(dx, dy, s)
    if (dp < 0.01 || dp > 0.16) continue
    const shimmer = Math.sin(t * dr.sp + dr.ph) * 0.5 + 0.5
    if (shimmer < 0.18) continue
    const cell = c.getCell(dx, dy)
    if (!cell || !cell.bg) continue
    c.setCell(dx, dy, shimmer > 0.6 ? '•' : '·',
      lerp('#5080a0', '#90c0d8', shimmer),
      lerp(cell.bg, '#88b4cc', shimmer * 0.06))
  }
}

function drawKnob(c, w, s) {
  const ky = s.domeTop - 1
  if (ky >= 1 && s.cx >= 0 && s.cx < w) {
    c.setCell(s.cx, ky, '●', '#5a7888')
    if (ky + 1 < s.domeTop + 2) {
      c.setCell(s.cx, ky + 1, '│', '#4a6878')
    }
  }
}

function drawLightSpot(c, w, h, s, flicker) {
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const px = s.cx + dx - 1
      const py = s.domeTop + 2 + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const dist = Math.sqrt(dx * dx / 7 + dy * dy / 2.5)
      if (dist > 1) continue
      const bri = (1 - dist) * (1 - dist) * 0.06 * flicker
      const cell = c.getCell(px, py)
      if (cell && cell.bg) {
        c.setCell(px, py, ' ', null, lerp(cell.bg, '#c0d0e0', bri))
      }
    }
  }
}

function drawGlassHighlight(c, w, s) {
  for (let y = s.domeY + 2; y < s.botY - 3; y++) {
    const hx = Math.floor(s.cx + s.rx - 3)
    if (hx < 0 || hx >= w) continue
    const jt = (y - s.domeY) / (s.botY - s.domeY)
    const bri = Math.sin(jt * Math.PI) * 0.12
    if (bri > 0.02) {
      const cell = c.getCell(hx, y)
      if (cell && cell.bg) {
        c.setCell(hx, y, ' ', null, lerp(cell.bg, '#a0ccdd', bri))
      }
    }
  }
  for (let y = s.domeY + 6; y < s.domeY + Math.floor((s.botY - s.domeY) * 0.4); y++) {
    const hx = Math.floor(s.cx - s.rx + 5)
    if (hx < 0 || hx >= w) continue
    const jt = (y - s.domeY - 6) / ((s.botY - s.domeY) * 0.34)
    const bri = Math.sin(jt * Math.PI) * 0.05
    if (bri > 0.01) {
      const cell = c.getCell(hx, y)
      if (cell && cell.bg) {
        c.setCell(hx, y, ' ', null, lerp(cell.bg, '#90b8cc', bri))
      }
    }
  }
}
