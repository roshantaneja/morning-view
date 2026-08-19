import { lerp, lerpMulti, SHADE, BLOCK } from '../src/theme.js'

export const title = 'Hidden Falls'
export const description = 'Where the gorge narrows and the light turns green — water finds its oldest way down'
export const fps = 3

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function cliffEdge(side, row, h, edges) {
  const i = Math.min(row, edges.length - 1)
  return i >= 0 ? edges[i][side] : (side === 0 ? 0.35 : 0.65)
}

export function setup(canvas) {
  const rng = srand(820)
  const h = canvas.height

  const edges = []
  let l = 0.35, r = 0.65
  for (let y = 0; y < h; y++) {
    const t = y / h
    const squeeze = Math.sin(Math.min(t / 0.82, 1) * Math.PI) * 0.07
    const j1 = Math.sin(y * 0.7) * 0.012 + Math.sin(y * 1.8 + 50) * 0.006
    const j2 = Math.sin(y * 0.7 + 30) * 0.012 + Math.sin(y * 1.8 + 80) * 0.006
    edges.push([0.35 + squeeze + j1, 0.65 - squeeze - j2])
  }

  const drops = []
  for (let i = 0; i < 90; i++) {
    drops.push({
      lane: 0.12 + rng() * 0.76,
      y: rng(),
      speed: 0.3 + rng() * 0.6,
      ch: Math.floor(rng() * 4),
      bri: 0.4 + rng() * 0.6,
    })
  }

  const mists = []
  for (let i = 0; i < 45; i++) {
    mists.push({
      x: 0.1 + rng() * 0.8,
      y: rng(),
      dx: (rng() - 0.5) * 0.006,
      rise: 0.02 + rng() * 0.06,
      ph: rng() * Math.PI * 2,
      alpha: 0.15 + rng() * 0.45,
    })
  }

  const splashes = []
  for (let i = 0; i < 30; i++) {
    splashes.push({
      ang: 0.3 + rng() * 2.5,
      maxR: 2 + rng() * 7,
      ph: rng() * Math.PI * 2,
      spd: 1 + rng() * 2,
    })
  }

  const mosses = []
  for (let i = 0; i < 90; i++) {
    mosses.push({
      side: rng() > 0.5 ? 0 : 1,
      rowT: 0.06 + rng() * 0.72,
      depth: 1 + Math.floor(rng() * 4),
      green: Math.floor(rng() * 5),
    })
  }

  return { edges, drops, mists, splashes, mosses }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  for (const d of state.drops) {
    d.y += d.speed * frame.dt * 0.35
    if (d.y > 1.05) d.y -= 1.1
  }
  for (const m of state.mists) {
    m.y -= m.rise * frame.dt
    m.x += m.dx + Math.sin(m.ph + frame.elapsed * 0.3) * 0.002
    m.ph += frame.dt * 0.3
    if (m.y < -0.05) m.y = 1.0
  }
  for (const s of state.splashes) s.ph += s.spd * frame.dt
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height
  const edges = state.edges

  const fallsTop = Math.floor(h * 0.07)
  const fallsBot = Math.floor(h * 0.77)
  const poolTop = Math.floor(h * 0.82)

  for (let y = 0; y < h; y++) {
    const le = Math.floor(cliffEdge(0, y, h, edges) * w)
    const re = Math.floor(cliffEdge(1, y, h, edges) * w)

    for (let x = 0; x < w; x++) {
      if (x < le || x >= re) {
        drawRock(canvas, x, y, le, re, w)
      } else if (y < fallsTop) {
        drawSky(canvas, x, y, fallsTop)
      } else if (y < fallsBot) {
        drawWaterBody(canvas, x, y, le, re, fallsTop, fallsBot, t)
      } else if (y < poolTop) {
        drawSplashBg(canvas, x, y, fallsBot, poolTop)
      } else {
        drawPool(canvas, x, y, poolTop, h, t)
      }
    }

    if (y >= fallsTop && y < poolTop) {
      if (le > 0 && le < w) {
        const mc = lerp('#1a3a1a', '#244a24', Math.sin(y * 0.5) * 0.5 + 0.5)
        canvas.setCell(le, y, BLOCK.left, mc)
      }
      if (re - 1 > 0 && re - 1 < w) {
        const mc = lerp('#1a3a1a', '#244a24', Math.sin(y * 0.6 + 1) * 0.5 + 0.5)
        canvas.setCell(re - 1, y, BLOCK.right, mc)
      }
    }
  }

  drawMoss(canvas, w, h, state, edges)
  drawDrops(canvas, w, h, state, fallsTop, fallsBot, edges)
  drawSplashParticles(canvas, w, h, state, fallsBot, poolTop, t)
  drawMistLayer(canvas, w, h, state, fallsBot, poolTop, t)
  drawRainbow(canvas, w, h, fallsBot, poolTop, t)
}

function drawRock(canvas, x, y, le, re, w) {
  const edgeDist = x < le ? (le - x) : (x - re + 1)
  const depth = Math.min(1, edgeDist / (w * 0.25))
  const n = Math.sin(x * 3.7 + y * 1.3) * 0.3 + Math.sin(x * 0.9 + y * 2.8) * 0.2 + 0.5
  const v = Math.max(0, Math.min(1, n))
  const br = 22 + v * 38 - depth * 16
  const bg = 18 + v * 30 - depth * 12
  const bb = 14 + v * 22 - depth * 10
  const bgc = '#' + h2(br) + h2(bg) + h2(bb)
  const fgc = '#' + h2(br + 14) + h2(bg + 12) + h2(bb + 8)
  const si = depth > 0.6 ? 0 : depth > 0.35 ? 1 : edgeDist <= 2 ? 3 : 2
  canvas.setCell(x, y, SHADE[si], fgc, bgc)
}

function drawSky(canvas, x, y, fallsTop) {
  const st = y / Math.max(1, fallsTop)
  const sky = lerpMulti(['#0e1a2a', '#162a44', '#1e3c5e', '#266078'], st)
  canvas.setCell(x, y, ' ', null, sky)
}

function drawWaterBody(canvas, x, y, le, re, fallsTop, fallsBot, t) {
  const mid = (le + re) / 2
  const halfW = Math.max(1, (re - le) / 2)
  const dist = Math.abs(x - mid) / halfW
  const vert = (y - fallsTop) / (fallsBot - fallsTop)
  const shimmer = Math.sin(x * 0.35 + y * 0.2 + t * 2) * 0.08 + 0.92
  const turb = Math.sin(y * 0.6 + t * 3) * vert * 0.12
  const d2 = Math.min(1, Math.max(0, dist + turb))
  const center = 1 - d2
  const r = Math.floor((12 + center * 30 + vert * 6) * shimmer)
  const g = Math.floor((28 + center * 55 + vert * 10) * shimmer)
  const b = Math.floor((48 + center * 75 + vert * 12) * shimmer)
  canvas.setCell(x, y, ' ', null, '#' + h2(r) + h2(g) + h2(b))
}

function drawSplashBg(canvas, x, y, fallsBot, poolTop) {
  const st = (y - fallsBot) / Math.max(1, poolTop - fallsBot)
  const r = Math.floor(10 + st * 4)
  const g = Math.floor(22 + st * 6)
  const b = Math.floor(36 + st * 8)
  canvas.setCell(x, y, ' ', null, '#' + h2(r) + h2(g) + h2(b))
}

function drawPool(canvas, x, y, poolTop, h, t) {
  const pt = (y - poolTop) / Math.max(1, h - poolTop)
  const ripple = Math.sin(x * 0.25 + t * 1.2) * 0.04 + Math.sin(x * 0.7 - t * 0.6) * 0.025
  const r = Math.floor(8 + pt * 5 + ripple * 15)
  const g = Math.floor(20 + pt * 8 + ripple * 25)
  const b = Math.floor(32 + pt * 12 + ripple * 35)
  const bgc = '#' + h2(r) + h2(g) + h2(b)
  if (y <= poolTop + 1) {
    const wp = Math.sin(x * 0.15 + t * 0.8)
    const ch = wp > 0.3 ? '~' : wp > -0.3 ? '~' : '-'
    const fr = 50 + Math.floor(ripple * 80)
    const fg = 80 + Math.floor(ripple * 100)
    const fb = 110 + Math.floor(ripple * 120)
    canvas.setCell(x, y, ch, '#' + h2(fr) + h2(fg) + h2(fb), bgc)
  } else {
    canvas.setCell(x, y, ' ', null, bgc)
  }
}

function drawMoss(canvas, w, h, state, edges) {
  const mc = ['#0c220c', '#143a14', '#1c5218', '#246a20', '#2c8228']
  const mch = [SHADE[0], SHADE[1], ':', BLOCK.light]
  for (const m of state.mosses) {
    const row = Math.floor(m.rowT * h)
    if (row < 0 || row >= h) continue
    const le = Math.floor(cliffEdge(0, row, h, edges) * w)
    const re = Math.floor(cliffEdge(1, row, h, edges) * w)
    for (let d = 0; d < m.depth; d++) {
      const px = m.side === 0 ? le - 1 - d : re + d
      if (px < 0 || px >= w) continue
      const ci = Math.min(m.green + Math.floor(d * 0.3), mc.length - 1)
      canvas.setCell(px, row, mch[Math.min(d, mch.length - 1)], mc[ci])
    }
  }
}

function drawDrops(canvas, w, h, state, fallsTop, fallsBot, edges) {
  const chars = ['|', BLOCK.light, ':', SHADE[0]]
  for (const d of state.drops) {
    if (d.y < 0 || d.y > 1) continue
    const row = Math.floor(fallsTop + d.y * (fallsBot - fallsTop))
    if (row < fallsTop || row >= fallsBot) continue
    const le = cliffEdge(0, row, h, edges)
    const re = cliffEdge(1, row, h, edges)
    const ww = re - le
    const col = Math.floor((le + d.lane * ww) * w)
    if (col < 4 || col >= w - 4) continue
    const cd = Math.abs(d.lane - 0.5) * 2
    const b = d.bri * (1 - cd * 0.35)
    const rv = Math.floor(150 + b * 90)
    const gv = Math.floor(195 + b * 55)
    const bv = Math.floor(220 + b * 35)
    canvas.setCell(col, row, chars[d.ch], '#' + h2(rv) + h2(gv) + h2(bv))
  }
}

function drawSplashParticles(canvas, w, h, state, fallsBot, poolTop, t) {
  const cx = Math.floor(w / 2)
  const cy = fallsBot + 1
  for (const s of state.splashes) {
    const r = s.maxR * (0.4 + 0.6 * Math.abs(Math.sin(s.ph)))
    const px = Math.floor(cx + Math.cos(s.ang) * r)
    const py = Math.floor(cy - Math.sin(s.ang) * r * 0.4)
    if (px < 4 || px >= w - 4 || py < fallsBot - 4 || py >= poolTop + 2) continue
    const fade = 0.3 + 0.7 * Math.abs(Math.sin(s.ph))
    if (fade < 0.15) continue
    const v = Math.floor(120 + fade * 120)
    canvas.setCell(px, py, r > 4 ? '.' : BLOCK.light, '#' + h2(v) + h2(Math.floor(v * 0.96)) + h2(v))
  }
}

function drawMistLayer(canvas, w, h, state, fallsBot, poolTop, t) {
  const mistTop = fallsBot - Math.floor(h * 0.12)
  const mistBot = poolTop + Math.floor(h * 0.06)
  for (const m of state.mists) {
    const py = Math.floor(mistTop + m.y * (mistBot - mistTop))
    const px = Math.floor(m.x * w)
    if (px < 3 || px >= w - 3 || py < 2 || py >= h - 4) continue
    const dist = Math.abs(m.y - 0.5)
    const fade = m.alpha * (1 - dist) * (0.6 + 0.4 * Math.sin(m.ph))
    if (fade < 0.08) continue
    const cell = canvas.getCell(px, py)
    if (cell && cell.bg) {
      const blended = lerp(cell.bg, '#b8d4e4', fade * 0.35)
      canvas.setCell(px, py, fade > 0.3 ? BLOCK.light : '.', '#a0c0d4', blended)
    }
  }
}

function drawRainbow(canvas, w, h, fallsBot, poolTop, t) {
  const cx = Math.floor(w * 0.5)
  const cy = fallsBot + 2
  const baseR = Math.min(w, h) * 0.14
  const pulse = 0.9 + Math.sin(t * 0.4) * 0.1
  const colors = ['#ff222244', '#ff882244', '#ffdd2244', '#22cc4444', '#2266ff44', '#8822dd44']
  const hues = ['#6a2020', '#6a4420', '#6a6a20', '#206a30', '#203060', '#442060']

  for (let band = 0; band < 6; band++) {
    const r = (baseR + band * 1.2) * pulse
    for (let a = 0.15; a < Math.PI - 0.15; a += 0.03) {
      const px = Math.floor(cx + Math.cos(a) * r)
      const py = Math.floor(cy - Math.sin(a) * r * 0.35)
      if (px < 4 || px >= w - 4 || py < fallsBot - 6 || py >= poolTop + 1) continue
      const cell = canvas.getCell(px, py)
      if (cell && cell.bg) {
        const blended = lerp(cell.bg, hues[band], 0.18)
        canvas.setCell(px, py, ' ', null, blended)
      }
    }
  }
}
