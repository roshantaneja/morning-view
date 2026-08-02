import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Campfire'
export const description = 'Embers climb past the pines into a sky full of quiet stars'
export const fps = 3

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SKY = ['#020010', '#040018', '#060020', '#080028', '#0a0830']
const SKY_HORIZON = ['#0c0a30', '#100e34', '#141238', '#18163c', '#1c1a40']

const FIRE_CORE = ['#fffaf0', '#fff0c0', '#ffe088', '#ffd060', '#ffc040']
const FIRE_BRIGHT = ['#ffb030', '#ffa020', '#ff8810', '#ff7008', '#ff5800']
const FIRE_MID = ['#ee4400', '#d83800', '#c02c00', '#a82000', '#901800']
const FIRE_OUTER = ['#701000', '#580808', '#400404', '#280202', '#180101']

const EMBER_COLORS = ['#ff9030', '#ff7020', '#ff5010', '#e03808', '#c02000', '#801000', '#400800']
const SMOKE = ['#1a1820', '#22202a', '#2a2834', '#32303e', '#3a3848']

const GROUND = ['#0a0804', '#100e08', '#16120c', '#1c1810', '#221e14']
const GROUND_WARM = ['#1e1408', '#261a0c', '#2e2010', '#362614']
const LOG_DARK = ['#0e0a06', '#140e08', '#1a120a', '#20160c']
const LOG_GLOW = ['#3a2010', '#482a14', '#583418', '#683e1c']

const TREE_DARK = ['#020804', '#040c06', '#061008', '#08140a']
const TREE_SILHOUETTE = '#030604'

const STAR_COLORS = ['#ffffff', '#e0e8ff', '#ffe8d0', '#d0d8ff', '#fff0e0']

const TWO_PI = Math.PI * 2

export function setup(canvas) {
  const rng = srand(802)
  const w = canvas.width
  const h = canvas.height

  const stars = []
  for (let i = 0; i < 180; i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * Math.floor(h * 0.55)),
      brightness: 0.2 + rng() * 0.8,
      phase: rng() * TWO_PI,
      speed: 0.3 + rng() * 1.2,
      color: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
    })
  }

  const trees = []
  const treeCount = 18
  for (let i = 0; i < treeCount; i++) {
    const side = rng()
    let tx
    if (side < 0.35) tx = rng() * w * 0.25
    else if (side < 0.70) tx = w * 0.75 + rng() * w * 0.25
    else tx = rng() * w
    const groundY = Math.floor(h * 0.65)
    const treeH = 15 + Math.floor(rng() * 35)
    const maxW = 3 + Math.floor(rng() * 6)
    const depth = rng()
    trees.push({
      x: Math.floor(tx), baseY: groundY + Math.floor(rng() * 3),
      height: treeH, maxWidth: maxW, depth,
    })
  }
  trees.sort((a, b) => a.depth - b.depth)

  const embers = []
  for (let i = 0; i < 50; i++) {
    embers.push({
      xBase: (rng() - 0.5) * 0.12,
      speed: 0.015 + rng() * 0.035,
      drift: rng() * TWO_PI,
      driftAmp: 0.5 + rng() * 2.5,
      driftFreq: 0.15 + rng() * 0.4,
      offset: rng() * 100,
      life: 0.4 + rng() * 0.6,
      brightness: 0.4 + rng() * 0.6,
    })
  }

  const smokeParticles = []
  for (let i = 0; i < 20; i++) {
    smokeParticles.push({
      xBase: (rng() - 0.5) * 0.05,
      speed: 0.008 + rng() * 0.016,
      drift: rng() * TWO_PI,
      driftAmp: 0.8 + rng() * 2.0,
      driftFreq: 0.08 + rng() * 0.2,
      offset: rng() * 100,
      width: 1 + Math.floor(rng() * 3),
    })
  }

  const flameNoise = new Array(200)
  for (let i = 0; i < 200; i++) flameNoise[i] = rng()

  const logs = []
  for (let i = 0; i < 5; i++) {
    logs.push({
      angle: rng() * Math.PI - Math.PI / 2,
      length: 4 + Math.floor(rng() * 6),
      width: 1 + (rng() > 0.5 ? 1 : 0),
    })
  }

  return { stars, trees, embers, smokeParticles, flameNoise, logs }
}

function drawSky(canvas, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const horizonY = Math.floor(h * 0.65)

  for (let y = 0; y < horizonY; y++) {
    const t = y / horizonY
    const col = t < 0.7
      ? lerpMulti(SKY, Math.min(1, t / 0.7))
      : lerpMulti(SKY_HORIZON, Math.min(1, (t - 0.7) / 0.3))
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, col)
  }
}

function drawStars(canvas, state, elapsed) {
  const w = canvas.width
  for (const s of state.stars) {
    const twinkle = Math.sin(elapsed * s.speed + s.phase) * 0.3 + 0.7
    const b = s.brightness * twinkle
    if (b < 0.15) continue
    if (s.x < 4 || s.x >= w - 4 || s.y < 3) continue
    const ch = b > 0.7 ? '✦' : b > 0.45 ? '·' : '.'
    const col = lerp('#0a0830', s.color, b)
    canvas.setCell(s.x, s.y, ch, col, null)
  }
}

function drawGround(canvas, fireX, fireBaseY) {
  const w = canvas.width
  const h = canvas.height
  const groundY = Math.floor(h * 0.65)

  for (let y = groundY; y < h; y++) {
    const t = (y - groundY) / (h - groundY)
    for (let x = 0; x < w; x++) {
      const distFire = Math.abs(x - fireX) / (w * 0.3)
      const nearFire = Math.max(0, 1 - distFire) * Math.max(0, 1 - t * 1.5)
      const base = lerpMulti(GROUND, Math.min(1, t * 0.6 + 0.2))
      const warm = lerpMulti(GROUND_WARM, Math.min(1, t * 0.4 + 0.1))
      const bg = lerp(base, warm, nearFire * 0.6)
      const noise = Math.sin(x * 0.3 + y * 0.7) * 0.5 + 0.5
      const ch = t < 0.08 && noise > 0.4 ? SHADE[0] : ' '
      const fg = t < 0.08 ? lerpMulti(GROUND, 0.5) : null
      canvas.setCell(x, y, ch, fg, bg)
    }
  }
}

function drawTrees(canvas, state) {
  const w = canvas.width
  const h = canvas.height

  for (const tree of state.trees) {
    const topY = tree.baseY - tree.height
    if (topY < 0) continue
    const dimFactor = 0.3 + tree.depth * 0.7

    for (let y = topY; y <= tree.baseY; y++) {
      if (y < 0 || y >= h) continue
      const t = (y - topY) / tree.height

      if (t < 0.08) {
        if (tree.x >= 0 && tree.x < w)
          canvas.setCell(tree.x, y, BLOCK.upper, lerpMulti(TREE_DARK, dimFactor * 0.3), null)
        continue
      }

      const spread = Math.floor(tree.maxWidth * Math.min(1, t * 1.3))
      const layerWobble = Math.sin(t * 6) * 0.5

      for (let dx = -spread; dx <= spread; dx++) {
        const px = tree.x + dx + Math.round(layerWobble)
        if (px < 0 || px >= w) continue
        const edgeDist = Math.abs(dx) / (spread + 1)
        if (edgeDist > 0.85 && t < 0.5) continue

        const col = lerpMulti(TREE_DARK, Math.min(1, dimFactor * 0.4 + edgeDist * 0.3))
        const ch = edgeDist > 0.7 ? SHADE[1] : SHADE[3]
        canvas.setCell(px, y, ch, col, null)
      }
    }

    for (let dy = 0; dy < 3 && tree.baseY + dy < h; dy++) {
      if (tree.x >= 0 && tree.x < w)
        canvas.setCell(tree.x, tree.baseY + dy, BLOCK.full, lerpMulti(LOG_DARK, 0.3), null)
    }
  }
}

function drawFireGlow(canvas, fireX, fireBaseY, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const pulse = Math.sin(elapsed * 1.8) * 0.08 + Math.sin(elapsed * 2.7) * 0.05 + 0.87
  const glowRadius = Math.min(w, h) * 0.35

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - fireX) * 0.7
      const dy = (y - fireBaseY) * 1.2
      const dist = Math.sqrt(dx * dx + dy * dy)
      const nDist = dist / glowRadius
      if (nDist > 1.2) continue

      const strength = Math.max(0, 1 - nDist) * 0.12 * pulse
      if (strength < 0.005) continue

      const cell = canvas.getCell(x, y)
      if (cell && cell.bg) {
        const glowColor = nDist < 0.3 ? '#2a1808' : '#1a0e04'
        canvas.setCell(x, y, cell.char, cell.fg, lerp(cell.bg, glowColor, strength * 2.5))
      }
    }
  }
}

function drawLogs(canvas, state, fireX, fireBaseY, elapsed) {
  const w = canvas.width
  const h = canvas.height

  for (const log of state.logs) {
    const cos = Math.cos(log.angle)
    const sin = Math.sin(log.angle)
    for (let i = -log.length; i <= log.length; i++) {
      const px = Math.round(fireX + cos * i)
      const py = Math.round(fireBaseY + sin * i * 0.5)
      if (px < 4 || px >= w - 4 || py < 0 || py >= h) continue

      const distCenter = Math.abs(i) / log.length
      const glowing = distCenter < 0.5
      const col = glowing
        ? lerpMulti(LOG_GLOW, Math.min(1, distCenter * 1.5 + Math.sin(elapsed * 1.5 + i) * 0.15))
        : lerpMulti(LOG_DARK, Math.min(1, distCenter * 0.7))
      const ch = glowing ? SHADE[2] : SHADE[3]
      canvas.setCell(px, py, ch, col, null)

      if (log.width > 1 && py + 1 < h) {
        canvas.setCell(px, py + 1, SHADE[1], lerp(col, '#080404', 0.4), null)
      }
    }
  }
}

function drawFlame(canvas, state, fireX, fireBaseY, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const flameH = Math.floor(h * 0.18)
  const flameW = Math.floor(w * 0.06)

  for (let dy = 0; dy < flameH; dy++) {
    const y = fireBaseY - dy - 1
    if (y < 0 || y >= h) continue
    const t = dy / flameH

    const widthT = t < 0.3 ? 0.8 + t * 0.6 : Math.max(0.05, 1.0 - (t - 0.3) * 1.3)
    const hw = Math.max(1, Math.floor(flameW * widthT))

    const flicker1 = Math.sin(elapsed * 4.5 + dy * 0.4) * 0.3
    const flicker2 = Math.sin(elapsed * 6.8 + dy * 0.6 + 1.5) * 0.2
    const flicker3 = Math.sin(elapsed * 3.2 + dy * 0.3 + 3.0) * 0.15
    const centerOffset = Math.round((flicker1 + flicker2) * (1 + t * 2))

    for (let dx = -hw; dx <= hw; dx++) {
      const px = fireX + dx + centerOffset
      if (px < 4 || px >= w - 4) continue

      const edgeDist = Math.abs(dx) / (hw + 1)
      const noiseIdx = Math.abs((dy * 17 + dx * 31 + Math.floor(elapsed * 5)) % 200)
      const noise = state.flameNoise[noiseIdx]

      const flickerMask = noise * 0.4 + 0.6 + flicker3 * (1 - edgeDist)
      if (flickerMask < 0.35 && edgeDist > 0.5) continue

      const intensity = (1 - t) * (1 - edgeDist * 0.8) * flickerMask

      let col, ch
      if (intensity > 0.85) {
        col = lerpMulti(FIRE_CORE, Math.min(1, 1 - intensity + 0.2))
        ch = BLOCK.full
      } else if (intensity > 0.55) {
        col = lerpMulti(FIRE_BRIGHT, Math.min(1, (0.85 - intensity) / 0.3))
        ch = noise > 0.4 ? BLOCK.full : SHADE[3]
      } else if (intensity > 0.3) {
        col = lerpMulti(FIRE_MID, Math.min(1, (0.55 - intensity) / 0.25))
        ch = noise > 0.5 ? SHADE[3] : SHADE[2]
      } else if (intensity > 0.1) {
        col = lerpMulti(FIRE_OUTER, Math.min(1, (0.3 - intensity) / 0.2))
        ch = noise > 0.6 ? SHADE[2] : SHADE[1]
      } else {
        col = lerpMulti(FIRE_OUTER, 0.8)
        ch = SHADE[0]
      }

      canvas.setCell(px, y, ch, col, null)
    }
  }

  for (let dx = -2; dx <= 2; dx++) {
    const px = fireX + dx
    if (px < 4 || px >= w - 4) continue
    const tipY = fireBaseY - flameH - 1 + Math.round(Math.sin(elapsed * 5 + dx * 2) * 1.5)
    if (tipY >= 0 && tipY < h) {
      const fade = Math.sin(elapsed * 3.5 + dx) * 0.5 + 0.5
      if (fade > 0.3)
        canvas.setCell(px, tipY, '·', lerpMulti(FIRE_BRIGHT, fade * 0.5), null)
    }
  }
}

function drawEmbers(canvas, state, fireX, fireBaseY, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const fireTopY = fireBaseY - Math.floor(h * 0.18)

  for (const ember of state.embers) {
    const cycle = (elapsed * ember.speed + ember.offset) % ember.life
    const t = cycle / ember.life
    if (t > 0.95) continue

    const travelDist = fireBaseY - Math.floor(h * 0.05)
    const ey = fireTopY - t * travelDist * 0.6
    const drift = Math.sin(elapsed * ember.driftFreq + ember.drift) * ember.driftAmp * (0.5 + t)
    const ex = fireX + ember.xBase * w + drift

    const px = Math.round(ex)
    const py = Math.round(ey)
    if (px < 4 || px >= w - 4 || py < 3 || py >= h) continue

    const fade = t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.9)
    const b = fade * ember.brightness
    if (b < 0.08) continue

    const colorT = Math.min(1, t * 1.5)
    const col = lerpMulti(EMBER_COLORS, colorT)
    const ch = b > 0.5 ? '✦' : b > 0.25 ? '·' : '.'
    canvas.setCell(px, py, ch, col, null)
  }
}

function drawSmoke(canvas, state, fireX, fireBaseY, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const smokeStartY = fireBaseY - Math.floor(h * 0.20)

  for (const sp of state.smokeParticles) {
    const cycle = (elapsed * sp.speed + sp.offset) % 1.0
    const t = cycle

    const sy = smokeStartY - t * Math.floor(h * 0.35)
    const drift = Math.sin(elapsed * sp.driftFreq + sp.drift) * sp.driftAmp * (1 + t * 3)
    const sx = fireX + sp.xBase * w + drift

    const px = Math.round(sx)
    const py = Math.round(sy)
    if (px < 4 || px >= w - 4 || py < 3 || py >= h) continue

    const fade = t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 0.8)
    if (fade < 0.1) continue

    const col = lerpMulti(SMOKE, Math.min(1, t * 0.8))
    const alpha = fade * 0.25

    for (let dx = 0; dx < sp.width; dx++) {
      const ppx = px + dx
      if (ppx >= 4 && ppx < w - 4) {
        const cell = canvas.getCell(ppx, py)
        if (cell && cell.bg) {
          canvas.setCell(ppx, py, SHADE[0], lerp(cell.bg, col, alpha), cell.bg)
        }
      }
    }
  }
}

function drawScene(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const fireX = Math.floor(w * 0.5)
  const fireBaseY = Math.floor(h * 0.70)

  drawSky(canvas, elapsed)
  drawGround(canvas, fireX, fireBaseY)
  drawFireGlow(canvas, fireX, fireBaseY, elapsed)
  drawTrees(canvas, state)
  drawLogs(canvas, state, fireX, fireBaseY, elapsed)
  drawFlame(canvas, state, fireX, fireBaseY, elapsed)
  drawEmbers(canvas, state, fireX, fireBaseY, elapsed)
  drawSmoke(canvas, state, fireX, fireBaseY, elapsed)
  drawStars(canvas, state, elapsed)
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
