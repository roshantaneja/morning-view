import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Vinyl'
export const description = 'A record turns in amber evening light'
export const fps = 3

const ASPECT = 2.0

const BG = ['#0c0804', '#100a06', '#150e08', '#1c1208']
const PLATTER_COL = '#0e0c0a'
const VINYL_BG = '#050505'
const GROOVE = ['#060606', '#0a0a0a', '#101010', '#181818', '#222222', '#2e2e2e']
const VINYL_EDGE = '#1a1a1a'
const LABEL_PAL = ['#601616', '#781e1e', '#922626', '#a83030']
const LABEL_RIM = '#3c0c0c'
const LABEL_TXT = '#d8c8a0'
const ARM = ['#1a1a1a', '#303030', '#484848', '#606060']
const HEAD_COL = '#787878'
const MOTE_COL = '#28180a'
const WARM = '#2a1808'

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

export function setup(canvas) {
  const rng = srand(77)
  const motes = []
  for (let i = 0; i < 14; i++) {
    motes.push({
      x: rng() * canvas.width,
      y: rng() * canvas.height,
      sp: 0.02 + rng() * 0.06,
      br: 0.2 + rng() * 0.6,
      ph: rng() * Math.PI * 2,
    })
  }
  return { angle: 0, phase: 0, motes }
}

export function render(canvas, data, state) {
  paint(canvas, state)
}

export function update(canvas, data, frame, state) {
  state.angle += 0.12
  state.phase += 0.08
  for (const m of state.motes) {
    m.y -= m.sp
    if (m.y < -1) { m.y = canvas.height + 1; m.x = Math.random() * canvas.width }
  }
  paint(canvas, state)
}

function vd(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy * ASPECT * ASPECT)
}

function paint(canvas, st) {
  const w = canvas.width, h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h * 0.45)
  const R = Math.floor(Math.min(w * 0.40, h * 0.42 * ASPECT))

  drawBg(canvas, cx, cy, R, w, h)
  drawPlatter(canvas, cx, cy, R, w, h)
  drawGrooves(canvas, cx, cy, R, st.angle, w, h)
  drawLabel(canvas, cx, cy, R, w, h)
  drawArm(canvas, cx, cy, R, w, h)
  drawMotes(canvas, st, w, h)
}

function drawBg(canvas, cx, cy, R, w, h) {
  for (let y = 0; y < h; y++) {
    const t = y / h
    const base = lerpMulti(BG, t)
    for (let x = 0; x < w; x++) {
      const d = vd(x - cx, y - cy)
      const glow = Math.pow(Math.max(0, 1 - d / (R * 2.2)), 2)
      canvas.setCell(x, y, ' ', null, lerp(base, WARM, glow * 0.12))
    }
  }
}

function drawPlatter(canvas, cx, cy, R, w, h) {
  const pR = R + 4
  const extX = pR + 1
  const extY = Math.ceil(pR / ASPECT) + 1
  for (let dy = -extY; dy <= extY; dy++) {
    const sy = cy + dy
    if (sy < 0 || sy >= h) continue
    for (let dx = -extX; dx <= extX; dx++) {
      const sx = cx + dx
      if (sx < 0 || sx >= w) continue
      const d = vd(dx, dy)
      if (d > pR) continue
      const edge = Math.max(0, 1 - (pR - d) / 3)
      const col = lerp(PLATTER_COL, '#060604', edge)
      canvas.setCell(sx, sy, SHADE[0], col, col)
    }
  }
}

function drawGrooves(canvas, cx, cy, R, angle, w, h) {
  const labelR = R * 0.30
  const leadIn = R * 0.96
  const runOut = R * 0.35
  const ringFreq = 4.5
  const extX = R + 1
  const extY = Math.ceil(R / ASPECT) + 1

  for (let dy = -extY; dy <= extY; dy++) {
    const sy = cy + dy
    if (sy < 0 || sy >= h) continue
    for (let dx = -extX; dx <= extX; dx++) {
      const sx = cx + dx
      if (sx < 0 || sx >= w) continue
      const d = vd(dx, dy)
      if (d > R + 0.5 || d < labelR) continue

      const a = Math.atan2(dy * ASPECT, dx)

      if (d > R - 0.8) {
        canvas.setCell(sx, sy, SHADE[1], VINYL_EDGE, VINYL_BG)
        continue
      }

      const spec = Math.pow(Math.max(0, Math.cos(a - angle * 0.05)), 12) * 0.65
      const spec2 = Math.pow(Math.max(0, Math.cos(a - angle * 0.05 + 2.1)), 6) * 0.12

      const shimmer = Math.sin(a * 6 + angle + d * 0.3) * 0.06
      const ring = Math.sin(d * ringFreq + shimmer) * 0.5 + 0.5

      let bright
      if (d > leadIn) {
        bright = 0.06 + spec * 0.5 + spec2
      } else if (d < runOut) {
        bright = 0.04 + spec * 0.4 + spec2
      } else {
        bright = ring * 0.12 + spec + spec2
      }

      const color = lerpMulti(GROOVE, Math.min(1, Math.max(0, bright)))
      let ch
      if (bright > 0.45) ch = SHADE[2]
      else if (bright > 0.2) ch = SHADE[1]
      else ch = SHADE[0]

      canvas.setCell(sx, sy, ch, color, VINYL_BG)
    }
  }
}

function drawLabel(canvas, cx, cy, R, w, h) {
  const lR = R * 0.30
  const holeR = lR * 0.12
  const outerRim = lR * 0.88
  const innerRim = lR * 0.35
  const extX = Math.ceil(lR) + 1
  const extY = Math.ceil(lR / ASPECT) + 1

  for (let dy = -extY; dy <= extY; dy++) {
    const sy = cy + dy
    if (sy < 0 || sy >= h) continue
    for (let dx = -extX; dx <= extX; dx++) {
      const sx = cx + dx
      if (sx < 0 || sx >= w) continue
      const d = vd(dx, dy)
      if (d > lR) continue

      if (d < holeR) {
        canvas.setCell(sx, sy, BLOCK.full, '#020202', '#020202')
        continue
      }
      if (Math.abs(d - outerRim) < 0.7) {
        canvas.setCell(sx, sy, SHADE[2], LABEL_RIM)
        continue
      }
      if (Math.abs(d - innerRim) < 0.6) {
        canvas.setCell(sx, sy, SHADE[1], LABEL_RIM)
        continue
      }

      const t = d / lR
      const col = lerpMulti(LABEL_PAL, t * 0.7)
      canvas.setCell(sx, sy, SHADE[3], col, col)
    }
  }

  if (lR > 6) {
    const lines = [
      { text: 'MORNING', y: cy - 1 },
      { text: 'VIEW', y: cy + 1 },
    ]
    for (const { text, y } of lines) {
      if (y < 0 || y >= h) continue
      const x0 = cx - Math.floor(text.length / 2)
      for (let i = 0; i < text.length; i++) {
        const tx = x0 + i
        if (tx >= 0 && tx < w) {
          canvas.setCell(tx, y, text[i], LABEL_TXT)
        }
      }
    }
  }
}

function drawArm(canvas, cx, cy, R, w, h) {
  const pivotX = Math.min(w - 4, Math.floor(cx + R * 0.82))
  const pivotY = Math.floor(cy + R / ASPECT * 0.15)
  const sR = R * 0.58
  const sA = -Math.PI * 0.3
  const tipX = Math.floor(cx + Math.cos(sA) * sR)
  const tipY = Math.floor(cy + Math.sin(sA) * sR / ASPECT)

  const steps = Math.max(Math.abs(tipX - pivotX), Math.abs(tipY - pivotY), 1)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = Math.round(pivotX + (tipX - pivotX) * t)
    const y = Math.round(pivotY + (tipY - pivotY) * t)
    if (x < 0 || x >= w || y < 0 || y >= h) continue
    const col = lerpMulti(ARM, t)
    canvas.setCell(x, y, SHADE[3], col)
    if (y + 1 < h && t < 0.9) {
      const cell = canvas.getCell(x, y + 1)
      if (cell) canvas.setCell(x, y + 1, cell.char, cell.fg, lerp(cell.bg || VINYL_BG, '#020202', 0.3))
    }
  }

  for (let dx = -2; dx <= 0; dx++) {
    const hx = tipX + dx
    if (hx >= 0 && hx < w && tipY >= 0 && tipY < h) {
      canvas.setCell(hx, tipY, SHADE[3], HEAD_COL)
    }
  }

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const px = pivotX + dx
      const py = pivotY + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const d = Math.sqrt(dx * dx + dy * dy * 4)
      if (d > 3) continue
      const col = lerpMulti(ARM, 0.3 + (3 - d) / 6)
      const si = Math.min(3, Math.max(0, 3 - Math.floor(d)))
      canvas.setCell(px, py, SHADE[si], col)
    }
  }

  const cwDx = pivotX - tipX
  const cwDy = pivotY - tipY
  const cwLen = Math.sqrt(cwDx * cwDx + cwDy * cwDy)
  if (cwLen > 0) {
    const cwX = Math.round(pivotX + (cwDx / cwLen) * 6)
    const cwY = Math.round(pivotY + (cwDy / cwLen) * 3)
    for (let dx = -1; dx <= 1; dx++) {
      const px = cwX + dx
      if (px >= 0 && px < w && cwY >= 0 && cwY < h) {
        canvas.setCell(px, cwY, SHADE[3], ARM[2])
      }
    }
  }
}

function drawMotes(canvas, st, w, h) {
  for (const m of st.motes) {
    const mx = Math.round(m.x)
    const my = Math.round(m.y)
    if (mx < 0 || mx >= w || my < 0 || my >= h) continue
    const tw = Math.sin(st.phase * 1.5 + m.ph) * 0.5 + 0.5
    if (tw * m.br < 0.2) continue
    canvas.setCell(mx, my, '·', lerp('#0a0604', MOTE_COL, m.br * tw))
  }
}
