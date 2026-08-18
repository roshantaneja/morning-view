import { lerp, lerpMulti, SHADE } from '../src/theme.js'

export const title = 'Sunflower Field'
export const description = 'A sea of gold turns to face the morning — late summer warm and wide'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) {
  return Math.max(0, Math.min(255, Math.floor(n))).toString(16).padStart(2, '0')
}

function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const SKY = ['#5588bb', '#6699cc', '#88bbcc', '#aabb99', '#ccbb77', '#ddaa55', '#eebb44']
const EARTH = ['#8a7a30', '#7a6a28', '#695a20', '#584a18', '#474012', '#3a340e']

export function setup(canvas) {
  const rng = srand(819)
  const w = canvas.width, h = canvas.height

  const flowers = []
  const defs = [
    { gf: 0.37, sz: 0.7,  n: 24, sh: 2  },
    { gf: 0.42, sz: 1.0,  n: 20, sh: 3  },
    { gf: 0.48, sz: 1.5,  n: 15, sh: 5  },
    { gf: 0.55, sz: 2.2,  n: 10, sh: 8  },
    { gf: 0.64, sz: 3.0,  n: 7,  sh: 12 },
    { gf: 0.75, sz: 4.0,  n: 5,  sh: 17 },
    { gf: 0.88, sz: 5.2,  n: 3,  sh: 22 },
  ]

  for (const d of defs) {
    for (let i = 0; i < d.n; i++) {
      flowers.push({
        xf: 0.04 + rng() * 0.92,
        gf: d.gf + (rng() - 0.5) * 0.015,
        sz: d.sz * (0.85 + rng() * 0.3),
        sh: Math.floor(d.sh * (0.8 + rng() * 0.4)),
        ph: rng() * 6.28,
        ss: 0.2 + rng() * 0.3,
        sa: Math.max(0.2, d.sz * 0.12 + rng() * 0.3),
        pc: lerpMulti(['#ffcc22', '#ffbb11', '#eeaa00', '#ffdd44'], rng()),
        cc: lerpMulti(['#443311', '#553322', '#332211'], rng()),
        sc: lerpMulti(['#336622', '#447733', '#2a5518'], rng()),
        ls: rng() > 0.5 ? 1 : -1,
        lf: 0.3 + rng() * 0.3,
        hl: d.sz >= 2.2,
        wo: rng() * 4,
      })
    }
  }
  flowers.sort((a, b) => a.gf - b.gf)

  const clouds = []
  for (let i = 0; i < 5; i++) {
    clouds.push({
      cx: rng() * w, cy: Math.floor(h * (0.04 + rng() * 0.10)),
      cw: 6 + Math.floor(rng() * 12), ch: 1 + Math.floor(rng() * 2),
      dr: 0.2 + rng() * 0.4, dn: 0.03 + rng() * 0.04,
    })
  }

  const bees = []
  for (let i = 0; i < 5; i++) {
    bees.push({
      bx: 0.1 + rng() * 0.8, by: 0.32 + rng() * 0.38,
      sp: 0.4 + rng() * 0.8, ph: rng() * 6.28,
      ax: 5 + rng() * 10, ay: 2 + rng() * 5,
    })
  }

  return { flowers, clouds, bees }
}

export function render(c, data, st) { drawScene(c, st, 0) }
export function update(c, data, frame, st) { drawScene(c, st, frame.elapsed) }

function drawScene(c, s, t) {
  const w = c.width, h = c.height
  drawBg(c, w, h)
  drawClouds(c, w, h, s.clouds, t)
  drawGlow(c, w, h)
  drawHaze(c, w, h, t)
  for (const f of s.flowers) drawFlower(c, w, h, f, t)
  drawBees(c, w, h, s.bees, t)
}

function drawBg(c, w, h) {
  const skyH = Math.floor(h * 0.34)
  for (let y = 0; y < h; y++) {
    if (y < skyH) {
      const bg = lerpMulti(SKY, y / Math.max(1, skyH - 1))
      for (let x = 0; x < w; x++) c.setCell(x, y, ' ', null, bg)
    } else {
      const gf = (y - skyH) / Math.max(1, h - skyH - 1)
      const base = lerpMulti(EARTH, gf)
      for (let x = 0; x < w; x++) {
        const n = Math.sin(x * 0.1 + y * 0.06) * 0.5
          + Math.sin(x * 0.22 - y * 0.13) * 0.3
        const bg = lerp(base, '#2a2008', n * 0.12 + 0.05)
        if (gf > 0.35 && n > 0.35) {
          c.setCell(x, y, '░', lerp('#446622', '#335518', gf), bg)
        } else {
          c.setCell(x, y, ' ', null, bg)
        }
      }
    }
  }
}

function drawGlow(c, w, h) {
  const sx = Math.floor(w * 0.42), sy = Math.floor(h * 0.06)
  const R = Math.floor(Math.min(w, h) * 0.20)
  for (let y = Math.max(0, sy - R); y < Math.min(h, sy + R); y++) {
    for (let x = Math.max(0, sx - R); x < Math.min(w, sx + R); x++) {
      const dx = x - sx, dy = (y - sy) * 1.3
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d >= R) continue
      const i = Math.pow(1 - d / R, 2.5) * 0.18
      if (i < 0.004) continue
      const cell = c.getCell(x, y)
      if (cell && cell.bg) c.setCell(x, y, ' ', null, lerp(cell.bg, '#fff8d0', i))
    }
  }
}

function drawClouds(c, w, h, cls, t) {
  for (const cl of cls) {
    const ox = cl.cx + t * cl.dr
    for (let dy = -cl.ch; dy <= cl.ch; dy++) {
      const py = cl.cy + dy
      if (py < 0 || py >= h) continue
      for (let dx = -cl.cw; dx <= cl.cw; dx++) {
        let px = Math.floor(ox + dx) % w
        if (px < 0) px += w
        const nx = dx / cl.cw, ny = dy / Math.max(1, cl.ch)
        if (nx * nx + ny * ny > 1) continue
        const dn = (1 - (nx * nx + ny * ny)) * cl.dn
        if (dn < 0.003) continue
        const cell = c.getCell(px, py)
        if (cell && cell.bg) c.setCell(px, py, ' ', null, lerp(cell.bg, '#fff8ee', dn))
      }
    }
  }
}

function drawHaze(c, w, h, t) {
  const hy = Math.floor(h * 0.34)
  for (let x = 0; x < w; x++) {
    const wave = Math.sin(x * 0.012 + t * 0.04) * 3
    for (let dy = -7; dy <= 7; dy++) {
      const py = hy + dy + Math.floor(wave)
      if (py < 0 || py >= h) continue
      const fi = Math.max(0, 1 - Math.abs(dy) / 8) * 0.08
      if (fi < 0.003) continue
      const cell = c.getCell(x, py)
      if (cell && cell.bg) c.setCell(x, py, ' ', null, lerp(cell.bg, '#ffe8a0', fi))
    }
  }
}

function drawFlower(c, w, h, f, t) {
  const wind = Math.sin(t * f.ss + f.ph + f.wo) * f.sa
  const bx = Math.floor(w * f.xf)
  const gy = Math.floor(h * f.gf)

  for (let dy = 0; dy < f.sh; dy++) {
    const y = gy - dy
    if (y < 1 || y >= h - 4) continue
    const prog = dy / Math.max(1, f.sh)
    const sx = bx + Math.floor(wind * prog * 0.6)
    if (sx < 4 || sx >= w - 4) continue
    c.setCell(sx, y, '│', f.sc)
  }

  if (f.hl && f.sh >= 6) {
    const ly = gy - Math.floor(f.sh * f.lf)
    const prog = (gy - ly) / Math.max(1, f.sh)
    const lx = bx + Math.floor(wind * prog * 0.6)
    const lc = lerp(f.sc, '#55aa33', 0.2)
    const ll = Math.max(1, Math.floor(f.sz * 0.6))
    for (let i = 1; i <= ll; i++) {
      const px = lx + i * f.ls
      const py = ly + Math.floor(i * 0.4)
      if (px >= 4 && px < w - 4 && py >= 1 && py < h - 4)
        c.setCell(px, py, f.ls > 0 ? '╲' : '╱', lc)
    }
    const l2y = ly + Math.max(2, Math.floor(f.sh * 0.12))
    const l2p = (gy - l2y) / Math.max(1, f.sh)
    const l2x = bx + Math.floor(wind * l2p * 0.6)
    const l2l = Math.max(1, Math.floor(f.sz * 0.4))
    for (let i = 1; i <= l2l; i++) {
      const px = l2x + i * (-f.ls)
      const py = l2y + Math.floor(i * 0.4)
      if (px >= 4 && px < w - 4 && py >= 1 && py < h - 4)
        c.setCell(px, py, (-f.ls) > 0 ? '╲' : '╱', lc)
    }
  }

  const hx = bx + Math.floor(wind * 0.6)
  const hy = gy - f.sh
  const R = Math.floor(f.sz)

  if (R < 1) {
    if (hx >= 4 && hx < w - 4 && hy >= 1 && hy < h - 4)
      c.setCell(hx, hy, '●', f.pc)
    return
  }

  if (R === 1) {
    if (hx < 4 || hx >= w - 4 || hy < 1 || hy >= h - 4) return
    c.setCell(hx, hy, '●', f.cc)
    if (hx - 1 >= 4) c.setCell(hx - 1, hy, '◖', f.pc)
    if (hx + 1 < w - 4) c.setCell(hx + 1, hy, '◗', f.pc)
    if (hy - 1 >= 1) c.setCell(hx, hy - 1, '▄', f.pc)
    if (hy + 1 < h - 4) c.setCell(hx, hy + 1, '▀', f.pc)
    return
  }

  const cR = Math.max(1, Math.floor(R * 0.38))

  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R * 2; dx <= R * 2; dx++) {
      const ndx = dx / 2
      const dist = Math.sqrt(ndx * ndx + dy * dy)
      if (dist > R + 0.3) continue

      const px = hx + dx, py = hy + dy
      if (px < 4 || px >= w - 4 || py < 1 || py >= h - 4) continue

      if (dist <= cR) {
        const sn = Math.sin(dx * 2.3 + dy * 3.7) * 0.5 + 0.5
        const si = Math.min(3, Math.floor(sn * 3))
        c.setCell(px, py, SHADE[si],
          lerp(f.cc, '#665522', sn * 0.3),
          lerp(f.cc, '#1a0e00', 0.35))
      } else if (dist <= R) {
        const ang = Math.atan2(dy, ndx)
        const pv = Math.sin(ang * 7 + f.ph) * 0.10
        const rf = (dist - cR) / Math.max(1, R - cR)
        const la = Math.atan2(-1, 0.8)
        const lt = Math.cos(ang - la) * 0.08 + 0.04
        const bri = 1.0 + pv + lt - rf * 0.06
        let pc = f.pc
        if (bri > 1.04) pc = lerp(pc, '#ffeeaa', Math.min(1, (bri - 1.04) * 3))
        else if (bri < 0.96) pc = lerp(pc, '#997700', Math.min(1, (0.96 - bri) * 3))
        c.setCell(px, py, ' ', null, pc)
      }
    }
  }
}

function drawBees(c, w, h, bees, t) {
  for (const b of bees) {
    const bx = Math.floor(w * b.bx + Math.sin(t * b.sp * 0.22 + b.ph) * b.ax)
    const by = Math.floor(h * b.by + Math.sin(t * b.sp * 0.15 + b.ph * 1.7) * b.ay)
    if (bx < 5 || bx >= w - 5 || by < 4 || by >= h - 5) continue
    const wing = Math.sin(t * 6 + b.ph) > 0
    c.setCell(bx, by, wing ? '∗' : '·', '#ffdd44')
  }
}
