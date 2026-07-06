import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Neon Rain'
export const description = 'City lights bleed through the downpour on a sleepless street'
export const fps = 3

const SKY = ['#020408', '#040810', '#060c18', '#081020']
const BUILDING_DARK = ['#08080c', '#0a0a10', '#0c0c14', '#0e0e18']
const BUILDING_MID = ['#101018', '#12121c', '#141420', '#161624']
const WINDOW_WARM = ['#332200', '#664400', '#997722', '#ccaa44', '#eedd66']
const WINDOW_COOL = ['#001133', '#002255', '#003388', '#1155aa', '#3388cc']
const NEON_PINK = ['#200010', '#440028', '#881050', '#cc2080', '#ff40b0', '#ff80d0']
const NEON_CYAN = ['#001018', '#002838', '#005060', '#008888', '#00ccbb', '#44ffee']
const NEON_PURPLE = ['#100020', '#280048', '#481080', '#6828bb', '#8848dd', '#aa80ff']
const RAIN_COLOR = ['#1a2030', '#2a3448', '#3a4860', '#4a5c78']
const PUDDLE = ['#060810', '#0a1018', '#0e1420', '#121828']
const LAMP_GLOW = ['#1a1408', '#2a2410', '#3a3418', '#4a4420', '#5a5428']

const RAIN_CHARS = ['│', '┃', '╎', '┊', '┆', '|']
const SPLASH_CHARS = ['·', '∘', '°', '⋅']

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height
  const groundY = Math.floor(h * 0.82)

  const buildings = generateBuildings(w, h, groundY)
  const neonSigns = generateNeonSigns(w, buildings)
  const streetLamps = generateStreetLamps(w, groundY)
  const raindrops = Array.from({ length: Math.floor(w * 1.8) }, () => spawnRain(w, h))
  const splashes = []

  const windowStates = new Map()
  for (const b of buildings) {
    for (const win of b.windows) {
      const key = `${win.x},${win.y}`
      windowStates.set(key, {
        lit: Math.random() > 0.45,
        brightness: 0.3 + Math.random() * 0.7,
        warm: Math.random() > 0.25,
        flickerSpeed: 0.5 + Math.random() * 3,
        flickerPhase: Math.random() * Math.PI * 2,
        nextToggle: 3 + Math.random() * 15,
      })
    }
  }

  return { groundY, buildings, neonSigns, streetLamps, raindrops, splashes, windowStates }
}

function generateBuildings(w, h, groundY) {
  const buildings = []
  let x = -2

  while (x < w + 2) {
    const bw = 8 + Math.floor(Math.random() * 14)
    const bh = 15 + Math.floor(Math.random() * (groundY * 0.7))
    const depth = Math.random()
    const hasRoof = Math.random() > 0.4
    const roofStyle = Math.random() > 0.5 ? 'flat' : 'pointed'

    const windows = []
    const winSpacingX = 3 + Math.floor(Math.random() * 2)
    const winSpacingY = 3 + Math.floor(Math.random() * 2)
    const winW = 1 + (Math.random() > 0.6 ? 1 : 0)
    const winH = 1

    for (let wy = groundY - bh + 3; wy < groundY - 2; wy += winSpacingY) {
      for (let wx = x + 2; wx < x + bw - 2; wx += winSpacingX) {
        windows.push({ x: wx, y: wy, w: winW, h: winH })
      }
    }

    buildings.push({ x, w: bw, h: bh, topY: groundY - bh, depth, hasRoof, roofStyle, windows })
    x += bw + Math.floor(Math.random() * 3)
  }

  buildings.sort((a, b) => a.depth - b.depth)
  return buildings
}

function generateNeonSigns(w, buildings) {
  const signs = []
  const usedBuildings = new Set()

  const count = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count && i < buildings.length; i++) {
    const bi = Math.floor(Math.random() * buildings.length)
    if (usedBuildings.has(bi)) continue
    usedBuildings.add(bi)

    const b = buildings[bi]
    if (b.w < 10) continue

    const palettes = [NEON_PINK, NEON_CYAN, NEON_PURPLE]
    const palette = palettes[Math.floor(Math.random() * palettes.length)]
    const sy = b.topY + 4 + Math.floor(Math.random() * Math.min(8, b.h * 0.3))
    const sx = b.x + 2 + Math.floor(Math.random() * Math.max(1, b.w - 8))
    const sw = 3 + Math.floor(Math.random() * Math.min(5, b.w - 6))

    signs.push({
      x: sx, y: sy, w: sw, h: 2,
      palette,
      pulseSpeed: 0.3 + Math.random() * 1.2,
      pulsePhase: Math.random() * Math.PI * 2,
      glowRadius: 3 + Math.floor(Math.random() * 3),
      style: Math.floor(Math.random() * 3),
    })
  }

  return signs
}

function generateStreetLamps(w, groundY) {
  const lamps = []
  for (let x = 6; x < w - 6; x += 12 + Math.floor(Math.random() * 8)) {
    lamps.push({ x, y: groundY - 6, glowR: 5 + Math.floor(Math.random() * 3) })
  }
  return lamps
}

function spawnRain(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    speed: 1.5 + Math.random() * 2.5,
    length: 1 + Math.floor(Math.random() * 3),
    char: RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)],
    drift: (Math.random() - 0.5) * 0.3,
    brightness: 0.2 + Math.random() * 0.4,
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const t = frame.elapsed
  const w = canvas.width
  const h = canvas.height

  for (const r of state.raindrops) {
    r.y += r.speed
    r.x += r.drift

    if (r.y > state.groundY + 2) {
      if (Math.random() > 0.7) {
        state.splashes.push({
          x: Math.floor(r.x),
          y: state.groundY,
          life: 0.5 + Math.random() * 0.3,
          age: 0,
        })
      }
      r.y = -r.length - Math.random() * 10
      r.x = Math.random() * w
    }
    if (r.x < -2) r.x = w + 1
    if (r.x > w + 2) r.x = -1
  }

  for (let i = state.splashes.length - 1; i >= 0; i--) {
    state.splashes[i].age += frame.dt
    if (state.splashes[i].age > state.splashes[i].life) {
      state.splashes.splice(i, 1)
    }
  }
  if (state.splashes.length > 60) state.splashes.splice(0, state.splashes.length - 60)

  for (const [key, ws] of state.windowStates) {
    ws.nextToggle -= frame.dt
    if (ws.nextToggle <= 0) {
      ws.lit = !ws.lit
      ws.nextToggle = 5 + Math.random() * 20
    }
  }

  canvas.clear()
  drawScene(canvas, state, t)
}

function drawScene(canvas, state, time) {
  drawSky(canvas, state, time)
  drawBuildings(canvas, state, time)
  drawNeonSigns(canvas, state, time)
  drawStreetLamps(canvas, state, time)
  drawGround(canvas, state, time)
  drawReflections(canvas, state, time)
  drawRain(canvas, state, time)
  drawSplashes(canvas, state, time)
}

function drawSky(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height

  for (let y = 0; y < h; y++) {
    const t = Math.pow(y / h, 0.5)
    const color = lerpMulti(SKY, t)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawBuildings(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { buildings, groundY, windowStates } = state

  for (const b of buildings) {
    const pal = b.depth > 0.5 ? BUILDING_DARK : BUILDING_MID
    const depthDim = b.depth * 0.4

    for (let y = b.topY; y < groundY; y++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        if (x < 0 || x >= w || y < 0 || y >= h) continue

        const edge = (x === b.x || x === b.x + b.w - 1) ? 0.15 : 0
        const noise = Math.sin(x * 2.1 + y * 1.3) * 0.1 + Math.sin(x * 0.7 + y * 3.1) * 0.08
        const t = Math.max(0, Math.min(1, 0.4 + noise - edge - depthDim))
        const color = lerpMulti(pal, t)
        canvas.setCell(x, y, ' ', null, color)
      }
    }

    if (b.hasRoof && b.roofStyle === 'pointed') {
      const mid = Math.floor(b.x + b.w / 2)
      const peakY = b.topY - 3
      for (let dy = 0; dy < 3; dy++) {
        const rowW = Math.floor(b.w * (1 - dy / 3) / 2)
        for (let dx = -rowW; dx <= rowW; dx++) {
          const px = mid + dx
          const py = b.topY - dy
          if (px < 0 || px >= w || py < 0) continue
          const t = Math.max(0, Math.min(1, 0.3 - depthDim))
          canvas.setCell(px, py, ' ', null, lerpMulti(pal, t))
        }
      }
    }

    for (const win of b.windows) {
      const key = `${win.x},${win.y}`
      const ws = windowStates.get(key)
      if (!ws || !ws.lit) {
        for (let dy = 0; dy < win.h; dy++) {
          for (let dx = 0; dx < win.w; dx++) {
            const px = win.x + dx
            const py = win.y + dy
            if (px < 0 || px >= w || py < 0 || py >= h) continue
            canvas.setCell(px, py, ' ', null, '#06060a')
          }
        }
        continue
      }

      const flicker = Math.sin(time * ws.flickerSpeed + ws.flickerPhase) * 0.1
      const bright = Math.max(0.2, Math.min(1, ws.brightness + flicker))
      const pal = ws.warm ? WINDOW_WARM : WINDOW_COOL

      for (let dy = 0; dy < win.h; dy++) {
        for (let dx = 0; dx < win.w; dx++) {
          const px = win.x + dx
          const py = win.y + dy
          if (px < 0 || px >= w || py < 0 || py >= h) continue
          const color = lerpMulti(pal, bright * 0.7 + 0.1)
          canvas.setCell(px, py, SHADE[Math.min(3, Math.floor(bright * 3))], color, lerp('#060608', color, 0.3))
        }
      }

      const glowR = 1 + Math.floor(bright * 1.5)
      for (let dy = -glowR; dy <= glowR; dy++) {
        for (let dx = -glowR; dx <= glowR; dx++) {
          if (dx === 0 && dy === 0) continue
          const px = win.x + dx
          const py = win.y + dy
          if (px < 0 || px >= w || py < 0 || py >= h) continue
          const dist = Math.sqrt(dx * dx + dy * dy * 4) / glowR
          if (dist > 1.5) continue
          const falloff = Math.max(0, 1 - dist) * bright * 0.15
          const cell = canvas.getCell(px, py)
          if (cell && cell.bg) {
            const glowColor = lerpMulti(pal, 0.4)
            canvas.setCell(px, py, cell.char || ' ', cell.fg, lerp(cell.bg, glowColor, falloff))
          }
        }
      }
    }
  }
}

function drawNeonSigns(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height

  for (const sign of state.neonSigns) {
    const pulse = Math.sin(time * sign.pulseSpeed + sign.pulsePhase)
    const brightness = 0.4 + pulse * 0.3 + Math.abs(pulse) * 0.3

    const neonChars = sign.style === 0 ? '═══' : sign.style === 1 ? '▬▬▬' : '━━━'

    for (let dy = 0; dy < sign.h; dy++) {
      for (let dx = 0; dx < sign.w; dx++) {
        const px = sign.x + dx
        const py = sign.y + dy
        if (px < 0 || px >= w || py < 0 || py >= h) continue

        const color = lerpMulti(sign.palette, brightness * 0.6 + 0.2)
        const ch = dy === 0 ? neonChars[dx % neonChars.length] : ' '
        canvas.setCell(px, py, ch, color, lerp('#08080c', color, brightness * 0.15))
      }
    }

    for (let dy = -sign.glowRadius; dy <= sign.glowRadius; dy++) {
      for (let dx = -sign.glowRadius - 1; dx <= sign.w + sign.glowRadius; dx++) {
        const px = sign.x + dx
        const py = sign.y + dy
        if (px < 0 || px >= w || py < 0 || py >= h) continue
        if (dx >= 0 && dx < sign.w && dy >= 0 && dy < sign.h) continue

        const distX = dx < 0 ? -dx : dx >= sign.w ? dx - sign.w + 1 : 0
        const distY = dy < 0 ? -dy : dy >= sign.h ? dy - sign.h + 1 : 0
        const dist = Math.sqrt(distX * distX + distY * distY * 4) / sign.glowRadius
        if (dist > 1.2) continue

        const falloff = Math.max(0, 1 - dist) * brightness * 0.2
        if (falloff < 0.02) continue

        const cell = canvas.getCell(px, py)
        if (cell && cell.bg) {
          const glowColor = lerpMulti(sign.palette, 0.5)
          canvas.setCell(px, py, cell.char || ' ', cell.fg, lerp(cell.bg, glowColor, falloff))
        }
      }
    }
  }
}

function drawStreetLamps(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { groundY } = state

  for (const lamp of state.streetLamps) {
    const lx = lamp.x
    const ly = lamp.y

    for (let y = ly; y < groundY; y++) {
      if (lx >= 0 && lx < w && y >= 0 && y < h) {
        canvas.setCell(lx, y, '│', '#2a2a30')
      }
    }
    if (lx >= 0 && lx < w && ly >= 0 && ly < h) {
      canvas.setCell(lx, ly, '◯', '#aaaa70')
    }
    if (lx - 1 >= 0 && ly >= 0 && ly < h) {
      canvas.setCell(lx - 1, ly, '─', '#2a2a30')
    }
    if (lx + 1 < w && ly >= 0 && ly < h) {
      canvas.setCell(lx + 1, ly, '─', '#2a2a30')
    }

    const flicker = 0.85 + Math.sin(time * 2.5 + lamp.x * 0.3) * 0.15
    for (let dy = -lamp.glowR; dy <= lamp.glowR + 4; dy++) {
      for (let dx = -lamp.glowR - 2; dx <= lamp.glowR + 2; dx++) {
        const px = lx + dx
        const py = ly + dy
        if (px < 0 || px >= w || py < 0 || py >= h) continue

        const dist = Math.sqrt(dx * dx * 0.8 + dy * dy * 1.5) / lamp.glowR
        if (dist > 1.5) continue

        const falloff = Math.max(0, 1 - dist) * flicker * 0.18
        if (falloff < 0.01) continue

        const cell = canvas.getCell(px, py)
        if (cell && cell.bg) {
          const glowColor = lerpMulti(LAMP_GLOW, Math.min(1, (1 - dist) * 1.5))
          canvas.setCell(px, py, cell.char || ' ', cell.fg, lerp(cell.bg, glowColor, falloff))
        }
      }
    }
  }
}

function drawGround(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { groundY } = state

  for (let y = groundY; y < h; y++) {
    const depth = (y - groundY) / (h - groundY)
    for (let x = 0; x < w; x++) {
      const wetness = Math.sin(x * 0.4 + y * 0.8 + time * 0.2) * 0.15 + 0.5
      const t = Math.max(0, Math.min(1, depth * 0.6 + wetness * 0.2))
      const color = lerpMulti(PUDDLE, t)
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawReflections(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const { groundY, neonSigns, streetLamps } = state

  const reflectionZone = h - groundY

  for (const sign of neonSigns) {
    const pulse = Math.sin(time * sign.pulseSpeed + sign.pulsePhase)
    const brightness = 0.4 + pulse * 0.3 + Math.abs(pulse) * 0.3

    for (let dy = 0; dy < Math.min(reflectionZone, sign.glowRadius + 4); dy++) {
      for (let dx = -2; dx < sign.w + 2; dx++) {
        const px = sign.x + dx
        const py = groundY + dy
        if (px < 0 || px >= w || py >= h) continue

        const distortion = Math.sin(time * 0.5 + dx * 0.3 + dy * 0.7) * 1.5
        const rpx = px + Math.floor(distortion)
        if (rpx < 0 || rpx >= w) continue

        const fade = Math.max(0, 1 - dy / (reflectionZone * 0.8))
        const spread = Math.max(0, 1 - Math.abs(dx - sign.w / 2) / (sign.w * 0.8))
        const str = fade * spread * brightness * 0.12

        if (str < 0.01) continue
        const cell = canvas.getCell(rpx, py)
        if (cell && cell.bg) {
          const refColor = lerpMulti(sign.palette, 0.4)
          canvas.setCell(rpx, py, cell.char || ' ', cell.fg, lerp(cell.bg, refColor, str))
        }
      }
    }
  }

  for (const lamp of streetLamps) {
    for (let dy = 0; dy < Math.min(reflectionZone, 8); dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const px = lamp.x + dx
        const py = groundY + dy
        if (px < 0 || px >= w || py >= h) continue

        const distortion = Math.sin(time * 0.4 + dx * 0.5 + dy * 0.6) * 0.8
        const rpx = px + Math.floor(distortion)
        if (rpx < 0 || rpx >= w) continue

        const fade = Math.max(0, 1 - dy / 8)
        const spread = Math.max(0, 1 - Math.abs(dx) / 3)
        const str = fade * spread * 0.1

        if (str < 0.01) continue
        const cell = canvas.getCell(rpx, py)
        if (cell && cell.bg) {
          canvas.setCell(rpx, py, cell.char || ' ', cell.fg, lerp(cell.bg, '#3a3418', str))
        }
      }
    }
  }

  for (let x = 0; x < w; x++) {
    const reflectY = groundY + 1 + Math.floor(Math.random() * 2)
    if (reflectY >= h) continue

    const sourceY = groundY - 1 - Math.floor(Math.random() * 3)
    if (sourceY < 0) continue

    const srcCell = canvas.getCell(x, sourceY)
    if (!srcCell || !srcCell.bg) continue

    const cell = canvas.getCell(x, reflectY)
    if (cell && cell.bg) {
      const ripple = Math.sin(time * 0.3 + x * 0.2) * 0.5 + 0.5
      canvas.setCell(x, reflectY, ' ', null, lerp(cell.bg, srcCell.bg, 0.06 * ripple))
    }
  }
}

function drawRain(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height

  for (const r of state.raindrops) {
    for (let i = 0; i < r.length; i++) {
      const rx = Math.floor(r.x)
      const ry = Math.floor(r.y - i)
      if (rx < 0 || rx >= w || ry < 0 || ry >= h) continue

      const fade = 1 - i / r.length
      const color = lerpMulti(RAIN_COLOR, r.brightness * fade)
      canvas.setCell(rx, ry, r.char, color)
    }
  }
}

function drawSplashes(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height

  for (const s of state.splashes) {
    const progress = s.age / s.life
    const radius = Math.floor(progress * 2)
    const fade = 1 - progress

    for (let dx = -radius; dx <= radius; dx++) {
      const px = s.x + dx
      const py = s.y
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      if (Math.abs(dx) === radius || dx === 0) {
        const color = lerp('#1a2030', '#3a4860', fade * 0.5)
        const ch = SPLASH_CHARS[Math.min(SPLASH_CHARS.length - 1, Math.floor(progress * SPLASH_CHARS.length))]
        canvas.setCell(px, py, ch, color)
      }
    }
  }
}
