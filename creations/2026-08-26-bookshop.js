import { lerp, lerpMulti, BLOCK } from '../src/theme.js'

export const title = 'Midnight Bookshop'
export const description = 'Amber lamplight spills across forgotten shelves — every spine a door left ajar'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const SPINES = [
  '#8b1a1a', '#a52828', '#c43838',
  '#1a3a6b', '#224488', '#2a5599',
  '#2a5a2a', '#336633', '#3a7a3a',
  '#6b3a1a', '#8b5533', '#a06830',
  '#5a2a6b', '#6b3388', '#7a44aa',
  '#8b7a20', '#aa9933', '#c4b040',
  '#1a5a5a', '#228888', '#33aaaa',
  '#883344', '#aa4455', '#c05566',
  '#2a2a4a', '#3a3a6a', '#4a4a8a',
  '#cc7722', '#dd8833', '#ee9944',
  '#4a3828', '#5a4838', '#6a5848',
  '#aa6633', '#bb7744', '#cc8855',
]

function genBooks(rng, x1, x2) {
  const books = []
  let x = x1
  while (x < x2) {
    books.push({
      x,
      h: 2 + Math.floor(rng() * 2),
      ci: Math.floor(rng() * SPINES.length),
      bri: 0.6 + rng() * 0.4,
    })
    x += 1 + (rng() > 0.88 ? 1 : 0)
  }
  return books
}

export function setup(canvas) {
  const rng = srand(826)
  const w = canvas.width, h = canvas.height

  const lX1 = 4
  const lX2 = Math.floor(w * 0.30)
  const rX1 = Math.floor(w * 0.70)
  const rX2 = w - 5

  const shelfTop = Math.floor(h * 0.04)
  const shelfBot = Math.floor(h * 0.86)
  const shelfH = 4
  const nShelves = Math.floor((shelfBot - shelfTop) / shelfH)

  const shelves = []
  for (let si = 0; si < nShelves; si++) {
    shelves.push({
      y: shelfTop + si * shelfH,
      left: genBooks(rng, lX1 + 1, lX2 - 1),
      right: genBooks(rng, rX1 + 1, rX2 - 1),
    })
  }

  const motes = []
  for (let i = 0; i < 55; i++) {
    motes.push({
      x: 0.25 + rng() * 0.50,
      y: 0.04 + rng() * 0.84,
      dx: (rng() - 0.5) * 0.003,
      rise: 0.005 + rng() * 0.008,
      ph: rng() * Math.PI * 2,
      bri: 0.3 + rng() * 0.7,
      big: rng() > 0.6,
    })
  }

  const lampX = Math.floor(w * 0.50)
  const lampY = Math.floor(h * 0.57)
  const deskY = Math.floor(h * 0.68)

  return {
    shelves, motes, lampX, lampY, deskY,
    lX1, lX2, rX1, rX2,
    shelfTop, shelfBot, shelfH,
  }
}

export function render(c, data, state) { drawScene(c, state, 0) }

export function update(c, data, frame, state) {
  for (const m of state.motes) {
    m.y -= m.rise * frame.dt
    m.x += m.dx + Math.sin(m.ph + frame.elapsed * 0.4) * 0.0006
    m.ph += frame.dt * 0.4
    if (m.y < 0.02) { m.y = 0.86; m.x = 0.25 + (m.ph % 1) * 0.50 }
  }
  drawScene(c, state, frame.elapsed)
}

function drawScene(c, s, t) {
  const w = c.width, h = c.height
  drawBg(c, w, h)
  drawPanels(c, w, h, s)
  drawBooks(c, w, h, s)
  drawFloor(c, w, h, s)
  drawDesk(c, w, h, s)
  drawGlow(c, w, h, s, t)
  drawLamp(c, w, h, s, t)
  drawCat(c, w, h, s, t)
  drawMotes(c, w, h, s, t)
}

function drawBg(c, w, h) {
  for (let y = 0; y < h; y++) {
    const yt = y / Math.max(1, h - 1)
    const bg = lerpMulti(['#050302', '#080604', '#0c0a06', '#0a0806'], yt)
    for (let x = 0; x < w; x++) c.setCell(x, y, ' ', null, bg)
  }
}

function drawPanels(c, w, h, s) {
  const sides = [[s.lX1, s.lX2], [s.rX1, s.rX2]]

  for (const [x1, x2] of sides) {
    for (let y = s.shelfTop; y <= s.shelfBot; y++) {
      if (y >= h) break
      for (let x = x1; x <= x2; x++) {
        if (x < 0 || x >= w) continue
        const grain =
          (Math.sin(x * 0.12 + y * 0.04) * 0.5 + 0.5) * 0.3 +
          (Math.sin(x * 0.03 - y * 0.09 + 2) * 0.5 + 0.5) * 0.7
        c.setCell(x, y, ' ', null, col(
          Math.floor(14 + grain * 10),
          Math.floor(10 + grain * 7),
          Math.floor(5 + grain * 3)
        ))
      }
    }

    for (const shelf of s.shelves) {
      const py = shelf.y + s.shelfH - 1
      if (py < 0 || py >= h) continue
      for (let x = x1 + 1; x < x2; x++) {
        if (x < 0 || x >= w) continue
        c.setCell(x, py, '─', '#3a2818', '#1e1408')
      }
      if (x1 >= 0 && x1 < w) c.setCell(x1, py, '├', '#2a1e12')
      if (x2 >= 0 && x2 < w) c.setCell(x2, py, '┤', '#2a1e12')
    }

    for (let y = s.shelfTop; y <= s.shelfBot; y++) {
      if (y >= h) break
      let isPlank = false
      for (const shelf of s.shelves) {
        if (y === shelf.y + s.shelfH - 1) { isPlank = true; break }
      }
      if (!isPlank) {
        if (x1 >= 0 && x1 < w) c.setCell(x1, y, '│', '#2a1e12')
        if (x2 >= 0 && x2 < w) c.setCell(x2, y, '│', '#2a1e12')
      }
    }

    if (s.shelfTop >= 0 && s.shelfTop < h) {
      for (let x = x1; x <= x2; x++) {
        if (x < 0 || x >= w) continue
        c.setCell(x, s.shelfTop, x === x1 ? '┌' : x === x2 ? '┐' : '─', '#2a1e12')
      }
    }
    const botY = Math.min(s.shelfBot, h - 1)
    if (botY >= 0 && botY < h) {
      for (let x = x1; x <= x2; x++) {
        if (x < 0 || x >= w) continue
        c.setCell(x, botY, x === x1 ? '└' : x === x2 ? '┘' : '─', '#2a1e12')
      }
    }
  }
}

function drawBooks(c, w, h, s) {
  for (const shelf of s.shelves) {
    const plankY = shelf.y + s.shelfH - 1
    for (const books of [shelf.left, shelf.right]) {
      for (const book of books) {
        for (let dy = 0; dy < book.h; dy++) {
          const by = plankY - 1 - dy
          if (by < 0 || by >= h || book.x < 0 || book.x >= w) continue
          const base = SPINES[book.ci]
          const shade = book.bri * (0.82 + (dy / Math.max(1, book.h)) * 0.18)
          const fc = lerp(base, '#040200', 1 - shade * 0.45)
          c.setCell(book.x, by, dy === book.h - 1 ? BLOCK.upper : BLOCK.full,
            fc, lerp(fc, '#020100', 0.3))
        }
      }
    }
  }
}

function drawFloor(c, w, h, s) {
  for (let y = s.shelfBot + 1; y < h; y++) {
    const yf = (y - s.shelfBot - 1) / Math.max(1, h - s.shelfBot - 2)
    for (let x = 0; x < w; x++) {
      const plank = Math.floor((x + Math.floor(y * 0.35)) / 7) % 2
      const grain = Math.sin(x * 0.16 + y * 0.05) * 0.2 + 0.8
      const base = plank === 0 ? 0.85 : 1.0
      c.setCell(x, y, ' ', null, col(
        Math.floor((16 + grain * 7) * base + yf * 3),
        Math.floor((11 + grain * 5) * base + yf * 2),
        Math.floor((6 + grain * 2) * base)
      ))
    }
  }
}

function drawDesk(c, w, h, s) {
  const dx1 = s.lampX - 14
  const dx2 = s.lampX + 14
  const dy = s.deskY

  if (dy >= 0 && dy < h - 4) {
    for (let x = dx1; x <= dx2; x++) {
      if (x < 4 || x >= w - 4) continue
      const grain = Math.sin(x * 0.25) * 0.08 + 0.92
      c.setCell(x, dy, BLOCK.upper, col(
        Math.floor(48 * grain), Math.floor(34 * grain), Math.floor(18 * grain)
      ), col(
        Math.floor(38 * grain), Math.floor(26 * grain), Math.floor(14 * grain)
      ))
    }
  }

  for (let y = dy + 1; y <= dy + 5; y++) {
    if (y >= h - 4) break
    if (dx1 + 3 >= 4 && dx1 + 3 < w - 4) c.setCell(dx1 + 3, y, '│', '#2a1c10')
    if (dx2 - 3 >= 4 && dx2 - 3 < w - 4) c.setCell(dx2 - 3, y, '│', '#2a1c10')
  }

  const sbx = s.lampX - 9
  if (dy - 1 >= 2 && dy - 1 < h - 4 && sbx >= 5 && sbx + 5 < w - 5) {
    for (let dx = 0; dx < 5; dx++) c.setCell(sbx + dx, dy - 1, BLOCK.full, '#5a1818', '#3a0c0c')
    for (let dx = 0; dx < 4; dx++) c.setCell(sbx + dx + 1, dy - 2, BLOCK.full, '#1a3060', '#0c1a38')
    for (let dx = 0; dx < 3; dx++) c.setCell(sbx + dx + 1, dy - 3, BLOCK.full, '#2a5a20', '#163010')
  }
}

function drawGlow(c, w, h, s, t) {
  const pulse = 1 + Math.sin(t * 1.5) * 0.03 + Math.sin(t * 2.7) * 0.015
  const R = Math.min(w, h) * 0.48
  const gcx = s.lampX
  const gcy = s.lampY + 2

  const top = Math.max(0, Math.floor(gcy - R))
  const bot = Math.min(h, Math.ceil(gcy + R))
  const left = Math.max(0, Math.floor(gcx - R))
  const right = Math.min(w, Math.ceil(gcx + R))

  for (let y = top; y < bot; y++) {
    for (let x = left; x < right; x++) {
      const dx = x - gcx
      const dy = (y - gcy) * 0.9
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= R) continue

      const intensity = Math.pow(1 - dist / R, 2.2) * 0.25 * pulse
      if (intensity < 0.003) continue

      const cell = c.getCell(x, y)
      if (!cell || !cell.bg) continue

      c.setCell(x, y, cell.char,
        cell.fg ? lerp(cell.fg, '#ffdd88', intensity * 0.55) : cell.fg,
        lerp(cell.bg, '#ffcc55', intensity)
      )
    }
  }
}

function drawLamp(c, w, h, s, t) {
  const lx = s.lampX
  const ly = s.lampY
  if (ly < 4 || ly >= h - 10 || lx < 8 || lx >= w - 8) return

  const pulse = Math.sin(t * 1.5) * 0.04 + 0.96

  for (let dx = -2; dx <= 2; dx++) {
    const px = lx + dx
    if (px < 4 || px >= w - 4) continue
    const bri = (1 - Math.abs(dx) / 3) * pulse
    c.setCell(px, ly, ' ', null, col(
      Math.floor(120 * bri), Math.floor(85 * bri), Math.floor(30 * bri)
    ))
  }

  for (let dx = -3; dx <= 3; dx++) {
    const px = lx + dx
    if (px < 4 || px >= w - 4) continue
    const bri = (1 - Math.abs(dx) / 4) * pulse
    c.setCell(px, ly + 1, BLOCK.lower, col(
      Math.floor(200 * bri), Math.floor(160 * bri), Math.floor(70 * bri)
    ), col(
      Math.floor(140 * bri), Math.floor(105 * bri), Math.floor(38 * bri)
    ))
  }

  c.setCell(lx, ly + 2, '●', col(
    Math.floor(255 * pulse), Math.floor(230 * pulse), Math.floor(140 * pulse)
  ))

  const stemBot = s.deskY - 1
  for (let y = ly + 3; y <= stemBot; y++) {
    if (y >= h - 4) break
    c.setCell(lx, y, '│', '#8a7040')
  }

  if (stemBot >= 2 && stemBot < h - 4) {
    c.setCell(lx - 1, stemBot, '╶', '#8a7040')
    c.setCell(lx, stemBot, '┴', '#8a7040')
    c.setCell(lx + 1, stemBot, '╴', '#8a7040')
  }
}

function drawCat(c, w, h, s, t) {
  const cx = s.lampX + 6
  const cy = s.deskY - 1
  if (cy < 4 || cy >= h - 4 || cx < 6 || cx + 5 >= w - 4) return

  const wag = Math.sin(t * 0.6) > 0.75
  const fur = '#9a7a55'
  const dark = '#7a5a3a'

  c.setCell(cx + 1, cy - 2, '^', fur)
  c.setCell(cx + 3, cy - 2, '^', fur)

  c.setCell(cx, cy - 1, '(', dark)
  c.setCell(cx + 1, cy - 1, '-', fur)
  c.setCell(cx + 2, cy - 1, '.', fur)
  c.setCell(cx + 3, cy - 1, '-', fur)
  c.setCell(cx + 4, cy - 1, ')', dark)

  c.setCell(cx + 1, cy, 'u', fur)
  c.setCell(cx + 3, cy, 'u', fur)
  c.setCell(cx + 4, cy, wag ? '~' : '-', dark)
}

function drawMotes(c, w, h, s, t) {
  const gcx = s.lampX
  const gcy = s.lampY + 2
  const maxR = Math.min(w, h) * 0.36

  for (const m of s.motes) {
    const px = Math.floor(m.x * w)
    const py = Math.floor(m.y * h)
    if (px < 5 || px >= w - 5 || py < 3 || py >= h - 5) continue

    const dx = px - gcx
    const dy = py - gcy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > maxR) continue

    const fade = Math.pow(1 - dist / maxR, 1.3)
    const pulse = Math.sin(t * 0.7 + m.ph) * 0.3 + 0.7
    const bri = m.bri * fade * pulse
    if (bri < 0.1) continue

    c.setCell(px, py, m.big ? '·' : '.', col(
      Math.floor(180 + bri * 75),
      Math.floor(145 + bri * 55),
      Math.floor(70 + bri * 40)
    ))
  }
}
