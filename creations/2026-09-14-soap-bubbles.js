import { hex, bgHex, lerp, lerpMulti } from '../src/theme.js'

export const title = 'Soap Bubbles'
export const description = 'Iridescent spheres drift upward through dim air, each one a fleeting cosmos of refracted light'
export const fps = 3

const TAU = Math.PI * 2
const ASPECT = 0.48

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const RAINBOW = [
  '#ff2266', '#ff7733', '#ffdd22', '#44ee55',
  '#22ccff', '#5533ff', '#bb22ee', '#ff2266'
]

function makeBubble(rng, W, H, yStart) {
  const r = 3 + rng() * 9
  return {
    x: 8 + rng() * (W - 16),
    y: yStart !== undefined ? yStart : 6 + rng() * (H - 12),
    r,
    vx: (rng() - 0.5) * 0.1,
    vy: -(0.08 + rng() * 0.16),
    wobPh: rng() * TAU,
    wobFr: 0.25 + rng() * 0.25,
    wobAm: 0.4 + rng() * 0.8,
    colOff: rng(),
    colSpd: 0.03 + rng() * 0.05,
    hlAng: -0.7 + (rng() - 0.5) * 0.4,
  }
}

function makeTiny(rng, W, H, yStart) {
  return {
    x: 4 + rng() * (W - 8),
    y: yStart !== undefined ? yStart : rng() * H,
    vy: -(0.06 + rng() * 0.12),
    wobPh: rng() * TAU,
    wobFr: 0.3 + rng() * 0.4,
    colOff: rng(),
    bright: 0.4 + rng() * 0.5,
  }
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(914)
  const bubbles = Array.from({ length: 15 }, () => makeBubble(rng, W, H))
  const tiny = Array.from({ length: 12 }, () => makeTiny(rng, W, H))
  const motes = Array.from({ length: 30 }, () => ({
    x: rng() * W, y: rng() * H,
    ph: rng() * TAU, sp: 0.1 + rng() * 0.2,
    br: 0.1 + rng() * 0.4,
  }))
  return { W, H, rng, bubbles, tiny, motes }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  const { W, H, rng, bubbles, tiny } = state
  for (const b of bubbles) {
    b.x += b.vx + Math.sin(frame.elapsed * b.wobFr + b.wobPh) * b.wobAm * 0.1
    b.y += b.vy
    b.colOff += b.colSpd * 0.3
  }
  for (let i = 0; i < bubbles.length; i++) {
    if (bubbles[i].y + bubbles[i].r < -4) {
      bubbles[i] = makeBubble(rng, W, H, H + 4 + rng() * 10)
    }
  }
  for (const t2 of tiny) {
    t2.x += Math.sin(frame.elapsed * t2.wobFr + t2.wobPh) * 0.08
    t2.y += t2.vy
  }
  for (let i = 0; i < tiny.length; i++) {
    if (tiny[i].y < -2) {
      tiny[i] = makeTiny(rng, W, H, H + 2 + rng() * 6)
    }
  }
  drawScene(canvas, state, frame.elapsed)
}

function skyAt(x, y, W, H) {
  const ty = y / H
  const tx = x / W

  const gcx = W * 0.5, gcy = H * 0.92
  const gdx = (x - gcx) / W, gdy = (y - gcy) / H
  const gd = Math.sqrt(gdx * gdx + gdy * gdy)
  const glow = Math.max(0, 1 - gd * 2.2)
  const gw = glow * glow * 0.35

  return col(
    Math.floor(Math.min(255, 6 + ty * 12 + gw * 90)),
    Math.floor(Math.min(255, 8 + ty * 8 + gw * 55)),
    Math.floor(Math.min(255, 22 + ty * 14 - ty * ty * 6 + gw * 25))
  )
}

function drawScene(canvas, state, t) {
  const { W, H, bubbles, tiny, motes } = state

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      canvas.setCell(x, y, ' ', null, bgHex(skyAt(x, y, W, H)))

  for (const m of motes) {
    const mx = (m.x + Math.sin(t * 0.07 + m.ph) * 3 + W) % W
    const my = ((m.y - t * m.sp * 1.5) % H + H) % H
    const px = Math.floor(mx), py = Math.floor(my)
    if (px >= 0 && px < W && py >= 0 && py < H) {
      const pulse = m.br * (0.3 + 0.7 * Math.sin(t * 0.35 + m.ph))
      if (pulse > 0.1) {
        const v = Math.floor(22 + pulse * 50)
        canvas.setCell(px, py, '·', hex(col(v, v, v + 6)))
      }
    }
  }

  for (const tb of tiny) {
    const px = Math.floor(tb.x), py = Math.floor(tb.y)
    if (px < 0 || px >= W || py < 0 || py >= H) continue
    const pulse = tb.bright * (0.6 + 0.4 * Math.sin(t * 0.5 + tb.wobPh))
    const colorT = ((tb.colOff + t * 0.04) % 1 + 1) % 1
    const tc = lerpMulti(RAINBOW, colorT)
    const bg = skyAt(px, py, W, H)
    canvas.setCell(px, py, '•', hex(lerp(tc, '#ffffff', 0.3)), bgHex(lerp(bg, tc, pulse * 0.35)))
  }

  const sorted = [...bubbles].sort((a, b) => a.r - b.r)
  for (const b of sorted) drawBubble(canvas, b, t, W, H)
}

function drawBubble(canvas, b, t, W, H) {
  const { x: cx, y: cy, r, colOff, hlAng } = b
  const xScan = Math.ceil(r / ASPECT) + 2
  const yScan = Math.ceil(r) + 2

  for (let dy = -yScan; dy <= yScan; dy++) {
    const py = Math.floor(cy) + dy
    if (py < 0 || py >= H) continue
    for (let dx = -xScan; dx <= xScan; dx++) {
      const px = Math.floor(cx) + dx
      if (px < 0 || px >= W) continue

      const d = Math.sqrt((dx * ASPECT) ** 2 + dy ** 2)
      if (d > r + 0.5) continue

      const a = Math.atan2(dy, dx * ASPECT)
      const bg = skyAt(px, py, W, H)

      const rimInner = r - 1.3
      const rimOuter = r + 0.3

      if (d >= rimInner && d <= rimOuter) {
        const rimT = (d - rimInner) / (rimOuter - rimInner)
        const colorT = ((a / TAU + colOff + t * 0.06) % 1 + 1) % 1
        const irid = lerpMulti(RAINBOW, colorT)
        const bright = 0.45 + 0.40 * Math.sin(rimT * Math.PI)
        const blended = lerp(bg, irid, bright)
        if (rimT > 0.25 && rimT < 0.75) {
          canvas.setCell(px, py, '·', hex(lerp(irid, '#ffffff', 0.35)), bgHex(blended))
        } else {
          canvas.setCell(px, py, ' ', null, bgHex(blended))
        }
        continue
      }

      if (d >= rimInner) continue

      const hlX = Math.cos(hlAng) * r * 0.3
      const hlY = Math.sin(hlAng) * r * 0.3
      const hlD = Math.sqrt((dx * ASPECT - hlX) ** 2 + (dy - hlY) ** 2)
      const hlR = Math.max(1.2, r * 0.2)

      if (hlD < hlR && r > 3.5) {
        const hlB = Math.pow(1 - hlD / hlR, 2) * 0.6
        const lit = lerp(bg, '#dde8ff', hlB)
        const ch = hlB > 0.35 ? '░' : ' '
        canvas.setCell(px, py, ch, hex('#eef4ff'), bgHex(lit))
        continue
      }

      const secHlX = Math.cos(hlAng + Math.PI) * r * 0.4
      const secHlY = Math.sin(hlAng + Math.PI) * r * 0.4
      const secD = Math.sqrt((dx * ASPECT - secHlX) ** 2 + (dy - secHlY) ** 2)
      const secR = Math.max(1.5, r * 0.25)

      if (secD < secR && r > 4) {
        const secB = Math.pow(1 - secD / secR, 2.5) * 0.25
        const secT = ((a / TAU + colOff + t * 0.04) % 1 + 1) % 1
        const secCol = lerpMulti(RAINBOW, secT)
        const tinted = lerp(bg, secCol, secB)
        canvas.setCell(px, py, ' ', null, bgHex(tinted))
        continue
      }

      const proximity = d / rimInner
      const filmT = ((a / TAU + colOff + t * 0.03 + proximity * 0.15) % 1 + 1) % 1
      const filmCol = lerpMulti(RAINBOW, filmT)
      const filmStr = 0.03 + proximity * proximity * 0.09
      canvas.setCell(px, py, ' ', null, bgHex(lerp(bg, filmCol, filmStr)))
    }
  }
}
