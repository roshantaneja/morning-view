import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Lighthouse'
export const description = 'A steadfast beam sweeps the fog above a dark Atlantic coast'
export const fps = 3

const ASPECT = 2.0

const SKY = ['#020812', '#03101a', '#041822', '#051e2a']
const FOG = ['#0a1828', '#0e2038', '#122848', '#183058']
const SEA_DARK = ['#020a14', '#030e1a', '#041220', '#051628']
const SEA_MID = ['#061a2c', '#082030', '#0a2638', '#0c2c40']
const SEA_FOAM = ['#1a3848', '#224858', '#2a5868', '#326878']
const ROCK = ['#0c0a08', '#141210', '#1c1a18', '#242220', '#2c2a28']
const ROCK_EDGE = ['#1a1816', '#22201e', '#2a2826']
const TOWER_LIGHT = ['#d0c8b8', '#c8c0b0', '#c0b8a8', '#b8b0a0']
const TOWER_RED = ['#601818', '#782020', '#902828', '#a03030']
const TOWER_DARK = '#0a0808'
const LAMP_GLOW = ['#fff8d0', '#fff0b0', '#ffe888', '#ffe060']
const BEAM_CORE = ['#ffeea0', '#fff4c0', '#fff8d8', '#fffcee']
const BEAM_HALO = ['#28384a', '#1e2c3c', '#142030', '#0c1824']
const STAR_COL = ['#1a2838', '#283848', '#384858', '#506878', '#688898']
const WAVE_CREST = '#1a3850'

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

export function setup(canvas) {
  const rng = srand(42)
  const stars = []
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: rng(),
      y: rng() * 0.45,
      bright: rng(),
      twinkle: rng() * Math.PI * 2
    })
  }
  return { beamAngle: 0, stars, wavePhase: 0 }
}

export function render(canvas, data, state) {
  draw(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  state.beamAngle += 0.08
  state.wavePhase += 0.15
  draw(canvas, state, frame.elapsed)
}

function draw(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height

  const horizonY = Math.floor(h * 0.52)
  const rockTop = Math.floor(h * 0.45)
  const towerBaseX = Math.floor(w * 0.55)
  const towerBaseY = rockTop
  const towerW = Math.max(4, Math.floor(w * 0.05))
  const towerH = Math.floor(h * 0.22)
  const towerTopY = towerBaseY - towerH
  const lampY = towerTopY - 1
  const lampX = towerBaseX + Math.floor(towerW / 2)

  drawSky(canvas, w, horizonY, state, elapsed)
  drawFog(canvas, w, horizonY, state)
  drawBeam(canvas, w, h, lampX, lampY, state)
  drawSea(canvas, w, h, horizonY, state)
  drawRocks(canvas, w, h, rockTop, towerBaseX)
  drawTower(canvas, towerBaseX, towerBaseY, towerW, towerH)
  drawLamp(canvas, lampX, lampY, towerW, state)
}

function drawSky(canvas, w, horizonY, state, elapsed) {
  for (let y = 0; y < horizonY; y++) {
    const t = y / horizonY
    const col = lerpMulti(SKY, t)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, col)
    }
  }

  for (const s of state.stars) {
    const sx = Math.floor(s.x * w)
    const sy = Math.floor(s.y * horizonY)
    if (sx >= w - 4 && sy <= 3) continue
    const twinkle = Math.sin(elapsed * 0.8 + s.twinkle) * 0.5 + 0.5
    const bright = s.bright * 0.5 + twinkle * 0.5
    const col = lerpMulti(STAR_COL, bright)
    const ch = bright > 0.7 ? '✦' : bright > 0.4 ? '·' : '.'
    canvas.setCell(sx, sy, ch, col)
  }
}

function drawFog(canvas, w, horizonY, state) {
  const fogBands = [
    { y: Math.floor(horizonY * 0.5), h: Math.floor(horizonY * 0.12), density: 0.15 },
    { y: Math.floor(horizonY * 0.65), h: Math.floor(horizonY * 0.15), density: 0.25 },
    { y: Math.floor(horizonY * 0.82), h: Math.floor(horizonY * 0.18), density: 0.35 },
  ]

  for (const band of fogBands) {
    for (let y = band.y; y < band.y + band.h; y++) {
      for (let x = 0; x < w; x++) {
        const dy = (y - band.y) / band.h
        const fade = Math.sin(dy * Math.PI)
        const drift = Math.sin(x * 0.03 + state.beamAngle * 0.5 + y * 0.1) * 0.5 + 0.5
        const opacity = fade * band.density * (0.6 + drift * 0.4)
        if (opacity > 0.1) {
          const fogCol = lerpMulti(FOG, opacity)
          canvas.setCell(x, y, opacity > 0.25 ? '░' : ' ', fogCol, null)
        }
      }
    }
  }
}

function drawBeam(canvas, w, h, lampX, lampY, state) {
  const beamDir = state.beamAngle
  const sweep = Math.sin(beamDir) * 0.7
  const beamAngleRad = sweep * Math.PI * 0.35

  const dx = Math.sin(beamAngleRad) * ASPECT
  const dy = -Math.cos(beamAngleRad)

  const beamLen = Math.floor(Math.max(w, h) * 1.2)
  const halfWidth = 0.04

  for (let dist = 3; dist < beamLen; dist++) {
    const bx = lampX + dx * dist
    const by = lampY + dy * dist

    const ix = Math.floor(bx)
    const iy = Math.floor(by)
    if (ix < 0 || ix >= w || iy < 0 || iy >= h) continue

    const distFade = 1 - dist / beamLen
    const spread = halfWidth * dist
    const perpX = -dy * ASPECT
    const perpY = dx

    for (let s = -spread; s <= spread; s += 0.5) {
      const px = Math.floor(bx + perpX * s)
      const py = Math.floor(by + perpY * s)
      if (px < 0 || px >= w || py < 0 || py >= h) continue

      const edgeFade = 1 - Math.abs(s) / (spread + 0.01)
      const intensity = distFade * edgeFade * 0.6

      if (intensity > 0.02) {
        const fogBoost = Math.sin(dist * 0.08 + state.beamAngle * 2) * 0.15 + 0.85
        const finalIntensity = Math.min(1, intensity * fogBoost)

        if (finalIntensity > 0.3) {
          const col = lerpMulti(BEAM_CORE, Math.min(1, finalIntensity))
          const ch = finalIntensity > 0.6 ? SHADE[3] : finalIntensity > 0.4 ? SHADE[2] : SHADE[1]
          canvas.setCell(px, py, ch, col)
        } else if (finalIntensity > 0.05) {
          const col = lerpMulti(BEAM_HALO, Math.min(1, finalIntensity * 2))
          canvas.setCell(px, py, '░', col)
        }
      }
    }
  }
}

function drawSea(canvas, w, h, horizonY, state) {
  for (let y = horizonY; y < h; y++) {
    const depth = (y - horizonY) / (h - horizonY)
    const basePal = depth < 0.3 ? SEA_MID : SEA_DARK

    for (let x = 0; x < w; x++) {
      const wave = Math.sin(x * 0.06 + state.wavePhase + y * 0.15)
        + Math.sin(x * 0.12 - state.wavePhase * 0.7 + y * 0.08) * 0.5
      const norm = (wave + 1.5) / 3
      const col = lerpMulti(basePat(basePal, depth), norm)

      let ch = ' '
      if (wave > 0.8 && depth < 0.25) {
        ch = '~'
        canvas.setCell(x, y, ch, WAVE_CREST, col)
      } else if (wave > 0.6 && depth < 0.15) {
        ch = '∼'
        canvas.setCell(x, y, ch, SEA_FOAM[Math.floor(norm * (SEA_FOAM.length - 1))], col)
      } else {
        canvas.setCell(x, y, ch, null, col)
      }
    }
  }
}

function basePat(pal, depth) {
  return pal.map(c => lerp(c, '#000408', depth * 0.4))
}

function drawRocks(canvas, w, h, rockTop, towerBaseX) {
  const rockRight = Math.floor(w * 0.82)
  const rockLeft = Math.floor(w * 0.3)

  for (let x = rockLeft; x < rockRight; x++) {
    const relX = (x - rockLeft) / (rockRight - rockLeft)
    const peak = rockTop
    const edgeDrop = relX < 0.3
      ? Math.pow(relX / 0.3, 0.6)
      : relX > 0.7
        ? Math.pow((1 - relX) / 0.3, 0.4)
        : 1
    const roughness = Math.sin(x * 0.5) * 2 + Math.sin(x * 1.3) * 1.5 + Math.sin(x * 3.7) * 0.5
    const yTop = Math.floor(peak + (1 - edgeDrop) * 15 + roughness)
    const yBot = Math.min(h, Math.floor(peak + 20 + roughness * 0.5))

    for (let y = yTop; y < yBot; y++) {
      const depth = (y - yTop) / (yBot - yTop)
      const rockT = depth * 0.7 + Math.sin(x * 0.3 + y * 0.5) * 0.15
      const col = lerpMulti(ROCK, Math.min(1, Math.max(0, rockT)))

      const nearEdge = y === yTop || y === yTop + 1
      const edgeCol = nearEdge ? lerpMulti(ROCK_EDGE, relX) : col
      const ch = nearEdge ? '▄' : (depth < 0.3 ? SHADE[2] : SHADE[3])
      canvas.setCell(x, y, ch, nearEdge ? edgeCol : null, col)
    }
  }
}

function drawTower(canvas, baseX, baseY, tw, th) {
  const topY = baseY - th
  const stripH = Math.max(2, Math.floor(th / 6))

  for (let y = topY; y < baseY; y++) {
    const relY = (y - topY) / th
    const taper = 1 - relY * 0.15
    const curW = Math.max(2, Math.floor(tw * taper))
    const startX = baseX + Math.floor((tw - curW) / 2)
    const stripe = Math.floor((y - topY) / stripH) % 2 === 0

    for (let dx = 0; dx < curW; dx++) {
      const x = startX + dx
      const edgeFade = dx === 0 || dx === curW - 1 ? 0.6 : 1
      const pal = stripe ? TOWER_LIGHT : TOWER_RED
      const t = Math.min(1, edgeFade * (0.5 + relY * 0.5))
      const col = lerpMulti(pal, t)
      const dark = lerp(col, TOWER_DARK, 1 - edgeFade)
      canvas.setCell(x, y, SHADE[3], dark)
    }
  }

  const capW = Math.max(3, Math.floor(tw * 1.2))
  const capX = baseX + Math.floor((tw - capW) / 2)
  for (let dx = 0; dx < capW; dx++) {
    const col = lerpMulti(TOWER_LIGHT, dx / capW)
    canvas.setCell(capX + dx, topY - 1, '▄', col)
  }

  const railY = topY - 2
  const railW = capW + 2
  const railX = capX - 1
  for (let dx = 0; dx < railW; dx++) {
    canvas.setCell(railX + dx, railY, '─', TOWER_LIGHT[2])
  }
  canvas.setCell(railX, railY, '╭', TOWER_LIGHT[2])
  canvas.setCell(railX + railW - 1, railY, '╮', TOWER_LIGHT[2])
}

function drawLamp(canvas, lampX, lampY, tw, state) {
  const lampW = Math.max(3, tw - 1)
  const lampH = 3
  const startX = lampX - Math.floor(lampW / 2)
  const startY = lampY - lampH - 3

  for (let dy = 0; dy < lampH; dy++) {
    for (let dx = 0; dx < lampW; dx++) {
      const x = startX + dx
      const y = startY + dy
      const pulse = Math.sin(state.beamAngle * 3) * 0.15 + 0.85
      const dist = Math.abs(dx - lampW / 2) / (lampW / 2)
      const bright = (1 - dist) * pulse
      const col = lerpMulti(LAMP_GLOW, bright)
      canvas.setCell(x, y, SHADE[3], col, lerp('#1a1408', col, bright * 0.3))
    }
  }

  const glowR = Math.max(4, Math.floor(tw * 1.5))
  const cx = lampX
  const cy = startY + 1
  for (let dy = -glowR; dy <= glowR; dy++) {
    for (let dx = -glowR * 2; dx <= glowR * 2; dx++) {
      const gx = cx + dx
      const gy = cy + dy
      if (gx < 0 || gx >= canvas.width || gy < 0 || gy >= canvas.height) continue
      const dist = Math.sqrt((dx / ASPECT) ** 2 + dy ** 2) / glowR
      if (dist > 1 || dist < 0.3) continue
      const fade = 1 - dist
      const existing = canvas.getCell(gx, gy)
      if (existing && existing.char !== ' ' && existing.char !== '░') continue
      const glowCol = lerp('#0a1020', '#2a2818', fade * 0.4)
      canvas.setCell(gx, gy, fade > 0.5 ? '·' : ' ', '#2a2818', glowCol)
    }
  }
}
