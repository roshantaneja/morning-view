import { lerpMulti, lerp } from '../src/theme.js'

export const title = 'Mycelium'
export const description = 'Beneath the forest floor, the wood wide web pulses with borrowed starlight'
export const fps = 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

const SOIL = ['#1c1810', '#181408', '#140f06', '#100c04', '#0c0903', '#080602']
const PULSE_GLOW = ['#181e18', '#005540', '#008868', '#00bb99', '#44eebb', '#88ffdd']
const ROOT_BASE = '#4a3828'
const ROOT_END = '#362818'
const THREAD_FG = '#302820'
const CAP_COLORS = ['#cc4422', '#dd6633', '#cc5533', '#bb4411', '#dd7744']
const GR_COLORS = ['#1a3810', '#1e4014', '#224818', '#264e1c']
const LF_COLORS = ['#7a4818', '#8a5520', '#6a3c14', '#996633']

function growRoot(rng, sx, sy, a0, len, depth, out, w, h) {
  const pts = [{ x: sx, y: sy }]
  let x = sx, y = sy, a = a0
  for (let i = 0; i < len; i++) {
    a += (rng() - 0.5) * 0.5
    x += Math.cos(a) * 1.2
    y += Math.sin(a) * 1.8
    if (x < 1 || x >= w - 1 || y >= h - 2) break
    pts.push({ x: Math.round(x), y: Math.round(y) })
    if (i > 4 && depth > 0 && rng() > 0.72) {
      growRoot(rng, Math.round(x), Math.round(y),
        a + (rng() - 0.5) * 1.2, Math.floor(len * 0.45), depth - 1, out, w, h)
    }
  }
  if (pts.length > 1) out.push(pts)
}

export function setup(canvas) {
  const rng = srand(813)
  const w = canvas.width, h = canvas.height
  const surfY = Math.floor(h * 0.12)

  const treeN = Math.max(3, Math.floor(w / 28))
  const trees = []
  for (let i = 0; i < treeN; i++) {
    trees.push({ x: 8 + Math.floor(rng() * (w - 22)), tw: 1 + Math.floor(rng() * 2) })
  }

  const roots = []
  for (const t of trees) {
    growRoot(rng, t.x, surfY + 1, Math.PI / 2, 12 + Math.floor(rng() * 18), 2, roots, w, h)
    growRoot(rng, t.x - 2, surfY + 2, Math.PI / 2 + 0.3, 8 + Math.floor(rng() * 12), 1, roots, w, h)
    growRoot(rng, t.x + 2, surfY + 2, Math.PI / 2 - 0.3, 8 + Math.floor(rng() * 12), 1, roots, w, h)
  }

  const nodes = []
  for (const r of roots) {
    const tip = r[r.length - 1]
    if (tip.y > surfY + 4 && tip.y < h - 4) nodes.push({ x: tip.x, y: tip.y })
  }
  const jN = Math.max(25, Math.floor(w * h / 350))
  for (let i = 0; i < jN; i++) {
    nodes.push({
      x: 3 + Math.floor(rng() * (w - 6)),
      y: surfY + 6 + Math.floor(rng() * (h - surfY - 12))
    })
  }

  const maxDist = Math.max(14, Math.floor(Math.min(w, h) * 0.17))
  const edges = [], paths = []
  for (let i = 0; i < nodes.length; i++) {
    const near = []
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 2 && d < maxDist) near.push({ j, d })
    }
    near.sort((a, b) => a.d - b.d)
    const cn = Math.min(near.length, 1 + Math.floor(rng() * 3))
    for (let c = 0; c < cn; c++) {
      edges.push([i, near[c].j])
      const na = nodes[i], nb = nodes[near[c].j]
      const dx = nb.x - na.x, dy = nb.y - na.y
      const steps = Math.max(Math.abs(dx), Math.abs(dy), 1)
      const bend = (rng() - 0.5) * 3
      const p = []
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        p.push({
          x: Math.round(na.x + dx * t + Math.sin(t * Math.PI) * bend),
          y: Math.round(na.y + dy * t + Math.cos(t * Math.PI) * bend * 0.4)
        })
      }
      paths.push(p)
    }
  }

  const pN = edges.length > 0 ? Math.max(12, Math.floor(edges.length / 3)) : 0
  const pulses = []
  for (let i = 0; i < pN; i++) {
    pulses.push({
      edge: Math.floor(rng() * edges.length),
      pos: rng(),
      speed: 0.01 + rng() * 0.025,
      size: 3 + Math.floor(rng() * 4),
      bright: 0.6 + rng() * 0.4
    })
  }

  const mN = Math.max(5, Math.floor(w / 16))
  const mush = []
  for (let i = 0; i < mN; i++) {
    mush.push({
      x: 5 + Math.floor(rng() * (w - 10)),
      y: surfY - 1,
      sz: 1 + Math.floor(rng() * 2),
      ci: Math.floor(rng() * CAP_COLORS.length),
      ph: rng() * Math.PI * 2
    })
  }

  const gr = []
  for (let x = 0; x < w; x++) {
    if (rng() > 0.3) {
      gr.push({
        x, ch: ['╻', '│', '╎', '▏', '┃'][Math.floor(rng() * 5)],
        ci: Math.floor(rng() * GR_COLORS.length), ht: 1 + Math.floor(rng() * 2)
      })
    }
  }

  const lv = []
  for (let i = 0; i < Math.floor(w / 5); i++) {
    lv.push({
      x: Math.floor(rng() * w),
      y: surfY - Math.floor(rng() * 2),
      ci: Math.floor(rng() * LF_COLORS.length)
    })
  }

  const sp = []
  for (let i = 0; i < 25; i++) {
    sp.push({
      x: Math.floor(rng() * w),
      y: Math.floor(h * 0.65 + rng() * h * 0.3),
      ph: rng() * Math.PI * 2
    })
  }

  const dots = []
  for (let y = surfY + 1; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (noise(x, y) > 0.92) dots.push({ x, y })
    }
  }

  return { surfY, trees, roots, nodes, edges, paths, pulses, mush, gr, lv, sp, dots, w, h }
}

function draw(canvas, st, t) {
  const { surfY, trees, roots, paths, pulses, mush, gr, lv, sp, dots, w, h } = st

  for (let y = 0; y < surfY; y++) canvas.fill(0, y, w, 1, ' ', null, '#060804')
  for (let y = surfY; y < h; y++) {
    const bg = lerpMulti(SOIL, (y - surfY) / Math.max(1, h - surfY - 1))
    canvas.fill(0, y, w, 1, ' ', null, bg)
  }

  for (const d of dots) {
    const f = (d.y - surfY) / Math.max(1, h - surfY)
    canvas.setCell(d.x, d.y, '·', lerp('#2a2418', '#14100a', f))
  }

  for (const s of sp) {
    const tw = Math.sin(t * 0.7 + s.ph)
    if (tw > 0.4) canvas.setCell(s.x, s.y, '✧', lerp('#1a1610', '#88773a', (tw - 0.4) / 0.6))
  }

  for (const p of paths) {
    for (const pt of p) {
      if (pt.x >= 0 && pt.x < w && pt.y > surfY && pt.y < h)
        canvas.setCell(pt.x, pt.y, '·', THREAD_FG)
    }
  }

  for (const root of roots) {
    for (let i = 0; i < root.length; i++) {
      const pt = root[i]
      if (pt.x >= 0 && pt.x < w && pt.y >= 0 && pt.y < h) {
        const rf = i / Math.max(1, root.length - 1)
        const ch = rf < 0.3 ? '│' : rf < 0.6 ? '╎' : '·'
        canvas.setCell(pt.x, pt.y, ch, lerp(ROOT_BASE, ROOT_END, rf))
      }
    }
  }

  for (const pulse of pulses) {
    const path = paths[pulse.edge]
    if (!path || path.length < 2) continue
    const ci = Math.floor(pulse.pos * (path.length - 1))
    const hs = Math.floor(pulse.size / 2)
    for (let i = ci - hs; i <= ci + hs; i++) {
      if (i < 0 || i >= path.length) continue
      const pt = path[i]
      if (pt.x < 0 || pt.x >= w || pt.y <= surfY || pt.y >= h) continue
      const dist = Math.abs(i - ci) / (hs + 1)
      const glow = (1 - dist * dist) * pulse.bright
      canvas.setCell(pt.x, pt.y, glow > 0.7 ? '●' : glow > 0.4 ? '•' : '·',
        lerpMulti(PULSE_GLOW, glow))
    }
  }

  for (let x = 0; x < w; x++) canvas.setCell(x, surfY, '▁', '#2a3a18', '#0a0c06')

  for (const g of gr) {
    for (let dy = 0; dy <= g.ht; dy++) {
      const gy = surfY - 1 - dy
      if (gy >= 0) canvas.setCell(g.x, gy, g.ch, GR_COLORS[g.ci])
    }
  }

  for (const l of lv) {
    if (l.y >= 0 && l.y < surfY) canvas.setCell(l.x, l.y, '◆', LF_COLORS[l.ci])
  }

  for (const tr of trees) {
    for (let dy = -3; dy <= 0; dy++) {
      const ty = surfY + dy
      if (ty >= 0) {
        for (let dx = -tr.tw; dx <= tr.tw; dx++) {
          const tx = tr.x + dx
          if (tx >= 0 && tx < w) canvas.setCell(tx, ty, '█', '#3a2a18')
        }
      }
    }
  }

  for (const m of mush) {
    const br = Math.sin(t * 0.4 + m.ph) * 0.12
    const cap = lerp(CAP_COLORS[m.ci], '#ffddaa', Math.max(0, br))
    if (m.sz >= 2) {
      const sy = m.y + 1
      if (sy >= 0 && sy < h) canvas.setCell(m.x, sy, '│', '#7a6a50')
      if (m.y >= 0 && m.y < h) {
        canvas.setCell(m.x - 1, m.y, '◖', cap)
        canvas.setCell(m.x, m.y, '●', cap)
        canvas.setCell(m.x + 1, m.y, '◗', cap)
      }
    } else {
      const sy = m.y + 1
      if (sy >= 0 && sy < h) canvas.setCell(m.x, sy, '╷', '#7a6a50')
      if (m.y >= 0 && m.y < h) canvas.setCell(m.x, m.y, '•', cap)
    }
  }
}

export function render(canvas, data, state) {
  draw(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  for (const p of state.pulses) {
    p.pos += p.speed
    if (p.pos > 1) {
      p.pos -= 1
      if (state.edges.length > 0) {
        const endNode = state.edges[p.edge][1]
        const conn = []
        for (let e = 0; e < state.edges.length; e++) {
          if (e !== p.edge && (state.edges[e][0] === endNode || state.edges[e][1] === endNode))
            conn.push(e)
        }
        p.edge = conn.length > 0
          ? conn[Math.floor(Math.random() * conn.length)]
          : Math.floor(Math.random() * state.edges.length)
      }
    }
  }
  draw(canvas, state, frame.elapsed)
}
