import { lerpMulti, lerp, BLOCK, SHADE, GLYPH } from '../src/theme.js'

export const title = 'Still Pond'
export const description = 'Raindrops trace quiet circles on twilight water'
export const fps = 2

const SKY_COLORS = ['#1a0a2e', '#2d1b4e', '#3a2868', '#4a3a78', '#5a4a88']
const WATER_COLORS = ['#0a1020', '#0d1830', '#102040', '#152848', '#1a3050']
const RIPPLE_COLOR = '#5588aa'
const RAIN_CHARS = ['│', '╎', '┊', '|']
const RAIN_COLORS = ['#556688', '#4477aa', '#6688aa', '#5599bb']
const LILY_PAD_COLOR = '#2a5a2a'
const LILY_FLOWER_COLORS = ['#dd88aa', '#eea0bb', '#ffbbcc']
const REED_COLOR = '#3a5a2a'
const REED_TOP_COLOR = '#6a4a30'

export function setup(canvas) {
  const waterLine = Math.floor(canvas.height * 0.42)
  const drops = createDrops(canvas, waterLine, 40)
  const ripples = []
  const lilyPads = createLilyPads(canvas, waterLine, 5)
  const reeds = createReeds(canvas, waterLine, 8)

  return { waterLine, drops, ripples, lilyPads, reeds }
}

function createDrops(canvas, waterLine, count) {
  const drops = []
  for (let i = 0; i < count; i++) {
    drops.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * waterLine),
      speed: 2 + Math.random() * 3,
      char: RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)],
      color: RAIN_COLORS[Math.floor(Math.random() * RAIN_COLORS.length)],
      length: 1 + Math.floor(Math.random() * 2),
    })
  }
  return drops
}

function createLilyPads(canvas, waterLine, count) {
  const pads = []
  const margin = 8
  for (let i = 0; i < count; i++) {
    const x = margin + Math.floor(Math.random() * (canvas.width - margin * 2))
    const y = waterLine + 4 + Math.floor(Math.random() * (canvas.height - waterLine - 12))
    const size = 2 + Math.floor(Math.random() * 2)
    const hasFlower = Math.random() > 0.6
    const flowerColor = LILY_FLOWER_COLORS[Math.floor(Math.random() * LILY_FLOWER_COLORS.length)]
    pads.push({ x, y, size, hasFlower, flowerColor, drift: Math.random() * Math.PI * 2 })
  }
  return pads
}

function createReeds(canvas, waterLine, count) {
  const reeds = []
  const half = Math.floor(count / 2)
  for (let i = 0; i < half; i++) {
    reeds.push({
      x: 2 + Math.floor(Math.random() * 10),
      baseY: waterLine - 1,
      height: 6 + Math.floor(Math.random() * 8),
      sway: Math.random() * Math.PI * 2,
    })
  }
  for (let i = 0; i < count - half; i++) {
    reeds.push({
      x: canvas.width - 3 - Math.floor(Math.random() * 10),
      baseY: waterLine - 1,
      height: 6 + Math.floor(Math.random() * 8),
      sway: Math.random() * Math.PI * 2,
    })
  }
  return reeds
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const { waterLine, drops, ripples } = state

  for (const drop of drops) {
    drop.y += drop.speed
    if (drop.y >= waterLine) {
      ripples.push({
        x: drop.x,
        y: waterLine + 2 + Math.floor(Math.random() * 4),
        radius: 0,
        maxRadius: 4 + Math.floor(Math.random() * 6),
        age: 0,
      })
      drop.y = -1 - Math.floor(Math.random() * 10)
      drop.x = Math.floor(Math.random() * canvas.width)
    }
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].radius += 0.6
    ripples[i].age++
    if (ripples[i].radius > ripples[i].maxRadius) {
      ripples.splice(i, 1)
    }
  }

  for (const pad of state.lilyPads) {
    pad.drift += 0.02
  }

  canvas.clear()
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, time) {
  drawSky(canvas, state.waterLine, time)
  drawWater(canvas, state.waterLine, time)
  drawReflection(canvas, state.waterLine, time)
  drawRipples(canvas, state.ripples)
  drawLilyPads(canvas, state.lilyPads, time)
  drawReeds(canvas, state.reeds, time)
  drawRain(canvas, state.drops, state.waterLine)
  drawMist(canvas, state.waterLine, time)
}

function drawSky(canvas, waterLine, time) {
  for (let y = 0; y < waterLine; y++) {
    const t = y / Math.max(waterLine - 1, 1)
    const color = lerpMulti(SKY_COLORS, t)
    for (let x = 0; x < canvas.width; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }

  const cloudY = Math.floor(waterLine * 0.2)
  drawCloud(canvas, Math.floor(canvas.width * 0.2), cloudY, 12, '#1a1a3a')
  drawCloud(canvas, Math.floor(canvas.width * 0.6), cloudY + 3, 16, '#1e1e3e')
  drawCloud(canvas, Math.floor(canvas.width * 0.85), cloudY - 1, 10, '#1c1c3c')
}

function drawCloud(canvas, x, y, width, color) {
  const halfW = Math.floor(width / 2)
  for (let dx = -halfW; dx <= halfW; dx++) {
    const dist = Math.abs(dx) / halfW
    const h = Math.floor((1 - dist * dist) * 3)
    for (let dy = -h; dy <= 0; dy++) {
      const px = x + dx
      const py = y + dy
      if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
        canvas.setCell(px, py, SHADE[0], '#333355', color)
      }
    }
  }
}

function drawWater(canvas, waterLine, time) {
  for (let y = waterLine; y < canvas.height; y++) {
    const t = (y - waterLine) / Math.max(canvas.height - waterLine - 1, 1)
    const color = lerpMulti(WATER_COLORS, t)
    for (let x = 0; x < canvas.width; x++) {
      const wave = Math.sin(x * 0.15 + time * 0.5 + y * 0.3) * 0.5 + 0.5
      const tc = Math.max(0, Math.min(1, t + wave * 0.05))
      const cellColor = lerpMulti(WATER_COLORS, tc)
      canvas.setCell(x, y, ' ', null, cellColor)
    }
  }
}

function drawReflection(canvas, waterLine, time) {
  const reflectionDepth = 12
  for (let dy = 0; dy < reflectionDepth; dy++) {
    const y = waterLine + dy
    if (y >= canvas.height) break
    const alpha = 1 - dy / reflectionDepth
    const skyT = dy / Math.max(waterLine - 1, 1)
    const skyColor = lerpMulti(SKY_COLORS, Math.min(skyT, 1))
    const waterColor = lerpMulti(WATER_COLORS, dy / Math.max(canvas.height - waterLine - 1, 1))
    const blended = lerp(waterColor, skyColor, alpha * 0.3)

    for (let x = 0; x < canvas.width; x++) {
      const shimmer = Math.sin(x * 0.2 + time * 0.8 + dy * 0.5)
      if (shimmer > 0.7) {
        canvas.setCell(x, y, '~', lerp('#203050', '#3a5a7a', alpha * 0.5), blended)
      } else if (shimmer > 0.4) {
        canvas.setCell(x, y, '∼', lerp('#182840', '#2a4a6a', alpha * 0.3), blended)
      }
    }
  }
}

function drawRipples(canvas, ripples) {
  for (const ripple of ripples) {
    const fade = 1 - ripple.age / (ripple.maxRadius / 0.6)
    if (fade <= 0) continue
    const r = Math.floor(ripple.radius)
    const steps = Math.max(16, r * 8)
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      const px = Math.floor(ripple.x + Math.cos(angle) * r * 2)
      const py = Math.floor(ripple.y + Math.sin(angle) * r * 0.6)
      if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
        const brightness = Math.floor(fade * 3)
        const chars = ['·', '∘', '○', '◯']
        const charIdx = Math.min(brightness, chars.length - 1)
        const color = lerp('#102030', RIPPLE_COLOR, fade * 0.7)
        canvas.setCell(px, py, chars[charIdx], color)
      }
    }
  }
}

function drawLilyPads(canvas, pads, time) {
  for (const pad of pads) {
    const dx = Math.sin(pad.drift) * 0.5
    const cx = Math.floor(pad.x + dx)
    const cy = pad.y

    for (let py = -1; py <= 1; py++) {
      for (let px = -pad.size; px <= pad.size; px++) {
        const dist = Math.sqrt(px * px + (py * 2) * (py * 2))
        if (dist <= pad.size + 0.5) {
          const gx = cx + px
          const gy = cy + py
          if (gx >= 0 && gx < canvas.width && gy >= 0 && gy < canvas.height) {
            if (px === 0 && py === 0) {
              canvas.setCell(gx, gy, '◉', '#1a4a1a')
            } else {
              const shade = lerp('#1a4a1a', LILY_PAD_COLOR, 0.5 + dist / (pad.size * 2))
              canvas.setCell(gx, gy, BLOCK.full, shade)
            }
          }
        }
      }
    }

    if (pad.hasFlower) {
      const fx = cx + pad.size + 1
      const fy = cy - 1
      if (fx >= 0 && fx < canvas.width && fy >= 0 && fy < canvas.height) {
        canvas.setCell(fx, fy, GLYPH.flower, pad.flowerColor)
      }
    }
  }
}

function drawReeds(canvas, reeds, time) {
  for (const reed of reeds) {
    const sway = Math.sin(time * 0.3 + reed.sway) * 1.5
    for (let i = 0; i < reed.height; i++) {
      const t = i / reed.height
      const swayOffset = Math.floor(sway * t * t)
      const x = reed.x + swayOffset
      const y = reed.baseY - i
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        if (i >= reed.height - 2) {
          canvas.setCell(x, y, '╻', REED_TOP_COLOR)
          if (i === reed.height - 1 && x + 1 < canvas.width) {
            canvas.setCell(x + 1, y, '╸', REED_TOP_COLOR)
          }
        } else {
          canvas.setCell(x, y, '│', lerp(REED_COLOR, '#5a8a3a', t))
        }
      }
    }
  }
}

function drawRain(canvas, drops, waterLine) {
  for (const drop of drops) {
    for (let i = 0; i < drop.length; i++) {
      const y = Math.floor(drop.y) - i
      if (y >= 0 && y < waterLine) {
        canvas.setCell(Math.floor(drop.x), y, drop.char, drop.color)
      }
    }
  }

  for (const drop of drops) {
    const y = Math.floor(drop.y)
    if (y >= waterLine - 1 && y <= waterLine + 1) {
      const x = Math.floor(drop.x)
      if (x >= 0 && x < canvas.width && waterLine < canvas.height) {
        canvas.setCell(x, waterLine, '∙', '#88aacc')
      }
    }
  }
}

function drawMist(canvas, waterLine, time) {
  const mistY = waterLine - 2
  for (let x = 0; x < canvas.width; x++) {
    const density = Math.sin(x * 0.08 + time * 0.2) * 0.5 + 0.5
    if (density > 0.6) {
      for (let dy = -1; dy <= 1; dy++) {
        const y = mistY + dy
        if (y >= 0 && y < canvas.height) {
          const fade = 1 - Math.abs(dy) * 0.4
          if (Math.random() < density * fade * 0.3) {
            canvas.setCell(x, y, SHADE[0], lerp('#1a1a3a', '#3a3a5a', density * fade))
          }
        }
      }
    }
  }
}
