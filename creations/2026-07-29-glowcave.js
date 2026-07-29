import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Glowcave'
export const description = 'Bioluminescent life pulses in the silence of an underground world'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const CAVE_DARK = ['#060404', '#0a0808', '#0e0a0a', '#120e0c']
const CAVE_ROCK = ['#141210', '#1c1816', '#24201c', '#2c2824', '#343028']
const CAVE_LIGHT = ['#3c3830', '#444038', '#4c4840', '#545048']
const STALACTITE = ['#181614', '#201e1a', '#282620', '#302e28', '#383630']
const STALACTITE_TIP = ['#444038', '#504c40', '#5c5848', '#686450']

const BIO_TEAL = ['#002818', '#004830', '#006848', '#009068', '#00b888', '#00e0a8', '#40ffc8']
const BIO_BLUE = ['#001830', '#003060', '#004890', '#0068c0', '#0088e0', '#20a8ff', '#60c8ff']
const BIO_GREEN = ['#002010', '#004020', '#006030', '#008040', '#00a050', '#20c070', '#60e0a0']
const BIO_PURPLE = ['#100830', '#201060', '#302080', '#4030a0', '#5040c0', '#7060e0', '#9080ff']
const BIO_CYAN = ['#001820', '#003040', '#004858', '#006878', '#008898', '#20a8b8', '#50c8d8']

const WATER = ['#020608', '#040a10', '#060e18', '#081220', '#0a1628']
const WATER_SURFACE = ['#0c1a30', '#0e1e38', '#102240', '#142a48']
const WATER_HIGHLIGHT = ['#183050', '#1c3858', '#204060', '#284868']
const REFLECTION_DIM = ['#001810', '#002818', '#003820', '#004828']

export function setup(canvas) {
  const rng = srand(729)
  const w = canvas.width
  const h = canvas.height

  const waterLine = Math.floor(h * 0.62)

  const stalactites = []
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rng() * w)
    const baseLen = 4 + Math.floor(rng() * 18)
    const width = 1 + Math.floor(rng() * 3)
    const wobble = (rng() - 0.5) * 0.3
    stalactites.push({ x, len: baseLen, width, wobble, seed: rng() * 1000 })
  }

  const stalagmites = []
  for (let i = 0; i < 25; i++) {
    const x = Math.floor(rng() * w)
    const baseLen = 3 + Math.floor(rng() * 10)
    const width = 1 + Math.floor(rng() * 3)
    stalagmites.push({ x, len: baseLen, width })
  }

  const ceilingProfile = []
  for (let x = 0; x < w; x++) {
    const base = 3 + Math.sin(x * 0.03) * 4 + Math.sin(x * 0.07 + 1) * 3 + Math.sin(x * 0.13 + 2) * 2
    const jitter = (rng() - 0.5) * 2
    ceilingProfile.push(Math.max(1, Math.floor(base + jitter)))
  }

  const wallLeftWidth = Math.floor(w * 0.06 + rng() * w * 0.04)
  const wallRightWidth = Math.floor(w * 0.06 + rng() * w * 0.04)

  const glowSpots = []
  for (let i = 0; i < 120; i++) {
    const zone = rng()
    let gx, gy
    if (zone < 0.35) {
      gx = Math.floor(rng() * w)
      gy = Math.floor(rng() * (waterLine * 0.3))
    } else if (zone < 0.6) {
      gx = Math.floor(rng() * wallLeftWidth * 1.5)
      gy = Math.floor(rng() * waterLine)
    } else if (zone < 0.85) {
      gx = w - 1 - Math.floor(rng() * wallRightWidth * 1.5)
      gy = Math.floor(rng() * waterLine)
    } else {
      gx = Math.floor(rng() * w)
      gy = Math.floor(waterLine * 0.7 + rng() * waterLine * 0.3)
    }
    const palette = [BIO_TEAL, BIO_BLUE, BIO_GREEN, BIO_PURPLE, BIO_CYAN][Math.floor(rng() * 5)]
    const radius = 1 + rng() * 4
    const intensity = 0.3 + rng() * 0.7
    const phase = rng() * Math.PI * 2
    const speed = 0.3 + rng() * 0.8
    const size = rng() < 0.3 ? 'cluster' : 'dot'
    glowSpots.push({ x: gx, y: gy, palette, radius, intensity, phase, speed, size })
  }

  const colonies = []
  for (let i = 0; i < 15; i++) {
    const cx = Math.floor(rng() * w)
    const cy = Math.floor(rng() * waterLine * 0.5)
    const palette = [BIO_TEAL, BIO_CYAN, BIO_GREEN][Math.floor(rng() * 3)]
    const points = []
    const count = 5 + Math.floor(rng() * 15)
    for (let j = 0; j < count; j++) {
      points.push({
        dx: Math.floor((rng() - 0.5) * 8),
        dy: Math.floor((rng() - 0.5) * 4),
        phase: rng() * Math.PI * 2,
      })
    }
    colonies.push({ x: cx, y: cy, palette, points, phase: rng() * Math.PI * 2 })
  }

  const ripples = []
  for (let i = 0; i < 8; i++) {
    ripples.push({
      x: Math.floor(w * 0.1 + rng() * w * 0.8),
      phase: rng() * Math.PI * 2,
      speed: 0.2 + rng() * 0.4,
      width: 3 + Math.floor(rng() * 8),
    })
  }

  return {
    stalactites, stalagmites, ceilingProfile,
    wallLeftWidth, wallRightWidth,
    glowSpots, colonies, ripples, waterLine,
  }
}

function drawCave(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const { ceilingProfile, wallLeftWidth, wallRightWidth, waterLine } = state

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (y < waterLine) {
        const depth = y / waterLine
        const col = lerpMulti(CAVE_DARK, depth * 0.3 + 0.1)
        canvas.setCell(x, y, ' ', null, col)
      } else {
        const wt = (y - waterLine) / (h - waterLine)
        const col = lerpMulti(WATER, Math.min(1, wt * 0.8 + 0.1))
        canvas.setCell(x, y, ' ', null, col)
      }
    }
  }

  for (let x = 0; x < w; x++) {
    const ceilH = ceilingProfile[x]
    for (let y = 0; y < ceilH && y < waterLine; y++) {
      const t = y / ceilH
      const col = lerpMulti(CAVE_ROCK, Math.min(1, t * 0.5))
      const ch = t < 0.3 ? BLOCK.full : t < 0.7 ? SHADE[2] : SHADE[1]
      canvas.setCell(x, y, ch, col, lerpMulti(CAVE_DARK, 0.2))
    }
  }

  for (let y = 0; y < waterLine; y++) {
    const t = y / waterLine
    const lwVariance = Math.sin(y * 0.15) * 2 + Math.sin(y * 0.08 + 1) * 1.5
    const lw = Math.max(1, Math.floor(wallLeftWidth * (1 - t * 0.3) + lwVariance))
    for (let x = 0; x < lw && x < w; x++) {
      const xt = x / lw
      const col = lerpMulti(CAVE_ROCK, Math.min(1, (1 - xt) * 0.6 + 0.2))
      const ch = xt < 0.5 ? BLOCK.full : xt < 0.8 ? SHADE[2] : SHADE[1]
      canvas.setCell(x, y, ch, col, lerpMulti(CAVE_DARK, 0.15))
    }

    const rwVariance = Math.sin(y * 0.12 + 2) * 2 + Math.sin(y * 0.09) * 1.5
    const rw = Math.max(1, Math.floor(wallRightWidth * (1 - t * 0.3) + rwVariance))
    for (let x = w - rw; x < w; x++) {
      const xt = (x - (w - rw)) / rw
      const col = lerpMulti(CAVE_ROCK, Math.min(1, xt * 0.6 + 0.2))
      const ch = xt > 0.5 ? BLOCK.full : xt > 0.2 ? SHADE[2] : SHADE[1]
      canvas.setCell(x, y, ch, col, lerpMulti(CAVE_DARK, 0.15))
    }
  }
}

function drawStalactites(canvas, state) {
  const { stalactites, ceilingProfile } = state
  const w = canvas.width

  for (const s of stalactites) {
    if (s.x < 0 || s.x >= w) continue
    const startY = ceilingProfile[Math.min(s.x, w - 1)]
    for (let dy = 0; dy < s.len; dy++) {
      const y = startY + dy
      if (y >= state.waterLine) break
      const t = dy / s.len
      const narrowing = Math.max(0, s.width - Math.floor(t * s.width))
      for (let dx = -narrowing; dx <= narrowing; dx++) {
        const px = s.x + dx
        if (px < 0 || px >= w) continue
        const col = lerpMulti(STALACTITE, Math.min(1, t * 0.8))
        const ch = t > 0.85 ? SHADE[0] : t > 0.6 ? SHADE[1] : SHADE[2]
        canvas.setCell(px, y, ch, col, lerpMulti(CAVE_DARK, 0.1))
      }
    }
    const tipY = startY + s.len - 1
    if (tipY < state.waterLine && s.x >= 0 && s.x < w) {
      canvas.setCell(s.x, tipY, BLOCK.lower, lerpMulti(STALACTITE_TIP, 0.5), null)
    }
  }
}

function drawStalagmites(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const { stalagmites, waterLine } = state

  for (const s of stalagmites) {
    if (s.x < 0 || s.x >= w) continue
    const baseY = h - 1
    for (let dy = 0; dy < s.len; dy++) {
      const y = baseY - dy
      if (y < waterLine) break
      const t = dy / s.len
      const narrowing = Math.max(0, s.width - Math.floor(t * s.width))
      for (let dx = -narrowing; dx <= narrowing; dx++) {
        const px = s.x + dx
        if (px < 0 || px >= w) continue
        const col = lerpMulti(STALACTITE, Math.min(1, (1 - t) * 0.6 + 0.2))
        const ch = t > 0.8 ? SHADE[0] : t > 0.5 ? SHADE[1] : SHADE[2]
        canvas.setCell(px, y, ch, col, lerpMulti(WATER, 0.3))
      }
    }
    const tipY = baseY - s.len + 1
    if (tipY >= waterLine && s.x >= 0 && s.x < w) {
      canvas.setCell(s.x, tipY, BLOCK.upper, lerpMulti(STALACTITE_TIP, 0.3), null)
    }
  }
}

function drawGlow(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const { glowSpots, colonies, waterLine } = state

  for (const spot of glowSpots) {
    const pulse = Math.sin(elapsed * spot.speed + spot.phase) * 0.5 + 0.5
    const brightness = spot.intensity * (0.4 + pulse * 0.6)
    if (brightness < 0.15) continue

    const colorIdx = Math.min(spot.palette.length - 1, Math.floor(brightness * (spot.palette.length - 1)))
    const col = spot.palette[colorIdx]

    if (spot.size === 'cluster') {
      const r = Math.ceil(spot.radius * brightness)
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r * 2; dx <= r * 2; dx++) {
          const px = spot.x + dx
          const py = spot.y + dy
          if (px < 0 || px >= w || py < 0 || py >= waterLine) continue
          const dist = Math.sqrt((dx / 2) ** 2 + dy ** 2) / r
          if (dist > 1) continue
          const falloff = (1 - dist) * brightness
          if (falloff < 0.1) continue
          const ci = Math.min(spot.palette.length - 1, Math.floor(falloff * (spot.palette.length - 1)))
          const char = falloff > 0.7 ? BLOCK.full : falloff > 0.4 ? SHADE[2] : falloff > 0.2 ? SHADE[1] : SHADE[0]
          canvas.setCell(px, py, char, spot.palette[ci], null)
        }
      }
    } else {
      if (spot.x >= 0 && spot.x < w && spot.y >= 0 && spot.y < waterLine) {
        const char = brightness > 0.6 ? BLOCK.full : brightness > 0.3 ? SHADE[2] : SHADE[1]
        canvas.setCell(spot.x, spot.y, char, col, null)
      }
    }
  }

  for (const colony of colonies) {
    const colPulse = Math.sin(elapsed * 0.5 + colony.phase) * 0.3 + 0.7
    for (const pt of colony.points) {
      const px = colony.x + pt.dx
      const py = colony.y + pt.dy
      if (px < 0 || px >= w || py < 0 || py >= waterLine) continue
      const ptPulse = Math.sin(elapsed * 0.8 + pt.phase) * 0.5 + 0.5
      const brightness = colPulse * (0.3 + ptPulse * 0.7)
      if (brightness < 0.2) continue
      const ci = Math.min(colony.palette.length - 1, Math.floor(brightness * (colony.palette.length - 1)))
      const char = brightness > 0.7 ? '*' : brightness > 0.5 ? SHADE[2] : brightness > 0.3 ? SHADE[1] : '.'
      canvas.setCell(px, py, char, colony.palette[ci], null)
    }
  }
}

function drawWaterSurface(canvas, state, elapsed) {
  const w = canvas.width
  const { ripples, waterLine } = state

  for (let x = 3; x < w - 3; x++) {
    const waveOffset = Math.sin(x * 0.08 + elapsed * 0.6) * 0.3
      + Math.sin(x * 0.15 + elapsed * 0.3 + 1) * 0.2
    const surfY = waterLine + Math.round(waveOffset)
    if (surfY >= 0 && surfY < canvas.height) {
      const shimmer = Math.sin(x * 0.2 + elapsed * 1.2) * 0.5 + 0.5
      const col = lerpMulti(WATER_SURFACE, shimmer)
      const char = shimmer > 0.7 ? '~' : shimmer > 0.4 ? '≈' : '―'
      canvas.setCell(x, surfY, char, lerpMulti(WATER_HIGHLIGHT, shimmer), col)
    }
  }

  for (const ripple of ripples) {
    const rPhase = Math.sin(elapsed * ripple.speed + ripple.phase)
    const rY = waterLine + Math.round(rPhase * 0.5)
    for (let dx = -ripple.width; dx <= ripple.width; dx++) {
      const rx = ripple.x + dx
      if (rx < 3 || rx >= w - 3) continue
      if (rY < 0 || rY >= canvas.height) continue
      const fade = 1 - Math.abs(dx) / ripple.width
      if (fade < 0.2) continue
      const col = lerpMulti(WATER_HIGHLIGHT, fade * 0.6)
      canvas.setCell(rx, rY, '~', col, null)
    }
  }
}

function drawReflections(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const { glowSpots, waterLine } = state

  for (const spot of glowSpots) {
    if (spot.intensity < 0.3) continue
    const pulse = Math.sin(elapsed * spot.speed * 0.7 + spot.phase + 1) * 0.5 + 0.5
    const brightness = spot.intensity * pulse * 0.4

    const reflY = waterLine + (waterLine - spot.y)
    const wobble = Math.sin(elapsed * 0.8 + spot.x * 0.1) * 2

    for (let dy = 0; dy < 4; dy++) {
      const ry = reflY + dy
      if (ry < waterLine || ry >= h) continue
      const rx = Math.round(spot.x + wobble * (dy * 0.3))
      if (rx < 0 || rx >= w) continue
      const fade = brightness * (1 - dy * 0.25)
      if (fade < 0.05) continue
      const ci = Math.min(spot.palette.length - 1, Math.floor(fade * (spot.palette.length - 1)))
      const char = fade > 0.3 ? SHADE[1] : SHADE[0]
      canvas.setCell(rx, ry, char, spot.palette[ci], null)
    }
  }
}

function drawDrips(canvas, state, elapsed) {
  const w = canvas.width
  const { stalactites, ceilingProfile, waterLine } = state

  for (let i = 0; i < stalactites.length; i++) {
    const s = stalactites[i]
    if (s.x < 0 || s.x >= w) continue
    const startY = ceilingProfile[Math.min(s.x, w - 1)]
    const tipY = startY + s.len

    const period = 4 + (s.seed % 6)
    const dripT = ((elapsed + s.seed) % period) / period
    if (dripT > 0.5) continue

    const dripY = Math.floor(tipY + dripT * (waterLine - tipY) * 2)
    if (dripY >= waterLine || dripY < 0) continue

    const fade = 1 - dripT * 2
    const col = lerpMulti(BIO_CYAN, Math.min(1, fade * 0.7))
    if (dripY < canvas.height) {
      canvas.setCell(s.x, dripY, '·', col, null)
    }
    if (dripY - 1 >= tipY && dripY - 1 < canvas.height) {
      canvas.setCell(s.x, dripY - 1, '.', lerpMulti(BIO_CYAN, fade * 0.3), null)
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, elapsed) {
  drawCave(canvas, state, elapsed)
  drawStalactites(canvas, state)
  drawStalagmites(canvas, state)
  drawGlow(canvas, state, elapsed)
  drawWaterSurface(canvas, state, elapsed)
  drawReflections(canvas, state, elapsed)
  drawDrips(canvas, state, elapsed)
}
