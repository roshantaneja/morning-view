import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'NGC 801'
export const description = 'A spiral galaxy turns through two hundred billion silent suns'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const SPACE = ['#01010c', '#020210', '#030316']

const CORE = [
  '#fff8f0', '#ffedcc', '#ffd890', '#ffbe55',
  '#f09825', '#c06818', '#884010', '#502808', '#301408',
]

const ARM_BLUE = ['#a0b8e8', '#8098d8', '#6078c0', '#4058a8', '#2840a0']
const ARM_BRIGHT = ['#d0d8f0', '#b8c0e8', '#a0a8d8']
const DISK = ['#3c2818', '#2c1c10', '#1c1008', '#100806', '#080404']
const HII = ['#d080c0', '#b060a0', '#904080', '#703060']
const HALO = ['#160c22', '#100818', '#0a0610', '#06040a', '#040306']

const TWO_PI = Math.PI * 2

export function setup(canvas) {
  const rng = srand(801)
  const w = canvas.width
  const h = canvas.height

  const stars = []
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * h),
      b: 0.15 + rng() * 0.85,
      phase: rng() * TWO_PI,
      speed: 0.15 + rng() * 1.0,
    })
  }

  const gcx = Math.floor(w * 0.5)
  const gcy = Math.floor(h * 0.43)
  const bright = []
  for (let i = 0; i < 5; i++) {
    let sx, sy
    do {
      sx = 5 + Math.floor(rng() * (w - 10))
      sy = 5 + Math.floor(rng() * (h - 10))
    } while (Math.abs(sx - gcx) < w * 0.2 && Math.abs(sy - gcy) < h * 0.12)
    bright.push({
      x: sx, y: sy,
      phase: rng() * TWO_PI,
      col: rng() < 0.3 ? '#ffffff' : rng() < 0.5 ? '#b0c8ff' : '#ffe0c0',
    })
  }

  const noise = new Array(w * h)
  for (let i = 0; i < noise.length; i++) noise[i] = rng()

  return { stars, bright, noise }
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height
  const cx = Math.floor(w * 0.5)
  const cy = Math.floor(h * 0.43)

  const rot = t * 0.02
  const gR = Math.floor(Math.min(w, h) * 0.44)
  const tiltY = 3.0
  const spiralK = 2.5
  const armSigma = 0.38
  const nArms = 2

  for (let y = 0; y < h; y++) {
    const bg = lerpMulti(SPACE, Math.min(1, y / h * 0.5))
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, bg)
  }

  for (const s of state.stars) {
    const tw = Math.sin(t * s.speed + s.phase) * 0.3 + 0.7
    const b = s.b * tw
    if (b < 0.2) continue
    canvas.setCell(s.x, s.y, b > 0.65 ? '·' : '.', b > 0.55 ? '#6a6a90' : '#3a3a50', null)
  }

  const cutoff = gR * 1.5
  const yMin = Math.max(0, cy - Math.ceil(cutoff / tiltY) - 1)
  const yMax = Math.min(h, cy + Math.ceil(cutoff / tiltY) + 1)
  const xMin = Math.max(0, cx - cutoff - 1)
  const xMax = Math.min(w, cx + cutoff + 1)

  for (let y = yMin; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      const dx = x - cx
      const dy = (y - cy) * tiltY
      const r = Math.sqrt(dx * dx + dy * dy)
      if (r > cutoff) continue

      const nR = r / gR
      const core = Math.exp(-nR * nR * 14)
      const disk = Math.exp(-nR * 2.5)

      let arm = 0
      if (nR > 0.05) {
        const theta = Math.atan2(dy, dx)
        const logR = Math.log(Math.max(0.05, nR))

        for (let a = 0; a < nArms; a++) {
          const armAngle = spiralK * logR + (a / nArms) * TWO_PI + rot
          let dT = theta - armAngle
          dT -= Math.round(dT / TWO_PI) * TWO_PI

          let density = Math.exp(-(dT * dT) / (2 * armSigma * armSigma))

          if (dT > -armSigma * 0.6 && dT < armSigma * 0.15 && nR > 0.18 && nR < 0.92) {
            const dustCenter = -armSigma * 0.18
            const dustWidth = armSigma * 0.22
            const dustDist = (dT - dustCenter) / dustWidth
            density *= 0.3 + 0.7 * Math.min(1, dustDist * dustDist)
          }

          arm = Math.max(arm, density)
        }
      }

      const total = core * 0.95 + arm * disk * 0.75
      if (total < 0.006) continue

      const n = state.noise[y * w + x]

      let fg
      if (core > 0.08) {
        fg = lerpMulti(CORE, Math.min(1, nR / 0.28))
      } else if (arm > 0.3 && nR > 0.1) {
        if (n > 0.93 && arm > 0.5 && nR > 0.22 && nR < 0.88) {
          fg = lerpMulti(HII, Math.min(1, n * 0.6))
        } else if (n > 0.68) {
          fg = lerpMulti(ARM_BRIGHT, Math.min(1, arm * 0.7))
        } else {
          fg = lerpMulti(ARM_BLUE, Math.min(1, 1 - arm * 0.5))
        }
      } else {
        fg = lerpMulti(DISK, Math.min(1, nR * 0.6 + 0.15))
      }

      const vis = total * (0.4 + n * 0.6)
      let ch
      if (core > 0.5) ch = BLOCK.full
      else if (vis > 0.42) ch = n > 0.5 ? SHADE[3] : SHADE[2]
      else if (vis > 0.2) ch = n > 0.42 ? SHADE[2] : SHADE[1]
      else if (vis > 0.07) ch = n > 0.32 ? SHADE[1] : SHADE[0]
      else if (vis > 0.015) ch = n > 0.78 ? '·' : n > 0.6 ? SHADE[0] : null
      if (!ch) continue

      const cell = canvas.getCell(x, y)
      const baseBg = (cell && cell.bg) ? cell.bg : '#020210'
      const glowCol = core > 0.03
        ? lerpMulti(CORE, Math.min(1, nR / 0.22 + 0.35))
        : lerpMulti(HALO, Math.min(1, nR * 0.7))
      const bg = lerp(baseBg, glowCol, Math.min(0.45, total * 0.3))

      canvas.setCell(x, y, ch, fg, bg)
    }
  }

  for (const s of state.bright) {
    const tw = Math.sin(t * 0.55 + s.phase) * 0.1 + 0.9
    if (tw < 0.6) continue
    if (s.x < 4 || s.x >= w - 4 || s.y < 4 || s.y >= h - 4) continue
    canvas.setCell(s.x, s.y, '✦', s.col, null)
    const dim = lerp(s.col, '#020210', 0.7)
    for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const px = s.x + ddx
      const py = s.y + ddy
      if (px >= 4 && px < w - 4 && py >= 4 && py < h - 4) {
        canvas.setCell(px, py, '·', dim, null)
      }
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
