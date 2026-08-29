import { lerp, lerpMulti, BLOCK } from '../src/theme.js'

export const title = 'Ink Mountains'
export const description = 'A misty landscape in the spirit of sumi-e — where mountains dissolve into silence'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function col(r, g, b) {
  const h = n => Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
  return '#' + h(r) + h(g) + h(b)
}

export function setup(canvas) {
  const rng = srand(830)

  const configs = [
    { base: 0.22, amp: 0.07, tone: 18 },
    { base: 0.30, amp: 0.09, tone: 28 },
    { base: 0.39, amp: 0.11, tone: 42 },
    { base: 0.49, amp: 0.13, tone: 62 },
    { base: 0.60, amp: 0.10, tone: 82 },
  ]

  const layers = configs.map(cfg => {
    const harmonics = []
    for (let j = 0; j < 4; j++) {
      harmonics.push({
        a: (0.35 + rng() * 0.65) / (j * 0.6 + 1),
        f: (0.006 + rng() * 0.014) * (j + 1),
        p: rng() * 500,
      })
    }
    return { ...cfg, harmonics }
  })

  const mists = []
  for (let i = 0; i < 12; i++) {
    mists.push({
      cx: rng() * 1.4 - 0.2,
      cy: 0.24 + rng() * 0.38,
      rx: 0.06 + rng() * 0.16,
      ry: 0.006 + rng() * 0.018,
      sp: (rng() - 0.5) * 0.006,
      op: 0.15 + rng() * 0.3,
    })
  }

  const birds = []
  for (let i = 0; i < 5; i++) {
    birds.push({
      x: rng(), y: 0.08 + rng() * 0.12,
      sp: 0.004 + rng() * 0.006,
      wp: rng() * Math.PI * 2,
      ws: 1.2 + rng() * 0.8,
    })
  }

  const trees = []
  for (let i = 0; i < 14; i++) {
    trees.push({
      xr: rng(),
      li: 3 + Math.floor(rng() * 2),
      ht: 3 + Math.floor(rng() * 5),
    })
  }

  return { layers, mists, birds, trees, waterT: 0.71 }
}

function ridge(harmonics, x) {
  let v = 0
  for (const h of harmonics) v += h.a * Math.sin((x + h.p) * h.f)
  return v
}

function draw(c, s, t) {
  const w = c.width, h = c.height
  const wl = Math.floor(s.waterT * h)

  for (let y = 0; y < h; y++) {
    const bg = y < wl
      ? col(8 + (y / wl) * 5, 9 + (y / wl) * 6, 14 + (y / wl) * 5)
      : col(6, 7, 11)
    for (let x = 0; x < w; x++) c.setCell(x, y, ' ', null, bg)
  }

  const mx = Math.floor(0.20 * w), my = Math.floor(0.07 * h)
  for (let dy = -14; dy <= 14; dy++) {
    for (let dx = -14; dx <= 14; dx++) {
      const px = mx + dx, py = my + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const d = Math.sqrt(dx * dx + (dy * 1.3) * (dy * 1.3))
      if (d > 14) continue
      const f = Math.pow(1 - d / 14, 3) * 0.07
      if (f < 0.002) continue
      const cell = c.getCell(px, py)
      if (cell && cell.bg) c.setCell(px, py, ' ', null, lerp(cell.bg, '#c8c0a0', f))
    }
  }
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const d = Math.sqrt(dx * dx + (dy * 1.5) * (dy * 1.5))
      if (d > 3) continue
      const px = mx + dx, py = my + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const bri = 0.35 + (1 - d / 3) * 0.4
      c.setCell(px, py, d < 1.2 ? BLOCK.full : BLOCK.light,
        col(Math.floor(180 * bri), Math.floor(170 * bri), Math.floor(140 * bri)))
    }
  }

  for (const layer of s.layers) {
    const baseY = Math.floor(layer.base * h)
    const ampPx = Math.floor(layer.amp * h)
    for (let x = 0; x < w; x++) {
      const p = ridge(layer.harmonics, x)
      const peakY = baseY - Math.floor(p * ampPx)
      const pn = ridge(layer.harmonics, x + 1)
      const slope = pn - p
      for (let y = Math.max(0, peakY); y < wl; y++) {
        const depth = (y - peakY) / Math.max(1, wl - peakY)
        let ink = layer.tone * (1 - depth * 0.4)
        ink += slope * layer.tone * 0.6
        ink = Math.max(8, Math.min(150, ink))
        c.setCell(x, y, ' ', null, col(ink, ink - 1, ink - 3))
      }
    }
  }

  for (let li = s.layers.length - 1; li >= 0; li--) {
    const layer = s.layers[li]
    const baseY = Math.floor(layer.base * h)
    const ampPx = Math.floor(layer.amp * h)
    for (let x = 0; x < w; x++) {
      const ripple = Math.sin(x * 0.08 + t * 0.5) * 1.5
      const p = ridge(layer.harmonics, x + ripple)
      const peakY = baseY - Math.floor(p * ampPx)
      const reflY = 2 * wl - peakY
      for (let y = wl + 1; y < Math.min(h, reflY); y++) {
        const dist = (y - wl) / Math.max(1, h - wl)
        let ink = layer.tone * 0.22 * (1 - dist * 0.7)
        ink += Math.sin(x * 0.12 + y * 0.2 + t * 0.7) * 2
        ink = Math.max(5, Math.min(35, ink))
        c.setCell(x, y, ' ', null, col(ink - 1, ink, ink + 3))
      }
    }
  }

  for (let x = 0; x < w; x++) {
    const sh = Math.sin(x * 0.12 + t * 0.5) * 0.3 + 0.5
    if (sh > 0.4) {
      const bri = Math.floor(16 + sh * 20)
      c.setCell(x, wl, sh > 0.65 ? '─' : '╌', col(bri, bri + 1, bri + 4))
    }
  }

  for (const tr of s.trees) {
    if (tr.li >= s.layers.length) continue
    const layer = s.layers[tr.li]
    const tx = Math.floor(tr.xr * w)
    if (tx < 5 || tx >= w - 5) continue
    const baseY = Math.floor(layer.base * h)
    const ampPx = Math.floor(layer.amp * h)
    const p = ridge(layer.harmonics, tx)
    const gy = baseY - Math.floor(p * ampPx)
    if (gy >= wl - 1 || gy < 4) continue

    const ink = Math.min(170, layer.tone * 1.5)
    for (let dy = 0; dy < 2; dy++) {
      const yy = gy - dy
      if (yy >= 0 && yy < h) c.setCell(tx, yy, '│', col(ink, ink - 5, ink - 10))
    }
    for (let cl = 0; cl < tr.ht; cl++) {
      const cy = gy - 2 - cl
      if (cy < 1) break
      const spread = Math.max(1, Math.floor((tr.ht - cl) * 0.7))
      for (let dx = -spread; dx <= spread; dx++) {
        const px = tx + dx
        if (px < 4 || px >= w - 4) continue
        const edge = Math.abs(dx) / Math.max(1, spread)
        if (edge > 0.85 && cl > 1) continue
        const ci = Math.max(15, Math.min(170, ink * (0.9 + cl * 0.03) * (1 - edge * 0.4)))
        const ch = cl === 0 && dx === 0 ? '▲' : (edge < 0.4 ? BLOCK.dark : BLOCK.light)
        c.setCell(px, cy, ch, col(ci - 8, ci + 2, ci - 12))
      }
    }
  }

  for (const m of s.mists) {
    let cx = (m.cx + t * m.sp)
    cx = cx - Math.floor(cx / 1.6) * 1.6
    if (cx > 1.3) continue
    const mcx = Math.floor(cx * w), mcy = Math.floor(m.cy * h)
    const mrx = Math.floor(m.rx * w), mry = Math.max(1, Math.floor(m.ry * h))
    const top = Math.max(0, mcy - mry * 2), bot = Math.min(wl, mcy + mry * 2)
    const left = Math.max(0, mcx - mrx), right = Math.min(w, mcx + mrx)
    for (let y = top; y < bot; y++) {
      const ny = (y - mcy) / (mry * 2)
      for (let x = left; x < right; x++) {
        const nx = (x - mcx) / mrx
        const d = nx * nx + ny * ny
        if (d > 1) continue
        const fade = Math.pow(1 - d, 2.5) * m.op
        if (fade < 0.008) continue
        const cell = c.getCell(x, y)
        if (cell && cell.bg) c.setCell(x, y, ' ', null, lerp(cell.bg, '#0e0f16', fade))
      }
    }
  }

  for (const b of s.birds) {
    let bx = (b.x + t * b.sp) % 1.3
    if (bx > 1.1) continue
    const by = b.y + Math.sin(t * 0.15 + b.wp) * 0.008
    const px = Math.floor(bx * w), py = Math.floor(by * h)
    if (px < 4 || px >= w - 5 || py < 1 || py >= wl) continue
    const wing = Math.sin(t * b.ws + b.wp)
    const bri = 50 + Math.floor(Math.abs(wing) * 25)
    const fc = col(bri, bri - 2, bri - 5)
    if (wing > 0) {
      c.setCell(px - 1, py - 1, '·', fc)
      c.setCell(px, py, '·', fc)
      c.setCell(px + 1, py - 1, '·', fc)
    } else {
      c.setCell(px - 1, py, '·', fc)
      c.setCell(px, py, '·', fc)
      c.setCell(px + 1, py, '·', fc)
    }
  }

  const bx = Math.floor(w * 0.55 + Math.sin(t * 0.12) * 2)
  const by = wl + 4
  if (by < h - 5 && bx > 4 && bx < w - 5) {
    const bc = n => col(n, n - 2, n - 5)
    c.setCell(bx - 1, by, '╱', bc(42))
    c.setCell(bx, by, '─', bc(48))
    c.setCell(bx + 1, by, '╲', bc(42))
    c.setCell(bx, by - 1, '│', bc(52))
    c.setCell(bx, by - 2, '·', bc(58))
  }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }
