import { hex, bgHex, lerp, lerpMulti, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Kelp Forest'
export const description = 'Sunlight filters through a cathedral of swaying fronds — the quiet architecture of the sea'
export const fps = 3

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const WATER_TOP = ['#062838', '#083848', '#0a4858', '#0c5060']
const WATER_MID = ['#041828', '#062030', '#082838', '#0a3040']
const WATER_DEEP = ['#020c14', '#030e18', '#04101c', '#051220']

const KELP_GREENS = ['#1a4420', '#246628', '#2e7830', '#388a38', '#44a040', '#55b848']
const KELP_BROWNS = ['#2a3018', '#384020', '#445028', '#506030']
const SAND = ['#1c1a10', '#282418', '#342e20', '#403828']

function waterColor(y, H) {
  const t = y / H
  if (t < 0.15) return lerpMulti(WATER_TOP, t / 0.15)
  if (t < 0.6) return lerpMulti(WATER_MID, (t - 0.15) / 0.45)
  return lerpMulti(WATER_DEEP, Math.min(1, (t - 0.6) / 0.4))
}

function makeKelp(rng, W, H) {
  const fronds = []
  const count = 18 + Math.floor(rng() * 10)
  for (let i = 0; i < count; i++) {
    const baseX = 4 + rng() * (W - 8)
    const baseY = H - 3 - rng() * 4
    const height = H * (0.4 + rng() * 0.45)
    const swayAmp = 1.5 + rng() * 3
    const swayFreq = 0.3 + rng() * 0.4
    const swayPhase = rng() * TAU
    const thickness = rng() < 0.3 ? 2 : 1
    const shade = Math.floor(rng() * KELP_GREENS.length)
    const depth = rng()
    const leafInterval = 3 + Math.floor(rng() * 4)
    const leafSide = rng() < 0.5 ? -1 : 1
    fronds.push({ baseX, baseY, height, swayAmp, swayFreq, swayPhase, thickness, shade, depth, leafInterval, leafSide })
  }
  fronds.sort((a, b) => a.depth - b.depth)
  return fronds
}

function makeFish(rng, W, H) {
  const fish = []
  const count = 8 + Math.floor(rng() * 6)
  for (let i = 0; i < count; i++) {
    const y = H * (0.1 + rng() * 0.6)
    const x = rng() * W
    const speed = 0.15 + rng() * 0.35
    const dir = rng() < 0.5 ? 1 : -1
    const size = rng() < 0.3 ? 'large' : rng() < 0.6 ? 'medium' : 'small'
    const school = Math.floor(rng() * 4)
    const wobblePhase = rng() * TAU
    const depth = 0.2 + rng() * 0.6
    const hue = Math.floor(40 + rng() * 60)
    fish.push({ x, y, speed, dir, size, school, wobblePhase, depth, hue })
  }
  return fish
}

function makeBubbles(rng, W, H) {
  const bubbles = []
  const count = 30 + Math.floor(rng() * 20)
  for (let i = 0; i < count; i++) {
    bubbles.push({
      x: 4 + rng() * (W - 8),
      y: rng() * H,
      speed: 0.2 + rng() * 0.5,
      drift: (rng() - 0.5) * 0.15,
      size: rng() < 0.7 ? 'tiny' : 'small',
      brightness: 0.3 + rng() * 0.5,
    })
  }
  return bubbles
}

function makeShafts(rng, W, H) {
  const shafts = []
  const count = 5 + Math.floor(rng() * 4)
  for (let i = 0; i < count; i++) {
    const topX = rng() * W
    const angle = -0.08 + rng() * 0.16
    const width = 3 + rng() * 6
    const intensity = 0.15 + rng() * 0.25
    const pulsePhase = rng() * TAU
    const pulseRate = 0.2 + rng() * 0.3
    const reach = 0.4 + rng() * 0.4
    shafts.push({ topX, angle, width, intensity, pulsePhase, pulseRate, reach })
  }
  return shafts
}

function makeParticles(rng, W, H) {
  const particles = []
  const count = 60 + Math.floor(rng() * 40)
  for (let i = 0; i < count; i++) {
    particles.push({
      x: rng() * W,
      y: rng() * H,
      vx: (rng() - 0.5) * 0.08,
      vy: (rng() - 0.5) * 0.04 - 0.02,
      brightness: 0.1 + rng() * 0.3,
    })
  }
  return particles
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(918)
  return {
    fronds: makeKelp(rng, W, H),
    fish: makeFish(rng, W, H),
    bubbles: makeBubbles(rng, W, H),
    shafts: makeShafts(rng, W, H),
    particles: makeParticles(rng, W, H),
    time: 0,
  }
}

function drawScene(canvas, state) {
  const W = canvas.width, H = canvas.height
  const t = state.time

  for (let y = 0; y < H; y++) {
    const wc = waterColor(y, H)
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bgHex(wc))
    }
  }

  for (const shaft of state.shafts) {
    const pulse = 0.7 + 0.3 * Math.sin(t * shaft.pulseRate + shaft.pulsePhase)
    const intensity = shaft.intensity * pulse
    const maxY = Math.floor(H * shaft.reach)
    for (let y = 0; y < maxY; y++) {
      const yT = y / maxY
      const fade = (1 - yT) * (1 - yT)
      const cx = shaft.topX + shaft.angle * y
      const halfW = shaft.width * (1 + yT * 0.5) * 0.5
      const startX = Math.floor(cx - halfW)
      const endX = Math.ceil(cx + halfW)
      for (let x = startX; x <= endX; x++) {
        if (x < 0 || x >= W) continue
        const dx = Math.abs(x - cx) / halfW
        const falloff = Math.max(0, 1 - dx * dx)
        const a = intensity * fade * falloff
        if (a < 0.02) continue
        const base = waterColor(y, H)
        const lit = lerp(base, '#5a8844', Math.min(1, a))
        const cell = canvas.getCell(x, y)
        const ch = cell && cell.char !== ' ' ? cell.char : ' '
        canvas.setCell(x, y, ch, cell ? cell.fg : null, bgHex(lit))
      }
    }
  }

  for (const p of state.particles) {
    const px = Math.floor(p.x), py = Math.floor(p.y)
    if (px < 0 || px >= W || py < 0 || py >= H) continue
    const b = Math.floor(40 + p.brightness * 60)
    const fg = col(b + 20, b + 40, b + 30)
    canvas.setCell(px, py, '·', hex(fg))
  }

  const sandStart = H - 5
  for (let y = sandStart; y < H; y++) {
    const t2 = (y - sandStart) / 5
    const sc = lerpMulti(SAND, Math.min(1, t2))
    for (let x = 0; x < W; x++) {
      const undulation = Math.sin(x * 0.15 + y * 0.3) * 0.8
      if (y >= sandStart + 2 + undulation) {
        const detail = Math.sin(x * 0.4 + y * 1.2) * 0.3
        const sc2 = lerp(sc, '#4a4430', Math.max(0, detail))
        canvas.setCell(x, y, SHADE[Math.min(3, Math.floor(t2 * 2.5))], hex(lerp(sc2, '#3a3020', 0.3)), bgHex(sc2))
      }
    }
  }

  for (const frond of state.fronds) {
    drawFrond(canvas, frond, t, W, H)
  }

  for (const fish of state.fish) {
    drawFish(canvas, fish, t, W, H)
  }

  for (const bubble of state.bubbles) {
    const bx = Math.floor(bubble.x), by = Math.floor(bubble.y)
    if (bx < 1 || bx >= W - 1 || by < 0 || by >= H) continue
    const b = Math.floor(80 + bubble.brightness * 120)
    const fg = col(b, b + 20, b + 30)
    if (bubble.size === 'tiny') {
      canvas.setCell(bx, by, '°', hex(fg))
    } else {
      canvas.setCell(bx, by, '○', hex(fg))
    }
  }
}

function drawFrond(canvas, frond, time, W, H) {
  const segments = Math.floor(frond.height)
  const dimFactor = 0.4 + frond.depth * 0.6

  for (let i = 0; i < segments; i++) {
    const segT = i / segments
    const swayAmount = segT * segT * frond.swayAmp
    const sway = Math.sin(time * frond.swayFreq + frond.swayPhase + segT * 1.5) * swayAmount
    const secondarySway = Math.sin(time * frond.swayFreq * 1.7 + frond.swayPhase * 0.6 + segT * 2.5) * swayAmount * 0.3

    const x = Math.round(frond.baseX + sway + secondarySway)
    const y = Math.round(frond.baseY - i)

    if (x < 0 || x >= W || y < 0 || y >= H) continue

    const greenT = segT * 0.7 + 0.15
    const baseColor = lerpMulti(KELP_GREENS, Math.min(1, greenT))
    const finalColor = lerp('#020c14', baseColor, dimFactor)

    const stalkChar = segT < 0.1 ? BLOCK.full : segT < 0.85 ? '┃' : '╻'
    canvas.setCell(x, y, stalkChar, hex(finalColor))

    if (frond.thickness > 1 && segT > 0.05 && segT < 0.9) {
      const x2 = x + (sway > 0 ? -1 : 1)
      if (x2 >= 0 && x2 < W) {
        const dimColor = lerp(finalColor, '#020c14', 0.35)
        canvas.setCell(x2, y, '│', hex(dimColor))
      }
    }

    if (i > 2 && i % frond.leafInterval === 0) {
      const leafDir = ((Math.floor(i / frond.leafInterval) % 2) === 0 ? 1 : -1) * frond.leafSide
      const leafSway = Math.sin(time * frond.swayFreq * 1.2 + frond.swayPhase + i * 0.5) * 0.8
      for (let l = 1; l <= 3; l++) {
        const lx = x + leafDir * l + Math.round(leafSway * l * 0.3)
        const ly = y + (l > 2 ? 1 : 0)
        if (lx < 0 || lx >= W || ly < 0 || ly >= H) continue
        const leafT = greenT + 0.1
        const leafColor = lerpMulti(KELP_GREENS, Math.min(1, leafT))
        const finalLeafColor = lerp('#020c14', leafColor, dimFactor * 0.85)
        const leafChar = l === 3 ? '~' : l === 2 ? '━' : '─'
        canvas.setCell(lx, ly, leafChar, hex(finalLeafColor))
      }
    }

    if (segT > 0.92) {
      const blobColor = lerpMulti(KELP_BROWNS, frond.depth)
      const finalBlobColor = lerp('#020c14', blobColor, dimFactor)
      const bx = x + (sway > 0 ? 1 : -1)
      if (bx >= 0 && bx < W && y >= 0 && y < H) {
        canvas.setCell(bx, y, '●', hex(finalBlobColor))
      }
      if (y - 1 >= 0) {
        canvas.setCell(x, y - 1, '◦', hex(finalBlobColor))
      }
    }
  }
}

function drawFish(canvas, fish, time, W, H) {
  const x = Math.floor(fish.x)
  const wobble = Math.sin(time * 2.5 + fish.wobblePhase) * 0.6
  const y = Math.floor(fish.y + wobble)

  if (y < 0 || y >= H) return

  const dim = 0.3 + fish.depth * 0.5
  const r = Math.floor(20 + fish.hue * 0.3)
  const g = Math.floor(40 + fish.hue * 0.8)
  const b = Math.floor(60 + fish.hue * 0.5)
  const fc = col(Math.floor(r * dim), Math.floor(g * dim), Math.floor(b * dim))

  if (fish.size === 'large') {
    const body = fish.dir > 0 ? ['><>', '  '] : ['<><', '  ']
    for (let i = 0; i < body[0].length; i++) {
      const bx = x + i
      if (bx >= 0 && bx < W) {
        canvas.setCell(bx, y, body[0][i], hex(fc))
      }
    }
  } else if (fish.size === 'medium') {
    const body = fish.dir > 0 ? '<>' : '><'
    for (let i = 0; i < body.length; i++) {
      const bx = x + i
      if (bx >= 0 && bx < W) {
        canvas.setCell(bx, y, body[i], hex(fc))
      }
    }
  } else {
    const ch = fish.dir > 0 ? '>' : '<'
    if (x >= 0 && x < W) {
      canvas.setCell(x, y, ch, hex(fc))
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state)
}

export function update(canvas, data, frame, state) {
  const W = canvas.width, H = canvas.height
  state.time = frame.elapsed

  for (const fish of state.fish) {
    fish.x += fish.speed * fish.dir
    if (fish.dir > 0 && fish.x > W + 5) fish.x = -5
    if (fish.dir < 0 && fish.x < -5) fish.x = W + 5
  }

  for (const bubble of state.bubbles) {
    bubble.y -= bubble.speed
    bubble.x += bubble.drift + Math.sin(state.time * 1.5 + bubble.x * 0.1) * 0.08
    if (bubble.y < -1) {
      bubble.y = H + 1
      bubble.x = 4 + Math.abs(Math.sin(bubble.x * 7.3 + state.time)) * (W - 8)
    }
  }

  for (const p of state.particles) {
    p.x += p.vx + Math.sin(state.time * 0.5 + p.y * 0.1) * 0.03
    p.y += p.vy
    if (p.x < 0) p.x = W - 1
    if (p.x >= W) p.x = 0
    if (p.y < 0) p.y = H - 1
    if (p.y >= H) p.y = 0
  }

  drawScene(canvas, state)
}
