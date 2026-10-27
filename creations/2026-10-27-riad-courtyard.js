import { hex, bgHex, BLOCK } from '../src/theme.js'

export const title = 'Riad Courtyard'
export const description =
  'Through the horseshoe arch, zellige stars keep watch over the fountain’s quiet song'
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

const P = {
  skyA: '#040610', skyC: '#0c1830',
  wallD: '#2a180c', wallM: '#4a3018', wallL: '#6a4828', wallH: '#8a6038',
  zNavy: '#0a1e48', zBlue: '#1a3a70', zTeal: '#186858',
  zGold: '#c09020', zCream: '#d0c8b0', zTerra: '#a04020', zDeep: '#081838',
  flrD: '#1e1208', flrM: '#3a2818',
  wtrD: '#081828', wtrM: '#1a3850', wtrL: '#2a5a78', wtrS: '#80b0d0',
  lanW: '#e8a030', lanH: '#f0c060',
  moon: '#c0d0e0',
  grn: ['#1a5a2a', '#287038', '#186020'],
  orange: '#d08020',
}

const ZB = {
  w: 4, h: 3,
  g: [[0, 1, 1, 0], [1, 2, 2, 1], [0, 1, 1, 0]],
  ch: [' ', '◆', '✦'],
  fg: [P.zNavy, P.zBlue, P.zGold],
  bg: [P.zNavy, P.zTeal, P.zDeep],
}
const ZP = {
  w: 6, h: 6,
  g: [
    [0, 0, 1, 1, 0, 0],
    [0, 1, 2, 2, 1, 0],
    [1, 2, 3, 3, 2, 1],
    [1, 2, 3, 3, 2, 1],
    [0, 1, 2, 2, 1, 0],
    [0, 0, 1, 1, 0, 0],
  ],
  ch: [' ', '◆', '◇', '✦'],
  fg: [P.zNavy, P.zTeal, P.zBlue, P.zGold],
  bg: [P.zNavy, P.zBlue, P.zTeal, P.zDeep],
}

export function setup(canvas, data) {
  const W = canvas.width, H = canvas.height, rng = srand(314159)
  const stars = Array.from({ length: 80 }, () => ({
    x: rng(), y: rng(), b: 0.3 + rng() * 0.7,
    sp: 0.8 + rng() * 2.5, ph: rng() * TAU,
    ch: rng() > 0.7 ? '✦' : rng() > 0.4 ? '·' : '∗',
  }))

  const cx = Math.floor(W / 2)
  const hW = Math.floor(W * 0.20)
  const aTop = Math.floor(H * 0.22)
  const aBot = Math.floor(H * 0.66)
  const spY = Math.floor(H * 0.40)
  const aR = hW * 1.12
  const aRC = Math.ceil(aR)
  const excess = aRC - hW
  const skyH = Math.floor(H * 0.17)
  const wBot = Math.floor(H * 0.70)

  const aM = Array.from({ length: H }, () => new Uint8Array(W))
  for (let y = aTop; y <= aBot; y++) {
    for (let x = Math.max(0, cx - aRC - 2); x <= Math.min(W - 1, cx + aRC + 2); x++) {
      if (y >= spY) {
        const fade = Math.min(excess, y - spY)
        if (Math.abs(x - cx) < aRC - fade) aM[y][x] = 1
      } else {
        const dx = x - cx, dy = (y - spY) * 1.15
        if (Math.sqrt(dx * dx + dy * dy) < aR) aM[y][x] = 1
      }
    }
  }

  const bW = 3
  const bM = Array.from({ length: H }, () => new Uint8Array(W))
  const by0 = Math.max(0, aTop - bW - 2)
  const by1 = Math.min(H - 1, aBot + bW + 2)
  const bx0 = Math.max(0, cx - aRC - bW - 4)
  const bx1 = Math.min(W - 1, cx + aRC + bW + 4)
  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      if (aM[y][x]) continue
      let near = false
      scan: for (let dy = -bW; dy <= bW; dy++) {
        for (let dx = -bW; dx <= bW; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < H && nx >= 0 && nx < W && aM[ny][nx]) {
            near = true; break scan
          }
        }
      }
      if (near) bM[y][x] = 1
    }
  }

  return { stars, aM, bM, cx, hW, aTop, aBot, spY, skyH, wBot, by0, by1, bx0, bx1, t: 0 }
}

function zt(canvas, x, y, z) {
  const mx = ((x % z.w) + z.w) % z.w, my = ((y % z.h) + z.h) % z.h
  const p = z.g[my][mx]
  canvas.setCell(x, y, z.ch[p], hex(z.fg[p]), bgHex(z.bg[p]))
}

function scene(canvas, s) {
  const W = canvas.width, H = canvas.height
  const { cx, hW, aTop, aBot, spY, skyH, wBot, aM, bM, by0, by1, bx0, bx1 } = s
  const wTop = skyH - 1

  for (let y = 0; y < skyH; y++) {
    const t = y / skyH
    const bg = mix(P.skyA, P.skyC, t)
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, bgHex(bg))
  }
  for (const st of s.stars) {
    const sx = Math.floor(st.x * W), sy = Math.floor(st.y * skyH)
    if (sx < 4 || sx >= W - 4 || sy < 0 || sy >= skyH) continue
    const tw = 0.4 + 0.6 * Math.sin(s.t * st.sp + st.ph)
    canvas.setCell(sx, sy, st.ch, hex(mix('#202030', '#f0e8c0', st.b * tw)))
  }

  for (let y = wTop; y < wBot; y++) {
    const t = (y - wTop) / (wBot - wTop)
    const bg = mix(P.wallM, P.wallD, t * 0.5)
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, bgHex(bg))
  }
  for (let x = 0; x < W; x++) {
    if (x % 8 < 4) {
      canvas.setCell(x, wTop, BLOCK.full, hex(P.wallL), bgHex(mix(P.skyC, P.wallM, 0.5)))
      if (wTop + 1 < wBot)
        canvas.setCell(x, wTop + 1, BLOCK.lower, hex(P.wallH), bgHex(P.wallM))
    } else {
      canvas.setCell(x, wTop, BLOCK.lower, hex(P.wallM), bgHex(P.skyC))
    }
  }
  if (wTop + 2 < wBot) {
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, wTop + 2, x % 2 === 0 ? '◆' : '◇',
        hex(x % 4 < 2 ? P.zTeal : P.zGold), bgHex(P.wallD))
    }
  }

  for (let y = aTop; y <= aBot; y++) {
    for (let x = 0; x < W; x++) {
      if (!aM[y][x]) continue
      const yt = (y - aTop) / (aBot - aTop)
      canvas.setCell(x, y, ' ', null, bgHex(mix('#061020', '#0a1830', yt)))
    }
  }

  const mX = cx + Math.floor(hW * 0.3), mY = aTop + 5
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const d1 = Math.sqrt((dx * 0.55) ** 2 + dy ** 2)
      const d2 = Math.sqrt(((dx - 1.2) * 0.55) ** 2 + dy ** 2)
      const px = mX + dx, py = mY + dy
      if (d1 < 1.8 && d2 > 1.3 && px >= 0 && px < W && py >= 0 && py < H && aM[py] && aM[py][px])
        canvas.setCell(px, py, BLOCK.full, hex(mix('#8090a0', P.moon, 1 - d1 * 0.3)))
    }
  }

  for (const st of s.stars) {
    const sx = Math.floor(st.x * hW * 1.2 + cx - hW * 0.6)
    const range = Math.max(1, spY - aTop - 4)
    const sy = Math.floor(st.y * range + aTop + 2)
    if (sx >= 0 && sx < W && sy >= 0 && sy < H && aM[sy] && aM[sy][sx]) {
      const tw = 0.3 + 0.7 * Math.sin(s.t * st.sp + st.ph + 2)
      canvas.setCell(sx, sy, '·', hex(mix('#0a1830', '#90a8c0', st.b * tw * 0.5)))
    }
  }

  const gR = srand(42)
  for (let i = 0; i < 5; i++) {
    const gx = cx + Math.floor((gR() - 0.5) * hW * 1.4)
    const gh = 6 + Math.floor(gR() * 10)
    const gy = aBot - 1
    for (let dy = 0; dy < gh; dy++) {
      const py = gy - dy
      if (py < aTop || py >= H || gx < 0 || gx >= W) continue
      if (!aM[py] || !aM[py][gx]) continue
      const t = dy / gh
      canvas.setCell(gx, py, BLOCK.dark, hex(mix('#081018', '#0c1a20', t)))
      if (t < 0.5) {
        if (gx + 1 < W && aM[py][gx + 1])
          canvas.setCell(gx + 1, py, BLOCK.light, hex('#081018'))
        if (gx - 1 >= 0 && aM[py][gx - 1])
          canvas.setCell(gx - 1, py, BLOCK.light, hex('#081018'))
      }
    }
  }

  const dlx = cx, dly = aBot - 10
  if (dly >= aTop && dly < H && aM[dly] && aM[dly][dlx]) {
    const gl = 0.5 + 0.5 * Math.sin(s.t * 1.5)
    canvas.setCell(dlx, dly, '●', hex(mix('#604020', '#f0a040', gl)))
  }

  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      if (bM[y] && bM[y][x]) zt(canvas, x, y, ZB)
    }
  }
  if (aTop - 4 >= 0) {
    canvas.setCell(cx, aTop - 4, '✦', hex(P.zGold), bgHex(P.zNavy))
    if (cx - 1 >= 0) canvas.setCell(cx - 1, aTop - 4, '◆', hex(P.zTeal), bgHex(P.zNavy))
    if (cx + 1 < W) canvas.setCell(cx + 1, aTop - 4, '◆', hex(P.zTeal), bgHex(P.zNavy))
  }

  const pW = Math.floor(W * 0.13), panH = Math.floor(H * 0.20)
  const pY = Math.floor(H * 0.32)
  panel(canvas, Math.floor(W * 0.05), pY, pW, panH)
  panel(canvas, W - Math.floor(W * 0.05) - pW, pY, pW, panH)

  for (let y = wBot; y < H; y++) {
    const t = (y - wBot) / Math.max(1, H - wBot)
    for (let x = 0; x < W; x++) {
      const ck = (Math.floor(x / 6) + Math.floor((y - wBot) / 3)) % 2
      canvas.setCell(x, y, ' ', null, bgHex(mix(ck ? P.flrD : P.flrM, '#0a0604', t * 0.3)))
    }
  }

  fountain(canvas, cx, Math.floor(H * 0.80), s)

  citrus(canvas, Math.floor(W * 0.16), Math.floor(H * 0.73))
  citrus(canvas, Math.floor(W * 0.84), Math.floor(H * 0.73))

  lantern(canvas, Math.floor(W * 0.22), Math.floor(H * 0.30), s)
  lantern(canvas, Math.floor(W * 0.78), Math.floor(H * 0.30), s)
}

function panel(canvas, px, py, pw, ph) {
  const W = canvas.width, H = canvas.height
  for (let y = py; y < py + ph; y++) {
    for (let x = px; x < px + pw; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue
      const dx = x - px, dy = y - py
      if (dx === 0 || dx === pw - 1 || dy === 0 || dy === ph - 1) {
        let ch = (dy === 0 || dy === ph - 1) ? '─' : '│'
        if (dx === 0 && dy === 0) ch = '╭'
        else if (dx === pw - 1 && dy === 0) ch = '╮'
        else if (dx === 0 && dy === ph - 1) ch = '╰'
        else if (dx === pw - 1 && dy === ph - 1) ch = '╯'
        canvas.setCell(x, y, ch, hex(P.zGold), bgHex(P.wallD))
      } else {
        zt(canvas, x, y, ZP)
      }
    }
  }
}

function fountain(canvas, cx, cy, s) {
  const W = canvas.width, H = canvas.height, rx = 11, ry = 3
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx / rx) ** 2 + (dy / ry) ** 2 > 1) continue
      const px = cx + dx, py = cy + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const dist = Math.sqrt(dx * dx + (dy * 3) ** 2)
      const rip = Math.sin(dist * 0.7 - s.t * 2.5) * 0.5 + 0.5
      canvas.setCell(px, py, rip > 0.6 ? '~' : rip > 0.3 ? '≈' : ' ',
        hex(mix(P.wtrL, P.wtrS, rip * 0.4)), bgHex(mix(P.wtrD, P.wtrM, rip * 0.5)))
    }
  }
  for (let a = 0; a < TAU; a += 0.1) {
    const px = cx + Math.round(Math.cos(a) * (rx + 1))
    const py = cy + Math.round(Math.sin(a) * (ry + 1))
    if (px >= 0 && px < W && py >= 0 && py < H)
      canvas.setCell(px, py, '·', hex(P.zCream))
  }
  for (let dy = -ry - 3; dy < -ry; dy++) {
    if (cy + dy >= 0 && cy + dy < H) canvas.setCell(cx, cy + dy, '║', hex(P.zCream))
  }
  if (cy - ry - 3 >= 0 && cy - ry - 3 < H) canvas.setCell(cx, cy - ry - 3, '◆', hex(P.zGold))
  const dPhase = ((s.t * 2) % 1)
  const dY = cy - ry + Math.floor(dPhase * Math.max(1, ry))
  if (dY >= 0 && dY < H) canvas.setCell(cx, dY, '·', hex(P.wtrS))
}

function citrus(canvas, px, py) {
  const W = canvas.width, H = canvas.height, rng = srand(px * 17 + py * 31)
  for (let dy = 0; dy < 3; dy++) {
    const w = 3 - Math.floor(dy * 0.8)
    for (let dx = -w; dx <= w; dx++) {
      const x = px + dx, y = py + dy
      if (x >= 0 && x < W && y >= 0 && y < H) canvas.setCell(x, y, BLOCK.full, hex(P.zTerra))
    }
  }
  for (let dy = -4; dy <= -1; dy++) {
    const maxW = dy === -4 ? 1 : dy === -3 ? 2 : 3
    for (let dx = -maxW; dx <= maxW; dx++) {
      const x = px + dx, y = py + dy
      if (x >= 0 && x < W && y >= 0 && y < H) {
        if (rng() > 0.78) canvas.setCell(x, y, '●', hex(P.orange))
        else canvas.setCell(x, y, '✿', hex(P.grn[Math.floor(rng() * 3)]))
      }
    }
  }
}

function lantern(canvas, lx, ly, s) {
  const H = canvas.height
  const fl = 0.7 + 0.3 * Math.sin(s.t * 3 + lx * 0.1)
  const col = mix(P.lanW, P.lanH, fl)
  if (ly - 2 >= 0) canvas.setCell(lx, ly - 2, '╥', hex(P.wallH))
  if (ly - 1 >= 0) canvas.setCell(lx, ly - 1, '◈', hex(col))
  if (ly >= 0 && ly < H) canvas.setCell(lx, ly, '◈', hex(col))
  if (ly + 1 < H) canvas.setCell(lx, ly + 1, '╨', hex(P.wallH))
}

export function render(canvas, data, state) { scene(canvas, state) }
export function update(canvas, data, frame, state) {
  state.t = frame.elapsed
  scene(canvas, state)
}
