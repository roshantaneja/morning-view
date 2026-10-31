import { BLOCK, SHADE, GLYPH } from '../src/theme.js'

export const title = "All Hallows' Eve"
export const description =
  'The veil thins at midnight — spectral light drifts from mossy stones while the harvest moon watches over the silent grounds'
export const fps = 3

const TAU = Math.PI * 2

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}
function pH(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}
function mix(a, b, t) {
  t = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = pH(a), [r2, g2, b2] = pH(b)
  return c2h(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi) + (hash(xi + 1, yi) - hash(xi, yi)) * sx
  const b = hash(xi, yi + 1) + (hash(xi + 1, yi + 1) - hash(xi, yi + 1)) * sx
  return a + (b - a) * sy
}

const P = {
  skyTop: '#06020e', skyMid: '#0e0820', skyLow: '#1a0e30',
  moonOuter: '#d08020', moonMid: '#e89830', moonInner: '#f0b848',
  moonGlowFar: '#301808', moonGlowNear: '#603010',
  star: '#c0b080',
  groundDark: '#060408', groundMid: '#0c0a10', groundFog: '#181428',
  tombDark: '#1a1820', tombMid: '#282630', tombLight: '#383640',
  tombMoss: '#1a2818',
  treeDark: '#0a0810', treeBranch: '#1a1420',
  wisp1: '#40e890', wisp2: '#30c0e0', wisp3: '#80f0a0',
  fogLight: '#201838', fogDark: '#0c0818',
  ironDark: '#181618', ironLight: '#282428',
  batCol: '#0a080e',
}

export function setup(canvas, data) {
  const rng = srand(20261031)
  const W = canvas.width, H = canvas.height
  const groundY = Math.floor(H * 0.62)
  const moonCX = Math.floor(W * 0.65), moonCY = Math.floor(H * 0.18)
  const moonR = Math.floor(Math.min(W, H) * 0.09)

  const stars = []
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * groundY * 0.7),
      bright: 0.3 + rng() * 0.7,
      twinkleSpeed: 0.5 + rng() * 2,
      twinklePhase: rng() * TAU,
      char: rng() > 0.7 ? '✦' : rng() > 0.5 ? '·' : '∗',
    })
  }

  const tombstones = []
  const tombCount = Math.floor(W / 8)
  for (let i = 0; i < tombCount; i++) {
    const tx = Math.floor(W * 0.08 + rng() * W * 0.84)
    const depth = rng()
    const ty = groundY - Math.floor(2 + depth * 4)
    const kind = rng() < 0.15 ? 'cross' : rng() < 0.4 ? 'rounded' : rng() < 0.6 ? 'obelisk' : 'slab'
    const tw = kind === 'cross' ? 3 : kind === 'obelisk' ? 2 : Math.floor(3 + rng() * 3)
    const th = kind === 'cross' ? Math.floor(5 + rng() * 3) : kind === 'obelisk' ? Math.floor(6 + rng() * 4) : Math.floor(3 + rng() * 3)
    const lean = (rng() - 0.5) * 0.15
    tombstones.push({ x: tx, y: ty, w: tw, h: th, kind, lean, depth, hasWisp: rng() > 0.6 })
  }
  tombstones.sort((a, b) => a.depth - b.depth)

  const treeLX = Math.floor(W * 0.12)
  const treeRX = Math.floor(W * 0.88)
  const branches = []
  function genBranches(rootX, rootTopY, side) {
    const count = 5 + Math.floor(rng() * 4)
    for (let i = 0; i < count; i++) {
      const startY = rootTopY + Math.floor(i * (groundY - rootTopY - 8) / count)
      const len = 6 + Math.floor(rng() * 12)
      const angle = side === 'left'
        ? -0.8 + rng() * 1.2
        : -0.4 - rng() * 1.2
      const droopRate = 0.02 + rng() * 0.04
      branches.push({ rootX, startY, len, angle, droopRate, side })
    }
  }
  genBranches(treeLX, Math.floor(H * 0.15), 'left')
  genBranches(treeRX, Math.floor(H * 0.2), 'right')

  const wisps = []
  for (let i = 0; i < 12; i++) {
    wisps.push({
      x: W * 0.1 + rng() * W * 0.8,
      baseY: groundY - 2 - rng() * 6,
      phase: rng() * TAU,
      speed: 0.3 + rng() * 0.5,
      amplitude: 1 + rng() * 3,
      riseSpeed: 0.4 + rng() * 0.6,
      height: 4 + rng() * 8,
      hue: rng() < 0.5 ? 0 : 1,
    })
  }

  const bats = []
  for (let i = 0; i < 6; i++) {
    bats.push({
      x: rng() * W,
      y: H * 0.08 + rng() * H * 0.25,
      vx: (rng() - 0.5) * 1.5,
      vy: (rng() - 0.5) * 0.3,
      wingPhase: rng() * TAU,
      wingSpeed: 3 + rng() * 4,
      size: rng() > 0.5 ? 1 : 0,
    })
  }

  const fencePosts = []
  const postSpacing = 4
  for (let fx = 2; fx < W - 2; fx += postSpacing) {
    fencePosts.push(fx)
  }

  return {
    W, H, groundY, moonCX, moonCY, moonR,
    stars, tombstones, branches, wisps, bats, fencePosts,
    treeLX, treeRX,
  }
}

function drawSky(canvas, state, t) {
  const { W, H, groundY, moonCX, moonCY, moonR, stars } = state
  for (let y = 0; y < groundY + 4; y++) {
    const frac = y / groundY
    const bg = mix(P.skyTop, frac < 0.6 ? P.skyMid : P.skyLow, frac < 0.6 ? frac / 0.6 : (frac - 0.6) / 0.4)
    for (let x = 0; x < W; x++) {
      const dx = x - moonCX, dy = y - moonCY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < moonR * 3) {
        const glowT = Math.max(0, 1 - dist / (moonR * 3))
        const glowBg = mix(bg, P.moonGlowNear, glowT * glowT * 0.5)
        canvas.setCell(x, y, ' ', null, glowBg)
      } else {
        canvas.setCell(x, y, ' ', null, bg)
      }
    }
  }

  for (let dy = -moonR; dy <= moonR; dy++) {
    for (let dx = -moonR; dx <= moonR; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= moonR) {
        const px = moonCX + dx, py = moonCY + dy
        if (px < 0 || px >= W || py < 0 || py >= groundY + 4) continue
        const edgeT = dist / moonR
        const col = edgeT < 0.6 ? mix(P.moonInner, P.moonMid, edgeT / 0.6) : mix(P.moonMid, P.moonOuter, (edgeT - 0.6) / 0.4)
        const crater = vnoise(px * 0.15, py * 0.15) * 0.15
        const moonCol = mix(col, P.moonOuter, crater)
        canvas.setCell(px, py, ' ', null, moonCol)
      }
    }
  }

  for (const s of stars) {
    if (s.x >= 0 && s.x < W && s.y >= 0 && s.y < groundY) {
      const dx = s.x - moonCX, dy = s.y - moonCY
      if (Math.sqrt(dx * dx + dy * dy) < moonR * 2.5) continue
      const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase))
      const brightness = s.bright * twinkle
      const col = mix('#1a1020', P.star, brightness)
      canvas.setCell(s.x, s.y, s.char, col)
    }
  }
}

function drawTrees(canvas, state) {
  const { W, H, groundY, treeLX, treeRX, branches } = state
  const trunkW = 2

  for (const rootX of [treeLX, treeRX]) {
    const topY = rootX === treeLX ? Math.floor(H * 0.15) : Math.floor(H * 0.2)
    for (let y = topY; y <= groundY + 2; y++) {
      const widen = Math.floor((y - topY) / (groundY - topY) * 1.5)
      for (let dx = -trunkW - widen; dx <= trunkW + widen; dx++) {
        const px = rootX + dx
        if (px >= 0 && px < W) {
          const tCol = Math.abs(dx) <= 1 ? P.treeDark : P.treeBranch
          canvas.setCell(px, y, BLOCK.full, tCol)
        }
      }
    }
  }

  for (const b of branches) {
    let bx = b.rootX, by = b.startY
    let angle = b.angle
    for (let i = 0; i < b.len; i++) {
      const px = Math.round(bx), py = Math.round(by)
      if (px >= 0 && px < W && py >= 0 && py < groundY + 2) {
        const thinning = i / b.len
        const ch = thinning > 0.7 ? '·' : thinning > 0.4 ? '─' : BLOCK.full
        canvas.setCell(px, py, ch, P.treeBranch)
        if (thinning < 0.3 && py + 1 < groundY + 2) {
          canvas.setCell(px, py + 1, SHADE[0], P.treeDark)
        }
      }
      bx += Math.cos(angle) * 1.2
      by += Math.sin(angle)
      angle += b.droopRate
    }
  }
}

function drawGround(canvas, state, t) {
  const { W, H, groundY } = state
  for (let y = groundY; y < H; y++) {
    const depth = (y - groundY) / (H - groundY)
    for (let x = 0; x < W; x++) {
      const n = vnoise(x * 0.05 + t * 0.1, y * 0.08)
      const bg = mix(P.groundDark, P.groundMid, n * 0.5 + depth * 0.3)
      canvas.setCell(x, y, ' ', null, bg)
    }
  }
}

function drawFog(canvas, state, t) {
  const { W, H, groundY } = state
  const fogBand = 8
  for (let y = groundY - 2; y < Math.min(groundY + fogBand, H); y++) {
    for (let x = 0; x < W; x++) {
      const n1 = vnoise(x * 0.04 + t * 0.15, y * 0.1 + t * 0.05)
      const n2 = vnoise(x * 0.08 - t * 0.1, y * 0.15)
      const density = (n1 * 0.6 + n2 * 0.4)
      const distFromGround = Math.abs(y - groundY) / fogBand
      const falloff = Math.max(0, 1 - distFromGround * 1.2)
      const alpha = density * falloff * 0.35
      if (alpha > 0.05) {
        const existing = canvas.getCell(x, y)
        if (existing) {
          const fogCol = mix(existing.bg || '#000000', P.fogLight, alpha)
          const fogChar = alpha > 0.25 ? SHADE[0] : existing.char
          const fogFg = alpha > 0.25 ? mix(P.fogDark, P.fogLight, alpha) : existing.fg
          canvas.setCell(x, y, fogChar, fogFg, fogCol)
        }
      }
    }
  }
}

function drawTombstones(canvas, state) {
  const { tombstones, W, groundY } = state
  for (const tomb of tombstones) {
    const { x, y, w, h, kind, lean } = tomb
    const baseCol = tomb.depth < 0.3 ? P.tombDark : tomb.depth < 0.6 ? P.tombMid : P.tombLight

    if (kind === 'cross') {
      const cx = x
      for (let dy = 0; dy < h; dy++) {
        const py = y - dy
        const px = Math.round(cx + dy * lean)
        if (px >= 0 && px < W && py >= 0) {
          canvas.setCell(px, py, BLOCK.full, baseCol)
        }
      }
      const armY = y - h + 2
      for (let dx = -2; dx <= 2; dx++) {
        const px = Math.round(x + (h - 2) * lean) + dx
        if (px >= 0 && px < W && armY >= 0) {
          canvas.setCell(px, armY, BLOCK.full, baseCol)
        }
      }
    } else if (kind === 'obelisk') {
      for (let dy = 0; dy < h; dy++) {
        const taper = dy > h - 2 ? 0 : 1
        const py = y - dy
        for (let dx = -taper; dx <= taper; dx++) {
          const px = Math.round(x + dx + dy * lean)
          if (px >= 0 && px < W && py >= 0) {
            const edgeT = taper > 0 ? Math.abs(dx) / taper : 0
            canvas.setCell(px, py, BLOCK.full, mix(baseCol, P.tombDark, edgeT * 0.3))
          }
        }
      }
      const tipPx = Math.round(x + h * lean)
      const tipPy = y - h
      if (tipPx >= 0 && tipPx < W && tipPy >= 0) {
        canvas.setCell(tipPx, tipPy, '▲', baseCol)
      }
    } else if (kind === 'rounded') {
      for (let dy = 0; dy < h; dy++) {
        const py = y - dy
        for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
          const px = Math.round(x + dx + dy * lean)
          if (px >= 0 && px < W && py >= 0) {
            canvas.setCell(px, py, BLOCK.full, baseCol)
          }
        }
      }
      const topPx = Math.round(x + h * lean)
      const topPy = y - h
      if (topPx >= 0 && topPx < W && topPy >= 0) {
        canvas.setCell(topPx, topPy, '⌒', P.tombLight)
      }
    } else {
      for (let dy = 0; dy < h; dy++) {
        const py = y - dy
        for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
          const px = Math.round(x + dx + dy * lean)
          if (px >= 0 && px < W && py >= 0) {
            const edgeT = Math.abs(dx) / Math.max(1, Math.floor(w / 2))
            canvas.setCell(px, py, BLOCK.full, mix(baseCol, P.tombDark, edgeT * 0.4))
          }
        }
      }
    }

    if (tomb.depth > 0.3) {
      const mossY = y
      const mossPx = Math.round(x + lean)
      if (mossPx >= 0 && mossPx < W && mossY >= 0) {
        canvas.setCell(mossPx, mossY, SHADE[1], P.tombMoss)
      }
    }
  }
}

function drawWisps(canvas, state, t) {
  const { wisps, W, groundY } = state
  for (const w of wisps) {
    const xDrift = Math.sin(t * w.speed + w.phase) * w.amplitude
    const rise = (t * w.riseSpeed) % (w.height + 4)
    for (let i = 0; i < w.height; i++) {
      const py = Math.round(w.baseY - rise + (w.height - i))
      const px = Math.round(w.x + xDrift + Math.sin((t + i * 0.3) * 1.5) * 1.5)
      if (px < 0 || px >= W || py < 0 || py >= groundY + 6) continue
      const fadeT = i / w.height
      const alpha = (1 - fadeT) * (1 - Math.abs(rise - w.height / 2) / (w.height / 2 + 2))
      if (alpha <= 0.05) continue
      const baseWispCol = w.hue === 0 ? P.wisp1 : P.wisp2
      const wispCol = mix('#000000', baseWispCol, Math.max(0, alpha * 0.7))
      const ch = alpha > 0.5 ? '◆' : alpha > 0.3 ? '◇' : '·'
      canvas.setCell(px, py, ch, wispCol)
    }
  }
}

function drawBats(canvas, state, t) {
  const { bats, W, H, moonCX, moonCY, moonR } = state
  for (const bat of bats) {
    bat.x += bat.vx
    bat.y += bat.vy + Math.sin(t * 2 + bat.wingPhase) * 0.15
    bat.wingPhase += bat.wingSpeed * 0.1

    if (bat.x < -5) bat.x = W + 4
    if (bat.x > W + 5) bat.x = -4
    if (bat.y < 2) bat.vy += 0.05
    if (bat.y > H * 0.4) bat.vy -= 0.05

    const px = Math.round(bat.x), py = Math.round(bat.y)
    const wingUp = Math.sin(bat.wingPhase) > 0

    const dx = px - moonCX, dy = py - moonCY
    const onMoon = Math.sqrt(dx * dx + dy * dy) < moonR + 1
    const col = onMoon ? '#000000' : P.batCol

    if (bat.size === 1) {
      if (wingUp) {
        if (px - 2 >= 0 && px - 2 < W && py - 1 >= 0) canvas.setCell(px - 2, py - 1, '╲', col)
        if (px - 1 >= 0 && px - 1 < W && py >= 0) canvas.setCell(px - 1, py, '▀', col)
        if (px >= 0 && px < W && py >= 0) canvas.setCell(px, py, '●', col)
        if (px + 1 >= 0 && px + 1 < W && py >= 0) canvas.setCell(px + 1, py, '▀', col)
        if (px + 2 >= 0 && px + 2 < W && py - 1 >= 0) canvas.setCell(px + 2, py - 1, '╱', col)
      } else {
        if (px - 2 >= 0 && px - 2 < W && py + 1 < H) canvas.setCell(px - 2, py + 1, '╱', col)
        if (px - 1 >= 0 && px - 1 < W && py >= 0) canvas.setCell(px - 1, py, '▄', col)
        if (px >= 0 && px < W && py >= 0) canvas.setCell(px, py, '●', col)
        if (px + 1 >= 0 && px + 1 < W && py >= 0) canvas.setCell(px + 1, py, '▄', col)
        if (px + 2 >= 0 && px + 2 < W && py + 1 < H) canvas.setCell(px + 2, py + 1, '╲', col)
      }
    } else {
      if (wingUp) {
        if (px - 1 >= 0 && px - 1 < W && py - 1 >= 0) canvas.setCell(px - 1, py - 1, '`', col)
        if (px >= 0 && px < W && py >= 0) canvas.setCell(px, py, '▪', col)
        if (px + 1 >= 0 && px + 1 < W && py - 1 >= 0) canvas.setCell(px + 1, py - 1, '´', col)
      } else {
        if (px - 1 >= 0 && px - 1 < W && py >= 0) canvas.setCell(px - 1, py, '.', col)
        if (px >= 0 && px < W && py >= 0) canvas.setCell(px, py, '▪', col)
        if (px + 1 >= 0 && px + 1 < W && py >= 0) canvas.setCell(px + 1, py, '.', col)
      }
    }
  }
}

function drawFence(canvas, state) {
  const { fencePosts, W, H, groundY } = state
  const fenceY = groundY + Math.floor((H - groundY) * 0.55)
  const fenceH = 4

  for (let x = 2; x < W - 2; x++) {
    const py = fenceY
    if (py >= 0 && py < H) {
      canvas.setCell(x, py, '─', P.ironDark)
    }
    const py2 = fenceY - 2
    if (py2 >= 0 && py2 < H) {
      canvas.setCell(x, py2, '─', P.ironDark)
    }
  }

  for (const fx of fencePosts) {
    for (let dy = 0; dy < fenceH; dy++) {
      const py = fenceY - dy
      if (fx >= 0 && fx < W && py >= 0 && py < H) {
        canvas.setCell(fx, py, '│', P.ironLight)
      }
    }
    const tipY = fenceY - fenceH
    if (fx >= 0 && fx < W && tipY >= 0 && tipY < H) {
      canvas.setCell(fx, tipY, '▲', P.ironLight)
    }
  }
}

function drawScene(canvas, state, t) {
  drawSky(canvas, state, t)
  drawGround(canvas, state, t)
  drawTrees(canvas, state)
  drawTombstones(canvas, state)
  drawFog(canvas, state, t)
  drawWisps(canvas, state, t)
  drawBats(canvas, state, t)
  drawFence(canvas, state)
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
