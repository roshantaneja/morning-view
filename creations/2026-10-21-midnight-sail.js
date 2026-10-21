import { BLOCK } from '../src/theme.js'

export const title = 'Midnight Sail'
export const description =
  'She crosses without hurry — her lantern a golden period at the end of the horizon\'s dark sentence'
export const fps = 2

const TAU = Math.PI * 2

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

export function setup(canvas, data) {
  const W = canvas.width
  const H = canvas.height
  const rng = srand(1021)
  const waterY = Math.floor(H * 0.56)

  const stars = []
  for (let i = 0; i < 210; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * (waterY - 2)),
      ph: rng() * TAU,
      br: 0.12 + rng() * 0.88,
    })
  }

  const phosphor = []
  for (let i = 0; i < 50; i++) {
    phosphor.push({
      x: rng() * W,
      y: waterY + 3 + rng() * (H - waterY - 5),
      ph: rng() * TAU,
      br: 0.2 + rng() * 0.8,
    })
  }

  return { waterY, stars, phosphor, rng }
}

function drawScene(canvas, state, t) {
  const W = canvas.width
  const H = canvas.height
  const { waterY, stars, phosphor } = state

  const moonX = Math.floor(W * 0.78)
  const moonY = Math.floor(H * 0.11)
  const bob = Math.round(Math.sin(t * 0.35) * 0.9)

  const shipCX = Math.floor(W * 0.43)
  const bowX = shipCX - Math.floor(W * 0.19)
  const sternX = shipCX + Math.floor(W * 0.14)
  const shipW = Math.max(1, sternX - bowX)
  const deckY = waterY - 3 + bob
  const mainH = Math.floor(H * 0.33)

  // ══════════════════════════════════════
  //  SKY
  // ══════════════════════════════════════
  for (let y = 0; y < waterY; y++) {
    const vf = y / H
    for (let x = 0; x < W; x++) {
      const dx = (x - moonX) / W
      const dy = (y - moonY) / H
      const md = Math.sqrt(dx * dx + dy * dy)
      const glow = Math.pow(Math.max(0, 1 - md * 2.0), 2.8) * 0.18

      const mwAngle = (y - H * 0.35) * 0.6 + (x - W * 0.3) * 0.25
      const mwDist = Math.abs(mwAngle) / (H * 0.22)
      const milky = Math.pow(Math.max(0, 1 - mwDist), 3) * 0.025

      canvas.setCell(x, y, ' ', null, c2h(
        2 + vf * 6 + glow * 50 + milky * 30,
        4 + vf * 8 + glow * 55 + milky * 40,
        14 + vf * 14 + glow * 38 + milky * 25))
    }
  }

  // ══════════════════════════════════════
  //  STARS
  // ══════════════════════════════════════
  for (const s of stars) {
    if (s.y >= waterY) continue
    const tw = 0.25 + Math.sin(t * 1.05 + s.ph) * 0.75
    const b = tw * s.br
    if (b > 0.28)
      canvas.setCell(s.x, s.y, b > 0.85 ? '✦' : '·',
        c2h(160 + b * 95, 175 + b * 80, 210 + b * 45))
  }

  // ══════════════════════════════════════
  //  MOON
  // ══════════════════════════════════════
  const mR = 3.5
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -10; dx <= 10; dx++) {
      const nd = Math.sqrt((dx / 2) ** 2 + dy ** 2) / mR
      const shadow = Math.sqrt(((dx / 2) + 1.3) ** 2 + dy ** 2) / mR
      if (nd < 1.0 && shadow > 0.80) {
        const px = moonX + dx, py = moonY + dy
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const b = 0.72 + (1 - nd) * 0.28
          canvas.setCell(px, py, ' ', null, c2h(218 * b, 222 * b, 198 * b))
        }
      }
    }
  }
  for (let dy = -9; dy <= 9; dy++) {
    for (let dx = -18; dx <= 18; dx++) {
      const nd = Math.sqrt((dx / 2) ** 2 + dy ** 2) / 7.5
      if (nd >= 1.0 || nd <= 0.35) continue
      const px = moonX + dx, py = moonY + dy
      if (px < 0 || px >= W || py < 0 || py >= waterY) continue
      const cell = canvas.getCell(px, py)
      if (cell && cell.char === ' ') {
        const g = (1 - nd) * 0.10
        canvas.setCell(px, py, ' ', null, c2h(
          4 + g * 60, 7 + g * 65, 16 + g * 40))
      }
    }
  }

  // ══════════════════════════════════════
  //  WATER
  // ══════════════════════════════════════
  for (let y = waterY; y < H; y++) {
    const df = (y - waterY) / Math.max(1, H - waterY)
    for (let x = 0; x < W; x++) {
      const mdx = Math.abs(x - moonX) / W
      const mp = Math.pow(Math.max(0, 1 - mdx * 4.5), 2.5) *
                 Math.max(0, 1 - df * 1.6) * 0.20
      const wv = Math.sin(x * 0.1 + y * 0.25 + t * 0.5) * 0.015
      canvas.setCell(x, y, ' ', null, c2h(
        2 + df * 3 + mp * 65 + wv * 20,
        4 + df * 5 + mp * 75 + wv * 25,
        14 + df * 7 + mp * 50 + wv * 15))
    }
  }

  // Moon shimmer path
  for (let y = waterY; y < Math.min(waterY + 22, H); y++) {
    const yf = (y - waterY) / 22
    const spread = 4 + yf * 18
    const center = moonX + Math.sin(y * 0.35 + t * 0.4) * 2
    const x0 = Math.max(0, Math.floor(center - spread))
    const x1 = Math.min(W - 1, Math.ceil(center + spread))
    for (let x = x0; x <= x1; x++) {
      const dx = Math.abs(x - center)
      if (dx >= spread) continue
      const b = (1 - dx / spread) * (1 - yf * 0.55)
      const shimmer = Math.sin(x * 1.3 + y * 0.5 + t * 2.5) * 0.35 + 0.65
      const intensity = b * shimmer
      if (intensity > 0.10)
        canvas.setCell(x, y, shimmer > 0.88 ? '~' : ' ',
          c2h(155 * intensity, 170 * intensity, 195 * intensity),
          c2h(4 + intensity * 42, 7 + intensity * 50, 16 + intensity * 34))
    }
  }

  // ══════════════════════════════════════
  //  HULL
  // ══════════════════════════════════════
  for (let x = bowX; x <= sternX; x++) {
    if (x < 0 || x >= W) continue
    const rel = (x - bowX) / shipW
    const bowRise = Math.pow(Math.min(rel * 3.5, 1), 0.65)
    const sternDip = rel > 0.72 ? Math.pow((rel - 0.72) / 0.28, 2) * 1.5 : 0
    const depth = Math.max(0, bowRise * 7 - sternDip)
    for (let dy = 0; dy <= Math.floor(depth); dy++) {
      const py = deckY + dy
      if (py < 0 || py >= H) continue
      const sh = 0.55 - dy * 0.055
      canvas.setCell(x, py, BLOCK.full,
        c2h(44 * sh, 28 * sh, 15 * sh),
        c2h(44 * sh, 28 * sh, 15 * sh))
    }
  }

  // Deck strip
  for (let x = bowX + 1; x <= sternX; x++) {
    if (x >= 0 && x < W && deckY >= 0 && deckY < H)
      canvas.setCell(x, deckY, BLOCK.full, '#1E120A', '#1E120A')
  }

  // Railing
  for (let x = bowX + 3; x <= sternX - 1; x++) {
    const py = deckY - 1
    if (x >= 0 && x < W && py >= 0 && py < H)
      canvas.setCell(x, py, '─', '#3A2215')
  }

  // Raised stern (poop deck)
  const sRiseX = sternX - Math.floor(shipW * 0.22)
  for (let x = sRiseX; x <= sternX; x++) {
    if (x < 0 || x >= W) continue
    const rf = (x - sRiseX) / Math.max(1, sternX - sRiseX)
    for (let dy = -Math.floor(rf * 4); dy < 0; dy++) {
      const py = deckY + dy
      if (py >= 0 && py < H)
        canvas.setCell(x, py, BLOCK.full, '#2C180C', '#2C180C')
    }
  }

  // Stern railing
  for (let x = sRiseX + 1; x <= sternX; x++) {
    const rf = (x - sRiseX) / Math.max(1, sternX - sRiseX)
    const railY = deckY - Math.floor(rf * 4) - 1
    if (x >= 0 && x < W && railY >= 0 && railY < H)
      canvas.setCell(x, railY, '─', '#3A2215')
  }

  // Stern cabin windows
  for (let i = 0; i < 3; i++) {
    const wx = sternX - 1 - i * 2
    const wy = deckY - 1
    if (wx > sRiseX && wx < W && wy >= 0 && wy < H) {
      const f = 0.65 + Math.sin(t * 2.0 + i * 1.5) * 0.35
      canvas.setCell(wx, wy, BLOCK.full,
        c2h(255 * f, 195 * f, 80 * f),
        c2h(255 * f, 195 * f, 80 * f))
    }
  }

  // Bowsprit
  for (let i = 1; i <= 8; i++) {
    const px = bowX - i
    const py = deckY - 1 - Math.floor(i * 0.3)
    if (px >= 0 && px < W && py >= 0 && py < H)
      canvas.setCell(px, py, '─', '#4A2A18')
  }

  // ══════════════════════════════════════
  //  MASTS & SAILS
  // ══════════════════════════════════════
  const mastsData = [
    { rx: 0.22, h: Math.floor(mainH * 0.78), n: 2 },
    { rx: 0.48, h: mainH,                     n: 3 },
    { rx: 0.76, h: Math.floor(mainH * 0.62),  n: 2 },
  ]

  for (const m of mastsData) {
    const mx = Math.floor(bowX + shipW * m.rx)
    if (mx < 0 || mx >= W) continue
    const mTop = deckY - m.h + bob

    // Mast pole
    for (let y = Math.max(0, mTop); y <= Math.min(H - 1, deckY); y++)
      canvas.setCell(mx, y, '│', '#4A2A18')

    // Sails
    const gap = Math.max(1, (m.h - 5) / m.n)
    for (let s = 0; s < m.n; s++) {
      const yardY = Math.floor(mTop + 3 + s * gap)
      const sailH = Math.max(2, Math.floor(gap * 0.72))
      const yardHW = Math.floor(7 + (m.n - 1 - s) * 3)

      // Yard (horizontal spar)
      for (let dx = -yardHW; dx <= yardHW; dx++) {
        const px = mx + dx
        if (px >= 0 && px < W && yardY >= 0 && yardY < H)
          canvas.setCell(px, yardY, '─', '#4A2A18')
      }

      // Sail canvas
      for (let dy = 1; dy <= sailH; dy++) {
        const belly = Math.sin((dy / sailH) * Math.PI) * 2.0
        const sw = Math.floor(yardHW + belly)
        for (let dx = -sw; dx <= sw; dx++) {
          const px = mx + dx, py = yardY + dy
          if (px < 0 || px >= W || py < 0 || py >= H) continue
          const lit = (dx + sw) / Math.max(1, sw * 2)
          const b = 0.40 + lit * 0.50 + Math.sin(dx * 0.35 + dy * 0.25) * 0.04
          canvas.setCell(px, py, BLOCK.full,
            c2h(180 * b, 174 * b, 156 * b),
            c2h(180 * b, 174 * b, 156 * b))
        }
      }
    }

    // Flag on mainmast
    if (m.h === mainH) {
      const fy = mTop - 1
      if (fy >= 0 && fy < H) {
        if (mx + 1 < W)
          canvas.setCell(mx + 1, fy, '▸',
            c2h(170 + Math.sin(t * 2.2) * 45, 38, 38))
        if (mx + 2 < W)
          canvas.setCell(mx + 2, fy, '▸',
            c2h(150 + Math.sin(t * 2.2 + 0.5) * 35, 28, 28))
      }

      // Crow's nest
      const cny = mTop + 2
      if (cny >= 0 && cny < H) {
        for (let dx = -2; dx <= 2; dx++) {
          const px = mx + dx
          if (px >= 0 && px < W)
            canvas.setCell(px, cny, '─', '#3A1E10')
        }
      }
    }
  }

  // ══════════════════════════════════════
  //  RIGGING
  // ══════════════════════════════════════
  for (const m of mastsData) {
    const mx = Math.floor(bowX + shipW * m.rx)
    const mTop = deckY - m.h + bob
    for (let side = -1; side <= 1; side += 2) {
      const endX = mx + side * Math.floor(shipW * 0.11)
      for (let s = 5; s < m.h; s += 3) {
        const f = s / m.h
        const px = Math.round(mx + (endX - mx) * f)
        const py = Math.round(mTop + s)
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const cell = canvas.getCell(px, py)
          if (cell && (cell.char === ' ' || cell.char === '·' || cell.char === '✦'))
            canvas.setCell(px, py, '·', '#2A1810')
        }
      }
    }
  }

  // Stays between masts (horizontal lines at top)
  if (mastsData.length >= 2) {
    for (let i = 0; i < mastsData.length - 1; i++) {
      const m1x = Math.floor(bowX + shipW * mastsData[i].rx)
      const m2x = Math.floor(bowX + shipW * mastsData[i + 1].rx)
      const m1top = deckY - mastsData[i].h + bob + 4
      const m2top = deckY - mastsData[i + 1].h + bob + 4
      const steps = m2x - m1x
      for (let s = 3; s < steps; s += 4) {
        const f = s / steps
        const px = m1x + s
        const py = Math.round(m1top + (m2top - m1top) * f)
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const cell = canvas.getCell(px, py)
          if (cell && (cell.char === ' ' || cell.char === '·' || cell.char === '✦'))
            canvas.setCell(px, py, '·', '#221510')
        }
      }
    }
  }

  // ══════════════════════════════════════
  //  STERN LANTERN
  // ══════════════════════════════════════
  const lx = sternX + 1
  const ly = deckY - 5 + bob
  if (lx >= 0 && lx < W && ly >= 0 && ly < H) {
    const fl = 0.78 + Math.sin(t * 3.2) * 0.12 + Math.sin(t * 5.1) * 0.10
    canvas.setCell(lx, ly, '◆', c2h(255 * fl, 195 * fl, 75 * fl))

    // Warm glow halo
    for (let dy = -3; dy <= 4; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        if (dx === 0 && dy === 0) continue
        const px = lx + dx, py = ly + dy
        if (px < 0 || px >= W || py < 0 || py >= H) continue
        const d = Math.sqrt(dx * dx / 3.5 + dy * dy)
        if (d > 3.5) continue
        const g = (1 - d / 3.5) * fl * 0.22
        const cell = canvas.getCell(px, py)
        if (cell && (cell.char === ' ' || cell.char === '·' || cell.char === '~'))
          canvas.setCell(px, py, ' ', null, c2h(
            8 + g * 140, 7 + g * 88, 5 + g * 22))
      }
    }
  }

  // Lantern pole
  for (let dy = 1; dy <= 2; dy++) {
    const px = lx, py = ly + dy
    if (px >= 0 && px < W && py >= 0 && py < H)
      canvas.setCell(px, py, '│', '#3A2010')
  }

  // ══════════════════════════════════════
  //  SHIP REFLECTION
  // ══════════════════════════════════════
  for (let ry = 1; ry <= 12; ry++) {
    const py = waterY + ry + 1
    if (py >= H) break
    const fade = 1 - ry / 12
    const wOff = Math.round(Math.sin(py * 0.28 + t * 1.1) * 1.5)
    for (let x = bowX - 5; x <= sternX + 6; x++) {
      const sx = x + wOff
      const sy = waterY - ry
      if (sx < 0 || sx >= W || sy < 0 || x < 0 || x >= W) continue
      const cell = canvas.getCell(sx, sy)
      if (!cell) continue
      if (cell.char === ' ' || cell.char === '·' || cell.char === '✦' ||
          cell.char === '~' || cell.char === '─') continue
      const b = fade * 0.20
      canvas.setCell(x, py, '~', c2h(30 * b + 3, 22 * b + 5, 14 * b + 16))
    }
  }

  // ══════════════════════════════════════
  //  PHOSPHORESCENCE
  // ══════════════════════════════════════
  for (const p of phosphor) {
    const tw = Math.sin(t * 0.9 + p.ph)
    if (tw < 0.15) continue
    const px = Math.round(p.x), py = Math.round(p.y)
    if (px < 0 || px >= W || py <= waterY || py >= H) continue
    const b = tw * p.br * 0.32
    canvas.setCell(px, py, '·', c2h(10 + b * 50, 60 + b * 130, 85 + b * 170))
  }

  // Bow wake
  for (let i = 0; i < 6; i++) {
    const wx = bowX - 1 - Math.floor(i * 0.5)
    const wy = waterY + i
    if (wx >= 0 && wx < W && wy >= 0 && wy < H) {
      const b = (1 - i * 0.15) * 0.35
      const wobble = Math.sin(t * 1.8 + i * 0.9)
      if (b > 0.04)
        canvas.setCell(wx + Math.round(wobble * 0.5), wy, '~',
          c2h(90 * b, 120 * b, 155 * b))
    }
  }

  // Stern wake ripples
  for (let i = 0; i < 4; i++) {
    const wx = sternX + 2 + i * 2
    const wy = waterY + 1 + Math.floor(i * 0.5)
    if (wx >= 0 && wx < W && wy >= 0 && wy < H) {
      const b = (1 - i * 0.22) * 0.25
      if (b > 0.03)
        canvas.setCell(wx, wy, '~', c2h(70 * b, 100 * b, 135 * b))
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const W = canvas.width
  for (const p of state.phosphor) {
    p.x += Math.sin(frame.elapsed * 0.25 + p.ph) * 0.04
    if (p.x < 0) p.x += W
    if (p.x >= W) p.x -= W
  }
  drawScene(canvas, state, frame.elapsed)
}
