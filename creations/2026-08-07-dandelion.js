import { lerpMulti, lerp, BLOCK } from '../src/theme.js'

export const title = 'Make a Wish'
export const description = 'Dandelion seeds carry quiet promises into the fading light'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SKY = [
  '#060a1c', '#0a1028', '#0e1634', '#131c42', '#182250',
  '#1e285e', '#242e6c', '#2a347a', '#303a88', '#364096',
  '#3c448e', '#444886', '#504a7c', '#5e4c72', '#6c4e68',
  '#7a505e', '#885254', '#965a4a', '#a86840', '#ba7a36',
]

const GROUND = ['#06060a', '#08080e', '#0a0a12', '#0c0c16']

export function setup(canvas) {
  const rng = srand(807)
  const w = canvas.width
  const h = canvas.height

  const stars = []
  for (let i = 0; i < 110; i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * Math.floor(h * 0.48)),
      b: 0.1 + rng() * 0.9,
      ph: rng() * 6.28,
      sp: 0.2 + rng() * 1.0,
    })
  }

  const ground = new Array(w)
  for (let x = 0; x < w; x++) {
    ground[x] = Math.floor(
      h * 0.78 +
      Math.sin(x * 0.006 + 0.3) * 10 +
      Math.sin(x * 0.018 + 1.2) * 5 +
      Math.sin(x * 0.04 + 2.8) * 2
    )
  }

  const stemX = Math.floor(w * 0.44)
  const stemBase = ground[Math.min(stemX, w - 1)]
  const headY = Math.floor(h * 0.30)
  const headR = Math.max(4, Math.floor(Math.min(w, h) * 0.055))

  const headSeeds = []
  for (let i = 0; i < 90; i++) {
    const theta = rng() * 6.28
    const phi = Math.acos(2 * rng() - 1)
    const r = 0.35 + rng() * 0.65
    headSeeds.push({
      theta, phi, r,
      bright: 0.3 + rng() * 0.7,
      detachT: 4 + rng() * 52,
    })
  }

  const floaters = []
  for (let i = 0; i < 32; i++) {
    floaters.push({
      angle: rng() * 6.28,
      sp: 0.01 + rng() * 0.022,
      wx: 0.4 + rng() * 1.5,
      wy: -(0.5 + rng() * 1.8),
      wf: 0.08 + rng() * 0.3,
      wa: 0.5 + rng() * 2.2,
      wp: rng() * 6.28,
      off: rng() * 100,
      life: 0.45 + rng() * 0.55,
    })
  }

  const distDands = []
  for (let i = 0; i < 5; i++) {
    const dx = Math.floor(rng() * w)
    distDands.push({
      x: dx,
      base: ground[Math.min(dx, w - 1)],
      ht: 5 + Math.floor(rng() * 10),
      hr: 1 + Math.floor(rng() * 2),
    })
  }

  const grass = []
  for (let i = 0; i < 150; i++) {
    const gx = Math.floor(rng() * w)
    grass.push({
      x: gx,
      base: ground[Math.min(gx, w - 1)],
      ht: 1 + Math.floor(rng() * 3),
      ph: rng() * 6.28,
    })
  }

  const moonX = Math.floor(w * 0.74)
  const moonY = Math.floor(h * 0.14)

  return { stars, ground, stemX, stemBase, headY, headR, headSeeds, floaters, distDands, grass, moonX, moonY }
}

export function render(canvas, data, state) {
  drawAll(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawAll(canvas, state, frame.elapsed)
}

function drawAll(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height

  drawSky(canvas, w, h)
  drawHorizonGlow(canvas, w, h)
  drawMoon(canvas, state.moonX, state.moonY, w, h)
  drawStars(canvas, state, w, h, t)
  drawFarHills(canvas, w, h)
  drawGround(canvas, state, w, h)
  drawGrass(canvas, state, w, h, t)
  drawDistantDandelions(canvas, state, w, h, t)
  drawStem(canvas, state, w, h, t)
  drawHeadGlow(canvas, state, w, h, t)
  drawSeedHead(canvas, state, w, h, t)
  drawFloatingSeeds(canvas, state, w, h, t)
}

function drawSky(canvas, w, h) {
  for (let y = 0; y < h; y++) {
    const nt = Math.min(1, y / (h * 0.85))
    const col = lerpMulti(SKY, nt)
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, col)
  }
}

function drawHorizonGlow(canvas, w, h) {
  const hzY = Math.floor(h * 0.80)
  for (let dy = -8; dy <= 4; dy++) {
    const py = hzY + dy
    if (py < 0 || py >= h) continue
    const s = Math.max(0, 1 - Math.abs(dy) / 8) * 0.14
    for (let x = 0; x < w; x++) {
      const cell = canvas.getCell(x, py)
      if (cell && cell.bg) canvas.setCell(x, py, ' ', null, lerp(cell.bg, '#d89020', s))
    }
  }
}

function drawMoon(canvas, mx, my, w, h) {
  const r = 3
  const glowR = r + 5
  for (let dy = -glowR; dy <= glowR; dy++) {
    for (let dx = -glowR * 2; dx <= glowR * 2; dx++) {
      const px = mx + dx, py = my + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const ndx = dx / 2
      const dist = Math.sqrt(ndx * ndx + dy * dy)
      if (dist > glowR) continue
      const str = (1 - dist / glowR) * 0.08
      const cell = canvas.getCell(px, py)
      if (cell && cell.bg) canvas.setCell(px, py, ' ', null, lerp(cell.bg, '#c0b8a0', str))
    }
  }
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r * 2; dx <= r * 2; dx++) {
      const px = mx + dx, py = my + dy
      if (px < 4 || px >= w - 4 || py < 3 || py >= h) continue
      const ndx = dx / 2
      const dist = Math.sqrt(ndx * ndx + dy * dy)
      if (dist > r) continue
      const offDist = Math.sqrt((ndx - 2) * (ndx - 2) + dy * dy)
      if (offDist < r * 0.82) continue
      const edge = 1 - dist / r
      canvas.setCell(px, py, BLOCK.full, lerp('#c0b898', '#e8e0c8', edge), null)
    }
  }
}

function drawStars(canvas, state, w, h, t) {
  for (const s of state.stars) {
    const tw = Math.sin(t * s.sp + s.ph) * 0.3 + 0.7
    const vis = s.b * tw * Math.max(0, 1 - s.y / (h * 0.48))
    if (vis < 0.1 || s.x < 4 || s.x >= w - 4 || s.y < 3) continue
    const dx = s.x - state.moonX
    const dy = s.y - state.moonY
    if (dx * dx + dy * dy < 120) continue
    canvas.setCell(s.x, s.y, vis > 0.55 ? '✦' : vis > 0.28 ? '·' : '.', lerp('#0a1028', '#c8c8e8', vis), null)
  }
}

function drawFarHills(canvas, w, h) {
  for (let x = 0; x < w; x++) {
    const fh = Math.floor(h * 0.73 + Math.sin(x * 0.005 + 1.5) * 8 + Math.sin(x * 0.013 + 3.0) * 4)
    for (let y = Math.max(0, fh); y < h; y++) {
      const cell = canvas.getCell(x, y)
      if (cell && cell.bg) canvas.setCell(x, y, ' ', null, lerp(cell.bg, '#060610', 0.45))
    }
  }
}

function drawGround(canvas, state, w, h) {
  for (let x = 0; x < w; x++) {
    const gy = state.ground[x]
    for (let y = Math.max(0, gy); y < h; y++) {
      const dt = Math.min(1, (y - gy) / Math.max(1, h - gy))
      canvas.setCell(x, y, ' ', null, lerpMulti(GROUND, dt * 0.5 + 0.2))
    }
    if (gy >= 0 && gy < h) canvas.setCell(x, gy, BLOCK.upper, '#060608', null)
  }
}

function drawGrass(canvas, state, w, h, t) {
  const wind = t * 0.2
  for (const g of state.grass) {
    const sw = Math.sin(wind + g.ph) * 0.6
    for (let dy = 0; dy < g.ht; dy++) {
      const py = g.base - dy - 1
      if (py < 0 || py >= h) continue
      const px = Math.round(g.x + sw * (dy / Math.max(1, g.ht)))
      if (px < 0 || px >= w) continue
      canvas.setCell(px, py, '│', '#0c180c', null)
    }
  }
}

function drawDistantDandelions(canvas, state, w, h, t) {
  const dSway = Math.sin(t * 0.12) * 0.8
  for (const d of state.distDands) {
    for (let dy = 0; dy < d.ht; dy++) {
      const py = d.base - dy - 1
      if (py < 0 || py >= h) continue
      const px = Math.round(d.x + dSway * (1 - dy / d.ht))
      if (px < 0 || px >= w) continue
      canvas.setCell(px, py, '│', '#0e140e', null)
    }
    const ty = d.base - d.ht - 1
    const tx = Math.round(d.x + dSway)
    for (let ddy = -d.hr; ddy <= d.hr; ddy++) {
      for (let ddx = -d.hr; ddx <= d.hr; ddx++) {
        const px = tx + ddx, py = ty + ddy
        if (px < 0 || px >= w || py < 0 || py >= h) continue
        if (ddx * ddx + ddy * ddy <= d.hr * d.hr) {
          canvas.setCell(px, py, '·', '#403830', null)
        }
      }
    }
  }
}

function drawStem(canvas, state, w, h, t) {
  const stemSway = Math.sin(t * 0.15) * 1.2
  for (let y = state.headY; y <= state.stemBase; y++) {
    const p = (y - state.headY) / Math.max(1, state.stemBase - state.headY)
    const sx = Math.round(state.stemX + stemSway * (1 - p) * (1 - p))
    if (sx < 0 || sx >= w || y < 0 || y >= h) continue
    canvas.setCell(sx, y, '│', lerp('#1c3618', '#0c1a0c', p), null)
  }
}

function drawHeadGlow(canvas, state, w, h, t) {
  const stemSway = Math.sin(t * 0.15) * 1.2
  const hcx = state.stemX + stemSway
  const hcy = state.headY
  const gr = state.headR + 5
  for (let dy = -gr; dy <= gr; dy++) {
    for (let dx = Math.floor(-gr * 1.6); dx <= Math.ceil(gr * 1.6); dx++) {
      const px = Math.round(hcx + dx), py = hcy + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const dist = Math.sqrt((dx / 1.6) * (dx / 1.6) + dy * dy)
      if (dist > gr) continue
      const str = (1 - dist / gr) * 0.07
      const cell = canvas.getCell(px, py)
      if (cell && cell.bg) canvas.setCell(px, py, cell.char, cell.fg, lerp(cell.bg, '#c8c0a8', str))
    }
  }
}

function drawSeedHead(canvas, state, w, h, t) {
  const stemSway = Math.sin(t * 0.15) * 1.2
  const hcx = state.stemX + stemSway
  const hcy = state.headY
  const cycleLen = 50
  const cycleT = t % cycleLen

  for (const seed of state.headSeeds) {
    if (cycleT > seed.detachT) continue
    const projR = seed.r * state.headR * Math.sin(seed.phi)
    const sx = hcx + Math.cos(seed.theta) * projR * 1.8
    const sy = hcy + Math.sin(seed.theta) * projR * 0.9 + Math.cos(seed.phi) * state.headR * 0.3
    const px = Math.round(sx), py = Math.round(sy)
    if (px < 0 || px >= w || py < 0 || py >= h) continue

    const depth = 0.5 + Math.cos(seed.phi) * 0.5
    const b = seed.bright * depth
    let ch, col
    if (b > 0.65) { ch = '✦'; col = '#e8e4d8' }
    else if (b > 0.35) { ch = '·'; col = '#c8c0b0' }
    else { ch = '.'; col = '#a09888' }
    canvas.setCell(px, py, ch, col, null)

    if (b > 0.4 && seed.r > 0.55) {
      const fx = Math.round(sx + Math.cos(seed.theta) * 1.5)
      const fy = Math.round(sy + Math.sin(seed.theta) * 0.7)
      if (fx >= 0 && fx < w && fy >= 0 && fy < h && (fx !== px || fy !== py)) {
        canvas.setCell(fx, fy, '.', b > 0.55 ? '#b0a898' : '#706860', null)
      }
    }
  }

  const cpx = Math.round(hcx)
  if (cpx >= 0 && cpx < w && hcy >= 0 && hcy < h) canvas.setCell(cpx, hcy, '●', '#8a8070', null)
}

function drawFloatingSeeds(canvas, state, w, h, t) {
  const stemSway = Math.sin(t * 0.15) * 1.2
  const hcx = state.stemX + stemSway
  const hcy = state.headY

  for (const f of state.floaters) {
    const cycle = (t * f.sp + f.off) % f.life
    const p = cycle / f.life
    if (p > 0.93) continue

    const sx = hcx + Math.cos(f.angle) * state.headR * 1.5 + f.wx * p * w * 0.3
    const sy = hcy + Math.sin(f.angle) * state.headR * 0.7 + f.wy * p * h * 0.25
    const wobble = Math.sin(t * f.wf + f.wp + p * 6) * f.wa * (0.2 + p * 0.8)
    const px = Math.round(sx + wobble)
    const py = Math.round(sy + Math.sin(p * 9.42 + f.wp) * 1.2)
    if (px < 4 || px >= w - 4 || py < 3 || py >= h - 3) continue

    const fade = p < 0.08 ? p / 0.08 : Math.max(0, 1 - (p - 0.08) / 0.92)
    if (fade < 0.05) continue

    const col = lerp('#e8e4d8', '#787068', p * 0.8)
    canvas.setCell(px, py, fade > 0.4 ? '✦' : '·', col, null)

    if (fade > 0.25 && py - 1 >= 3) {
      canvas.setCell(px, py - 1, '·', lerp(col, '#605848', 0.3), null)
      if (fade > 0.5) {
        if (px - 1 >= 4) canvas.setCell(px - 1, py - 1, '.', lerp(col, '#605848', 0.5), null)
        if (px + 1 < w - 4) canvas.setCell(px + 1, py - 1, '.', lerp(col, '#605848', 0.5), null)
      }
    }
  }
}
