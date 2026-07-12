import { lerpMulti, lerp, BLOCK, SHADE, BOX } from '../src/theme.js'

export const title = 'Hourglass'
export const description = 'Sand measures the quiet hours before dawn'
export const fps = 4

const BG = ['#0a0806', '#0c0a08', '#0e0c0a', '#100e0c']
const FRAME_BRASS = ['#3a2800', '#5c4008', '#7a5810', '#987020', '#b08828']
const FRAME_DARK = ['#1a1408', '#2a200c', '#382c10', '#463814']
const GLASS_EDGE = ['#2a2018', '#3a3020', '#4a4028', '#5a5030']
const GLASS_FILL = ['#0e0c08', '#100e0a', '#14120c', '#18160e']
const SAND_COLORS = ['#8b6914', '#a07818', '#b8881c', '#cc9820', '#daa828', '#e8b830']
const SAND_BRIGHT = ['#eec840', '#f4d860', '#f8e880', '#fff0a0']
const GRAIN_COLORS = ['#cc9820', '#daa828', '#e8b830', '#eec840', '#f4d860']
const SHIMMER = ['#3a3020', '#4a4028', '#5c5030', '#706840', '#887850']

const ASPECT = 2.0

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)

  const grains = []
  for (let i = 0; i < 6; i++) {
    grains.push({
      x: cx + (Math.random() - 0.5) * 2,
      y: cy - 2 + Math.random() * 4,
      speed: 0.8 + Math.random() * 0.6,
      wobble: Math.random() * Math.PI * 2,
      wobbleAmt: 0.2 + Math.random() * 0.3,
    })
  }

  const shimmerPoints = []
  const rng = seededRandom(42)
  for (let i = 0; i < 20; i++) {
    shimmerPoints.push({
      angle: rng() * Math.PI * 2,
      radius: 0.3 + rng() * 0.6,
      phase: rng() * Math.PI * 2,
      speed: 0.3 + rng() * 0.5,
    })
  }

  return {
    phase: 0,
    grains,
    shimmerPoints,
    sandLevel: 0.35,
  }
}

function drawBackground(canvas) {
  const w = canvas.width
  const h = canvas.height
  for (let y = 0; y < h; y++) {
    const t = y / h
    const bg = lerpMulti(BG, t)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, bg)
    }
  }
}

function isInsideHourglass(px, py, cx, cy, bulbW, bulbH, neckW) {
  const relY = (py - cy) / bulbH
  const relX = (px - cx)

  if (Math.abs(relY) > 1.0) return false

  let halfWidth
  if (Math.abs(relY) < 0.08) {
    halfWidth = neckW / 2
  } else {
    const t = (Math.abs(relY) - 0.08) / 0.92
    const bulbProfile = Math.sqrt(1 - t * t)
    const neckHalf = neckW / 2
    const blend = Math.pow(Math.abs(relY) / 0.3, 2)
    if (Math.abs(relY) < 0.3) {
      halfWidth = neckHalf + (bulbW / 2 - neckHalf) * (1 - Math.pow(1 - blend, 2))
    } else {
      halfWidth = bulbW / 2 * bulbProfile
    }
  }

  return Math.abs(relX) <= halfWidth
}

function getHourglassHalfWidth(relY, bulbW, neckW) {
  if (Math.abs(relY) > 1.0) return 0
  if (Math.abs(relY) < 0.08) return neckW / 2

  const t = (Math.abs(relY) - 0.08) / 0.92
  const bulbProfile = Math.sqrt(Math.max(0, 1 - t * t))
  const neckHalf = neckW / 2

  if (Math.abs(relY) < 0.3) {
    const blend = Math.pow(Math.abs(relY) / 0.3, 2)
    return neckHalf + (bulbW / 2 - neckHalf) * (1 - Math.pow(1 - blend, 2))
  }
  return bulbW / 2 * bulbProfile
}

function drawHourglass(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)
  const bulbW = Math.floor(w * 0.35)
  const bulbH = Math.floor(h * 0.42)
  const neckW = Math.max(3, Math.floor(w * 0.03))

  const topFrameY = cy - bulbH - 2
  const botFrameY = cy + bulbH + 2
  const frameHalfW = Math.floor(bulbW / 2) + 4

  for (let x = cx - frameHalfW; x <= cx + frameHalfW; x++) {
    for (let dy = 0; dy < 3; dy++) {
      const t = (x - (cx - frameHalfW)) / (frameHalfW * 2)
      const col = lerpMulti(FRAME_BRASS, 0.3 + Math.sin(t * Math.PI) * 0.7)
      canvas.setCell(x, topFrameY + dy, dy === 1 ? BLOCK.full : SHADE[2], col)
      canvas.setCell(x, botFrameY - dy, dy === 1 ? BLOCK.full : SHADE[2], col)
    }
  }

  for (let dy = 0; dy < 3; dy++) {
    const capCol = lerpMulti(FRAME_DARK, 0.5)
    canvas.setCell(cx - frameHalfW - 1, topFrameY + dy, BOX.rounded.v, capCol)
    canvas.setCell(cx + frameHalfW + 1, topFrameY + dy, BOX.rounded.v, capCol)
    canvas.setCell(cx - frameHalfW - 1, botFrameY - dy, BOX.rounded.v, capCol)
    canvas.setCell(cx + frameHalfW + 1, botFrameY - dy, BOX.rounded.v, capCol)
  }

  const standW = Math.floor(frameHalfW * 0.6)
  for (let x = cx - standW; x <= cx + standW; x++) {
    const col = lerpMulti(FRAME_DARK, 0.7)
    canvas.setCell(x, botFrameY + 1, SHADE[1], col)
    canvas.setCell(x, botFrameY + 2, SHADE[0], col)
  }

  const pillH = botFrameY - topFrameY - 4
  for (let dy = 0; dy < pillH; dy++) {
    const py = topFrameY + 3 + dy
    const t = dy / pillH
    const col = lerpMulti(FRAME_BRASS, 0.2 + Math.sin(t * Math.PI * 3) * 0.3)
    canvas.setCell(cx - frameHalfW + 1, py, BOX.single.v, col)
    canvas.setCell(cx + frameHalfW - 1, py, BOX.single.v, col)
  }

  for (let screenY = topFrameY + 3; screenY < botFrameY - 2; screenY++) {
    const relY = (screenY - cy) / bulbH
    const halfW = getHourglassHalfWidth(relY, bulbW, neckW)
    if (halfW <= 0) continue

    for (let dx = -Math.ceil(halfW); dx <= Math.ceil(halfW); dx++) {
      const sx = cx + dx
      if (sx < 0 || sx >= w) continue
      const dist = Math.abs(dx) / halfW

      if (dist > 0.92 && dist <= 1.0) {
        const edgeT = (dist - 0.92) / 0.08
        const col = lerpMulti(GLASS_EDGE, edgeT)
        canvas.setCell(sx, screenY, SHADE[Math.min(3, Math.floor(edgeT * 2))], col)
      } else if (dist <= 0.92) {
        const fillT = dist / 0.92
        const col = lerpMulti(GLASS_FILL, fillT * 0.5)
        canvas.setCell(sx, screenY, ' ', null, col)
      }
    }
  }

  drawSand(canvas, cx, cy, bulbW, bulbH, neckW, state, topFrameY, botFrameY)
}

function drawSand(canvas, cx, cy, bulbW, bulbH, neckW, state, topFrameY, botFrameY) {
  const sandFill = state.sandLevel
  const upperTop = topFrameY + 4
  const upperBot = cy - Math.floor(bulbH * 0.08)
  const lowerTop = cy + Math.floor(bulbH * 0.08)
  const lowerBot = botFrameY - 3

  const upperRange = upperBot - upperTop
  const sandTopY = upperTop + Math.floor(upperRange * sandFill)

  for (let screenY = sandTopY; screenY <= upperBot; screenY++) {
    const relY = (screenY - cy) / bulbH
    const halfW = getHourglassHalfWidth(relY, bulbW, neckW) * 0.88
    if (halfW <= 0) continue

    const isSurface = (screenY === sandTopY || screenY === sandTopY + 1)

    for (let dx = -Math.ceil(halfW); dx <= Math.ceil(halfW); dx++) {
      const sx = cx + dx
      if (sx < 0 || sx >= canvas.width) continue
      const dist = Math.abs(dx) / Math.max(1, halfW)
      if (dist > 1.0) continue

      let col, ch
      if (isSurface) {
        const surfT = 0.5 + Math.sin(dx * 0.3 + state.phase) * 0.2
        col = lerpMulti(SAND_BRIGHT, surfT)
        ch = screenY === sandTopY ? SHADE[1] : SHADE[2]
      } else {
        const depthT = (screenY - sandTopY) / Math.max(1, upperBot - sandTopY)
        col = lerpMulti(SAND_COLORS, 0.3 + depthT * 0.5 + dist * 0.2)
        ch = SHADE[2 + Math.floor(depthT * 1.5)]
        if (ch === undefined) ch = BLOCK.full
      }
      canvas.setCell(sx, screenY, ch, col)
    }
  }

  const lowerRange = lowerBot - lowerTop
  const pileHeight = Math.floor(lowerRange * (1 - sandFill))
  const pileTopY = lowerBot - pileHeight

  for (let screenY = pileTopY; screenY <= lowerBot; screenY++) {
    const relY = (screenY - cy) / bulbH
    const halfW = getHourglassHalfWidth(relY, bulbW, neckW) * 0.88
    if (halfW <= 0) continue

    const pileT = (screenY - pileTopY) / Math.max(1, pileHeight)
    const coneWidth = halfW * Math.min(1, pileT * 1.5 + 0.2)

    const isSurface = (screenY === pileTopY || screenY === pileTopY + 1)

    for (let dx = -Math.ceil(coneWidth); dx <= Math.ceil(coneWidth); dx++) {
      const sx = cx + dx
      if (sx < 0 || sx >= canvas.width) continue
      const dist = Math.abs(dx) / Math.max(1, coneWidth)
      if (dist > 1.0) continue

      let col, ch
      if (isSurface && pileHeight > 2) {
        const coneShape = 1 - dist
        col = lerpMulti(SAND_BRIGHT, coneShape * 0.6 + 0.2)
        ch = SHADE[1 + Math.floor(coneShape)]
      } else {
        col = lerpMulti(SAND_COLORS, 0.4 + dist * 0.3 + pileT * 0.2)
        ch = SHADE[2 + Math.floor(pileT)]
        if (ch === undefined) ch = BLOCK.full
      }
      canvas.setCell(sx, screenY, ch, col)
    }
  }
}

function drawFallingGrains(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)
  const bulbH = Math.floor(h * 0.42)
  const neckTop = cy - Math.floor(bulbH * 0.08)
  const neckBot = cy + Math.floor(bulbH * 0.08)

  for (const grain of state.grains) {
    const gx = Math.round(grain.x)
    const gy = Math.round(grain.y)
    if (gx >= 0 && gx < w && gy >= 0 && gy < h) {
      const t = (grain.y - neckTop) / (neckBot - neckTop + 20)
      const col = lerpMulti(GRAIN_COLORS, Math.min(1, Math.max(0, t)))
      canvas.setCell(gx, gy, GLYPH.bullet, col)
      if (gy + 1 < h) {
        const dimCol = lerp(col, '#0a0806', 0.6)
        canvas.setCell(gx, gy + 1, '.', dimCol)
      }
    }
  }
}

function drawShimmer(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)
  const bulbW = Math.floor(w * 0.35)
  const bulbH = Math.floor(h * 0.42)

  for (const sp of state.shimmerPoints) {
    const angle = sp.angle
    const brightness = 0.3 + 0.7 * Math.max(0, Math.sin(state.phase * sp.speed + sp.phase))
    if (brightness < 0.5) continue

    const rx = bulbW * 0.45 * sp.radius
    const ry = bulbH * 0.8 * sp.radius
    const sx = Math.round(cx + Math.cos(angle) * rx)
    const sy = Math.round(cy + Math.sin(angle) * ry)

    if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
      const col = lerpMulti(SHIMMER, brightness)
      canvas.setCell(sx, sy, '·', col)
    }
  }
}

function drawDecorations(canvas) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const bulbH = Math.floor(h * 0.42)
  const cy = Math.floor(h / 2)
  const topFrameY = cy - bulbH - 2
  const botFrameY = cy + bulbH + 2

  const ornaments = '─═─•─═─'
  const ornLeft = cx - Math.floor(ornaments.length / 2)
  for (let i = 0; i < ornaments.length; i++) {
    const col = lerpMulti(FRAME_BRASS, 0.5 + Math.sin(i * 0.8) * 0.3)
    canvas.setCell(ornLeft + i, topFrameY - 1, ornaments[i], col)
    canvas.setCell(ornLeft + i, botFrameY + 3, ornaments[i], col)
  }
}

export function render(canvas, data, state) {
  drawBackground(canvas)
  drawHourglass(canvas, state)
  drawFallingGrains(canvas, state)
  drawShimmer(canvas, state)
  drawDecorations(canvas)
}

export function update(canvas, data, frame, state) {
  state.phase += 0.15

  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)
  const bulbH = Math.floor(h * 0.42)
  const neckTop = cy - Math.floor(bulbH * 0.08)
  const neckBot = cy + Math.floor(bulbH * 0.08)
  const lowerBot = cy + bulbH

  for (const grain of state.grains) {
    grain.y += grain.speed
    grain.x = cx + Math.sin(grain.wobble + state.phase * 0.5) * grain.wobbleAmt

    if (grain.y > neckBot + 15) {
      grain.y = neckTop - 1 - Math.random() * 3
      grain.x = cx + (Math.random() - 0.5) * 2
      grain.speed = 0.8 + Math.random() * 0.6
    }
  }

  state.sandLevel = 0.3 + Math.sin(state.phase * 0.02) * 0.15

  render(canvas, data, state)
}
