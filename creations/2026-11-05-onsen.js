import { SHADE, BLOCK } from '../src/theme.js'

export const title = 'Mountain Onsen'
export const description =
  'Steam curls from mineral waters into the frozen air — snow blankets the rocks, bare maples frame a quiet sky'
export const fps = 2

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
function noise2d(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy), b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

const SKY_TOP    = '#0a0e1a'
const SKY_MID    = '#141828'
const SKY_LOW    = '#1e2238'
const MOON_CORE  = '#e8e0c8'
const MOON_GLOW  = '#40384a'

const MTN_FAR    = '#1a1e30'
const MTN_MID    = '#222840'
const MTN_NEAR   = '#2a2e3a'

const SNOW_BRT   = '#d0d8e8'
const SNOW_MID   = '#a0a8b8'
const SNOW_DIM   = '#707888'
const SNOW_SHD   = '#484e5a'

const ROCK_LT    = '#6a5e50'
const ROCK_MD    = '#4a4038'
const ROCK_DK    = '#2e2820'
const ROCK_WET   = '#38342e'

const WATER_SFC  = '#2a4858'
const WATER_DEEP = '#183848'
const WATER_GLOW = '#305868'
const WATER_MINT = '#3a6878'
const WATER_SHIM = '#5a8898'

const STEAM_LT   = '#c8c0b8'
const STEAM_MD   = '#888480'
const STEAM_DK   = '#585450'

const TREE_BARK  = '#3a3028'
const TREE_BRK2  = '#4a3e30'
const TWIG_CLR   = '#5a4e40'

const FENCE_CLR  = '#5a4838'
const BUCKET_CLR = '#6a5a42'

export function setup(canvas, data) {
  const rng = srand(20261105)
  const W = canvas.width, H = canvas.height

  const waterY = Math.floor(H * 0.55)
  const poolCx = W * 0.5
  const poolCy = waterY + Math.floor(H * 0.12)
  const poolRx = Math.floor(W * 0.38)
  const poolRy = Math.floor(H * 0.22)

  const rocks = []
  for (let i = 0; i < 28; i++) {
    const angle = rng() * TAU
    const spread = 0.85 + rng() * 0.3
    const rx = poolCx + Math.cos(angle) * poolRx * spread
    const ry = poolCy + Math.sin(angle) * poolRy * spread
    if (ry < waterY - 3 || ry > H - 5) continue
    rocks.push({
      x: rx, y: ry,
      w: 2 + Math.floor(rng() * 5),
      h: 1 + Math.floor(rng() * 3),
      snowCap: rng() > 0.25,
      tex: rng(),
      wet: Math.sin(angle) > 0.3 && rng() > 0.4,
    })
  }

  const steamColumns = []
  for (let i = 0; i < 14; i++) {
    const sx = poolCx + (rng() - 0.5) * poolRx * 1.4
    steamColumns.push({
      x: sx,
      baseY: waterY + Math.floor(rng() * poolRy * 0.4),
      height: Math.floor(H * 0.12 + rng() * H * 0.20),
      width: 2 + Math.floor(rng() * 4),
      phase: rng() * TAU,
      speed: 0.15 + rng() * 0.25,
      drift: (rng() - 0.5) * 0.8,
      density: 0.3 + rng() * 0.5,
    })
  }

  const trees = []
  const treePositions = [
    { x: 0.08, y: 0.35 }, { x: 0.15, y: 0.40 },
    { x: 0.85, y: 0.38 }, { x: 0.92, y: 0.42 },
    { x: 0.05, y: 0.30 }, { x: 0.95, y: 0.33 },
  ]
  for (const tp of treePositions) {
    const tx = Math.floor(tp.x * W)
    const ty = Math.floor(tp.y * H)
    const branches = []
    const numBranches = 4 + Math.floor(rng() * 5)
    for (let b = 0; b < numBranches; b++) {
      const bh = ty - 2 - Math.floor(rng() * Math.floor(H * 0.18))
      const dir = rng() < 0.5 ? -1 : 1
      const len = 3 + Math.floor(rng() * 10)
      const curve = (rng() - 0.5) * 0.3
      branches.push({ y: bh, dir, len, curve, snow: rng() > 0.3 })
    }
    trees.push({ x: tx, baseY: ty, trunkH: 5 + Math.floor(rng() * 8), branches })
  }

  const snowflakes = []
  for (let i = 0; i < 60; i++) {
    snowflakes.push({
      x: rng() * W,
      y: rng() * H * 0.55,
      speed: 0.3 + rng() * 0.5,
      drift: (rng() - 0.5) * 0.6,
      phase: rng() * TAU,
      size: rng() < 0.2 ? 1 : 0,
    })
  }

  const stars = []
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * Math.floor(H * 0.30)),
      br: 0.3 + rng() * 0.7,
      twinkleSpeed: 0.5 + rng() * 2.0,
      twinklePhase: rng() * TAU,
    })
  }

  return {
    waterY, poolCx, poolCy, poolRx, poolRy,
    rocks, steamColumns, trees, snowflakes, stars,
    moonX: Math.floor(W * 0.75), moonY: Math.floor(H * 0.10),
  }
}

function drawSky(canvas, state, t) {
  const W = canvas.width, H = state.waterY
  for (let y = 0; y < H; y++) {
    const yt = y / H
    let bg
    if (yt < 0.4) bg = mix(SKY_TOP, SKY_MID, yt / 0.4)
    else bg = mix(SKY_MID, SKY_LOW, (yt - 0.4) / 0.6)

    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bg)
    }
  }

  for (const s of state.stars) {
    if (s.y >= H) continue
    const tw = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.3 + 0.7
    const br = s.br * tw
    if (br < 0.3) continue
    const bg = canvas.getCell(s.x, s.y)
    const col = mix(bg ? bg.bg || SKY_TOP : SKY_TOP, '#c8c0d8', br * 0.7)
    canvas.setCell(s.x, s.y, br > 0.7 ? '·' : '.', col, bg ? bg.bg : null)
  }

  const mx = state.moonX, my = state.moonY
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const px = mx + dx, py = my + dy
      if (px < 0 || px >= W || py < 0 || py >= canvas.height) continue
      const d = Math.sqrt((dx / 2.2) ** 2 + dy ** 2)
      if (d > 3.5) continue
      const bg = canvas.getCell(px, py)
      const baseBg = bg ? bg.bg || SKY_TOP : SKY_TOP

      if (d < 2.0) {
        const moonBr = 1 - d / 2.0
        const col = mix(baseBg, MOON_CORE, moonBr * 0.85)
        canvas.setCell(px, py, d < 1.0 ? SHADE[3] : SHADE[2], mix(col, '#ffffff', 0.1), col)
      } else {
        const glowBr = 1 - (d - 2.0) / 1.5
        const col = mix(baseBg, MOON_GLOW, glowBr * 0.35)
        canvas.setCell(px, py, ' ', null, col)
      }
    }
  }
}

function drawMountains(canvas, state) {
  const W = canvas.width, skyH = state.waterY
  const layers = [
    { baseY: skyH * 0.45, amplitude: skyH * 0.08, freq: 0.015, color: MTN_FAR, snowLine: 0.35 },
    { baseY: skyH * 0.58, amplitude: skyH * 0.12, freq: 0.020, color: MTN_MID, snowLine: 0.40 },
    { baseY: skyH * 0.72, amplitude: skyH * 0.10, freq: 0.025, color: MTN_NEAR, snowLine: 0.50 },
  ]

  for (const layer of layers) {
    for (let x = 0; x < W; x++) {
      const n1 = noise2d(x * layer.freq, 0)
      const n2 = noise2d(x * layer.freq * 2.5 + 100, 50)
      const peakY = Math.floor(layer.baseY - layer.amplitude * (n1 + n2 * 0.3))

      for (let y = peakY; y < skyH; y++) {
        const depth = (y - peakY) / (skyH - peakY)
        const snowT = Math.max(0, 1 - depth / layer.snowLine)
        let col
        if (snowT > 0.1) {
          col = mix(layer.color, SNOW_DIM, snowT * 0.6)
        } else {
          col = mix(layer.color, '#0a0e18', depth * 0.3)
        }
        canvas.setCell(x, y, ' ', null, col)
      }
    }
  }
}

function drawSnowGround(canvas, state) {
  const W = canvas.width, H = canvas.height
  const wy = state.waterY

  for (let y = wy; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - state.poolCx) / state.poolRx
      const dy = (y - state.poolCy) / state.poolRy
      const inPool = dx * dx + dy * dy < 1.0

      if (!inPool) {
        const n = noise2d(x * 0.08, y * 0.12)
        const n2 = noise2d(x * 0.04 + 50, y * 0.06 + 50)
        const distFromPool = Math.sqrt(dx * dx + dy * dy) - 1.0
        const wetness = Math.max(0, 1 - distFromPool * 2.5)

        let bg, fg, ch
        if (wetness > 0.3) {
          bg = mix(SNOW_SHD, ROCK_WET, wetness * 0.4)
          fg = mix(SNOW_DIM, ROCK_MD, wetness * 0.3 + n * 0.2)
          ch = n > 0.5 ? SHADE[1] : SHADE[0]
        } else {
          const snowBr = n * 0.4 + n2 * 0.3 + 0.3
          bg = mix(SNOW_SHD, SNOW_MID, snowBr)
          fg = mix(SNOW_MID, SNOW_BRT, snowBr * 0.5 + 0.2)
          ch = snowBr > 0.55 ? SHADE[2] : snowBr > 0.35 ? SHADE[1] : SHADE[0]
        }
        canvas.setCell(x, y, ch, fg, bg)
      }
    }
  }
}

function drawPool(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  const { poolCx, poolCy, poolRx, poolRy } = state

  for (let y = state.waterY; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - poolCx) / poolRx
      const dy = (y - poolCy) / poolRy
      const d2 = dx * dx + dy * dy
      if (d2 >= 1.0) continue

      const d = Math.sqrt(d2)
      const edgeFade = Math.min(1, (1 - d) * 5)

      const waveN = noise2d(x * 0.06 + t * 0.3, y * 0.08 - t * 0.1)
      const waveN2 = noise2d(x * 0.1 - t * 0.15, y * 0.12 + t * 0.2)
      const wave = waveN * 0.5 + waveN2 * 0.5

      const depthT = d
      let waterCol = mix(WATER_DEEP, WATER_SFC, (1 - depthT) * 0.5 + wave * 0.2)

      const moonDx = (x - state.moonX) / (poolRx * 0.3)
      const moonDy = (y - (poolCy - poolRy * 0.3)) / (poolRy * 0.25)
      const moonRefl = Math.exp(-(moonDx * moonDx + moonDy * moonDy) * 1.5)
      if (moonRefl > 0.05) {
        const shimmer = Math.sin(t * 1.5 + x * 0.3 + y * 0.2) * 0.2 + 0.8
        waterCol = mix(waterCol, '#504838', moonRefl * shimmer * 0.4)
      }

      const centerGlow = Math.exp(-d2 * 3)
      waterCol = mix(waterCol, WATER_GLOW, centerGlow * 0.2)

      if (wave > 0.55 && d < 0.8) {
        waterCol = mix(waterCol, WATER_SHIM, (wave - 0.55) * 0.5)
      }

      if (d > 0.85) {
        waterCol = mix(waterCol, ROCK_WET, (d - 0.85) / 0.15 * 0.5)
      }

      let ch = ' '
      let fg = waterCol
      if (wave > 0.58 && d < 0.85) {
        ch = '~'
        fg = mix(waterCol, WATER_MINT, 0.3)
      } else if (wave > 0.48 && d < 0.7) {
        ch = '·'
        fg = mix(waterCol, WATER_SHIM, 0.2)
      }

      canvas.setCell(x, y, ch, mix(fg, waterCol, 1 - edgeFade), waterCol)
    }
  }
}

function drawRocks(canvas, state) {
  const W = canvas.width, H = canvas.height
  for (const rock of state.rocks) {
    for (let dy = 0; dy < rock.h; dy++) {
      for (let dx = 0; dx < rock.w; dx++) {
        const rx = Math.floor(rock.x + dx - rock.w / 2)
        const ry = Math.floor(rock.y + dy - rock.h / 2)
        if (rx < 0 || rx >= W || ry < 0 || ry >= H) continue

        const n = hash(rx * 3.7, ry * 5.3) * 0.5 + rock.tex * 0.5
        let bg, fg, ch
        if (rock.wet) {
          bg = mix(ROCK_WET, ROCK_DK, n * 0.4)
          fg = mix(ROCK_MD, ROCK_WET, n * 0.3)
          ch = n > 0.6 ? SHADE[2] : SHADE[1]
        } else {
          bg = mix(ROCK_DK, ROCK_MD, n * 0.5)
          fg = mix(ROCK_MD, ROCK_LT, n * 0.4)
          ch = SHADE[Math.min(3, Math.floor(n * 2.5 + 1))]
        }
        canvas.setCell(rx, ry, ch, fg, bg)

        if (rock.snowCap && dy === 0) {
          const sy = ry - 1
          if (sy >= 0 && sy < H) {
            const sb = hash(rx * 2.1, sy * 3.3)
            canvas.setCell(rx, sy, BLOCK.lower,
              mix(SNOW_MID, SNOW_BRT, sb * 0.5), null)
          }
        }
      }
    }
  }
}

function drawTrees(canvas, state) {
  const W = canvas.width, H = canvas.height
  const set = (x, y, ch, fg, bg) => {
    if (x >= 0 && x < W && y >= 0 && y < H) canvas.setCell(x, y, ch, fg, bg || null)
  }

  for (const tree of state.trees) {
    for (let i = 0; i < tree.trunkH; i++) {
      const ty = tree.baseY - i
      const n = hash(tree.x, ty)
      set(tree.x, ty, '│', mix(TREE_BARK, TREE_BRK2, n), null)
    }

    for (const branch of tree.branches) {
      let bx = tree.x
      for (let i = 1; i <= branch.len; i++) {
        bx += branch.dir
        const by = branch.y - Math.floor(i * branch.curve)
        const n = hash(bx * 2.3, by * 4.1)
        const upSlope = i < branch.len * 0.3

        let ch
        if (upSlope) ch = branch.dir > 0 ? '╱' : '╲'
        else ch = '─'

        set(bx, by, ch, mix(TWIG_CLR, TREE_BARK, n * 0.4), null)

        if (branch.snow && i % 3 === 0 && by - 1 >= 0) {
          set(bx, by - 1, '·', SNOW_BRT, null)
        }
      }
    }
  }
}

function drawSteam(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  for (const col of state.steamColumns) {
    const phase = t * col.speed + col.phase
    for (let i = 0; i < col.height; i++) {
      const progress = i / col.height
      const y = col.baseY - i
      if (y < 0 || y >= H) continue

      const xDrift = Math.sin(phase + i * 0.15) * (2 + progress * 4) + col.drift * progress * 6
      const spread = col.width * (1 + progress * 2.5)

      for (let dx = -Math.ceil(spread); dx <= Math.ceil(spread); dx++) {
        const x = Math.floor(col.x + xDrift + dx)
        if (x < 0 || x >= W) continue

        const distFromCenter = Math.abs(dx) / spread
        if (distFromCenter > 1) continue

        const density = col.density *
          (1 - distFromCenter * distFromCenter) *
          (1 - progress * 0.85) *
          (0.7 + 0.3 * Math.sin(phase * 2 + i * 0.3 + dx * 0.5))

        if (density < 0.05) continue

        const existing = canvas.getCell(x, y)
        if (!existing) continue

        const steamCol = mix(STEAM_DK, STEAM_LT, density * 0.6 + progress * 0.2)
        const blendedBg = existing.bg
          ? mix(existing.bg, steamCol, density * 0.6)
          : null
        const blendedFg = existing.fg
          ? mix(existing.fg, steamCol, density * 0.4)
          : steamCol

        let ch = existing.char
        if (density > 0.3 && progress < 0.7) {
          ch = density > 0.5 ? SHADE[1] : SHADE[0]
        } else if (density > 0.15 && progress > 0.4) {
          ch = '·'
        }

        canvas.setCell(x, y, ch, blendedFg, blendedBg)
      }
    }
  }
}

function drawSnowfall(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  for (const flake of state.snowflakes) {
    flake.y += flake.speed
    flake.x += flake.drift + Math.sin(t * 0.5 + flake.phase) * 0.3
    if (flake.y > state.waterY) { flake.y = -1; flake.x = Math.random() * W }
    if (flake.x < 0) flake.x += W
    if (flake.x >= W) flake.x -= W

    const fx = Math.floor(flake.x)
    const fy = Math.floor(flake.y)
    if (fx < 0 || fx >= W || fy < 0 || fy >= H) continue

    const ch = flake.size > 0 ? '❄' : '·'
    canvas.setCell(fx, fy, ch, SNOW_BRT, null)
  }
}

function drawFence(canvas, state) {
  const W = canvas.width, H = canvas.height
  const fenceY = state.waterY + 2
  const fenceX = Math.floor(W * 0.18)

  if (fenceX + 8 >= W || fenceY + 3 >= H) return

  for (let i = 0; i < 7; i++) {
    const x = fenceX + i
    if (x >= W) break
    canvas.setCell(x, fenceY, '─', FENCE_CLR, null)
    canvas.setCell(x, fenceY + 2, '─', FENCE_CLR, null)
  }
  canvas.setCell(fenceX, fenceY - 1, '│', FENCE_CLR, null)
  canvas.setCell(fenceX, fenceY, '┬', FENCE_CLR, null)
  canvas.setCell(fenceX, fenceY + 1, '│', FENCE_CLR, null)
  canvas.setCell(fenceX, fenceY + 2, '┴', FENCE_CLR, null)
  canvas.setCell(fenceX + 6, fenceY - 1, '│', FENCE_CLR, null)
  canvas.setCell(fenceX + 6, fenceY, '┬', FENCE_CLR, null)
  canvas.setCell(fenceX + 6, fenceY + 1, '│', FENCE_CLR, null)
  canvas.setCell(fenceX + 6, fenceY + 2, '┴', FENCE_CLR, null)

  const bx = fenceX + 8, by = fenceY + 1
  if (bx + 2 < W && by + 1 < H) {
    canvas.setCell(bx, by, '╭', BUCKET_CLR, null)
    canvas.setCell(bx + 1, by, '─', BUCKET_CLR, null)
    canvas.setCell(bx + 2, by, '╮', BUCKET_CLR, null)
    canvas.setCell(bx, by + 1, '│', BUCKET_CLR, null)
    canvas.setCell(bx + 1, by + 1, ' ', null, mix(BUCKET_CLR, '#2a2018', 0.5))
    canvas.setCell(bx + 2, by + 1, '│', BUCKET_CLR, null)
    canvas.setCell(bx, by + 2, '╰', BUCKET_CLR, null)
    canvas.setCell(bx + 1, by + 2, '─', BUCKET_CLR, null)
    canvas.setCell(bx + 2, by + 2, '╯', BUCKET_CLR, null)
  }
}

function drawScene(canvas, state, t) {
  drawSky(canvas, state, t)
  drawMountains(canvas, state)
  drawSnowGround(canvas, state)
  drawPool(canvas, state, t)
  drawRocks(canvas, state)
  drawTrees(canvas, state)
  drawFence(canvas, state)
  drawSteam(canvas, state, t)
  drawSnowfall(canvas, state, t)
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
