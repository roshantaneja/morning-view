import { hex, bgHex, lerp, lerpMulti } from '../src/theme.js'

export const title = 'Clockwork'
export const description = 'Behind the dial — a cathedral of brass teeth meshing in perpetuity, counting the hours you sleep through'
export const fps = 2

const TAU = Math.PI * 2
const ASPECT = 0.48

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function cellDist(dx, dy) {
  return Math.sqrt((dx * ASPECT) ** 2 + dy ** 2)
}

function cellAngle(dx, dy) {
  return Math.atan2(dy, dx * ASPECT)
}

const PAL = {
  brass: {
    body: [88, 74, 34], light: [190, 160, 68], dark: [40, 34, 15],
    tooth: [148, 125, 50], edge: [118, 100, 42], hub: [72, 62, 30],
  },
  copper: {
    body: [105, 60, 34], light: [180, 115, 72], dark: [48, 30, 18],
    tooth: [146, 94, 55], edge: [122, 76, 44], hub: [82, 50, 30],
  },
  steel: {
    body: [55, 60, 72], light: [115, 125, 142], dark: [30, 33, 40],
    tooth: [92, 100, 116], edge: [72, 78, 92], hub: [48, 52, 62],
  },
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(912)
  const scale = Math.min(W * ASPECT, H)

  const specs = [
    { cxF: 0.40, cyF: 0.36, rF: 0.19, teeth: 22, spd: 1, pal: 'brass' },
    { cxF: 0.70, cyF: 0.24, rF: 0.12, teeth: 14, spd: -22 / 14, pal: 'copper' },
    { cxF: 0.35, cyF: 0.68, rF: 0.14, teeth: 18, spd: -22 / 18, pal: 'steel' },
    { cxF: 0.66, cyF: 0.54, rF: 0.08, teeth: 10, spd: 22 / 10, pal: 'copper' },
    { cxF: 0.16, cyF: 0.19, rF: 0.07, teeth: 9, spd: -1.8, pal: 'brass' },
    { cxF: 0.80, cyF: 0.76, rF: 0.09, teeth: 11, spd: 1.5, pal: 'steel' },
  ]

  const gears = specs.map(s => ({
    cx: Math.floor(W * s.cxF),
    cy: Math.floor(H * s.cyF),
    radius: Math.max(5, Math.floor(scale * s.rF)),
    teeth: s.teeth,
    speed: s.spd,
    pal: s.pal,
    toothH: Math.max(2, Math.floor(scale * s.rF * 0.2)),
    hubR: Math.max(2, Math.floor(scale * s.rF * 0.25)),
    phase: rng() * TAU,
    spokes: Math.max(4, Math.floor(s.teeth / 3)),
  }))

  const dust = Array.from({ length: 50 }, () => ({
    x: rng() * W, y: rng() * H,
    ph: rng() * TAU, sp: 0.1 + rng() * 0.3,
    br: 0.1 + rng() * 0.3,
  }))

  const scratchSeeds = Array.from({ length: 12 }, () => ({
    x: Math.floor(rng() * W), y: Math.floor(rng() * H),
    len: 3 + Math.floor(rng() * 12), ang: rng() * Math.PI,
  }))

  return { W, H, gears, dust, scratchSeeds }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }

function draw(canvas, state, t) {
  const { W, H, gears, dust, scratchSeeds } = state

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const vx = (x / W - 0.43) * 2
      const vy = (y / H - 0.40) * 2
      const vig = Math.sqrt(vx * vx + vy * vy)
      const base = 12 - Math.min(8, vig * 5)
      canvas.setCell(x, y, ' ', null, bgHex(col(
        Math.max(2, Math.floor(base + 3)),
        Math.max(2, Math.floor(base + 1)),
        Math.max(2, Math.floor(base - 1))
      )))
    }
  }

  for (const sc of scratchSeeds) {
    const cos = Math.cos(sc.ang), sin = Math.sin(sc.ang)
    for (let i = 0; i < sc.len; i++) {
      const px = Math.floor(sc.x + cos * i)
      const py = Math.floor(sc.y + sin * i * 0.5)
      if (px >= 0 && px < W && py >= 0 && py < H) {
        const cur = canvas.getCell(px, py)
        if (cur && cur.bg) {
          canvas.setCell(px, py, '·', hex(lerp(cur.bg, '#181410', 0.4)))
        }
      }
    }
  }

  drawPlateEdges(canvas, W, H)

  const sorted = [...gears].sort((a, b) => b.radius - a.radius)
  for (const g of sorted) drawGearShadow(canvas, g, W, H)
  for (const g of sorted) drawGear(canvas, g, t, W, H)

  for (const d of dust) {
    const dx = d.x + Math.sin(t * 0.1 + d.ph) * 3
    const dy = d.y + Math.cos(t * 0.07 + d.ph) * 2
    const px = Math.floor(((dx % W) + W) % W)
    const py = Math.floor(((dy % H) + H) % H)
    const pulse = d.br * (0.3 + 0.7 * Math.sin(t * 0.35 + d.ph))
    if (pulse > 0.12) {
      const v = Math.floor(20 + pulse * 50)
      canvas.setCell(px, py, '·', hex(col(v + 12, v + 6, v)))
    }
  }

  const gcx = Math.floor(W * 0.42), gcy = Math.floor(H * 0.38)
  const glowP = 0.7 + 0.3 * Math.sin(t * 0.18)
  for (let dy = -18; dy <= 18; dy++) {
    for (let dx = -30; dx <= 30; dx++) {
      const px = gcx + dx, py = gcy + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const d = cellDist(dx, dy)
      if (d < 20) {
        const glow = Math.pow(1 - d / 20, 3) * 0.05 * glowP
        const cur = canvas.getCell(px, py)
        if (cur && cur.bg) {
          canvas.setCell(px, py, cur.char || ' ', cur.fg, bgHex(lerp(cur.bg, '#785828', glow)))
        }
      }
    }
  }
}

function drawPlateEdges(canvas, W, H) {
  for (let y = 0; y < H; y++) {
    for (const x of [0, 1, W - 2, W - 1]) {
      if (x >= 0 && x < W) {
        const edge = x <= 1 ? (2 - x) : (x - W + 3)
        const bright = Math.max(0, edge * 4)
        canvas.setCell(x, y, x === 0 || x === W - 1 ? '│' : '░',
          hex(col(20 + bright, 18 + bright, 14 + bright)),
          bgHex(col(8, 6, 4)))
      }
    }
  }
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) {
      canvas.setCell(x, y, '─', hex(col(24, 20, 16)), bgHex(col(8, 6, 4)))
    }
  }
  canvas.setCell(0, 0, '┌', hex('#181410'))
  canvas.setCell(W - 1, 0, '┐', hex('#181410'))
  canvas.setCell(0, H - 1, '└', hex('#181410'))
  canvas.setCell(W - 1, H - 1, '┘', hex('#181410'))

  const screwPositions = [
    [3, 2], [W - 4, 2], [3, H - 3], [W - 4, H - 3],
    [Math.floor(W / 2), 2], [Math.floor(W / 2), H - 3],
  ]
  for (const [sx, sy] of screwPositions) {
    if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
      canvas.setCell(sx, sy, '⊕', hex('#383028'))
    }
  }
}

function drawGearShadow(canvas, gear, W, H) {
  const { cx, cy, radius, toothH } = gear
  const shadowR = radius + toothH + 2
  const xScan = Math.ceil(shadowR / ASPECT) + 2
  const yScan = shadowR + 2

  for (let dy = -yScan; dy <= yScan; dy++) {
    const py = cy + dy + 1
    if (py < 0 || py >= H) continue
    for (let dx = -xScan; dx <= xScan; dx++) {
      const px = cx + dx + 1
      if (px < 0 || px >= W) continue
      const d = cellDist(dx, dy)
      if (d > radius * 0.85 && d < shadowR) {
        const fade = (d - radius * 0.85) / (shadowR - radius * 0.85)
        const strength = (1 - fade) * 0.25
        const cur = canvas.getCell(px, py)
        if (cur && cur.bg && cur.char === ' ') {
          canvas.setCell(px, py, ' ', null, bgHex(lerp(cur.bg, '#020200', strength)))
        }
      }
    }
  }
}

function drawGear(canvas, gear, t, W, H) {
  const { cx, cy, radius, teeth, toothH, hubR, speed, phase, pal, spokes } = gear
  const rot = t * speed * 0.2 + phase
  const colors = PAL[pal]
  const outerR = radius + toothH
  const bodyInner = radius * 0.62
  const xScan = Math.ceil(outerR / ASPECT) + 2
  const yScan = outerR + 2

  for (let dy = -yScan; dy <= yScan; dy++) {
    const py = cy + dy
    if (py < 0 || py >= H) continue

    for (let dx = -xScan; dx <= xScan; dx++) {
      const px = cx + dx
      if (px < 0 || px >= W) continue

      const d = cellDist(dx, dy)
      if (d > outerR + 0.5) continue

      const a = cellAngle(dx, dy)
      const ta = ((a - rot) % TAU + TAU) % TAU
      const slot = ta / (TAU / teeth)
      const frac = slot - Math.floor(slot)
      const isTooth = frac < 0.44

      let ch = ' ', fg = null, bgc = null

      if (d > radius - 0.3 && d <= outerR && isTooth) {
        const tt = Math.max(0, (d - radius) / toothH)
        const edgeFrac = Math.abs(frac - 0.22) / 0.22
        bgc = col(
          Math.floor(colors.tooth[0] + (colors.light[0] - colors.tooth[0]) * tt * 0.35),
          Math.floor(colors.tooth[1] + (colors.light[1] - colors.tooth[1]) * tt * 0.35),
          Math.floor(colors.tooth[2] + (colors.light[2] - colors.tooth[2]) * tt * 0.35)
        )
        if (edgeFrac > 0.78) {
          ch = '▒'
          fg = hex(col(colors.dark[0] + 5, colors.dark[1] + 4, colors.dark[2] + 3))
        } else {
          ch = '▓'
          fg = hex(col(colors.edge[0], colors.edge[1], colors.edge[2]))
        }
      } else if (d <= radius && d > bodyInner) {
        const bt = (d - bodyInner) / (radius - bodyInner)
        bgc = col(
          Math.floor(colors.dark[0] + (colors.body[0] - colors.dark[0]) * bt),
          Math.floor(colors.dark[1] + (colors.body[1] - colors.dark[1]) * bt),
          Math.floor(colors.dark[2] + (colors.body[2] - colors.dark[2]) * bt)
        )

        const sa = ((a - rot) % TAU + TAU) % TAU
        const nearSpk = Math.round(sa / (TAU / spokes)) * (TAU / spokes)
        const spkDelta = Math.abs(sa - nearSpk)

        if (spkDelta < 0.08) {
          bgc = col(
            Math.min(255, colors.body[0] + 22),
            Math.min(255, colors.body[1] + 18),
            Math.min(255, colors.body[2] + 10)
          )
          ch = '┃'
          fg = hex(col(colors.light[0], colors.light[1], colors.light[2]))
        } else {
          ch = '░'
          fg = hex(col(colors.dark[0] + 6, colors.dark[1] + 5, colors.dark[2] + 3))
        }
      } else if (d <= bodyInner && d > hubR + 1) {
        const wa = ((a - rot) % TAU + TAU) % TAU
        const ws = wa / (TAU / spokes)
        const wf = ws - Math.floor(ws)
        const wc = Math.abs(wf - 0.5) * 2
        const rf = (d - hubR - 1) / (bodyInner - hubR - 1)

        if (wc < 0.52 && rf > 0.18 && rf < 0.82) continue

        const nearSpk2 = Math.round(wa / (TAU / spokes)) * (TAU / spokes)
        const spkDelta2 = Math.abs(wa - nearSpk2)
        if (spkDelta2 < 0.1) {
          bgc = col(colors.dark[0] + 14, colors.dark[1] + 12, colors.dark[2] + 8)
          ch = '┃'
          fg = hex(col(colors.body[0], colors.body[1], colors.body[2]))
        } else {
          bgc = col(colors.dark[0] + 10, colors.dark[1] + 8, colors.dark[2] + 5)
          ch = '░'
          fg = hex(col(colors.dark[0], colors.dark[1], colors.dark[2]))
        }
      } else if (d <= hubR + 1 && d > 1.5) {
        const ht = d / (hubR + 1)
        bgc = col(
          Math.floor(colors.edge[0] * (1 - ht * 0.15)),
          Math.floor(colors.edge[1] * (1 - ht * 0.15)),
          Math.floor(colors.edge[2] * (1 - ht * 0.15))
        )
        ch = '▓'
        fg = hex(col(colors.body[0], colors.body[1], colors.body[2]))
      } else if (d <= 1.5) {
        bgc = col(colors.dark[0] + 10, colors.dark[1] + 8, colors.dark[2] + 5)
        ch = '◉'
        fg = hex(col(colors.light[0], colors.light[1], colors.light[2]))
      }

      if (bgc) canvas.setCell(px, py, ch, fg, bgHex(bgc))
    }
  }

  if (radius > 8) {
    for (let i = 0; i < 3; i++) {
      const jewA = rot + i * TAU / 3 + TAU / 6
      const jewD = hubR * 0.7
      const jx = Math.floor(cx + Math.cos(jewA) * jewD / ASPECT)
      const jy = Math.floor(cy + Math.sin(jewA) * jewD)
      if (jx >= 0 && jx < W && jy >= 0 && jy < H) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.6 + i * 2.1)
        canvas.setCell(jx, jy, '◆', hex(col(
          Math.floor(120 + pulse * 60),
          Math.floor(15 + pulse * 10),
          Math.floor(20 + pulse * 15)
        )))
      }
    }
  }
}
