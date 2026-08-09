import { lerpMulti, lerp } from '../src/theme.js'

export const title = 'Living Light'
export const description = 'Bioluminescent plankton paint the midnight tide in strokes of liquid neon'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function hash(x, y, s) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + s * 43.185) * 43758.5453
  return n - Math.floor(n)
}

const SKY = ['#010306', '#020610', '#030918', '#050c20', '#071028']
const OCEAN_BG = ['#020508', '#030810', '#040b16', '#050e1e', '#071226', '#09162e']
const BIO = ['#006655', '#008877', '#00aa99', '#00ccbb', '#00eedd']
const BIO_HI = ['#44ffee', '#77ffff', '#aaffff', '#ddffff']
const SAND_WET = ['#080705', '#0c0b08', '#100f0a', '#14130c']
const SAND_DRY = ['#16140e', '#1a1812', '#1e1c16', '#22201a']

export function setup(canvas) {
  const rng = srand(810)
  const w = canvas.width
  const h = canvas.height
  const skyH = Math.floor(h * 0.24)

  const stars = []
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: 3 + Math.floor(rng() * Math.max(1, skyH - 4)),
      b: 0.2 + rng() * 0.8,
      ph: rng() * 6.283,
      sp: 0.2 + rng() * 0.8,
    })
  }

  const sparkles = []
  const shoreY = Math.floor(h * 0.78)
  const beachY = Math.floor(h * 0.86)
  for (let i = 0; i < 50; i++) {
    sparkles.push({
      x: Math.floor(rng() * w),
      y: shoreY + Math.floor(rng() * (beachY - shoreY)),
      ph: rng() * 6.283,
      sp: 0.6 + rng() * 1.4,
    })
  }

  return { stars, sparkles, t: 0 }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  state.t = frame.elapsed
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height

  const skyEnd = Math.floor(h * 0.24)
  const shoreY = Math.floor(h * 0.78)
  const beachY = Math.floor(h * 0.86)

  // --- Sky ---
  for (let y = 0; y < skyEnd; y++) {
    const bg = lerpMulti(SKY, y / Math.max(1, skyEnd - 1))
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, bg)
    }
  }

  // Stars
  for (const s of state.stars) {
    const tw = Math.sin(t * s.sp + s.ph)
    const b = s.b * (0.55 + 0.45 * tw)
    if (b > 0.2) {
      const v = Math.min(255, Math.floor(80 + b * 175))
      const vb = Math.min(255, Math.floor(v * 0.85))
      const col = '#' + hex2(v) + hex2(v) + hex2(vb)
      canvas.setCell(s.x, s.y, b > 0.65 ? '·' : '.', col)
    }
  }

  // Horizon glow — faint teal band where sky meets ocean
  const hzY = skyEnd
  for (let dy = -1; dy <= 1; dy++) {
    const row = hzY + dy
    if (row < 0 || row >= h) continue
    const intensity = 1 - Math.abs(dy) * 0.5
    const bg = lerp('#071028', '#0a1a2a', intensity * 0.3)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, row, ' ', null, bg)
    }
  }

  // --- Ocean with bioluminescent wave crests ---
  const oceanDepth = beachY - skyEnd
  for (let y = skyEnd; y < beachY; y++) {
    const op = (y - skyEnd) / Math.max(1, oceanDepth)
    const baseBg = lerpMulti(OCEAN_BG, op)

    for (let x = 0; x < w; x++) {
      let glow = 0

      for (let i = 0; i < 8; i++) {
        const speed = 1.8 + i * 0.5
        const freq = 0.025 + i * 0.007
        const phaseOff = i * 0.785

        const rawPos = ((t * speed + i * oceanDepth / 8) % oceanDepth + oceanDepth) % oceanDepth
        const waveBase = skyEnd + rawPos
        const waveY = waveBase + Math.sin(x * freq + phaseOff + t * 0.12) * 1.3

        const dist = Math.abs(y - waveY)
        if (dist < 2.0) {
          const posInOcean = rawPos / oceanDepth
          const fadeIn = Math.min(1, posInOcean * 4)
          const shoreBoost = 0.12 + posInOcean * 0.88
          const strength = Math.max(0, 1 - dist / 2.0) * fadeIn * shoreBoost
          glow = Math.max(glow, strength)
        }
      }

      let ch = ' ', fg = null, bg = baseBg

      if (glow > 0.06) {
        bg = lerp(baseBg, '#001814', Math.min(1, glow * 0.5))

        if (glow > 0.6) {
          ch = hash(x, y, Math.floor(t * 2)) < 0.35 ? '≈' : '~'
          fg = lerpMulti(BIO_HI, Math.min(1, (glow - 0.6) / 0.4))
        } else if (glow > 0.3) {
          ch = '~'
          fg = lerpMulti(BIO, Math.min(1, (glow - 0.3) / 0.3))
        } else {
          if (hash(x, y, Math.floor(t)) < 0.4) {
            ch = '·'
            fg = lerpMulti(BIO, Math.min(1, glow * 2.5))
          }
        }
      }

      canvas.setCell(x, y, ch, fg, bg)
    }
  }

  // --- Shore sparkles (breaking wave zone) ---
  for (const sp of state.sparkles) {
    const pulse = Math.sin(t * sp.sp + sp.ph)
    if (pulse > 0.3) {
      const intensity = (pulse - 0.3) / 0.7
      const col = lerpMulti(BIO_HI, Math.min(1, intensity))
      canvas.setCell(sp.x, sp.y, '✦', col)
    }
  }

  // Extra foam glow patterns in shore zone
  for (let y = shoreY; y < beachY; y++) {
    const zp = (y - shoreY) / Math.max(1, beachY - shoreY)
    for (let x = 0; x < w; x++) {
      const cell = canvas.getCell(x, y)
      if (cell && cell.char !== ' ' && cell.char !== '✦') continue

      const foam = Math.sin(x * 0.055 + t * 0.7) * 0.28 +
                   Math.sin(x * 0.095 - t * 0.45 + 1.7) * 0.22 +
                   Math.sin(x * 0.16 + t * 0.28 + 3.1) * 0.14 + 0.5

      const strength = Math.max(0, foam) * (1 - zp * 0.7)
      if (strength > 0.5 && hash(x, y, Math.floor(t * 2)) < strength * 0.2) {
        const col = lerpMulti(BIO, Math.min(1, strength))
        const bg = lerp(lerpMulti(OCEAN_BG, 0.85 + zp * 0.15), '#001a16', strength * 0.3)
        canvas.setCell(x, y, '·', col, bg)
      }
    }
  }

  // --- Beach ---
  for (let y = beachY; y < h; y++) {
    const bp = (y - beachY) / Math.max(1, h - beachY - 1)
    const bg = lerpMulti([...SAND_WET, ...SAND_DRY], Math.min(1, bp))

    for (let x = 0; x < w; x++) {
      let ch = ' ', fg = null

      if (bp < 0.3) {
        const ref = Math.sin(x * 0.07 + t * 0.12 + y * 0.11) * 0.5 + 0.5
        if (ref > 0.72 && hash(x, y, Math.floor(t * 0.4)) < 0.05) {
          ch = '·'
          const ri = (ref - 0.72) / 0.28 * (1 - bp / 0.3)
          fg = lerp('#002a1a', '#005540', ri)
        }
      }

      canvas.setCell(x, y, ch, fg, bg)
    }
  }
}

function hex2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}
