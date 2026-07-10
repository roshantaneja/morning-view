import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Aurora Borealis'
export const description = 'Polar light dances above the frozen tundra in midsummer silence'
export const fps = 3

const SKY_TOP = ['#010108', '#020210', '#030318', '#040420']
const SKY_MID = ['#040420', '#060828', '#081030', '#0a1838']
const SKY_LOW = ['#0a1838', '#0c2040', '#0e2848', '#103050']

const AURORA_GREEN = ['#002808', '#005818', '#00882a', '#10bb44', '#30ee66', '#60ff88', '#a0ffbb']
const AURORA_CYAN = ['#001828', '#003050', '#005878', '#0088aa', '#10bbcc', '#40ddee', '#80eeff']
const AURORA_PURPLE = ['#100028', '#200050', '#380880', '#5818aa', '#7830cc', '#9850dd', '#bb80ee']
const AURORA_PINK = ['#180010', '#380028', '#600848', '#881868', '#aa3888', '#cc60aa', '#dd88cc']

const MTN_FAR = ['#060810', '#081018', '#0a1420', '#0c1828']
const MTN_NEAR = ['#04060c', '#060a14', '#080e1c', '#0a1224']

const SNOW_GROUND = ['#1a2030', '#222838', '#2a3040', '#323848', '#3a4050']
const SNOW_BRIGHT = ['#404858', '#485068', '#505878', '#586088']
const TREE_DARK = ['#040608', '#060a10', '#080e18', '#0a1220']
const TREE_SNOW = ['#2a3040', '#323848', '#3a4050', '#424858']

const STAR_DIM = ['#334455', '#445566', '#556677']
const STAR_BRIGHT = ['#8899aa', '#aabbcc', '#ccddee', '#eeeeff']

const ASPECT = 2.0

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function noise1D(x, seed) {
  const ix = Math.floor(x)
  const fx = x - ix
  const t = fx * fx * (3 - 2 * fx)
  const rng = seededRandom(ix * 13 + seed * 7)
  const a = rng()
  const rng2 = seededRandom((ix + 1) * 13 + seed * 7)
  const b = rng2()
  return a + (b - a) * t
}

function auroraIntensity(x, w, phase, layerSeed) {
  const nx = x / w
  let val = 0
  val += Math.sin(nx * 3.0 + phase * 0.7 + layerSeed) * 0.3
  val += Math.sin(nx * 7.0 - phase * 1.1 + layerSeed * 2.3) * 0.2
  val += Math.sin(nx * 13.0 + phase * 0.5 + layerSeed * 4.1) * 0.15
  val += noise1D(nx * 5 + phase * 0.3, layerSeed) * 0.25
  val += 0.1
  return Math.max(0, Math.min(1, val))
}

function curtainHeight(x, w, phase, layerSeed) {
  const nx = x / w
  let h = 0.3
  h += Math.sin(nx * 4.0 + phase * 0.4 + layerSeed) * 0.12
  h += Math.sin(nx * 9.0 - phase * 0.8 + layerSeed * 3) * 0.08
  h += Math.sin(nx * 2.0 + phase * 0.2 + layerSeed * 5) * 0.1
  return Math.max(0.1, Math.min(0.5, h))
}

function mountainProfile(x, w, seed, scale) {
  let y = 0
  y += Math.sin(x / w * Math.PI * 2 * 1.5 + seed) * scale * 0.5
  y += Math.sin(x / w * Math.PI * 2 * 3.7 + seed * 2.1) * scale * 0.3
  y += Math.sin(x / w * Math.PI * 2 * 7.3 + seed * 3.7) * scale * 0.15
  y += Math.sin(x / w * Math.PI * 2 * 15.1 + seed * 5.3) * scale * 0.05
  return y
}

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height

  const rng = seededRandom(42)
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.floor(rng() * w),
    y: Math.floor(rng() * h * 0.45),
    bright: rng() > 0.6,
    twinkleSpeed: 0.5 + rng() * 2.0,
    twinkleOffset: rng() * Math.PI * 2,
    char: rng() > 0.85 ? '✦' : rng() > 0.7 ? '·' : '∘',
  }))

  const trees = []
  const treeZoneStart = Math.floor(h * 0.72)
  const treeZoneEnd = Math.floor(h * 0.82)
  for (let i = 0; i < Math.floor(w * 0.35); i++) {
    const tx = Math.floor(rng() * w)
    const ty = treeZoneStart + Math.floor(rng() * (treeZoneEnd - treeZoneStart))
    const treeH = 3 + Math.floor(rng() * 6)
    trees.push({ x: tx, y: ty, h: treeH, snow: rng() > 0.3 })
  }
  trees.sort((a, b) => a.y - b.y)

  return { phase: 0, stars, trees }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  state.phase += 0.06
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const { phase, stars, trees } = state

  const horizonY = Math.floor(h * 0.65)
  const mtnFarBase = Math.floor(h * 0.60)
  const mtnNearBase = Math.floor(h * 0.68)
  const snowLine = Math.floor(h * 0.72)

  for (let y = 0; y < h; y++) {
    const t = y / h
    let skyColor
    if (t < 0.25) {
      skyColor = lerpMulti(SKY_TOP, t / 0.25)
    } else if (t < 0.50) {
      skyColor = lerpMulti(SKY_MID, (t - 0.25) / 0.25)
    } else if (t < 0.65) {
      skyColor = lerpMulti(SKY_LOW, (t - 0.50) / 0.15)
    } else {
      skyColor = SKY_LOW[SKY_LOW.length - 1]
    }
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, skyColor)
    }
  }

  drawAurora(canvas, w, h, horizonY, phase)

  for (const star of stars) {
    if (star.y >= horizonY) continue
    const twinkle = Math.sin(elapsed * star.twinkleSpeed + star.twinkleOffset)
    const intensity = (twinkle + 1) / 2
    if (intensity < 0.2) continue
    const colors = star.bright ? STAR_BRIGHT : STAR_DIM
    const ct = Math.min(1, intensity)
    const color = lerpMulti(colors, ct)
    const cell = canvas.getCell(star.x, star.y)
    if (cell && cell.char === ' ') {
      canvas.setCell(star.x, star.y, star.char, color, cell.bg)
    }
  }

  drawMountains(canvas, w, h, mtnFarBase, mtnNearBase)

  drawGround(canvas, w, h, snowLine, phase)

  drawTrees(canvas, trees, phase)

  drawSnowParticles(canvas, w, h, snowLine, phase, elapsed)
}

function drawAurora(canvas, w, h, horizonY, phase) {
  const layers = [
    { palette: AURORA_GREEN, seed: 1.0, yOffset: 0, strength: 1.0 },
    { palette: AURORA_CYAN, seed: 2.7, yOffset: 0.04, strength: 0.7 },
    { palette: AURORA_PURPLE, seed: 4.3, yOffset: -0.03, strength: 0.5 },
    { palette: AURORA_PINK, seed: 6.1, yOffset: 0.06, strength: 0.35 },
  ]

  const auroraTop = Math.floor(h * 0.08)
  const auroraBase = Math.floor(h * 0.55)

  for (const layer of layers) {
    for (let x = 0; x < w; x++) {
      const intensity = auroraIntensity(x, w, phase, layer.seed) * layer.strength
      if (intensity < 0.05) continue

      const cHeight = curtainHeight(x, w, phase, layer.seed + 10)
      const baseY = auroraBase + Math.floor(layer.yOffset * h)
      const topY = baseY - Math.floor(cHeight * h)
      const clampedTop = Math.max(auroraTop, topY)
      const clampedBase = Math.min(horizonY - 2, baseY)

      for (let y = clampedTop; y <= clampedBase; y++) {
        const vertT = (y - clampedTop) / Math.max(1, clampedBase - clampedTop)
        let fade
        if (vertT < 0.15) {
          fade = vertT / 0.15
        } else if (vertT > 0.7) {
          fade = 1 - (vertT - 0.7) / 0.3
        } else {
          fade = 1
        }
        fade *= intensity

        const shimmer = Math.sin(x * 0.3 + y * 0.5 + phase * 2 + layer.seed) * 0.15 + 0.85
        fade *= shimmer

        if (fade < 0.03) continue

        const colorT = Math.max(0, Math.min(1, fade))
        const auroraColor = lerpMulti(layer.palette, colorT)

        const cell = canvas.getCell(x, y)
        if (!cell) continue
        const blended = lerp(cell.bg || '#040420', auroraColor, fade * 0.6)

        const charFade = fade * intensity
        let ch = ' '
        if (charFade > 0.5) ch = SHADE[3]
        else if (charFade > 0.35) ch = SHADE[2]
        else if (charFade > 0.2) ch = SHADE[1]
        else if (charFade > 0.1) ch = SHADE[0]

        const fgColor = lerpMulti(layer.palette, Math.min(1, colorT + 0.2))
        canvas.setCell(x, y, ch, fgColor, blended)
      }
    }
  }
}

function drawMountains(canvas, w, h, mtnFarBase, mtnNearBase) {
  for (let x = 0; x < w; x++) {
    const farH = mountainProfile(x, w, 3.14, h * 0.12)
    const farTop = Math.floor(mtnFarBase + farH)
    for (let y = farTop; y <= mtnNearBase + 4; y++) {
      if (y < 0 || y >= h) continue
      const t = (y - farTop) / Math.max(1, mtnNearBase - farTop)
      const color = lerpMulti(MTN_FAR, Math.min(1, t))
      canvas.setCell(x, y, BLOCK.full, color, color)
    }

    const nearH = mountainProfile(x, w, 7.28, h * 0.08)
    const nearTop = Math.floor(mtnNearBase + nearH)
    for (let y = nearTop; y <= mtnNearBase + 8; y++) {
      if (y < 0 || y >= h) continue
      const t = (y - nearTop) / Math.max(1, 8)
      const color = lerpMulti(MTN_NEAR, Math.min(1, t))
      canvas.setCell(x, y, BLOCK.full, color, color)
    }
  }
}

function drawGround(canvas, w, h, snowLine, phase) {
  for (let y = snowLine; y < h; y++) {
    const t = (y - snowLine) / (h - snowLine)
    for (let x = 0; x < w; x++) {
      const drift = Math.sin(x * 0.08 + y * 0.12 + 1.5) * 0.15
      const ct = Math.max(0, Math.min(1, t + drift))
      const color = lerpMulti(SNOW_GROUND, ct)

      const sparkle = Math.sin(x * 1.7 + y * 2.3 + phase * 0.5) * 0.5 + 0.5
      let ch = ' '
      if (sparkle > 0.92 && t < 0.3) {
        ch = '·'
        const bright = lerpMulti(SNOW_BRIGHT, sparkle)
        canvas.setCell(x, y, ch, bright, color)
      } else {
        canvas.setCell(x, y, ' ', null, color)
      }
    }
  }
}

function drawTrees(canvas, trees, phase) {
  for (const tree of trees) {
    const { x, y, h: treeH, snow } = tree

    for (let i = 0; i < treeH; i++) {
      const ty = y - i
      const spread = Math.max(0, Math.floor((treeH - i) * 0.6))
      if (i === treeH - 1) {
        const tipColor = snow ? lerpMulti(TREE_SNOW, 0.8) : lerpMulti(TREE_DARK, 0.3)
        canvas.setCell(x, ty, '▲', tipColor)
        continue
      }

      for (let dx = -spread; dx <= spread; dx++) {
        const px = x + dx
        if (px < 0 || px >= 200) continue
        const edgeFade = 1 - Math.abs(dx) / Math.max(1, spread)
        const heightFade = i / treeH

        if (i < 2) {
          const trunkColor = lerpMulti(TREE_DARK, 0.5)
          if (dx === 0) canvas.setCell(px, ty, '│', trunkColor)
          continue
        }

        const baseColor = lerpMulti(TREE_DARK, heightFade * 0.8)
        let ch = BLOCK.full
        let fg = baseColor

        if (snow && i >= treeH - 3 && edgeFade > 0.5) {
          const snowT = (treeH - i) / 3
          fg = lerpMulti(TREE_SNOW, Math.min(1, snowT))
          ch = i === treeH - 2 ? BLOCK.upper : SHADE[2]
        }

        canvas.setCell(px, ty, ch, fg, null)
      }
    }
  }
}

function drawSnowParticles(canvas, w, h, snowLine, phase, elapsed) {
  const rng = seededRandom(Math.floor(phase * 3) + 100)
  const count = Math.floor(w * 0.15)
  for (let i = 0; i < count; i++) {
    const baseX = rng() * w
    const baseY = rng() * (snowLine + 5)
    const drift = Math.sin(elapsed * 0.3 + i * 0.7) * 2
    const sx = Math.floor(baseX + drift) % w
    const sy = Math.floor(baseY + (phase * 8 + i * 3.7) % (snowLine + 5))
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue

    const cell = canvas.getCell(sx, sy)
    if (!cell) continue
    const alpha = 0.3 + rng() * 0.4
    if (cell.char !== ' ' && cell.char !== SHADE[0]) continue
    const snowChar = rng() > 0.5 ? '·' : '∘'
    const snowColor = lerp('#667788', '#bbccdd', rng())
    canvas.setCell(sx, sy, snowChar, snowColor, cell.bg)
  }
}
