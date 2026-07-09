import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Sky Lanterns'
export const description = 'Paper lanterns ascend over a still lake into the summer night'
export const fps = 2

const SKY_TOP = ['#020014', '#060028', '#0a0040', '#100850']
const SKY_MID = ['#100850', '#181060', '#201870', '#282078']
const SKY_LOW = ['#282078', '#302868', '#383058', '#403848']
const HORIZON = ['#403848', '#484040', '#504838', '#585030']

const MTN_FAR = ['#0c0820', '#100c28', '#141030', '#181438']
const MTN_NEAR = ['#080614', '#0c0a1c', '#100e24', '#14122c']

const WATER_DEEP = ['#020010', '#040018', '#060020', '#080028']
const WATER_MID = ['#080028', '#0a0430', '#0c0838', '#0e0c40']
const WATER_SHORE = ['#0e0c40', '#100e44', '#121048', '#14124c']

const LANTERN_BODY = ['#cc6600', '#dd7710', '#ee8820', '#ff9930', '#ffaa44']
const LANTERN_GLOW = ['#331800', '#553000', '#884400', '#aa5500', '#cc7720']
const LANTERN_HOT = ['#ffcc44', '#ffdd66', '#ffee88', '#ffffaa', '#ffffcc']

const STAR_DIM = ['#334455', '#445566', '#556677']
const STAR_BRIGHT = ['#8899aa', '#aabbcc', '#ccddee', '#eeeeff']

const MIST = ['#1a1830', '#222040', '#2a2848', '#323050']

const ASPECT = 2.0

function makeLantern(w, h, waterY, index) {
  const zoneTop = 3
  const zoneBot = waterY - 3
  const y = zoneTop + Math.random() * (zoneBot - zoneTop)
  const x = 6 + Math.random() * (w - 12)
  return {
    x,
    y,
    baseY: zoneBot + Math.random() * 4,
    speed: 0.15 + Math.random() * 0.25,
    driftSpeed: 0.1 + Math.random() * 0.2,
    driftPhase: Math.random() * Math.PI * 2,
    driftAmp: 0.8 + Math.random() * 1.5,
    flickerPhase: Math.random() * Math.PI * 2,
    flickerSpeed: 1.5 + Math.random() * 2.5,
    size: 0.6 + Math.random() * 0.6,
    warmth: Math.random(),
    born: -Math.random() * 60,
  }
}

function makeStar(w, skyH) {
  return {
    x: Math.floor(Math.random() * w),
    y: Math.floor(Math.random() * skyH),
    brightness: 0.2 + Math.random() * 0.8,
    twinkleSpeed: 0.3 + Math.random() * 1.5,
    twinklePhase: Math.random() * Math.PI * 2,
  }
}

function makeMtnProfile(w, baseY, peakMin, peakMax, roughness) {
  const points = []
  let y = baseY - peakMin - Math.random() * (peakMax - peakMin)
  for (let x = 0; x <= w; x++) {
    y += (Math.random() - 0.5) * roughness
    const peak = baseY - peakMin - Math.random() * (peakMax - peakMin) * 0.1
    y = y * 0.95 + peak * 0.05
    y = Math.max(baseY - peakMax, Math.min(baseY - peakMin * 0.3, y))
    points.push(Math.floor(y))
  }
  return points
}

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height

  const waterY = Math.floor(h * 0.58)
  const horizonY = Math.floor(h * 0.48)

  const lanternCount = Math.max(18, Math.floor(w / 5))
  const lanterns = Array.from({ length: lanternCount }, (_, i) => makeLantern(w, h, waterY, i))

  const starCount = Math.max(50, Math.floor(w * 0.5))
  const stars = Array.from({ length: starCount }, () => makeStar(w, horizonY - 4))

  const mtnFar = makeMtnProfile(w, horizonY, 8, 22, 1.2)
  const mtnNear = makeMtnProfile(w, horizonY, 3, 14, 1.8)

  return { waterY, horizonY, lanterns, stars, mtnFar, mtnNear, phase: 0 }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  state.phase += 0.08
  const w = canvas.width

  for (const l of state.lanterns) {
    l.y -= l.speed * frame.dt * 3
    l.x += Math.sin(state.phase * l.driftSpeed + l.driftPhase) * l.driftAmp * frame.dt

    if (l.y < -5) {
      l.y = state.waterY + 2 + Math.random() * 4
      l.x = 6 + Math.random() * (w - 12)
      l.size = 0.6 + Math.random() * 0.6
      l.warmth = Math.random()
    }
  }

  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, time) {
  drawSky(canvas, state)
  drawStars(canvas, state, time)
  drawMountains(canvas, state)
  drawMist(canvas, state, time)
  drawWater(canvas, state, time)
  drawWaterReflections(canvas, state, time)
  drawLanterns(canvas, state, time)
}

function drawSky(canvas, state) {
  const w = canvas.width
  const { waterY } = state

  for (let y = 0; y < waterY; y++) {
    const t = y / waterY
    let color
    if (t < 0.3) color = lerpMulti(SKY_TOP, t / 0.3)
    else if (t < 0.65) color = lerpMulti(SKY_MID, (t - 0.3) / 0.35)
    else if (t < 0.85) color = lerpMulti(SKY_LOW, (t - 0.65) / 0.2)
    else color = lerpMulti(HORIZON, (t - 0.85) / 0.15)

    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawStars(canvas, state, time) {
  for (const star of state.stars) {
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5
    const b = star.brightness * (0.5 + twinkle * 0.5)
    if (b < 0.15) return

    const pal = b > 0.6 ? STAR_BRIGHT : STAR_DIM
    const color = lerpMulti(pal, Math.min(b, 1))
    const ch = b > 0.85 ? '✦' : b > 0.6 ? '·' : '⋅'
    canvas.setCell(star.x, star.y, ch, color)
  }
}

function drawMountains(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const { mtnFar, mtnNear, horizonY } = state

  for (let x = 0; x < w; x++) {
    const farTop = mtnFar[Math.min(x, mtnFar.length - 1)]
    for (let y = farTop; y <= horizonY; y++) {
      if (y < 0 || y >= h) continue
      const t = (y - farTop) / Math.max(1, horizonY - farTop)
      const color = lerpMulti(MTN_FAR, Math.min(t, 1))
      canvas.setCell(x, y, ' ', null, color)
    }
  }

  for (let x = 0; x < w; x++) {
    const nearTop = mtnNear[Math.min(x, mtnNear.length - 1)]
    for (let y = nearTop; y <= horizonY; y++) {
      if (y < 0 || y >= h) continue
      const t = (y - nearTop) / Math.max(1, horizonY - nearTop)
      const color = lerpMulti(MTN_NEAR, Math.min(t, 1))
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawMist(canvas, state, time) {
  const w = canvas.width
  const { horizonY } = state

  for (let dy = -3; dy <= 4; dy++) {
    const y = horizonY + dy
    if (y < 0 || y >= canvas.height) continue

    const intensity = Math.max(0, 1 - Math.abs(dy) / 4)
    for (let x = 0; x < w; x++) {
      const wave = Math.sin(x * 0.04 + time * 0.15 + dy * 0.5) * 0.3 +
                   Math.sin(x * 0.08 + time * 0.08) * 0.2
      const alpha = intensity * (0.15 + wave * 0.1)
      if (alpha < 0.02) continue

      const cell = canvas.getCell(x, y)
      if (cell && cell.bg) {
        const mistColor = lerpMulti(MIST, Math.max(0, Math.min(1, 0.5 + wave)))
        canvas.setCell(x, y, cell.char || ' ', cell.fg, lerp(cell.bg, mistColor, alpha))
      }
    }
  }
}

function drawWater(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { waterY } = state

  for (let y = waterY; y < h; y++) {
    const depth = (y - waterY) / (h - waterY)

    for (let x = 0; x < w; x++) {
      let color
      if (depth < 0.15) color = lerpMulti(WATER_SHORE, depth / 0.15)
      else if (depth < 0.5) color = lerpMulti(WATER_MID, (depth - 0.15) / 0.35)
      else color = lerpMulti(WATER_DEEP, Math.min(1, (depth - 0.5) / 0.5))

      const ripple = Math.sin(x * 0.12 + time * 0.3 + y * 0.2) * 0.08 +
                     Math.sin(x * 0.05 - time * 0.15 + y * 0.4) * 0.05
      if (ripple > 0.06 && depth < 0.3) {
        color = lerp(color, '#1a1850', 0.15)
        const ch = depth < 0.05 ? '~' : '∼'
        canvas.setCell(x, y, ch, lerp(color, '#2a2868', 0.3), color)
      } else {
        canvas.setCell(x, y, ' ', null, color)
      }
    }
  }
}

function drawWaterReflections(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { waterY, lanterns } = state

  for (const l of state.lanterns) {
    const lx = Math.floor(l.x)
    const ly = Math.floor(l.y)
    if (ly >= waterY || ly < 0) continue

    const distFromWater = waterY - ly
    const reflectionLen = Math.min(h - waterY, Math.floor(distFromWater * 1.2) + 3)

    const flicker = Math.sin(time * l.flickerSpeed + l.flickerPhase) * 0.15 + 0.85
    const glow = l.size * flicker

    for (let dy = 0; dy < reflectionLen; dy++) {
      const ry = waterY + dy + 1
      if (ry >= h) break

      const fade = Math.pow(1 - dy / reflectionLen, 1.5) * glow * 0.25
      const distortion = Math.sin(time * 0.4 + dy * 0.3 + lx * 0.1) * (1 + dy * 0.2)
      const spread = 1 + Math.floor(dy * 0.4)

      for (let dx = -spread; dx <= spread; dx++) {
        const rx = lx + dx + Math.floor(distortion)
        if (rx < 0 || rx >= w) continue

        const edgeFade = 1 - Math.abs(dx) / (spread + 1)
        const alpha = fade * edgeFade
        if (alpha < 0.01) continue

        const cell = canvas.getCell(rx, ry)
        if (cell && cell.bg) {
          const reflColor = lerpMulti(LANTERN_GLOW, Math.min(1, glow * 0.7))
          canvas.setCell(rx, ry, cell.char || ' ', cell.fg, lerp(cell.bg, reflColor, alpha))
        }
      }
    }
  }
}

function drawLanterns(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { waterY } = state

  const sorted = [...state.lanterns].sort((a, b) => b.y - a.y)

  for (const l of sorted) {
    const lx = Math.floor(l.x)
    const ly = Math.floor(l.y)
    if (ly >= waterY + 2 || ly < -3) continue

    const flicker = Math.sin(time * l.flickerSpeed + l.flickerPhase) * 0.12 + 0.88
    const glow = l.size * flicker

    const heightInSky = 1 - (ly / waterY)
    const distanceFade = 0.5 + heightInSky * 0.5

    const glowR = Math.floor(3 + l.size * 3)
    for (let dy = -glowR; dy <= glowR; dy++) {
      for (let dx = -glowR - 1; dx <= glowR + 1; dx++) {
        const px = lx + dx
        const py = ly + dy
        if (px < 0 || px >= w || py < 0 || py >= waterY) continue

        const dist = Math.sqrt(dx * dx + dy * dy * ASPECT * ASPECT) / glowR
        if (dist > 1.3) continue

        const falloff = Math.pow(Math.max(0, 1 - dist), 2) * glow * 0.2 * distanceFade
        if (falloff < 0.01) continue

        const cell = canvas.getCell(px, py)
        if (cell && cell.bg) {
          const glowColor = lerpMulti(LANTERN_GLOW, Math.min(1, (1 - dist) * 0.8 + l.warmth * 0.2))
          canvas.setCell(px, py, cell.char || ' ', cell.fg, lerp(cell.bg, glowColor, falloff))
        }
      }
    }

    const bodyH = l.size > 0.9 ? 3 : 2
    const bodyW = l.size > 0.9 ? 3 : 2

    for (let dy = 0; dy < bodyH; dy++) {
      const rowW = dy === 0 ? bodyW - 1 : (dy === bodyH - 1 ? bodyW - 1 : bodyW)
      const offset = dy === 0 ? 1 : (dy === bodyH - 1 ? 1 : 0)

      for (let dx = 0; dx < rowW; dx++) {
        const px = lx - Math.floor(rowW / 2) + dx + (offset > 0 ? 0 : 0)
        const py = ly + dy - Math.floor(bodyH / 2)
        if (px < 0 || px >= w || py < 0 || py >= waterY) continue

        const t = glow * distanceFade
        const bodyColor = lerpMulti(LANTERN_BODY, Math.min(t, 1))

        let ch
        if (dy === 0) {
          ch = dx === 0 ? '╭' : '╮'
        } else if (dy === bodyH - 1) {
          ch = dx === 0 ? '╰' : '╯'
        } else {
          ch = SHADE[Math.min(3, Math.floor(t * 3) + 1)]
        }

        const innerGlow = lerpMulti(LANTERN_HOT, Math.min(1, t * 0.6))
        canvas.setCell(px, py, ch, bodyColor, lerp(bodyColor, innerGlow, 0.3 * t))
      }
    }

    const corePx = lx
    const corePy = ly
    if (corePx >= 0 && corePx < w && corePy >= 0 && corePy < waterY) {
      const coreT = glow * distanceFade
      const coreColor = lerpMulti(LANTERN_HOT, Math.min(coreT, 1))
      canvas.setCell(corePx, corePy, '◉', coreColor, lerp('#aa5500', coreColor, 0.4))
    }
  }
}
