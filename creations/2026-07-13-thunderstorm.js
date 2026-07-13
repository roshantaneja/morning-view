import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Thunderstorm'
export const description = 'Lightning cleaves the summer night above sleeping hills'
export const fps = 3

const SKY = ['#03030e', '#050516', '#07071e', '#0a0a28']
const CLOUD_DARK = ['#0e0e2a', '#14143c', '#1a1a50', '#222264']
const CLOUD_LIT = ['#2a2a72', '#383898', '#4848b8', '#5c5cd8']
const HILL_FAR = ['#060612', '#08081c', '#0b0b26']
const HILL_NEAR = ['#030308', '#050512', '#07071c']
const RAIN_DIM = ['#1c2468', '#2a38a0']
const RAIN_LIT = ['#4466dd', '#6688ee', '#88aaff']
const BOLT_CORE = ['#6080ee', '#90a8ff', '#baccff', '#dde8ff', '#ffffff']
const BOLT_GLOW = '#3030aa'
const FLASH_TINT = '#1c1c58'

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function hillShape(x, w, seed, amp) {
  return Math.sin(x / w * Math.PI * 2.6 + seed) * amp * 0.5
    + Math.sin(x / w * Math.PI * 7.4 + seed * 2.1) * amp * 0.25
    + Math.sin(x / w * Math.PI * 14.6 + seed * 3.7) * amp * 0.15
    + Math.sin(x / w * Math.PI * 28.2 + seed * 5.3) * amp * 0.1
}

function buildBolt(startX, startY, endY, rng) {
  const segs = []
  let x = startX, y = startY
  while (y < endY) {
    const ny = Math.min(y + 1 + Math.floor(rng() * 3), endY)
    const nx = x + (rng() - 0.5) * 5
    segs.push({ x1: x, y1: y, x2: nx, y2: ny, main: true })
    if (rng() > 0.6) {
      const dir = rng() > 0.5 ? 1 : -1
      let bx = x, by = y
      const len = 2 + Math.floor(rng() * 4)
      for (let b = 0; b < len; b++) {
        const bnx = bx + dir * (0.8 + rng() * 1.2)
        const bny = by + 1 + Math.floor(rng())
        segs.push({ x1: bx, y1: by, x2: bnx, y2: bny, main: false })
        bx = bnx
        by = bny
      }
    }
    x = nx
    y = ny
  }
  return segs
}

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height
  const rng = srand(42)

  const drops = Array.from({ length: Math.floor(w * 0.55) }, () => ({
    x: rng() * (w + 20) - 10,
    y: rng() * h,
    speed: 2.5 + rng() * 2.5,
    drift: 0.3 + rng() * 0.6,
    bright: rng(),
  }))

  const clouds = Array.from({ length: 14 }, () => ({
    cx: rng() * w,
    cy: Math.floor(h * 0.04 + rng() * h * 0.24),
    rx: Math.max(1, Math.floor(w * 0.06 + rng() * w * 0.2)),
    ry: Math.max(1, Math.floor(h * 0.02 + rng() * h * 0.07)),
    density: 0.3 + rng() * 0.7,
    seed: rng() * 100,
  }))

  const trees = Array.from({ length: Math.floor(w * 0.04) }, () => ({
    x: Math.floor(rng() * w),
    h: 2 + Math.floor(rng() * 4),
    far: rng() > 0.5,
  }))

  return { phase: 0, drops, clouds, trees, bolt: null, flash: 0, cooldown: 10 }
}

export function render(canvas, data, state) {
  drawScene(canvas, state)
}

export function update(canvas, data, frame, state) {
  state.phase += 0.08
  const w = canvas.width
  const h = canvas.height

  for (const d of state.drops) {
    d.y += d.speed
    d.x += d.drift
    if (d.y > h + 2) {
      d.y = -3 - Math.random() * 5
      d.x = Math.random() * (w + 20) - 10
    }
    if (d.x > w + 10) d.x -= w + 20
  }

  state.flash = Math.max(0, state.flash - 0.35)
  state.cooldown--

  if (state.bolt) {
    state.bolt.age++
    if (state.bolt.age >= state.bolt.life) state.bolt = null
  }

  if (!state.bolt && state.cooldown <= 0 && Math.random() < 0.14) {
    const rng = srand(Math.floor(Math.random() * 99999))
    const bx = Math.floor(w * 0.1 + Math.random() * w * 0.8)
    const cloudBase = Math.floor(h * 0.27)
    const groundY = Math.floor(h * 0.72 + hillShape(bx, w, 3.14, h * 0.08))
    state.bolt = {
      segs: buildBolt(bx, cloudBase, groundY, rng),
      age: 0,
      life: 3,
    }
    state.flash = 1.0
    state.cooldown = 6 + Math.floor(Math.random() * 12)
  }

  drawScene(canvas, state)
}

function drawScene(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const fl = state.flash

  drawSky(canvas, w, h, fl)
  drawClouds(canvas, state, w, h, fl)
  drawHills(canvas, state, w, h, fl)
  drawRain(canvas, state, w, h, fl)
  if (state.bolt) drawLightning(canvas, state.bolt, w, h)
}

function drawSky(canvas, w, h, fl) {
  for (let y = 0; y < h; y++) {
    const t = Math.min(1, y / (h * 0.65))
    let color = lerpMulti(SKY, t)
    if (fl > 0 && y < h * 0.65) {
      color = lerp(color, FLASH_TINT, fl * 0.45 * (1 - t))
    }
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, color)
    }
  }
}

function drawClouds(canvas, state, w, h, fl) {
  for (const cl of state.clouds) {
    const driftX = cl.cx + Math.sin(state.phase * 0.15 + cl.seed) * 3

    for (let dy = -cl.ry; dy <= cl.ry; dy++) {
      for (let dx = -cl.rx; dx <= cl.rx; dx++) {
        const sx = Math.floor(driftX + dx)
        const sy = cl.cy + dy
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue

        const dist = (dx / cl.rx) ** 2 + (dy / cl.ry) ** 2
        if (dist > 1) continue

        const edge = 1 - Math.sqrt(dist)
        const noise = Math.sin(dx * 0.4 + dy * 0.7 + cl.seed) * 0.3 + 0.7
        const dens = edge * cl.density * noise
        if (dens < 0.08) continue

        const pal = fl > 0.3 ? CLOUD_LIT : CLOUD_DARK
        const color = lerpMulti(pal, Math.min(1, dens))
        const cell = canvas.getCell(sx, sy)
        if (!cell) continue
        const bg = lerp(cell.bg || SKY[0], color, dens * 0.7)

        let ch
        if (dens > 0.5) ch = SHADE[3]
        else if (dens > 0.3) ch = SHADE[2]
        else if (dens > 0.15) ch = SHADE[1]
        else ch = SHADE[0]

        canvas.setCell(sx, sy, ch, color, bg)
      }
    }
  }
}

function drawHills(canvas, state, w, h, fl) {
  const farBase = Math.floor(h * 0.70)
  const nearBase = Math.floor(h * 0.80)

  for (let x = 0; x < w; x++) {
    const farTop = Math.floor(farBase + hillShape(x, w, 3.14, h * 0.08))
    for (let y = farTop; y < h; y++) {
      const t = Math.min(1, (y - farTop) / (h * 0.13))
      let color = lerpMulti(HILL_FAR, t)
      if (fl > 0) color = lerp(color, '#141440', fl * 0.2)
      canvas.setCell(x, y, BLOCK.full, color, color)
    }
  }

  for (const tr of state.trees) {
    if (!tr.far) continue
    const baseY = Math.floor(farBase + hillShape(tr.x, w, 3.14, h * 0.08))
    const color = fl > 0 ? lerp('#050510', '#101030', fl * 0.3) : '#050510'
    drawTree(canvas, tr.x, baseY, tr.h, color, w, h)
  }

  for (let x = 0; x < w; x++) {
    const nearTop = Math.floor(nearBase + hillShape(x, w, 7.5, h * 0.05))
    for (let y = nearTop; y < h; y++) {
      const t = Math.min(1, (y - nearTop) / (h * 0.1))
      let color = lerpMulti(HILL_NEAR, t)
      if (fl > 0) color = lerp(color, '#0a0a28', fl * 0.15)
      canvas.setCell(x, y, BLOCK.full, color, color)
    }
  }

  for (const tr of state.trees) {
    if (tr.far) continue
    const baseY = Math.floor(nearBase + hillShape(tr.x, w, 7.5, h * 0.05))
    const color = fl > 0 ? lerp('#030308', '#0a0a20', fl * 0.3) : '#030308'
    drawTree(canvas, tr.x, baseY, tr.h, color, w, h)
  }
}

function drawTree(canvas, x, baseY, height, color, w, h) {
  for (let i = 0; i < height; i++) {
    const ty = baseY - i - 1
    if (ty < 0 || ty >= h) continue
    const spread = Math.max(0, Math.floor((height - i) * 0.45))
    if (i === height - 1) {
      if (x >= 0 && x < w) canvas.setCell(x, ty, '▲', color)
      continue
    }
    for (let dx = -spread; dx <= spread; dx++) {
      const tx = x + dx
      if (tx >= 0 && tx < w) canvas.setCell(tx, ty, BLOCK.full, color, color)
    }
  }
}

function drawRain(canvas, state, w, h, fl) {
  const pal = fl > 0.2 ? RAIN_LIT : RAIN_DIM
  for (const d of state.drops) {
    const dx = Math.floor(d.x)
    const dy = Math.floor(d.y)
    if (dx < 0 || dx >= w || dy < 0 || dy >= h) continue

    const cell = canvas.getCell(dx, dy)
    if (!cell) continue
    const color = lerpMulti(pal, d.bright)
    canvas.setCell(dx, dy, '│', color, cell.bg)

    if (dy - 1 >= 0) {
      const above = canvas.getCell(dx, dy - 1)
      if (above) {
        canvas.setCell(dx, dy - 1, '╵', lerp(color, above.bg || SKY[0], 0.5), above.bg)
      }
    }
  }
}

function drawLightning(canvas, bolt, w, h) {
  const fade = Math.max(0, 1 - bolt.age / bolt.life)

  for (const seg of bolt.segs) {
    const x1 = Math.round(seg.x1)
    const y1 = Math.round(seg.y1)
    const x2 = Math.round(seg.x2)
    const y2 = Math.round(seg.y2)
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1)

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = Math.round(x1 + (x2 - x1) * t)
      const py = Math.round(y1 + (y2 - y1) * t)
      if (px < 0 || px >= w || py < 0 || py >= h) continue

      const glowR = seg.main ? 3 : 1
      for (let gy = -glowR; gy <= glowR; gy++) {
        for (let gx = -glowR * 2; gx <= glowR * 2; gx++) {
          if (gx === 0 && gy === 0) continue
          const gpx = px + gx
          const gpy = py + gy
          if (gpx < 0 || gpx >= w || gpy < 0 || gpy >= h) continue
          const dist = Math.sqrt((gx / 2) ** 2 + gy ** 2) / glowR
          if (dist > 1.2) continue
          const strength = (1 - dist) * fade * (seg.main ? 0.35 : 0.15)
          if (strength < 0.03) continue
          const cell = canvas.getCell(gpx, gpy)
          if (!cell) continue
          canvas.setCell(gpx, gpy, cell.char, cell.fg, lerp(cell.bg || '#03030e', BOLT_GLOW, strength))
        }
      }

      const coreColor = lerpMulti(BOLT_CORE, Math.min(1, fade * (seg.main ? 1.2 : 0.7)))
      canvas.setCell(px, py, BLOCK.full, coreColor, coreColor)
    }
  }
}
