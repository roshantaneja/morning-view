import { BLOCK, GLYPH } from '../src/theme.js'

export const title = 'Night Ride'
export const description =
  'The wheel carries you above the rooftops — for one slow turn the whole autumn night is yours'
export const fps = 3

const TAU = Math.PI * 2
const ASPECT = 2.0

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

const GONDOLA_COLORS = [
  '#D84040', '#3888D8', '#D8B038', '#38C068',
  '#C048A0', '#E07830', '#5048C8', '#40B8B0',
  '#D83868', '#68D040', '#E85838', '#3860E8',
]

const N_GONDOLAS = 12
const N_SPOKES = 16
const RIM_LIGHTS = 64
const LIGHT_COLORS = ['#FF6840', '#40FF88', '#FFB040', '#40A0FF', '#FF40A8']

export function setup(canvas, data) {
  const W = canvas.width
  const H = canvas.height
  const rng = srand(1019)

  const cx = Math.floor(W / 2)
  const cy = Math.floor(H * 0.34)
  const R = Math.floor(Math.min(W / (ASPECT * 2) * 0.75, H * 0.26))
  const groundY = Math.floor(H * 0.74)

  const stars = []
  for (let i = 0; i < 140; i++) {
    const sx = Math.floor(rng() * W)
    const sy = Math.floor(rng() * H * 0.70)
    const dx = (sx - cx) / ASPECT
    const dy = sy - cy
    if (Math.sqrt(dx * dx + dy * dy) > R * 1.5) {
      stars.push({ x: sx, y: sy, ph: rng() * TAU, br: 0.2 + rng() * 0.8 })
    }
  }

  const moonX = Math.floor(W * 0.14)
  const moonY = Math.floor(H * 0.09)

  const booths = []
  for (let i = 0; i < 7; i++) {
    const bx = Math.floor(W * 0.08 + rng() * W * 0.78)
    booths.push({
      x: bx,
      w: 4 + Math.floor(rng() * 5),
      h: 3 + Math.floor(rng() * 2),
      color: GONDOLA_COLORS[Math.floor(rng() * GONDOLA_COLORS.length)],
      lph: rng() * TAU,
    })
  }

  const trees = []
  for (let i = 0; i < 12; i++) {
    trees.push({
      x: Math.floor(rng() * W),
      h: 3 + Math.floor(rng() * 7),
      w: 1 + Math.floor(rng() * 3),
    })
  }

  return { cx, cy, R, groundY, stars, moonX, moonY, booths, trees }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const W = canvas.width
  const H = canvas.height
  const { cx, cy, R, groundY, stars, moonX, moonY, booths, trees } = state
  const rot = t * 0.09

  // ── Sky gradient with warm carnival glow ──
  for (let y = 0; y < groundY; y++) {
    const vf = y / H
    for (let x = 0; x < W; x++) {
      const gdx = (x - cx) / (R * ASPECT * 2.2)
      const gdy = (y - cy) / (R * 2.2)
      const gd = Math.sqrt(gdx * gdx + gdy * gdy)
      const glow = Math.max(0, 1 - gd) * 0.08
      const hz = Math.max(0, vf - 0.45) * 0.6

      canvas.setCell(x, y, ' ', null, c2h(
        3 + vf * 5 + glow * 55 + hz * 25,
        4 + vf * 7 + glow * 30 + hz * 12,
        16 + vf * 8 + glow * 12 - hz * 6
      ))
    }
  }

  // ── Crescent moon ──
  const mR = 3
  for (let dy = -mR; dy <= mR; dy++) {
    for (let dx = -mR * 2; dx <= mR * 2; dx++) {
      const nd = Math.sqrt((dx / ASPECT) ** 2 + dy ** 2) / mR
      const shadow = Math.sqrt(((dx / ASPECT) + 1.2) ** 2 + dy ** 2) / mR
      if (nd < 1.0 && shadow > 0.85) {
        const px = moonX + dx, py = moonY + dy
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const b = 0.75 + (1 - nd) * 0.25
          canvas.setCell(px, py, ' ', null, c2h(225 * b, 220 * b, 195 * b))
        }
      }
    }
  }
  // Moon glow halo
  const mgR = 6
  for (let dy = -mgR; dy <= mgR; dy++) {
    for (let dx = -mgR * 2; dx <= mgR * 2; dx++) {
      const nd = Math.sqrt((dx / ASPECT) ** 2 + dy ** 2) / mgR
      if (nd < 1.0 && nd > 0.45) {
        const px = moonX + dx, py = moonY + dy
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const cell = canvas.getCell(px, py)
          if (cell && cell.char === ' ') {
            const g = (1 - nd) * 0.25
            canvas.setCell(px, py, ' ', null, c2h(
              6 + g * 80, 8 + g * 70, 18 + g * 45
            ))
          }
        }
      }
    }
  }

  // ── Stars ──
  for (const s of stars) {
    const tw = 0.3 + Math.sin(t * 1.3 + s.ph) * 0.7
    const b = tw * s.br
    if (b > 0.35) {
      canvas.setCell(s.x, s.y, b > 0.82 ? '✦' : '·',
        c2h(170 + b * 85, 185 + b * 70, 215 + b * 40))
    }
  }

  // ── Ground ──
  for (let y = groundY; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = (y - groundY) / Math.max(1, H - groundY)
      const dx = Math.abs(x - cx) / (R * ASPECT)
      const warm = Math.max(0, 1 - dx * 0.7) * Math.max(0, 1 - d * 2.5) * 0.15
      canvas.setCell(x, y, ' ', null, c2h(
        10 + d * 4 + warm * 90,
        13 + d * 3 + warm * 55,
        8 + d * 2 + warm * 15
      ))
    }
  }

  // ── Tree silhouettes ──
  for (const tr of trees) {
    for (let dy = 1; dy <= 2; dy++) {
      const py = groundY - dy
      if (py >= 0 && py < H && tr.x >= 0 && tr.x < W)
        canvas.setCell(tr.x, py, '│', '#0C100C')
    }
    for (let dy = 3; dy <= tr.h + 2; dy++) {
      const w = Math.min(dy - 2, tr.h + 2 - dy + 1, tr.w + 1)
      for (let dx = -w; dx <= w; dx++) {
        const px = tr.x + dx, py = groundY - dy
        if (px >= 0 && px < W && py >= 0 && py < H)
          canvas.setCell(px, py, BLOCK.full, '#0A120A')
      }
    }
  }

  // ── Support structure ──
  const sTop = cy + Math.floor(R * 0.1)
  const legW = Math.floor(R * ASPECT * 0.35)

  for (let y = sTop; y < groundY; y++) {
    const f = (y - sTop) / Math.max(1, groundY - 1 - sTop)
    const lx = Math.round(cx - f * legW)
    const rx = Math.round(cx + f * legW)
    if (lx >= 0 && lx < W) canvas.setCell(lx, y, '╲', '#585858')
    if (rx >= 0 && rx < W) canvas.setCell(rx, y, '╱', '#585858')
    if (cx >= 0 && cx < W) canvas.setCell(cx, y, '│', '#585858')
  }
  for (let i = 1; i <= 3; i++) {
    const by = Math.floor(sTop + (groundY - sTop) * (i / 4))
    const bf = (by - sTop) / Math.max(1, groundY - 1 - sTop)
    const bw = Math.round(bf * legW)
    for (let x = cx - bw; x <= cx + bw; x++) {
      if (x >= 0 && x < W && by >= 0 && by < H)
        canvas.setCell(x, by, '─', '#484848')
    }
  }

  // ── Outer rim (structural circle) ──
  const rimPts = 180
  for (let i = 0; i < rimPts; i++) {
    const a = (i / rimPts) * TAU
    const px = Math.round(cx + Math.cos(a) * R * ASPECT)
    const py = Math.round(cy + Math.sin(a) * R)
    if (px >= 0 && px < W && py >= 0 && py < groundY)
      canvas.setCell(px, py, '·', '#484848')
  }

  // ── Spokes ──
  for (let i = 0; i < N_SPOKES; i++) {
    const a = rot + (i / N_SPOKES) * TAU
    const ex = cx + Math.cos(a) * R * ASPECT
    const ey = cy + Math.sin(a) * R
    const len = Math.floor(Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2))
    for (let s = 3; s < len - 2; s++) {
      const sf = s / len
      const px = Math.round(cx + (ex - cx) * sf)
      const py = Math.round(cy + (ey - cy) * sf)
      if (px >= 0 && px < W && py >= 0 && py < groundY) {
        const fade = 0.25 + sf * 0.15
        canvas.setCell(px, py, '·', c2h(72 * fade, 72 * fade, 72 * fade))
      }
    }
  }

  // ── Rim lights (chasing pattern) ──
  for (let i = 0; i < RIM_LIGHTS; i++) {
    const a = (i / RIM_LIGHTS) * TAU
    const px = Math.round(cx + Math.cos(a) * R * ASPECT)
    const py = Math.round(cy + Math.sin(a) * R)
    if (px < 0 || px >= W || py < 0 || py >= groundY) continue

    const ci = Math.floor(((i + Math.floor(t * 4)) % RIM_LIGHTS) /
                          (RIM_LIGHTS / LIGHT_COLORS.length)) % LIGHT_COLORS.length
    const pulse = 0.6 + Math.sin(t * 3.5 + i * 0.6) * 0.4
    const c = LIGHT_COLORS[ci]
    const cr = parseInt(c.slice(1, 3), 16) * pulse
    const cg = parseInt(c.slice(3, 5), 16) * pulse
    const cb = parseInt(c.slice(5, 7), 16) * pulse
    canvas.setCell(px, py, '•', c2h(cr, cg, cb))
  }

  // ── Hub ──
  canvas.setCell(cx, cy, '⊙', '#CCCCCC')
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const px = cx + dx, py = cy + dy
    if (px >= 0 && px < W && py >= 0 && py < H)
      canvas.setCell(px, py, '•', '#888888')
  }

  // ── Gondolas ──
  for (let i = 0; i < N_GONDOLAS; i++) {
    const a = rot + (i / N_GONDOLAS) * TAU
    const rimX = cx + Math.cos(a) * R * ASPECT
    const rimY = cy + Math.sin(a) * R
    const gx = Math.round(rimX)
    const armEnd = Math.round(rimY) + 1
    const gy = armEnd + 1

    if (gy < 0 || gy + 1 >= groundY || gx < 2 || gx >= W - 2) continue

    // Arm
    if (armEnd >= 0 && armEnd < H)
      canvas.setCell(gx, armEnd, '│', '#888888')

    // Body
    const color = GONDOLA_COLORS[i % GONDOLA_COLORS.length]
    const gcr = parseInt(color.slice(1, 3), 16)
    const gcg = parseInt(color.slice(3, 5), 16)
    const gcb = parseInt(color.slice(5, 7), 16)

    // Top row — flat roof
    for (let dx = -1; dx <= 1; dx++) {
      const px = gx + dx
      if (px >= 0 && px < W && gy >= 0 && gy < H)
        canvas.setCell(px, gy, BLOCK.full, color, color)
    }
    // Bottom row — darker base
    if (gy + 1 >= 0 && gy + 1 < H) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = gx + dx
        if (px >= 0 && px < W)
          canvas.setCell(px, gy + 1, BLOCK.upper,
            c2h(gcr * 0.45, gcg * 0.45, gcb * 0.45))
      }
    }

    // Window glow (center of top row)
    const glow = 0.65 + Math.sin(t * 1.6 + i * 0.8) * 0.35
    if (gy >= 0 && gy < H)
      canvas.setCell(gx, gy, BLOCK.full,
        c2h(255 * glow, 228 * glow, 135 * glow),
        c2h(195 * glow, 170 * glow, 75 * glow))
  }

  // ── Carnival booths ──
  for (const b of booths) {
    const top = groundY - b.h
    for (let dy = 0; dy < b.h; dy++) {
      for (let dx = 0; dx < b.w; dx++) {
        const px = b.x + dx, py = top + dy
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const shade = 0.3 + (dy / b.h) * 0.15
          const cr = parseInt(b.color.slice(1, 3), 16) * shade
          const cg = parseInt(b.color.slice(3, 5), 16) * shade
          const cb = parseInt(b.color.slice(5, 7), 16) * shade
          canvas.setCell(px, py, BLOCK.full, c2h(cr, cg, cb), c2h(cr, cg, cb))
        }
      }
    }
    // Striped awning
    if (top - 1 >= 0) {
      for (let dx = -1; dx <= b.w; dx++) {
        const px = b.x + dx
        if (px >= 0 && px < W)
          canvas.setCell(px, top - 1, BLOCK.lower,
            dx % 2 === 0 ? b.color : '#F0DFC0')
      }
    }
    // Light bulb
    const lx = b.x + Math.floor(b.w / 2)
    const ly = top - 2
    if (lx >= 0 && lx < W && ly >= 0 && ly < H) {
      const lp = 0.65 + Math.sin(t * 2.4 + b.lph) * 0.35
      canvas.setCell(lx, ly, '◆', c2h(255 * lp, 210 * lp, 80 * lp))
    }
  }

  // ── String lights across the midway ──
  const slY0 = groundY - 6
  for (let x = 4; x < W - 4; x++) {
    const sag = Math.sin((x - 4) / (W - 8) * Math.PI) * 1.5
    const ly = slY0 + Math.round(sag)
    if (ly >= 0 && ly < H) {
      if (x % 4 === 0) {
        const lp = 0.5 + Math.sin(t * 2.8 + x * 0.4) * 0.5
        const lc = LIGHT_COLORS[(x / 4) % LIGHT_COLORS.length]
        const lr = parseInt(lc.slice(1, 3), 16) * lp
        const lg = parseInt(lc.slice(3, 5), 16) * lp
        const lb = parseInt(lc.slice(5, 7), 16) * lp
        canvas.setCell(x, ly, '•', c2h(lr, lg, lb))
      } else {
        canvas.setCell(x, ly, '─', '#333333')
      }
    }
  }
}
