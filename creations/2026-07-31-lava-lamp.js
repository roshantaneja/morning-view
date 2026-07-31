import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Lava Lamp'
export const description = 'Molten wax drifts through violet liquid in a warm amber glow'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const ROOM = ['#020208', '#040410', '#060614', '#080818']
const SURFACE_COL = ['#0c0a08', '#100e0c', '#141210', '#181614']
const LIQUID = ['#0c0420', '#120830', '#180c3e', '#1e104c', '#24145a']
const LIQUID_WARM = ['#1a0a1e', '#201028', '#281432']
const WAX_CORE = ['#ffc840', '#ffd850', '#ffe868', '#fff888']
const WAX_BRIGHT = ['#ff9020', '#ffa028', '#ffb030', '#ffc040']
const WAX_OUTER = ['#e05010', '#d04008', '#c03000', '#b02000']
const WAX_DIM = ['#601800', '#501400', '#401000', '#300c00']
const GLASS_RIM = ['#14102a', '#1c1636', '#241c42']
const CHROME_COL = ['#181818', '#282828', '#383838', '#4a4a4a', '#5c5c5c', '#707070', '#848484', '#989898']
const AMBER = '#1a0a04'

function profile(t) {
  if (t < 0 || t >= 1) return 0
  if (t < 0.05) return 0.20
  if (t < 0.11) return 0.20 + (t - 0.05) / 0.06 * 0.14
  if (t < 0.30) return 0.34 + 0.58 * Math.sin((t - 0.11) / 0.19 * Math.PI / 2)
  if (t < 0.72) return 0.92 + 0.08 * Math.sin((t - 0.30) / 0.42 * Math.PI)
  if (t < 0.94) { const n = (t - 0.72) / 0.22; return 0.92 - 0.40 * n * n }
  return Math.max(0.06, 0.52 - 0.24 * ((t - 0.94) / 0.06))
}

export function setup(canvas) {
  const rng = srand(7312)
  const blobs = []
  for (let i = 0; i < 7; i++) {
    blobs.push({
      yMin: 0.15 + rng() * 0.25, yMax: 0.50 + rng() * 0.38,
      yPhase: rng() * Math.PI * 2, yFreq: 0.06 + rng() * 0.10,
      xBase: (rng() - 0.5) * 0.28,
      xPhase: rng() * Math.PI * 2, xFreq: 0.12 + rng() * 0.18, xAmp: 0.04 + rng() * 0.12,
      radius: 2.5 + rng() * 3.5,
      rPulse: 0.3 + rng() * 0.7, rFreq: 0.14 + rng() * 0.22, rPhase: rng() * Math.PI * 2,
    })
  }
  for (let i = 0; i < 5; i++) {
    blobs.push({
      yMin: 0.10 + rng() * 0.60, yMax: 0.20 + rng() * 0.65,
      yPhase: rng() * Math.PI * 2, yFreq: 0.10 + rng() * 0.16,
      xBase: (rng() - 0.5) * 0.22,
      xPhase: rng() * Math.PI * 2, xFreq: 0.16 + rng() * 0.25, xAmp: 0.02 + rng() * 0.08,
      radius: 1.0 + rng() * 1.8,
      rPulse: 0.15 + rng() * 0.4, rFreq: 0.18 + rng() * 0.28, rPhase: rng() * Math.PI * 2,
    })
  }
  const bubbles = []
  for (let i = 0; i < 12; i++) {
    bubbles.push({
      x: (rng() - 0.5) * 0.45, speed: 0.012 + rng() * 0.022,
      offset: rng() * 100, xDrift: rng() * 0.015, driftFreq: 0.3 + rng() * 0.5,
    })
  }
  return { blobs, bubbles }
}

function computeBlobs(state, elapsed) {
  const out = state.blobs.map(b => ({
    x: b.xBase + Math.sin(elapsed * b.xFreq + b.xPhase) * b.xAmp,
    y: b.yMin + (b.yMax - b.yMin) * (Math.sin(elapsed * b.yFreq + b.yPhase) * 0.5 + 0.5),
    r: b.radius + Math.sin(elapsed * b.rFreq + b.rPhase) * b.rPulse,
  }))
  out.push({ x: 0, y: 0.95, r: 5.5 + Math.sin(elapsed * 0.08) * 0.5 })
  out.push({ x: -0.08, y: 0.97, r: 3.5 })
  out.push({ x: 0.10, y: 0.96, r: 3.0 })
  return out
}

function drawRoom(canvas, surfY) {
  const w = canvas.width, h = canvas.height
  for (let y = 0; y < h; y++) {
    const bg = y < surfY
      ? lerpMulti(ROOM, Math.min(1, y / h * 0.7))
      : lerpMulti(SURFACE_COL, Math.min(1, (y - surfY) / (h - surfY) * 0.5 + 0.2))
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, bg)
  }
}

function drawGlow(canvas, cx, gTop, gH, mhw, surfY, elapsed) {
  const w = canvas.width, h = canvas.height
  const cy = gTop + gH * 0.45
  const pulse = Math.sin(elapsed * 0.11) * 0.06 + 0.94
  const range = mhw * 2.8
  for (let y = Math.max(0, gTop - 3); y < Math.min(h, surfY + 6); y++) {
    for (let x = Math.max(0, cx - Math.ceil(range)); x < Math.min(w, cx + Math.ceil(range)); x++) {
      const dx = (x - cx) * 0.5, dy = (y - cy) * 0.55
      const nd = Math.sqrt(dx * dx + dy * dy) / (range * 0.5)
      if (nd < 0.2 || nd > 1.4) continue
      const s = Math.max(0, 1 - nd) * 0.05 * pulse
      if (s < 0.002) continue
      const cell = canvas.getCell(x, y)
      if (cell && cell.bg) canvas.setCell(x, y, ' ', null, lerp(cell.bg, AMBER, s * 3))
    }
  }
}

function drawGlass(canvas, blobs, elapsed, cx, gTop, gH, mhw) {
  const w = canvas.width, h = canvas.height
  for (let y = gTop; y < gTop + gH && y < h; y++) {
    if (y < 0) continue
    const gt = (y - gTop) / gH
    const hw = Math.floor(mhw * profile(gt))
    if (hw <= 0) continue
    for (let dx = -hw; dx <= hw; dx++) {
      const x = cx + dx
      if (x < 0 || x >= w) continue
      const edgeN = hw > 1 ? Math.abs(dx) / hw : 0

      if (edgeN > 0.90 && hw > 3) {
        const g = Math.sin(gt * 12 + elapsed * 0.15) * 0.12 + 0.5
        canvas.setCell(x, y, SHADE[0], lerpMulti(GLASS_RIM, Math.min(1, g)), lerpMulti(GLASS_RIM, Math.min(1, g + 0.2)))
        continue
      }

      let field = 0
      for (const b of blobs) {
        const bx = cx + b.x * mhw * 2, by = gTop + b.y * gH
        const ddx = (x - bx) * 0.5, ddy = y - by
        const d2 = ddx * ddx + ddy * ddy
        field += d2 > 0.1 ? (b.r * b.r) / d2 : b.r * b.r * 10
      }

      if (field > 4.0) {
        canvas.setCell(x, y, BLOCK.full, lerpMulti(WAX_CORE, Math.min(1, (field - 4) / 10)), null)
      } else if (field > 2.5) {
        canvas.setCell(x, y, BLOCK.full, lerpMulti(WAX_BRIGHT, Math.min(1, (field - 2.5) / 1.5)), null)
      } else if (field > 1.5) {
        canvas.setCell(x, y, SHADE[3], lerpMulti(WAX_OUTER, Math.min(1, (field - 1.5) / 1.0)), null)
      } else if (field > 0.7) {
        const i = (field - 0.7) / 0.8
        const liq = lerpMulti(LIQUID, Math.min(1, gt * 0.7 + 0.15))
        const glow = lerpMulti(WAX_DIM, Math.min(1, 1 - i))
        canvas.setCell(x, y, SHADE[i > 0.5 ? 1 : 0], lerp(liq, glow, i * 0.55), liq)
      } else {
        const depth = Math.min(1, gt * 0.7 + edgeN * 0.3)
        const liq = lerpMulti(LIQUID, depth)
        const warmI = field / 0.7
        canvas.setCell(x, y, ' ', null, lerp(liq, lerpMulti(LIQUID_WARM, depth), warmI * 0.12))
      }
    }
  }
}

function drawBubbles(canvas, state, elapsed, cx, gTop, gH, mhw) {
  const h = canvas.height
  for (const bub of state.bubbles) {
    const gt = 1.0 - ((elapsed * bub.speed + bub.offset) % 1.0)
    const hw = profile(gt)
    if (hw <= 0) continue
    const bx = cx + Math.floor(bub.x * mhw * 2 + Math.sin(elapsed * bub.driftFreq + bub.offset) * bub.xDrift * mhw)
    const by = Math.floor(gTop + gt * gH)
    if (by <= gTop + 2 || by >= gTop + gH - 2 || by < 0 || by >= h) continue
    if (Math.abs(bx - cx) > Math.floor(mhw * hw * 0.85)) continue
    canvas.setCell(bx, by, '·', '#4a3870', null)
  }
}

function drawChrome(canvas, cx, y1, y2, mhw, isBase) {
  const w = canvas.width, h = canvas.height
  for (let y = y1; y < y2 && y < h; y++) {
    if (y < 0) continue
    const bt = (y - y1) / Math.max(1, y2 - y1)
    const hw = isBase
      ? Math.max(3, Math.floor(mhw * (0.38 + bt * 0.32)))
      : Math.max(3, Math.floor(mhw * 0.28))
    for (let dx = -hw; dx <= hw; dx++) {
      const x = cx + dx
      if (x < 0 || x >= w) continue
      const eT = Math.abs(dx) / (hw + 1)
      const ct = Math.min(1, eT * 0.45 + 0.12 + Math.sin(bt * Math.PI) * 0.08)
      canvas.setCell(x, y, BLOCK.full, lerpMulti(CHROME_COL, ct), null)
    }
    const sHW = Math.max(1, Math.floor(hw * 0.22))
    const sOff = Math.floor(-hw * 0.15)
    for (let dx = -sHW; dx <= sHW; dx++) {
      const x = cx + sOff + dx
      if (x < 0 || x >= w) continue
      canvas.setCell(x, y, BLOCK.full, lerpMulti(CHROME_COL, Math.min(1, 0.52 + (1 - Math.abs(dx) / (sHW + 1)) * 0.48)), null)
    }
  }
}

function drawReflection(canvas, cx, refStart, mhw, elapsed) {
  const w = canvas.width, h = canvas.height
  const refEnd = Math.min(h - 3, refStart + 5)
  const pulse = Math.sin(elapsed * 0.11) * 0.03 + 0.10
  for (let y = refStart; y < refEnd; y++) {
    const rt = (y - refStart) / Math.max(1, refEnd - refStart)
    const rHW = Math.floor(mhw * (0.55 - rt * 0.20))
    for (let dx = -rHW; dx <= rHW; dx++) {
      const x = cx + dx
      if (x < 0 || x >= w) continue
      const cell = canvas.getCell(x, y)
      if (cell && cell.bg) {
        canvas.setCell(x, y, ' ', null, lerp(cell.bg, AMBER, (1 - rt) * pulse * (1 - Math.abs(dx) / (rHW + 1))))
      }
    }
  }
}

function drawScene(canvas, state, elapsed) {
  const h = canvas.height, w = canvas.width
  const cx = Math.floor(w * 0.5)
  const surfY = Math.floor(h * 0.85)
  const gTop = Math.floor(h * 0.10)
  const gH = Math.floor(h * 0.68)
  const mhw = Math.max(8, Math.floor(w * 0.14))
  const capH = Math.max(2, Math.floor(h * 0.03))
  const baseH = Math.max(3, Math.floor(h * 0.05))
  const blobs = computeBlobs(state, elapsed)

  drawRoom(canvas, surfY)
  drawGlow(canvas, cx, gTop, gH, mhw, surfY, elapsed)
  drawChrome(canvas, cx, gTop - capH, gTop, mhw, false)
  drawGlass(canvas, blobs, elapsed, cx, gTop, gH, mhw)
  drawBubbles(canvas, state, elapsed, cx, gTop, gH, mhw)
  drawChrome(canvas, cx, gTop + gH, gTop + gH + baseH, mhw, true)
  drawReflection(canvas, cx, gTop + gH + baseH, mhw, elapsed)
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
