import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Coral Reef'
export const description = 'Tropical fish drift through a living reef beneath dappled light'
export const fps = 3

const OCEAN_TOP = ['#041828', '#082838', '#0c3848', '#104858']
const OCEAN_BOT = ['#020810', '#040c18', '#061020', '#081428']
const SAND = ['#3a3018', '#4a3e20', '#5a4c28', '#6a5a30']
const SAND_DETAIL = ['#2a2210', '#342a14', '#3e3218']

const CORAL_PINK = ['#5a1030', '#882048', '#bb3868', '#dd5888', '#ee80a8']
const CORAL_ORANGE = ['#5a2800', '#884010', '#bb6020', '#dd8838', '#eea858']
const CORAL_PURPLE = ['#301040', '#481868', '#683090', '#8848b0', '#a868cc']
const CORAL_RED = ['#4a0808', '#781818', '#a83030', '#cc4848', '#dd6868']
const CORAL_YELLOW = ['#4a3800', '#786008', '#a88818', '#ccaa30', '#ddcc58']

const SEAWEED = ['#0a2008', '#143810', '#1e5018', '#286820', '#328028']
const SEAWEED_LIGHT = ['#1e5018', '#288020', '#38a830', '#48c840']

const BUBBLE_COLORS = ['#4090b0', '#50a8c8', '#60c0dd', '#80d8ee', '#a0eeff']

const LIGHT_RAY = ['#ffffff08', '#ffffff10', '#ffffff18', '#ffffff20']

const FISH_SPECIES = [
  { name: 'clown', body: '#ff8820', stripe: '#ffffff', fin: '#ff5500', size: 'small' },
  { name: 'tang', body: '#2060dd', stripe: '#ffcc00', fin: '#1848aa', size: 'medium' },
  { name: 'angel', body: '#ffdd44', stripe: '#000000', fin: '#ffaa00', size: 'medium' },
  { name: 'damsel', body: '#00aaee', stripe: '#4488ff', fin: '#0088cc', size: 'small' },
  { name: 'cardinal', body: '#cc3300', stripe: '#ff6644', fin: '#aa2200', size: 'small' },
  { name: 'wrasse', body: '#44bb88', stripe: '#88ddbb', fin: '#228866', size: 'medium' },
  { name: 'goby', body: '#ddaa44', stripe: '#eedd88', fin: '#bb8822', size: 'tiny' },
]

const ASPECT = 2.0

function makeFish(w, h, sandTop, index) {
  const species = FISH_SPECIES[index % FISH_SPECIES.length]
  const swimZoneTop = 4
  const swimZoneBot = sandTop - 3
  const y = swimZoneTop + Math.floor(Math.random() * (swimZoneBot - swimZoneTop))
  const dir = Math.random() < 0.5 ? 1 : -1
  const speed = 0.3 + Math.random() * 0.6
  return {
    x: Math.random() * w,
    y,
    dir,
    speed,
    species,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmp: 0.3 + Math.random() * 0.4,
    depth: y / h,
  }
}

function makeSeaweed(w, h, sandTop) {
  const count = Math.floor(w / 8) + 3
  const stalks = []
  for (let i = 0; i < count; i++) {
    const x = 3 + Math.floor(Math.random() * (w - 6))
    const height = 6 + Math.floor(Math.random() * 14)
    const baseY = sandTop + 1
    stalks.push({
      x,
      baseY,
      height,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 0.3 + Math.random() * 0.4,
      swayAmp: 1.0 + Math.random() * 1.5,
    })
  }
  return stalks
}

function makeCoral(w, h, sandTop) {
  const formations = []
  const count = Math.floor(w / 10) + 2
  const palettes = [CORAL_PINK, CORAL_ORANGE, CORAL_PURPLE, CORAL_RED, CORAL_YELLOW]
  for (let i = 0; i < count; i++) {
    const x = 4 + Math.floor(Math.random() * (w - 8))
    const palette = palettes[Math.floor(Math.random() * palettes.length)]
    const type = Math.floor(Math.random() * 3)
    const height = 3 + Math.floor(Math.random() * 6)
    const width = 3 + Math.floor(Math.random() * 5)
    formations.push({ x, baseY: sandTop, palette, type, height, width })
  }
  return formations
}

function makeBubbleStream(w, h, sandTop) {
  const streams = []
  const count = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const x = 5 + Math.floor(Math.random() * (w - 10))
    const bubbles = Array.from({ length: 4 + Math.floor(Math.random() * 6) }, () => ({
      y: sandTop - Math.random() * (sandTop - 2),
      offset: (Math.random() - 0.5) * 2,
      speed: 0.3 + Math.random() * 0.5,
      size: Math.random(),
      wobblePhase: Math.random() * Math.PI * 2,
    }))
    streams.push({ x, bubbles })
  }
  return streams
}

function makeLightRays(w, h) {
  const rays = []
  const count = 4 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    rays.push({
      x: Math.floor(Math.random() * w),
      width: 2 + Math.floor(Math.random() * 4),
      intensity: 0.3 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
    })
  }
  return rays
}

export function setup(canvas) {
  const w = canvas.width
  const h = canvas.height
  const sandTop = Math.floor(h * 0.82)

  const fishCount = Math.max(8, Math.floor(w / 10))
  const fish = Array.from({ length: fishCount }, (_, i) => makeFish(w, h, sandTop, i))
  const seaweed = makeSeaweed(w, h, sandTop)
  const coral = makeCoral(w, h, sandTop)
  const bubbleStreams = makeBubbleStream(w, h, sandTop)
  const lightRays = makeLightRays(w, h)

  return { phase: 0, fish, seaweed, coral, bubbleStreams, lightRays, sandTop, canvasW: w }
}

function drawOcean(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  for (let y = 0; y < h; y++) {
    const t = y / h
    const bgColor = lerpMulti([
      '#061830', '#082840', '#0a3850', '#0c4058',
      '#0c3848', '#0a3040', '#082838', '#061828',
      '#041018', '#030c14',
    ], t)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, bgColor)
    }
  }
}

function drawLightRays(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  for (const ray of state.lightRays) {
    const rx = ray.x + Math.sin(state.phase * ray.drift) * 3
    for (let y = 0; y < Math.floor(h * 0.7); y++) {
      const t = y / (h * 0.7)
      const fade = (1 - t) * ray.intensity * (0.6 + 0.4 * Math.sin(state.phase * 0.5 + y * 0.1))
      if (fade < 0.08) continue
      const spread = Math.floor(ray.width * (1 + t * 1.5))
      for (let dx = -spread; dx <= spread; dx++) {
        const px = Math.floor(rx + dx)
        if (px < 0 || px >= w) continue
        const edgeFade = 1 - Math.abs(dx) / (spread + 1)
        const alpha = fade * edgeFade
        if (alpha < 0.05) continue
        const cell = canvas.getCell(px, y)
        if (cell) {
          const brightened = lerp(cell.bg || '#061830', '#88bbdd', alpha * 0.15)
          canvas.setCell(px, y, cell.char, cell.fg, brightened)
        }
      }
    }
  }
}

function drawSand(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  for (let y = state.sandTop; y < h; y++) {
    const t = (y - state.sandTop) / (h - state.sandTop)
    const sandColor = lerpMulti(SAND, t)
    for (let x = 0; x < w; x++) {
      const noise = Math.sin(x * 0.7 + y * 1.3) * 0.5 + 0.5
      const finalColor = lerp(sandColor, SAND_DETAIL[Math.floor(noise * SAND_DETAIL.length)], 0.2)
      const ch = noise > 0.85 ? '·' : noise > 0.7 ? '⋅' : ' '
      canvas.setCell(x, y, ch, lerp(sandColor, '#8a7848', 0.3), finalColor)
    }
  }
}

function drawCoral(canvas, state) {
  for (const c of state.coral) {
    if (c.type === 0) drawBranchCoral(canvas, c)
    else if (c.type === 1) drawBrainCoral(canvas, c)
    else drawFanCoral(canvas, c, state.phase)
  }
}

function drawBranchCoral(canvas, c) {
  const w = canvas.width
  for (let dy = 0; dy < c.height; dy++) {
    const y = c.baseY - dy
    if (y < 0) continue
    const spread = Math.floor((1 - dy / c.height) * c.width * 0.5) + 1
    for (let dx = -spread; dx <= spread; dx++) {
      const x = c.x + dx
      if (x < 0 || x >= w) continue
      const edgeDist = Math.abs(dx) / (spread + 1)
      if (edgeDist > 0.8 && dy > 1 && Math.random() > 0.5) continue
      const t = dy / c.height
      const color = lerpMulti(c.palette, t * 0.7 + 0.15)
      const ch = dy === 0 ? SHADE[1] : (edgeDist > 0.6 ? '╻' : SHADE[2 + (dy % 2)])
      canvas.setCell(x, y, ch, color, lerp(color, '#000000', 0.5))
    }
  }
}

function drawBrainCoral(canvas, c) {
  const w = canvas.width
  const rx = Math.floor(c.width * 0.7)
  const ry = Math.floor(c.height * 0.5)
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const nx = dx / rx
      const ny = dy / ry
      if (nx * nx + ny * ny > 1) continue
      const x = c.x + dx
      const y = c.baseY - ry + dy
      if (x < 0 || x >= w || y < 0) continue
      const t = (nx * nx + ny * ny)
      const pattern = Math.sin(dx * 1.2 + dy * 0.8) * 0.5 + 0.5
      const color = lerpMulti(c.palette, t * 0.6 + pattern * 0.3)
      const ch = pattern > 0.6 ? SHADE[3] : SHADE[2]
      canvas.setCell(x, y, ch, color, lerp(color, '#000000', 0.4))
    }
  }
}

function drawFanCoral(canvas, c, phase) {
  const w = canvas.width
  for (let dy = 0; dy < c.height; dy++) {
    const y = c.baseY - dy
    if (y < 0) continue
    const t = dy / c.height
    const sway = Math.sin(phase * 0.3 + dy * 0.4) * 0.5
    const spread = Math.floor(t * c.width * 0.6) + 1
    for (let dx = -spread; dx <= spread; dx++) {
      const x = c.x + dx + Math.floor(sway)
      if (x < 0 || x >= w) continue
      const color = lerpMulti(c.palette, t * 0.8 + 0.1)
      const branches = Math.abs(Math.sin(dx * 0.8 + dy * 0.5))
      if (branches < 0.2 && dy > 2) continue
      const ch = dy % 2 === 0 ? '╱' : '╲'
      canvas.setCell(x, y, ch, color, lerp(color, '#000000', 0.55))
    }
  }
}

function drawSeaweed(canvas, state) {
  const w = canvas.width
  for (const s of state.seaweed) {
    for (let dy = 0; dy < s.height; dy++) {
      const y = s.baseY - dy
      if (y < 0) continue
      const t = dy / s.height
      const sway = Math.sin(state.phase * s.swaySpeed + s.phase + dy * 0.3) * s.swayAmp * t
      const x = s.x + Math.floor(sway)
      if (x < 0 || x >= w) continue
      const color = lerpMulti(t > 0.7 ? SEAWEED_LIGHT : SEAWEED, t)
      const ch = dy % 3 === 0 ? '┃' : (dy % 3 === 1 ? '╽' : '╿')
      canvas.setCell(x, y, ch, color)
      if (dy > 2 && dy % 4 === 0) {
        const leafDir = dy % 8 < 4 ? 1 : -1
        const lx = x + leafDir
        if (lx >= 0 && lx < w) {
          canvas.setCell(lx, y, leafDir > 0 ? '╌' : '╌', lerp(color, '#48c840', 0.3))
        }
      }
    }
  }
}

function drawFishSmall(canvas, fish) {
  const x = Math.floor(fish.x)
  const y = fish.y
  const w = canvas.width
  const s = fish.species
  if (fish.dir > 0) {
    if (x >= 0 && x < w) canvas.setCell(x, y, '>', s.fin)
    if (x + 1 >= 0 && x + 1 < w) canvas.setCell(x + 1, y, '<', s.body)
    if (x + 2 >= 0 && x + 2 < w) canvas.setCell(x + 2, y, '>', s.body)
  } else {
    if (x >= 0 && x < w) canvas.setCell(x, y, '<', s.body)
    if (x + 1 >= 0 && x + 1 < w) canvas.setCell(x + 1, y, '>', s.body)
    if (x + 2 >= 0 && x + 2 < w) canvas.setCell(x + 2, y, '<', s.fin)
  }
}

function drawFishMedium(canvas, fish) {
  const x = Math.floor(fish.x)
  const y = fish.y
  const w = canvas.width
  const s = fish.species

  if (fish.dir > 0) {
    const parts = [
      [0, 0, '>', s.fin],
      [1, -1, '╲', s.fin],
      [1, 0, '<', s.body],
      [1, 1, '╱', s.fin],
      [2, -1, '─', s.body],
      [2, 0, BLOCK.full, s.body],
      [2, 1, '─', s.body],
      [3, -1, '╱', s.stripe],
      [3, 0, BLOCK.full, s.stripe],
      [3, 1, '╲', s.stripe],
      [4, 0, '°', '#ffffff'],
      [5, 0, '>', s.fin],
    ]
    for (const [dx, dy, ch, color] of parts) {
      const px = x + dx
      const py = y + dy
      if (px >= 0 && px < w && py >= 0 && py < canvas.height) {
        canvas.setCell(px, py, ch, color)
      }
    }
  } else {
    const parts = [
      [5, 0, '<', s.fin],
      [4, -1, '╱', s.fin],
      [4, 0, '>', s.body],
      [4, 1, '╲', s.fin],
      [3, -1, '─', s.body],
      [3, 0, BLOCK.full, s.body],
      [3, 1, '─', s.body],
      [2, -1, '╲', s.stripe],
      [2, 0, BLOCK.full, s.stripe],
      [2, 1, '╱', s.stripe],
      [1, 0, '°', '#ffffff'],
      [0, 0, '<', s.fin],
    ]
    for (const [dx, dy, ch, color] of parts) {
      const px = x + dx
      const py = y + dy
      if (px >= 0 && px < w && py >= 0 && py < canvas.height) {
        canvas.setCell(px, py, ch, color)
      }
    }
  }
}

function drawFishTiny(canvas, fish) {
  const x = Math.floor(fish.x)
  const y = fish.y
  const w = canvas.width
  const s = fish.species
  if (fish.dir > 0) {
    if (x >= 0 && x < w) canvas.setCell(x, y, '>', s.fin)
    if (x + 1 >= 0 && x + 1 < w) canvas.setCell(x + 1, y, '>', s.body)
  } else {
    if (x >= 0 && x < w) canvas.setCell(x, y, '<', s.body)
    if (x + 1 >= 0 && x + 1 < w) canvas.setCell(x + 1, y, '<', s.fin)
  }
}

function drawFish(canvas, state) {
  const sorted = [...state.fish].sort((a, b) => a.depth - b.depth)
  for (const f of sorted) {
    if (f.species.size === 'tiny') drawFishTiny(canvas, f)
    else if (f.species.size === 'small') drawFishSmall(canvas, f)
    else drawFishMedium(canvas, f)
  }
}

function drawBubbles(canvas, state) {
  for (const stream of state.bubbleStreams) {
    for (const b of stream.bubbles) {
      const wobble = Math.sin(state.phase * 1.5 + b.wobblePhase) * 1.5
      const x = Math.floor(stream.x + b.offset + wobble)
      const y = Math.floor(b.y)
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue
      const t = 1 - y / canvas.height
      const color = lerpMulti(BUBBLE_COLORS, Math.min(t + b.size * 0.3, 1))
      const ch = b.size > 0.7 ? '◯' : (b.size > 0.4 ? '○' : '°')
      canvas.setCell(x, y, ch, color)
    }
  }
}

function drawSurface(canvas, state) {
  const w = canvas.width
  for (let x = 0; x < w; x++) {
    const wave = Math.sin(x * 0.15 + state.phase * 0.8) * 0.5 +
                 Math.sin(x * 0.08 + state.phase * 0.5) * 0.3
    const bright = 0.3 + wave * 0.3
    const color = lerp('#0c4058', '#3090b0', bright)
    canvas.setCell(x, 0, '~', color)
    const color2 = lerp('#0a3848', '#2080a0', bright * 0.7)
    canvas.setCell(x, 1, '≈', color2)
  }
}

function updateFish(state) {
  const w = state.canvasW
  for (const f of state.fish) {
    f.x += f.dir * f.speed
    f.y += Math.sin(state.phase * f.wobbleAmp + f.wobblePhase) * 0.15
    f.y = Math.max(3, Math.min(state.sandTop - 3, f.y))

    const fishWidth = f.species.size === 'medium' ? 6 : (f.species.size === 'small' ? 3 : 2)
    if (f.dir > 0 && f.x > w + 2) f.x = -fishWidth - 1
    if (f.dir < 0 && f.x < -fishWidth - 1) f.x = w + 2
  }
}

function updateBubbles(state) {
  for (const stream of state.bubbleStreams) {
    for (const b of stream.bubbles) {
      b.y -= b.speed
      if (b.y < -1) {
        b.y = state.sandTop - 2 + Math.random() * 3
        b.offset = (Math.random() - 0.5) * 2
      }
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state)
}

export function update(canvas, data, frame, state) {
  state.phase += 0.12
  updateFish(state)
  updateBubbles(state)
  drawScene(canvas, state)
}

function drawScene(canvas, state) {
  drawOcean(canvas, state)
  drawLightRays(canvas, state)
  drawSand(canvas, state)
  drawCoral(canvas, state)
  drawSeaweed(canvas, state)
  drawFish(canvas, state)
  drawBubbles(canvas, state)
  drawSurface(canvas, state)
}
