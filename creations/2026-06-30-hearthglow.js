import { lerp, lerpMulti, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Hearthglow'
export const description = 'A lone campfire crackles beneath a cathedral of stars'
export const fps = 2

const SKY = ['#030308', '#050510', '#080818', '#0a0a20']
const GROUND = ['#1a1008', '#150e06', '#100a04', '#0c0802']
const FLAME = ['#fff8e0', '#ffdd44', '#ffaa22', '#ff6600', '#cc3300', '#881100']
const EMBER_COLORS = ['#ffaa33', '#ff7711', '#ee4400', '#aa2200', '#661100']
const SMOKE_COLORS = ['#444450', '#333340', '#222230', '#111118']

export function setup(canvas) {
  const fireY = Math.floor(canvas.height * 0.65)
  const fireCX = Math.floor(canvas.width * 0.5)

  const starCount = Math.floor(canvas.width * fireY * 0.018)
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.floor(Math.random() * canvas.width),
    y: Math.floor(Math.random() * Math.max(fireY - 6, 1)),
    char: Math.random() > 0.7 ? '✦' : Math.random() > 0.4 ? '·' : '∘',
    twinkleSpeed: 0.5 + Math.random() * 2,
    twinklePhase: Math.random() * Math.PI * 2,
    brightness: 0.3 + Math.random() * 0.7,
  }))

  const emberCount = 35
  const embers = Array.from({ length: emberCount }, () => spawnEmber(fireCX, fireY))

  const smokeCount = 18
  const smoke = Array.from({ length: smokeCount }, () => spawnSmoke(fireCX, fireY))

  const trees = []
  for (let i = 0; i < 5; i++) {
    trees.push({
      x: 2 + Math.floor(Math.random() * Math.floor(canvas.width * 0.18)),
      baseY: fireY + 2 + Math.floor(Math.random() * 4),
      height: 14 + Math.floor(Math.random() * 22),
      width: 3 + Math.floor(Math.random() * 5),
      swayPhase: Math.random() * Math.PI * 2,
    })
  }
  for (let i = 0; i < 5; i++) {
    trees.push({
      x: canvas.width - 3 - Math.floor(Math.random() * Math.floor(canvas.width * 0.18)),
      baseY: fireY + 2 + Math.floor(Math.random() * 4),
      height: 14 + Math.floor(Math.random() * 22),
      width: 3 + Math.floor(Math.random() * 5),
      swayPhase: Math.random() * Math.PI * 2,
    })
  }

  const rocks = []
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const dist = 9 + Math.random() * 3
    rocks.push({
      x: Math.floor(fireCX + Math.cos(angle) * dist),
      y: Math.floor(fireY + Math.sin(angle) * 2.5),
      size: 1 + Math.floor(Math.random() * 2),
    })
  }

  return { fireY, fireCX, stars, embers, smoke, trees, rocks }
}

function spawnEmber(cx, fireY) {
  return {
    x: cx + (Math.random() - 0.5) * 8,
    y: fireY - 2 - Math.random() * 4,
    vx: (Math.random() - 0.5) * 0.7,
    vy: -(0.4 + Math.random() * 0.8),
    life: 0.6 + Math.random() * 0.4,
    decay: 0.012 + Math.random() * 0.025,
    char: Math.random() > 0.6 ? '✦' : Math.random() > 0.3 ? '∘' : '·',
  }
}

function spawnSmoke(cx, fireY) {
  return {
    x: cx + (Math.random() - 0.5) * 3,
    y: fireY - 8 - Math.random() * 8,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -(0.2 + Math.random() * 0.3),
    life: 0.5 + Math.random() * 0.5,
    decay: 0.006 + Math.random() * 0.012,
    wide: Math.random() > 0.5,
  }
}

export function render(canvas, data, state) {
  drawAll(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const t = frame.elapsed

  for (const e of state.embers) {
    e.x += e.vx + Math.sin(t * 1.8 + e.x * 0.3) * 0.12
    e.y += e.vy
    e.life -= e.decay
    if (e.life <= 0) Object.assign(e, spawnEmber(state.fireCX, state.fireY))
  }

  for (const s of state.smoke) {
    s.x += s.vx + Math.sin(t * 0.4 + s.y * 0.08) * 0.1
    s.y += s.vy
    s.life -= s.decay
    if (s.life <= 0) Object.assign(s, spawnSmoke(state.fireCX, state.fireY))
  }

  canvas.clear()
  drawAll(canvas, state, t)
}

function drawAll(canvas, state, time) {
  drawSky(canvas, state.fireY)
  drawStars(canvas, state.stars, time)
  drawGround(canvas, state.fireY)
  drawFireGlow(canvas, state.fireCX, state.fireY, time)
  drawTrees(canvas, state.trees, time)
  drawSmoke(canvas, state.smoke)
  drawRocks(canvas, state.rocks)
  drawLogs(canvas, state.fireCX, state.fireY)
  drawFlames(canvas, state.fireCX, state.fireY, time)
  drawEmbers(canvas, state.embers)
}

function drawSky(canvas, fireY) {
  for (let y = 0; y < fireY; y++) {
    const t = y / Math.max(fireY - 1, 1)
    const color = lerpMulti(SKY, t)
    for (let x = 0; x < canvas.width; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawStars(canvas, stars, time) {
  for (const s of stars) {
    const twinkle = 0.3 + Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.35 + 0.35
    const b = twinkle * s.brightness
    if (b > 0.25) {
      const color = lerp('#111122', '#ccddff', Math.min(b, 1))
      canvas.setCell(s.x, s.y, s.char, color)
    }
  }
}

function drawGround(canvas, fireY) {
  for (let y = fireY; y < canvas.height; y++) {
    const t = Math.min((y - fireY) / Math.max(canvas.height - fireY - 1, 1), 1)
    const color = lerpMulti(GROUND, t)
    for (let x = 0; x < canvas.width; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }
  const grassY = fireY
  for (let x = 0; x < canvas.width; x++) {
    const noise = Math.sin(x * 0.7) * 0.5 + Math.sin(x * 1.3) * 0.3
    if (noise > 0.2 && grassY < canvas.height) {
      canvas.setCell(x, grassY, '╌', '#1a2a10')
    }
  }
}

function drawFireGlow(canvas, cx, fireY, time) {
  const pulse = 0.75 + Math.sin(time * 1.5) * 0.12 + Math.sin(time * 2.7) * 0.08
  const rx = Math.floor(28 * pulse)
  const ry = Math.floor(20 * pulse)
  const glowCY = fireY - 2

  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const nd = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)
      if (nd >= 1) continue
      const x = cx + dx
      const y = glowCY + dy
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue

      const dist = Math.sqrt(nd)
      const intensity = (1 - dist) * (1 - dist) * 0.3 * pulse
      if (intensity < 0.01) continue

      const base = y < fireY
        ? lerpMulti(SKY, Math.min(y / Math.max(fireY - 1, 1), 1))
        : lerpMulti(GROUND, Math.min((y - fireY) / Math.max(canvas.height - fireY - 1, 1), 1))
      const warmth = lerp('#ff5500', '#ffaa33', dist)
      canvas.setCell(x, y, ' ', null, lerp(base, warmth, Math.min(intensity, 0.55)))
    }
  }
}

function drawTrees(canvas, trees, time) {
  for (const tree of trees) {
    const { x, baseY, height, width, swayPhase } = tree
    const trunkH = Math.max(3, Math.floor(height * 0.15))
    const canopyH = height - trunkH

    for (let dy = 0; dy < trunkH; dy++) {
      const py = baseY - dy
      if (py >= 0 && py < canvas.height && x >= 0 && x < canvas.width) {
        canvas.setCell(x, py, '│', '#1a1008')
      }
    }

    for (let dy = 0; dy < canopyH; dy++) {
      const t = dy / Math.max(canopyH - 1, 1)
      const layerW = Math.max(1, Math.floor(width * (1 - t * 0.85)))
      const sway = Math.sin(time * 0.15 + swayPhase) * t * 0.8
      const py = baseY - trunkH - dy

      for (let dx = -layerW; dx <= layerW; dx++) {
        const px = Math.floor(x + dx + sway)
        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          const edge = Math.abs(dx) / Math.max(layerW, 1)
          const color = lerp('#060e06', '#0c180c', edge)
          canvas.setCell(px, py, BLOCK.full, color)
        }
      }
    }
  }
}

function drawSmoke(canvas, particles) {
  for (const s of particles) {
    if (s.life <= 0) continue
    const x = Math.floor(s.x)
    const y = Math.floor(s.y)
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue

    const fade = Math.min(s.life, 1)
    const color = lerpMulti(SMOKE_COLORS, 1 - fade)
    const ch = fade > 0.6 ? SHADE[1] : fade > 0.3 ? SHADE[0] : '·'
    canvas.setCell(x, y, ch, color)

    if (s.wide && fade < 0.65) {
      if (x + 1 < canvas.width) canvas.setCell(x + 1, y, SHADE[0], lerp(color, '#060608', 0.4))
      if (x - 1 >= 0) canvas.setCell(x - 1, y, SHADE[0], lerp(color, '#060608', 0.4))
    }
  }
}

function drawRocks(canvas, rocks) {
  for (const r of rocks) {
    if (r.x < 0 || r.x >= canvas.width || r.y < 0 || r.y >= canvas.height) continue
    canvas.setCell(r.x, r.y, r.size > 1 ? '⬤' : '●', '#2a2018')
    if (r.size > 1 && r.x + 1 < canvas.width) {
      canvas.setCell(r.x + 1, r.y, '●', '#221a12')
    }
  }
}

function drawLogs(canvas, cx, fireY) {
  const logY = fireY - 1
  for (let dx = -7; dx <= 3; dx++) {
    const x = cx + dx
    if (x >= 0 && x < canvas.width && logY >= 0 && logY < canvas.height) {
      const t = (dx + 7) / 10
      canvas.setCell(x, logY, '═', lerp('#3a2818', '#4a3420', t))
    }
  }
  for (let dx = -3; dx <= 7; dx++) {
    const x = cx + dx
    const y = logY + 1
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const t = (dx + 3) / 10
      canvas.setCell(x, y, '═', lerp('#2a1e10', '#3a2818', t))
    }
  }

  for (let dx = -5; dx <= 5; dx++) {
    const x = cx + dx
    if (x >= 0 && x < canvas.width && logY >= 0 && logY < canvas.height) {
      const dist = Math.abs(dx) / 5
      const emberColor = lerp('#ff4400', '#882200', dist)
      canvas.setCell(x, logY, dist < 0.4 ? SHADE[3] : SHADE[2], emberColor, '#220800')
    }
  }
}

function drawFlames(canvas, cx, fireY, time) {
  const baseY = fireY - 2
  const flameH = 12
  const flameW = 6

  for (let fy = 0; fy < flameH; fy++) {
    const t = fy / flameH
    const widthAtRow = Math.max(1, Math.floor(flameW * (1 - t * t * 0.8)))
    const py = baseY - fy

    for (let dx = -widthAtRow; dx <= widthAtRow; dx++) {
      const px = cx + dx
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue

      const edge = Math.abs(dx) / Math.max(widthAtRow, 1)

      const flicker = Math.sin(time * 4.5 + dx * 1.7 + fy * 2.3) * 0.25
        + Math.sin(time * 7.1 + dx * 0.9 + fy * 1.4) * 0.2
        + Math.sin(time * 3.3 + fy * 3.1) * 0.15

      if (edge + flicker > 0.85 && t > 0.25) continue

      const colorT = Math.min(Math.max(t * 0.6 + edge * 0.3 + Math.max(flicker, 0) * 0.15, 0), 1)
      const color = lerpMulti(FLAME, colorT)

      let ch
      if (t < 0.15 && edge < 0.5) ch = SHADE[3]
      else if (t < 0.4) ch = SHADE[2 + (Math.sin(time * 5 + dx * 2) > 0 ? 1 : 0)]
      else if (t < 0.7) ch = SHADE[1 + (Math.sin(time * 4 + dx * 1.5 + fy) > 0.2 ? 1 : 0)]
      else ch = SHADE[Math.sin(time * 3 + fy * 2) > 0 ? 1 : 0]

      const bg = lerp('#0a0400', '#220e00', Math.max(1 - t - edge * 0.5, 0))
      canvas.setCell(px, py, ch, color, bg)
    }
  }

  for (let i = 0; i < 3; i++) {
    const tipDx = Math.floor(Math.sin(time * 3.5 + i * 2.2) * 2.5)
    const tipDy = Math.floor(Math.abs(Math.sin(time * 2.8 + i * 1.7)) * 2)
    const tipX = cx + tipDx
    const tipY = baseY - flameH - tipDy
    if (tipX >= 0 && tipX < canvas.width && tipY >= 0 && tipY < canvas.height) {
      const tipColor = lerp('#ff6600', '#cc3300', 0.5 + Math.sin(time * 4 + i) * 0.5)
      canvas.setCell(tipX, tipY, SHADE[0 + (Math.sin(time * 6 + i) > 0 ? 1 : 0)], tipColor)
    }
  }
}

function drawEmbers(canvas, embers) {
  for (const e of embers) {
    if (e.life <= 0) continue
    const x = Math.floor(e.x)
    const y = Math.floor(e.y)
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue

    const fade = Math.min(e.life, 1)
    const color = lerpMulti(EMBER_COLORS, 1 - fade)
    canvas.setCell(x, y, e.char, color)
  }
}
