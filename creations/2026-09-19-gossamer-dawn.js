import { hex, bgHex, lerp, lerpMulti } from '../src/theme.js'

export const title = 'Gossamer Dawn'
export const description = 'An orb weaver\'s silk catches the first light — every bead of dew a tiny lens for the waking sky'
export const fps = 2

const TAU = Math.PI * 2

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function h2(n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0') }
function col(r, g, b) { return '#' + h2(r) + h2(g) + h2(b) }

const SPOKES = 28
const RINGS = 20

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(919)

  const cx = Math.floor(W * 0.50)
  const cy = Math.floor(H * 0.42)
  const maxRx = Math.floor(W * 0.42)
  const maxRy = Math.floor(H * 0.38)

  const spokes = []
  for (let i = 0; i < SPOKES; i++) {
    const base = (i / SPOKES) * TAU
    spokes.push(base + (rng() - 0.5) * (TAU / SPOKES) * 0.15)
  }
  spokes.sort((a, b) => a - b)

  const rings = []
  for (let i = 0; i < RINGS; i++) {
    const t = (i + 1) / RINGS
    rings.push(t * 0.55 + t * t * 0.45)
  }

  const anchorSpokes = [0, 7, 14, 21, 26].filter(i => i < SPOKES)
  const anchors = anchorSpokes.map(si => ({
    angle: spokes[si],
    extend: 1.3 + rng() * 0.6,
  }))

  const stars = []
  for (let i = 0; i < 55; i++) {
    const x = Math.floor(rng() * W)
    const y = Math.floor(rng() * H * 0.5)
    const dx = (x - cx) / maxRx, dy = (y - cy) / maxRy
    if (Math.sqrt(dx * dx + dy * dy) < 1.15) continue
    stars.push({
      x, y,
      brightness: 0.3 + rng() * 0.7,
      phase: rng() * TAU,
      speed: 0.3 + rng() * 1.5,
    })
  }

  const drops = []
  for (let ri = 0; ri < rings.length; ri++) {
    const ringR = rings[ri]
    for (let si = 0; si < spokes.length; si++) {
      if (rng() < 0.25) continue
      const angle = spokes[si]
      const px = cx + Math.cos(angle) * ringR * maxRx
      const py = cy + Math.sin(angle) * ringR * maxRy
      if (px < 4 || px >= W - 6 || py < 3 || py >= H - 6) continue
      drops.push({
        x: px, y: py,
        dist: ringR,
        size: 0.2 + rng() * 0.8,
        phase: rng() * TAU,
        speed: 0.3 + rng() * 2.2,
      })
    }
  }

  const sky = []
  for (let y = 0; y < H; y++) {
    const yt = y / Math.max(1, H - 1)
    let c
    if (yt < 0.28) {
      c = lerpMulti(['#030310', '#080820', '#10102e'], yt / 0.28)
    } else if (yt < 0.52) {
      c = lerpMulti(['#10102e', '#201444', '#341a52'], (yt - 0.28) / 0.24)
    } else if (yt < 0.74) {
      c = lerpMulti(['#341a52', '#502450', '#782e48'], (yt - 0.52) / 0.22)
    } else {
      c = lerpMulti(['#782e48', '#a84430', '#cc7028', '#dca040'], (yt - 0.74) / 0.26)
    }
    sky.push(c)
  }

  return { W, H, cx, cy, maxRx, maxRy, spokes, rings, anchors, stars, drops, sky }
}

export function render(canvas, data, state) { draw(canvas, state, 0) }
export function update(canvas, data, frame, state) { draw(canvas, state, frame.elapsed) }

function draw(canvas, state, t) {
  const { W, H, cx, cy, maxRx, maxRy, spokes, rings, anchors, stars, drops, sky } = state

  for (let y = 0; y < H; y++) {
    const bg = bgHex(sky[y])
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bg)
    }
  }

  for (const s of stars) {
    const tw = Math.sin(t * s.speed + s.phase)
    const br = s.brightness * (0.5 + tw * 0.5)
    if (br < 0.12) continue
    const v = Math.floor(150 + br * 100)
    const sc = col(v - 25, v - 10, Math.min(255, v + 10))
    const cell = canvas.getCell(s.x, s.y)
    canvas.setCell(s.x, s.y, br > 0.62 ? '✦' : '·', hex(sc), cell.bg)
  }

  for (const a of anchors) {
    const cos = Math.cos(a.angle)
    const sin = Math.sin(a.angle)
    const sx = cx + cos * maxRx
    const sy = cy + sin * maxRy
    const ex = cx + cos * maxRx * a.extend
    const ey = cy + sin * maxRy * a.extend
    const dx = ex - sx, dy = ey - sy
    const steps = Math.max(1, Math.max(Math.abs(Math.round(dx)), Math.abs(Math.round(dy))))
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps
      const px = Math.round(sx + dx * frac)
      const py = Math.round(sy + dy * frac)
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const fade = 0.6 - frac * 0.4
      const v = Math.floor(30 + fade * 50)
      const cell = canvas.getCell(px, py)
      canvas.setCell(px, py, '·', hex(col(v, v, v + 10)), cell.bg)
    }
  }

  for (const angle of spokes) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const steps = Math.max(1, Math.max(Math.abs(Math.round(cos * maxRx)), Math.abs(Math.round(sin * maxRy))))
    for (let i = 3; i <= steps; i++) {
      const frac = i / steps
      const px = Math.round(cx + cos * frac * maxRx)
      const py = Math.round(cy + sin * frac * maxRy)
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const v = Math.floor(45 + frac * 60)
      const cell = canvas.getCell(px, py)
      canvas.setCell(px, py, '·', hex(col(v - 5, v - 3, v + 12)), cell.bg)
    }
  }

  for (const ringR of rings) {
    const rx = ringR * maxRx
    const ry = ringR * maxRy
    const approxC = TAU * Math.sqrt((rx * rx + ry * ry) / 2)
    const steps = Math.max(60, Math.floor(approxC * 1.2))
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * TAU
      const px = Math.round(cx + Math.cos(a) * rx)
      const py = Math.round(cy + Math.sin(a) * ry)
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      const v = Math.floor(40 + ringR * 55)
      const cell = canvas.getCell(px, py)
      canvas.setCell(px, py, '·', hex(col(v - 5, v - 3, v + 10)), cell.bg)
    }
  }

  const hp = 0.7 + Math.sin(t * 0.4) * 0.15
  const hv = Math.floor(100 + hp * 55)
  canvas.setCell(cx, cy, '◉', hex(col(hv - 15, hv - 18, hv + 8)), canvas.getCell(cx, cy).bg)
  for (const [ddx, ddy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const hx = cx + ddx, hy = cy + ddy
    if (hx >= 0 && hx < W && hy >= 0 && hy < H) {
      canvas.setCell(hx, hy, '·', hex(col(hv - 30, hv - 33, hv - 5)), canvas.getCell(hx, hy).bg)
    }
  }

  for (const drop of drops) {
    const shimmer = Math.sin(t * drop.speed + drop.phase)
    const glow = 0.3 + shimmer * 0.35 + drop.size * 0.35
    if (glow < 0.15) continue

    const px = Math.round(drop.x)
    const py = Math.round(drop.y)
    if (px < 0 || px >= W || py < 0 || py >= H) continue

    const cell = canvas.getCell(px, py)

    const yt = py / Math.max(1, H - 1)
    let refract
    if (yt < 0.35) {
      refract = lerpMulti(['#5878ee', '#7860dd', '#bb70ee'], drop.dist)
    } else if (yt < 0.60) {
      refract = lerpMulti(['#cc58a8', '#ff5880', '#ff9060'], drop.dist)
    } else {
      refract = lerpMulti(['#ff8040', '#ffbb48', '#ffe880'], drop.dist)
    }

    const dColor = lerp(refract, '#ffffff', glow * 0.55)

    let ch
    if (glow > 0.78 && drop.size > 0.5) ch = '✦'
    else if (glow > 0.55) ch = '●'
    else if (glow > 0.32) ch = '•'
    else ch = '·'

    canvas.setCell(px, py, ch, hex(dColor), cell.bg)

    if (glow > 0.72 && drop.size > 0.55) {
      const si = Math.max(0, Math.min(H - 1, py))
      const haloC = lerp(sky[si], refract, 0.18)
      for (const [ddx, ddy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const hx = px + ddx, hy = py + ddy
        if (hx < 0 || hx >= W || hy < 0 || hy >= H) continue
        const hcell = canvas.getCell(hx, hy)
        if (hcell.char === ' ' || hcell.char === '·') {
          canvas.setCell(hx, hy, '·', hex(haloC), hcell.bg)
        }
      }
    }
  }
}
