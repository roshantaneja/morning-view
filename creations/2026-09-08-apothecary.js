import { lerp } from '../src/theme.js'

export const title = 'Apothecary'
export const description = 'Amber light catches jeweled elixirs — every bottle holds a story the shopkeeper will never tell'
export const fps = 3

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const ELIXIRS = [
  '#8832c8', '#c03030', '#20a050', '#c89020', '#2078b0',
  '#c04880', '#20a898', '#d06818', '#5040c8', '#90b028',
]
const SIGILS = ['☿', '♄', '♃', '♂', '☉', '♀', '☽', 'Ω', 'Ψ', 'Φ']

export function setup(canvas) {
  const rng = srand(908)
  const W = canvas.width, H = canvas.height

  const gap = Math.max(11, Math.floor(H / 7))
  const shelves = []
  for (let i = 0; i < 8; i++) {
    const y = Math.floor(H * 0.12) + i * gap
    if (y >= H - 8) break
    shelves.push(y)
  }

  const candles = []
  const cIdx = [1, Math.floor(shelves.length / 2), Math.max(0, shelves.length - 2)]
  for (const i of [...new Set(cIdx)]) {
    if (i >= 0 && i < shelves.length) {
      candles.push({ x: 6 + Math.floor(rng() * (W - 12)), sy: shelves[i], ph: rng() * TAU })
    }
  }

  const light = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let best = 0
      for (const c of candles) {
        const dx = (x - c.x) * 1.3, dy = y - (c.sy - 5)
        const v = Math.max(0, 1 - (dx * dx + dy * dy) / 1200)
        if (v > best) best = v
      }
      light[y * W + x] = best * best
    }
  }

  const bottles = []
  for (const sy of shelves) {
    let bx = 2 + Math.floor(rng() * 4)
    while (bx < W - 5) {
      const bw = 3 + Math.floor(rng() * 3)
      const bh = 3 + Math.floor(rng() * 5)
      let skip = false
      for (const c of candles) {
        if (c.sy === sy && Math.abs(c.x - bx - bw / 2) < bw + 3) skip = true
      }
      if (!skip && bx + bw < W) {
        bottles.push({
          x: bx, y: sy - bh, w: bw, h: bh,
          ec: ELIXIRS[Math.floor(rng() * ELIXIRS.length)],
          fill: 0.3 + rng() * 0.6,
          bub: rng() > 0.82, glow: rng() > 0.85,
          sig: rng() > 0.72 ? SIGILS[Math.floor(rng() * SIGILS.length)] : null,
          ph: rng() * TAU,
        })
      }
      bx += bw + 1 + Math.floor(rng() * 3)
    }
  }

  const herbs = []
  for (let x = 1; x < W - 1; x += 2 + Math.floor(rng() * 3)) {
    if (rng() > 0.48) {
      herbs.push({ x, len: 2 + Math.floor(rng() * 4), hue: lerp('#1a4418', '#2d6420', rng()) })
    }
  }

  const motes = Array.from({ length: 25 }, () => ({
    x: rng() * W, y: rng() * H, vy: -0.12 - rng() * 0.25, ph: rng() * TAU,
  }))

  return { W, H, shelves, candles, light, bottles, herbs, motes }
}

export function render(canvas, data, state) {
  paint(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  paint(canvas, state, frame.elapsed)
}

function paint(canvas, st, t) {
  const { W, H, shelves, candles, light, bottles, herbs, motes } = st

  let flk = 0
  for (const c of candles) flk += 0.65 + 0.35 * Math.sin(t * 5.2 + c.ph) * Math.cos(t * 3.5 + c.ph * 1.4)
  flk /= candles.length || 1

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const l = Math.min(light[y * W + x] * flk * 0.4, 1)
      canvas.setCell(x, y, ' ', null, col(14 + 44 * l, 8 + 24 * l, 4 + 12 * l))
    }
  }

  for (let x = 0; x < W; x++) canvas.setCell(x, 0, '━', '#3a2818')

  const stk = ['│', '┊', '╽']
  for (const h of herbs) {
    const sw = Math.sin(t * 0.7 + h.x * 0.35) * 0.6
    canvas.setCell(h.x, 0, '┰', '#4a3020')
    for (let i = 0; i < h.len; i++) {
      const hx = h.x + Math.round(sw * i * 0.3)
      const hy = 1 + i
      if (hx >= 0 && hx < W && hy < H) {
        canvas.setCell(hx, hy, i === h.len - 1 ? '♣' : stk[i % 3], lerp(h.hue, '#080804', i / (h.len + 1)))
      }
    }
  }

  for (const sy of shelves) {
    if (sy >= H) continue
    for (let x = 0; x < W; x++) canvas.setCell(x, sy, '▀', '#4a3018', '#2a1808')
    for (let bx = 10; bx < W - 10; bx += Math.max(8, Math.floor(W / 9))) {
      if (sy + 1 < H) canvas.setCell(bx, sy + 1, '╨', '#3a2818')
    }
  }

  for (const b of bottles) {
    if (b.glow) {
      const pulse = 0.4 + 0.6 * Math.sin(t * 1.8 + b.ph)
      for (let dy = -1; dy <= b.h; dy++) {
        for (let dx = -1; dx <= b.w; dx++) {
          if (dx >= 0 && dx < b.w && dy >= 0 && dy < b.h) continue
          const px = b.x + dx, py = b.y + dy
          if (px < 0 || px >= W || py < 0 || py >= H) continue
          const cur = canvas.getCell(px, py)
          if (cur && cur.bg) canvas.setCell(px, py, cur.char || ' ', cur.fg, lerp(cur.bg, b.ec, pulse * 0.18))
        }
      }
    }

    const fillY = b.y + Math.floor(b.h * (1 - b.fill))
    const glass = '#484848'

    for (let row = 0; row < b.h; row++) {
      const py = b.y + row
      if (py < 0 || py >= H) continue
      const wet = py >= fillY
      const wc = wet ? lerp(b.ec, glass, 0.5) : glass
      if (b.x >= 0 && b.x < W) canvas.setCell(b.x, py, '│', wc)
      if (b.x + b.w - 1 < W) canvas.setCell(b.x + b.w - 1, py, '│', wc)

      for (let c = 1; c < b.w - 1; c++) {
        const px = b.x + c
        if (px < 0 || px >= W) continue
        if (wet) {
          const ch = b.bub && Math.sin(t * 3.5 + px * 2.2 + py * 1.7 + b.ph) > 0.88 ? '°' : ' '
          canvas.setCell(px, py, ch, lerp(b.ec, '#ffffff', 0.35), lerp(b.ec, '#000000', 0.3))
        } else if (py === fillY && fillY > b.y) {
          canvas.setCell(px, py, '~', lerp(b.ec, '#ffffff', 0.5))
        }
      }
    }

    if (b.y - 1 >= 0 && b.y - 1 < H) {
      const cx = b.x + Math.floor(b.w / 2)
      if (cx >= 0 && cx < W) canvas.setCell(cx, b.y - 1, '◆', '#8a6838')
    }

    if (b.sig && b.w >= 3) {
      const ly = b.y + Math.floor(b.h * 0.5)
      const lx = b.x + Math.floor(b.w / 2)
      if (lx >= 0 && lx < W && ly >= 0 && ly < H && ly >= fillY) {
        canvas.setCell(lx, ly, b.sig, lerp(b.ec, '#ffffff', 0.3), lerp(b.ec, '#000000', 0.3))
      }
    }
  }

  for (const c of candles) {
    const fl = 0.5 + 0.5 * Math.sin(t * 6 + c.ph) * Math.cos(t * 4.3 + c.ph * 1.5)
    const top = c.sy - 4
    for (let i = 0; i < 4; i++) {
      const py = top + i
      if (py < 0 || py >= H) continue
      if (c.x < W) canvas.setCell(c.x, py, '█', '#e8dcc0')
      if (c.x + 1 < W) canvas.setCell(c.x + 1, py, '▌', '#d0c4a0')
    }
    if (top - 1 >= 0 && c.x < W) canvas.setCell(c.x, top - 1, '│', '#3a2a18')
    if (top - 2 >= 0 && c.x < W) canvas.setCell(c.x, top - 2, '♦', lerp('#ffd040', '#ff6010', fl))
    if (top - 3 >= 0 && c.x < W) canvas.setCell(c.x, top - 3, '•', lerp('#ffffa0', '#ffc030', fl))
    if (c.sy < H && c.x < W && Math.sin(t * 0.4 + c.ph) > 0.3) {
      canvas.setCell(c.x, c.sy, '▄', '#e8dcc0')
    }
  }

  for (const m of motes) {
    const mx = Math.floor((m.x + Math.sin(t * 0.5 + m.ph) * 2 + W) % W)
    let my = Math.floor(m.y + t * m.vy * 3)
    my = ((my % H) + H) % H
    if (mx < 0 || mx >= W || my < 0 || my >= H) continue
    const li = light[my * W + mx]
    if (li > 0.03) {
      const sparkle = 0.4 + 0.6 * Math.sin(t * 2.5 + m.ph)
      const bright = Math.min(255, Math.floor(80 + sparkle * li * 175))
      canvas.setCell(mx, my, '·', col(Math.min(255, bright + 30), bright * 0.75, bright * 0.4))
    }
  }
}
