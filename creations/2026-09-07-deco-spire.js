import { hex, bgHex, lerp, lerpMulti } from '../src/theme.js'

export const title = 'Deco Spire'
export const description = 'Gilded geometry rises into twilight — the city dreams in bronze and amber'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function c2h(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + c2h(r) + c2h(g) + c2h(b) }

const SKY = [
  '#040418', '#060824', '#0c0e38', '#141448', '#1c1a4a', '#28204a',
  '#38244a', '#4c2840', '#642c38', '#803430', '#9c4028', '#b45828',
  '#cc7020', '#dc8828',
]
const BRZ_D = '#241a0c'
const BRZ = '#382a18'
const BRZ_L = '#483820'
const GOLD = '#c8a040'
const GOLD_B = '#e8c858'

function bldgHW(t) {
  if (t < 0.03) return 0.008
  if (t < 0.06) return 0.015 + (t - 0.03) / 0.03 * 0.025
  if (t < 0.10) return 0.04 + (t - 0.06) / 0.04 * 0.03
  if (t < 0.14) return 0.07 + (t - 0.10) / 0.04 * 0.03
  if (t < 0.16) return 0.10
  if (t < 0.34) return 0.10
  if (t < 0.37) return 0.14
  if (t < 0.57) return 0.14
  if (t < 0.60) return 0.18
  if (t < 0.80) return 0.18
  if (t < 0.83) return 0.22
  return 0.22
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(907)
  const cx = Math.floor(W / 2)

  const le = [], re = []
  for (let y = 0; y < H; y++) {
    const h = bldgHW(y / H) * W
    le[y] = Math.floor(cx - h)
    re[y] = Math.ceil(cx + h)
  }

  const wins = []
  for (const [f0, f1] of [[0.17, 0.33], [0.38, 0.56], [0.61, 0.79], [0.84, 0.96]]) {
    const y0 = Math.floor(f0 * H) + 1, y1 = Math.floor(f1 * H) - 1
    for (let wy = y0; wy < y1; wy += 3) {
      for (let wx = le[wy] + 3; wx < re[wy] - 2; wx += 4) {
        wins.push({ x: wx, y: wy, on: rng() > 0.3, w: rng(), ph: rng() * TAU, sp: 0.15 + rng() * 0.5 })
      }
    }
  }

  const blds = []
  for (let i = 0; i < 28; i++) {
    const x = Math.floor(rng() * W), bw = 2 + Math.floor(rng() * 8)
    const top = H - Math.floor(H * (0.08 + rng() * 0.25))
    const sy = Math.min(top, H - 1)
    if (x + bw < le[sy] - 3 || x > re[sy] + 3)
      blds.push({ x, w: bw, top, d: 0.12 + rng() * 0.28 })
  }
  blds.sort((a, b) => a.d - b.d)

  const stars = []
  for (let i = 0; i < 100; i++) {
    const sx = Math.floor(rng() * W), sy = Math.floor(rng() * H * 0.82)
    if (sx < le[sy] - 1 || sx > re[sy] + 1) {
      let ok = true
      for (const b of blds) if (sy >= b.top && sx >= b.x && sx < b.x + b.w) { ok = false; break }
      if (ok) stars.push({ x: sx, y: sy, b: 0.15 + rng() * 0.85, ph: rng() * TAU, sp: 0.3 + rng() * 2 })
    }
  }

  return { cx, le, re, wins, blds, stars }
}

function draw(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  const { cx, le, re, wins, blds, stars } = state

  for (let y = 0; y < H; y++) {
    const c = lerpMulti(SKY, y / H)
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, bgHex(c))
  }

  for (const s of stars) {
    const f = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))
    const v = Math.floor(18 + s.b * f * 58)
    canvas.setCell(s.x, s.y, s.b > 0.72 ? '✦' : '·', hex(col(v, v, v + 10)))
  }

  const mX = Math.floor(W * 0.18), mY = Math.floor(H * 0.11)
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const px = mX + dx, py = mY + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const d1 = (dx / 2) ** 2 + dy ** 2
      const d2 = ((dx - 2) / 2) ** 2 + (dy + 0.3) ** 2
      if (d1 < 8 && d2 > 6.5)
        canvas.setCell(px, py, ' ', null, bgHex(lerp('#a09870', '#e8e0c0', (1 - d1 / 8) * 0.6)))
    }
  }

  for (const b of blds) {
    for (let y = b.top; y < H; y++) {
      for (let dx = 0; dx < b.w; dx++) {
        const x = b.x + dx
        if (x < 0 || x >= W || (x >= le[y] && x < re[y])) continue
        canvas.setCell(x, y, ' ', null, bgHex(lerp(lerpMulti(SKY, y / H), '#000000', b.d)))
      }
    }
  }

  const glowR = H * 0.38
  for (let y = Math.floor(H * 0.72); y < H; y++) {
    const sc = lerpMulti(SKY, y / H)
    for (let x = 0; x < W; x++) {
      if (x >= le[y] && x < re[y]) continue
      const dd = Math.sqrt((x - cx) ** 2 + (y - H) ** 2)
      if (dd < glowR) {
        const g = (1 - dd / glowR) ** 2 * 0.06
        canvas.setCell(x, y, ' ', null, bgHex(lerp(sc, '#e8a040', g)))
      }
    }
  }

  for (let y = 0; y < H; y++) {
    const l = le[y], r = re[y]
    if (l >= r) continue
    const bw = r - l
    for (let x = l; x < r; x++) {
      const dE = Math.min(x - l, r - 1 - x)
      const fl = Math.sin(x * 0.85) * 0.03 + Math.sin(x * 2.1) * 0.018
      let c = lerp(BRZ, BRZ_L, 0.4 + fl)
      if (dE === 0) c = BRZ_D
      else if (dE === 1) c = lerp(BRZ_D, c, 0.5)
      c = lerp(c, BRZ_L, Math.max(0, (0.35 - (x - l) / bw * 0.2) * 0.2))
      canvas.setCell(x, y, ' ', null, bgHex(c))
    }
  }

  const cr0 = Math.floor(H * 0.07), cr1 = Math.floor(H * 0.14)
  for (let y = cr0; y < cr1; y++) {
    const l = le[y], r = re[y]
    if (l >= r) continue
    for (let x = l; x < r; x++) {
      const dx = (x - cx) / 2
      const dy = y - cr1
      const angle = Math.atan2(dy, dx)
      const ray = Math.sin(angle * 12)
      if (ray > 0.15) {
        const dist = Math.sqrt(dx * dx + dy * dy)
        const bright = Math.max(0, 1 - dist / ((cr1 - cr0) * 1.2)) * 0.50
        canvas.setCell(x, y, ' ', null, bgHex(lerp(BRZ, GOLD, bright)))
      }
    }
  }

  for (const [f, h, s] of [[0.14,1,'g'],[0.155,1,'g'],[0.34,3,'c'],[0.37,1,'g'],[0.57,3,'c'],[0.60,1,'g'],[0.80,3,'c'],[0.83,1,'g']]) {
    for (let dy = 0; dy < h; dy++) {
      const y = Math.floor(f * H) + dy
      if (y >= H) continue
      const l = le[y], r = re[y]
      for (let x = l; x < r; x++) {
        if (s === 'g') {
          canvas.setCell(x, y, '─', hex(GOLD), bgHex(lerp(BRZ, GOLD, 0.10)))
        } else {
          const z = (x - l + dy * 2) % 6
          canvas.setCell(x, y,
            z < 3 ? (dy === 1 ? '◆' : '─') : ' ',
            hex(z < 3 ? (dy === 1 ? GOLD_B : GOLD) : BRZ),
            bgHex(lerp(BRZ, GOLD, z < 3 ? 0.08 : 0)))
        }
      }
    }
  }

  for (const f of [0.37, 0.60, 0.83]) {
    const y = Math.floor(f * H)
    if (y < 1 || y >= H) continue
    const lA = le[y - 1], rA = re[y - 1]
    if (lA > le[y] && lA - 1 >= 0) canvas.setCell(lA - 1, y, '◆', hex(GOLD_B))
    if (rA < re[y] && rA < W) canvas.setCell(rA, y, '◆', hex(GOLD_B))
  }

  for (const [f0, f1] of [[0.17, 0.33], [0.38, 0.56], [0.61, 0.79], [0.84, 0.96]]) {
    for (let y = Math.floor(f0 * H); y < Math.floor(f1 * H); y++) {
      const l = le[y], r = re[y], bw = r - l
      if (bw < 8) continue
      for (const fr of [0.25, 0.5, 0.75]) {
        const px = Math.floor(l + bw * fr)
        if (px > l + 1 && px < r - 1) canvas.setCell(px, y, '│', hex(lerp(BRZ_D, GOLD, 0.18)))
      }
    }
  }

  for (const w of wins) {
    if (w.x < 0 || w.x >= W || w.y < 0 || w.y >= H) continue
    if (w.x <= le[w.y] || w.x >= re[w.y] - 1) continue
    if (w.on) {
      const fl = 0.55 + 0.45 * Math.sin(t * w.sp + w.ph)
      canvas.setCell(w.x, w.y, ' ', null, bgHex(lerp('#100a04', lerp('#ffcc28', '#ffa818', w.w), fl * 0.75)))
    } else {
      canvas.setCell(w.x, w.y, ' ', null, bgHex('#060810'))
    }
  }

  for (let y = Math.floor(H * 0.03); y < Math.floor(H * 0.07); y++) {
    if (cx >= 0 && cx < W) canvas.setCell(cx, y, '│', hex('#887040'))
  }

  const bY = Math.floor(H * 0.02)
  if (bY >= 0 && bY < H) {
    const p = 0.5 + 0.5 * Math.sin(t * 2.5)
    if (p > 0.55) {
      const i = (p - 0.55) / 0.45
      canvas.setCell(cx, bY, '◆', hex(col(Math.floor(100 + 155 * i), 15, 10)))
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) {
        const gx = cx + dx, gy = bY + dy
        if (gx >= 0 && gx < W && gy >= 0 && gy < H)
          canvas.setCell(gx, gy, '·', hex(col(Math.floor(80 * i), 10, 8)))
      }
    }
  }

  const eY = H - 3, eHW = 3
  if (eY > 0 && eY < H) {
    for (let dx = -eHW + 1; dx < eHW; dx++) {
      const x = cx + dx
      if (x >= le[eY] && x < re[eY]) canvas.setCell(x, eY, '─', hex(GOLD))
    }
    if (cx - eHW >= le[eY]) canvas.setCell(cx - eHW, eY, '╭', hex(GOLD))
    if (cx + eHW < re[eY]) canvas.setCell(cx + eHW, eY, '╮', hex(GOLD))
    for (let dy = 1; dy < 3; dy++) {
      const y = eY + dy
      if (y >= H) continue
      if (cx - eHW >= le[y]) canvas.setCell(cx - eHW, y, '│', hex(GOLD))
      if (cx + eHW < re[y]) canvas.setCell(cx + eHW, y, '│', hex(GOLD))
      for (let dx = -eHW + 1; dx < eHW; dx++) {
        const x = cx + dx
        if (x >= le[y] && x < re[y])
          canvas.setCell(x, y, ' ', null, bgHex(lerp('#201808', '#e8a830', (1 - Math.abs(dx) / eHW) * 0.3)))
      }
    }
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
