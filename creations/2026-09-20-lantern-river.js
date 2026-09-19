import { hex, bgHex, lerp, lerpMulti, BLOCK } from '../src/theme.js'

export const title = 'Tōrō Nagashi'
export const description = 'Paper lanterns drift downriver at dusk — each flame a quiet wish set free on the current'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(920)

  const horizon = Math.floor(H * 0.38)

  const stars = []
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * (horizon - 5)),
      b: 0.15 + rng() * 0.85,
      ph: rng() * TAU,
      sp: 0.3 + rng() * 1.8,
    })
  }

  const treeline = []
  for (let x = 0; x < W; x++) {
    const base = horizon - 3
    const n1 = Math.sin(x * 0.04) * 6
    const n2 = Math.sin(x * 0.11 + 1.7) * 3
    const n3 = Math.sin(x * 0.23 + 0.4) * 2
    const spike = Math.sin(x * 0.6) > 0.4 ? Math.sin(x * 0.6) * 4 : 0
    treeline.push(Math.floor(base + n1 + n2 + n3 - spike))
  }

  const lanterns = []
  const count = 14 + Math.floor(rng() * 5)
  for (let i = 0; i < count; i++) {
    const depth = rng()
    const baseY = horizon + 4 + Math.floor(depth * H * 0.40)
    lanterns.push({
      x: rng() * (W + 20) - 10,
      y: baseY,
      speed: 0.08 + depth * 0.12 + rng() * 0.06,
      bobPh: rng() * TAU,
      bobSp: 0.4 + rng() * 0.6,
      flickPh: rng() * TAU,
      flickSp: 2.5 + rng() * 3,
      hue: rng(),
      depth,
      size: depth > 0.7 ? 'large' : depth > 0.35 ? 'medium' : 'small',
    })
  }
  lanterns.sort((a, b) => a.depth - b.depth)

  const reeds = []
  for (let i = 0; i < 40; i++) {
    const side = rng() < 0.5 ? 'left' : 'right'
    const x = side === 'left'
      ? Math.floor(rng() * W * 0.10)
      : Math.floor(W * 0.90 + rng() * W * 0.10)
    reeds.push({
      x,
      baseY: horizon + Math.floor(rng() * 4),
      height: 5 + Math.floor(rng() * 14),
      swPh: rng() * TAU,
      swAmp: 0.4 + rng() * 1.8,
      swSp: 0.15 + rng() * 0.35,
    })
  }

  const skyRows = []
  for (let y = 0; y <= horizon; y++) {
    const t = y / Math.max(1, horizon)
    skyRows.push(lerpMulti(['#030612', '#08102a', '#101840', '#1a2248', '#1e2850'], t))
  }

  const waterRows = []
  for (let y = 0; y < H - horizon; y++) {
    const t = y / Math.max(1, H - horizon - 1)
    waterRows.push(lerpMulti(['#04081a', '#060e24', '#08122c', '#0a1630', '#0c1828'], t))
  }

  return { W, H, horizon, stars, treeline, lanterns, reeds, skyRows, waterRows }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }

function draw(canvas, state, t) {
  const { W, H, horizon, stars, treeline, lanterns, reeds, skyRows, waterRows } = state

  for (let y = 0; y < H; y++) {
    const c = y <= horizon ? skyRows[y] : waterRows[y - horizon - 1] || waterRows[waterRows.length - 1]
    const bg = bgHex(c)
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bg)
    }
  }

  for (const s of stars) {
    const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))
    const v = Math.floor(25 + s.b * tw * 55)
    canvas.setCell(s.x, s.y, s.b > 0.65 ? '✦' : '·', hex(col(v, v, v + 12)))
  }

  drawTreeline(canvas, state, t)
  drawWaterRipples(canvas, state, t)

  for (const lantern of lanterns) {
    const lx = ((lantern.x + lantern.speed * t * 18) % (W + 20)) - 10
    const bob = Math.sin(t * lantern.bobSp + lantern.bobPh) * 0.6
    const ly = lantern.y + Math.round(bob)
    const flick = 0.65 + 0.35 * Math.sin(t * lantern.flickSp + lantern.flickPh)
    drawLanternGlow(canvas, state, lx, ly, lantern, flick)
    drawLanternBody(canvas, state, lx, ly, lantern, flick)
    drawReflection(canvas, state, lx, ly, lantern, flick, t)
  }

  for (const reed of reeds) {
    drawReed(canvas, state, reed, t)
  }
}

function drawTreeline(canvas, state, t) {
  const { W, H, horizon, treeline } = state
  for (let x = 0; x < W; x++) {
    const top = treeline[x]
    for (let y = Math.max(0, top); y <= horizon; y++) {
      const depth = (y - top) / Math.max(1, horizon - top)
      const v = Math.floor(4 + depth * 10)
      canvas.setCell(x, y, ' ', null, bgHex(col(v, v + 2, v + 4)))
    }
  }
}

function drawWaterRipples(canvas, state, t) {
  const { W, H, horizon } = state
  for (let y = horizon + 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const wave = Math.sin(x * 0.035 + y * 0.2 + t * 0.4)
        + Math.sin(x * 0.08 - t * 0.25 + y * 0.05) * 0.5
      if (wave > 0.9) {
        const v = Math.floor(14 + (wave - 0.9) * 60)
        const cell = canvas.getCell(x, y)
        if (cell && cell.char === ' ') {
          canvas.setCell(x, y, '·', hex(col(v, v + 4, v + 12)))
        }
      }
    }
  }
}

function drawLanternGlow(canvas, state, cx, cy, lantern, flick) {
  const { W, H } = state
  const dim = 0.35 + lantern.depth * 0.65
  const hw = lantern.size === 'large' ? 3 : lantern.size === 'medium' ? 2 : 1
  const glowR = hw + 4

  for (let dy = -glowR; dy <= glowR; dy++) {
    for (let dx = -glowR * 2; dx <= glowR * 2; dx++) {
      const px = Math.round(cx) + dx
      const py = cy + dy - 1
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const dist = Math.sqrt((dx * 0.5) * (dx * 0.5) + dy * dy) / glowR
      if (dist > 1) continue
      const alpha = Math.pow(1 - dist, 2.5) * 0.10 * flick * dim
      if (alpha < 0.004) continue
      const cell = canvas.getCell(px, py)
      if (cell && cell.bg) {
        canvas.setCell(px, py, cell.char, cell.fg, bgHex(lerp(cell.bg, '#ffcc60', alpha)))
      }
    }
  }
}

function drawLanternBody(canvas, state, cx, cy, lantern, flick) {
  const { W, H } = state
  const dim = 0.35 + lantern.depth * 0.65
  const bodyColors = ['#cc8830', '#dd9940', '#e0a848', '#ddaa50']
  const bodyBase = lerpMulti(bodyColors, lantern.hue)
  const litBody = lerp(bodyBase, '#ffe888', flick * 0.35)
  const body = lerp('#060408', litBody, dim)
  const edge = lerp(body, '#000000', 0.35)

  let hw, hh
  if (lantern.size === 'large') { hw = 3; hh = 3 }
  else if (lantern.size === 'medium') { hw = 2; hh = 2 }
  else { hw = 1; hh = 1 }

  for (let dy = -hh; dy <= 0; dy++) {
    for (let dx = -hw; dx <= hw; dx++) {
      const px = Math.round(cx) + dx
      const py = cy + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue

      const isEdge = Math.abs(dx) === hw || dy === -hh || dy === 0
      if (dx === 0 && dy === -hh) {
        const flame = lerp('#ff9920', '#ffe888', flick)
        canvas.setCell(px, py, '◆', hex(lerp('#060408', flame, dim)))
      } else {
        canvas.setCell(px, py, ' ', null, bgHex(isEdge ? edge : body))
      }
    }
  }

  const topY = cy - hh - 1
  const tx = Math.round(cx)
  if (tx >= 0 && tx < W && topY >= 0 && topY < H) {
    canvas.setCell(tx, topY, '╷', hex(lerp('#060408', '#7a5828', dim)))
  }

  if (lantern.size !== 'small') {
    const botY = cy + 1
    for (let dx = -hw + 1; dx <= hw - 1; dx++) {
      const px = Math.round(cx) + dx
      if (px >= 0 && px < W && botY >= 0 && botY < H) {
        canvas.setCell(px, botY, BLOCK.upper, hex(lerp('#060408', lerp(body, '#000000', 0.2), 1)))
      }
    }
  }
}

function drawReflection(canvas, state, cx, cy, lantern, flick, t) {
  const { W, H, horizon } = state
  const dim = 0.35 + lantern.depth * 0.65
  const refStart = cy + 2
  const refLen = lantern.size === 'large' ? 12 : lantern.size === 'medium' ? 8 : 5

  const bodyColors = ['#cc8830', '#dd9940', '#e0a848', '#ddaa50']
  const bodyBase = lerpMulti(bodyColors, lantern.hue)
  const refColor = lerp(bodyBase, '#ffcc60', flick * 0.3)

  for (let i = 0; i < refLen; i++) {
    const ry = refStart + i
    if (ry <= horizon || ry >= H) continue
    const fade = 1 - i / refLen
    const wobble = Math.sin(t * 1.4 + i * 0.6 + cx * 0.08) * (1 + i * 0.4)
    const rx = Math.round(cx + wobble)
    if (rx < 0 || rx >= W) continue

    const alpha = fade * fade * 0.35 * flick * dim
    if (alpha < 0.015) continue

    const cell = canvas.getCell(rx, ry)
    if (cell && cell.bg) {
      const blended = lerp(cell.bg, refColor, alpha)
      canvas.setCell(rx, ry, fade > 0.5 ? '~' : '·', hex(lerp(cell.bg, refColor, alpha * 1.6)), bgHex(blended))
    }

    for (const ddx of [-1, 1]) {
      const sx = rx + ddx
      if (sx < 0 || sx >= W) continue
      const sAlpha = alpha * 0.25
      if (sAlpha < 0.008) continue
      const sCell = canvas.getCell(sx, ry)
      if (sCell && sCell.bg) {
        canvas.setCell(sx, ry, sCell.char, sCell.fg, bgHex(lerp(sCell.bg, refColor, sAlpha)))
      }
    }
  }
}

function drawReed(canvas, state, reed, t) {
  const { W, H } = state
  const sway = Math.sin(t * reed.swSp + reed.swPh)

  for (let i = 0; i < reed.height; i++) {
    const segT = i / reed.height
    const swayX = sway * reed.swAmp * segT * segT
    const px = Math.round(reed.x + swayX)
    const py = reed.baseY - i
    if (px < 0 || px >= W || py < 0 || py >= H) continue

    const g = Math.floor(15 + segT * 25)
    const reedColor = col(g - 6, g + 10, g - 4)

    if (segT > 0.85) {
      canvas.setCell(px, py, '╷', hex(reedColor))
    } else if (segT < 0.08) {
      canvas.setCell(px, py, BLOCK.full, hex(reedColor))
    } else {
      canvas.setCell(px, py, '│', hex(reedColor))
    }
  }
}
