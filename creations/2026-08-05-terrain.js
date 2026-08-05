import { lerpMulti, lerp, SHADE } from '../src/theme.js'

export const title = 'Terra Incognita'
export const description = 'Elevation lines trace an unseen landscape in the slow light of a turning sun'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const NS = 64

const DEEP = ['#041428', '#061c32', '#08243c', '#0a2c46']
const SHALLOW = ['#0c3450', '#0e3c5a', '#104464', '#124c6e']
const SHORE = ['#c4b478', '#b8a86c', '#ac9c60', '#a09054']
const GRASS = ['#4a9832', '#42902c', '#3a8826', '#328020']
const WOODS = ['#1c5e10', '#18520e', '#14460c', '#103a0a']
const SCRUB = ['#5a6830', '#6a7838', '#7a8840', '#8a9848']
const ROCK = ['#706050', '#807060', '#908070', '#a09080']
const PEAK = ['#c0bab0', '#d0cac0', '#e0dad0', '#f0eae0']

const WATER_LEVEL = 0.35
const CONTOUR_STEP = 0.04

function nv(g, x, y) {
  return g[((Math.floor(y) % NS + NS) % NS) * NS + ((Math.floor(x) % NS + NS) % NS)]
}

function n2(g, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const fx = x - x0, fy = y - y0
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = nv(g, x0, y0), b = nv(g, x0 + 1, y0)
  const c = nv(g, x0, y0 + 1), d = nv(g, x0 + 1, y0 + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

function fbm(g, x, y, oct) {
  let v = 0, a = 1, f = 1, m = 0
  for (let i = 0; i < oct; i++) { v += n2(g, x * f, y * f) * a; m += a; a *= 0.5; f *= 2 }
  return v / m
}

function elevColor(e) {
  if (e < 0.18) return lerpMulti(DEEP, e / 0.18)
  if (e < WATER_LEVEL) return lerpMulti(SHALLOW, (e - 0.18) / 0.17)
  if (e < 0.39) return lerpMulti(SHORE, (e - WATER_LEVEL) / 0.04)
  if (e < 0.49) return lerpMulti(GRASS, (e - 0.39) / 0.10)
  if (e < 0.59) return lerpMulti(WOODS, (e - 0.49) / 0.10)
  if (e < 0.70) return lerpMulti(SCRUB, (e - 0.59) / 0.11)
  if (e < 0.83) return lerpMulti(ROCK, (e - 0.70) / 0.13)
  return lerpMulti(PEAK, Math.min(1, (e - 0.83) / 0.17))
}

export function setup(canvas) {
  const rng = srand(805)
  const w = canvas.width, h = canvas.height

  const g1 = Array.from({ length: NS * NS }, () => rng())
  const g2 = Array.from({ length: NS * NS }, () => rng())

  const elev = new Float64Array(w * h)
  let lo = Infinity, hi = -Infinity

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let e = fbm(g1, x * 0.07, y * 0.055, 6)
      e += fbm(g2, x * 0.025 + 50, y * 0.02 + 50, 3) * 0.55
      const nx = (x / w - 0.5) * 2
      const ny = (y / h - 0.5) * 2
      e -= (nx * nx * 0.7 + ny * ny * 1.1) * 0.35
      const rd = Math.abs(nx * 0.35 + ny * 0.65 - 0.05)
      e += Math.max(0, 0.18 - rd) * 1.4
      elev[y * w + x] = e
      if (e < lo) lo = e
      if (e > hi) hi = e
    }
  }

  const range = hi - lo || 1
  for (let i = 0; i < elev.length; i++) elev[i] = (elev[i] - lo) / range

  const baseColors = new Array(w * h)
  for (let i = 0; i < elev.length; i++) baseColors[i] = elevColor(elev[i])

  return { elev, baseColors, w, h }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const { elev, baseColors, w, h } = state
  const la = t * 0.06
  const lx = Math.cos(la), ly = Math.sin(la) * 0.6

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const e = elev[i]
      let bg = baseColors[i]
      let ch = ' ', fg = null

      if (e >= WATER_LEVEL) {
        const eR = x < w - 1 ? elev[i + 1] : e
        const eL = x > 0 ? elev[i - 1] : e
        const eD = y < h - 1 ? elev[i + w] : e
        const eU = y > 0 ? elev[i - w] : e
        const dot = (eL - eR) * lx * 28 + (eU - eD) * ly * 28
        const lit = Math.max(0.28, Math.min(1.18, 0.58 + dot * 0.42))
        bg = lit < 1
          ? lerp(bg, '#040308', (1 - lit) * 0.58)
          : lerp(bg, '#fffff0', (lit - 1) * 0.65)
      } else {
        const sh = Math.sin(x * 0.13 + y * 0.07 + t * 0.5)
        if (sh > 0.72) bg = lerp(bg, '#1a3860', 0.14)
      }

      const cHere = Math.floor(e / CONTOUR_STEP)
      const cRight = x < w - 1 ? Math.floor(elev[i + 1] / CONTOUR_STEP) : cHere
      const cDown = y < h - 1 ? Math.floor(elev[i + w] / CONTOUR_STEP) : cHere
      const crossH = cHere !== cDown
      const crossV = cHere !== cRight

      if ((crossH || crossV) && e > 0.10) {
        fg = e < WATER_LEVEL
          ? lerp(bg, '#020810', 0.50)
          : lerp(bg, '#080604', 0.50)
        bg = lerp(bg, '#060404', 0.18)
        ch = crossH && crossV ? '·' : crossH ? '─' : '│'
      } else if (e > 0.83) {
        const sp = Math.sin(x * 0.8 + y * 1.1 + t * 0.15)
        if (sp > 0.55) { ch = '·'; fg = lerp(bg, '#ffffff', 0.35) }
      } else if (e >= 0.49 && e < 0.59) {
        const tr = Math.sin(x * 1.3 + y * 0.9) * Math.sin(x * 0.35 + y * 1.2)
        if (tr > 0.25) { ch = SHADE[0]; fg = lerp(bg, '#0a2006', 0.35) }
      }

      canvas.setCell(x, y, ch, fg, bg)
    }
  }
}
