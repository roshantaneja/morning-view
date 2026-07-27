import { lerpMulti, lerp } from '../src/theme.js'

export const title = 'Morning Dew'
export const description = 'A spider web jewelled with the first light of dawn'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SKY = ['#030518', '#060a28', '#0c1038', '#141848', '#1c2458', '#283468']
const HORIZON = ['#283468', '#3c2850', '#502838', '#702828', '#903820', '#b85818', '#d88020', '#eeaa30']
const SILK = ['#1c2840', '#2c3c60', '#3c5480', '#5070a0', '#6888c0', '#88aae0']
const DEW = ['#805818', '#a07020', '#c08828', '#e0a030', '#f0b840', '#f8cc58', '#ffe080', '#fff0b0']

export function setup(canvas) {
  const rng = srand(727)
  const w = canvas.width
  const h = canvas.height
  const AR = 0.55

  const cx = Math.floor(w * 0.48)
  const cy = Math.floor(h * 0.38)
  const maxR = Math.min(w * 0.42, h * 0.5)

  const N = 18
  const angles = []
  for (let i = 0; i < N; i++) {
    angles.push((i / N) * Math.PI * 2 + (rng() - 0.5) * 0.05)
  }

  const nRings = 20
  const radii = []
  for (let i = 0; i < nRings; i++) {
    const t = (i + 2) / (nRings + 4)
    radii.push(maxR * t * (0.96 + rng() * 0.08))
  }

  const spokeLen = angles.map(() => maxR * (0.88 + rng() * 0.14))

  const drops = []
  for (const r of radii) {
    for (let si = 0; si < N; si++) {
      if (rng() < 0.35) continue
      const a = angles[si]
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r * AR
      if (x > 4 && x < w - 6 && y > 4 && y < h - 6) {
        drops.push({
          x, y, r,
          size: 0.15 + rng() * 0.85,
          phase: rng() * Math.PI * 2,
          rate: 0.25 + rng() * 1.0
        })
      }
    }
  }

  const stars = Array.from({ length: 30 }, () => ({
    x: Math.floor(rng() * w),
    y: Math.floor(rng() * h * 0.4),
    phase: rng() * Math.PI * 2,
    b: 0.15 + rng() * 0.4
  }))

  return { cx, cy, maxR, AR, angles, radii, spokeLen, drops, stars, N }
}

function draw(canvas, state, time) {
  const w = canvas.width, h = canvas.height
  const { cx, cy, maxR, AR, angles, radii, spokeLen, drops, stars, N } = state

  for (let y = 0; y < h; y++) {
    const f = y / h
    const bg = f < 0.5
      ? lerpMulti(SKY, f / 0.5)
      : lerpMulti(HORIZON, (f - 0.5) / 0.5)
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, bg)
  }

  const glowR = w * 0.35
  const glowRows = Math.floor(h * 0.2)
  for (let dy = -glowRows; dy <= 0; dy++) {
    const gy = h - 1 + dy
    if (gy < 0) continue
    for (let dx = -Math.floor(glowR); dx <= Math.floor(glowR); dx++) {
      const gx = Math.floor(w / 2) + dx
      if (gx < 0 || gx >= w) continue
      const dist = Math.sqrt(dx * dx + dy * dy * 4)
      if (dist < glowR) {
        const intensity = (1 - dist / glowR) * 0.18
        const cell = canvas.getCell(gx, gy)
        if (cell && cell.bg) {
          canvas.setCell(gx, gy, ' ', null, lerp(cell.bg, '#f0c040', intensity))
        }
      }
    }
  }

  for (const s of stars) {
    const tw = Math.sin(time * 0.5 + s.phase)
    const b = s.b * (0.4 + tw * 0.6) * 0.8
    if (b > 0.1) {
      const col = lerpMulti(['#0c1030', '#3050a0', '#7090d0', '#b0d0ff'], Math.min(1, b))
      canvas.setCell(s.x, s.y, tw > 0.7 ? '✧' : '·', col)
    }
  }

  const swX = Math.sin(time * 0.22) * 1.2
  const swY = Math.sin(time * 0.31 + 0.8) * 0.5
  const sway = (px, py, r) => ({
    x: Math.round(px + swX * r / maxR),
    y: Math.round(py + swY * r / maxR)
  })

  for (const r of radii) {
    const col = lerpMulti(SILK, Math.min(1, (r / maxR) * 0.6 + 0.1))
    for (let i = 0; i < N; i++) {
      const a1 = angles[i]
      const a2 = angles[(i + 1) % N]
      const p1 = sway(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r * AR, r)
      const p2 = sway(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r * AR, r)
      canvas.drawLine(p1.x, p1.y, p2.x, p2.y, '·', col)
    }
  }

  for (let i = 0; i < N; i++) {
    const a = angles[i]
    const len = spokeLen[i]
    const end = sway(cx + Math.cos(a) * len, cy + Math.sin(a) * len * AR, len)
    const col = lerpMulti(SILK, 0.35 + Math.abs(Math.sin(a)) * 0.15)
    canvas.drawLine(cx, cy, end.x, end.y, '·', col)
  }

  canvas.setCell(cx, cy, '◎', lerpMulti(SILK, 0.7))

  for (const d of drops) {
    const p = sway(d.x, d.y, d.r)
    if (p.x < 1 || p.x >= w - 1 || p.y < 1 || p.y >= h - 1) continue

    const tw = Math.sin(time * d.rate + d.phase)
    const b = Math.max(0, Math.min(1, 0.2 + d.size * 0.5 + tw * 0.3))
    const sparkle = tw > 0.9 && d.size > 0.55

    let ch, col
    if (sparkle) {
      ch = '✦'; col = '#ffffff'
    } else if (d.size > 0.7) {
      ch = b > 0.65 ? '●' : '•'; col = lerpMulti(DEW, b)
    } else if (d.size > 0.35) {
      ch = '•'; col = lerpMulti(DEW, b * 0.85)
    } else {
      ch = '·'; col = lerpMulti(DEW, b * 0.6)
    }

    canvas.setCell(p.x, p.y, ch, col)
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
