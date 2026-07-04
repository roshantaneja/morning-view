import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Zen Garden'
export const description = 'Raked sand flows around ancient stones in afternoon stillness'
export const fps = 2

const SAND = ['#1a1608', '#2a2410', '#3a3218', '#4a4020', '#5a4e28']
const SAND_LIGHT = ['#4a4020', '#5a4e28', '#6a5c30', '#7a6a38', '#8a7840']
const STONE_DARK = ['#1a1a1e', '#22222a', '#2a2a34', '#32323e']
const STONE_MID = ['#38384a', '#424258', '#4c4c66', '#565674']
const STONE_LIGHT = ['#5a5a7a', '#646488', '#6e6e96', '#7878a4']
const MOSS = ['#1a2a10', '#243814', '#2e4618', '#38541c', '#426220']
const WATER = ['#0a1828', '#142838', '#1e3848', '#284858']

const ASPECT = 2.0

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height

  const stones = [
    { x: w * 0.32, y: h * 0.28, rx: 5.5, ry: 4.0, angle: 0.3, moss: true },
    { x: w * 0.68, y: h * 0.45, rx: 4.0, ry: 3.0, angle: -0.2, moss: false },
    { x: w * 0.45, y: h * 0.62, rx: 7.0, ry: 5.5, angle: 0.1, moss: true },
    { x: w * 0.22, y: h * 0.78, rx: 3.0, ry: 2.5, angle: 0.5, moss: false },
    { x: w * 0.75, y: h * 0.72, rx: 3.5, ry: 2.8, angle: -0.4, moss: true },
  ]

  const leaf = {
    x: w * 0.55,
    y: h * 0.35,
    drift: 0,
    spin: 0,
  }

  return { stones, leaf, lightAngle: 0 }
}

export function render(canvas, data, state) {
  drawAll(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const t = frame.elapsed

  state.lightAngle = t * 0.04
  state.leaf.drift = t * 0.15
  state.leaf.spin = t * 0.3

  canvas.clear()
  drawAll(canvas, state, t)
}

function drawAll(canvas, state, time) {
  drawSand(canvas, state, time)
  drawRakeLines(canvas, state, time)
  drawWaterBasin(canvas, state, time)
  drawStones(canvas, state, time)
  drawLeaf(canvas, state, time)
}

function drawSand(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const lightX = w * 0.5 + Math.cos(state.lightAngle) * w * 0.3
  const lightY = h * 0.3 + Math.sin(state.lightAngle * 0.7) * h * 0.1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - lightX
      const dy = (y - lightY) * 0.5
      const dist = Math.sqrt(dx * dx + dy * dy) / (w * 0.6)
      const lightT = Math.max(0, Math.min(1, 1 - dist))

      const noise = Math.sin(x * 0.13 + y * 0.09) * 0.15 +
                    Math.sin(x * 0.07 - y * 0.11) * 0.1
      const t = Math.max(0, Math.min(1, 0.3 + noise + lightT * 0.4))

      const color = lerpMulti(t > 0.5 ? SAND_LIGHT : SAND, t > 0.5 ? (t - 0.5) * 2 : t * 2)
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function distToStone(x, y, stone) {
  const dx = (x - stone.x) * Math.cos(stone.angle) + ((y - stone.y) * ASPECT) * Math.sin(stone.angle)
  const dy = -(x - stone.x) * Math.sin(stone.angle) + ((y - stone.y) * ASPECT) * Math.cos(stone.angle)
  return Math.sqrt((dx / stone.rx) * (dx / stone.rx) + (dy / stone.ry) * (dy / stone.ry))
}

function nearestStoneInfluence(x, y, stones) {
  let minDist = Infinity
  let nearest = null
  for (const s of stones) {
    const d = distToStone(x, y, s)
    if (d < minDist) {
      minDist = d
      nearest = s
    }
  }
  return { dist: minDist, stone: nearest }
}

function drawRakeLines(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { stones } = state
  const waveShift = Math.sin(time * 0.08) * 0.3

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const { dist, stone } = nearestStoneInfluence(x, y, stones)

      if (dist < 1.15) continue

      let lineVal
      if (dist < 3.0) {
        const angle = Math.atan2((y - stone.y) * ASPECT, x - stone.x)
        const rDist = Math.sqrt((x - stone.x) * (x - stone.x) + ((y - stone.y) * ASPECT) * ((y - stone.y) * ASPECT))
        lineVal = Math.sin((rDist + waveShift) * 1.2) * 0.5 + 0.5
      } else {
        const baseAngle = Math.PI * 0.08
        const flowX = x * Math.cos(baseAngle) + y * Math.sin(baseAngle)
        lineVal = Math.sin((flowX + waveShift) * 0.8) * 0.5 + 0.5
      }

      if (lineVal > 0.55 && lineVal < 0.85) {
        const cell = canvas.getCell(x, y)
        const bg = (cell && cell.bg) || '#3a3218'
        const groove = lerp(bg, '#1a1608', 0.25)
        canvas.setCell(x, y, '·', lerp(groove, '#2a2410', 0.5), groove)
      } else if (lineVal > 0.85) {
        const cell = canvas.getCell(x, y)
        const bg = (cell && cell.bg) || '#3a3218'
        const ridge = lerp(bg, '#6a5c30', 0.15)
        canvas.setCell(x, y, ' ', null, ridge)
      }
    }
  }
}

function drawWaterBasin(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const bx = Math.floor(w * 0.82)
  const by = Math.floor(h * 0.22)
  const br = 6

  for (let dy = -br; dy <= br; dy++) {
    for (let dx = -br * 2; dx <= br * 2; dx++) {
      const nd = Math.sqrt((dx / (br * 2)) * (dx / (br * 2)) + (dy / br) * (dy / br))
      if (nd > 1) continue

      const px = bx + dx
      const py = by + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue

      if (nd > 0.85) {
        canvas.setCell(px, py, ' ', null, '#2a2a30')
      } else {
        const ripple = Math.sin(nd * 8 + time * 0.5) * 0.15
        const t = Math.max(0, Math.min(1, nd + ripple))
        const color = lerpMulti(WATER, t)
        const shimmer = Math.sin(dx * 0.5 + time * 0.3) * 0.1 + 0.5
        if (shimmer > 0.55 && nd < 0.4) {
          canvas.setCell(px, py, '~', lerp(color, '#3a5868', 0.3), color)
        } else {
          canvas.setCell(px, py, ' ', null, color)
        }
      }
    }
  }
}

function drawStones(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { stones } = state

  for (const stone of stones) {
    const searchR = Math.max(stone.rx, stone.ry) + 2
    const xMin = Math.max(0, Math.floor(stone.x - searchR * 2))
    const xMax = Math.min(w, Math.ceil(stone.x + searchR * 2))
    const yMin = Math.max(0, Math.floor(stone.y - searchR))
    const yMax = Math.min(h, Math.ceil(stone.y + searchR))

    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {
        const d = distToStone(x, y, stone)
        if (d > 1.05) continue

        const dx = x - stone.x
        const dy = (y - stone.y) * ASPECT
        const lightDir = Math.atan2(-1, -0.5)
        const surfAngle = Math.atan2(dy, dx)
        const lightFactor = (Math.cos(surfAngle - lightDir) + 1) * 0.5

        const edge = d > 0.9 ? (d - 0.9) / 0.15 : 0
        const t = lightFactor * (1 - edge * 0.5)

        let color
        if (t > 0.7) color = lerpMulti(STONE_LIGHT, (t - 0.7) / 0.3)
        else if (t > 0.35) color = lerpMulti(STONE_MID, (t - 0.35) / 0.35)
        else color = lerpMulti(STONE_DARK, t / 0.35)

        const grain = Math.sin(x * 2.3 + y * 3.7 + stone.angle * 10) * 0.5 + 0.5
        if (grain > 0.7 && d < 0.8) {
          color = lerp(color, '#4a4a60', 0.12)
        }

        let ch = ' '
        if (edge > 0.3) ch = SHADE[1]
        else if (grain > 0.85 && d < 0.6) ch = SHADE[0]

        canvas.setCell(x, y, ch, lerp(color, '#222230', 0.3), color)

        if (stone.moss && d < 0.7 && t > 0.4 && t < 0.65) {
          const mossNoise = Math.sin(x * 1.8 + y * 2.2 + stone.x) * 0.5 + 0.5
          if (mossNoise > 0.6) {
            const mossColor = lerpMulti(MOSS, mossNoise)
            const mossChar = mossNoise > 0.8 ? SHADE[1] : SHADE[0]
            canvas.setCell(x, y, mossChar, lerp(mossColor, '#1a2a10', 0.3), lerp(color, mossColor, 0.4))
          }
        }
      }
    }

    const shadowLen = stone.rx * 1.5
    for (let i = 1; i < shadowLen; i++) {
      const sx = Math.floor(stone.x + stone.rx + i * 0.8)
      const sy = Math.floor(stone.y + i * 0.3)
      if (sx >= w || sy >= h || sx < 0 || sy < 0) continue
      const sd = distToStone(sx, sy, stone)
      if (sd < 1.1) continue
      const fade = 1 - i / shadowLen
      const cell = canvas.getCell(sx, sy)
      if (cell && cell.bg) {
        canvas.setCell(sx, sy, ' ', null, lerp(cell.bg, '#0e0c04', fade * 0.35))
      }
    }
  }
}

function drawLeaf(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const lx = Math.floor(state.leaf.x + Math.sin(state.leaf.drift) * 3)
  const ly = Math.floor(state.leaf.y + Math.cos(state.leaf.drift * 0.7) * 1.5)

  if (lx < 1 || lx >= w - 1 || ly < 0 || ly >= h) return

  const colors = ['#8b2010', '#aa3018', '#cc4420']
  const t = (Math.sin(state.leaf.spin) + 1) * 0.5
  const leafColor = lerpMulti(colors, t)

  canvas.setCell(lx, ly, '✦', leafColor)
  canvas.setCell(lx - 1, ly, '~', lerp(leafColor, '#5a2008', 0.5))
}
