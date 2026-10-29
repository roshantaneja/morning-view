import { BLOCK } from '../src/theme.js'

export const title = 'Midnight Piano'
export const description =
  'In the stillness between midnight and dawn, the keys remember every song they have ever known'
export const fps = 2

const TAU = Math.PI * 2
const NOTE_CHARS = ['♪', '♫', '♩', '♬']
const NOTE_COLORS = ['#d89030', '#e8a840', '#c07820', '#e0b848', '#d09028']

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

function inArch(x, y, cx, hw, archCY, archVR, bot) {
  if (x < cx - hw || x > cx + hw || y > bot) return false
  if (y >= archCY) return true
  if (archVR <= 0) return false
  const dx = (x - cx) / hw, dy = (y - archCY) / archVR
  return dx * dx + dy * dy <= 1
}

export function setup(canvas, data) {
  const rng = srand(20261029)
  const W = canvas.width, H = canvas.height

  const stars = Array.from({ length: 70 }, () => ({
    rx: rng(), ry: rng(), b: 0.15 + rng() * 0.85,
    sp: 0.2 + rng() * 1.2, ph: rng() * TAU,
  }))

  const notes = Array.from({ length: 14 }, () => ({
    active: false, x: 0, y: 0,
    char: NOTE_CHARS[Math.floor(rng() * 4)],
    ci: Math.floor(rng() * NOTE_COLORS.length),
    spd: 0.25 + rng() * 0.35, drift: (rng() - 0.5) * 0.2,
    sway: 1 + rng() * 2, ph: rng() * TAU,
    life: 0, maxLife: 28 + rng() * 35,
    timer: Math.floor(rng() * 30),
  }))

  const sCX = Math.floor(W * 0.48), sHW = Math.floor(W * 0.18)
  const sY = Math.floor(H * 0.49)
  for (let i = 0; i < 4; i++) {
    const n = notes[i]
    n.active = true
    n.x = sCX + (rng() - 0.5) * sHW
    n.y = sY - rng() * Math.floor(H * 0.2)
    n.life = Math.floor(rng() * 15)
  }

  const motes = Array.from({ length: 30 }, () => ({
    x: rng(), y: 0.45 + rng() * 0.5,
    vy: -(0.001 + rng() * 0.004), vx: (rng() - 0.5) * 0.002,
    b: 0.1 + rng() * 0.3, ph: rng() * TAU, sp: 0.3 + rng() * 0.6,
  }))

  return { stars, notes, motes, t: 0 }
}

export function render(canvas, data, state) { scene(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  state.t = frame.elapsed
  const W = canvas.width, H = canvas.height
  const sCX = Math.floor(W * 0.48), sHW = Math.floor(W * 0.18)
  const sY = Math.floor(H * 0.49)

  for (const n of state.notes) {
    if (!n.active) {
      if (--n.timer <= 0) {
        n.active = true; n.life = 0
        n.x = sCX + (Math.random() - 0.5) * sHW
        n.y = sY
      }
    } else {
      n.life++; n.y -= n.spd
      n.x += n.drift + Math.sin(state.t * n.sway + n.ph) * 0.2
      if (n.life > n.maxLife || n.y < 2) {
        n.active = false; n.timer = 6 + Math.floor(Math.random() * 20)
      }
    }
  }
  for (const m of state.motes) {
    m.y += m.vy; m.x += m.vx
    if (m.y < 0.35) { m.y = 0.95; m.x = Math.random() }
    if (m.x < 0 || m.x > 1) m.vx *= -1
  }
  scene(canvas, state, state.t)
}

function scene(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  const floorY = Math.floor(H * 0.62)

  // --- Background: dark room gradient ---
  for (let y = 0; y < H; y++) {
    let bg
    if (y < floorY) {
      bg = mix('#050508', '#0e0e18', (y / floorY) * 0.4)
    } else {
      bg = mix('#0a0806', '#1c1610', ((y - floorY) / (H - floorY)) * 0.5)
    }
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, bg)
  }

  // Baseboard
  for (let x = 0; x < W; x++) {
    canvas.setCell(x, floorY, BLOCK.lower, '#101018', mix('#050508', '#0e0e18', 0.4))
  }

  // --- Arched window ---
  const wCX = Math.floor(W * 0.5), wHW = Math.floor(W * 0.18)
  const wTop = Math.floor(H * 0.05), wBot = Math.floor(H * 0.44)
  const archVR = Math.floor(wHW * 0.7)
  const archCY = wTop + archVR

  // Sky fill
  for (let y = wTop; y <= wBot; y++) {
    for (let x = wCX - wHW; x <= wCX + wHW; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue
      if (!inArch(x, y, wCX, wHW, archCY, archVR, wBot)) continue
      const st = (y - wTop) / (wBot - wTop)
      canvas.setCell(x, y, ' ', null, mix('#020408', '#0a1830', st * 0.5))
    }
  }

  // Stars
  for (const s of state.stars) {
    const sx = Math.floor(wCX - wHW + s.rx * wHW * 2)
    const sy = Math.floor(wTop + s.ry * (wBot - wTop))
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue
    if (!inArch(sx, sy, wCX, wHW, archCY, archVR, wBot)) continue
    const twk = s.b * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))
    if (twk < 0.2) continue
    const bg = mix('#020408', '#0a1830', (sy - wTop) / (wBot - wTop) * 0.5)
    canvas.setCell(sx, sy, twk > 0.6 ? '✦' : '·', mix('#061020', '#b0b8d0', twk), bg)
  }

  // Moon
  const mCX = wCX + Math.floor(wHW * 0.35)
  const mCY = Math.floor(wTop + (wBot - wTop) * 0.2)
  const mR = Math.max(2, Math.floor(wHW * 0.22))

  // Moon glow
  for (let dy = -mR * 3; dy <= mR * 3; dy++) {
    for (let dx = -mR * 3; dx <= mR * 3; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d <= mR || d > mR * 2.5) continue
      const mx = mCX + dx, my = mCY + dy
      if (mx < 0 || mx >= W || my < 0 || my >= H) continue
      if (!inArch(mx, my, wCX, wHW, archCY, archVR, wBot)) continue
      const i = Math.max(0, 1 - (d - mR) / (mR * 1.5))
      const st = Math.max(0, (my - wTop) / (wBot - wTop))
      const bg = mix(mix('#020408', '#0a1830', st * 0.5), '#182038', i * i * 0.5)
      canvas.setCell(mx, my, ' ', null, bg)
    }
  }

  // Moon face
  for (let dy = -mR; dy <= mR; dy++) {
    for (let dx = -mR; dx <= mR; dx++) {
      if (dx * dx + dy * dy > mR * mR) continue
      const mx = mCX + dx, my = mCY + dy
      if (mx < 0 || mx >= W || my < 0 || my >= H) continue
      const e = Math.sqrt(dx * dx + dy * dy) / mR
      canvas.setCell(mx, my, ' ', null, mix('#c8d0e0', '#8898b0', e * e * 0.8))
    }
  }

  // Window frame
  drawFrame(canvas, wCX, wHW, wBot, archCY, archVR, W, H)

  // --- Moonlight beam on floor ---
  for (let y = wBot + 3; y < H; y++) {
    const p = (y - wBot - 3) / (H - wBot - 3)
    const bcx = wCX + p * W * 0.02
    const bw = wHW * (1 + p * 1.8)
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x - bcx) / bw
      if (dx >= 1) continue
      const i = (1 - dx * dx) * (1 - p * 0.4) * 0.3
      if (i < 0.03) continue
      const base = y >= floorY
        ? mix('#0a0806', '#1c1610', ((y - floorY) / (H - floorY)) * 0.5)
        : mix('#050508', '#0e0e18', (y / floorY) * 0.4)
      canvas.setCell(x, y, ' ', null, mix(base, '#141e30', i))
    }
  }

  // --- Grand piano ---
  drawPiano(canvas, t, W, H)

  // --- Dust motes in moonlight ---
  for (const m of state.motes) {
    const mx = Math.floor(m.x * W), my = Math.floor(m.y * H)
    if (mx < 3 || mx >= W - 3 || my <= wBot || my >= H - 3) continue
    const p = (my - wBot) / (H - wBot)
    const bcx = wCX + p * W * 0.02
    const bw = wHW * (1 + p * 1.8)
    if (Math.abs(mx - bcx) / bw > 0.7) continue
    const br = m.b * (0.5 + 0.5 * Math.sin(t * m.sp + m.ph))
    if (br < 0.15) continue
    canvas.setCell(mx, my, '·', mix('#404858', '#808898', br))
  }

  // --- Floating musical notes ---
  for (const n of state.notes) {
    if (!n.active) continue
    const nx = Math.floor(n.x), ny = Math.floor(n.y)
    if (nx < 3 || nx >= W - 3 || ny < 2 || ny >= H - 3) continue
    const fadeIn = Math.min(1, n.life / 4)
    const fadeOut = n.life > n.maxLife - 8 ? Math.max(0, (n.maxLife - n.life) / 8) : 1
    const a = fadeIn * fadeOut
    if (a < 0.1) continue
    canvas.setCell(nx, ny, n.char, mix('#201008', NOTE_COLORS[n.ci], a))
  }
}

function drawFrame(canvas, cx, hw, wBot, archCY, archVR, W, H) {
  const FG = '#14141c', FH = '#22222c', FB = '#2c2c38'

  // Side pillars (2 cells wide on each side)
  for (let y = archCY; y <= wBot; y++) {
    if (cx - hw - 1 >= 0) canvas.setCell(cx - hw - 1, y, '▐', FH, FG)
    if (cx - hw - 2 >= 0) canvas.setCell(cx - hw - 2, y, ' ', null, FG)
    if (cx + hw + 1 < W) canvas.setCell(cx + hw + 1, y, '▌', FH, FG)
    if (cx + hw + 2 < W) canvas.setCell(cx + hw + 2, y, ' ', null, FG)
  }

  // Sill
  for (let x = cx - hw - 2; x <= cx + hw + 2; x++) {
    if (x < 0 || x >= W) continue
    if (wBot + 1 < H) canvas.setCell(x, wBot + 1, '▄', FB, FG)
    if (wBot + 2 < H) canvas.setCell(x, wBot + 2, ' ', null, FG)
  }

  // Arch curve (two-pixel-thick frame)
  for (let a = 0; a <= Math.PI; a += 0.008) {
    const ca = Math.cos(a), sa = Math.sin(a)
    for (let r = 0; r < 2; r++) {
      const ax = cx + Math.round(ca * (hw + 1 + r))
      const ay = archCY - Math.round(sa * (archVR + r))
      if (ax >= 0 && ax < W && ay >= 0 && ay < H) {
        canvas.setCell(ax, ay, ' ', null, FG)
      }
    }
  }

  // Mullions (vertical center + horizontal cross)
  for (let y = archCY; y <= wBot; y++) {
    canvas.setCell(cx, y, '│', FB, FG)
  }
  const crossY = Math.floor((archCY + wBot) / 2)
  for (let x = cx - hw; x <= cx + hw; x++) {
    if (x < 0 || x >= W) continue
    if (inArch(x, crossY, cx, hw, archCY, archVR, wBot)) {
      canvas.setCell(x, crossY, '─', FB, FG)
    }
  }
  canvas.setCell(cx, crossY, '┼', FB, FG)
}

function drawPiano(canvas, t, W, H) {
  const cx = Math.floor(W * 0.48)
  const pw = Math.floor(W * 0.52)
  const pL = cx - Math.floor(pw / 2), pR = pL + pw
  const bTop = Math.floor(H * 0.52), bBot = Math.floor(H * 0.64)
  const keyY = Math.floor(H * 0.57)
  const lidTip = Math.floor(H * 0.36)

  const PD = '#050508', PE = '#161620', PS = '#20202c'

  // --- Open lid ---
  for (let y = lidTip; y <= bTop; y++) {
    const lt = (y - lidTip) / Math.max(1, bTop - lidTip)
    const lx = Math.floor(pL + pw * 0.12 + (1 - lt) * pw * 0.2)
    const rx = Math.floor(pR - pw * 0.04 - (1 - lt) * pw * 0.04)
    for (let x = lx; x <= rx; x++) {
      if (x < 0 || x >= W) continue
      const e = Math.min(x - lx, rx - x) / Math.max(1, rx - lx)
      canvas.setCell(x, y, ' ', null, mix(PD, PE, e * 0.3 + (1 - lt) * 0.06))
    }
    if (lx >= 0 && lx < W) canvas.setCell(lx, y, '▌', PE)
    if (rx >= 0 && rx < W) canvas.setCell(rx, y, '▐', PE)
  }

  // Lid prop stick
  const propX = Math.floor(cx + pw * 0.12)
  for (let y = Math.floor(lidTip + (bTop - lidTip) * 0.35); y <= bTop; y++) {
    if (propX >= 0 && propX < W) canvas.setCell(propX, y, '│', PS)
  }

  // --- Piano body ---
  for (let y = bTop; y <= bBot; y++) {
    for (let x = pL; x <= pR; x++) {
      if (x >= 0 && x < W) canvas.setCell(x, y, ' ', null, PD)
    }
    if (pL >= 0 && pL < W) canvas.setCell(pL, y, '▌', PE, PD)
    if (pR >= 0 && pR < W) canvas.setCell(pR, y, '▐', PE, PD)
  }
  for (let x = pL; x <= pR; x++) {
    if (x >= 0 && x < W) canvas.setCell(x, bTop, '▀', PE, PD)
  }

  // --- Keyboard ---
  const kL = pL + 3, kR = pR - 3
  const nWK = Math.floor((kR - kL) / 2)
  if (nWK > 0 && keyY < H) {
    const kw = (kR - kL) / nWK
    const pk = [
      Math.floor(((Math.sin(t * 0.7) + 1) / 2) * nWK),
      Math.floor(((Math.sin(t * 0.45 + 1.8) + 1) / 2) * nWK),
      Math.floor(((Math.sin(t * 0.3 + 3.5) + 1) / 2) * nWK),
    ]

    // White keys
    for (let i = 0; i < nWK; i++) {
      const x0 = Math.floor(kL + i * kw)
      const x1 = Math.floor(kL + (i + 1) * kw) - 1
      const pressed = pk.includes(i)
      const kc = pressed ? '#d8d0c8' : '#c0b8b0'
      for (let x = x0; x <= x1; x++) {
        if (x >= 0 && x < W) canvas.setCell(x, keyY, BLOCK.upper, kc, PD)
      }
    }

    // Black keys
    const bkPat = [1, 1, 0, 1, 1, 1, 0]
    if (keyY - 1 >= 0) {
      for (let i = 0; i < nWK - 1; i++) {
        if (!bkPat[i % 7]) continue
        const bx0 = Math.floor(kL + (i + 0.6) * kw)
        const bx1 = Math.floor(kL + (i + 1.4) * kw)
        for (let x = bx0; x <= bx1; x++) {
          if (x >= 0 && x < W) canvas.setCell(x, keyY - 1, ' ', null, '#0e0e0e')
        }
      }
    }
  }

  // --- Legs ---
  const legBot = Math.min(H - 4, bBot + Math.floor(H * 0.08))
  for (let y = bBot + 1; y <= legBot; y++) {
    for (const lx of [pL + Math.floor(pw * 0.08), cx, pR - Math.floor(pw * 0.08)]) {
      if (lx >= 0 && lx < W) canvas.setCell(lx, y, '│', PE)
    }
  }

  // --- Bench ---
  const bnTop = bBot + Math.floor(H * 0.1)
  const bnBot = bnTop + 2
  const bnL = cx - Math.floor(W * 0.08), bnR = cx + Math.floor(W * 0.08)
  if (bnBot < H - 3) {
    for (let y = bnTop; y <= bnBot; y++) {
      for (let x = bnL; x <= bnR; x++) {
        if (x >= 0 && x < W) {
          canvas.setCell(x, y, ' ', null, y === bnTop ? PE : '#0a0a0e')
        }
      }
    }
    const bLegBot = Math.min(H - 4, bnBot + 3)
    for (let y = bnBot + 1; y <= bLegBot; y++) {
      if (bnL + 1 >= 0 && bnL + 1 < W) canvas.setCell(bnL + 1, y, '│', PE)
      if (bnR - 1 >= 0 && bnR - 1 < W) canvas.setCell(bnR - 1, y, '│', PE)
    }
  }
}
