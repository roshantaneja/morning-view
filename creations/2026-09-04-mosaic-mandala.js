import { hex, bgHex, lerp } from '../src/theme.js'

export const title = 'Mosaic Mandala'
export const description = 'Ancient tesserae set in plaster — lapis, gold, and terracotta turning slowly with the morning light'
export const fps = 2

const TAU = Math.PI * 2
const GROUT = '#2a2520'

const RING_DEFS = [
  { r: 0.06, n: 1,  c: ['#d4a843'], pat: 's' },
  { r: 0.14, n: 8,  c: ['#1e3a6e', '#d4a843'], pat: 's' },
  { r: 0.26, n: 16, c: ['#c45a3c', '#e8dcc8', '#2a7a4a', '#e8dcc8'], pat: 's' },
  { r: 0.34, n: 8,  c: ['#d4a843', '#8a2030'], pat: 'p' },
  { r: 0.47, n: 24, c: ['#3a8a8a', '#1e3a6e', '#e8dcc8', '#1e3a6e'], pat: 's' },
  { r: 0.56, n: 16, c: ['#2a7a4a', '#c45a3c', '#d4a843', '#c45a3c'], pat: 's' },
  { r: 0.70, n: 32, c: ['#1e3a6e', '#d4a843', '#8a2030', '#d4a843'], pat: 's' },
  { r: 0.84, n: 16, c: ['#d4a843', '#c45a3c'], pat: 'p' },
  { r: 0.92, n: 24, c: ['#b8863a', '#1e3a6e'], pat: 's' },
  { r: 1.00, n: 48, c: ['#d4a843', '#3a3020'], pat: 's' },
]

export function setup(canvas) {
  const w = canvas.width, h = canvas.height
  const rx = w / 2 - 4
  const ry = h / 2 - 4
  const rings = []
  let prev = 0
  for (const d of RING_DEFS) {
    rings.push({ inner: prev, outer: d.r, n: d.n, c: d.c, pat: d.pat })
    prev = d.r
  }
  return { rx, ry, rings }
}

function draw(canvas, state, t) {
  const w = canvas.width, h = canvas.height
  const cx = w / 2, cy = h / 2
  const { rx, ry, rings } = state
  const la = t * 0.1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ndx = (x - cx) / rx
      const ndy = (y - cy) / ry
      const r = Math.sqrt(ndx * ndx + ndy * ndy)
      const a = (Math.atan2(ndy, ndx) + TAU) % TAU

      if (r > 1.0) {
        const n = Math.sin(x * 0.4 + y * 0.3) * 0.02
              + Math.sin(x * 0.13 - y * 0.17 + 1.5) * 0.015
        canvas.setCell(x, y, ' ', null, bgHex(lerp('#1c1915', '#282018', 0.5 + n)))
        continue
      }

      let color = null
      for (const ring of rings) {
        if (r < ring.inner || r >= ring.outer) continue
        const rw = ring.outer - ring.inner
        const rt = (r - ring.inner) / rw
        const sa = TAU / ring.n
        const si = Math.floor(a / sa)
        const sp = (a % sa) / sa

        if (rw > 0.04 && (rt < 0.06 || rt > 0.94)) break
        if (ring.n > 1 && (sp < 0.04 || sp > 0.96)) break

        if (ring.pat === 'p') {
          const hw = 0.38 * (1 - Math.abs(rt * 2 - 1))
          color = Math.abs(sp - 0.5) < hw ? ring.c[0] : ring.c[1]
        } else {
          color = ring.c[si % ring.c.length]
        }
        break
      }

      if (!color) {
        canvas.setCell(x, y, ' ', null, bgHex(GROUT))
        continue
      }

      const ld = Math.cos(a - la)
      const bri = 0.9 + ld * 0.1
      color = bri >= 1 ? lerp(color, '#ffffff', (bri - 1) * 1.5)
                       : lerp(color, '#000000', (1 - bri) * 0.2)

      const sh = Math.sin(x * 2.3 + y * 1.7 + t * 2.5)
               * Math.sin(x * 0.7 - y * 2.1 + t * 1.3)
      if (sh > 0.82) color = lerp(color, '#ffffff', 0.12)

      const jit = ((x * 7919 + y * 104729) >>> 0) % 255 / 255
      color = lerp(color, jit > 0.5 ? '#ffffff' : '#000000', Math.abs(jit - 0.5) * 0.05)

      canvas.setCell(x, y, ' ', null, bgHex(color))
    }
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
