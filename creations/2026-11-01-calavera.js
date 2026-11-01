import { BLOCK } from '../src/theme.js'

export const title = 'Día de los Muertos'
export const description =
  'An ofrenda glows with cempasúchil and candlelight — tonight the veil lifts, and the beloved find their way home'
export const fps = 2

const TAU = Math.PI * 2

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}
function pH(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}
function mix(a, b, t) {
  t = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = pH(a), [r2, g2, b2] = pH(b)
  return c2h(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function skullHW(t) {
  if (t < 0 || t > 1) return 0
  if (t < 0.05) return Math.sqrt(Math.max(0, 1 - ((0.05 - t) / 0.05) ** 2)) * 0.55
  if (t < 0.35) return 0.55 + (t - 0.05) / 0.30 * 0.45
  if (t < 0.48) return 1.0
  if (t < 0.58) return 1.0 - (t - 0.48) / 0.10 * 0.15
  if (t < 0.72) return 0.85 - (t - 0.58) / 0.14 * 0.12
  if (t < 0.88) return 0.73 - (t - 0.72) / 0.16 * 0.18
  return Math.max(0, Math.sqrt(Math.max(0, 1 - ((t - 0.88) / 0.12) ** 2)) * 0.55)
}

const BANNER = ['#e02080', '#00b898', '#f09030', '#8030c0', '#f0c840', '#2880e0']
const CEMPAS = ['#c05810', '#d87020', '#e88828', '#f0a040']

export function setup(canvas, data) {
  const rng = srand(20261101)
  const W = canvas.width, H = canvas.height
  const cx = Math.floor(W / 2)
  const sTop = Math.floor(H * 0.15), sBot = Math.floor(H * 0.61)
  const sH = sBot - sTop, mhw = Math.floor(W * 0.20)
  const tY = Math.floor(H * 0.65)

  const stars = Array.from({ length: 50 }, () => ({
    x: Math.floor(rng() * W), y: Math.floor(rng() * H * 0.62),
    b: 0.2 + rng() * 0.8, ph: rng() * TAU, sp: 0.3 + rng() * 1.5,
  }))

  const candles = []
  const gap = Math.max(4, Math.floor(W * 0.04))
  for (let i = 0; i < 5; i++) {
    for (const side of [-1, 1]) {
      const x = cx + side * (mhw + 5 + i * gap)
      if (x >= 2 && x < W - 2) candles.push({
        x, h: 5 + Math.floor(rng() * 5), hue: Math.floor(rng() * 3),
        fp: rng() * TAU, fs: 1.5 + rng() * 2,
      })
    }
  }

  const petals = Array.from({ length: 25 }, () => ({
    x: rng() * W, y: rng() * H,
    vx: (rng() - 0.5) * 0.3, vy: 0.15 + rng() * 0.35,
    sw: 0.5 + rng() * 1.5, ph: rng() * TAU,
    ci: Math.floor(rng() * CEMPAS.length),
  }))

  const marigolds = Array.from({ length: 80 }, () => ({
    x: Math.floor(rng() * W),
    y: tY + 2 + Math.floor(rng() * (H - tY - 2)),
    big: rng() < 0.35,
    ci: Math.floor(rng() * CEMPAS.length),
    pp: rng() * TAU,
  }))

  return { W, H, cx, sTop, sBot, sH, mhw, tY, stars, candles, petals, marigolds }
}

export function render(canvas, data, state) { scene(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  for (const p of state.petals) {
    p.y += p.vy
    p.x += p.vx + Math.sin(frame.elapsed * p.sw + p.ph) * 0.3
    if (p.y > state.H) { p.y = -1; p.x = Math.random() * state.W }
    if (p.x < 0) p.x += state.W
    if (p.x >= state.W) p.x -= state.W
  }
  scene(canvas, state, frame.elapsed)
}

function scene(canvas, s, t) {
  bg(canvas, s, t)
  banners(canvas, s, t)
  skull(canvas, s, t)
  table(canvas, s)
  candlesDraw(canvas, s, t)
  marigoldsDraw(canvas, s, t)
  petalsDraw(canvas, s)
}

function bg(canvas, s, t) {
  const { W, H, stars } = s
  for (let y = 0; y < H; y++) {
    const c = mix('#06001a', '#140435', y / H)
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, c)
  }
  for (const st of stars) {
    const tw = st.b * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * st.sp + st.ph)))
    if (tw > 0.15) canvas.setCell(st.x, st.y, tw > 0.6 ? '✦' : '·', mix('#140435', '#e8e0d0', tw))
  }
}

function banners(canvas, s, t) {
  const { W, H } = s
  for (const by of [2, 8]) {
    for (let x = 0; x < W; x++) canvas.setCell(x, by, '─', '#806040')
    const sway = Math.sin(t * 0.5 + by * 0.2) * 0.4
    const seg = Math.ceil(W / BANNER.length)
    for (let i = 0; i < BANNER.length; i++) {
      const sx = i * seg + 1, ex = Math.min((i + 1) * seg - 1, W - 1)
      const mx = Math.floor((sx + ex) / 2)
      const col = BANNER[(i + (by > 5 ? 3 : 0)) % BANNER.length]
      for (let dy = 1; dy <= 4; dy++) {
        const ry = by + dy
        if (ry >= H) continue
        const prog = dy / 4
        const hw = Math.floor((ex - sx) / 2 * (1 - prog * 0.7))
        for (let dx = -hw; dx <= hw; dx++) {
          const px = mx + dx + Math.round(sway * dy * 0.3)
          if (px < 0 || px >= W) continue
          const ad = Math.abs(dx)
          if ((dy === 2 && ad > 1 && ad % 3 === 0) || (dy === 3 && ad > 0 && (ad + 1) % 3 === 0)) continue
          canvas.setCell(px, ry, BLOCK.full, mix(col, '#000000', prog * 0.15))
        }
        if (dy === 4) {
          for (let dx = -hw; dx <= hw; dx += 2) {
            const px = mx + dx + Math.round(sway * dy * 0.3)
            if (px >= 0 && px < W) canvas.setCell(px, ry, '▼', mix(col, '#000000', 0.1))
          }
        }
      }
    }
  }
}

function skull(canvas, s, t) {
  const { W, H, cx, sTop, sH, mhw } = s

  for (let row = 0; row <= sH; row++) {
    const ry = row / sH
    const hw = Math.floor(skullHW(ry) * mhw)
    const y = sTop + row
    if (y >= H || hw <= 0) continue
    for (let dx = -hw; dx <= hw; dx++) {
      const x = cx + dx
      if (x < 0 || x >= W) continue
      const edge = Math.abs(dx) / Math.max(1, hw)
      canvas.setCell(x, y, ' ', null, mix('#f0e8d8', '#c0a888', edge * 0.45))
    }
    const lx = cx - hw, rx = cx + hw
    if (lx >= 0 && lx < W) canvas.setCell(lx, y, BLOCK.right, '#b0987a')
    if (rx >= 0 && rx < W) canvas.setCell(rx, y, BLOCK.left, '#b0987a')
  }

  const bandY = sTop + Math.floor(0.22 * sH)
  const bandHW = Math.floor(skullHW(0.22) * mhw * 0.7)
  for (let dx = -bandHW; dx <= bandHW; dx += 3) {
    const px = cx + dx, px2 = cx + dx + 1
    if (px >= 0 && px < W && bandY >= 0 && bandY < H) canvas.setCell(px, bandY, '◆', '#f09030')
    if (px2 >= 0 && px2 < W && bandY >= 0 && bandY < H) canvas.setCell(px2, bandY, '·', '#f0c040')
  }

  const fhY = sTop + Math.floor(0.14 * sH)
  const fp = 0.75 + 0.25 * Math.sin(t * 1.2)
  const fg = mix('#402008', '#f0c040', fp)
  for (const [dx, dy, ch, col] of [
    [0, -2, '✦', fg], [-1, -1, '❀', fg], [0, -1, '●', '#e02080'], [1, -1, '❀', fg],
    [-2, 0, '✦', fg], [-1, 0, '●', '#e02080'], [0, 0, '◆', '#f08030'], [1, 0, '●', '#e02080'], [2, 0, '✦', fg],
    [-1, 1, '❀', fg], [0, 1, '●', '#e02080'], [1, 1, '❀', fg], [0, 2, '✦', fg],
  ]) {
    const px = cx + dx, py = fhY + dy
    if (px >= 0 && px < W && py >= 0 && py < H) canvas.setCell(px, py, ch, col)
  }

  const eyeRY = 0.33
  const eyeY = sTop + Math.floor(eyeRY * sH)
  const eyeR = Math.max(3, Math.floor(mhw * 0.18))
  const eyeOff = Math.floor(skullHW(eyeRY) * mhw * 0.42)
  for (const side of [-1, 1]) eye(canvas, cx + side * eyeOff, eyeY, eyeR, W, H, t)

  for (const side of [-1, 1]) {
    const tx = cx + side * eyeOff, ty = eyeY + eyeR + 2
    if (tx >= 0 && tx < W && ty < H) canvas.setCell(tx, ty, '◆', '#00b898')
    if (tx >= 0 && tx < W && ty + 1 < H) canvas.setCell(tx, ty + 1, '▼', '#00b898')
  }

  const noseY = sTop + Math.floor(0.50 * sH)
  for (let dy = 0; dy < 3; dy++) {
    const nhw = 2 - dy
    for (let dx = -nhw; dx <= nhw; dx++) {
      const px = cx + dx, py = noseY + dy
      if (px >= 0 && px < W && py >= 0 && py < H) canvas.setCell(px, py, ' ', null, '#18080e')
    }
  }
  if (noseY + 3 < H) canvas.setCell(cx, noseY + 3, '▼', '#3a1828')

  const mouthY = sTop + Math.floor(0.65 * sH)
  const mouthHW = Math.floor(skullHW(0.65) * mhw * 0.55)
  mouth(canvas, cx, mouthY, mouthHW, W, H)

  for (let ry = 0.58; ry <= 0.85; ry += 0.04) {
    const y = sTop + Math.floor(ry * sH)
    const hw = Math.floor(skullHW(ry) * mhw)
    if (y >= 0 && y < H) {
      for (const dx of [-hw + 2, hw - 2]) {
        const px = cx + dx
        if (px >= 0 && px < W) canvas.setCell(px, y, '•', '#f09030')
      }
    }
  }

  const chinY = sTop + Math.floor(0.80 * sH)
  for (const [dx, dy, ch, col] of [
    [0, -1, '◆', '#00b898'], [-1, 0, '◆', '#e02080'], [0, 0, '●', '#f09030'],
    [1, 0, '◆', '#e02080'], [0, 1, '◆', '#00b898'],
  ]) {
    const px = cx + dx, py = chinY + dy
    if (px >= 0 && px < W && py >= 0 && py < H) canvas.setCell(px, py, ch, col)
  }
}

function eye(canvas, cx, cy, r, W, H, t) {
  const rx = r * 2, ry = r
  for (let dy = -ry - 2; dy <= ry + 2; dy++) {
    for (let dx = -rx - 3; dx <= rx + 3; dx++) {
      const px = cx + dx, py = cy + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const nd = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
      if (nd <= 0.30) {
        canvas.setCell(px, py, ' ', null, '#08000e')
      } else if (nd <= 0.55) {
        canvas.setCell(px, py, BLOCK.full, '#e02080')
      } else if (nd <= 0.80) {
        canvas.setCell(px, py, BLOCK.full, '#00b898')
      } else if (nd <= 1.15) {
        const angle = Math.atan2(dy, dx / 2)
        if (Math.cos(angle * 6) > 0.2) {
          const pulse = 0.6 + 0.4 * Math.sin(t * 1.2 + angle * 2)
          canvas.setCell(px, py, '✦', mix('#200830', '#f0c040', pulse))
        }
      }
    }
  }
  if (cx >= 0 && cx < W && cy >= 0 && cy < H) canvas.setCell(cx, cy, '✧', '#f0e0f0')
}

function mouth(canvas, cx, my, hw, W, H) {
  const sp = Math.max(3, Math.floor(hw * 2 / 7))
  for (const dy of [-1, 1]) {
    const y = my + dy
    if (y < 0 || y >= H) continue
    for (let dx = -hw; dx <= hw; dx++) {
      const px = cx + dx
      if (px >= 0 && px < W) canvas.setCell(px, y, '─', '#5a2838')
    }
  }
  for (let dx = -hw; dx <= hw; dx++) {
    const px = cx + dx
    if (px < 0 || px >= W) continue
    if (((dx + hw) % sp) === 0) {
      for (let dy = -2; dy <= 2; dy++) {
        const py = my + dy
        if (py >= 0 && py < H) canvas.setCell(px, py, '┃', '#5a2838')
      }
      for (const dy of [-1, 1]) {
        const py = my + dy
        if (py >= 0 && py < H) canvas.setCell(px, py, '┼', '#5a2838')
      }
    } else if (my >= 0 && my < H) {
      canvas.setCell(px, my, ' ', null, '#e8e0d0')
    }
  }
}

function table(canvas, s) {
  const { W, H, tY } = s
  for (let y = tY; y < H; y++) {
    const d = (y - tY) / Math.max(1, H - tY)
    const c = mix('#200830', '#0e0418', d * 0.5)
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, c)
  }
  for (let x = 0; x < W; x++) {
    canvas.setCell(x, tY, '━', '#d06818')
    if (tY + 1 < H) {
      const p = x % 6
      canvas.setCell(x, tY + 1,
        p === 0 ? '◆' : p === 3 ? '◆' : '─',
        p === 0 ? '#e02080' : p === 3 ? '#00b898' : '#8030c0')
    }
  }
}

function candlesDraw(canvas, s, t) {
  const { H, tY, candles } = s
  const cols = ['#e02080', '#d06818', '#8030c0']
  for (const c of candles) {
    const baseY = tY - 1, topY = baseY - c.h
    for (let y = topY; y <= baseY; y++) {
      if (y >= 0 && y < H && c.x >= 0 && c.x < s.W)
        canvas.setCell(c.x, y, BLOCK.full, cols[c.hue])
    }
    const fl = Math.sin(t * c.fs + c.fp)
    const fy = topY - 1, fx = c.x + Math.round(fl * 0.4)
    if (fy >= 0 && fy < H && fx >= 0 && fx < s.W)
      canvas.setCell(fx, fy, '▲', mix('#f0d030', '#ff8020', 0.5 + fl * 0.3))
    if (fy - 1 >= 0 && fy - 1 < H && fx >= 0 && fx < s.W)
      canvas.setCell(fx, fy - 1, '·', mix('#804020', '#f0a040', 0.5 + fl * 0.5))
  }
}

function marigoldsDraw(canvas, s, t) {
  for (const m of s.marigolds) {
    const pulse = 0.65 + 0.35 * Math.sin(t * 0.8 + m.pp)
    const col = mix('#401808', CEMPAS[m.ci], pulse)
    if (m.x >= 0 && m.x < s.W && m.y >= 0 && m.y < s.H)
      canvas.setCell(m.x, m.y, '✿', col)
    if (m.big) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const px = m.x + dx, py = m.y + dy
        if (px >= 0 && px < s.W && py >= 0 && py < s.H) {
          const ex = canvas.getCell(px, py)
          if (ex && ex.char === ' ') canvas.setCell(px, py, '❀', mix(col, '#000000', 0.2))
        }
      }
    }
  }
}

function petalsDraw(canvas, s) {
  for (const p of s.petals) {
    const px = Math.floor(p.x), py = Math.floor(p.y)
    if (px >= 0 && px < s.W && py >= 0 && py < s.H)
      canvas.setCell(px, py, '❋', CEMPAS[p.ci])
  }
}
