import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Kaleidoscope'
export const description = 'Jewelled symmetries turn inside a brass tube'
export const fps = 2

const ASPECT = 2.0
const FOLDS = 6

const RUBY = ['#2a0008', '#6c1028', '#a82040', '#d83858', '#f06080']
const SAPPHIRE = ['#001040', '#0c3898', '#1860c8', '#3088e8', '#58b0ff']
const EMERALD = ['#001808', '#084828', '#187848', '#30a868', '#50d088']
const AMETHYST = ['#180030', '#381070', '#5828a0', '#7840c8', '#9860e8']
const TOPAZ = ['#281400', '#604010', '#986818', '#cc9428', '#f0c048']
const JEWELS = [RUBY, SAPPHIRE, EMERALD, AMETHYST, TOPAZ]

const BG = '#030108'
const RIM = ['#140818', '#201020', '#2c1830', '#382040', '#443050']

export function setup() {
  return { phase: 0 }
}

export function render(canvas, data, state) {
  paint(canvas, state.phase)
}

export function update(canvas, data, frame, state) {
  state.phase += 0.035
  paint(canvas, state.phase)
}

function paint(canvas, phase) {
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(cx - 4, (cy - 4) * ASPECT)
  const slice = (Math.PI * 2) / FOLDS

  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++) {
      const dx = sx - cx
      const dy = (sy - cy) * ASPECT
      const r = Math.sqrt(dx * dx + dy * dy)
      const d = r / maxR

      if (d > 1.02) {
        canvas.setCell(sx, sy, ' ', null, BG)
        continue
      }

      if (d > 0.93) {
        const t = Math.min(1, (d - 0.93) / 0.09)
        const col = lerpMulti(RIM, t)
        const si = Math.max(0, 3 - Math.floor(t * 3.5))
        canvas.setCell(sx, sy, SHADE[si], col, BG)
        continue
      }

      let angle = Math.atan2(dy, dx)
      if (angle < 0) angle += Math.PI * 2

      let a = angle % slice
      const fi = Math.floor(angle / slice)
      if (fi % 2 === 1) a = slice - a

      const nr = d / 0.93
      const na = a / slice

      const rot = phase
      const s1 = Math.sin(nr * 7 + rot) * Math.cos(na * Math.PI * 3.5 + rot * 0.6)
      const s2 = Math.sin(nr * 11 - rot * 0.35 + na * Math.PI * 5) * 0.55
      const s3 = Math.cos((nr * 4.5 + na * 2.5) * Math.PI + rot * 0.7) * 0.45
      const s4 = Math.sin(nr * 16 + rot * 0.2) * Math.cos(na * Math.PI * 8 - rot * 0.4) * 0.25
      const band = Math.sin(nr * Math.PI * 3.5 + phase * 0.12) * 0.25

      let raw = (s1 + s2 + s3 + s4 + band) / 2.5
      raw = Math.sign(raw) * Math.pow(Math.abs(raw), 0.75)

      const t = Math.max(0, Math.min(1, (raw + 1) / 2))

      const pi1 = Math.floor(nr * JEWELS.length) % JEWELS.length
      const pi2 = (pi1 + 1) % JEWELS.length
      const blend = (nr * JEWELS.length) % 1

      const c1 = lerpMulti(JEWELS[pi1], t)
      const c2 = lerpMulti(JEWELS[pi2], t)
      let color = lerp(c1, c2, blend * 0.5)

      if (d > 0.82) {
        color = lerp(color, BG, (d - 0.82) / 0.11 * 0.4)
      }

      const glow = Math.max(0, 1 - nr * 2.5) * 0.2
      color = lerp(color, '#fff8e0', glow * t)

      const sp = Math.sin(nr * 22 + na * 17 + phase * 2.5) *
                 Math.cos(nr * 14 - na * 9 - phase * 1.2)
      if (sp > 0.82 && t > 0.45) {
        color = lerp(color, '#ffffff', Math.min(1, (sp - 0.82) * 5))
      }

      const bright = t * 0.85 + glow
      let ch
      if (bright > 0.78) ch = BLOCK.full
      else if (bright > 0.58) ch = SHADE[3]
      else if (bright > 0.38) ch = SHADE[2]
      else if (bright > 0.20) ch = SHADE[1]
      else ch = SHADE[0]

      canvas.setCell(sx, sy, ch, color, lerp(BG, color, 0.1))
    }
  }
}
