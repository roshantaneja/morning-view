import { hex, bgHex, lerp, lerpMulti, BLOCK, SHADE } from '../src/theme.js'

export const title = 'The Keeper's Light'
export const description = 'A beam sweeps through sea fog — somewhere beyond the mist, ships find their way home'
export const fps = 3

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const SKY = ['#020810', '#030c18', '#041020', '#051428', '#061830']
const FOG_BASE = '#1a2030'
const SEA = ['#020c14', '#031018', '#04141e', '#051820', '#041418']
const FOAM = '#8899aa'
const ROCK = ['#0c0a08', '#141210', '#1c1a16', '#24221c']
const LAMP = '#ffe8a0'
const BEAM = '#ffe0a0'
const TOWER_DARK = '#2a2825'
const TOWER_LIGHT = '#403c38'
const TOWER_BAND = '#cc2020'

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(917)

  const horizon = Math.floor(H * 0.58)
  const towerX = Math.floor(W * 0.72)
  const towerBase = horizon - 2
  const towerTop = Math.floor(H * 0.12)
  const towerW = Math.max(4, Math.floor(W * 0.04))
  const lampY = towerTop
  const lampX = towerX

  const cliffTop = horizon - 1
  const cliffLeft = Math.floor(W * 0.56)

  const stars = []
  for (let i = 0; i < 120; i++) {
    const sx = Math.floor(rng() * W)
    const sy = Math.floor(rng() * (horizon - 8))
    if (sx > cliffLeft - 5 && sx < W * 0.88 && sy > towerTop - 5) continue
    stars.push({
      x: sx, y: sy,
      b: 0.2 + rng() * 0.8,
      ph: rng() * TAU,
      sp: 0.3 + rng() * 1.8,
    })
  }

  const fogLayers = []
  for (let i = 0; i < 40; i++) {
    fogLayers.push({
      y: Math.floor(horizon * 0.3 + rng() * horizon * 0.65),
      x: rng() * W,
      w: 8 + rng() * 25,
      d: 0.03 + rng() * 0.12,
      sp: 0.08 + rng() * 0.3,
      ph: rng() * TAU,
    })
  }

  const waves = []
  for (let i = 0; i < 14; i++) {
    waves.push({
      y: horizon + 2 + Math.floor(rng() * (H - horizon - 6)),
      ph: rng() * TAU,
      sp: 0.15 + rng() * 0.4,
      amp: 2 + rng() * 6,
      len: 0.02 + rng() * 0.06,
    })
  }

  const cliffProfile = []
  for (let x = 0; x < W; x++) {
    if (x < cliffLeft) {
      cliffProfile[x] = H
    } else {
      const t = (x - cliffLeft) / (W - cliffLeft)
      const base = cliffTop - Math.floor(t * t * 6)
      const noise = Math.sin(x * 0.8) * 1.5 + Math.sin(x * 2.1) * 0.8
      cliffProfile[x] = Math.floor(base + noise)
    }
  }

  return {
    W, H, horizon, towerX, towerBase, towerTop, towerW,
    lampX, lampY, cliffLeft, cliffProfile,
    stars, fogLayers, waves,
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }

function draw(canvas, state, t) {
  const {
    W, H, horizon, towerX, towerBase, towerTop, towerW,
    lampX, lampY, cliffLeft, cliffProfile,
    stars, fogLayers, waves,
  } = state

  const beamAngle = ((t * 0.25) % 1) * TAU
  const beamDirX = Math.cos(beamAngle)
  const beamDirY = Math.sin(beamAngle)
  const beamActive = beamDirY < 0.3

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y < horizon) {
        const skyT = y / horizon
        const base = lerpMulti(SKY, skyT)
        canvas.setCell(x, y, ' ', null, bgHex(base))
      } else {
        const seaT = (y - horizon) / (H - horizon)
        const base = lerpMulti(SEA, seaT)
        canvas.setCell(x, y, ' ', null, bgHex(base))
      }
    }
  }

  for (const s of stars) {
    const flicker = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))
    const v = Math.floor(20 + s.b * flicker * 55)
    const ch = s.b > 0.7 ? '✦' : '·'
    canvas.setCell(s.x, s.y, ch, hex(col(v, v, v + 8)))
  }

  if (beamActive) {
    drawBeam(canvas, state, t, beamAngle)
  }

  for (const fog of fogLayers) {
    const drift = Math.sin(t * fog.sp + fog.ph) * 3
    const cx = fog.x + drift
    for (let dx = -Math.floor(fog.w / 2); dx <= Math.floor(fog.w / 2); dx++) {
      const px = Math.floor(cx + dx)
      if (px < 0 || px >= W) continue
      const py = fog.y
      if (py < 0 || py >= H) continue
      const dist = Math.abs(dx) / (fog.w / 2)
      const alpha = (1 - dist * dist) * fog.d
      if (alpha < 0.01) continue
      const cell = canvas.getCell(px, py)
      if (cell && cell.bg) {
        const blended = lerp(cell.bg, FOG_BASE, alpha)
        canvas.setCell(px, py, cell.char, cell.fg, bgHex(blended))
      }
    }
  }

  drawWaves(canvas, state, t)
  drawCliff(canvas, state, t)
  drawTower(canvas, state, t)
  drawLamp(canvas, state, t, beamAngle, beamActive)
}

function drawBeam(canvas, state, t, beamAngle) {
  const { W, H, lampX, lampY, cliffProfile } = state
  const beamLen = Math.max(W, H) * 1.5
  const halfWidth = 0.08

  const dirX = Math.cos(beamAngle)
  const dirY = Math.sin(beamAngle)

  for (let step = 3; step < beamLen; step += 0.5) {
    const bx = lampX + dirX * step
    const by = lampY + dirY * step
    const ix = Math.floor(bx), iy = Math.floor(by)
    if (ix < 0 || ix >= W || iy < 0 || iy >= H) continue

    if (ix < W && cliffProfile[ix] !== undefined && iy >= cliffProfile[ix]) continue

    const perpX = -dirY, perpY = dirX
    const spread = halfWidth * step
    const maxSpread = Math.ceil(spread)

    for (let p = -maxSpread; p <= maxSpread; p++) {
      const px = Math.floor(bx + perpX * p)
      const py = Math.floor(by + perpY * p)
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      if (px < W && cliffProfile[px] !== undefined && py >= cliffProfile[px]) continue

      const dist = Math.abs(p) / Math.max(1, spread)
      if (dist > 1) continue

      const fade = Math.max(0, 1 - step / beamLen)
      const edge = Math.max(0, 1 - dist * dist)
      const fogScatter = 0.5 + 0.5 * Math.sin(px * 0.3 + py * 0.2 + t * 0.5) * 0.3
      const alpha = fade * fade * edge * 0.12 * fogScatter

      if (alpha < 0.005) continue

      const cell = canvas.getCell(px, py)
      if (cell && cell.bg) {
        const blended = lerp(cell.bg, BEAM, alpha)
        canvas.setCell(px, py, cell.char, cell.fg, bgHex(blended))
      }
    }
  }
}

function drawWaves(canvas, state, t) {
  const { W, H, horizon, waves, cliffProfile } = state

  const hLine = horizon
  for (let x = 0; x < W; x++) {
    if (cliffProfile[x] <= hLine) continue
    const shimmer = Math.sin(x * 0.15 + t * 0.8) * 0.5 + Math.sin(x * 0.4 - t * 0.3) * 0.3
    if (shimmer > 0.3) {
      const v = Math.floor(30 + shimmer * 25)
      canvas.setCell(x, hLine, '~', hex(col(v, v + 5, v + 15)))
    }
  }

  for (const wave of waves) {
    for (let x = 0; x < W; x++) {
      if (cliffProfile[x] <= wave.y) continue
      const waveVal = Math.sin(x * wave.len + t * wave.sp + wave.ph) * wave.amp
      if (waveVal > wave.amp * 0.5) {
        const intensity = (waveVal - wave.amp * 0.5) / (wave.amp * 0.5)
        const v = Math.floor(20 + intensity * 35)
        const ch = intensity > 0.7 ? '~' : intensity > 0.3 ? '∼' : '·'
        canvas.setCell(x, wave.y, ch, hex(col(v, v + 8, v + 20)))
      }
    }
  }
}

function drawCliff(canvas, state, t) {
  const { W, H, cliffLeft, cliffProfile } = state

  for (let x = cliffLeft; x < W; x++) {
    const top = cliffProfile[x]
    if (top >= H) continue
    for (let y = top; y < H; y++) {
      const depth = (y - top) / Math.max(1, H - top)
      const edge = (x - cliffLeft) / (W - cliffLeft)
      const rockColor = lerpMulti(ROCK, depth * 0.6 + edge * 0.3)

      const n = Math.sin(x * 1.7 + y * 0.9) * 0.15 + Math.sin(x * 0.3 + y * 2.1) * 0.1
      const lit = 0.7 + n

      let ch = ' '
      if (y === top) {
        ch = BLOCK.upper
        const above = canvas.getCell(x, Math.max(0, y))
        canvas.setCell(x, y, ch, hex(lerp(rockColor, '#000000', 1 - lit)), above ? above.bg : bgHex('#020810'))
      } else {
        const si = Math.max(0, Math.min(3, Math.floor(depth * 2 + n * 2)))
        if (depth < 0.15 && n > 0) ch = SHADE[si]
        canvas.setCell(x, y, ch, hex(lerp(rockColor, '#181614', 0.3)), bgHex(lerp(rockColor, '#000000', 1 - lit)))
      }
    }
  }
}

function drawTower(canvas, state, t) {
  const { W, H, towerX, towerBase, towerTop, towerW } = state

  const left = towerX - Math.floor(towerW / 2)
  const right = left + towerW

  for (let y = towerTop + 2; y <= towerBase; y++) {
    const section = (y - towerTop) / (towerBase - towerTop)
    const taper = 1.0 + section * 0.15
    const hw = Math.floor(towerW * taper / 2)
    const sl = towerX - hw
    const sr = towerX + hw

    for (let x = sl; x <= sr; x++) {
      if (x < 0 || x >= W) continue
      const edge = Math.min(x - sl, sr - x)
      const edgeFrac = edge / Math.max(1, hw)
      let c = lerp(TOWER_DARK, TOWER_LIGHT, edgeFrac * 0.6)

      const bandSpacing = Math.floor((towerBase - towerTop) / 5)
      const bandPos = (y - towerTop) % bandSpacing
      if (bandPos < 2 && section > 0.15 && section < 0.85) {
        c = lerp(c, TOWER_BAND, 0.6)
      }

      canvas.setCell(x, y, ' ', null, bgHex(c))
    }
  }

  const galY = towerTop + 1
  const galHW = Math.floor(towerW * 0.8)
  for (let x = towerX - galHW; x <= towerX + galHW; x++) {
    if (x < 0 || x >= W) continue
    canvas.setCell(x, galY, '─', hex('#504840'))
    if (x === towerX - galHW) canvas.setCell(x, galY, '├', hex('#504840'))
    if (x === towerX + galHW) canvas.setCell(x, galY, '┤', hex('#504840'))
  }

  for (let x = towerX - galHW; x <= towerX + galHW; x++) {
    if (x < 0 || x >= W) continue
    if ((x - towerX + galHW) % 2 === 0 && x !== towerX - galHW && x !== towerX + galHW) {
      canvas.setCell(x, galY + 1, '│', hex('#3a3632'))
    }
  }
}

function drawLamp(canvas, state, t, beamAngle, beamActive) {
  const { W, H, lampX, lampY } = state

  const lanternHW = 2
  const lanternH = 2

  for (let dy = -1; dy <= lanternH - 1; dy++) {
    for (let dx = -lanternHW; dx <= lanternHW; dx++) {
      const px = lampX + dx, py = lampY + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue

      if (dy === -1) {
        if (Math.abs(dx) <= 1) {
          canvas.setCell(px, py, '▄', hex('#504840'), bgHex('#020810'))
        }
      } else if (dy === 0) {
        const pulse = 0.7 + 0.3 * Math.sin(t * 3.5)
        const glow = beamActive ? pulse : 0.3
        const lampColor = lerp('#4a3010', LAMP, glow)
        canvas.setCell(px, py, ' ', null, bgHex(lampColor))
      } else {
        if (Math.abs(dx) <= lanternHW) {
          canvas.setCell(px, py, '▀', hex('#504840'), bgHex('#020810'))
        }
      }
    }
  }

  if (beamActive) {
    const glowR = 5
    for (let dy = -glowR; dy <= glowR; dy++) {
      for (let dx = -glowR; dx <= glowR; dx++) {
        const px = lampX + dx, py = lampY + dy
        if (px < 0 || px >= W || py < 0 || py >= H) continue
        if (Math.abs(dx) <= lanternHW && dy >= -1 && dy <= lanternH - 1) continue
        const dist = Math.sqrt(dx * dx + (dy * 2) * (dy * 2))
        if (dist > glowR) continue
        const alpha = Math.pow(1 - dist / glowR, 2) * 0.15
        const cell = canvas.getCell(px, py)
        if (cell && cell.bg) {
          canvas.setCell(px, py, cell.char, cell.fg, bgHex(lerp(cell.bg, LAMP, alpha)))
        }
      }
    }
  }
}
