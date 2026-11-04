import { SHADE } from '../src/theme.js'

export const title = 'Senbazuru'
export const description =
  'A thousand paper cranes drift on golden threads — each fold a whispered wish, each string a prayer for peace'
export const fps = 2

const TAU = Math.PI * 2

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
function noise2d(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

const PAPERS = [
  { dk: '#a81828', md: '#d83040', lt: '#ff5868' },
  { dk: '#c85818', md: '#e87838', lt: '#ffa858' },
  { dk: '#b88818', md: '#d8b838', lt: '#f8e868' },
  { dk: '#c82868', md: '#e84888', lt: '#ff78a8' },
  { dk: '#c8c0a8', md: '#e0d8c8', lt: '#f0ece0' },
  { dk: '#2860a0', md: '#4080c0', lt: '#68b0e0' },
  { dk: '#6838a0', md: '#8858c0', lt: '#a878e0' },
  { dk: '#288858', md: '#48a878', lt: '#68c898' },
]

const BG_CEIL  = '#14100a'
const BG_WARM  = '#28180e'
const BG_FLOOR = '#1a1008'
const BEAM_DK  = '#1c1410'
const BEAM_LT  = '#322820'
const THREAD   = '#907858'
const THREAD_DM = '#685838'

export function setup(canvas, data) {
  const rng = srand(20261104)
  const W = canvas.width, H = canvas.height
  const beamBot = 7

  const count = Math.max(10, Math.floor(W / 7))
  const strings = []

  for (let i = 0; i < count; i++) {
    const posT = (i + 0.5) / count
    const baseX = Math.floor(posT * (W - 12)) + 6 + Math.floor((rng() - 0.5) * 4)
    const colorCenter = posT * PAPERS.length
    const colorIdx = Math.max(0, Math.min(PAPERS.length - 1,
      Math.floor(colorCenter + (rng() - 0.5) * 2.5)))
    const numCranes = 3 + Math.floor(rng() * 5)
    const waveFactor = 0.9 + 0.2 * Math.sin(posT * Math.PI)
    const len = Math.floor((H * 0.45 + rng() * H * 0.35) * waveFactor)
    const phase = rng() * TAU
    const amp = 1.0 + rng() * 2.5
    const spd = 0.20 + rng() * 0.30

    const cranes = []
    const gap = len / (numCranes + 1)
    for (let c = 0; c < numCranes; c++) {
      cranes.push({
        yOff: Math.floor(gap * (c + 1) + (rng() - 0.5) * gap * 0.2),
        dir: rng() < 0.5 ? -1 : 1,
        big: rng() < 0.15,
        sv: rng() * 0.2,
      })
    }

    strings.push({
      bx: Math.max(5, Math.min(W - 6, baseX)),
      ty: beamBot,
      len,
      ci: colorIdx,
      cranes,
      phase,
      amp,
      spd,
    })
  }

  const motes = []
  for (let i = 0; i < 35; i++) {
    motes.push({
      x: rng(), y: 0.1 + rng() * 0.8,
      dx: (rng() - 0.5) * 0.003,
      dy: 0.001 + rng() * 0.002,
      br: 0.3 + rng() * 0.7,
      ph: rng() * TAU,
    })
  }

  return { strings, motes }
}

function drawBg(canvas) {
  const W = canvas.width, H = canvas.height
  for (let y = 0; y < H; y++) {
    const yt = y / H
    let bg
    if (yt < 0.06) bg = BG_CEIL
    else if (yt < 0.45) bg = mix(BG_CEIL, BG_WARM, (yt - 0.06) / 0.39)
    else if (yt < 0.85) bg = mix(BG_WARM, BG_FLOOR, (yt - 0.45) / 0.40)
    else bg = BG_FLOOR

    for (let x = 0; x < W; x++) {
      const xt = x / W
      const centerGlow = Math.max(0, 1 - Math.abs(xt - 0.5) * 2.8)
      const vertGlow = Math.max(0, 1 - Math.abs(yt - 0.30) * 2.0)
      const glow = centerGlow * vertGlow * 0.10
      const lit = mix(bg, '#3a2810', glow)
      canvas.setCell(x, y, ' ', null, lit)
    }
  }
}

function drawBeam(canvas) {
  const W = canvas.width
  const y0 = 4, y1 = 6
  for (let y = y0; y <= y1; y++) {
    for (let x = 3; x < W - 3; x++) {
      const g = noise2d(x * 0.25, y * 1.8)
      const highlight = y === y0 ? 0.18 : 0
      const color = mix(BEAM_DK, BEAM_LT, g * 0.55 + highlight)
      canvas.setCell(x, y, g > 0.55 ? SHADE[2] : SHADE[1],
        color, mix(BEAM_DK, '#080604', 0.5))
    }
  }
  if (y1 + 1 < canvas.height) {
    for (let x = 3; x < W - 3; x++) {
      const bg = canvas.getCell(x, y1 + 1)
      if (bg && bg.bg) {
        canvas.setCell(x, y1 + 1, SHADE[0], mix(bg.bg, '#000000', 0.25), bg.bg)
      }
    }
  }
}

function drawFloor(canvas) {
  const W = canvas.width, H = canvas.height
  const floorY = Math.floor(H * 0.92)
  for (let y = floorY; y < H; y++) {
    const depth = (y - floorY) / (H - floorY)
    for (let x = 0; x < W; x++) {
      const g = noise2d(x * 0.15, y * 0.4)
      const base = mix('#18120c', '#221a10', g * 0.4 + depth * 0.3)
      if (y === floorY) {
        canvas.setCell(x, y, '─', mix(base, '#2a2018', 0.3), base)
      } else {
        canvas.setCell(x, y, g > 0.65 ? SHADE[1] : ' ', mix(base, '#2a2018', 0.1), base)
      }
    }
  }
}

function drawCrane(canvas, cx, cy, dir, big, paper) {
  const W = canvas.width, H = canvas.height
  const set = (x, y, ch, fg) => {
    if (x >= 0 && x < W && y >= 0 && y < H) canvas.setCell(x, y, ch, fg, null)
  }

  set(cx, cy, '◆', paper.lt)
  set(cx - 1, cy, dir > 0 ? '╱' : '╲', paper.md)
  set(cx + 1, cy, dir > 0 ? '╲' : '╱', paper.md)

  if (big) {
    set(cx - 2, cy, dir > 0 ? '╱' : '╲', paper.dk)
    set(cx + 2, cy, dir > 0 ? '╲' : '╱', paper.dk)
    if (dir > 0) {
      set(cx - 1, cy - 1, '╱', paper.dk)
      set(cx + 1, cy + 1, '╲', paper.dk)
    } else {
      set(cx + 1, cy - 1, '╲', paper.dk)
      set(cx - 1, cy + 1, '╱', paper.dk)
    }
  }
}

function drawStrings(canvas, state, t) {
  const W = canvas.width, H = canvas.height

  for (const s of state.strings) {
    const paper = PAPERS[s.ci]
    const endY = Math.min(s.ty + s.len, H - 8)
    const totalLen = endY - s.ty || 1

    const craneSet = new Set()
    for (const c of s.cranes) {
      const cy = s.ty + c.yOff
      craneSet.add(cy)
      if (c.big) { craneSet.add(cy - 1); craneSet.add(cy + 1) }
    }

    for (let y = s.ty; y <= endY; y++) {
      if (craneSet.has(y)) continue
      const prog = (y - s.ty) / totalLen
      const sway = Math.sin(t * s.spd + s.phase) * s.amp * prog
      const x = s.bx + Math.round(sway)
      if (x >= 0 && x < W && y >= 0 && y < H) {
        const tf = mix(THREAD_DM, THREAD, 0.35 + 0.15 * Math.sin(y * 0.5))
        canvas.setCell(x, y, '┊', tf, null)
      }
    }

    for (const c of s.cranes) {
      const cy = s.ty + c.yOff
      if (cy < s.ty || cy >= endY) continue
      const prog = (cy - s.ty) / totalLen
      const sway = Math.sin(t * s.spd + s.phase) * s.amp * prog
      const cx = s.bx + Math.round(sway)

      const vp = {
        dk: mix(paper.dk, '#ffffff', c.sv * 0.06),
        md: mix(paper.md, '#ffffff', c.sv * 0.10),
        lt: mix(paper.lt, '#ffffff', c.sv * 0.12),
      }
      drawCrane(canvas, cx, cy, c.dir, c.big, vp)
    }
  }
}

function drawMotes(canvas, motes, t) {
  const W = canvas.width, H = canvas.height
  for (const m of motes) {
    m.x += m.dx + Math.sin(t * 0.6 + m.ph) * 0.0008
    m.y += m.dy
    if (m.y > 0.92) { m.y = 0.08; m.x = Math.random() }
    if (m.x < 0) m.x += 1
    if (m.x > 1) m.x -= 1

    const distCenter = Math.abs(m.x - 0.5) * 2
    if (distCenter > 0.65) continue

    const flicker = 0.5 + 0.5 * Math.sin(t * 1.8 + m.ph)
    const br = m.br * flicker
    if (br < 0.35) continue

    const mx = Math.floor(m.x * W)
    const my = Math.floor(m.y * H)
    if (mx >= 0 && mx < W && my >= 0 && my < H) {
      canvas.setCell(mx, my, '·', mix('#4a3818', '#c8a868', br), null)
    }
  }
}

function drawShadows(canvas, state, t) {
  const W = canvas.width, H = canvas.height
  const floorY = Math.floor(H * 0.92)

  for (const s of state.strings) {
    for (const c of s.cranes) {
      const cy = s.ty + c.yOff
      if (cy > floorY - 10) continue
      const prog = (cy - s.ty) / (s.len || 1)
      const sway = Math.sin(t * s.spd + s.phase) * s.amp * prog
      const sx = s.bx + Math.round(sway)
      const shadowX = sx + Math.round((sx - W / 2) * 0.06)
      const shadowY = floorY + 1

      for (let dx = -1; dx <= 1; dx++) {
        const x = shadowX + dx
        if (x >= 0 && x < W && shadowY >= 0 && shadowY < H) {
          const existing = canvas.getCell(x, shadowY)
          if (existing && existing.bg) {
            const darkened = mix(existing.bg, '#080604', 0.12)
            canvas.setCell(x, shadowY, existing.char, existing.fg, darkened)
          }
        }
      }
    }
  }
}

function drawScene(canvas, state, t) {
  drawBg(canvas)
  drawFloor(canvas)
  drawBeam(canvas)
  drawStrings(canvas, state, t)
  drawShadows(canvas, state, t)
  drawMotes(canvas, state.motes, t)
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  drawScene(canvas, state, frame.elapsed)
}
