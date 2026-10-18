import { hex, bgHex, BLOCK, GLYPH } from '../src/theme.js'

export const title = 'Snow Globe'
export const description =
  'A whole winter held in glass — every flake a memory that refuses to melt'
export const fps = 3

const TAU = Math.PI * 2
const ASPECT = 2.0

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}

function sDist(x, y, cx, cy, R) {
  const dx = (x - cx) / ASPECT
  const dy = y - cy
  return Math.sqrt(dx * dx + dy * dy) / R
}

export function setup(canvas, data) {
  const W = canvas.width
  const H = canvas.height
  const rng = srand(1018)

  const cx = Math.floor(W / 2)
  const cy = Math.floor(H * 0.38)
  const R = Math.floor(Math.min(W / ASPECT * 0.44, H * 0.32))
  const groundY = cy + Math.floor(R * 0.38)

  const flakes = []
  for (let i = 0; i < 75; i++) {
    const a = rng() * TAU
    const r = Math.sqrt(rng()) * R * 0.82
    let fy = cy + Math.sin(a) * r
    if (fy >= groundY - 1) fy = cy - R * 0.6 + rng() * R * 0.4
    flakes.push({
      x: cx + Math.cos(a) * r * ASPECT,
      y: fy,
      speed: 0.15 + rng() * 0.35,
      drift: (rng() - 0.5) * 0.15,
      ch: rng() > 0.55 ? '•' : '·',
      bright: 0.5 + rng() * 0.5,
    })
  }

  const stars = []
  for (let i = 0; i < 30; i++) {
    const a = rng() * TAU
    const r = rng() * R * 0.85
    const sx = cx + Math.cos(a) * r * ASPECT
    const sy = cy + Math.sin(a) * r
    if (sy < groundY - 4 && sDist(sx, sy, cx, cy, R) < 0.88) {
      stars.push({ x: Math.round(sx), y: Math.round(sy), ph: rng() * TAU })
    }
  }

  const sparkles = []
  for (let i = 0; i < 14; i++) {
    sparkles.push({
      angle: -Math.PI * 1.0 + rng() * Math.PI * 1.0,
      dist: 0.93 + rng() * 0.05,
      ph: rng() * TAU,
      spd: 0.3 + rng() * 1.4,
    })
  }

  return { cx, cy, R, groundY, flakes, stars, sparkles, rng }
}

function drawAll(canvas, state, t) {
  const W = canvas.width
  const H = canvas.height
  const { cx, cy, R, groundY, flakes, stars, sparkles } = state

  // ── Background: deep indigo gradient ──
  for (let y = 0; y < H; y++) {
    const f = y / H
    const bg = c2h(5 + f * 10, 6 + f * 12, 18 + f * 20)
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, bg)
  }

  // ── Sphere interior + rim ──
  const yMin = Math.max(0, cy - R - 2)
  const yMax = Math.min(H - 1, cy + R + 2)
  const xSpan = Math.ceil(R * ASPECT) + 3

  for (let y = yMin; y <= yMax; y++) {
    for (let x = Math.max(0, cx - xSpan); x <= Math.min(W - 1, cx + xSpan); x++) {
      const d = sDist(x, y, cx, cy, R)
      if (d > 1.07) continue

      if (d > 0.93) {
        // Glass rim
        const rimT = (d - 0.93) / 0.14
        const rimB = Math.sin(rimT * Math.PI)
        const ang = Math.atan2(y - cy, (x - cx) / ASPECT)
        const spec = Math.max(0, -Math.sin(ang + 0.7)) * 0.5
        const rr = 90 + (rimB + spec) * 130
        const rg = 110 + (rimB + spec) * 120
        const rb = 145 + (rimB + spec) * 110
        canvas.setCell(x, y, rimB > 0.55 ? BLOCK.light : ' ',
          c2h(rr, rg, rb), c2h(rr * 0.2, rg * 0.2, rb * 0.2))
        continue
      }

      // Interior
      if (y >= groundY) {
        // Snow ground
        const depth = (y - groundY) / Math.max(1, (cy + R * 0.88) - groundY)
        const dC = Math.min(1, depth)
        const hill = Math.sin(x * 0.12 + 1.8) * 1.2 + Math.cos(x * 0.07 + 0.5) * 1.8
        if (y === groundY || y < groundY + hill + 1) {
          canvas.setCell(x, y, BLOCK.dark, '#e0e8f5', '#c5cfe0')
        } else {
          canvas.setCell(x, y, ' ', null,
            c2h(200 - dC * 60, 208 - dC * 55, 225 - dC * 40))
        }
      } else {
        // Night sky
        const skyF = (y - (cy - R)) / Math.max(1, groundY - (cy - R))
        canvas.setCell(x, y, ' ', null,
          c2h(8 + skyF * 16, 12 + skyF * 22, 35 + skyF * 30))
      }
    }
  }

  // ── Stars ──
  for (const s of stars) {
    if (s.x < 0 || s.x >= W || s.y < 0 || s.y >= H) continue
    if (s.y >= groundY) continue
    const tw = 0.3 + Math.sin(t * 1.2 + s.ph) * 0.7
    if (tw > 0.25) {
      canvas.setCell(s.x, s.y, tw > 0.8 ? '✦' : '·',
        c2h(170 + tw * 85, 185 + tw * 70, 215 + tw * 40))
    }
  }

  // ── Pine trees (behind church) ──
  function pine(tx, th) {
    for (let dy = 0; dy < 2; dy++) {
      const py = groundY - 1 - dy
      if (py >= 0 && py < H && tx >= 0 && tx < W &&
          sDist(tx, py, cx, cy, R) < 0.90)
        canvas.setCell(tx, py, '│', '#5a3820')
    }
    for (let layer = 0; layer < th; layer++) {
      const py = groundY - 3 - layer
      const w = Math.min(Math.floor((layer + 1) * 0.9), 4)
      for (let dx = -w; dx <= w; dx++) {
        const px = tx + dx
        if (px < 0 || px >= W || py < 0 || py >= H) continue
        if (sDist(px, py, cx, cy, R) > 0.89) continue
        const sh = 0.45 + (layer / th) * 0.55
        const gc = c2h(15 * sh, 55 * sh + 14, 22 * sh)
        canvas.setCell(px, py, BLOCK.full, gc, gc)
      }
    }
    // Snow on top
    const topY = groundY - 3 - th + 1
    if (topY >= 0 && topY < H && tx >= 0 && tx < W)
      canvas.setCell(tx, topY, '▲', '#1c4825')
    if (topY + 1 < H && topY + 1 >= 0) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = tx + dx
        if (px >= 0 && px < W && sDist(px, topY + 1, cx, cy, R) < 0.89)
          canvas.setCell(px, topY + 1, BLOCK.medium, '#d5e2f0',
            c2h(15 * 0.7, 55 * 0.7 + 14, 22 * 0.7))
      }
    }
  }

  const trees = [
    [-0.14, 7], [-0.08, 9], [0.08, 8], [0.14, 6],
    [-0.21, 5], [0.21, 5], [-0.27, 3], [0.27, 4],
  ]
  for (const [off, h] of trees) {
    const tx = Math.round(cx + W * off)
    if (sDist(tx, groundY - h - 3, cx, cy, R) < 0.86) pine(tx, h)
  }

  // ── Church / cottage ──
  const bW = Math.max(4, Math.floor(W * 0.04))
  const bH = Math.max(8, Math.floor(H * 0.10))
  const bTop = groundY - bH

  // Walls
  for (let dy = 0; dy < bH; dy++) {
    for (let dx = -bW; dx <= bW; dx++) {
      const px = cx + dx, py = bTop + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      if (sDist(px, py, cx, cy, R) > 0.89) continue
      const sh = 0.65 + (dy / bH) * 0.35
      canvas.setCell(px, py, BLOCK.full,
        c2h(52 * sh, 48 * sh, 56 * sh),
        c2h(52 * sh, 48 * sh, 56 * sh))
    }
  }

  // Roof / steeple
  const stH = Math.max(3, Math.floor(bH * 0.5))
  for (let dy = 0; dy < stH; dy++) {
    const w = Math.max(0, Math.floor((stH - dy) * 0.85))
    for (let dx = -w; dx <= w; dx++) {
      const px = cx + dx, py = bTop - stH + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      if (sDist(px, py, cx, cy, R) > 0.89) continue
      canvas.setCell(px, py, BLOCK.dark, c2h(78, 52, 38), c2h(48, 32, 22))
    }
  }

  // Cross
  const crossY = bTop - stH - 1
  if (crossY >= 0 && crossY < H)
    canvas.setCell(cx, crossY, '✚', '#c5a555')

  // Snow on roof ridge
  const ridgeY = bTop - stH
  if (ridgeY >= 0 && ridgeY < H) {
    for (let dx = -1; dx <= 1; dx++) {
      const px = cx + dx
      if (px >= 0 && px < W) canvas.setCell(px, ridgeY, '▁', '#dae3f2')
    }
  }

  // Windows (warm glow)
  const fA = 0.82 + Math.sin(t * 2.0) * 0.18
  const fB = 0.82 + Math.sin(t * 2.8 + 1.7) * 0.18
  const wY = groundY - Math.floor(bH * 0.45)

  for (const [dx, f] of [[-2, fA], [2, fB]]) {
    const px = cx + dx
    if (px >= 0 && px < W && wY >= 0 && wY + 1 < H) {
      const gc = c2h(255 * f, 195 * f, 65 * f)
      const gb = c2h(195 * f, 145 * f, 35 * f)
      canvas.setCell(px, wY, BLOCK.full, gc, gb)
      canvas.setCell(px, wY + 1, BLOCK.full, gc, gb)
    }
  }

  // Round window
  const rwY = bTop + 2
  if (rwY >= 0 && rwY < H)
    canvas.setCell(cx, rwY, '◉', c2h(215 * fA, 175 * fA, 55 * fA))

  // Door
  for (let dy = -3; dy <= -1; dy++) {
    const py = groundY + dy
    if (py >= 0 && py < H) canvas.setCell(cx, py, BLOCK.full, '#36281e')
  }

  // ── Warm light spill on snow ──
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = -3 + dy; dx <= 3 - dy; dx++) {
      const px = cx + dx, py = groundY + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      if (sDist(px, py, cx, cy, R) > 0.89) continue
      if (dx === 0 && dy === 0) continue
      const gi = (1 - dy / 3) * (1 - Math.abs(dx) / 3) * 0.35
      canvas.setCell(px, py, ' ', null,
        c2h(210 + gi * 45, 205 + gi * 20, 195 - gi * 60))
    }
  }

  // ── Small cottage to the right ──
  const cotX = cx + Math.floor(W * 0.06)
  const cotW = Math.max(2, Math.floor(W * 0.025))
  const cotH = Math.max(4, Math.floor(H * 0.05))
  const cotTop = groundY - cotH

  if (sDist(cotX, cotTop, cx, cy, R) < 0.86) {
    for (let dy = 0; dy < cotH; dy++) {
      for (let dx = -cotW; dx <= cotW; dx++) {
        const px = cotX + dx, py = cotTop + dy
        if (px < 0 || px >= W || py < 0 || py >= H) continue
        if (sDist(px, py, cx, cy, R) > 0.89) continue
        const sh = 0.6 + (dy / cotH) * 0.4
        canvas.setCell(px, py, BLOCK.full,
          c2h(62 * sh, 50 * sh, 42 * sh),
          c2h(62 * sh, 50 * sh, 42 * sh))
      }
    }
    // Cottage roof
    for (let dy = 0; dy < 2; dy++) {
      const rw = cotW + 1 - dy
      for (let dx = -rw; dx <= rw; dx++) {
        const px = cotX + dx, py = cotTop - 2 + dy
        if (px < 0 || px >= W || py < 0 || py >= H) continue
        if (sDist(px, py, cx, cy, R) > 0.89) continue
        canvas.setCell(px, py, BLOCK.dark, c2h(70, 45, 30), c2h(45, 28, 18))
      }
    }
    // Snow on cottage roof
    const crY = cotTop - 2
    if (crY >= 0 && crY < H) {
      for (let dx = -cotW; dx <= cotW; dx++) {
        const px = cotX + dx
        if (px >= 0 && px < W) canvas.setCell(px, crY, '▁', '#dae3f2')
      }
    }
    // Cottage window
    const cwY = groundY - Math.floor(cotH * 0.5)
    if (cwY >= 0 && cwY < H && cotX >= 0 && cotX < W) {
      const cf = 0.82 + Math.sin(t * 1.5 + 3) * 0.18
      canvas.setCell(cotX, cwY, BLOCK.full,
        c2h(255 * cf, 195 * cf, 65 * cf), c2h(195 * cf, 145 * cf, 35 * cf))
    }
    // Chimney
    const chimX = cotX + cotW - 1
    for (let dy = -3; dy < 0; dy++) {
      const py = cotTop + dy
      if (py >= 0 && py < H && chimX >= 0 && chimX < W)
        canvas.setCell(chimX, py, BLOCK.full, '#5a3a28')
    }
    // Smoke wisps
    const smokeX = chimX + Math.round(Math.sin(t * 0.8) * 1.5)
    for (let dy = -6; dy < -3; dy++) {
      const py = cotTop + dy
      if (py >= 0 && py < H && smokeX >= 0 && smokeX < W &&
          sDist(smokeX, py, cx, cy, R) < 0.88) {
        const sf = 0.3 + ((-3 - dy) / 3) * 0.3
        canvas.setCell(smokeX + Math.round(Math.sin(t + dy) * 0.7), py,
          '~', c2h(120 + sf * 80, 130 + sf * 70, 150 + sf * 60))
      }
    }
  }

  // ── Snowflakes ──
  for (const f of flakes) {
    const fx = Math.round(f.x), fy = Math.round(f.y)
    if (fx < 0 || fx >= W || fy < 0 || fy >= H) continue
    if (sDist(fx, fy, cx, cy, R) > 0.90 || fy >= groundY) continue
    const pulse = 0.65 + Math.sin(t * 2 + f.x * 0.1 + f.y * 0.15) * 0.35
    const b = f.bright * pulse
    canvas.setCell(fx, fy, f.ch,
      c2h(185 + b * 70, 195 + b * 60, 220 + b * 35))
  }

  // ── Specular arc (upper-left) ──
  const arcA0 = -Math.PI * 0.88, arcA1 = -Math.PI * 0.42
  for (let i = 0; i <= 24; i++) {
    const f = i / 24
    const a = arcA0 + (arcA1 - arcA0) * f
    const r = R * (0.78 + Math.sin(f * Math.PI) * 0.07)
    const hx = Math.round(cx + Math.cos(a) * r * ASPECT)
    const hy = Math.round(cy + Math.sin(a) * r)
    if (hx >= 0 && hx < W && hy >= 0 && hy < H) {
      const b = Math.sin(f * Math.PI)
      canvas.setCell(hx, hy, b > 0.55 ? '·' : ' ',
        c2h(195 + b * 60, 210 + b * 45, 238 + b * 17))
    }
  }

  // ── Sparkles on glass ──
  for (const sp of sparkles) {
    const b = Math.sin(t * sp.spd + sp.ph)
    if (b < 0.35) continue
    const sx = Math.round(cx + Math.cos(sp.angle) * R * sp.dist * ASPECT)
    const sy = Math.round(cy + Math.sin(sp.angle) * R * sp.dist)
    if (sx >= 0 && sx < W && sy >= 0 && sy < H)
      canvas.setCell(sx, sy, b > 0.82 ? '✦' : '·',
        c2h(195 + b * 60, 215 + b * 40, 255))
  }

  // ── Neck ──
  const neckTop = cy + R + 1
  const baseTop = neckTop + 3
  const neckW = Math.floor(R * ASPECT * 0.18)

  for (let y = neckTop; y < Math.min(baseTop, H); y++) {
    const frac = (y - neckTop) / 3
    const nw = Math.floor(neckW * (0.6 + frac * 0.4))
    for (let x = cx - nw; x <= cx + nw; x++) {
      if (x < 0 || x >= W) continue
      const tr = Math.abs(x - cx) / Math.max(1, nw)
      const sh = 0.85 - tr * 0.3
      canvas.setCell(x, y, ' ', null,
        c2h(145 * sh, 110 * sh, 58 * sh))
    }
  }
  // Gold ring
  if (neckTop >= 0 && neckTop < H) {
    for (let x = cx - neckW - 1; x <= cx + neckW + 1; x++) {
      if (x >= 0 && x < W) canvas.setCell(x, neckTop, '▄', '#b8982e')
    }
  }

  // ── Base ──
  const baseH = Math.max(5, Math.floor(H * 0.065))
  const baseW = Math.floor(R * ASPECT * 0.52)

  for (let y = baseTop; y < Math.min(baseTop + baseH, H); y++) {
    const bT = (y - baseTop) / Math.max(1, baseH)
    const swell = Math.sin(bT * Math.PI) * 0.12
    const rw = Math.floor(baseW * (0.88 + swell))

    for (let x = cx - rw; x <= cx + rw; x++) {
      if (x < 0 || x >= W) continue
      const tr = Math.abs(x - cx) / Math.max(1, rw)
      const sh = 1.0 - tr * 0.35
      const grain = Math.sin(y * 4 + x * 0.14) * 8
      const bR = cl((105 + bT * 22 + grain) * sh)
      const bG = cl((68 + bT * 12 + grain * 0.7) * sh)
      const bB = cl((32 + bT * 6 + grain * 0.3) * sh)

      const edge = tr > 0.92 || bT < 0.1 || bT > 0.9
      if (edge) {
        canvas.setCell(x, y, BLOCK.dark,
          c2h(188, 158, 78), c2h(128, 98, 44))
      } else {
        canvas.setCell(x, y, ' ', null, c2h(bR, bG, bB))
      }
    }
  }

  // Nameplate
  const plate = GLYPH.snowflake + ' WINTER ' + GLYPH.snowflake
  const pX = Math.floor(cx - plate.length / 2)
  const pY = baseTop + Math.floor(baseH / 2)
  if (pY >= 0 && pY < H) {
    for (let i = 0; i < plate.length; i++) {
      const px = pX + i
      if (px >= 0 && px < W) canvas.setCell(px, pY, plate[i], '#d0be88')
    }
  }

  // Bottom lip
  const lipY = Math.min(baseTop + baseH, H - 1)
  const lipW = Math.floor(baseW * 0.78)
  if (lipY < H) {
    for (let x = cx - lipW; x <= cx + lipW; x++) {
      if (x >= 0 && x < W) canvas.setCell(x, lipY, '▀', c2h(85, 58, 28))
    }
  }
}

export function render(canvas, data, state) {
  drawAll(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const { cx, cy, R, groundY, flakes, rng } = state

  for (const f of flakes) {
    f.y += f.speed
    f.x += f.drift + Math.sin(frame.elapsed * 0.5 + f.x * 0.06) * 0.1

    if (f.y >= groundY - 1 || sDist(f.x, f.y, cx, cy, R) > 0.87) {
      const a = -Math.PI * 0.5 + (rng() - 0.5) * Math.PI * 0.7
      const r = rng() * R * 0.55
      f.x = cx + Math.cos(a) * r * ASPECT
      f.y = cy - R * 0.72 + rng() * R * 0.15
      f.speed = 0.15 + rng() * 0.35
      f.drift = (rng() - 0.5) * 0.15
    }
  }

  drawAll(canvas, state, frame.elapsed)
}
