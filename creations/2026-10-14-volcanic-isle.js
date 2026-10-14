import { hex, bgHex, SHADE } from '../src/theme.js'

export const title = 'Volcanic Isle'
export const description = 'The earth exhales into the Pacific dark — lava traces bright veins down basalt to the waiting sea'
export const fps = 3

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + clamp(r).toString(16).padStart(2, '0') +
               clamp(g).toString(16).padStart(2, '0') +
               clamp(b).toString(16).padStart(2, '0')
}

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  return (hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx) * (1 - sy) +
         (hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx) * sy
}

function fbm(x, y, oct) {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < oct; i++) { v += smoothNoise(x * f, y * f) * a; a *= 0.5; f *= 2 }
  return v
}

function mkEmber(rng, cx, peakY, W) {
  return {
    x: cx + (rng() - 0.5) * W * 0.07,
    y: peakY - rng() * 2,
    vx: (rng() - 0.5) * 0.45,
    vy: -(0.35 + rng() * 0.55),
    life: 0.8 + rng() * 0.2,
    phase: rng() * TAU,
  }
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(1014)

  const cx = Math.floor(W * 0.48)
  const peakY = Math.floor(H * 0.24)
  const baseY = Math.floor(H * 0.60)
  const halfW = Math.floor(W * 0.36)

  const profile = new Float32Array(W)
  for (let x = 0; x < W; x++) {
    const dx = Math.abs(x - cx)
    if (dx >= halfW) { profile[x] = baseY; continue }
    const t = dx / halfW
    const noise = (fbm(x * 0.06 + 100, 0, 3) - 0.5) * 2
    profile[x] = peakY + (baseY - peakY) * Math.pow(t, 1.15) + noise
  }

  const lavaMap = new Float32Array(W * H)
  const numFlows = 10 + Math.floor(rng() * 4)
  for (let fi = 0; fi < numFlows; fi++) {
    let fx = cx + (rng() - 0.5) * halfW * 0.12
    let fy = peakY + 1 + rng() * 2
    const side = fx > cx ? 1 : -1
    const driftBase = side * (0.15 + rng() * 0.35)
    const brightness = 0.4 + rng() * 0.6

    while (fy < baseY - 1 && Math.abs(fx - cx) < halfW * 0.92) {
      const ix = Math.floor(Math.max(0, Math.min(W - 1, fx)))
      const iy = Math.floor(fy)
      if (iy >= Math.floor(profile[ix]) - 1 && iy < H) {
        const heightT = Math.max(0, (iy - peakY) / Math.max(1, baseY - peakY))
        const pointBr = brightness * Math.pow(1 - heightT, 0.45)
        const width = Math.max(1, Math.floor((1 - heightT) * 2 + 0.5))
        for (let dy = 0; dy <= 1; dy++) {
          for (let dx = -width; dx <= width; dx++) {
            const px = ix + dx, py = iy + dy
            if (px < 0 || px >= W || py < 0 || py >= H) continue
            if (py < Math.floor(profile[px])) continue
            const falloff = Math.pow(1 - Math.abs(dx) / (width + 0.5), 1.2)
            lavaMap[py * W + px] = Math.max(lavaMap[py * W + px], pointBr * falloff)
          }
        }
      }
      fy += 0.6 + rng() * 0.4
      fx += driftBase + (rng() - 0.5) * 0.4

      if (rng() < 0.04) {
        let bx = fx, by = fy
        const bDrift = driftBase * (0.5 + rng() * 0.8) + (rng() - 0.5) * 0.3
        const bBr = brightness * 0.45
        for (let bs = 0; bs < 15 && by < baseY - 1; bs++) {
          const bix = Math.floor(Math.max(0, Math.min(W - 1, bx)))
          const biy = Math.floor(by)
          if (biy >= Math.floor(profile[bix]) - 1 && biy < H) {
            const ht = Math.max(0, (biy - peakY) / Math.max(1, baseY - peakY))
            const pbr = bBr * Math.pow(1 - ht, 0.5)
            for (let dx = -1; dx <= 1; dx++) {
              const px = bix + dx
              if (px < 0 || px >= W) continue
              if (biy < Math.floor(profile[px])) continue
              lavaMap[biy * W + px] = Math.max(lavaMap[biy * W + px], pbr * (1 - Math.abs(dx) / 1.5))
            }
          }
          by += 0.6 + rng() * 0.3
          bx += bDrift + (rng() - 0.5) * 0.4
          if (Math.abs(bx - cx) >= halfW * 0.9) break
        }
      }
    }
  }

  const stars = []
  for (let i = 0; i < 85; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * Math.min(H, baseY + 3)),
      br: 0.25 + rng() * 0.75,
      phase: rng() * TAU,
      freq: 0.3 + rng() * 1.5,
    })
  }

  const embers = []
  for (let i = 0; i < 18; i++) embers.push(mkEmber(rng, cx, peakY, W))

  const bufR = new Float32Array(W * H)
  const bufG = new Float32Array(W * H)
  const bufB = new Float32Array(W * H)

  return { W, H, cx, peakY, baseY, halfW, profile, lavaMap, stars, embers, rng, bufR, bufG, bufB }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  const { cx, peakY, W, embers, rng } = state
  for (const e of embers) {
    e.x += e.vx + Math.sin(e.phase + frame.elapsed * 2) * 0.1
    e.y += e.vy
    e.life -= 0.014
    if (e.life <= 0 || e.y < -2 || e.x < 0 || e.x >= W) {
      Object.assign(e, mkEmber(rng, cx, peakY, W))
    }
  }
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const { W, H, cx, peakY, baseY, halfW, profile, lavaMap, stars, embers,
          bufR, bufG, bufB } = state

  bufR.fill(0); bufG.fill(0); bufB.fill(0)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      if (y < baseY) {
        const yf = y / baseY
        const hGlow = Math.pow(yf, 5) * 0.18
        bufR[idx] = 3 + hGlow * 28
        bufG[idx] = 3 + hGlow * 10
        bufB[idx] = 12 + yf * 4 + hGlow * 3
      } else {
        const depth = (y - baseY) / Math.max(1, H - baseY)
        const wave = Math.sin(x * 0.06 + y * 0.15 + t * 0.35) * 0.35 + 0.65
        bufR[idx] = 2 + (1 - depth) * 3 * wave
        bufG[idx] = 5 + (1 - depth) * 8 * wave
        bufB[idx] = 14 + (1 - depth) * 10 * wave
      }
    }
  }

  for (let x = 0; x < W; x++) {
    const top = Math.floor(profile[x])
    if (top >= baseY) continue
    for (let y = Math.max(0, top); y < baseY && y < H; y++) {
      const idx = y * W + x
      const tex = hash(x * 0.7, y * 0.5) * 0.22
      bufR[idx] = 7 + tex * 10
      bufG[idx] = 5 + tex * 6
      bufB[idx] = 3 + tex * 4
    }
  }

  const pulse = 0.72 + 0.28 * Math.sin(t * 1.4)
  const crW = Math.max(3, halfW * 0.1)
  for (let y = Math.max(0, peakY - 3); y <= Math.min(H - 1, peakY + 4); y++) {
    for (let x = Math.max(0, cx - Math.floor(crW * 2.8)); x <= Math.min(W - 1, cx + Math.floor(crW * 2.8)); x++) {
      const dx = (x - cx) / (crW * 2.8)
      const dy = (y - (peakY + 0.5)) / (crW * 1.1)
      const dist = dx * dx + dy * dy
      if (dist > 1) continue
      const intensity = Math.pow(1 - Math.sqrt(dist), 1.6) * pulse
      const idx = y * W + x
      bufR[idx] = Math.max(bufR[idx], 255 * intensity)
      bufG[idx] = Math.max(bufG[idx], 110 * intensity * 0.8)
      bufB[idx] = Math.max(bufB[idx], 18 * intensity * 0.3)
    }
  }

  for (let y = Math.max(0, peakY - 22); y < peakY; y++) {
    const dy = (peakY - y) / 22
    const spread = 1.5 + dy * 11
    for (let x = Math.max(0, cx - Math.floor(spread) - 1); x <= Math.min(W - 1, cx + Math.floor(spread) + 1); x++) {
      const dxNorm = Math.abs(x - cx) / spread
      if (dxNorm > 1) continue
      const intensity = Math.pow(1 - dy, 3.5) * Math.pow(1 - dxNorm, 2.2) * 0.16 * pulse
      const idx = y * W + x
      bufR[idx] += 185 * intensity
      bufG[idx] += 48 * intensity
      bufB[idx] += 5 * intensity
    }
  }

  const flowPulse = 0.65 + 0.35 * Math.sin(t * 0.85)
  for (let y = Math.max(0, peakY); y < baseY && y < H; y++) {
    for (let x = Math.max(0, cx - halfW); x <= Math.min(W - 1, cx + halfW); x++) {
      const lava = lavaMap[y * W + x]
      if (lava <= 0) continue
      const heat = lava * flowPulse
      const shift = Math.sin(t * 1.1 + x * 0.07 + y * 0.05) * 0.08
      const idx = y * W + x
      bufR[idx] += (215 + shift * 40) * heat * 0.6
      bufG[idx] += (78 + shift * 12) * heat * 0.42
      bufB[idx] += 7 * heat * 0.15
    }
  }

  const refDepth = Math.min(30, H - baseY)
  for (let y = baseY; y < baseY + refDepth && y < H; y++) {
    const mirrorY = 2 * baseY - y
    if (mirrorY < 0 || mirrorY >= baseY) continue
    const fade = Math.pow(1 - (y - baseY) / refDepth, 1.8) * 0.13
    const waveOff = Math.floor(Math.sin(t * 0.25 + y * 0.35) * 1.5)
    for (let x = 0; x < W; x++) {
      const sx = Math.min(W - 1, Math.max(0, x + waveOff))
      const srcIdx = mirrorY * W + sx
      const srcR = bufR[srcIdx], srcG = bufG[srcIdx], srcB = bufB[srcIdx]
      if (srcR + srcG + srcB < 35) continue
      const idx = y * W + x
      bufR[idx] += srcR * fade
      bufG[idx] += srcG * fade
      bufB[idx] += srcB * fade
    }
  }

  for (const s of stars) {
    if (s.x < 0 || s.x >= W || s.y < 0 || s.y >= H) continue
    const px = Math.min(W - 1, Math.max(0, s.x))
    if (s.y >= Math.floor(profile[px]) || s.y >= baseY) continue
    const twinkle = 0.45 + 0.55 * Math.sin(t * s.freq + s.phase)
    const br = s.br * twinkle
    const idx = s.y * W + s.x
    bufR[idx] += 170 * br
    bufG[idx] += 185 * br
    bufB[idx] += 255 * br
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x
      const r = bufR[idx], g = bufG[idx], b = bufB[idx]
      const lum = (r + g + b) / 765

      if (lum > 0.035) {
        let ch
        if (lum > 0.40) ch = SHADE[3]
        else if (lum > 0.18) ch = SHADE[2]
        else if (lum > 0.08) ch = SHADE[1]
        else ch = SHADE[0]
        canvas.setCell(x, y, ch,
          hex(c2h(r * 1.2 + 4, g * 1.2 + 4, b * 1.2 + 4)),
          bgHex(c2h(r * 0.32, g * 0.32, b * 0.32))
        )
      } else {
        canvas.setCell(x, y, ' ', null, bgHex(c2h(r, g, b)))
      }
    }
  }

  for (const e of embers) {
    const ex = Math.floor(e.x), ey = Math.floor(e.y)
    if (ex < 1 || ex >= W - 1 || ey < 1 || ey >= H - 4) continue
    if (e.life < 0.12) continue
    canvas.setCell(ex, ey, e.life > 0.5 ? '◦' : '·',
      hex(c2h(255 * e.life, 155 * e.life, 25 * e.life))
    )
  }
}
