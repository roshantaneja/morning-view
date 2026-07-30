import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Wisteria'
export const description = 'Purple cascades spill from a weathered garden pergola at dawn'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SKY = [
  '#080818', '#0e0e28', '#161638', '#1e1a48', '#281e58',
  '#322468', '#3e2a72', '#4a3478', '#583e7e', '#684a84',
  '#785888', '#8a688c', '#9c7a90', '#b08e96', '#c4a49c',
  '#d8bca8', '#e8d0b8', '#f4e2cc', '#fff0de',
]

const WOOD = ['#1e1208', '#2c1e10', '#3a2a1a', '#483824', '#56462e']
const WOOD_HIGHLIGHT = ['#645438', '#726244', '#806e50']

const VINE_GREEN = ['#182810', '#284018', '#385820', '#487028']
const LEAF_GREEN = ['#2a4a18', '#3a5c22', '#4a6e2c', '#5a8036', '#6a9240']

const FL_DEEP = ['#180630', '#240a48', '#301060', '#3c1878', '#482090']
const FL_RICH = ['#5428a0', '#6038b0', '#6c48c0', '#7858cc']
const FL_MID = ['#8468d6', '#9078de', '#9c88e4', '#a898ea']
const FL_LIGHT = ['#b4a8f0', '#c0b8f4', '#ccc8f8', '#d8d8fa']
const FL_TIP = ['#e4e4fc', '#eeeefe', '#f6f6ff', '#fcfcff']
const FL_PINK = ['#4a1840', '#5c2050', '#6e2860', '#803070', '#923880']

const GROUND = ['#141008', '#1e1a10', '#282418', '#322e22']
const GROUND_MOSS = ['#141e0c', '#1c2a14', '#24361c']

export function setup(canvas) {
  const rng = srand(7302)
  const w = canvas.width
  const h = canvas.height

  const beamY = Math.floor(h * 0.07)

  const chains = []
  for (let i = 0; i < 50; i++) {
    const x = Math.floor(w * 0.06 + rng() * w * 0.88)
    const startY = beamY + 2 + Math.floor(rng() * 5)
    const length = 12 + Math.floor(rng() * 55)
    const maxWidth = 1 + Math.floor(rng() * 4)
    const phase = rng() * Math.PI * 2
    const swayAmp = 0.3 + rng() * 1.8
    const swayFreq = 0.12 + rng() * 0.3
    const isPink = rng() < 0.15
    const density = 0.5 + rng() * 0.5
    const depth = Math.floor(rng() * 3)

    chains.push({
      x, startY, length, maxWidth, phase, swayAmp, swayFreq,
      isPink, density, depth, seed: rng() * 10000,
    })
  }
  chains.sort((a, b) => a.depth - b.depth)

  const petals = []
  for (let i = 0; i < 30; i++) {
    petals.push({
      x: rng() * w,
      y: rng() * h,
      speed: 0.4 + rng() * 0.8,
      driftFreq: 0.2 + rng() * 0.5,
      driftAmp: 1.5 + rng() * 3,
      phase: rng() * Math.PI * 2,
      colorT: 0.3 + rng() * 0.7,
    })
  }

  const leaves = []
  for (let i = 0; i < 90; i++) {
    const lx = Math.floor(w * 0.05 + rng() * w * 0.9)
    const ly = beamY - 2 + Math.floor(rng() * 8)
    leaves.push({ x: lx, y: ly, phase: rng() * Math.PI * 2, bright: rng() })
  }

  const vines = []
  for (let i = 0; i < 12; i++) {
    const sx = Math.floor(w * 0.08 + rng() * w * 0.84)
    const dir = rng() < 0.5 ? -1 : 1
    const len = 6 + Math.floor(rng() * 18)
    const vy = beamY + Math.floor(rng() * 3)
    vines.push({ x: sx, dir, len, y: vy })
  }

  return { beamY, chains, petals, leaves, vines }
}

function drawSky(canvas) {
  const w = canvas.width
  const h = canvas.height
  for (let y = 0; y < h; y++) {
    const t = Math.min(1, y / h)
    const col = lerpMulti(SKY, t)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, col)
    }
  }
}

function drawGround(canvas) {
  const w = canvas.width
  const h = canvas.height
  const gy = Math.floor(h * 0.91)

  for (let y = gy; y < h; y++) {
    const t = (y - gy) / (h - gy)
    for (let x = 0; x < w; x++) {
      const moss = Math.sin(x * 0.15 + y * 0.4) * 0.5 + 0.5
      let bg, fg, ch
      if (moss > 0.65 && t < 0.4) {
        bg = lerpMulti(GROUND_MOSS, Math.min(1, t + 0.2))
        fg = lerpMulti(LEAF_GREEN, Math.min(1, moss * 0.4))
        ch = SHADE[0]
      } else {
        bg = lerpMulti(GROUND, Math.min(1, t * 0.6 + 0.3))
        fg = lerpMulti(GROUND, Math.min(1, t * 0.4 + 0.1))
        ch = t < 0.15 ? SHADE[1] : SHADE[0]
      }
      canvas.setCell(x, y, ch, fg, bg)
    }
  }
}

function drawTrellis(canvas, state) {
  const w = canvas.width
  const h = canvas.height
  const { beamY, vines } = state
  const pL = Math.floor(w * 0.04)
  const pR = Math.floor(w * 0.95)
  const groundY = Math.floor(h * 0.91)

  for (const px of [pL, pR]) {
    for (let y = 0; y < groundY && y < h; y++) {
      for (let dx = 0; dx < 2; dx++) {
        if (px + dx >= w) continue
        const grain = Math.sin(y * 0.18 + px * 0.12) * 0.2 + 0.5
        canvas.setCell(px + dx, y, BLOCK.full, lerpMulti(WOOD, Math.min(1, grain)), null)
      }
    }
  }

  for (let dy = 0; dy < 2; dy++) {
    const y = beamY + dy
    if (y >= h) continue
    for (let x = pL; x <= pR + 1 && x < w; x++) {
      const grain = Math.sin(x * 0.35 + dy) * 0.15 + 0.5
      canvas.setCell(x, y, BLOCK.full, lerpMulti(WOOD, Math.min(1, grain)), null)
    }
  }

  const beam2 = beamY + 4
  if (beam2 < h) {
    for (let x = pL; x <= pR + 1 && x < w; x++) {
      const grain = Math.sin(x * 0.3 + 1.5) * 0.15 + 0.45
      canvas.setCell(x, beam2, BLOCK.full, lerpMulti(WOOD, Math.min(1, grain)), null)
    }
  }

  const spacing = Math.floor((pR - pL) / 10)
  for (let i = 1; i < 10; i++) {
    const sx = pL + i * spacing
    if (sx >= w) continue
    for (let y = beamY + 2; y < beam2 && y < h; y++) {
      canvas.setCell(sx, y, '│', lerpMulti(WOOD, 0.3), null)
    }
  }

  for (const vine of vines) {
    for (let i = 0; i < vine.len; i++) {
      const vx = vine.x + vine.dir * i
      if (vx < pL || vx > pR || vx >= w) break
      const wobble = Math.sin(i * 0.6) * 0.4
      const vy = vine.y + Math.round(wobble)
      if (vy >= 0 && vy < h) {
        canvas.setCell(vx, vy, '─', lerpMulti(VINE_GREEN, Math.min(1, i / vine.len * 0.6 + 0.2)), null)
      }
    }
  }
}

function drawLeaves(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  for (const leaf of state.leaves) {
    const sway = Math.sin(elapsed * 0.35 + leaf.phase) * 0.6
    const lx = Math.round(leaf.x + sway)
    if (lx < 3 || lx >= w - 3 || leaf.y < 0 || leaf.y >= h) continue
    const brightness = Math.sin(elapsed * 0.25 + leaf.phase) * 0.25 + 0.5
    const col = lerpMulti(LEAF_GREEN, Math.min(1, brightness + leaf.bright * 0.3))
    canvas.setCell(lx, leaf.y, SHADE[1 + (leaf.bright > 0.5 ? 1 : 0)], col, null)
  }
}

function flowerColor(t, isPink, elapsed, phase) {
  const pulse = Math.sin(elapsed * 0.25 + phase) * 0.06
  const ct = Math.max(0, Math.min(1, t + pulse))

  if (isPink) return lerpMulti(FL_PINK, Math.min(1, ct))

  if (ct < 0.15) return lerpMulti(FL_DEEP, ct / 0.15)
  if (ct < 0.35) return lerpMulti(FL_RICH, (ct - 0.15) / 0.2)
  if (ct < 0.55) return lerpMulti(FL_MID, (ct - 0.35) / 0.2)
  if (ct < 0.78) return lerpMulti(FL_LIGHT, (ct - 0.55) / 0.23)
  return lerpMulti(FL_TIP, Math.min(1, (ct - 0.78) / 0.22))
}

function drawChains(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height

  for (const chain of state.chains) {
    const baseSway = Math.sin(elapsed * chain.swayFreq + chain.phase) * chain.swayAmp
    const secondSway = Math.sin(elapsed * chain.swayFreq * 1.6 + chain.phase + 2) * chain.swayAmp * 0.25
    const dimScale = chain.depth === 0 ? 0.45 : chain.depth === 1 ? 0.7 : 1.0
    const depthDarken = chain.depth === 0 ? 0.15 : chain.depth === 1 ? 0.07 : 0

    for (let dy = 0; dy < chain.length; dy++) {
      const t = dy / chain.length
      const py = chain.startY + dy
      if (py < 0 || py >= h) continue

      const pendulum = baseSway * (0.15 + t * 0.85) + secondSway * t * t
      const px = Math.round(chain.x + pendulum)
      if (px < 4 || px >= w - 4) continue

      let cw
      if (t < 0.08) cw = 1
      else if (t < 0.25) cw = Math.min(chain.maxWidth, 1 + Math.floor((t - 0.08) / 0.17 * chain.maxWidth))
      else if (t < 0.65) cw = chain.maxWidth
      else cw = Math.max(1, Math.round(chain.maxWidth * (1 - (t - 0.65) / 0.35)))

      const col = flowerColor(t, chain.isPink, elapsed, chain.phase + dy * 0.12)
      const rval = Math.abs(Math.sin(chain.seed + dy * 73.13 + px * 17.31))

      if (rval < chain.density || t < 0.06) {
        let ch
        if (t < 0.04) ch = '│'
        else if (t < 0.08) ch = SHADE[1]
        else if (t > 0.93) ch = '·'
        else if (t > 0.85) ch = SHADE[0]
        else if (rval < 0.2 * dimScale) ch = SHADE[3]
        else if (rval < 0.4 * dimScale) ch = SHADE[2]
        else ch = SHADE[1]

        canvas.setCell(px, py, ch, col, null)
      }

      for (let sx = 1; sx <= cw; sx++) {
        const fade = 1 - sx / (cw + 1)
        const sRval = Math.abs(Math.sin(chain.seed + dy * 41.3 + sx * 97.7))
        if (sRval > chain.density * fade || t < 0.06) continue

        const sCol = flowerColor(t + sx * 0.03, chain.isPink, elapsed, chain.phase + dy * 0.12 + sx)
        const sCh = fade > 0.55 ? SHADE[1] : SHADE[0]

        const left = px - sx
        const right = px + sx
        if (left >= 4) canvas.setCell(left, py, sCh, sCol, null)
        if (right < w - 4) canvas.setCell(right, py, sCh, sCol, null)
      }
    }
  }
}

function drawPetals(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height

  for (const petal of state.petals) {
    const py = (petal.y + elapsed * petal.speed * 3.5) % h
    const drift = Math.sin(elapsed * petal.driftFreq + petal.phase) * petal.driftAmp
    const px = ((petal.x + drift) % w + w) % w

    const ipx = Math.floor(px)
    const ipy = Math.floor(py)
    if (ipx < 4 || ipx >= w - 4 || ipy < 0 || ipy >= h) continue

    const col = lerpMulti(FL_LIGHT, Math.min(1, petal.colorT))
    canvas.setCell(ipx, ipy, '·', col, null)
  }
}

function drawLightRays(canvas, state, elapsed) {
  const w = canvas.width
  const h = canvas.height
  const groundY = Math.floor(h * 0.91)

  const rayCount = 5
  for (let i = 0; i < rayCount; i++) {
    const cx = Math.floor(w * 0.15 + (w * 0.7) * i / (rayCount - 1))
    const drift = Math.sin(elapsed * 0.1 + i * 1.8) * 3
    const rx = Math.round(cx + drift)

    for (let y = state.beamY + 6; y < groundY; y++) {
      const t = (y - state.beamY) / (groundY - state.beamY)
      const spread = Math.floor(t * 4) + 1
      const alpha = (0.06 + Math.sin(elapsed * 0.15 + i * 2.1) * 0.02) * (1 - t * 0.5)

      for (let dx = -spread; dx <= spread; dx++) {
        const px = rx + dx
        if (px < 4 || px >= w - 4 || y >= h) continue
        const edgeFade = 1 - Math.abs(dx) / (spread + 1)
        const strength = alpha * edgeFade
        if (strength < 0.01) continue

        const cell = canvas.getCell(px, y)
        if (cell && cell.bg) {
          const warmTint = lerp(cell.bg, '#ffe8c0', strength)
          canvas.setCell(px, y, cell.char, cell.fg, warmTint)
        }
      }
    }
  }
}

function drawScene(canvas, state, elapsed) {
  drawSky(canvas)
  drawGround(canvas)
  drawLightRays(canvas, state, elapsed)
  drawTrellis(canvas, state)
  drawLeaves(canvas, state, elapsed)
  drawChains(canvas, state, elapsed)
  drawPetals(canvas, state, elapsed)
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
