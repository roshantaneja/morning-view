import { BLOCK, SHADE } from '../src/theme.js'

export const title = 'Torii Gates'
export const description =
  'A thousand vermillion arches march up the mountain — each one a prayer, each step a quiet surrender to the mist'
export const fps = 2

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}
function parseH(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}
function mixH(a, b, t) {
  t = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = parseH(a)
  const [r2, g2, b2] = parseH(b)
  return c2h(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const GATE_COUNT = 14

export function setup(canvas) {
  const rng = srand(813)
  const fogWisps = []
  for (let i = 0; i < 45; i++) {
    fogWisps.push({
      baseX: rng() * canvas.width * 2,
      baseY: canvas.height * 0.12 + rng() * canvas.height * 0.55,
      len: 5 + Math.floor(rng() * 28),
      speed: 0.3 + rng() * 1.0,
      opacity: 0.08 + rng() * 0.32,
      amp: 0.8 + rng() * 2.5,
      freq: 0.15 + rng() * 0.5,
      ph: rng() * Math.PI * 2,
    })
  }
  const leaves = []
  for (let i = 0; i < 25; i++) {
    leaves.push({
      pathT: 0.08 + rng() * 0.85,
      offset: (rng() - 0.5) * 0.6,
      color: ['#C85020', '#D87030', '#B84020', '#E89040', '#A03010'][Math.floor(rng() * 5)],
      char: ['♣', '◆', '●', '·', '✦'][Math.floor(rng() * 5)],
    })
  }
  return { fogWisps, leaves, t: 0 }
}

function draw(canvas, state) {
  const W = canvas.width, H = canvas.height
  const vpX = Math.floor(W / 2)
  const vpY = Math.floor(H * 0.22)
  const t = state.t
  const pathTop = vpY + 2

  for (let y = 0; y < H; y++) {
    const yn = y / H
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x / W - 0.5) * 2
      const shaft = Math.max(0, 1 - dx * 1.6) * 0.1
      const breath = 0.01 * Math.sin(t * 0.35)
      const light = shaft * (1 + breath)
      let bg
      if (yn < 0.18) {
        bg = mixH('#020502', '#050C05', yn / 0.18)
      } else if (yn < 0.45) {
        bg = mixH('#050C05', '#0A180A', (yn - 0.18) / 0.27)
      } else {
        bg = mixH('#0A180A', '#050A05', (yn - 0.45) / 0.55)
      }
      if (light > 0.005) bg = mixH(bg, '#1A2E1A', light)
      canvas.setCell(x, y, ' ', null, bg)
    }
  }

  for (let y = pathTop; y < H; y++) {
    const pt = (y - pathTop) / (H - pathTop)
    const hw = 1.2 + pt * pt * W * 0.2
    const left = Math.floor(vpX - hw)
    const right = Math.floor(vpX + hw)
    for (let x = left; x <= right; x++) {
      if (x < 0 || x >= W) continue
      const edge = Math.min(x - left, right - x) / (hw * 2 || 1)
      const n = hash(x * 3, y * 5) * 0.2
      const worn = Math.max(0, 1 - Math.abs(x - vpX) / (hw * 0.25 || 1)) * 0.12
      const b = Math.min(1, 0.2 + edge * 0.5 + n + worn)
      const col = mixH('#2C2C28', '#686860', b)
      const si = Math.min(3, Math.floor(edge * 2.5 + n))
      canvas.setCell(x, y, SHADE[si], col, mixH('#050A05', col, 0.12))
    }
  }

  for (const leaf of state.leaves) {
    const y = pathTop + leaf.pathT * (H - pathTop)
    const pt = (y - pathTop) / (H - pathTop)
    const hw = 1.2 + pt * pt * W * 0.2
    const ix = Math.floor(vpX + leaf.offset * hw)
    const iy = Math.floor(y)
    if (ix >= 4 && ix < W - 4 && iy >= 0 && iy < H - 5) {
      canvas.setCell(ix, iy, leaf.char, leaf.color)
    }
  }

  for (let i = GATE_COUNT - 1; i >= 0; i--) {
    drawGate(canvas, vpX, vpY, i / GATE_COUNT, W, H, i)
  }

  for (const w of state.fogWisps) {
    const wx = w.baseX + t * w.speed * 4
    const wy = w.baseY + Math.sin(t * w.freq + w.ph) * w.amp
    const total = W + w.len * 2
    const ex = ((wx % total) + total) % total - w.len
    for (let dx = 0; dx < w.len; dx++) {
      const x = Math.floor(ex + dx)
      if (x < 0 || x >= W) continue
      const y = Math.floor(wy + Math.sin((dx / w.len) * Math.PI) * 0.5)
      if (y < 0 || y >= H) continue
      const cell = canvas.getCell(x, y)
      if (cell && cell.char === BLOCK.full) continue
      const fade = Math.sin((dx / w.len) * Math.PI)
      const a = w.opacity * fade
      if (a < 0.06) continue
      const fc = mixH('#4A6848', '#B0C8A8', a * 0.5)
      canvas.setCell(x, y, a > 0.22 ? '░' : '·', fc)
    }
  }
}

function drawGate(canvas, vpX, vpY, depth, W, H, idx) {
  const s = Math.pow(1 - depth, 1.4)
  if (s < 0.055) return

  const gw = Math.floor(W * 0.48 * s)
  const gh = Math.floor(H * 0.38 * s)
  if (gw < 5 || gh < 3) return

  const pw = Math.max(1, Math.floor(3.2 * s))
  const bot = Math.floor(vpY + (H * 0.93 - vpY) * s)
  const top = bot - gh
  if (top >= bot) return

  const halfW = Math.floor(gw / 2)
  const lx = vpX - halfW
  const rx = vpX + halfW - pw + 1

  const f = depth * 0.78
  const bright = mixH('#E85040', '#708868', f)
  const mid = mixH('#C83828', '#607858', f)
  const dark = mixH('#701510', '#506848', f)
  const shd = mixH('#380804', '#1A281A', f)

  const kh = Math.max(1, Math.floor(2.2 * s))
  const ke = Math.max(1, Math.floor(4 * s))
  for (let dy = 0; dy < kh; dy++) {
    const y = top + dy
    if (y < 0 || y >= H) continue
    for (let x = lx - ke; x <= rx + pw - 1 + ke; x++) {
      if (x < 0 || x >= W) continue
      canvas.setCell(x, y, BLOCK.full, dy === 0 ? bright : mid, shd)
    }
  }

  const nuGap = Math.max(1, Math.floor(3.5 * s))
  const nuY = top + kh + nuGap
  const nuH = Math.max(1, Math.floor(1.2 * s))
  for (let dy = 0; dy < nuH; dy++) {
    const y = nuY + dy
    if (y < 0 || y >= H) continue
    for (let x = lx; x <= rx + pw - 1; x++) {
      if (x < 0 || x >= W) continue
      canvas.setCell(x, y, BLOCK.full, dark, shd)
    }
  }

  for (let y = top + kh; y <= bot; y++) {
    if (y < 0 || y >= H) continue
    for (let dx = 0; dx < pw; dx++) {
      const xl = lx + dx
      if (xl >= 0 && xl < W) {
        canvas.setCell(xl, y, BLOCK.full, dx === pw - 1 ? bright : mid, shd)
      }
      const xr = rx + dx
      if (xr >= 0 && xr < W) {
        canvas.setCell(xr, y, BLOCK.full, dx === 0 ? bright : mid, shd)
      }
    }
  }

  if (depth < 0.25 && pw >= 2) {
    const mh = Math.max(1, Math.floor(2 * s))
    for (let dy = 0; dy < mh; dy++) {
      const y = bot - dy
      if (y < 0 || y >= H) continue
      for (let side = 0; side < 2; side++) {
        const bx = side === 0 ? lx : rx
        for (let dx = 0; dx < pw; dx++) {
          const x = bx + dx
          if (x < 0 || x >= W) continue
          if (hash(x * 7 + idx, y * 11 + idx) > 0.45) {
            canvas.setCell(x, y, SHADE[1], mixH('#1A4A1A', '#2A6A2A', hash(x, y + idx)))
          }
        }
      }
    }
  }
}

export function render(canvas, data, state) { draw(canvas, state) }

export function update(canvas, data, frame, state) {
  state.t = frame.elapsed
  draw(canvas, state)
}
