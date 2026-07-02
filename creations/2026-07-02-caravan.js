import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Caravan'
export const description = 'A distant procession crosses moonlit dunes in silence'
export const fps = 2

const SKY = ['#020012', '#040022', '#060035', '#0a0848', '#10105a']
const DUNE_FAR_LIT = ['#5a4828', '#6a5430', '#7a6038']
const DUNE_FAR_SHADOW = ['#201408', '#2a1c0e', '#342414']
const DUNE_MID_LIT = ['#8a6830', '#9a7838', '#aa8840', '#bb9848']
const DUNE_MID_SHADOW = ['#2a1a0a', '#3a2410', '#4a3018', '#5a3c22']
const DUNE_NEAR_LIT = ['#3a2818', '#4a3420', '#5a4028', '#6a4c30']
const DUNE_NEAR_SHADOW = ['#0e0804', '#1a1008', '#22160c', '#2a1c10']

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height
  const skyLimit = Math.floor(h * 0.46)

  const starCount = Math.floor(w * skyLimit * 0.018)
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.floor(Math.random() * w),
    y: Math.floor(Math.random() * Math.max(skyLimit - 3, 1)),
    char: Math.random() > 0.90 ? '✦' : Math.random() > 0.55 ? '·' : '∘',
    brightness: 0.2 + Math.random() * 0.8,
    speed: 0.3 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
    color: Math.random() > 0.8 ? '#ffeedd' : Math.random() > 0.5 ? '#ddddff' : '#aabbdd',
  }))

  const moonX = Math.floor(w * 0.68)
  const moonY = Math.floor(h * 0.12)

  const particles = Array.from({ length: 25 }, () => makeSandParticle(w, h, skyLimit))

  const camels = Array.from({ length: 5 }, (_, i) => ({
    spacing: i * 7,
    bob: i * 1.1,
  }))

  return { stars, moonX, moonY, particles, camels, skyLimit }
}

function makeSandParticle(w, h, skyLimit) {
  return {
    x: Math.random() * w,
    y: skyLimit + Math.floor(Math.random() * (h - skyLimit)),
    vx: 0.3 + Math.random() * 0.7,
    vy: (Math.random() - 0.5) * 0.1,
    life: 0.4 + Math.random() * 0.6,
    decay: 0.008 + Math.random() * 0.018,
  }
}

function getDuneY(x, w, h, layer, time) {
  const baseY = h * (0.46 + layer * 0.14)
  const drift = time * 0.008 * (1 + layer * 0.5)
  const s = x / w

  let y = 0
  y += Math.sin(s * Math.PI * 2.0 + drift + layer * 1.7) * h * 0.055
  y += Math.sin(s * Math.PI * 4.3 + drift * 0.6 + layer * 2.9) * h * 0.025
  y += Math.sin(s * Math.PI * 7.1 + drift * 0.3 + layer * 0.6) * h * 0.010

  return baseY + y
}

function getDuneSlope(x, w, h, layer, time) {
  const yPrev = getDuneY(Math.max(0, x - 1), w, h, layer, time)
  const yNext = getDuneY(Math.min(w - 1, x + 1), w, h, layer, time)
  return yNext - yPrev
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const t = frame.elapsed

  for (const p of state.particles) {
    p.x += p.vx
    p.y += p.vy
    p.life -= p.decay
    if (p.life <= 0 || p.x > canvas.width + 5) {
      Object.assign(p, makeSandParticle(canvas.width, canvas.height, state.skyLimit))
      p.x = -2
    }
  }

  canvas.clear()
  drawScene(canvas, state, t)
}

function drawScene(canvas, state, time) {
  drawSky(canvas, state.skyLimit)
  drawMilkyWay(canvas, state.skyLimit, time)
  drawMoonGlow(canvas, state.moonX, state.moonY, state.skyLimit, time)
  drawMoon(canvas, state.moonX, state.moonY)
  drawStars(canvas, state.stars, time)
  drawHorizonHaze(canvas, state.skyLimit)
  drawDunes(canvas, 0, time, DUNE_FAR_LIT, DUNE_FAR_SHADOW)
  drawCaravan(canvas, state, time)
  drawDunes(canvas, 1, time, DUNE_MID_LIT, DUNE_MID_SHADOW)
  drawDunes(canvas, 2, time, DUNE_NEAR_LIT, DUNE_NEAR_SHADOW)
  drawSandParticles(canvas, state.particles)
}

function drawSky(canvas, skyLimit) {
  for (let y = 0; y < canvas.height; y++) {
    const t = Math.min(y / Math.max(skyLimit - 1, 1), 1)
    const color = lerpMulti(SKY, t)
    for (let x = 0; x < canvas.width; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawMilkyWay(canvas, skyLimit, time) {
  const w = canvas.width
  for (let x = 0; x < w; x++) {
    const bandCenter = skyLimit * 0.35 + (x / w) * skyLimit * 0.3
    const bandWidth = skyLimit * 0.12
    for (let y = 0; y < skyLimit; y++) {
      const dist = Math.abs(y - bandCenter) / bandWidth
      if (dist < 1) {
        const intensity = (1 - dist) * (1 - dist) * 0.08
        const noise = Math.sin(x * 0.3 + y * 0.7) * 0.5 + 0.5
        if (noise > 0.3) {
          const base = lerpMulti(SKY, Math.min(y / Math.max(skyLimit - 1, 1), 1))
          canvas.setCell(x, y, ' ', null, lerp(base, '#18143a', intensity * noise))
        }
      }
    }
  }
}

function drawMoonGlow(canvas, mx, my, skyLimit, time) {
  const pulse = 1 + Math.sin(time * 0.25) * 0.04
  const r = Math.floor(16 * pulse)
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + (dy * 1.4) * (dy * 1.4))
      if (dist >= r) continue
      const x = mx + dx
      const y = my + dy
      if (x < 0 || x >= canvas.width || y < 0 || y >= skyLimit) continue
      const intensity = Math.pow(1 - dist / r, 2) * 0.22
      if (intensity < 0.01) continue
      const base = lerpMulti(SKY, Math.min(y / Math.max(skyLimit - 1, 1), 1))
      canvas.setCell(x, y, ' ', null, lerp(base, '#2a2410', Math.min(intensity, 0.5)))
    }
  }
}

function drawMoon(canvas, mx, my) {
  const r = 3
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const moonDist = Math.sqrt(dx * dx + (dy * 1.6) * (dy * 1.6))
      const cutDist = Math.sqrt((dx - 2.8) * (dx - 2.8) + (dy * 1.6) * (dy * 1.6))
      if (moonDist <= r && cutDist > r * 0.8) {
        const x = mx + dx
        const y = my + dy
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const edge = moonDist / r
          canvas.setCell(x, y, SHADE[3], lerp('#e0d8b0', '#fffae0', 1 - edge))
        }
      }
    }
  }
}

function drawStars(canvas, stars, time) {
  for (const s of stars) {
    const twinkle = 0.3 + Math.sin(time * s.speed + s.phase) * 0.35 + 0.35
    const b = twinkle * s.brightness
    if (b > 0.25) {
      canvas.setCell(s.x, s.y, s.char, lerp('#060018', s.color, Math.min(b, 1)))
    }
  }
}

function drawHorizonHaze(canvas, skyLimit) {
  const hazeH = 6
  for (let dy = 0; dy < hazeH; dy++) {
    const y = skyLimit - hazeH + dy
    if (y < 0) continue
    const intensity = dy / hazeH
    const base = lerpMulti(SKY, Math.min(y / Math.max(skyLimit - 1, 1), 1))
    const haze = lerp(base, '#1a1040', intensity * 0.35)
    for (let x = 0; x < canvas.width; x++) {
      canvas.setCell(x, y, ' ', null, haze)
    }
  }
}

function drawDunes(canvas, layer, time, litPalette, shadowPalette) {
  const w = canvas.width
  const h = canvas.height

  for (let x = 0; x < w; x++) {
    const topY = Math.floor(getDuneY(x, w, h, layer, time))
    const slope = getDuneSlope(x, w, h, layer, time)
    const light = Math.max(0, Math.min(1, 0.5 - slope * 4))

    for (let y = Math.max(0, topY); y < h; y++) {
      const depth = (y - topY) / Math.max(h - topY, 1)
      const litColor = lerpMulti(litPalette, Math.min(depth * 2, 1))
      const shadowColor = lerpMulti(shadowPalette, Math.min(depth * 2, 1))
      const color = lerp(shadowColor, litColor, light)

      if (y === topY) {
        const ridgeLit = lerpMulti(litPalette, 0)
        const ridgeColor = lerp(color, lerp(ridgeLit, '#ccaa50', 0.3), light * 0.5)
        canvas.setCell(x, y, BLOCK.upper, ridgeColor)
      } else {
        const grain = Math.sin(x * 0.9 + y * 1.3 + layer * 4.1) * 0.5 + 0.5
        if (grain > 0.82 && depth < 0.12 && light > 0.5) {
          canvas.setCell(x, y, SHADE[0], lerp(color, '#ccaa55', 0.08), color)
        } else {
          canvas.setCell(x, y, ' ', null, color)
        }
      }
    }
  }
}

function drawCaravan(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const walkX = (time * 1.2) % (w + 60) - 30

  for (const camel of state.camels) {
    const cx = Math.floor(walkX + camel.spacing)
    if (cx < -2 || cx >= w + 2) continue

    const sampleX = Math.max(0, Math.min(w - 1, cx))
    const ridgeY = Math.floor(getDuneY(sampleX, w, h, 0, time)) - 1
    const bob = Math.floor(Math.sin(time * 1.5 + camel.bob) * 0.5)
    const y = ridgeY + bob
    const c = '#0e0a04'

    if (cx >= 0 && cx < w && y >= 0 && y < h) canvas.setCell(cx, y, BLOCK.full, c)
    if (cx + 1 >= 0 && cx + 1 < w && y >= 0 && y < h) canvas.setCell(cx + 1, y, BLOCK.full, c)
    if (cx >= 0 && cx < w && y - 1 >= 0 && y - 1 < h) canvas.setCell(cx, y - 1, BLOCK.lower, c)
    if (cx + 1 >= 0 && cx + 1 < w && y - 1 >= 0 && y - 1 < h) canvas.setCell(cx + 1, y - 1, BLOCK.lower, c)
  }
}

function drawSandParticles(canvas, particles) {
  for (const p of particles) {
    if (p.life <= 0) continue
    const x = Math.floor(p.x)
    const y = Math.floor(p.y)
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      canvas.setCell(x, y, '·', lerp('#3a2810', '#bb9944', p.life))
    }
  }
}
