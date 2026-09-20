import { hex, bgHex, lerp, lerpMulti, hexToRgb, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Fairy Ring'
export const description = 'A circle of pale-fire mushrooms keeps its vigil in a clearing the oaks have held open since before memory'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

const GLOW_PAL = ['#00cc66', '#00ffaa', '#33ffbb', '#55eedd', '#00ee88']
const BARK = ['#100e0a', '#181410', '#201c16', '#28241e']
const MOSS = ['#081608', '#0c1e0a', '#0e240c', '#122a10']
const SPORE_PAL = ['#88ffcc', '#aaffdd', '#66eebb', '#44ddaa']

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(921)

  const rowBg = []
  for (let y = 0; y < H; y++) {
    const t = y / H
    let r, g, b
    if (t < 0.15) {
      r = 2; g = 5; b = 3
    } else if (t < 0.45) {
      const m = (t - 0.15) / 0.3
      r = 2 + m * 5; g = 5 + m * 7; b = 3 + m * 3
    } else if (t < 0.75) {
      const m = (t - 0.45) / 0.3
      r = 7 + m * 3; g = 12 + m * 4; b = 6 + m * 2
    } else {
      const m = (t - 0.75) / 0.25
      r = 10 - m * 7; g = 16 - m * 10; b = 8 - m * 5
    }
    rowBg.push([Math.round(r), Math.round(g), Math.round(b)])
  }

  const trees = []
  for (let i = 0; i < 30; i++) {
    trees.push({
      x: Math.floor(rng() * W),
      w: 1 + Math.floor(rng() * 2),
      top: Math.floor(rng() * H * 0.12),
      bot: Math.floor(H * 0.6 + rng() * H * 0.35),
      bark: BARK[Math.floor(rng() * BARK.length)],
    })
  }

  const cx = Math.floor(W * 0.50)
  const cy = Math.floor(H * 0.54)
  const rx = Math.floor(W * 0.24)
  const ry = Math.floor(H * 0.13)

  const mushrooms = []
  const N = 15
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * TAU + (rng() - 0.5) * 0.18
    const rd = 0.88 + rng() * 0.24
    mushrooms.push({
      x: Math.round(cx + Math.cos(angle) * rx * rd),
      y: Math.round(cy + Math.sin(angle) * ry * rd),
      sz: 1 + Math.floor(rng() * 3),
      hue: rng(),
      ph: rng() * TAU,
    })
  }

  const spores = []
  for (let i = 0; i < 55; i++) {
    const a = rng() * TAU
    const d = Math.sqrt(rng()) * 1.3
    spores.push({
      bx: cx + Math.cos(a) * rx * d,
      by: cy + Math.sin(a) * ry * d * 1.6,
      rise: 0.3 + rng() * 1.0,
      wobble: (rng() - 0.5) * 2.5,
      ph: rng() * TAU,
      ci: Math.floor(rng() * SPORE_PAL.length),
    })
  }

  const mistWisps = []
  for (let i = 0; i < 20; i++) {
    mistWisps.push({
      x: rng() * W * 1.5 - W * 0.25,
      y: Math.floor(cy + ry * (0.6 + rng() * 1.8)),
      sp: 0.15 + rng() * 0.35,
      len: 5 + Math.floor(rng() * 15),
      op: 0.08 + rng() * 0.12,
    })
  }

  const stars = []
  for (let i = 0; i < 45; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * H * 0.14),
      b: 0.3 + rng() * 0.7,
      ph: rng() * TAU,
    })
  }

  const glowBuf = new Float32Array(W * H * 3)

  return { rowBg, trees, cx, cy, rx, ry, mushrooms, spores, mistWisps, stars, glowBuf }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  const { rowBg, trees, cx, cy, rx, ry, mushrooms, spores, mistWisps, stars, glowBuf } = state

  glowBuf.fill(0)
  for (const m of mushrooms) {
    const pulse = 0.50 + 0.50 * Math.sin(t * 1.6 + m.ph)
    const [cr, cg, cb] = hexToRgb(lerpMulti(GLOW_PAL, m.hue))
    const gr = m.sz * 4 + 5
    const gc = Math.floor(gr * 2.2)
    const capY = m.y - Math.ceil(m.sz * 0.8)

    for (let dy = -gr; dy <= gr; dy++) {
      const py = capY + dy
      if (py < 0 || py >= H) continue
      for (let dx = -gc; dx <= gc; dx++) {
        const px = m.x + dx
        if (px < 0 || px >= W) continue
        const dist = Math.sqrt((dx * 0.42) ** 2 + dy ** 2)
        if (dist > gr) continue
        const falloff = Math.pow(1 - dist / gr, 2.0) * pulse
        const idx = (py * W + px) * 3
        glowBuf[idx] += cr * falloff * 0.14
        glowBuf[idx + 1] += cg * falloff * 0.14
        glowBuf[idx + 2] += cb * falloff * 0.14
      }
    }
  }

  for (let y = 0; y < H; y++) {
    const [br, bgG, bb] = rowBg[y]
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 3
      const r = Math.min(255, Math.round(br + glowBuf[idx]))
      const g = Math.min(255, Math.round(bgG + glowBuf[idx + 1]))
      const b = Math.min(255, Math.round(bb + glowBuf[idx + 2]))
      canvas.setCell(x, y, ' ', null, bgHex(col(r, g, b)))
    }
  }

  for (const s of stars) {
    const n = noise(s.x * 0.08, s.y * 0.12)
    if (n < 0.45) {
      const twinkle = 0.6 + 0.4 * Math.sin(t * 2.0 + s.ph)
      const v = Math.floor(s.b * twinkle * 180 + 55)
      canvas.setCell(s.x, s.y, twinkle > 0.8 ? '*' : '.', hex(col(v, v, Math.min(255, v + 30))))
    }
  }

  for (let y = 0; y < Math.floor(H * 0.17); y++) {
    for (let x = 0; x < W; x++) {
      const n = noise(x * 0.06, y * 0.1)
      const gapBias = 1 - Math.exp(-((x - cx) ** 2) / (W * W * 0.04))
      if (n > 0.2 + (1 - gapBias) * 0.5) {
        const sh = n > 0.7 ? BLOCK.full : n > 0.5 ? BLOCK.dark : BLOCK.medium
        const gc = col(3 + Math.floor(n * 14), 10 + Math.floor(n * 24), 2 + Math.floor(n * 8))
        canvas.setCell(x, y, sh, hex(gc))
      }
    }
  }

  for (const tr of trees) {
    for (let y = tr.top; y <= tr.bot && y < H; y++) {
      for (let dx = 0; dx < tr.w; dx++) {
        const tx = tr.x + dx
        if (tx < 0 || tx >= W) continue
        const dcx = (tx - cx) / (rx * 1.6)
        const dcy = (y - cy) / (ry * 2.8)
        if (dcx * dcx + dcy * dcy < 1) continue
        canvas.setCell(tx, y, '│', hex(tr.bark))
      }
    }
  }

  for (let y = Math.floor(H * 0.42); y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = noise(x * 0.05, y * 0.08 + 77)
      if (n > 0.52) {
        const mi = Math.floor(n * MOSS.length) % MOSS.length
        canvas.setCell(x, y, n > 0.72 ? SHADE[1] : SHADE[0], hex(MOSS[mi]))
      }
    }
  }

  for (const m of mushrooms) {
    const pulse = 0.50 + 0.50 * Math.sin(t * 1.6 + m.ph)
    const capCol = lerpMulti(GLOW_PAL, m.hue)
    const bright = lerp(capCol, '#ffffff', pulse * 0.35)
    const mid = lerp(capCol, '#003318', 0.3)
    const stemCol = lerp('#786850', '#aa9980', pulse * 0.2)

    if (m.sz === 1) {
      const capY = m.y - 1
      if (capY >= 0 && capY < H) {
        if (m.x - 1 >= 0 && m.x - 1 < W) canvas.setCell(m.x - 1, capY, BLOCK.lower, hex(mid))
        if (m.x >= 0 && m.x < W) canvas.setCell(m.x, capY, BLOCK.full, hex(bright))
        if (m.x + 1 >= 0 && m.x + 1 < W) canvas.setCell(m.x + 1, capY, BLOCK.lower, hex(mid))
      }
      if (m.y >= 0 && m.y < H && m.x >= 0 && m.x < W) {
        canvas.setCell(m.x, m.y, '│', hex(stemCol))
      }
    } else if (m.sz === 2) {
      const capY = m.y - 2
      if (capY >= 0 && capY < H) {
        for (let dx = -2; dx <= 2; dx++) {
          const px = m.x + dx
          if (px < 0 || px >= W) continue
          if (Math.abs(dx) === 2) canvas.setCell(px, capY, BLOCK.lower, hex(mid))
          else canvas.setCell(px, capY, BLOCK.full, hex(bright))
        }
      }
      const stemY1 = m.y - 1
      if (stemY1 >= 0 && stemY1 < H && m.x >= 0 && m.x < W) canvas.setCell(m.x, stemY1, '│', hex(stemCol))
      if (m.y >= 0 && m.y < H && m.x >= 0 && m.x < W) canvas.setCell(m.x, m.y, '│', hex(stemCol))
    } else {
      const capY = m.y - 3
      if (capY >= 0 && capY < H) {
        for (let dx = -3; dx <= 3; dx++) {
          const px = m.x + dx
          if (px < 0 || px >= W) continue
          if (Math.abs(dx) === 3) canvas.setCell(px, capY, BLOCK.lower, hex(mid))
          else if (Math.abs(dx) === 2) canvas.setCell(px, capY, BLOCK.lower, hex(bright))
          else canvas.setCell(px, capY, BLOCK.full, hex(bright))
        }
      }
      const underY = m.y - 2
      if (underY >= 0 && underY < H) {
        if (m.x - 1 >= 0 && m.x - 1 < W) canvas.setCell(m.x - 1, underY, SHADE[2], hex(mid))
        if (m.x >= 0 && m.x < W) canvas.setCell(m.x, underY, '║', hex(stemCol))
        if (m.x + 1 >= 0 && m.x + 1 < W) canvas.setCell(m.x + 1, underY, SHADE[2], hex(mid))
      }
      const stemY1 = m.y - 1
      if (stemY1 >= 0 && stemY1 < H && m.x >= 0 && m.x < W) canvas.setCell(m.x, stemY1, '║', hex(stemCol))
      if (m.y >= 0 && m.y < H && m.x >= 0 && m.x < W) canvas.setCell(m.x, m.y, '║', hex(stemCol))
    }
  }

  for (const s of spores) {
    const elapsed = t * s.rise * 2.5
    const wob = Math.sin(t * 0.7 + s.ph) * s.wobble
    const sx = Math.round(s.bx + wob)
    const span = H * 0.55
    const topY = cy - ry * 2.5
    let sy = s.by - elapsed
    sy = ((sy - topY) % span + span) % span + topY

    if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
      const twinkle = 0.4 + 0.6 * Math.sin(t * 3.5 + s.ph)
      if (twinkle > 0.25) {
        const sc = SPORE_PAL[s.ci]
        const fin = lerp(sc, '#ffffff', twinkle * 0.5)
        canvas.setCell(sx, Math.round(sy), twinkle > 0.75 ? '*' : '.', hex(fin))
      }
    }
  }

  for (const m of mistWisps) {
    const mx = ((m.x + t * m.sp * 10) % (W * 1.5)) - W * 0.25
    for (let i = 0; i < m.len; i++) {
      const px = Math.round(mx + i)
      if (px < 0 || px >= W || m.y < 0 || m.y >= H) continue
      const edge = Math.min(i, m.len - 1 - i) / Math.max(1, m.len * 0.35)
      const alpha = Math.min(1, edge) * m.op
      if (alpha > 0.04) {
        const v = Math.floor(25 + alpha * 60)
        canvas.setCell(px, m.y, SHADE[0], hex(col(v - 5, v + 10, v + 8)))
      }
    }
  }
}
