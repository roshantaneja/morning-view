import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Koi Pond'
export const description = 'Golden fish glide through dark water beneath floating lilies'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const WATER_DEEP = ['#020c14', '#041018', '#06141e', '#081824']
const WATER_MID = ['#081c2a', '#0a2030', '#0c2438', '#0e2840']
const WATER_LIGHT = ['#102c3c', '#143444', '#183c4c', '#1c4454']
const PEBBLE = ['#141210', '#1c1a16', '#24221c', '#2c2a24', '#343230']
const PEBBLE_LIGHT = ['#383428', '#403c30', '#484438']
const LILY_PAD = ['#0c2810', '#143c18', '#1c5020', '#246428', '#2c7830']
const LILY_DARK = ['#081c0c', '#0c2810', '#103214']
const LILY_FLOWER = ['#d898b0', '#e0a8c0', '#e8b8d0', '#f0c8e0']
const LILY_CENTER = '#e8c848'
const KOI_ORANGE = ['#c85010', '#e06818', '#f08020', '#f89830']
const KOI_WHITE = ['#c0b8a8', '#d0c8b8', '#e0d8c8', '#f0e8d8']
const KOI_RED = ['#901818', '#b02020', '#c82828', '#e03030']
const KOI_GOLD = ['#a07010', '#c08818', '#d8a020', '#f0b828']
const KOI_SHADOW = '#041018'
const RIPPLE = ['#0c2030', '#0e2838', '#103040', '#143848']
const MOSS = ['#0a200e', '#0e2c12', '#123816']
const ROCK_EDGE = ['#1c1a18', '#242220', '#2c2a28', '#343230']

export function setup(canvas) {
  const rng = srand(728)
  const w = canvas.width
  const h = canvas.height

  const pebbles = []
  for (let i = 0; i < 180; i++) {
    pebbles.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * h),
      shade: rng(),
      size: rng() < 0.15 ? 2 : 1,
      char: rng() < 0.4 ? '·' : rng() < 0.7 ? '.' : '∘'
    })
  }

  const fish = [
    makeFish(rng, w, h, KOI_ORANGE, 'orange', 6),
    makeFish(rng, w, h, KOI_WHITE, 'white', 5),
    makeFish(rng, w, h, KOI_RED, 'red', 5),
    makeFish(rng, w, h, KOI_GOLD, 'gold', 6),
    makeFish(rng, w, h, KOI_ORANGE, 'orange2', 4),
    makeFish(rng, w, h, KOI_WHITE, 'white2', 4),
    makeFish(rng, w, h, KOI_RED, 'red2', 5),
  ]

  const pads = []
  const padCount = 8 + Math.floor(rng() * 5)
  for (let i = 0; i < padCount; i++) {
    let px, py, ok
    for (let tries = 0; tries < 20; tries++) {
      px = 8 + Math.floor(rng() * (w - 16))
      py = 6 + Math.floor(rng() * (h - 12))
      ok = true
      for (const p of pads) {
        const dx = px - p.x, dy = py - p.y
        if (Math.sqrt(dx * dx + dy * dy) < 8) { ok = false; break }
      }
      if (ok) break
    }
    if (!ok) continue
    pads.push({
      x: px, y: py,
      radius: 2 + Math.floor(rng() * 2),
      notch: rng() * Math.PI * 2,
      shade: rng(),
      hasFlower: rng() < 0.3,
      flowerPhase: rng() * Math.PI * 2
    })
  }

  const rocks = []
  const rockZones = [
    { cx: Math.floor(w * 0.08), cy: Math.floor(h * 0.12), r: 6 },
    { cx: Math.floor(w * 0.92), cy: Math.floor(h * 0.08), r: 5 },
    { cx: Math.floor(w * 0.05), cy: Math.floor(h * 0.88), r: 7 },
    { cx: Math.floor(w * 0.88), cy: Math.floor(h * 0.92), r: 5 },
  ]
  for (const zone of rockZones) {
    const count = 2 + Math.floor(rng() * 3)
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2
      const dist = rng() * zone.r
      rocks.push({
        x: zone.cx + Math.floor(Math.cos(angle) * dist),
        y: zone.cy + Math.floor(Math.sin(angle) * dist * 0.5),
        w: 2 + Math.floor(rng() * 3),
        h: 1 + Math.floor(rng() * 2),
        shade: rng()
      })
    }
  }

  const ripples = []
  for (let i = 0; i < 6; i++) {
    ripples.push({
      x: 10 + Math.floor(rng() * (w - 20)),
      y: 10 + Math.floor(rng() * (h - 20)),
      phase: rng() * Math.PI * 2,
      maxR: 3 + Math.floor(rng() * 4),
      speed: 0.3 + rng() * 0.5
    })
  }

  return { pebbles, fish, pads, rocks, ripples }
}

function makeFish(rng, w, h, palette, id, len) {
  const cx = 15 + rng() * (w - 30)
  const cy = 10 + rng() * (h - 20)
  return {
    id, palette, len,
    x: cx, y: cy,
    angle: rng() * Math.PI * 2,
    speed: 0.3 + rng() * 0.4,
    turnRate: 0,
    turnTimer: 0,
    turnDuration: 60 + rng() * 120,
    tailPhase: rng() * Math.PI * 2,
    spots: rng() < 0.5,
    spotOffset: rng() * 10
  }
}

function updateFish(f, w, h, dt) {
  f.tailPhase += dt * 3
  f.turnTimer += dt

  if (f.turnTimer > f.turnDuration * dt) {
    f.turnTimer = 0
    f.turnRate = (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.6)
    f.turnDuration = 30 + Math.random() * 100
  }

  const margin = 12
  if (f.x < margin) f.turnRate += 0.05
  if (f.x > w - margin) f.turnRate -= 0.05
  if (f.y < margin * 0.5) f.turnRate += (Math.random() < 0.5 ? 0.04 : -0.04)
  if (f.y > h - margin * 0.5) f.turnRate += (Math.random() < 0.5 ? 0.04 : -0.04)

  f.angle += f.turnRate * dt
  f.x += Math.cos(f.angle) * f.speed * dt * 8
  f.y += Math.sin(f.angle) * f.speed * dt * 4

  f.x = Math.max(4, Math.min(w - 4, f.x))
  f.y = Math.max(4, Math.min(h - 4, f.y))
}

function drawFish(canvas, f, time) {
  const AR = 0.5
  const tailSwing = Math.sin(f.tailPhase) * 0.4

  for (let i = 0; i < f.len; i++) {
    const t = i / (f.len - 1)
    const segAngle = f.angle + Math.PI + tailSwing * t * t
    const segX = Math.round(f.x - Math.cos(segAngle) * i * 1.2)
    const segY = Math.round(f.y - Math.sin(segAngle) * i * AR * 1.2)

    if (segX < 0 || segX >= canvas.width || segY < 0 || segY >= canvas.height) continue

    let ch, col
    if (i === 0) {
      ch = '◉'
      col = lerpMulti(f.palette, 0.8)
    } else if (i >= f.len - 2) {
      const tailT = (Math.sin(f.tailPhase + i * 0.5) + 1) * 0.5
      ch = i === f.len - 1 ? '‹' : '«'
      col = lerpMulti(f.palette, 0.3 + tailT * 0.4)
    } else {
      const bodyT = 0.4 + Math.sin(t * Math.PI) * 0.6
      ch = f.spots && Math.sin(i * 3.7 + f.spotOffset) > 0.3 ? BLOCK.dark : BLOCK.full
      col = lerpMulti(f.palette, bodyT)
    }

    canvas.setCell(segX, segY, ch, col)

    if (i > 0 && i < f.len - 2) {
      const sideAngle = segAngle + Math.PI / 2
      const width = Math.sin(t * Math.PI) * 0.8
      if (width > 0.3) {
        const sx1 = Math.round(segX + Math.cos(sideAngle) * width)
        const sy1 = Math.round(segY + Math.sin(sideAngle) * width * AR)
        const sx2 = Math.round(segX - Math.cos(sideAngle) * width)
        const sy2 = Math.round(segY - Math.sin(sideAngle) * width * AR)
        if (sx1 >= 0 && sx1 < canvas.width && sy1 >= 0 && sy1 < canvas.height) {
          canvas.setCell(sx1, sy1, SHADE[1], lerpMulti(f.palette, 0.3))
        }
        if (sx2 >= 0 && sx2 < canvas.width && sy2 >= 0 && sy2 < canvas.height) {
          canvas.setCell(sx2, sy2, SHADE[1], lerpMulti(f.palette, 0.3))
        }
      }
    }
  }
}

function drawPad(canvas, pad, time) {
  const { x, y, radius, notch, shade, hasFlower, flowerPhase } = pad
  const AR = 0.5

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius * 2; dx <= radius * 2; dx++) {
      const ndx = dx / 2, ndy = dy
      const dist = Math.sqrt(ndx * ndx + ndy * ndy)
      if (dist > radius) continue

      const angle = Math.atan2(ndy, ndx)
      let angleDiff = Math.abs(angle - notch)
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff
      if (angleDiff < 0.35 && dist > radius * 0.25) continue

      const px = x + dx, py = y + dy
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue

      const edgeT = dist / radius
      const col = edgeT > 0.7
        ? lerpMulti(LILY_DARK, shade)
        : lerpMulti(LILY_PAD, shade * 0.6 + edgeT * 0.4)

      const veinAngle = Math.atan2(ndy, ndx)
      const veinPattern = Math.abs(Math.sin(veinAngle * 5)) < 0.1 && dist > radius * 0.3
      const ch = veinPattern ? '─' : (edgeT > 0.85 ? SHADE[0] : SHADE[2])

      canvas.setCell(px, py, ch, col)
    }
  }

  if (hasFlower) {
    const bloom = Math.sin(time * 0.3 + flowerPhase) * 0.5 + 0.5
    const fx = x + Math.round(Math.cos(notch + Math.PI) * radius * 0.6)
    const fy = y + Math.round(Math.sin(notch + Math.PI) * radius * 0.3)

    const petalChars = ['❀', '✿', '❁']
    const petalIdx = Math.floor(bloom * 2.99)
    if (fx >= 0 && fx < canvas.width && fy >= 0 && fy < canvas.height) {
      canvas.setCell(fx, fy, petalChars[petalIdx], lerpMulti(LILY_FLOWER, bloom))
    }
    if (bloom > 0.5 && fx + 1 < canvas.width) {
      canvas.setCell(fx + 1, fy, '·', LILY_CENTER)
    }
  }
}

function draw(canvas, state, time) {
  const w = canvas.width, h = canvas.height
  const { pebbles, fish, pads, rocks, ripples } = state

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const waterNoise = Math.sin(x * 0.15 + time * 0.3) * Math.sin(y * 0.12 + time * 0.2) * 0.5 + 0.5
      const depthT = 0.2 + waterNoise * 0.3
      const col = lerpMulti([...WATER_DEEP, ...WATER_MID], depthT)
      canvas.setCell(x, y, ' ', null, col)
    }
  }

  for (const p of pebbles) {
    const shimmer = Math.sin(time * 0.4 + p.x * 0.3 + p.y * 0.2) * 0.15
    const bright = p.shade + shimmer
    const col = bright > 0.5 ? lerpMulti(PEBBLE_LIGHT, bright - 0.5) : lerpMulti(PEBBLE, bright * 2)
    canvas.setCell(p.x, p.y, p.char, col)
  }

  for (const r of rocks) {
    for (let dy = 0; dy < r.h; dy++) {
      for (let dx = 0; dx < r.w; dx++) {
        const rx = r.x + dx, ry = r.y + dy
        if (rx < 0 || rx >= w || ry < 0 || ry >= h) continue
        const isEdge = dx === 0 || dx === r.w - 1 || dy === 0 || dy === r.h - 1
        if (isEdge) {
          canvas.setCell(rx, ry, SHADE[1], lerpMulti(ROCK_EDGE, r.shade))
        } else {
          canvas.setCell(rx, ry, SHADE[2], lerpMulti(ROCK_EDGE, r.shade * 0.5 + 0.3))
        }
      }
    }
    const mx = r.x - 1
    if (mx >= 0 && mx < w && r.y >= 0 && r.y < h) {
      canvas.setCell(mx, r.y, '~', lerpMulti(MOSS, r.shade))
    }
  }

  for (const rp of ripples) {
    const cycle = (time * rp.speed + rp.phase) % (Math.PI * 2)
    const radius = (cycle / (Math.PI * 2)) * rp.maxR
    const fade = 1 - cycle / (Math.PI * 2)
    if (fade < 0.1) continue

    const steps = Math.max(12, Math.floor(radius * 8))
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2
      const rx = Math.round(rp.x + Math.cos(a) * radius * 2)
      const ry = Math.round(rp.y + Math.sin(a) * radius)
      if (rx < 0 || rx >= w || ry < 0 || ry >= h) continue
      const col = lerpMulti(RIPPLE, fade * 0.8)
      canvas.setCell(rx, ry, '·', col)
    }
  }

  for (const f of fish) {
    const shadowX = Math.round(f.x + 1.5)
    const shadowY = Math.round(f.y + 1)
    if (shadowX >= 0 && shadowX < w && shadowY >= 0 && shadowY < h) {
      canvas.setCell(shadowX, shadowY, SHADE[0], KOI_SHADOW)
    }
  }

  for (const f of fish) {
    drawFish(canvas, f, time)
  }

  for (const pad of pads) {
    drawPad(canvas, pad, time)
  }

  for (let i = 0; i < 12; i++) {
    const sparkleT = (time * 0.7 + i * 2.3) % 4
    if (sparkleT > 1) continue
    const sx = Math.floor((Math.sin(i * 7.3 + 1.1) * 0.5 + 0.5) * w)
    const sy = Math.floor((Math.sin(i * 4.7 + 2.3) * 0.5 + 0.5) * h)
    if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
      const brightness = 1 - sparkleT
      canvas.setCell(sx, sy, sparkleT < 0.3 ? '✦' : '·', lerp('#1c3040', '#88c8f0', brightness))
    }
  }
}

export function render(canvas, data, state) {
  draw(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const dt = frame.dt || 0.5
  for (const f of state.fish) {
    updateFish(f, canvas.width, canvas.height, dt)
  }

  state.ripples.forEach(rp => {
    rp.x += Math.sin(frame.elapsed * 0.1 + rp.phase) * 0.02
  })

  draw(canvas, state, frame.elapsed)
}
