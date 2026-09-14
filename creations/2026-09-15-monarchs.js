import { hex, bgHex, lerp, lerpMulti } from '../src/theme.js'

export const title = 'Monarch Migration'
export const description = 'A river of amber wings pours south through the September dusk — the ancient journey begins again'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const SKY = ['#06021a', '#0e0630', '#1c0e48', '#341858', '#581e50', '#883840', '#c06028', '#dca040', '#ecc868']

function skyAt(y, H) {
  const t = Math.pow(Math.min(1, y / (H * 0.74)), 0.88)
  return lerpMulti(SKY, t)
}

const ORANGES = ['#c85818', '#d46820', '#dc7428', '#b84c12']

function makeButterfly(rng, W, H, size) {
  const streamT = rng()
  const cx = W * 0.95 - streamT * W * 1.05
  const cy = H * 0.06 + streamT * H * 0.56
  const spread = size === 'large' ? 0.12 : size === 'medium' ? 0.22 : 0.32
  return {
    x: cx + (rng() - 0.5) * W * spread,
    y: cy + (rng() - 0.5) * H * spread,
    vx: -(0.15 + rng() * 0.35) * (size === 'large' ? 0.7 : size === 'medium' ? 1.0 : 1.15),
    vy: (0.03 + rng() * 0.08) * (size === 'large' ? 0.7 : 1.0),
    size,
    flapPhase: rng() * TAU,
    flapSpeed: size === 'large' ? (1.0 + rng() * 0.8) : size === 'medium' ? (1.6 + rng() * 1.2) : (2.2 + rng() * 2.0),
    colorVar: Math.floor(rng() * 4),
    wobPhase: rng() * TAU,
    wobAmp: 0.15 + rng() * 0.35,
    depth: rng(),
  }
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(915)

  const butterflies = []
  for (let i = 0; i < 8; i++) butterflies.push(makeButterfly(rng, W, H, 'large'))
  for (let i = 0; i < 35; i++) butterflies.push(makeButterfly(rng, W, H, 'medium'))
  for (let i = 0; i < 80; i++) butterflies.push(makeButterfly(rng, W, H, 'small'))

  const treeline = Array.from({ length: W }, (_, x) =>
    Math.floor(
      H * 0.76
      + Math.sin(x * 0.025 + 0.5) * 5
      + Math.sin(x * 0.062 + 2.0) * 3
      + Math.sin(x * 0.11 + 1.0) * 1.5
    )
  )

  const trees = []
  for (let i = 0; i < 30; i++) {
    trees.push({
      x: Math.floor(rng() * W),
      h: 3 + Math.floor(rng() * 10),
      w: 1 + Math.floor(rng() * 2),
    })
  }

  const stars = []
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * H * 0.35),
      bright: 0.2 + rng() * 0.8,
      twinklePhase: rng() * TAU,
    })
  }

  return { W, H, rng, butterflies, treeline, trees, stars }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  const { W, H, rng, butterflies } = state
  for (const b of butterflies) {
    b.x += b.vx
    b.y += b.vy + Math.sin(frame.elapsed * 0.35 + b.wobPhase) * b.wobAmp * 0.04
    if (b.x < -12 || b.y > H * 0.85) {
      b.x = W + 5 + rng() * 15
      b.y = H * 0.02 + rng() * H * 0.40
    }
  }
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const { W, H, butterflies, treeline, trees, stars } = state

  for (let y = 0; y < H; y++) {
    const sc = skyAt(y, H)
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bgHex(sc))
    }
  }

  const sunX = Math.floor(W * 0.62), sunY = Math.floor(H * 0.71)
  for (let dy = -22; dy <= 22; dy++) {
    for (let dx = -40; dx <= 40; dx++) {
      const px = sunX + dx, py = sunY + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const d = Math.sqrt((dx * 0.48) ** 2 + dy ** 2)
      if (d < 20) {
        const glow = Math.pow(1 - d / 20, 2.5) * 0.45
        const bg = skyAt(py, H)
        canvas.setCell(px, py, ' ', null, bgHex(lerp(bg, '#ffe498', glow)))
      }
    }
  }

  for (const s of stars) {
    if (s.x >= 0 && s.x < W && s.y >= 0 && s.y < H) {
      const pulse = s.bright * (0.4 + 0.6 * Math.sin(t * 0.3 + s.twinklePhase))
      if (pulse > 0.25) {
        const v = Math.floor(40 + pulse * 120)
        const bg = skyAt(s.y, H)
        canvas.setCell(s.x, s.y, pulse > 0.7 ? '✦' : '·', hex(col(v, v, v + 20)), bgHex(bg))
      }
    }
  }

  for (let x = 2; x < W - 2; x++) {
    const cy = Math.floor(H * 0.25 + Math.sin(x * 0.018 + 1.2) * 4)
    if (cy >= 0 && cy < H) {
      const fade = 0.06 + 0.04 * Math.sin(x * 0.06 + t * 0.1)
      if (fade > 0.02) {
        const bg = skyAt(cy, H)
        canvas.setCell(x, cy, '░', hex(lerp(bg, '#e0a060', 0.3)), bgHex(lerp(bg, '#c08050', fade)))
      }
    }
  }

  const sorted = [...butterflies].sort((a, b) => {
    const order = { small: 0, medium: 1, large: 2 }
    return order[a.size] - order[b.size]
  })

  for (const b of sorted) {
    const px = Math.floor(b.x)
    const clampedX = Math.max(0, Math.min(px, W - 1))
    if (Math.floor(b.y) >= treeline[clampedX] - 1) continue
    if (b.size === 'small') drawSmall(canvas, b, t, W, H)
    else if (b.size === 'medium') drawMedium(canvas, b, t, W, H)
    else drawLarge(canvas, b, t, W, H)
  }

  for (let x = 0; x < W; x++) {
    const top = treeline[x]
    if (top > 0 && top < H) {
      canvas.setCell(x, top, '▄', hex('#050804'), bgHex(skyAt(top, H)))
    }
    for (let y = top + 1; y < H; y++) {
      const d = (y - top) / (H - top)
      canvas.setCell(x, y, ' ', null, bgHex(col(
        Math.floor(4 + d * 3),
        Math.floor(6 + d * 2),
        Math.floor(3 + d * 1)
      )))
    }
  }

  for (const tree of trees) {
    const tx = Math.max(0, Math.min(tree.x, W - 1))
    const baseY = treeline[tx]
    for (let dy = 1; dy <= tree.h; dy++) {
      const py = baseY - dy
      if (py < 0 || py >= H) continue
      const wAtH = Math.max(0, Math.floor(tree.w * (1 - dy / tree.h * 0.65)))
      for (let dx = -wAtH; dx <= wAtH; dx++) {
        const px = tree.x + dx
        if (px < 0 || px >= W) continue
        canvas.setCell(px, py, '█', hex('#030503'))
      }
    }
    const topY = baseY - tree.h - 1
    if (topY >= 0 && topY < H && tree.x >= 0 && tree.x < W) {
      canvas.setCell(tree.x, topY, '▲', hex('#040604'))
    }
  }
}

function drawSmall(canvas, b, t, W, H) {
  const px = Math.floor(b.x), py = Math.floor(b.y)
  if (px < 0 || px >= W || py < 0 || py >= H) return
  const flap = Math.sin(t * b.flapSpeed + b.flapPhase)
  const orange = lerp('#804020', '#e88030', b.depth)
  const bg = skyAt(py, H)
  const ch = flap > 0.2 ? '•' : (flap > -0.3 ? '·' : ',')
  canvas.setCell(px, py, ch, hex(orange), bgHex(lerp(bg, orange, 0.06)))
}

function drawMedium(canvas, b, t, W, H) {
  const px = Math.floor(b.x), py = Math.floor(b.y)
  if (px < 1 || px >= W - 1 || py < 0 || py >= H) return
  const flap = Math.sin(t * b.flapSpeed + b.flapPhase)
  const orange = ORANGES[b.colorVar]
  const bg = skyAt(py, H)

  if (flap > 0.3) {
    canvas.setCell(px - 1, py, '▐', hex(orange), bgHex(bg))
    canvas.setCell(px, py, '▓', hex(lerp(orange, '#000000', 0.55)), bgHex(lerp(bg, orange, 0.2)))
    canvas.setCell(px + 1, py, '▌', hex(orange), bgHex(bg))
  } else if (flap > -0.2) {
    canvas.setCell(px, py, '▒', hex(orange), bgHex(lerp(bg, orange, 0.12)))
  } else {
    canvas.setCell(px, py, '│', hex(lerp(orange, '#1a0800', 0.3)), bgHex(bg))
  }
}

function drawLarge(canvas, b, t, W, H) {
  const px = Math.floor(b.x), py = Math.floor(b.y)
  if (px < 4 || px >= W - 4 || py < 3 || py >= H - 3) return
  const flap = Math.sin(t * b.flapSpeed + b.flapPhase)
  const orange = ORANGES[b.colorVar]
  const bright = lerp(orange, '#ffcc44', 0.25)
  const dark = lerp(orange, '#1a0800', 0.45)
  const body = '#120a04'

  const set = (dx, dy, ch, fg, bgBlend) => {
    const sx = px + dx, sy = py + dy
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) return
    const bg = skyAt(sy, H)
    canvas.setCell(sx, sy, ch, hex(fg), bgHex(lerp(bg, orange, bgBlend)))
  }

  if (flap > 0.15) {
    set(-2, -2, '▄', orange, 0.06)
    set(-1, -2, '▄', bright, 0.10)
    set(1, -2, '▄', bright, 0.10)
    set(2, -2, '▄', orange, 0.06)

    set(-3, -1, '▄', orange, 0.04)
    set(-2, -1, '█', bright, 0.18)
    set(-1, -1, '▓', orange, 0.14)
    set(0, -1, '│', body, 0.0)
    set(1, -1, '▓', orange, 0.14)
    set(2, -1, '█', bright, 0.18)
    set(3, -1, '▄', orange, 0.04)

    set(-3, 0, '█', orange, 0.20)
    set(-2, 0, '•', '#f0d070', 0.16)
    set(-1, 0, '░', dark, 0.06)
    set(0, 0, '│', body, 0.0)
    set(1, 0, '░', dark, 0.06)
    set(2, 0, '•', '#f0d070', 0.16)
    set(3, 0, '█', orange, 0.20)

    set(-3, 1, '▀', orange, 0.04)
    set(-2, 1, '█', bright, 0.18)
    set(-1, 1, '▓', orange, 0.14)
    set(0, 1, '│', body, 0.0)
    set(1, 1, '▓', orange, 0.14)
    set(2, 1, '█', bright, 0.18)
    set(3, 1, '▀', orange, 0.04)

    set(-2, 2, '▀', orange, 0.06)
    set(-1, 2, '▀', bright, 0.10)
    set(1, 2, '▀', bright, 0.10)
    set(2, 2, '▀', orange, 0.06)
  } else if (flap > -0.2) {
    set(-1, -1, '▄', orange, 0.06)
    set(0, -1, '▄', dark, 0.03)
    set(1, -1, '▄', orange, 0.06)

    set(-2, 0, '▐', orange, 0.0)
    set(-1, 0, '█', bright, 0.16)
    set(0, 0, '│', body, 0.0)
    set(1, 0, '█', bright, 0.16)
    set(2, 0, '▌', orange, 0.0)

    set(-1, 1, '▀', orange, 0.06)
    set(0, 1, '▀', dark, 0.03)
    set(1, 1, '▀', orange, 0.06)
  } else {
    set(0, -1, '▄', dark, 0.03)
    set(-1, 0, '▐', orange, 0.0)
    set(0, 0, '█', dark, 0.08)
    set(1, 0, '▌', orange, 0.0)
    set(0, 1, '▀', dark, 0.03)
  }
}
