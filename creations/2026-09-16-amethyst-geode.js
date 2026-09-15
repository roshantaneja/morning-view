import { hex, bgHex, lerp, lerpMulti, SHADE } from '../src/theme.js'

export const title = 'Amethyst Geode'
export const description = 'A split stone reveals banded agate and a cathedral of violet crystal within'
export const fps = 2

const TAU = Math.PI * 2
const STEPS = 720

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }
function bin(angle) { return Math.min(STEPS - 1, Math.max(0, Math.floor(((angle / TAU % 1) + 1) % 1 * STEPS))) }

const AGATE = [
  '#2a1a12', '#3c2618', '#4e3424', '#ccb89c',
  '#302428', '#483c42', '#ccb89c', '#3a2a1c',
  '#584236', '#ddd0be', '#2e2428', '#443a46',
]

const DEEP = ['#0a0018', '#180032', '#2a0c50', '#401a70', '#582c96', '#7040b8']

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(916)

  const cx = Math.floor(W * 0.50)
  const cy = Math.floor(H * 0.47)
  const rX = W * 0.41
  const rY = H * 0.43

  const harmonics = Array.from({ length: 10 }, () => [
    2 + Math.floor(rng() * 6), 0.008 + rng() * 0.022, rng() * TAU
  ])
  const outerLUT = new Float64Array(STEPS)
  for (let i = 0; i < STEPS; i++) {
    const a = (i / STEPS) * TAU
    let r = 1.0
    for (const [f, amp, ph] of harmonics) r += Math.sin(a * f + ph) * amp
    outerLUT[i] = r
  }

  const teeth = Array.from({ length: 44 }, () => ({
    a: rng() * TAU,
    hw: 0.012 + rng() * 0.038,
    reach: 0.04 + rng() * 0.18,
    br: 0.3 + rng() * 0.7,
  }))

  const cavLUT = new Float64Array(STEPS)
  const facLUT = new Float64Array(STEPS)
  for (let i = 0; i < STEPS; i++) {
    const a = (i / STEPS) * TAU
    let r = 0.28
    let fac = 0
    for (const t of teeth) {
      let da = a - t.a
      while (da > Math.PI) da -= TAU
      while (da < -Math.PI) da += TAU
      const abs = Math.abs(da)
      if (abs < t.hw) r -= (1 - abs / t.hw) * t.reach
      const ew = t.hw * 1.6
      if (abs < ew) {
        const e = abs / ew
        if (e > 0.5 && e < 0.95) fac = Math.max(fac, (1 - Math.abs(e - 0.72) / 0.22) * t.br * 0.4)
      }
    }
    cavLUT[i] = Math.max(0.04, r)
    facLUT[i] = fac
  }

  const sparkles = Array.from({ length: 60 }, () => ({
    a: rng() * TAU,
    r: 0.06 + rng() * 0.42,
    ph: rng() * TAU,
    sp: 0.25 + rng() * 1.4,
  }))

  return { W, H, cx, cy, rX, rY, outerLUT, cavLUT, facLUT, sparkles }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }

function draw(canvas, state, t) {
  const { W, H, cx, cy, rX, rY, outerLUT, cavLUT, facLUT, sparkles } = state

  const spk = new Map()
  for (const s of sparkles) {
    const p = Math.sin(t * s.sp + s.ph)
    if (p < 0.1) continue
    const v = (p - 0.1) / 0.9
    const px = Math.floor(cx + Math.cos(s.a) * s.r * rX)
    const py = Math.floor(cy + Math.sin(s.a) * s.r * rY)
    if (px >= 0 && px < W && py >= 0 && py < H) {
      const k = py * W + px
      spk.set(k, Math.max(spk.get(k) || 0, v))
    }
  }

  const lightAngle = -0.6
  const lightX = Math.cos(lightAngle)
  const lightY = Math.sin(lightAngle)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / rX, dy = (y - cy) / rY
      const d = Math.sqrt(dx * dx + dy * dy)

      if (d > 1.12) {
        canvas.setCell(x, y, ' ', null, bgHex('#04030a'))
        continue
      }

      const angle = Math.atan2(dy, dx)
      const ab = bin(angle)
      const outer = outerLUT[ab]

      const ndx = d > 0.01 ? dx / d : 0
      const ndy = d > 0.01 ? dy / d : 0
      const light = 0.5 + 0.5 * (ndx * lightX + ndy * lightY)

      if (d > outer) {
        const dist = d - outer
        if (dist < 0.06) {
          const g = (1 - dist / 0.06)
          const glow = g * g * 0.08
          canvas.setCell(x, y, ' ', null, bgHex(col(
            Math.floor(4 + glow * 30), Math.floor(3 + glow * 5), Math.floor(6 + glow * 50)
          )))
        } else {
          canvas.setCell(x, y, ' ', null, bgHex('#04030a'))
        }
        continue
      }

      const cav = cavLUT[ab]
      const rockBound = outer * 0.82
      const agateBound = outer * 0.50

      if (d > rockBound) {
        const rt = (d - rockBound) / (outer - rockBound)
        const n = Math.sin(angle * 13.7 + d * 47) * 0.3 + Math.sin(angle * 5.1) * 0.15
        const lit = 0.7 + light * 0.3
        const v = Math.max(8, Math.min(48, Math.floor((16 + (1 - rt) * 18 + n * 7) * lit)))
        const si = Math.max(0, Math.min(3, Math.floor((1 - rt) * 2.5 + n)))
        canvas.setCell(x, y, SHADE[si],
          hex(col(v + 4, v, Math.max(0, v - 4))),
          bgHex(col(Math.max(0, v - 6), Math.max(0, v - 8), Math.max(0, v - 10))))

      } else if (d > agateBound) {
        const at = (d - agateBound) / (rockBound - agateBound)
        const wave = Math.sin(angle * 3.2 + 1.1) * 0.012 + Math.sin(angle * 7.6) * 0.006
        const br = (at + wave) * AGATE.length * 3
        const bi = ((Math.floor(br) % AGATE.length) + AGATE.length) % AGATE.length
        const bf = ((br % 1) + 1) % 1
        const lit = 0.75 + light * 0.25
        if (bf < 0.04) {
          const line = col(Math.floor(230 * lit), Math.floor(220 * lit), Math.floor(200 * lit))
          canvas.setCell(x, y, ' ', null, bgHex(line))
        } else {
          const base = AGATE[bi]
          canvas.setCell(x, y, ' ', null, bgHex(lerp(base, '#000000', 1 - lit)))
        }

      } else if (d > cav) {
        const span = Math.max(0.01, agateBound - cav)
        const ct = Math.max(0, Math.min(1, (d - cav) / span))
        const lit = 0.65 + light * 0.35
        let base = lerpMulti(DEEP, ct)
        base = lerp(base, '#000000', 1 - lit)

        const fac = facLUT[ab]
        if (fac > 0) base = lerp(base, '#9060cc', fac * lit)

        if (ct > 0.93) base = lerp(base, '#b088dc', (ct - 0.93) / 0.07 * 0.3 * lit)

        const sv = spk.get(y * W + x)

        let ch = ' '
        if (sv !== undefined && sv > 0.2) {
          base = lerp(base, '#f0e8ff', sv * 0.55)
          ch = sv > 0.6 ? '✦' : '·'
        } else if (ct > 0.93) {
          ch = '·'
        } else if (ct > 0.82) {
          ch = SHADE[3]
        } else if (ct > 0.55) {
          ch = SHADE[2]
        } else if (ct > 0.28) {
          ch = SHADE[1]
        } else if (ct > 0.10) {
          ch = SHADE[0]
        }

        const fg = sv !== undefined ? lerp(base, '#e8ddff', 0.45) : lerp(base, '#7744aa', 0.2)
        canvas.setCell(x, y, ch, hex(fg), bgHex(base))

      } else {
        const g = d / Math.max(0.01, cav)
        const gv = g * g * 0.04
        canvas.setCell(x, y, ' ', null, bgHex(col(
          Math.floor(2 + gv * 22), 0, Math.floor(4 + gv * 32)
        )))
      }
    }
  }
}
