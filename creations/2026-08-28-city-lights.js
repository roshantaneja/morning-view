import { lerpMulti, BLOCK, SHADE } from '../src/theme.js'

export const title = 'City of Stars'
export const description = 'A million windows keep their vigil as the river carries their light downstream'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

export function setup(canvas, data) {
  const w = canvas.width, h = canvas.height
  const rng = srand(828)
  const horizon = Math.floor(h * 0.55)

  const far = []
  let fx = 0
  while (fx < w) {
    const fw = 3 + Math.floor(rng() * 6)
    const fh = Math.floor(h * 0.02 + rng() * h * 0.1)
    far.push({ x: fx, y: horizon - fh, w: fw })
    fx += fw
  }

  const near = []
  let bx = 0
  while (bx < w) {
    const bw = 5 + Math.floor(rng() * 11)
    const hf = rng()
    const bh = Math.floor(h * 0.06 + hf * hf * h * 0.4)
    const shade = 10 + Math.floor(rng() * 16)
    const top = horizon - bh
    const wins = []
    for (let wy = top + 2; wy < horizon - 2; wy += 2) {
      for (let wx = bx + 1; wx < bx + bw - 1; wx += 2) {
        if (rng() < 0.5) {
          const t = rng()
          const r = t < 0.55 ? 210 + Math.floor(rng() * 45)
            : t < 0.8 ? 175 + Math.floor(rng() * 50)
            : 230 + Math.floor(rng() * 25)
          const g = t < 0.55 ? 160 + Math.floor(rng() * 55)
            : t < 0.8 ? 180 + Math.floor(rng() * 50)
            : 125 + Math.floor(rng() * 50)
          const b = t < 0.55 ? 35 + Math.floor(rng() * 50)
            : t < 0.8 ? 195 + Math.floor(rng() * 55)
            : 25 + Math.floor(rng() * 30)
          wins.push({ x: wx, y: wy, r, g, b, fp: rng() * 200, fr: rng() })
        }
      }
    }
    near.push({ x: bx, y: top, w: bw, h: bh, shade, wins })
    bx += bw + Math.floor(rng() * 2)
  }

  const stars = []
  for (let i = 0; i < Math.floor(w * 0.5); i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * horizon * 0.55),
      b: 0.3 + rng() * 0.7,
      sp: 0.4 + rng() * 2,
      ph: rng() * Math.PI * 2,
    })
  }

  return {
    far, near, stars, horizon,
    moonX: Math.floor(w * 0.78),
    moonY: Math.floor(h * 0.09),
  }
}

function draw(canvas, st, t) {
  const w = canvas.width, h = canvas.height
  const { far, near, stars, horizon, moonX, moonY } = st

  for (let y = 0; y < horizon; y++) {
    const f = y / horizon
    const c = lerpMulti(['#020010', '#040020', '#080035', '#0e0850', '#161060'], f)
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, c)
  }

  for (const s of stars) {
    const tw = Math.sin(t * s.sp + s.ph)
    const b = s.b + tw * 0.25
    if (b > 0.25) {
      const v = Math.floor(130 + b * 125)
      canvas.setCell(s.x, s.y, b > 0.7 ? '✦' : '·', col(v, v, Math.min(255, v + 15)))
    }
  }

  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const d1 = Math.sqrt(dx * dx + dy * dy)
      const d2 = Math.sqrt((dx + 1.8) * (dx + 1.8) + dy * dy)
      if (d1 <= 3 && d2 > 2.5) {
        const mx = moonX + dx, my = moonY + dy
        if (mx >= 0 && mx < w && my >= 0 && my < horizon) {
          const v = 210 + Math.floor((1 - d1 / 3) * 45)
          canvas.setCell(mx, my, BLOCK.full, col(v, v, Math.floor(v * 0.8)))
        }
      }
    }
  }
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 3 && d <= 5.5) {
        const mx = moonX + dx, my = moonY + dy
        if (mx >= 0 && mx < w && my >= 0 && my < horizon) {
          const cell = canvas.getCell(mx, my)
          if (cell && cell.char === ' ') {
            const gv = (1 - (d - 3) / 2.5) * 22
            canvas.setCell(mx, my, '·', col(Math.floor(gv) + 6, Math.floor(gv) + 6, Math.floor(gv) + 12))
          }
        }
      }
    }
  }

  for (let y = Math.max(0, horizon - 6); y < horizon; y++) {
    const g = (y - horizon + 6) / 6
    const gv = g * g * 0.12
    for (let x = 0; x < w; x++) {
      const cell = canvas.getCell(x, y)
      if (cell && cell.char === ' ') {
        canvas.setCell(x, y, ' ', null, col(
          Math.floor(gv * 100 + 5), Math.floor(gv * 60 + 3), Math.floor(gv * 120 + 8)
        ))
      }
    }
  }

  for (const fb of far) {
    for (let y = fb.y; y < horizon; y++) {
      for (let x = fb.x; x < fb.x + fb.w && x < w; x++) {
        canvas.setCell(x, y, ' ', null, '#13111f')
      }
    }
  }

  for (const b of near) {
    const s = b.shade
    for (let y = Math.max(0, b.y); y < horizon; y++) {
      for (let x = b.x; x < b.x + b.w && x < w; x++) {
        const edge = x === b.x || x === b.x + b.w - 1
        if (edge) {
          canvas.setCell(x, y, '│', col(s + 10, s + 8, s + 16), col(s, s, s + 5))
        } else {
          canvas.setCell(x, y, ' ', null, col(s, s - 1, s + 5))
        }
      }
    }
    if (b.y >= 0) {
      for (let x = b.x; x < b.x + b.w && x < w; x++) {
        canvas.setCell(x, b.y, '▀', col(s + 12, s + 10, s + 20))
      }
    }
    for (const win of b.wins) {
      const fl = Math.sin(t * 2.5 + win.fp)
      if (!(win.fr > 0.85 && fl > 0.88) && win.x < w && win.y >= 0 && win.y < h) {
        canvas.setCell(win.x, win.y, BLOCK.full, col(win.r, win.g, win.b))
      }
    }
  }

  for (let y = horizon; y < h; y++) {
    const f = (y - horizon) / (h - horizon)
    for (let x = 0; x < w; x++) {
      const wv = Math.sin(x * 0.15 + t * 0.5 + y * 0.35)
      const r = 3 + Math.floor(wv * 2)
      const g = 3 + Math.floor(wv * 2)
      const b = 10 + Math.floor(wv * 3 + f * 6)
      const ch = wv > 0.75 ? '~' : wv > 0.45 ? '─' : ' '
      canvas.setCell(x, y, ch, col(r + 6, g + 6, b + 10), col(r, g, b))
    }
  }

  for (const bldg of near) {
    for (const win of bldg.wins) {
      const fl = Math.sin(t * 2.5 + win.fp)
      if (win.fr > 0.85 && fl > 0.88) continue
      const distUp = horizon - win.y
      if (distUp < 1) continue
      const streakLen = Math.min(8, Math.floor(1 + distUp * 0.2))
      for (let dy = 0; dy < streakLen; dy++) {
        const ry = horizon + Math.floor(distUp * 0.25) + dy
        if (ry >= h - 3 || ry < horizon) break
        const fade = dy / streakLen
        const dim = (1 - fade) * 0.22
        const woff = Math.floor(Math.sin(t * 0.6 + dy * 0.4 + win.fp * 0.05) * (0.5 + dy * 0.12))
        const rx = win.x + woff
        if (rx < 0 || rx >= w) continue
        const rr = Math.floor(win.r * dim)
        const rg = Math.floor(win.g * dim)
        const rb = Math.floor(win.b * dim)
        if (rr > 3 || rg > 3 || rb > 3) {
          canvas.setCell(rx, ry, fade < 0.35 ? SHADE[1] : SHADE[0], col(rr, rg, rb))
        }
      }
    }
  }

  for (let x = 0; x < w; x++) {
    canvas.setCell(x, horizon, '▁', col(8, 8, 18))
  }
}

export function render(canvas, data, state) {
  draw(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  draw(canvas, state, frame.elapsed)
}
