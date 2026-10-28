export const title = "Cartographer's Chart"
export const description =
  'Ink dries slow on yellowed vellum — past the edge of the known, the sea still whispers of dragons'
export const fps = 2

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
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const sx = xf * xf * (3 - 2 * xf)
  const sy = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi) + (hash(xi + 1, yi) - hash(xi, yi)) * sx
  const b = hash(xi, yi + 1) + (hash(xi + 1, yi + 1) - hash(xi, yi + 1)) * sx
  return a + (b - a) * sy
}
function fbm(x, y, o) {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < o; i++) { v += a * vnoise(x * f, y * f); a *= 0.5; f *= 2 }
  return v
}

const PARCH = '#d4a574'
const PARCH_LT = '#e8c8a0'
const PARCH_DK = '#b08050'
const PARCH_VDK = '#8a6030'
const FRAME = '#1a0e05'
const INK = '#3c2415'
const INK_MED = '#5c4033'
const INK_LT = '#8b6940'
const SEA = '#7a9888'
const SEA_LT = '#98b0a0'
const GOLD = '#c8a030'
const GOLD_DK = '#906818'
const ROUTE = '#a04030'
const FOREST = '#5a7040'
const MTN = '#685848'

function landDist(nx, ny) {
  const cx = 0.48, cy = 0.42
  const dx = nx - cx, dy = ny - cy
  const angle = Math.atan2(dy * 1.6, dx * 2.2)
  const dist = Math.sqrt(dx * dx * 7 + dy * dy * 5)
  const wobble = fbm(Math.cos(angle) * 2 + 5, Math.sin(angle) * 2 + 5, 4) * 0.18
  const main = 0.55 + wobble + 0.08 * Math.sin(angle * 3) +
               0.05 * Math.cos(angle * 5 + 1) - dist

  const px = nx - 0.52, py = ny - 0.58
  const pen = 0.18 - Math.sqrt(px * px * 8 + py * py * 25) +
              fbm(px * 4 + 20, py * 4 + 20, 3) * 0.06

  const sx = nx - 0.73, sy = ny - 0.55
  const small = 0.12 - Math.sqrt(sx * sx * 12 + sy * sy * 12) +
                fbm(sx * 5 + 30, sy * 5 + 30, 3) * 0.05

  const n2x = nx - 0.22, n2y = ny - 0.28
  const nw = 0.08 - Math.sqrt(n2x * n2x * 18 + n2y * n2y * 18) +
             fbm(n2x * 5 + 40, n2y * 5 + 40, 3) * 0.04

  return Math.max(main, pen, small, nw)
}

function elev(nx, ny) {
  const v = fbm(nx * 5 + 50, ny * 5 + 50, 4)
  const d = Math.sqrt((nx - 0.45) ** 2 * 3 + (ny - 0.38) ** 2 * 3)
  return v * Math.max(0, 1 - d * 1.3)
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const BX = 2, BY = 1
  const mx0 = BX + 2, my0 = BY + 2
  const mw = Math.max(1, W - 2 * mx0)
  const mh = Math.max(1, H - 2 * my0)

  const bg = new Array(W * H)
  const ld = new Float32Array(W * H)
  const ev = new Float32Array(W * H)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const nx = (x - mx0) / mw
      const ny = (y - my0) / mh

      if (x < mx0 || x >= mx0 + mw || y < my0 || y >= my0 + mh) {
        bg[i] = PARCH
        ld[i] = -1
        ev[i] = 0
        continue
      }

      const pN = fbm(nx * 8 + 100, ny * 8 + 100, 3)
      const stain = fbm(nx * 3 + 200, ny * 3 + 200, 2)
      let p = mix(PARCH_DK, PARCH_LT, pN * 0.6 + 0.35)
      if (stain > 0.58) p = mix(p, PARCH_VDK, (stain - 0.58) * 2)
      const edgeDist = Math.min(nx, 1 - nx, ny, 1 - ny)
      if (edgeDist < 0.06) p = mix(PARCH_VDK, p, edgeDist / 0.06)

      bg[i] = p
      ld[i] = landDist(nx, ny)
      ev[i] = elev(nx, ny)
    }
  }

  return { t: 0, bg, ld, ev, W, H, mx0, my0, mw, mh, BX, BY }
}

function draw(canvas, state) {
  const { W, H, bg: bgArr, ld: ldArr, ev: evArr, mx0, my0, mw, mh, BX, BY } = state
  const t = state.t

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < BX || x >= W - BX || y < BY || y >= H - BY) {
        canvas.setCell(x, y, ' ', null, FRAME)
        continue
      }
      if (x === BX || x === W - BX - 1 || y === BY || y === H - BY - 1) {
        let ch = '═'
        if (x === BX && y === BY) ch = '╔'
        else if (x === W - BX - 1 && y === BY) ch = '╗'
        else if (x === BX && y === H - BY - 1) ch = '╚'
        else if (x === W - BX - 1 && y === H - BY - 1) ch = '╝'
        else if (x === BX || x === W - BX - 1) ch = '║'
        canvas.setCell(x, y, ch, INK_MED, PARCH_DK)
        continue
      }
      if (x === BX + 1 || x === W - BX - 2 || y === BY + 1 || y === H - BY - 2) {
        let ch = '─'
        if (x === BX + 1 && y === BY + 1) ch = '┌'
        else if (x === W - BX - 2 && y === BY + 1) ch = '┐'
        else if (x === BX + 1 && y === H - BY - 2) ch = '└'
        else if (x === W - BX - 2 && y === H - BY - 2) ch = '┘'
        else if (x === BX + 1 || x === W - BX - 2) ch = '│'
        canvas.setCell(x, y, ch, INK_LT, PARCH)
        continue
      }

      const i = y * W + x
      const b = bgArr[i]
      const d = ldArr[i]
      const e = evArr[i]
      const nx = (x - mx0) / mw
      const ny = (y - my0) / mh

      if (d > 0.025) {
        const inland = Math.min(d * 6, 1)
        if (e > 0.50 && inland > 0.25) {
          canvas.setCell(x, y, hash(x * 13, y * 17) > 0.5 ? '▲' : '^', MTN, b)
        } else if (e < 0.28 && inland > 0.12 && hash(x * 3, y * 5) > 0.72) {
          canvas.setCell(x, y, '♣', FOREST, b)
        } else {
          canvas.setCell(x, y, hash(x * 31, y * 37) > 0.93 ? '·' : ' ', INK_LT, b)
        }
      } else if (d > -0.008) {
        canvas.setCell(x, y, hash(x * 7, y * 11) > 0.35 ? '·' : ' ', INK, mix(b, SEA, 0.15))
      } else if (d > -0.04) {
        const w = Math.sin(nx * 18 + t * 0.4 + ny * 3) > 0.4
        canvas.setCell(x, y, w ? '·' : ' ', SEA_LT, mix(b, SEA, 0.25))
      } else {
        const depth = Math.min(1, (Math.abs(d) - 0.04) * 5)
        const seaBg = mix(b, SEA, 0.20 + depth * 0.25)
        const waveRow = (y - my0) + 200 + Math.sin(nx * 10 + t * 0.3) * 1.2
        const inBand = Math.floor(waveRow / 2.5) % 2 === 0
        if (inBand && Math.sin(nx * 20 + ny * 3 + t * 0.25) > -0.2) {
          canvas.setCell(x, y, '~', mix(INK_LT, SEA, 0.4), seaBg)
        } else {
          canvas.setCell(x, y, ' ', null, seaBg)
        }
      }
    }
  }

  // compass rose
  const rcx = mx0 + Math.floor(mw * 0.13)
  const rcy = my0 + Math.floor(mh * 0.14)
  const rose = [
    [0, -4, '▲', GOLD], [0, -3, 'N', GOLD],
    [0, 4, 'S', GOLD], [0, 3, '▼', GOLD],
    [-5, 0, 'W', GOLD], [5, 0, 'E', GOLD],
    [-4, 0, '━', GOLD], [-3, 0, '━', INK_MED],
    [-2, 0, '━', INK_MED], [-1, 0, '━', INK_MED],
    [1, 0, '━', INK_MED], [2, 0, '━', INK_MED],
    [3, 0, '━', INK_MED], [4, 0, '━', GOLD],
    [0, -2, '┃', INK_MED], [0, -1, '┃', INK_MED],
    [0, 1, '┃', INK_MED], [0, 2, '┃', INK_MED],
    [0, 0, '◆', GOLD],
    [-1, -1, '╲', INK_LT], [1, -1, '╱', INK_LT],
    [-1, 1, '╱', INK_LT], [1, 1, '╲', INK_LT],
    [-2, -2, '╲', INK_LT], [2, -2, '╱', INK_LT],
    [-2, 2, '╱', INK_LT], [2, 2, '╲', INK_LT],
  ]
  for (const [dx, dy, ch, fg] of rose) {
    const rx = rcx + dx, ry = rcy + dy
    if (rx >= mx0 && rx < mx0 + mw && ry >= my0 && ry < my0 + mh) {
      canvas.setCell(rx, ry, ch, fg, null)
    }
  }

  // title cartouche
  const ctxt = ' TERRA INCOGNITA '
  if (W > ctxt.length + 8) {
    const tx = Math.floor((W - ctxt.length) / 2)
    const ty = my0 + 2
    for (let j = 0; j < ctxt.length; j++) {
      canvas.setCell(tx + j, ty - 1, '═', GOLD_DK, PARCH_VDK)
      canvas.setCell(tx + j, ty + 1, '═', GOLD_DK, PARCH_VDK)
      canvas.setCell(tx + j, ty, ctxt[j], GOLD, PARCH_VDK)
    }
    canvas.setCell(tx - 1, ty - 1, '╔', GOLD_DK, PARCH_VDK)
    canvas.setCell(tx + ctxt.length, ty - 1, '╗', GOLD_DK, PARCH_VDK)
    canvas.setCell(tx - 1, ty, '║', GOLD_DK, PARCH_VDK)
    canvas.setCell(tx + ctxt.length, ty, '║', GOLD_DK, PARCH_VDK)
    canvas.setCell(tx - 1, ty + 1, '╚', GOLD_DK, PARCH_VDK)
    canvas.setCell(tx + ctxt.length, ty + 1, '╝', GOLD_DK, PARCH_VDK)
  }

  // dotted route from SW ocean to island
  const route = [
    [0.05, 0.70], [0.08, 0.68], [0.11, 0.66], [0.14, 0.64],
    [0.17, 0.62], [0.20, 0.60], [0.23, 0.58], [0.26, 0.56],
    [0.29, 0.54], [0.32, 0.52], [0.35, 0.50], [0.38, 0.48],
  ]
  for (let j = 0; j < route.length; j++) {
    const rx = mx0 + Math.floor(route[j][0] * mw)
    const ry = my0 + Math.floor(route[j][1] * mh)
    if (rx >= mx0 && rx < mx0 + mw && ry >= my0 && ry < my0 + mh) {
      canvas.setCell(rx, ry, j % 3 === 0 ? '•' : '·', ROUTE, null)
    }
  }
  const si = Math.floor((t * 0.12) % route.length)
  const sp = route[si]
  const sx = mx0 + Math.floor(sp[0] * mw)
  const sy = my0 + Math.floor(sp[1] * mh)
  if (sx >= mx0 && sx < mx0 + mw && sy >= my0 && sy < my0 + mh) {
    canvas.setCell(sx, sy, '▷', ROUTE, null)
  }

  // sea serpent in lower-right ocean
  for (let j = 0; j < 10; j++) {
    const snx = 0.65 + j * 0.02
    const sny = 0.72 + Math.sin(j * 0.8 + t * 0.5) * 0.025
    const spx = mx0 + Math.floor(snx * mw)
    const spy = my0 + Math.floor(sny * mh)
    if (spx >= mx0 && spx < mx0 + mw && spy >= my0 && spy < my0 + mh) {
      canvas.setCell(spx, spy, j === 0 ? '◉' : (j < 3 ? '●' : '•'), INK, null)
    }
  }

  // treasure X
  const xx = mx0 + Math.floor(mw * 0.55)
  const xy = my0 + Math.floor(mh * 0.40)
  const xPulse = 0.8 + 0.2 * Math.sin(t * 1.5)
  const xCol = c2h(160 * xPulse, 64 * xPulse, 48 * xPulse)
  if (xx > mx0 && xx < mx0 + mw - 1 && xy > my0 && xy < my0 + mh - 1) {
    canvas.setCell(xx - 1, xy - 1, '╲', xCol, null)
    canvas.setCell(xx + 1, xy - 1, '╱', xCol, null)
    canvas.setCell(xx, xy, '✗', xCol, null)
    canvas.setCell(xx - 1, xy + 1, '╱', xCol, null)
    canvas.setCell(xx + 1, xy + 1, '╲', xCol, null)
  }

  // labels
  stamp(canvas, mx0 + Math.floor(mw * 0.34), my0 + Math.floor(mh * 0.34),
        'Isle of Tempests', INK_MED, mx0, my0, mw, mh)
  stamp(canvas, mx0 + Math.floor(mw * 0.58), my0 + Math.floor(mh * 0.78),
        'Here Be Dragons', INK_LT, mx0, my0, mw, mh)

  // depth soundings
  const soundings = [
    [0.10, 0.50, '12'], [0.82, 0.40, '8'], [0.15, 0.82, '24'],
    [0.85, 0.68, '16'], [0.50, 0.88, '20'], [0.08, 0.22, '6'],
  ]
  for (const [snx, sny, txt] of soundings) {
    const sx2 = mx0 + Math.floor(snx * mw)
    const sy2 = my0 + Math.floor(sny * mh)
    const idx = sy2 * W + sx2
    if (idx >= 0 && idx < ldArr.length && ldArr[idx] < -0.04) {
      stamp(canvas, sx2, sy2, txt, INK_LT, mx0, my0, mw, mh)
    }
  }
}

function stamp(canvas, x, y, text, fg, mx0, my0, mw, mh) {
  for (let i = 0; i < text.length; i++) {
    const px = x + i
    if (px >= mx0 && px < mx0 + mw && y >= my0 && y < my0 + mh) {
      canvas.setCell(px, y, text[i], fg, null)
    }
  }
}

export function render(canvas, data, state) { draw(canvas, state) }

export function update(canvas, data, frame, state) {
  state.t = frame.elapsed
  draw(canvas, state)
}
