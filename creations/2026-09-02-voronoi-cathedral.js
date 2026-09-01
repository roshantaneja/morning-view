import { lerp, SHADE } from '../src/theme.js'

export const title = 'Voronoi Cathedral'
export const description = 'Light finds its way through ancient glass — each fragment holds a small eternity of color'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function col(r, g, b) {
  const hx = n => Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
  return '#' + hx(r) + hx(g) + hx(b)
}

const JEWELS = [
  [180, 30, 60],   [30, 80, 180],   [40, 160, 80],
  [200, 160, 30],  [120, 40, 160],  [180, 60, 30],
  [30, 140, 160],  [160, 30, 120],  [50, 120, 50],
  [200, 100, 30],  [80, 60, 160],   [160, 120, 40],
  [40, 100, 140],  [180, 40, 80],   [100, 160, 60],
]

function archBounds(y, w, h, inset) {
  const al = w * 0.18 + inset
  const ar = w * 0.82 - inset
  const bot = Math.floor(h * 0.88 - inset)
  const spring = Math.floor(h * 0.30)
  const peak = Math.floor(h * 0.05 + inset * 1.2)

  if (y > bot || y < peak || al >= ar) return null

  const hw = (ar - al) / 2
  const cx = (al + ar) / 2

  if (y >= spring) return { l: Math.floor(al), r: Math.ceil(ar) }

  const t = (spring - y) / Math.max(1, spring - peak)
  const f = Math.pow(1 - t, 0.65)
  const wy = hw * f
  if (wy < 1) return null
  return { l: Math.floor(cx - wy), r: Math.ceil(cx + wy) }
}

export function setup(canvas) {
  const rng = srand(902)

  const seeds = []
  for (let i = 0; i < 38; i++) {
    const j = JEWELS[i % JEWELS.length]
    const v = 0.7 + rng() * 0.6
    seeds.push({
      x: 0.15 + rng() * 0.70,
      y: 0.04 + rng() * 0.86,
      ph: rng() * Math.PI * 2,
      dx: (rng() - 0.5) * 0.01,
      dy: (rng() - 0.5) * 0.01,
      r: Math.min(255, Math.floor(j[0] * v)),
      g: Math.min(255, Math.floor(j[1] * v)),
      b: Math.min(255, Math.floor(j[2] * v)),
      bri: 0.5 + rng() * 0.5,
      ps: 0.15 + rng() * 0.3,
    })
  }

  return { seeds }
}

function draw(c, s, t) {
  const w = c.width, h = c.height
  const bw = 3
  const yc = 1.7

  const lx = 0.42 + Math.sin(t * 0.055) * 0.14
  const ly = 0.18 + Math.cos(t * 0.04) * 0.1

  const seeds = s.seeds
  const n = seeds.length
  const spx = new Array(n)
  const spy = new Array(n)
  for (let i = 0; i < n; i++) {
    spx[i] = seeds[i].x + Math.sin(t * 0.035 + seeds[i].ph) * seeds[i].dx
    spy[i] = seeds[i].y + Math.cos(t * 0.03 + seeds[i].ph) * seeds[i].dy
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nz = Math.sin(x * 0.3 + y * 0.2 + 0.5) * 4
           + Math.sin(x * 0.55 - y * 0.35 + 2.1) * 3
           + Math.sin(x * 0.11 + y * 0.07) * 5
      const sv = Math.floor(20 + nz)
      c.setCell(x, y, ' ', null, col(sv + 3, sv, Math.max(0, sv - 3)))
    }
  }

  for (let y = 0; y < h; y++) {
    const outer = archBounds(y, w, h, 0)
    const inner = archBounds(y, w, h, bw)
    if (!outer) continue

    for (let x = outer.l; x <= outer.r; x++) {
      if (x < 0 || x >= w) continue

      const inGlass = inner && x >= inner.l && x <= inner.r

      if (!inGlass) {
        let de = bw
        if (inner) de = x < inner.l ? inner.l - x : x - inner.r
        de = Math.max(0, Math.min(bw, de))
        const bv = Math.floor(30 + de * 4 + Math.sin(x * 0.4 + y * 0.25) * 2)
        c.setCell(x, y, de <= 1 ? SHADE[3] : (de <= 2 ? SHADE[2] : SHADE[1]),
          col(bv + 8, bv + 4, bv),
          col(Math.max(0, bv - 5), Math.max(0, bv - 7), Math.max(0, bv - 9)))
        continue
      }

      const nx = x / w
      const ny = y / h

      let d1 = Infinity, d2 = Infinity, idx = 0
      for (let i = 0; i < n; i++) {
        const dx = nx - spx[i]
        const dy = (ny - spy[i]) * yc
        const d = dx * dx + dy * dy
        if (d < d1) { d2 = d1; d1 = d; idx = i }
        else if (d < d2) { d2 = d }
      }

      const edge = Math.sqrt(d2) - Math.sqrt(d1)
      const seed = seeds[idx]

      const ldx = nx - lx
      const ldy = (ny - ly) * yc
      const ld = Math.sqrt(ldx * ldx + ldy * ldy)
      const li = Math.max(0.3, 1.15 - ld * 0.7)

      const pulse = Math.sin(t * seed.ps + seed.ph) * 0.06 + 0.94

      if (edge < 0.008) {
        c.setCell(x, y, ' ', null, col(14, 12, 10))
      } else {
        let bri = seed.bri * li * pulse
        if (edge < 0.016) bri *= 0.78
        const tex = Math.sin(x * 0.22 + y * 0.16 + seed.ph) * 0.04
        bri = Math.max(0.15, Math.min(1.3, bri + tex))

        c.setCell(x, y, ' ', null, col(
          Math.min(255, Math.floor(seed.r * bri)),
          Math.min(255, Math.floor(seed.g * bri)),
          Math.min(255, Math.floor(seed.b * bri))
        ))
      }
    }
  }

  const bot = Math.floor(h * 0.88)
  const fs = bot + bw + 1
  const fh = Math.min(h - fs - 4, 7)

  if (fs < h - 3 && fh > 1) {
    const aRef = archBounds(bot - 2, w, h, bw)
    if (aRef) {
      for (let fy = 0; fy < fh; fy++) {
        const ry = fs + fy
        if (ry >= h - 3) break
        const fade = Math.pow(1 - fy / fh, 1.5) * 0.35

        for (let x = aRef.l; x <= aRef.r; x++) {
          if (x < 0 || x >= w) continue

          const nx = x / w
          const refNy = (bot - 3) / h
          let dMin = Infinity, seedIdx = 0
          for (let i = 0; i < n; i++) {
            const dx = nx - spx[i]
            const dy = (refNy - spy[i]) * yc
            const d = dx * dx + dy * dy
            if (d < dMin) { dMin = d; seedIdx = i }
          }

          const seed = seeds[seedIdx]
          const bri = fade * seed.bri
          if (bri < 0.03) continue

          const cell = c.getCell(x, ry)
          if (cell && cell.bg) {
            c.setCell(x, ry, ' ', null, lerp(cell.bg,
              col(Math.min(255, Math.floor(seed.r * 0.5)),
                  Math.min(255, Math.floor(seed.g * 0.5)),
                  Math.min(255, Math.floor(seed.b * 0.5))),
              Math.min(1, bri * 2.5)))
          }
        }
      }
    }
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
