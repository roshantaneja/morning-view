import { hex, bgHex, lerp, lerpMulti, DIM } from '../src/theme.js'

export const title = 'Runic Stones'
export const description = 'Before the written word, they carved light into granite — the circle still hums at the hour between'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛗ', 'ᛚ', 'ᛞ', 'ᛟ']

const SKY = [
  '#020208', '#030310', '#050518', '#080822', '#0a0a2c',
  '#0e0c30', '#120e34', '#161038', '#1a1238', '#1e1436',
  '#221632', '#26182e', '#2a1a2a', '#2e1c28',
]

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(909)

  const groundY = Math.floor(H * 0.62)
  const cx = Math.floor(W / 2)

  const stoneDefs = [
    { angle: -55, hFrac: 0.22, wFrac: 0.045 },
    { angle: -35, hFrac: 0.26, wFrac: 0.04  },
    { angle: -18, hFrac: 0.30, wFrac: 0.05  },
    { angle:   0, hFrac: 0.35, wFrac: 0.055 },
    { angle:  18, hFrac: 0.28, wFrac: 0.045 },
    { angle:  35, hFrac: 0.25, wFrac: 0.04  },
    { angle:  55, hFrac: 0.21, wFrac: 0.042 },
  ]

  const arcRadius = W * 0.32
  const stones = stoneDefs.map((def, i) => {
    const rad = def.angle * Math.PI / 180
    const sx = Math.floor(cx + Math.sin(rad) * arcRadius)
    const perspective = Math.abs(def.angle) / 55
    const baseY = groundY - Math.floor(perspective * 2)
    const stoneH = Math.max(8, Math.floor(H * def.hFrac))
    const stoneW = Math.max(3, Math.floor(W * def.wFrac))

    const runeCount = i === 3 ? 4 : 2 + Math.floor(rng() * 2)
    const stoneRunes = []
    for (let r = 0; r < runeCount; r++) {
      stoneRunes.push({
        rune: RUNES[Math.floor(rng() * RUNES.length)],
        ry: Math.floor(stoneH * (0.15 + rng() * 0.65)),
        rx: 1 + Math.floor(rng() * Math.max(1, stoneW - 2)),
        phase: rng() * TAU,
        speed: 0.4 + rng() * 0.8,
      })
    }

    const taper = []
    for (let row = 0; row < stoneH; row++) {
      const rowT = row / stoneH
      let inset = 0
      if (rowT < 0.08) inset = Math.floor((0.08 - rowT) / 0.08 * (stoneW * 0.3))
      taper.push(inset)
    }

    return {
      x: sx - Math.floor(stoneW / 2),
      y: baseY - stoneH,
      w: stoneW,
      h: stoneH,
      runes: stoneRunes,
      tex: rng() * 100,
      taper,
    }
  })

  const stars = []
  for (let i = 0; i < 250; i++) {
    const sx = Math.floor(rng() * W)
    const sy = Math.floor(rng() * (groundY - 3))
    let blocked = false
    for (const st of stones) {
      if (sx >= st.x - 1 && sx <= st.x + st.w + 1 && sy >= st.y - 1 && sy <= st.y + st.h) {
        blocked = true
        break
      }
    }
    if (!blocked) {
      stars.push({
        x: sx, y: sy,
        b: 0.08 + rng() * 0.92,
        ph: rng() * TAU,
        sp: 0.15 + rng() * 3,
      })
    }
  }

  const mist = []
  for (let i = 0; i < 50; i++) {
    mist.push({
      x: rng() * W * 1.5 - W * 0.25,
      y: groundY - 4 + rng() * 10,
      w: 6 + Math.floor(rng() * 20),
      speed: 0.2 + rng() * 0.6,
      opacity: 0.08 + rng() * 0.25,
      ph: rng() * TAU,
    })
  }

  const groundRing = []
  const ringR = arcRadius * 0.92
  for (let a = -70; a <= 70; a += 2) {
    const rad = a * Math.PI / 180
    const rx = Math.floor(cx + Math.sin(rad) * ringR)
    const ry = groundY + Math.floor(Math.cos(rad) * ringR * 0.08)
    if (rx >= 0 && rx < W && ry >= 0 && ry < H) {
      groundRing.push({ x: rx, y: ry })
    }
  }

  const moonX = Math.floor(W * 0.80)
  const moonY = Math.floor(H * 0.10)

  return { W, H, groundY, cx, stones, stars, mist, groundRing, moonX, moonY }
}

export function render(canvas, data, state) { paint(canvas, state, 0) }

export function update(canvas, data, frame, state) { paint(canvas, state, frame.elapsed) }

function paint(canvas, st, t) {
  const { W, H, groundY, cx, stones, stars, mist, groundRing, moonX, moonY } = st

  for (let y = 0; y < H; y++) {
    let c
    if (y < groundY) {
      c = lerpMulti(SKY, y / groundY)
    } else {
      const depth = (y - groundY) / (H - groundY)
      c = lerp('#140e0a', '#080604', depth)
    }
    for (let x = 0; x < W; x++) {
      if (y >= groundY) {
        const tex = Math.sin(x * 0.12 + y * 0.08) * 0.04 + Math.sin(x * 0.3 + y * 0.2) * 0.02
        canvas.setCell(x, y, ' ', null, bgHex(lerp(c, '#1a140e', Math.max(0, tex))))
      } else {
        canvas.setCell(x, y, ' ', null, bgHex(c))
      }
    }
  }

  for (let x = 0; x < W; x++) {
    const wave = Math.sin(x * 0.015 + 1.5) * 0.05
    const glow = Math.max(0, 0.06 + wave)
    for (let dy = -2; dy <= 1; dy++) {
      const py = groundY + dy
      if (py < 0 || py >= H) continue
      const strength = glow * (1 - Math.abs(dy) / 3)
      const bg = canvas.getCell(x, py)
      if (bg && bg.bg) {
        canvas.setCell(x, py, ' ', null, bgHex(lerp(bg.bg, '#2a1820', strength)))
      }
    }
  }

  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      const px = moonX + dx, py = moonY + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const d1 = Math.sqrt((dx / 2.1) ** 2 + dy ** 2)
      const d2 = Math.sqrt(((dx - 2.2) / 2.1) ** 2 + (dy + 0.3) ** 2)
      if (d1 < 3.8) {
        if (d2 > 3.2) {
          const bright = Math.max(0, (1 - d1 / 3.8)) * 0.65
          const bg = canvas.getCell(px, py)
          const base = bg && bg.bg ? bg.bg : '#050510'
          canvas.setCell(px, py, ' ', null, bgHex(lerp(base, '#d0c8a0', bright)))
        }
      } else if (d1 < 7) {
        const h = Math.max(0, (1 - d1 / 7) ** 2 * 0.04)
        const bg = canvas.getCell(px, py)
        if (bg && bg.bg) {
          canvas.setCell(px, py, ' ', null, bgHex(lerp(bg.bg, '#807860', h)))
        }
      }
    }
  }

  for (const s of stars) {
    const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))
    const v = Math.floor(15 + s.b * tw * 70)
    const ch = s.b > 0.85 ? '✦' : s.b > 0.5 ? '•' : '·'
    canvas.setCell(s.x, s.y, ch, hex(col(v, v, v + 10)))
  }

  for (const p of groundRing) {
    const pulse = 0.3 + 0.2 * Math.sin(t * 0.4 + p.x * 0.05)
    canvas.setCell(p.x, p.y, '·', hex(lerp('#1a1008', '#3a2818', pulse)))
  }

  const centralPulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.25))
  const glowR = W * 0.28
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -Math.floor(glowR); dx <= Math.floor(glowR); dx++) {
      const px = cx + dx, py = groundY + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const d = Math.sqrt((dx / glowR * 2) ** 2 + (dy / 6) ** 2)
      if (d < 1) {
        const glow = (1 - d) ** 2 * centralPulse * 0.04
        const bg = canvas.getCell(px, py)
        if (bg && bg.bg) {
          canvas.setCell(px, py, bg.char || ' ', bg.fg, bgHex(lerp(bg.bg, '#4a2808', glow)))
        }
      }
    }
  }

  for (const stone of stones) {
    drawStone(canvas, stone, t, W, H)
  }

  for (const m of mist) {
    const totalW = W + m.w
    const mx = ((m.x + t * m.speed * 4) % totalW + totalW) % totalW - m.w / 2
    const my = m.y + Math.sin(t * 0.35 + m.ph) * 1.5
    const yI = Math.floor(my)

    for (let dx = 0; dx < m.w; dx++) {
      const px = Math.floor(mx + dx)
      if (px < 0 || px >= W) continue
      for (let dy = -1; dy <= 1; dy++) {
        const py = yI + dy
        if (py < 0 || py >= H) continue
        const fadeX = 1 - Math.abs(dx - m.w / 2) / (m.w / 2)
        const fadeY = 1 - Math.abs(dy) * 0.4
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.3 + m.ph + dx * 0.15)
        const opacity = m.opacity * fadeX * fadeY * pulse
        if (opacity < 0.02) continue
        const bg = canvas.getCell(px, py)
        if (bg && bg.bg) {
          const mistC = lerp(bg.bg, '#283040', opacity)
          const ch = opacity > 0.12 ? '░' : (bg.char || ' ')
          canvas.setCell(px, py, ch, ch === '░' ? hex(lerp(bg.bg, '#384858', opacity * 0.7)) : bg.fg, bgHex(mistC))
        }
      }
    }
  }
}

function drawStone(canvas, stone, t, W, H) {
  const { x, y, w, h, runes, tex, taper } = stone

  for (let row = 0; row < h; row++) {
    const inset = taper[row]
    const py = y + row
    if (py < 0 || py >= H) continue

    for (let c = inset; c < w - inset; c++) {
      const px = x + c
      if (px < 0 || px >= W) continue

      const rowT = row / h
      const isEdge = c === inset || c === w - inset - 1
      const edgeDark = isEdge ? 0.15 : 0

      const grain = Math.sin(row * 1.3 + c * 2.7 + tex) * 0.08
        + Math.sin(row * 3.1 + c * 0.9 + tex * 2.3) * 0.05
      const weathering = rowT < 0.15 ? (0.15 - rowT) / 0.15 * 0.08 : 0

      const baseV = 28 + grain * 50 - edgeDark * 40 - weathering * 30
      const r = Math.max(6, baseV + 4)
      const g = Math.max(6, baseV + 2)
      const b = Math.max(6, baseV)

      const sc = col(r, g, b)
      let ch = ' '
      const texV = Math.sin(row * 2.3 + c * 4.1 + tex * 3)
      if (texV > 0.75) ch = '░'
      else if (isEdge && texV > 0.3) ch = '▒'

      canvas.setCell(px, py, ch,
        ch !== ' ' ? hex(lerp(sc, '#0c0a08', 0.4)) : null,
        bgHex(sc))
    }
  }

  if (w >= 3) {
    const capL = x + taper[0]
    const capR = x + w - taper[0] - 1
    if (y - 1 >= 0 && y - 1 < H) {
      for (let px = capL; px <= capR; px++) {
        if (px >= 0 && px < W) canvas.setCell(px, y - 1, '▄', hex('#1c1814'))
      }
    }
  }

  const baseY = y + h
  if (baseY < H) {
    for (let c = -1; c <= w; c++) {
      const px = x + c
      if (px >= 0 && px < W) {
        const bg = canvas.getCell(px, baseY)
        if (bg && bg.bg) canvas.setCell(px, baseY, '░', hex(lerp('#1c1814', bg.bg, 0.6)), bg.bg)
      }
    }
  }

  for (const r of runes) {
    const rx = x + r.rx
    const ry = y + r.ry
    if (rx < 0 || rx >= W || ry < 0 || ry >= H) continue
    if (r.rx < taper[r.ry] || r.rx >= w - taper[r.ry]) continue

    const pulse = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * r.speed + r.phase))
    const runeC = lerp('#3a1800', '#ffb040', pulse * 0.85)
    const runeBg = lerp('#201a14', '#4a2c0c', pulse * 0.35)

    canvas.setCell(rx, ry, r.rune, hex(runeC), bgHex(runeBg))

    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const gx = rx + dx, gy = ry + dy
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) continue
      const cur = canvas.getCell(gx, gy)
      if (cur && cur.bg) {
        const gStr = pulse * 0.18
        canvas.setCell(gx, gy, cur.char || ' ', cur.fg, bgHex(lerp(cur.bg, '#5a3008', gStr)))
      }
    }

    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
      const gx = rx + dx, gy = ry + dy
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) continue
      const cur = canvas.getCell(gx, gy)
      if (cur && cur.bg) {
        const gStr = pulse * 0.07
        canvas.setCell(gx, gy, cur.char || ' ', cur.fg, bgHex(lerp(cur.bg, '#4a2808', gStr)))
      }
    }
  }
}
