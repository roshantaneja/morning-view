import { hex, bgHex, lerp, lerpMulti, BLOCK } from '../src/theme.js'

export const title = 'Harvest Gold'
export const description = 'Amber waves roll through September grain — the wind writes in a language only the field can read'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

export function setup(canvas) {
  const rng = srand(905)
  const W = canvas.width
  const H = canvas.height
  const fieldTop = Math.floor(H * 0.36)

  const noise = []
  for (let y = 0; y < H; y++) {
    noise[y] = []
    for (let x = 0; x < W; x++) {
      noise[y][x] = rng()
    }
  }

  const trees = []
  let tx = 1
  while (tx < W - 2) {
    const w = 3 + Math.floor(rng() * 7)
    const h = 2 + Math.floor(rng() * 5)
    trees.push({ x: tx, w, h, shape: rng() })
    tx += w + Math.floor(rng() * 6) + 1
  }

  const seeds = []
  for (let i = 0; i < 10; i++) {
    seeds.push({
      x: rng() * W,
      y: fieldTop * 0.4 + rng() * fieldTop * 0.5,
      phase: rng() * Math.PI * 2,
      speed: 0.3 + rng() * 0.7,
    })
  }

  return { noise, trees, seeds, time: 0, fieldTop }
}

function drawScene(canvas, state) {
  const W = canvas.width
  const H = canvas.height
  const { noise, trees, seeds, time, fieldTop } = state

  const skyPalette = [
    '#0c0620', '#161040', '#30205a', '#6a3068',
    '#b84858', '#d87040', '#eca038', '#f4c850', '#f8dd70',
  ]
  for (let y = 0; y < fieldTop; y++) {
    const t = y / fieldTop
    const col = lerpMulti(skyPalette, t)
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bgHex(col))
    }
  }

  const sunX = Math.floor(W * 0.68)
  const sunY = fieldTop - 3
  const rX = 20
  const rY = 12
  for (let y = Math.max(0, sunY - rY); y < fieldTop; y++) {
    for (let x = Math.max(0, sunX - rX); x < Math.min(W, sunX + rX); x++) {
      const dx = (x - sunX) / rX
      const dy = (y - sunY) / rY
      const d2 = dx * dx + dy * dy
      if (d2 < 1) {
        const glow = Math.pow(1 - d2, 1.8) * 0.65
        const baseT = y / fieldTop
        const base = lerpMulti(skyPalette, baseT)
        canvas.setCell(x, y, ' ', null, bgHex(lerp(base, '#fff8e0', glow)))
      }
    }
  }

  const cloudSeeds = [
    { cx: 0.12, cy: 0.18, w: 10 },
    { cx: 0.40, cy: 0.14, w: 14 },
    { cx: 0.82, cy: 0.22, w: 8 },
  ]
  for (const cs of cloudSeeds) {
    const cy = Math.floor(fieldTop * cs.cy)
    const cx = Math.floor(W * cs.cx + Math.sin(time * 0.05 + cs.cx * 10) * 3)
    for (let dx = -cs.w; dx <= cs.w; dx++) {
      const x = cx + dx
      if (x < 0 || x >= W) continue
      const f = Math.max(0, 1 - (dx * dx) / (cs.w * cs.w))
      const opacity = f * f * 0.12
      const baseT = cy / fieldTop
      const base = lerpMulti(skyPalette, baseT)
      canvas.setCell(x, cy, ' ', null, bgHex(lerp(base, '#e8c8b0', opacity)))
    }
  }

  for (const tree of trees) {
    const baseY = fieldTop
    for (let dy = 1; dy <= tree.h; dy++) {
      const y = baseY - dy
      if (y < 0) continue
      const taper = Math.floor(dy * (tree.shape > 0.5 ? 0.7 : 0.35))
      for (let dx = taper; dx < tree.w - taper; dx++) {
        const x = tree.x + dx
        if (x >= 0 && x < W) {
          const tc = lerp('#0a1508', '#1c2c12', dy / tree.h)
          canvas.setCell(x, y, BLOCK.full, hex(tc), bgHex(tc))
        }
      }
    }
  }

  const fieldH = H - fieldTop
  const hazeRows = Math.floor(fieldH * 0.04)
  for (let i = 0; i < hazeRows; i++) {
    const y = fieldTop + i
    if (y >= H) break
    const t = i / hazeRows
    const hc = lerp('#d8b848', '#b89030', t)
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, BLOCK.light, hex(lerp(hc, '#f0d860', 0.2)), bgHex(hc))
    }
  }

  for (let y = fieldTop + hazeRows; y < H; y++) {
    const rowT = (y - fieldTop) / fieldH

    for (let x = 0; x < W; x++) {
      const n = noise[y][x]

      const w1 = Math.sin(time * 1.6 + x * 0.055 + y * 0.018)
      const w2 = Math.sin(time * 1.1 + x * 0.11 - y * 0.035 + 1.8) * 0.45
      const w3 = Math.sin(time * 0.6 + x * 0.025 + y * 0.07 + n * 4) * 0.25
      const wind = w1 + w2 + w3

      const farBase = '#c8a848'
      const nearBase = '#7a5818'
      const base = lerp(farBase, nearBase, rowT)

      const lightCatch = Math.max(0, wind) * 0.45
      const shadow = Math.max(0, -wind) * 0.25

      let col = lerp(base, '#f8e068', lightCatch)
      col = lerp(col, '#3a2808', shadow)
      col = lerp(col, n > 0.5 ? '#d8b040' : '#6a4818', 0.08)

      let ch
      if (rowT < 0.12) {
        ch = n > 0.6 ? BLOCK.light : ' '
      } else if (rowT < 0.2) {
        ch = wind > 0.5 ? '/' : wind < -0.5 ? '\\' : '|'
      } else {
        if (wind > 0.9) ch = '╱'
        else if (wind < -0.9) ch = '╲'
        else ch = '│'

        if (rowT > 0.75 && n > 0.55) ch = '┃'
        else if (rowT < 0.35 && n > 0.8) ch = '╎'
      }

      if (n > 0.92 && rowT > 0.15 && rowT < 0.55) {
        ch = '≈'
        col = lerp(col, '#f0d860', 0.35)
      }

      const bg = lerp(col, '#1a0e04', 0.4)
      canvas.setCell(x, y, ch, hex(col), bgHex(bg))
    }
  }

  const path1Y = Math.floor(fieldTop + fieldH * 0.7)
  const path2Y = path1Y + 1
  for (let pY = path1Y; pY <= path2Y && pY < H; pY++) {
    const curveOff = Math.sin(time * 0.3) * 0.5
    for (let x = 0; x < W; x++) {
      const pathCenter = W * 0.35 + Math.sin((x + pY * 3) * 0.04 + curveOff) * 8
      const dist = Math.abs(x - pathCenter)
      if (dist < 2) {
        const pc = lerp('#9a7a40', '#6a5830', dist / 2)
        canvas.setCell(x, pY, dist < 1 ? ' ' : BLOCK.light, hex(pc), bgHex(pc))
      }
    }
  }

  for (const seed of seeds) {
    const wobble = Math.sin(time * 1.2 + seed.phase) * 1.5
    const sx = Math.floor(seed.x + wobble)
    const sy = Math.floor(seed.y)
    if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
      canvas.setCell(sx, sy, '·', hex('#f0e0a0'))
    }
    const sx2 = Math.floor(seed.x + wobble + 1)
    if (sx2 >= 0 && sx2 < W && sy - 1 >= 0 && sy - 1 < H) {
      canvas.setCell(sx2, sy - 1, '˙', hex('#e8d890'))
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state)
}

export function update(canvas, data, frame, state) {
  state.time += frame.dt

  const W = canvas.width
  for (const seed of state.seeds) {
    seed.x += seed.speed * frame.dt * 5
    seed.y -= 0.05
    if (seed.x > W + 5) {
      seed.x = -5
      seed.y = state.fieldTop * 0.3 + (seed.phase / (Math.PI * 2)) * state.fieldTop * 0.5
    }
  }

  drawScene(canvas, state)
}
