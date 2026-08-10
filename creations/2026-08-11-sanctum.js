import { lerpMulti, lerp } from '../src/theme.js'

export const title = 'Sanctum'
export const description = 'Morning light finds its way through ancient glass, painting silence in color'
export const fps = 2

const ASPECT = 1.8
const TWO_PI = Math.PI * 2

const STONE = ['#0e0c09', '#110f0c', '#14120f', '#171512', '#1a1815', '#1d1b18']
const JEWELS = [
  '#9b1b30', '#2a4494', '#1d6b35', '#c86a10',
  '#6b2fa0', '#0e6793', '#9b1b30', '#1e3a7a',
  '#1d6b35', '#b85a10', '#5a1f90', '#0a5580',
]

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function hex2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

export function setup(canvas) {
  const rng = srand(811)
  const motes = []
  for (let i = 0; i < 100; i++) {
    motes.push({
      x: 0.2 + rng() * 0.6,
      y: rng(),
      driftPh: rng() * TWO_PI,
      driftSpd: 0.15 + rng() * 0.4,
      driftAmp: 0.003 + rng() * 0.008,
      fallSpd: 0.004 + rng() * 0.012,
      bri: 0.15 + rng() * 0.85,
      ph: rng() * TWO_PI,
    })
  }
  return { motes }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w / 2)
  const wCy = Math.floor(h * 0.28)
  const wR = Math.min(Math.floor(w * 0.30), Math.floor(h * 0.24))

  drawBackground(canvas, w, h)
  drawColumns(canvas, w, h)
  drawArchWall(canvas, w, h, cx, wCy, wR)
  drawRoseWindow(canvas, w, h, cx, wCy, wR, t)
  drawLightBeams(canvas, w, h, cx, wCy, wR, t)
  drawMotes(canvas, w, h, cx, wCy, wR, state, t)
  drawFloor(canvas, w, h, cx, t)
}

function drawBackground(canvas, w, h) {
  for (let y = 0; y < h; y++) {
    const bg = lerpMulti(STONE, Math.min(1, y / h))
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, bg)
    }
  }
}

function drawColumns(canvas, w, h) {
  const specs = [
    [0.07, 0.93, 5, 0.05],
    [0.17, 0.83, 4, 0.12],
  ]
  for (const [lF, rF, cW, topF] of specs) {
    const topY = Math.floor(h * topF)
    const positions = [Math.floor(w * lF), Math.floor(w * rF) - cW]
    for (const sx of positions) {
      for (let y = topY; y < h; y++) {
        for (let dx = 0; dx < cW; dx++) {
          const px = sx + dx
          if (px < 0 || px >= w) continue
          const edge = Math.abs(dx - (cW - 1) / 2) / ((cW - 1) / 2 + 0.001)
          canvas.setCell(px, y, ' ', null, lerp('#201e1a', '#0e0c09', edge * 0.6))
        }
        if (y === topY) {
          for (let dx = -1; dx <= cW; dx++) {
            const px = sx + dx
            if (px >= 0 && px < w) canvas.setCell(px, y, ' ', null, '#2a2720')
          }
        }
      }
    }
  }
}

function drawArchWall(canvas, w, h, cx, wCy, wR) {
  const leftEdge = Math.floor(w * 0.17) + 5
  const rightEdge = Math.floor(w * 0.83) - 5
  const wallTop = Math.floor(h * 0.05)
  const wallBot = Math.floor(h * 0.50)
  const apexY = Math.max(wallTop, wCy - Math.ceil(wR / ASPECT) - 10)
  const archHalfW = wR + 4
  const springY = wCy - Math.floor(wR / ASPECT * 0.3)

  for (let y = wallTop; y < wallBot && y < h; y++) {
    let archLeft = leftEdge
    let archRight = rightEdge

    if (y < springY) {
      const prog = Math.max(0, (springY - y) / Math.max(1, springY - apexY))
      const curveW = Math.floor(archHalfW * (1 - Math.pow(Math.min(1, prog), 0.55)))
      archLeft = Math.max(leftEdge, cx - curveW)
      archRight = Math.min(rightEdge, cx + curveW)
    }

    for (let x = leftEdge; x < rightEdge; x++) {
      if (x < archLeft || x > archRight) continue
      const dx = x - cx
      const dy = y - wCy
      const dist = Math.sqrt(dx * dx + (dy * ASPECT) * (dy * ASPECT))
      if (dist / wR < 1.02) continue
      canvas.setCell(x, y, ' ', null, '#151310')
    }
  }
}

function drawRoseWindow(canvas, w, h, cx, cy, R, t) {
  const extX = R + 1
  const extY = Math.ceil(R / ASPECT) + 1
  const SEG = 12

  for (let dy = -extY; dy <= extY; dy++) {
    for (let dx = -extX; dx <= extX; dx++) {
      const px = cx + dx
      const py = cy + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue

      const dist = Math.sqrt(dx * dx + (dy * ASPECT) * (dy * ASPECT))
      const nD = dist / R
      if (nD > 1.0) continue

      const ang = ((Math.atan2(dy * ASPECT, dx) + TWO_PI) % TWO_PI)
      let color

      if (nD > 0.90) {
        color = lerp('#2e2b24', '#3a3730', (nD - 0.90) / 0.10)
      } else if (nD > 0.76) {
        const si = Math.floor(ang / TWO_PI * SEG * 2) % (SEG * 2)
        const sa = (ang % (Math.PI / SEG)) / (Math.PI / SEG)
        if (sa < 0.08 || sa > 0.92 || nD < 0.78 || nD > 0.88) {
          color = '#131210'
        } else {
          const base = JEWELS[si % 12]
          color = lerp(base, '#ffffff', 0.12 + Math.sin(t * 0.2 + si * 0.52) * 0.06)
        }
      } else if (nD > 0.28) {
        const si = Math.floor(ang / TWO_PI * SEG) % SEG
        const sa = (ang % (TWO_PI / SEG)) / (TWO_PI / SEG)
        if (sa < 0.04 || sa > 0.96) {
          color = '#131210'
        } else if (Math.abs(nD - 0.52) < 0.013) {
          color = '#131210'
        } else {
          const base = JEWELS[si]
          const depth = (nD - 0.28) / 0.48
          const centering = 1 - Math.abs(sa - 0.5) * 2
          const pulse = Math.sin(t * 0.15 + si * (TWO_PI / SEG) + nD * 3) * 0.07
          color = lerp(base, '#ffffff', 0.12 + pulse + centering * 0.06 - depth * 0.06)
          color = lerp(color, '#000000', depth * 0.08)
        }
      } else if (nD > 0.12) {
        const si = Math.floor(ang / TWO_PI * SEG) % SEG
        const sa = (ang % (TWO_PI / SEG)) / (TWO_PI / SEG)
        if (sa < 0.09 || sa > 0.91) {
          color = '#131210'
        } else {
          color = lerp(JEWELS[(si + 6) % 12], '#ffffff', 0.20 + Math.sin(t * 0.25 + si) * 0.07)
        }
      } else {
        color = lerp('#a88520', '#d4aa30', 0.5 + Math.sin(t * 0.3 + ang * 4) * 0.1)
      }

      canvas.setCell(px, py, ' ', null, color)
    }
  }
}

function drawLightBeams(canvas, w, h, cx, wCy, wR, t) {
  const beamTop = wCy + Math.ceil(wR / ASPECT) + 3
  const beamBot = Math.floor(h * 0.88)
  if (beamTop >= beamBot) return

  const sway = Math.sin(t * 0.06) * 0.02
  const beams = [
    [-0.16, '#9b1b30'], [-0.055, '#2a4494'],
    [0.055, '#1d6b35'], [0.16, '#c86a10'],
  ]

  for (const [off, col] of beams) {
    const angle = off + sway
    for (let y = beamTop; y < beamBot && y < h; y++) {
      const prog = (y - beamTop) / (beamBot - beamTop)
      const bx = cx + Math.round((y - wCy) * angle)
      const halfW = Math.floor(2 + prog * 12)

      for (let dx = -halfW; dx <= halfW; dx++) {
        const px = bx + dx
        if (px < 0 || px >= w) continue
        const edge = 1 - Math.abs(dx) / halfW
        const intensity = edge * edge * (1 - prog * 0.35) * 0.09
        if (intensity > 0.004) {
          const cell = canvas.getCell(px, y)
          if (cell && cell.bg)
            canvas.setCell(px, y, ' ', null, lerp(cell.bg, col, intensity))
        }
      }
    }
  }

  for (let y = beamTop; y < beamBot && y < h; y++) {
    const prog = (y - beamTop) / (beamBot - beamTop)
    const halfW = Math.floor(5 + prog * 16)
    for (let dx = -halfW; dx <= halfW; dx++) {
      const px = cx + dx + Math.floor(sway * (y - wCy))
      if (px < 0 || px >= w) continue
      const edge = 1 - Math.pow(Math.abs(dx) / halfW, 1.5)
      const intensity = edge * (1 - prog * 0.5) * 0.035
      if (intensity > 0.002) {
        const cell = canvas.getCell(px, y)
        if (cell && cell.bg)
          canvas.setCell(px, y, ' ', null, lerp(cell.bg, '#c8a840', intensity))
      }
    }
  }
}

function drawMotes(canvas, w, h, cx, wCy, wR, state, t) {
  const moteTop = wCy + Math.ceil(wR / ASPECT) + 3
  const moteH = h * 0.55

  for (const m of state.motes) {
    const mx = Math.floor(m.x * w + Math.sin(t * m.driftSpd + m.driftPh) * m.driftAmp * w)
    const my = Math.floor(moteTop + ((m.y + m.fallSpd * t) % 1.0) * moteH)
    if (mx < 4 || mx >= w - 4 || my < 3 || my >= h - 5) continue

    const beamDist = Math.abs(mx - cx) / (w * 0.22)
    if (beamDist > 1.5) continue

    const inBeam = Math.max(0, 1 - beamDist)
    const bri = m.bri * inBeam * (Math.sin(t * 0.6 + m.ph) * 0.3 + 0.7)
    if (bri > 0.12) {
      const v = Math.min(255, Math.floor(70 + bri * 185))
      const col = '#' + hex2(v) + hex2(Math.floor(v * 0.87)) + hex2(Math.floor(v * 0.58))
      canvas.setCell(mx, my, bri > 0.45 ? '·' : '.', col)
    }
  }
}

function drawFloor(canvas, w, h, cx, t) {
  const floorY = Math.floor(h * 0.82)
  const projColors = ['#2a0808', '#08082a', '#081a08', '#2a1408', '#180828']

  for (let y = floorY; y < h - 4 && y < h; y++) {
    const fT = (y - floorY) / Math.max(1, h - 4 - floorY)
    for (let x = 0; x < w; x++) {
      const rx = (x - cx) / (w * 0.22)
      const ry = (fT - 0.5) * 3.5
      const d = Math.sqrt(rx * rx + ry * ry)
      if (d < 1.3) {
        const ang = ((Math.atan2(ry, rx) + TWO_PI + t * 0.012) % TWO_PI)
        const sec = Math.floor(ang / TWO_PI * 6) % projColors.length
        const fade = Math.max(0, 1 - d / 1.3) * 0.15
        const cell = canvas.getCell(x, y)
        if (cell && cell.bg)
          canvas.setCell(x, y, ' ', null, lerp(cell.bg, projColors[sec], fade))
      }
    }
  }

  for (let y = Math.max(0, Math.floor(h * 0.86)); y < h; y++) {
    const rowT = Math.min(1, (y - h * 0.86) / (h * 0.14))
    for (let x = 0; x < w; x++) {
      const ts = Math.max(3, Math.floor(4 + rowT * 2))
      const tileH = Math.max(1, Math.floor(ts * 0.55))
      const light = (Math.floor(x / ts) + Math.floor(Math.max(0, y - h * 0.86) / tileH)) % 2 === 0
      const tile = light ? '#1c1a16' : '#131210'
      const cell = canvas.getCell(x, y)
      if (cell && cell.bg) {
        canvas.setCell(x, y, ' ', null, lerp(cell.bg, tile, 0.55))
      }
    }
  }
}
