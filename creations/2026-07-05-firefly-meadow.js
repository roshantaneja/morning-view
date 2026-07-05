import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Firefly Meadow'
export const description = 'Summer dusk settles as living lanterns drift above the grass'
export const fps = 3

const SKY = ['#020818', '#0a1438', '#1a2050', '#2a2858', '#3a2850', '#5a2840', '#884030', '#cc7040', '#eea858']
const GRASS_DARK = ['#040a02', '#081404', '#0c1e06', '#102808']
const GRASS_MID = ['#14320a', '#183c0c', '#1c460e', '#205010']
const GRASS_TIP = ['#285a14', '#306418', '#386e1c', '#407820']
const TREE_DARK = ['#020408', '#040810', '#060c14', '#081018']
const STAR_COLORS = ['#778899', '#aabbcc', '#ddeeff', '#ffffff']

const FIREFLY_GLOW = ['#102000', '#305000', '#60aa00', '#90ee00', '#ccff44', '#ffffaa']
const FIREFLY_WARM = ['#201000', '#504000', '#908000', '#ccbb00', '#ffee44', '#ffffcc']

const GRASS_CHARS = ['╻', '│', '┃', '╽', '╿', '┆', '┇', '╎', '╏', '⸽']
const WISP_CHARS = ['·', '∘', '°', '•', '◦', '⋅']

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height

  const horizonY = Math.floor(h * 0.35)
  const grassTop = Math.floor(h * 0.42)

  const trees = generateTrees(w, horizonY)
  const fireflies = Array.from({ length: 55 }, (_, i) => spawnFirefly(w, h, grassTop, i))
  const grassBlades = generateGrass(w, h, grassTop)
  const stars = Array.from({ length: 40 }, () => ({
    x: Math.floor(Math.random() * w),
    y: Math.floor(Math.random() * horizonY * 0.8),
    brightness: Math.random(),
    twinkleSpeed: 0.3 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
  }))

  return { horizonY, grassTop, trees, fireflies, grassBlades, stars, windPhase: 0 }
}

function generateTrees(w, horizonY) {
  const trees = []
  let x = 2
  while (x < w - 2) {
    const height = 6 + Math.floor(Math.random() * 10)
    const width = 4 + Math.floor(Math.random() * 8)
    const type = Math.random() > 0.4 ? 'round' : 'pointed'
    trees.push({ x, y: horizonY, height, width, type })
    x += width + Math.floor(Math.random() * 5) + 1
  }
  return trees
}

function generateGrass(w, h, grassTop) {
  const blades = []
  for (let x = 0; x < w; x++) {
    const count = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const baseY = grassTop + Math.floor(Math.random() * (h - grassTop))
      const height = 2 + Math.floor(Math.random() * 5)
      blades.push({
        x,
        baseY,
        height,
        swaySpeed: 0.2 + Math.random() * 0.6,
        swayAmp: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        char: GRASS_CHARS[Math.floor(Math.random() * GRASS_CHARS.length)],
      })
    }
  }
  return blades
}

function spawnFirefly(w, h, grassTop, i) {
  const zone = grassTop - 8
  return {
    x: 8 + Math.random() * (w - 16),
    y: zone + Math.random() * (h - zone - 10),
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.2,
    glowPhase: Math.random() * Math.PI * 2,
    glowSpeed: 0.4 + Math.random() * 0.8,
    glowDuration: 0.3 + Math.random() * 0.5,
    pattern: Math.floor(Math.random() * 3),
    warm: Math.random() > 0.6,
    size: Math.random() > 0.7 ? 2 : 1,
    driftPhase: Math.random() * Math.PI * 2,
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const t = frame.elapsed
  const w = canvas.width
  const h = canvas.height

  state.windPhase = t * 0.15

  for (const f of state.fireflies) {
    f.x += f.vx + Math.sin(t * 0.3 + f.driftPhase) * 0.15
    f.y += f.vy + Math.cos(t * 0.2 + f.driftPhase * 1.3) * 0.08

    if (f.x < 4) { f.x = 4; f.vx = Math.abs(f.vx) * 0.5 + 0.1 }
    if (f.x > w - 4) { f.x = w - 4; f.vx = -Math.abs(f.vx) * 0.5 - 0.1 }
    if (f.y < state.grassTop - 10) { f.y = state.grassTop - 10; f.vy = Math.abs(f.vy) * 0.5 + 0.05 }
    if (f.y > h - 6) { f.y = h - 6; f.vy = -Math.abs(f.vy) * 0.5 - 0.05 }

    if (Math.random() < 0.01) f.vx += (Math.random() - 0.5) * 0.2
    if (Math.random() < 0.01) f.vy += (Math.random() - 0.5) * 0.1
    f.vx *= 0.98
    f.vy *= 0.98
  }

  canvas.clear()
  drawScene(canvas, state, t)
}

function drawScene(canvas, state, time) {
  drawSky(canvas, state)
  drawStars(canvas, state, time)
  drawTrees(canvas, state)
  drawGrassBackground(canvas, state)
  drawFireflies(canvas, state, time)
  drawGrassForeground(canvas, state, time)
}

function drawSky(canvas, state) {
  const w = canvas.width
  const h = canvas.height

  for (let y = 0; y < h; y++) {
    const t = y / h
    const skyT = Math.pow(t, 0.7)
    const color = lerpMulti(SKY, skyT)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawStars(canvas, state, time) {
  for (const star of state.stars) {
    const twinkle = Math.sin(time * star.twinkleSpeed + star.phase) * 0.5 + 0.5
    const b = star.brightness * twinkle
    if (b < 0.2) continue

    const color = lerpMulti(STAR_COLORS, b)
    const ch = b > 0.8 ? '✦' : b > 0.5 ? '·' : '⋅'
    canvas.setCell(star.x, star.y, ch, color)
  }
}

function drawTrees(canvas, state) {
  const { trees } = state

  for (const tree of trees) {
    const { x, y, height, width, type } = tree

    for (let ty = 0; ty < height; ty++) {
      let rowWidth
      if (type === 'round') {
        const t = ty / height
        rowWidth = Math.floor(width * Math.sin(t * Math.PI) * 0.9) + 1
      } else {
        rowWidth = Math.floor(width * (1 - ty / height * 0.8))
      }

      const startX = x + Math.floor((width - rowWidth) / 2)
      for (let tx = 0; tx < rowWidth; tx++) {
        const px = startX + tx
        const py = y - ty
        if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue

        const noise = Math.sin(px * 1.3 + py * 0.7) * 0.3 + 0.5
        const color = lerpMulti(TREE_DARK, noise)
        canvas.setCell(px, py, BLOCK.full, color, color)
      }
    }

    for (let ty = 0; ty < 2; ty++) {
      const px = x + Math.floor(width / 2)
      const py = y + ty + 1
      if (py < canvas.height) {
        canvas.setCell(px, py, '│', '#0a0808')
      }
    }
  }
}

function drawGrassBackground(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const { grassTop } = state

  for (let y = grassTop; y < h; y++) {
    const depth = (y - grassTop) / (h - grassTop)
    for (let x = 0; x < w; x++) {
      const noise = Math.sin(x * 0.3 + y * 0.5) * 0.2 +
                   Math.sin(x * 0.7 + y * 0.2) * 0.15
      const t = Math.max(0, Math.min(1, depth * 0.6 + noise + 0.2))
      const color = lerpMulti(GRASS_DARK, t)
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawFireflies(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height

  for (const f of state.fireflies) {
    let glowVal
    const cycle = (time * f.glowSpeed + f.glowPhase) % (Math.PI * 2)

    if (f.pattern === 0) {
      glowVal = Math.pow(Math.max(0, Math.sin(cycle)), 3)
    } else if (f.pattern === 1) {
      const pulse = cycle % (Math.PI * 2)
      glowVal = pulse < f.glowDuration * 2 ? Math.sin(pulse / (f.glowDuration * 2) * Math.PI) : 0
    } else {
      glowVal = Math.pow(Math.max(0, Math.sin(cycle * 2)), 6)
    }

    if (glowVal < 0.05) continue

    const px = Math.floor(f.x)
    const py = Math.floor(f.y)
    const palette = f.warm ? FIREFLY_WARM : FIREFLY_GLOW

    if (f.size === 2 && glowVal > 0.5) {
      const outerGlow = glowVal * 0.3
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const gx = px + dx
          const gy = py + dy
          if (gx < 0 || gx >= w || gy < 0 || gy >= h) continue
          if (dx === 0 && dy === 0) continue
          const dist = Math.sqrt(dx * dx * 0.5 + dy * dy * 2)
          if (dist > 3) continue
          const falloff = (1 - dist / 3) * outerGlow
          if (falloff < 0.05) continue
          const cell = canvas.getCell(gx, gy)
          const bg = (cell && cell.bg) || '#040a02'
          const glowColor = lerpMulti(palette, falloff * 0.6)
          canvas.setCell(gx, gy, cell ? cell.char : ' ', cell ? cell.fg : null, lerp(bg, glowColor, falloff * 0.5))
        }
      }
    }

    const coreColor = lerpMulti(palette, Math.min(glowVal * 1.2, 1))
    const coreChar = glowVal > 0.7 ? '●' : glowVal > 0.4 ? '•' : '·'
    canvas.setCell(px, py, coreChar, coreColor)
  }
}

function drawGrassForeground(canvas, state, time) {
  const w = canvas.width
  const h = canvas.height
  const wind = state.windPhase

  for (let x = 0; x < w; x += 2) {
    const density = 2 + Math.floor(Math.sin(x * 0.4) * 1.5 + 1.5)
    for (let i = 0; i < density; i++) {
      const baseY = h - 1 - Math.floor(Math.random() * 4)
      const bladeH = 2 + Math.floor(Math.random() * 4)
      const sway = Math.sin(wind + x * 0.15 + i * 0.7) * 0.6

      for (let j = 0; j < bladeH; j++) {
        const py = baseY - j
        const px = x + Math.floor(sway * (j / bladeH))
        if (px < 0 || px >= w || py < 0 || py >= h) continue

        const t = j / bladeH
        let color
        if (t > 0.7) color = lerpMulti(GRASS_TIP, (t - 0.7) / 0.3)
        else if (t > 0.3) color = lerpMulti(GRASS_MID, (t - 0.3) / 0.4)
        else color = lerpMulti(GRASS_DARK, t / 0.3)

        const ch = j === bladeH - 1 ? '╻' : '│'
        canvas.setCell(px, py, ch, color)
      }
    }
  }
}
