import { lerpMulti, lerp, BLOCK } from '../src/theme.js'

export const title = 'Moth & Lantern'
export const description = 'They spiral closer, tracing the oldest orbit — a light they cannot leave, a warmth they cannot hold'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function hex2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

const NIGHT = ['#020306', '#040810', '#060c18', '#080e1c', '#0a1020', '#0c1224']
const GLOW = ['#fff0d0', '#ffdd88', '#ffbb44', '#dd8811', '#884400', '#442200', '#221100', '#110800', '#080400']

export function setup(canvas) {
  const rng = srand(814)

  const moths = []
  for (let i = 0; i < 8; i++) {
    moths.push({
      angle: rng() * Math.PI * 2,
      baseRadius: 6 + rng() * 18,
      speed: (0.25 + rng() * 0.5) * (rng() > 0.5 ? 1 : -1),
      radOsc: 2 + rng() * 4,
      radFreq: 0.3 + rng() * 0.6,
      yOff: (rng() - 0.5) * 8,
      yOsc: 1 + rng() * 3,
      yFreq: 0.2 + rng() * 0.4,
      wingPh: rng() * Math.PI * 2,
      large: rng() > 0.4,
    })
  }

  const motes = []
  for (let i = 0; i < 60; i++) {
    motes.push({
      angle: rng() * Math.PI * 2,
      dist: 3 + rng() * 35,
      drift: (rng() - 0.5) * 0.02,
      floatSpd: 0.01 + rng() * 0.03,
      floatPh: rng() * Math.PI * 2,
      bri: 0.2 + rng() * 0.8,
    })
  }

  return { moths, motes }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  for (const moth of state.moths) {
    moth.angle += moth.speed * frame.dt
  }
  for (const m of state.motes) {
    m.angle += m.drift
    m.floatPh += m.floatSpd
  }
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h * 0.32)

  drawSky(canvas, w, h, cx, cy, t)
  drawLightRays(canvas, w, h, cx, cy, t)
  drawMotes(canvas, w, h, cx, cy, state.motes, t)
  drawLantern(canvas, w, h, cx, cy, t)
  drawMoths(canvas, w, h, cx, cy, state.moths, t)
}

function drawSky(canvas, w, h, cx, cy, t) {
  const glowR = Math.max(w, h) * 0.5
  const flicker = 1 + Math.sin(t * 2.3) * 0.03 + Math.sin(t * 3.7) * 0.02

  for (let y = 0; y < h; y++) {
    const skyT = Math.min(1, y / h)
    const skyBase = lerpMulti(NIGHT, skyT)

    for (let x = 0; x < w; x++) {
      const dx = (x - cx) * 1.0
      const dy = (y - cy) * 1.8
      const dist = Math.sqrt(dx * dx + dy * dy)
      const nD = dist / glowR

      if (nD < 1.0) {
        const glowT = nD * nD
        const warmth = (1 - glowT) * flicker
        const glowColor = lerpMulti(GLOW, glowT)
        const blended = lerp(glowColor, skyBase, glowT * 0.7 + 0.3)
        canvas.setCell(x, y, ' ', null, blended)
      } else {
        canvas.setCell(x, y, ' ', null, skyBase)
      }
    }
  }
}

function drawLantern(canvas, w, h, cx, cy, t) {
  const flicker = 1 + Math.sin(t * 3.1) * 0.04 + Math.sin(t * 5.7) * 0.03

  for (let dy = -3; dy > -8; dy--) {
    const py = cy + dy
    if (py >= 0 && py < h) {
      const fade = (-dy - 3) / 5
      const cordColor = lerp('#665533', '#332211', fade)
      canvas.setCell(cx, py, '│', cordColor)
    }
  }

  const lanternH = 10
  const ly = cy - Math.floor(lanternH / 2)

  for (let dy = 0; dy < lanternH; dy++) {
    const py = ly + dy
    if (py < 0 || py >= h) continue

    const yNorm = dy / (lanternH - 1)
    const bulge = Math.sin(yNorm * Math.PI)
    const halfW = Math.floor(2 + bulge * 4)

    for (let dx = -halfW; dx <= halfW; dx++) {
      const px = cx + dx
      if (px < 0 || px >= w) continue

      const xNorm = Math.abs(dx) / (halfW + 0.001)

      if (Math.abs(dx) === halfW) {
        const frameC = lerp('#8b5a2b', '#5c3a1a', yNorm)
        canvas.setCell(px, py, '│', frameC)
      } else if (dy === 0 || dy === lanternH - 1) {
        const capC = lerp('#8b5a2b', '#6b4a2b', xNorm)
        canvas.setCell(px, py, '─', capC)
      } else {
        const center = 1 - xNorm
        const warmV = Math.floor((180 + center * 75) * flicker)
        const gv = Math.floor(warmV * 0.7)
        const bv = Math.floor(warmV * 0.3)
        const panelC = '#' + hex2(warmV) + hex2(gv) + hex2(bv)
        canvas.setCell(px, py, ' ', null, panelC)

        if (dy === 3 || dy === 6) {
          const ribC = lerp('#8b5a2b', panelC, 0.5)
          canvas.setCell(px, py, '─', ribC, panelC)
        }
      }
    }

    if (dy === 0) {
      const tlx = cx - halfW
      const trx = cx + halfW
      if (tlx >= 0 && tlx < w) canvas.setCell(tlx, py, '╭', '#8b5a2b')
      if (trx >= 0 && trx < w) canvas.setCell(trx, py, '╮', '#8b5a2b')
    } else if (dy === lanternH - 1) {
      const blx = cx - halfW
      const brx = cx + halfW
      if (blx >= 0 && blx < w) canvas.setCell(blx, py, '╰', '#8b5a2b')
      if (brx >= 0 && brx < w) canvas.setCell(brx, py, '╯', '#8b5a2b')
    }
  }

  const tasselY = ly + lanternH
  if (tasselY < h) canvas.setCell(cx, tasselY, '│', '#8b5a2b')
  if (tasselY + 1 < h) canvas.setCell(cx, tasselY + 1, '◆', '#cc4422')
  if (tasselY + 2 < h) canvas.setCell(cx, tasselY + 2, ':', '#993322')
}

function drawLightRays(canvas, w, h, cx, cy, t) {
  const numRays = 12
  const maxLen = Math.floor(Math.min(w, h) * 0.35)

  for (let i = 0; i < numRays; i++) {
    const baseAngle = (i / numRays) * Math.PI * 2
    const angle = baseAngle + Math.sin(t * 0.08 + i * 1.3) * 0.06
    const rayLen = maxLen * (0.6 + Math.sin(t * 0.15 + i * 0.8) * 0.15)

    for (let r = 8; r < rayLen; r++) {
      const rx = cx + Math.cos(angle) * r
      const ry = cy + Math.sin(angle) * r * 0.55
      const ix = Math.floor(rx)
      const iy = Math.floor(ry)
      if (ix < 0 || ix >= w || iy < 0 || iy >= h) continue

      const falloff = 1 - (r - 8) / (rayLen - 8)
      const intensity = falloff * falloff * 0.06
      if (intensity < 0.003) continue

      const cell = canvas.getCell(ix, iy)
      if (cell && cell.bg) {
        canvas.setCell(ix, iy, ' ', null, lerp(cell.bg, '#ffcc66', intensity))
      }
    }
  }
}

function drawMotes(canvas, w, h, cx, cy, motes, t) {
  for (const m of motes) {
    const dist = m.dist + Math.sin(m.floatPh) * 3
    const mx = cx + Math.cos(m.angle) * dist
    const my = cy + Math.sin(m.angle) * dist * 0.55 + Math.sin(m.floatPh * 1.7) * 2
    const ix = Math.floor(mx)
    const iy = Math.floor(my)
    if (ix < 4 || ix >= w - 4 || iy < 4 || iy >= h - 5) continue

    const screenDist = Math.sqrt((ix - cx) * (ix - cx) + (iy - cy) * (iy - cy) * 3)
    const maxGlow = Math.max(w, h) * 0.45
    if (screenDist > maxGlow) continue

    const proximity = 1 - screenDist / maxGlow
    const bri = m.bri * proximity * (0.7 + Math.sin(t * 0.5 + m.floatPh) * 0.3)
    if (bri < 0.08) continue

    const v = Math.min(255, Math.floor(120 + bri * 135))
    const col = '#' + hex2(v) + hex2(Math.floor(v * 0.82)) + hex2(Math.floor(v * 0.45))
    const ch = bri > 0.4 ? '·' : '.'
    canvas.setCell(ix, iy, ch, col)
  }
}

function drawMoths(canvas, w, h, cx, cy, moths, t) {
  for (const moth of moths) {
    const r = moth.baseRadius + Math.sin(t * moth.radFreq + moth.angle * 0.5) * moth.radOsc
    const mx = cx + Math.cos(moth.angle) * r
    const my = cy + Math.sin(moth.angle) * r * 0.55 + moth.yOff +
               Math.sin(t * moth.yFreq + moth.angle) * moth.yOsc
    const ix = Math.floor(mx)
    const iy = Math.floor(my)
    if (ix < 2 || ix >= w - 2 || iy < 1 || iy >= h - 1) continue

    const screenDist = Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy) * 2)
    const brightness = Math.max(0.2, 1 - screenDist / 40)
    const bodyColor = '#' + hex2(Math.floor(200 * brightness)) +
                             hex2(Math.floor(170 * brightness)) +
                             hex2(Math.floor(120 * brightness))

    const wingFlap = Math.sin(t * 6 + moth.wingPh)

    if (moth.large) {
      const moving = Math.abs(moth.speed) > 0.3
      let lw, rw
      if (wingFlap > 0.3) {
        lw = moving ? '╲' : '⟨'
        rw = moving ? '╱' : '⟩'
      } else if (wingFlap > -0.3) {
        lw = '─'
        rw = '─'
      } else {
        lw = moving ? '╱' : '⟨'
        rw = moving ? '╲' : '⟩'
      }

      const wingColor = lerp(bodyColor, '#442200', 0.3)
      if (ix - 1 >= 0) canvas.setCell(ix - 1, iy, lw, wingColor)
      canvas.setCell(ix, iy, '●', bodyColor)
      if (ix + 1 < w) canvas.setCell(ix + 1, iy, rw, wingColor)

      const antennaY = iy - 1
      if (antennaY >= 0) {
        const dir = Math.cos(moth.angle) > 0 ? 1 : -1
        if (ix + dir >= 0 && ix + dir < w) {
          canvas.setCell(ix + dir, antennaY, '\'', lerp(bodyColor, '#000000', 0.5))
        }
      }
    } else {
      const ch = wingFlap > 0 ? '~' : '-'
      canvas.setCell(ix, iy, ch, bodyColor)
    }
  }
}
