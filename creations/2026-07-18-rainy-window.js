import { lerpMulti, lerp, SHADE, BLOCK } from '../src/theme.js'

export const title = 'Rainy Window'
export const description = 'City lights shimmer through rain-streaked glass on a quiet night'
export const fps = 3

const NIGHT = ['#020408', '#040810', '#060c18', '#081020']
const GLASS_TINT = '#060a14'
const DROPLET_FG = ['#1a2838', '#243848', '#2e4858', '#386070']
const DROPLET_BRIGHT = '#4a7898'
const CITY_DARK = ['#040608', '#080c10', '#0c1018', '#101418']
const WINDOW_WARM = ['#3a2800', '#5c4008', '#8c6010', '#b88020', '#e0a830']
const WINDOW_COOL = ['#0c1830', '#183050', '#204870', '#286090']
const FRAME_COL = '#0a0c10'
const FRAME_INNER = '#141820'
const CONDENSATION = ['#0a1420', '#101c2c', '#162438']
const STREAK_TRAIL = ['#060c18', '#0a1424', '#0e1c30', '#122838']

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

export function setup(canvas) {
  const rng = srand(718)
  const w = canvas.width
  const h = canvas.height

  const buildings = []
  let bx = 6
  while (bx < w - 8) {
    const bw = 6 + Math.floor(rng() * 12)
    const bh = Math.floor(h * (0.2 + rng() * 0.45))
    const windows = []
    for (let wy = 0; wy < bh - 4; wy += 3 + Math.floor(rng() * 2)) {
      for (let wx = 1; wx < bw - 1; wx += 2 + Math.floor(rng())) {
        if (rng() > 0.35) {
          windows.push({
            x: wx, y: wy,
            warm: rng() > 0.3,
            bright: 0.3 + rng() * 0.7,
            flicker: rng() * Math.PI * 2,
          })
        }
      }
    }
    buildings.push({ x: bx, w: bw, h: bh, windows })
    bx += bw + Math.floor(rng() * 4)
  }

  const droplets = []
  for (let i = 0; i < 80; i++) {
    droplets.push(makeDroplet(rng, w, h))
  }

  const streaks = []
  for (let i = 0; i < 25; i++) {
    streaks.push(makeStreak(rng, w, h))
  }

  return { buildings, droplets, streaks, phase: 0, rngState: 718 }
}

function makeDroplet(rng, w, h) {
  return {
    x: 4 + Math.floor(rng() * (w - 8)),
    y: 4 + Math.floor(rng() * (h - 10)),
    size: rng() > 0.7 ? 2 : 1,
    speed: 0.3 + rng() * 0.8,
    wobble: rng() * Math.PI * 2,
    trail: Math.floor(2 + rng() * 5),
    progress: rng(),
  }
}

function makeStreak(rng, w, h) {
  return {
    x: 4 + Math.floor(rng() * (w - 8)),
    startY: Math.floor(rng() * (h * 0.3)),
    len: Math.floor(h * (0.2 + rng() * 0.5)),
    speed: 0.1 + rng() * 0.3,
    width: rng() > 0.6 ? 2 : 1,
    progress: rng(),
  }
}

export function render(canvas, data, state) {
  paint(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  state.phase += 0.06
  const w = canvas.width
  const h = canvas.height
  const rng = srand(state.rngState + Math.floor(state.phase * 10))

  for (const d of state.droplets) {
    d.progress += d.speed * 0.02
    if (d.progress > 1) {
      Object.assign(d, makeDroplet(rng, w, h))
      d.progress = 0
      d.y = 2
    }
  }

  for (const s of state.streaks) {
    s.progress += s.speed * 0.015
    if (s.progress > 1) {
      Object.assign(s, makeStreak(rng, w, h))
      s.progress = 0
    }
  }

  paint(canvas, state, frame.elapsed)
}

function paint(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const { buildings, droplets, streaks, phase } = state

  drawNightSky(canvas, w, h)
  drawCity(canvas, w, h, buildings, phase)
  drawGlassLayer(canvas, w, h)
  drawCondensation(canvas, w, h, phase)
  drawStreaks(canvas, w, h, streaks)
  drawDroplets(canvas, w, h, droplets, phase)
  drawFrame(canvas, w, h)
}

function drawNightSky(canvas, w, h) {
  for (let y = 0; y < h; y++) {
    const t = y / h
    const col = lerpMulti(NIGHT, t)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, col)
    }
  }
}

function drawCity(canvas, w, h, buildings, phase) {
  const skyline = h - 5

  for (const b of buildings) {
    const topY = skyline - b.h
    for (let by = topY; by < skyline; by++) {
      for (let bx = b.x; bx < b.x + b.w && bx < w - 4; bx++) {
        const depth = (by - topY) / b.h
        const col = lerpMulti(CITY_DARK, Math.min(1, depth * 0.5 + 0.2))
        canvas.setCell(bx, by, ' ', null, col)
      }
    }

    for (const win of b.windows) {
      const wx = b.x + win.x
      const wy = skyline - b.h + win.y
      if (wx >= w - 4 || wy < 3 || wy >= skyline) continue

      const flicker = Math.sin(phase * 0.8 + win.flicker) * 0.1 + 0.9
      const bright = win.bright * flicker
      const pal = win.warm ? WINDOW_WARM : WINDOW_COOL
      const col = lerpMulti(pal, Math.min(1, bright))

      canvas.setCell(wx, wy, SHADE[2], lerp(col, '#000000', 0.3), lerp(col, '#000000', 0.6))

      if (bright > 0.5) {
        const glowCol = lerp(col, '#000000', 0.75)
        if (wx > 0) canvas.setCell(wx - 1, wy, ' ', null, glowCol)
        if (wx < w - 5) canvas.setCell(wx + 1, wy, ' ', null, glowCol)
        if (wy > 3) canvas.setCell(wx, wy - 1, ' ', null, lerp(glowCol, '#000000', 0.4))
        if (wy < skyline - 1) canvas.setCell(wx, wy + 1, ' ', null, lerp(glowCol, '#000000', 0.4))
      }
    }
  }
}

function drawGlassLayer(canvas, w, h) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = canvas.getCell(x, y)
      if (!cell) continue
      const bg = cell.bg || '#020408'
      const blurred = lerp(bg, GLASS_TINT, 0.15)
      if (cell.char === ' ') {
        canvas.setCell(x, y, ' ', null, blurred)
      } else {
        const fg = cell.fg || bg
        canvas.setCell(x, y, cell.char, lerp(fg, GLASS_TINT, 0.1), blurred)
      }
    }
  }
}

function drawCondensation(canvas, w, h, phase) {
  const bandH = Math.floor(h * 0.12)
  const topBand = h - bandH - 5
  const bottomBand = h - 5

  for (let y = topBand; y < bottomBand; y++) {
    const t = (y - topBand) / (bottomBand - topBand)
    const density = Math.pow(t, 1.5)
    for (let x = 3; x < w - 3; x++) {
      const n = Math.sin(x * 0.15 + y * 0.3 + phase * 0.3) *
               Math.cos(x * 0.08 - phase * 0.15 + y * 0.12) *
               Math.sin(x * 0.22 + y * 0.18 - phase * 0.08)
      if (n * density > 0.15) {
        const col = lerpMulti(CONDENSATION, Math.min(1, n * density * 2))
        canvas.setCell(x, y, '·', col)
      }
    }
  }

  for (let x = 3; x < w - 3; x++) {
    const n = Math.sin(x * 0.2 + phase * 0.2) * Math.cos(x * 0.13) + 0.5
    if (n > 0.6) {
      for (let y = 0; y < Math.floor(h * 0.08); y++) {
        const fade = 1 - y / (h * 0.08)
        if (fade * n > 0.4) {
          const col = lerpMulti(CONDENSATION, Math.min(1, fade * 0.7))
          canvas.setCell(x, y + 3, '·', col)
        }
      }
    }
  }
}

function drawStreaks(canvas, w, h, streaks) {
  for (const s of streaks) {
    const headY = Math.floor(s.startY + s.len * s.progress)
    const tailLen = Math.floor(s.len * 0.4)

    for (let dy = 0; dy < tailLen; dy++) {
      const y = headY - dy
      if (y < 3 || y >= h - 5) continue
      const x = s.x
      if (x < 3 || x >= w - 3) continue

      const fade = 1 - dy / tailLen
      const col = lerpMulti(STREAK_TRAIL, Math.min(1, fade))
      const ch = dy === 0 ? '│' : fade > 0.6 ? '┊' : '·'
      canvas.setCell(x, y, ch, col)
      if (s.width > 1 && x + 1 < w - 3) {
        canvas.setCell(x + 1, y, fade > 0.5 ? '·' : ' ', lerp(col, '#000000', 0.4))
      }
    }
  }
}

function drawDroplets(canvas, w, h, droplets, phase) {
  for (const d of droplets) {
    const y = Math.floor(d.y + (h - 10) * d.progress)
    const wobble = Math.sin(phase * 1.5 + d.wobble) * 0.5
    const x = d.x + Math.round(wobble)

    if (x < 3 || x >= w - 3 || y < 3 || y >= h - 5) continue

    const bright = Math.sin(phase + d.wobble) * 0.2 + 0.7
    const col = lerpMulti(DROPLET_FG, Math.min(1, bright))

    if (d.size > 1) {
      canvas.setCell(x, y, '●', col)
      const cell = canvas.getCell(x, y + 1)
      if (cell && y + 1 < h - 5) {
        canvas.setCell(x, y + 1, '╷', lerp(col, '#000000', 0.4))
      }
    } else {
      canvas.setCell(x, y, '•', col)
    }

    const behindCell = canvas.getCell(x, y)
    if (behindCell) {
      const lensCheck = canvas.getCell(x, y + 2)
      if (lensCheck && lensCheck.bg) {
        const isBright = lensCheck.bg !== '#020408' && lensCheck.bg !== GLASS_TINT
        if (isBright) {
          canvas.setCell(x, y, d.size > 1 ? '●' : '•', DROPLET_BRIGHT)
        }
      }
    }

    for (let ty = 1; ty <= d.trail; ty++) {
      const trailY = y - ty
      if (trailY < 3) break
      const trailFade = 1 - ty / (d.trail + 1)
      const trailCol = lerpMulti(STREAK_TRAIL, trailFade)
      canvas.setCell(x, trailY, ty === 1 ? '·' : ' ', trailCol, null)
    }
  }
}

function drawFrame(canvas, w, h) {
  for (let x = 0; x < w; x++) {
    for (let t = 0; t < 3; t++) {
      canvas.setCell(x, t, SHADE[3 - t], FRAME_COL, FRAME_COL)
      canvas.setCell(x, h - 1 - t, SHADE[3 - t], FRAME_COL, FRAME_COL)
    }
  }
  for (let y = 0; y < h; y++) {
    for (let t = 0; t < 3; t++) {
      canvas.setCell(t, y, SHADE[3 - t], FRAME_COL, FRAME_COL)
      canvas.setCell(w - 1 - t, y, SHADE[3 - t], FRAME_COL, FRAME_COL)
    }
  }

  for (let x = 3; x < w - 3; x++) {
    canvas.setCell(x, 3, '─', FRAME_INNER)
    canvas.setCell(x, h - 4, '─', FRAME_INNER)
  }
  for (let y = 3; y < h - 3; y++) {
    canvas.setCell(3, y, '│', FRAME_INNER)
    canvas.setCell(w - 4, y, '│', FRAME_INNER)
  }
  canvas.setCell(3, 3, '╭', FRAME_INNER)
  canvas.setCell(w - 4, 3, '╮', FRAME_INNER)
  canvas.setCell(3, h - 4, '╰', FRAME_INNER)
  canvas.setCell(w - 4, h - 4, '╯', FRAME_INNER)
}
