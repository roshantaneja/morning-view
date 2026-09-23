import { hex, bgHex, lerpMulti, SHADE } from '../src/theme.js'

export const title = 'Slot Canyon'
export const description = 'Ancient water carved these curves one grain at a time — now sunlight traces the path the river once walked'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + clamp(r).toString(16).padStart(2, '0')
             + clamp(g).toString(16).padStart(2, '0')
             + clamp(b).toString(16).padStart(2, '0')
}

const STONE = [
  [193, 120, 64],
  [215, 155, 110],
  [168, 88, 48],
  [235, 188, 140],
  [184, 104, 64],
  [208, 140, 84],
  [225, 172, 118],
  [144, 80, 40],
  [242, 205, 158],
  [186, 104, 56],
]

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(924)

  const gl = new Float64Array(H)
  const gr = new Float64Array(H)

  for (let y = 0; y < H; y++) {
    const t = y / H
    const width = 2 + Math.pow(t, 1.6) * W * 0.52
    const cx = W * 0.50 + Math.sin(t * 3.0 + 0.5) * W * 0.045
                        + Math.sin(t * 6.8 + 2.1) * W * 0.025
    const half = Math.max(1, width / 2)
    const wL = Math.sin(t * 8.5 + 1.2) * W * 0.018
             + Math.sin(t * 14.0 + 3.5) * W * 0.007
    const wR = Math.sin(t * 9.2 + 2.8) * W * 0.018
             + Math.sin(t * 13.0 + 0.9) * W * 0.007
    gl[y] = Math.max(0, cx - half + wL)
    gr[y] = Math.min(W - 1, cx + half + wR)
  }

  const motes = []
  for (let i = 0; i < 55; i++) {
    motes.push({
      rx: 0.12 + rng() * 0.76,
      y0: rng() * H,
      dx: (rng() - 0.5) * 2.0,
      dy: 0.12 + rng() * 0.5,
      ph: rng() * TAU,
      br: 0.3 + rng() * 0.7,
    })
  }

  return { W, H, gl, gr, motes }
}

export function render(canvas, data, state) { drawScene(canvas, state, 0) }
export function update(canvas, data, frame, state) { drawScene(canvas, state, frame.elapsed) }

function getStone(x, y) {
  const w = Math.sin(x * 0.020 + 0.7) * 6
          + Math.sin(x * 0.050 + y * 0.004 + 1.3) * 4
          + Math.sin(x * 0.008 - y * 0.003) * 9
          + Math.sin(x * 0.035 + y * 0.007 + 2.6) * 2.5
  const by = y + w
  const v = (Math.sin(by * 0.055) + Math.sin(by * 0.10 + 1.2) + Math.sin(by * 0.17 + 2.5)) / 3
  const t = (v + 1) / 2
  const idx = t * (STONE.length - 1)
  const i = Math.min(Math.floor(idx), STONE.length - 2)
  const f = idx - i
  return [
    STONE[i][0] + (STONE[i + 1][0] - STONE[i][0]) * f,
    STONE[i][1] + (STONE[i + 1][1] - STONE[i][1]) * f,
    STONE[i][2] + (STONE[i + 1][2] - STONE[i][2]) * f,
  ]
}

function drawScene(canvas, state, t) {
  const { W, H, gl, gr, motes } = state

  const beamAngle = Math.sin(t * 0.08) * 0.3
  const beamOriginX = (gl[0] + gr[0]) / 2
  const skyRows = Math.floor(H * 0.05)
  const floorStart = Math.floor(H * 0.92)

  for (let y = 0; y < H; y++) {
    const glY = gl[y]
    const grY = gr[y]
    const yf = y / H
    const beamX = beamOriginX + y * beamAngle

    for (let x = 0; x < W; x++) {
      const inGap = x >= glY && x <= grY

      if (inGap) {
        if (y < skyRows) {
          const sc = lerpMulti(['#4488cc', '#7faabb', '#ccbb99', '#ffdda8'], y / Math.max(1, skyRows))
          canvas.setCell(x, y, ' ', null, bgHex(sc))
        } else {
          const depth = (yf - 0.05) / 0.95
          const base = Math.max(0.03, 1 - depth * 0.88)
          const dB = Math.abs(x - beamX)
          const gapW = Math.max(1, grY - glY)
          const focus = Math.exp(-dB * dB / (gapW * gapW * 0.4 + 8))
          const li = base * (0.35 + 0.65 * focus)
          canvas.setCell(x, y, ' ', null, bgHex(c2h(
            250 * li + 5,
            218 * li + 5,
            140 * li + 4
          )))
        }
      } else {
        const dist = x < glY ? glY - x : x - grY
        const [sr, sg, sb] = getStone(x, y)

        const reach = W * 0.38
        const ambient = Math.pow(Math.max(0, 1 - dist / reach), 2.2)
        const depthFade = Math.max(0.05, 1 - yf * 0.6)

        const dB = Math.abs(x - beamX)
        const beamOnWall = dist < 8
          ? Math.exp(-dB * dB / 180) * Math.max(0, 1 - dist / 8) * depthFade
          : 0

        const totalLight = ambient * 0.6 * depthFade + beamOnWall * 0.55 + 0.05

        const warmth = beamOnWall * 0.45
        let r = sr * totalLight + warmth * 90
        let g = sg * totalLight + warmth * 45
        let b = sb * totalLight + warmth * 8

        if (y >= floorStart) {
          const floorT = (y - floorStart) / (H - floorStart)
          const sandR = 160 * totalLight + warmth * 60
          const sandG = 130 * totalLight + warmth * 30
          const sandB = 90 * totalLight + warmth * 5
          r = r + (sandR - r) * floorT * 0.6
          g = g + (sandG - g) * floorT * 0.6
          b = b + (sandB - b) * floorT * 0.6
        }

        const grain = Math.sin(x * 3.7 + y * 2.3) * Math.sin(x * 1.9 - y * 4.1)
        let ch = ' '
        if (totalLight > 0.08 && totalLight < 0.18 && grain > 0.2) {
          ch = SHADE[0]
          canvas.setCell(x, y, ch, hex(c2h(r * 1.4, g * 1.4, b * 1.4)), bgHex(c2h(r, g, b)))
        } else {
          canvas.setCell(x, y, ' ', null, bgHex(c2h(r, g, b)))
        }
      }
    }
  }

  for (const m of motes) {
    const my = ((m.y0 + t * m.dy * 5) % (H * 0.85)) + H * 0.06
    const iy = Math.floor(my)
    if (iy < skyRows || iy >= H - 3) continue

    const glI = gl[iy], grI = gr[iy]
    const gw = grI - glI
    if (gw < 2) continue

    const mx = Math.round(glI + m.rx * gw + Math.sin(t * 0.35 + m.ph) * m.dx * 2)
    if (mx <= glI + 1 || mx >= grI - 1) continue

    const twinkle = 0.4 + 0.6 * Math.sin(t * 1.5 + m.ph)
    if (twinkle < 0.3) continue

    const depthDim = Math.max(0.15, 1 - (iy / H) * 0.75)
    const v = (180 + 75 * twinkle) * depthDim * m.br
    canvas.setCell(mx, iy, twinkle > 0.7 ? '·' : '.', hex(c2h(v + 30, v, Math.max(0, v - 50))))
  }
}
