import { SHADE, GLYPH } from '../src/theme.js'

export const title = 'The Wishing Well'
export const description =
  'Peer over the mossy rim — past worn stones and whispered hopes, the bottom holds the entire sky'
export const fps = 2

const TAU = Math.PI * 2
const ASPECT = 2.0

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}
function pH(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}
function mix(a, b, t) {
  t = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = pH(a), [r2, g2, b2] = pH(b)
  return c2h(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
function noise2d(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy), b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}
function vDist(x, y, cx, cy) {
  const dx = (x - cx) / ASPECT, dy = y - cy
  return Math.sqrt(dx * dx + dy * dy)
}

const GND_DK   = '#161008'
const GND_MD   = '#281e14'
const MOSS     = '#2a4a1a'
const MOSS_DK  = '#1a3010'
const STN_LT   = '#8a7a6a'
const STN_MD   = '#6b5e50'
const STN_DK   = '#4a3f35'
const MORTAR   = '#352e1a'
const WELL_DK  = '#080610'
const COS_BG   = '#050310'
const COS_MD   = '#0e0825'
const NEB_PURP = '#1e1048'
const NEB_BLUE = '#101a35'
const NEB_ROSE = '#201030'
const STAR_W   = '#eeeeff'
const STAR_B   = '#99aadd'
const STAR_G   = '#ddcc88'
const COIN_LO  = '#b89838'
const COIN_HI  = '#ffe060'

export function setup(canvas) {
  const rng = srand(1103)

  const stars = []
  for (let i = 0; i < 160; i++) {
    stars.push({
      a: rng() * TAU,
      r: Math.sqrt(rng()) * 0.93,
      br: 0.2 + rng() * 0.8,
      ts: 0.4 + rng() * 2.5,
      tp: rng() * TAU,
      big: rng() < 0.08,
      ct: rng() < 0.25 ? 0 : rng() < 0.5 ? 1 : 2,
    })
  }

  const coins = []
  for (let i = 0; i < 14; i++) {
    coins.push({
      a: rng() * TAU,
      depth: 0.12 + rng() * 0.65,
      gp: rng() * TAU,
      gs: 0.2 + rng() * 1.2,
    })
  }

  const stoneVar = Array.from({ length: 360 }, () => rng())
  return { stars, coins, stoneVar }
}

function drawScene(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  if (W < 10 || H < 10) return
  const cx = W / 2, cy = H / 2

  const baseR = Math.min(W / ASPECT, H) * 0.42
  const rimOut = baseR
  const rimIn  = baseR * 0.77
  const cosR   = baseR * 0.42

  const starMap = new Map()
  for (const s of state.stars) {
    const sx = Math.round(cx + Math.cos(s.a) * s.r * cosR * ASPECT)
    const sy = Math.round(cy + Math.sin(s.a) * s.r * cosR)
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue
    const tw = Math.sin(t * s.ts + s.tp) * 0.35 + 0.65
    const br = s.br * tw
    if (br > 0.25) starMap.set(sy * W + sx, { br, big: s.big, ct: s.ct })
  }

  const coinMap = new Map()
  for (const c of state.coins) {
    const dc = rimIn - (rimIn - cosR - 1) * c.depth
    const ccx = Math.round(cx + Math.cos(c.a) * dc * ASPECT)
    const ccy = Math.round(cy + Math.sin(c.a) * dc)
    if (ccx < 0 || ccx >= W || ccy < 0 || ccy >= H) continue
    const g = Math.sin(t * c.gs + c.gp) * 0.5 + 0.5
    coinMap.set(ccy * W + ccx, g)
    if (ccx + 1 < W) coinMap.set(ccy * W + ccx + 1, g * 0.5)
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = vDist(x, y, cx, cy)
      let ch = ' ', fg = null, bg = null
      const key = y * W + x

      if (d > rimOut + 1.5) {
        const n1 = noise2d(x * 0.12, y * 0.18)
        const n2 = noise2d(x * 0.06 + 80, y * 0.09 + 80)
        if (n1 > 0.62) {
          ch = n1 > 0.78 ? ',' : '.'
          fg = mix(MOSS_DK, MOSS, n2)
        } else if (n2 > 0.65) {
          ch = '~'
          fg = mix('#5a3818', '#7a5028', hash(x, y))
        } else {
          ch = SHADE[0]
          fg = mix(GND_DK, GND_MD, n2 * 0.35 + 0.1)
        }
        bg = mix(GND_DK, GND_MD, n1 * 0.3)

      } else if (d > rimOut - 0.3) {
        const et = Math.max(0, Math.min(1, (d - rimOut + 0.3) / 1.8))
        fg = mix(STN_MD, GND_MD, et)
        bg = mix(STN_DK, GND_DK, et)
        ch = SHADE[Math.max(0, Math.floor((1 - et) * 3))]

      } else if (d > rimIn + 0.3) {
        const angle = Math.atan2(y - cy, (x - cx) / ASPECT)
        const aDeg = ((angle * 180 / Math.PI) + 360) % 360
        const rimT = (d - rimIn) / (rimOut - rimIn)

        const sv = state.stoneVar[Math.floor(aDeg) % 360]
        const sp = Math.sin(aDeg * 0.09 * 3.5) * 0.5 + 0.5
        const radBand = rimT > 0.35 && rimT < 0.60
        const mortar = sp < 0.06 || (radBand && sp < 0.12)

        if (mortar) {
          fg = MORTAR
          bg = mix(MORTAR, STN_DK, 0.4)
          ch = SHADE[0]
        } else {
          const nv = noise2d(x * 0.25, y * 0.35)
          const hasMoss = noise2d(x * 0.08 + 40, y * 0.12 + 40) > 0.58
          const v = sv * 0.5 + nv * 0.5
          if (hasMoss) {
            fg = mix(MOSS_DK, MOSS, v)
            bg = mix(STN_DK, MOSS_DK, 0.4)
            ch = v > 0.4 ? SHADE[2] : SHADE[1]
          } else {
            const lit = rimT > 0.65 ? 0.12 : 0
            fg = mix(STN_DK, STN_LT, v * 0.7 + lit)
            bg = mix(STN_DK, STN_MD, v * 0.5)
            ch = SHADE[Math.min(3, Math.floor(v * 2.5 + 1))]
          }
        }

      } else if (d > rimIn - 0.5) {
        const et = Math.max(0, Math.min(1, (rimIn + 0.3 - d) / 0.8))
        fg = mix(STN_DK, WELL_DK, et)
        bg = mix(STN_DK, WELL_DK, et * 0.8)
        ch = et < 0.5 ? SHADE[1] : SHADE[0]

      } else if (d > cosR + 0.3) {
        const shT = (d - cosR) / (rimIn - cosR)

        if (coinMap.has(key)) {
          const g = coinMap.get(key)
          fg = mix(COIN_LO, COIN_HI, g * 0.8)
          bg = mix(COS_BG, WELL_DK, shT * 0.4)
          ch = g > 0.6 ? GLYPH.star : GLYPH.bullet
        } else {
          const angle = Math.atan2(y - cy, (x - cx) / ASPECT)
          const wn = noise2d(angle * 4 + 150, d * 0.3 + 150)
          fg = mix(COS_BG, STN_DK, shT * wn * 0.45)
          bg = mix(COS_BG, WELL_DK, shT * 0.35)
          ch = (shT > 0.65 && wn > 0.55) || (shT > 0.35 && wn > 0.72)
            ? SHADE[0] : ' '
        }

      } else {
        const ct = d / cosR
        const nx = (x - cx) / (cosR * ASPECT)
        const ny = (y - cy) / cosR

        const n1 = noise2d(nx * 4 + t * 0.08, ny * 4 + 10)
        const n2 = noise2d(nx * 3 - t * 0.04 + 30, ny * 3 + 30)
        const spiral = Math.sin(
          Math.atan2(ny, nx) * 2.5 + d * 0.15 + t * 0.12
        ) * 0.5 + 0.5

        let bgC = COS_BG
        bgC = mix(bgC, COS_MD, n1 * 0.4)
        if (n1 > 0.48) bgC = mix(bgC, NEB_PURP, (n1 - 0.48) * spiral * 0.7)
        if (n2 > 0.48) bgC = mix(bgC, NEB_BLUE, (n2 - 0.48) * 0.55)
        if (n1 > 0.58 && n2 > 0.38) bgC = mix(bgC, NEB_ROSE, 0.18)

        if (ct < 0.25) bgC = mix(bgC, '#18103a', (1 - ct / 0.25) * 0.25)
        if (ct > 0.78) bgC = mix(bgC, WELL_DK, (ct - 0.78) / 0.22 * 0.55)

        const rip = Math.sin(ct * 18 - t * 1.8) * 0.5 + 0.5
        if (ct > 0.08 && ct < 0.85 && rip > 0.87)
          bgC = mix(bgC, '#1a1842', 0.1)

        const si = starMap.get(key)
        if (si && si.br > 0.3) {
          const sc = si.ct === 0 ? STAR_B : si.ct === 1 ? STAR_G : STAR_W
          fg = mix(bgC, sc, si.br)
          ch = si.big
            ? (si.br > 0.7 ? GLYPH.star : GLYPH.bullet)
            : (si.br > 0.75 ? GLYPH.bullet : '·')
        } else {
          fg = bgC
        }
        bg = bgC
      }

      canvas.setCell(x, y, ch, fg, bg)
    }
  }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
