import { lerp, lerpMulti, BLOCK } from '../src/theme.js'

export const title = 'Abyssal Bloom'
export const description = 'Deep below where sunlight fades, lanterns of the deep pulse their ancient, quiet light'
export const fps = 3

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function mkJelly(rng, w, h, idx) {
  const hues = [
    { r: 120, g: 180, b: 255 },
    { r: 255, g: 120, b: 200 },
    { r: 180, g: 255, b: 200 },
    { r: 200, g: 160, b: 255 },
    { r: 255, g: 200, b: 120 },
  ]
  const hue = hues[idx % hues.length]
  const size = 0.6 + rng() * 0.5
  const bellW = Math.floor((6 + rng() * 5) * size)
  const bellH = Math.floor((4 + rng() * 3) * size)
  const tentLen = Math.floor((12 + rng() * 18) * size)
  const nTents = 3 + Math.floor(rng() * 4)

  const tents = []
  for (let i = 0; i < nTents; i++) {
    tents.push({
      ox: (i / (nTents - 1)) * (bellW - 2) - (bellW - 2) / 2,
      amp: 0.8 + rng() * 1.5,
      freq: 0.3 + rng() * 0.4,
      phase: rng() * Math.PI * 2,
      len: Math.floor(tentLen * (0.5 + rng() * 0.5)),
    })
  }

  return {
    x: 0.12 + rng() * 0.76,
    y: 0.08 + rng() * 0.55,
    vx: (rng() - 0.5) * 0.003,
    vy: -0.004 - rng() * 0.006,
    bellW, bellH, tentLen, tents,
    hue,
    pulsePhase: rng() * Math.PI * 2,
    pulseSpeed: 0.8 + rng() * 0.6,
    glowR: Math.floor((bellW + 8) * 1.8),
    depth: 0.5 + rng() * 0.5,
    size,
  }
}

export function setup(canvas) {
  const rng = srand(827)
  const w = canvas.width, h = canvas.height

  const jellies = []
  for (let i = 0; i < 5; i++) {
    jellies.push(mkJelly(rng, w, h, i))
  }
  jellies.sort((a, b) => a.depth - b.depth)

  const particles = []
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: rng(),
      y: rng(),
      vy: -0.002 - rng() * 0.005,
      vx: (rng() - 0.5) * 0.001,
      bri: 0.2 + rng() * 0.6,
      ph: rng() * Math.PI * 2,
      size: rng() > 0.7,
    })
  }

  return { jellies, particles }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  const dt = frame.dt
  const t = frame.elapsed

  for (const j of state.jellies) {
    j.y += j.vy * dt
    j.x += j.vx * dt + Math.sin(t * 0.3 + j.pulsePhase) * 0.0003
    if (j.y < -0.3) { j.y = 1.1; j.x = 0.12 + (j.pulsePhase % 1) * 0.76 }
    if (j.x < 0.05) j.vx += 0.0001
    if (j.x > 0.95) j.vx -= 0.0001
  }

  for (const p of state.particles) {
    p.y += p.vy * dt
    p.x += p.vx + Math.sin(t * 0.5 + p.ph) * 0.0002
    if (p.y < -0.02) { p.y = 1.02; p.x = Math.abs(Math.sin(p.ph + t)) }
  }

  drawScene(canvas, state, t)
}

function drawScene(c, s, t) {
  const w = c.width, h = c.height
  drawOcean(c, w, h, t)
  drawLightShafts(c, w, h, t)
  drawParticles(c, w, h, s, t)
  for (const j of s.jellies) {
    drawJellyGlow(c, w, h, j, t)
  }
  for (const j of s.jellies) {
    drawJelly(c, w, h, j, t)
  }
}

function drawOcean(c, w, h, t) {
  const deep = ['#010208', '#020412', '#030820', '#041030', '#061838']
  for (let y = 0; y < h; y++) {
    const yt = y / Math.max(1, h - 1)
    const lightFromAbove = Math.pow(1 - yt, 3) * 0.15
    const bg = lerpMulti(deep, yt)
    for (let x = 0; x < w; x++) {
      const ripple = Math.sin(x * 0.08 + y * 0.04 + t * 0.3) * 0.02
      const shade = lightFromAbove + ripple
      if (shade > 0.005) {
        c.setCell(x, y, ' ', null, lerp(bg, '#1a3060', shade))
      } else {
        c.setCell(x, y, ' ', null, bg)
      }
    }
  }
}

function drawLightShafts(c, w, h, t) {
  const nShafts = 4
  for (let si = 0; si < nShafts; si++) {
    const cx = w * (0.15 + si * 0.22) + Math.sin(t * 0.15 + si * 2) * w * 0.04
    const shaftW = w * 0.06
    const maxDepth = h * (0.3 + si * 0.05)

    for (let y = 0; y < Math.min(maxDepth, h); y++) {
      const yt = y / maxDepth
      const fade = Math.pow(1 - yt, 2.5) * 0.06
      if (fade < 0.003) continue

      const spread = shaftW * (1 + yt * 0.5)
      for (let dx = -Math.floor(spread); dx <= Math.floor(spread); dx++) {
        const px = Math.floor(cx) + dx
        if (px < 0 || px >= w) continue
        const xFade = 1 - Math.abs(dx) / spread
        const intensity = fade * xFade * xFade
        if (intensity < 0.002) continue
        const cell = c.getCell(px, y)
        if (!cell || !cell.bg) continue
        c.setCell(px, y, cell.char, cell.fg, lerp(cell.bg, '#2a5088', intensity))
      }
    }
  }
}

function drawParticles(c, w, h, s, t) {
  for (const p of s.particles) {
    const px = Math.floor(p.x * w)
    const py = Math.floor(p.y * h)
    if (px < 3 || px >= w - 3 || py < 0 || py >= h - 3) continue
    const pulse = Math.sin(t * 0.8 + p.ph) * 0.3 + 0.7
    const bri = p.bri * pulse
    if (bri < 0.15) continue
    const ch = p.size ? '·' : '.'
    c.setCell(px, py, ch, col(
      Math.floor(40 + bri * 80),
      Math.floor(70 + bri * 100),
      Math.floor(100 + bri * 120)
    ))
  }
}

function drawJellyGlow(c, w, h, j, t) {
  const pulse = Math.sin(t * j.pulseSpeed + j.pulsePhase) * 0.5 + 0.5
  const jx = Math.floor(j.x * w)
  const jy = Math.floor(j.y * h)
  const R = j.glowR * (0.8 + pulse * 0.4)
  const intensity = 0.07 + pulse * 0.06
  const depthDim = j.depth

  const top = Math.max(0, Math.floor(jy - R))
  const bot = Math.min(h, Math.ceil(jy + R))
  const left = Math.max(0, Math.floor(jx - R))
  const right = Math.min(w, Math.ceil(jx + R))

  const glowCol = col(
    Math.floor(j.hue.r * 0.5),
    Math.floor(j.hue.g * 0.5),
    Math.floor(j.hue.b * 0.5)
  )

  for (let y = top; y < bot; y++) {
    for (let x = left; x < right; x++) {
      const dx = x - jx
      const dy = (y - jy) * 0.7
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= R) continue
      const falloff = Math.pow(1 - dist / R, 2) * intensity * depthDim
      if (falloff < 0.003) continue
      const cell = c.getCell(x, y)
      if (!cell || !cell.bg) continue
      c.setCell(x, y, cell.char, cell.fg, lerp(cell.bg, glowCol, falloff))
    }
  }
}

function drawJelly(c, w, h, j, t) {
  const jx = Math.floor(j.x * w)
  const jy = Math.floor(j.y * h)
  const pulse = Math.sin(t * j.pulseSpeed + j.pulsePhase) * 0.5 + 0.5
  const bellSqueeze = 1 + pulse * 0.15
  const bW = Math.floor(j.bellW * bellSqueeze)
  const bH = Math.max(2, Math.floor(j.bellH * (1 - pulse * 0.1)))
  const depthDim = j.depth

  for (let dy = 0; dy < bH; dy++) {
    const rowT = dy / Math.max(1, bH - 1)
    const rowWidth = Math.floor(bW * Math.sin((rowT * 0.8 + 0.1) * Math.PI))
    if (rowWidth < 1) continue

    for (let dx = -rowWidth; dx <= rowWidth; dx++) {
      const px = jx + dx
      const py = jy + dy
      if (px < 3 || px >= w - 3 || py < 0 || py >= h - 3) continue

      const xT = Math.abs(dx) / Math.max(1, rowWidth)
      const edgeFade = 1 - Math.pow(xT, 1.5)
      const topFade = rowT < 0.3 ? rowT / 0.3 : 1
      const bri = edgeFade * topFade * depthDim

      const innerGlow = (1 - xT) * (1 - rowT * 0.5) * pulse * 0.4
      const totalBri = Math.min(1, bri * 0.6 + innerGlow)

      const fg = col(
        Math.floor(j.hue.r * totalBri),
        Math.floor(j.hue.g * totalBri),
        Math.floor(j.hue.b * totalBri)
      )

      const ch = rowT > 0.85 ? BLOCK.lower
        : (xT > 0.7 ? '░' : (innerGlow > 0.15 ? '▓' : '▒'))
      c.setCell(px, py, ch, fg)
    }
  }

  const rimY = jy + bH
  if (rimY >= 0 && rimY < h - 3) {
    const rimW = Math.floor(bW * 0.9 * bellSqueeze)
    for (let dx = -rimW; dx <= rimW; dx++) {
      const px = jx + dx
      if (px < 3 || px >= w - 3) continue
      const xT = Math.abs(dx) / Math.max(1, rimW)
      const bri = (1 - xT * xT) * depthDim * 0.7
      const wave = Math.sin(dx * 0.5 + t * 2) * 0.15
      c.setCell(px, rimY, '~', col(
        Math.floor(j.hue.r * (bri + wave)),
        Math.floor(j.hue.g * (bri + wave)),
        Math.floor(j.hue.b * (bri + wave))
      ))
    }
  }

  drawTentacles(c, w, h, j, t, jx, jy + bH + 1, bW, depthDim, pulse)

  const armLen = Math.floor(j.bellH * 2.5)
  const nArms = 2
  for (let ai = 0; ai < nArms; ai++) {
    const armOx = (ai - (nArms - 1) / 2) * Math.floor(bW * 0.3)
    for (let ay = 0; ay < armLen; ay++) {
      const ayT = ay / Math.max(1, armLen)
      const sway = Math.sin(ay * 0.4 + t * 1.2 + ai * 1.5 + j.pulsePhase) * (1 + ayT * 2)
      const px = jx + Math.floor(armOx + sway)
      const py = jy + bH + 1 + ay
      if (px < 3 || px >= w - 3 || py < 0 || py >= h - 3) continue
      const fade = (1 - ayT) * depthDim * 0.5
      if (fade < 0.05) continue
      const ruffleChar = ay % 3 === 0 ? '≈' : (ay % 3 === 1 ? '∽' : '~')
      c.setCell(px, py, ruffleChar, col(
        Math.floor(j.hue.r * fade * 0.8),
        Math.floor(j.hue.g * fade * 0.8),
        Math.floor(j.hue.b * fade * 0.8)
      ))
    }
  }
}

function drawTentacles(c, w, h, j, t, cx, startY, bellW, depthDim, pulse) {
  for (const tent of j.tents) {
    for (let ty = 0; ty < tent.len; ty++) {
      const tyT = ty / Math.max(1, tent.len)
      const drag = pulse * 0.5 * tyT
      const sway = Math.sin(ty * tent.freq + t * 0.8 + tent.phase) * tent.amp * (1 + tyT)
      const px = cx + Math.floor(tent.ox + sway + drag * 2)
      const py = startY + ty
      if (px < 3 || px >= w - 3 || py < 0 || py >= h - 3) continue
      const fade = Math.pow(1 - tyT, 1.5) * depthDim * 0.45
      if (fade < 0.03) continue
      const dotPulse = Math.sin(ty * 0.8 + t * 1.5 + tent.phase) * 0.3 + 0.7
      const ch = tyT > 0.7 ? '·' : (ty % 2 === 0 ? '│' : '┊')
      c.setCell(px, py, ch, col(
        Math.floor(j.hue.r * fade * dotPulse),
        Math.floor(j.hue.g * fade * dotPulse),
        Math.floor(j.hue.b * fade * dotPulse)
      ))
    }
  }
}
