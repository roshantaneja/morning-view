import { lerp, DIM } from '../src/theme.js'

export const title = 'Frost Patterns'
export const description = 'In the quiet before dawn, winter breathes on glass — each crystal a frozen fern no two alike'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function charForAngle(a) {
  const norm = ((a % TAU) + TAU) % TAU
  const oct = Math.round(norm / (TAU / 8)) % 8
  return ['─', '╲', '│', '╱', '─', '╲', '│', '╱'][oct]
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(910)

  const grid = Array.from({ length: H }, () => new Array(W).fill(null))

  function place(px, py, ch, depth, maxD) {
    if (px < 0 || px >= W || py < 0 || py >= H) return
    if (grid[py][px] && grid[py][px].d <= depth) return
    const t = depth / maxD
    const b = 1 - t * 0.45
    grid[py][px] = {
      c: ch,
      fg: col(Math.round(75 + 180 * b), Math.round(130 + 125 * b), Math.round(180 + 75 * b)),
      d: depth,
    }
  }

  function grow(x, y, angle, length, depth, maxD) {
    if (depth > maxD || length < 2) return
    const cos = Math.cos(angle), sin = Math.sin(angle)
    const ch = charForAngle(angle)

    for (let i = 0; i < length; i++) {
      const px = Math.round(x + cos * i)
      const py = Math.round(y + sin * i)
      if (px < 0 || px >= W || py < 0 || py >= H) break

      const tip = depth >= maxD - 1 && i >= length - 2
      place(px, py, tip ? '·' : ch, depth, maxD)

      if (depth < maxD && i >= 2 && i % (2 + Math.floor(rng() * 2)) === 0) {
        const sub = Math.max(2, Math.floor((length - i) * (0.3 + rng() * 0.25)))
        const jitter = (rng() - 0.5) * 0.3
        if (rng() > 0.18) grow(px, py, angle + Math.PI / 3.2 + jitter, sub, depth + 1, maxD)
        if (rng() > 0.18) grow(px, py, angle - Math.PI / 3.2 + jitter, sub, depth + 1, maxD)
      }
    }
  }

  const seeds = []
  seeds.push({ x: 0, y: 0 }, { x: W - 1, y: 0 }, { x: 0, y: H - 1 }, { x: W - 1, y: H - 1 })
  for (let i = 0; i < 16; i++) {
    const side = Math.floor(rng() * 4)
    if (side === 0) seeds.push({ x: Math.floor(rng() * W), y: 0 })
    else if (side === 1) seeds.push({ x: W - 1, y: Math.floor(rng() * H) })
    else if (side === 2) seeds.push({ x: Math.floor(rng() * W), y: H - 1 })
    else seeds.push({ x: 0, y: Math.floor(rng() * H) })
  }
  for (let i = 0; i < 6; i++) {
    seeds.push({
      x: Math.floor(W * 0.12 + rng() * W * 0.76),
      y: Math.floor(H * 0.12 + rng() * H * 0.76),
    })
  }

  for (const seed of seeds) {
    const arms = 4 + Math.floor(rng() * 5)
    const toC = Math.atan2(H / 2 - seed.y, W / 2 - seed.x)
    for (let a = 0; a < arms; a++) {
      const spread = (a / arms - 0.5) * Math.PI * 1.4
      const angle = toC + spread + (rng() - 0.5) * 0.5
      const len = Math.floor(Math.min(W, H) * (0.08 + rng() * 0.28))
      const maxD = 4 + Math.floor(rng() * 2)
      grow(seed.x, seed.y, angle, len, 0, maxD)
    }
  }

  for (let i = 0; i < Math.floor(W * H * 0.004); i++) {
    const mx = Math.floor(rng() * W), my = Math.floor(rng() * H)
    if (!grid[my][mx]) {
      const chars = ['·', '∘', '✧', '•']
      place(mx, my, chars[Math.floor(rng() * chars.length)], 5, 6)
    }
  }

  const haze = Array.from({ length: H }, () => new Array(W).fill(false))
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x]) continue
      let near = false
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dx = -1; dx <= 1 && !near; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < H && nx >= 0 && nx < W && grid[ny][nx]) near = true
        }
      }
      if (near && rng() > 0.4) haze[y][x] = true
    }
  }

  const stars = []
  for (let i = 0; i < 55; i++) {
    const sx = Math.floor(rng() * W), sy = Math.floor(rng() * H)
    if (!grid[sy][sx] && !haze[sy][sx]) {
      stars.push({ x: sx, y: sy, ch: rng() > 0.55 ? '·' : '∘', b: 0.25 + rng() * 0.75, ph: rng() * TAU })
    }
  }

  const moonX = Math.floor(W * 0.72), moonY = Math.floor(H * 0.18)
  const moon = []
  const mr = 3
  for (let dy = -mr; dy <= mr; dy++) {
    for (let dx = -mr; dx <= mr; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d <= mr && d > mr - 1.4 && dx > -1) {
        const mx = moonX + dx, my = moonY + dy
        if (mx >= 0 && mx < W && my >= 0 && my < H && !grid[my][mx] && !haze[my][mx]) {
          moon.push({ x: mx, y: my })
        }
      }
    }
  }

  const fc = []
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (grid[y][x]) fc.push({ x, y })

  return { grid, haze, stars, moon, fc }
}

function drawScene(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  const { grid, haze, stars, moon, fc } = state

  for (let y = 0; y < H; y++) {
    const f = y / H
    const bg = col(Math.round(2 + f * 5), Math.round(4 + f * 10), Math.round(18 + f * 14))
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, bg)
  }

  for (const s of stars) {
    const tw = Math.sin(t * 1.1 + s.ph) * 0.3 + 0.7
    const v = Math.round(s.b * tw * 150)
    canvas.setCell(s.x, s.y, s.ch, col(v, v, Math.min(255, v + 45)))
  }

  for (const m of moon) {
    const glow = Math.sin(t * 0.4) * 0.08 + 0.92
    const v = Math.round(140 * glow)
    canvas.setCell(m.x, m.y, '○', col(v - 20, v, v + 15))
  }

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (haze[y][x]) canvas.setCell(x, y, '░', '#182838')

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const cell = grid[y][x]
      if (cell) canvas.setCell(x, y, cell.c, cell.fg)
    }

  if (fc.length > 0) {
    for (let i = 0; i < 8; i++) {
      const p = t * 1.6 + i * 2.71
      const idx = Math.floor((Math.sin(p * 0.85 + i * 3.89) * 0.5 + 0.5) * fc.length)
      if (Math.sin(p * 2.3) > 0.45 && idx >= 0 && idx < fc.length) {
        canvas.setCell(fc[idx].x, fc[idx].y, '✦', '#ddeeff')
      }
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
