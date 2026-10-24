import { BLOCK, SHADE } from '../src/theme.js'

export const title = 'Moonlit Labyrinth'
export const description =
  'Every turning leads inward — the maze is patient, the center is warm, and the path was yours all along'
export const fps = 2

const TAIL = 28

function cl(v) { return Math.max(0, Math.min(255, Math.round(v) || 0)) }
function c2h(r, g, b) {
  return '#' + cl(r).toString(16).padStart(2, '0') +
               cl(g).toString(16).padStart(2, '0') +
               cl(b).toString(16).padStart(2, '0')
}

function srand(seed) {
  let s = (seed & 0x7fffffff) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

/* ── maze generation (recursive backtracker) ── */

function carve(C, R, rand) {
  const g = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => ({ v: 0, N: 1, S: 1, E: 1, W: 1 }))
  )
  const D = [['N',0,-1,'S'],['S',0,1,'N'],['E',1,0,'W'],['W',-1,0,'E']]
  const sx = C >> 1, sy = R >> 1
  g[sy][sx].v = 1
  const stk = [[sx, sy]]
  while (stk.length) {
    const [x, y] = stk[stk.length - 1]
    const nb = D.filter(([, dx, dy]) => {
      const nx = x + dx, ny = y + dy
      return nx >= 0 && nx < C && ny >= 0 && ny < R && !g[ny][nx].v
    })
    if (!nb.length) { stk.pop(); continue }
    for (let i = nb.length - 1; i > 0; i--) {
      const j = (rand() * (i + 1)) | 0; [nb[i], nb[j]] = [nb[j], nb[i]]
    }
    const [d, dx, dy, o] = nb[0]
    const nx = x + dx, ny = y + dy
    g[y][x][d] = 0; g[ny][nx][o] = 0; g[ny][nx].v = 1
    stk.push([nx, ny])
  }
  return g
}

function toMap(g, C, R) {
  const w = C * 2 + 1, h = R * 2 + 1
  const m = Array.from({ length: h }, () => new Uint8Array(w).fill(1))
  for (let cy = 0; cy < R; cy++) for (let cx = 0; cx < C; cx++) {
    const mx = cx * 2 + 1, my = cy * 2 + 1
    m[my][mx] = 0
    if (!g[cy][cx].N) m[my - 1][mx] = 0
    if (!g[cy][cx].S) m[my + 1][mx] = 0
    if (!g[cy][cx].W) m[my][mx - 1] = 0
    if (!g[cy][cx].E) m[my][mx + 1] = 0
  }
  return { m, w, h }
}

function solve(m, w, h, sx, sy, ex, ey) {
  const vis = Array.from({ length: h }, () => new Uint8Array(w))
  const par = Array.from({ length: h }, () => new Array(w))
  vis[sy][sx] = 1
  const q = [[sx, sy]]
  while (q.length) {
    const [x, y] = q.shift()
    if (x === ex && y === ey) break
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && !vis[ny][nx] && !m[ny][nx]) {
        vis[ny][nx] = 1; par[ny][nx] = [x, y]; q.push([nx, ny])
      }
    }
  }
  const p = []
  let c = [ex, ey]
  while (c) { p.unshift(c); c = par[c[1]]?.[c[0]] ?? null }
  return p.length > 1 ? p : [[sx, sy]]
}

/* ── lifecycle ── */

export function setup(canvas) {
  const rand = srand(241026)

  const MC = 10, MR = 12
  const grid = carve(MC, MR, rand)
  const { m, w: mw, h: mh } = toMap(grid, MC, MR)

  const eX = (MC >> 1) * 2 + 1
  m[0][eX] = 0

  const cX = eX
  const cY = (MR >> 1) * 2 + 1
  const path = solve(m, mw, mh, eX, 0, cX, cY)

  const leaves = []
  for (let i = 0; i < 45; i++) {
    const lx = (rand() * mw) | 0, ly = (rand() * mh) | 0
    if (m[ly][lx]) leaves.push({ lx, ly, ox: rand(), oy: rand(), ci: (rand() * 5) | 0 })
  }

  const stars = []
  for (let i = 0; i < 70; i++)
    stars.push({ x: rand(), y: rand(), b: rand(), r: 0.3 + rand() * 2 })

  return { m, mw, mh, path, cX, cY, eX, leaves, stars, step: 0, hold: 0 }
}

export function render(canvas, data, state) { paint(canvas, state, 0) }

export function update(canvas, data, frame, state) {
  if (state.hold > 0) {
    state.hold--
    if (!state.hold) state.step = 0
  } else {
    state.step++
    if (state.step > state.path.length + TAIL + 6) state.hold = 8
  }
  paint(canvas, state, frame.elapsed)
}

/* ── drawing ── */

function paint(canvas, st, t) {
  const { m, mw, mh, path, cX, cY, eX, leaves, stars, step } = st
  const W = canvas.width, H = canvas.height

  const cw = Math.max(2, ((W - 6) / mw) | 0)
  const ch = Math.max(1, ((H - 6) / mh) | 0)
  const tw = mw * cw, th = mh * ch
  const ox = (W - tw) >> 1
  const oy = Math.max(2, ((H - th) >> 1) - 2)

  /* sky gradient */
  for (let y = 0; y < H; y++) {
    const f = y / H
    const bg = c2h(2 + f * 5, 2 + f * 6, 8 + f * 10)
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', bg, bg)
  }

  /* stars above maze */
  const skyH = Math.max(1, oy - 1)
  for (const s of stars) {
    const sx = (s.x * W) | 0
    const sy = (s.y * skyH) | 0
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue
    const bri = cl(40 + s.b * 140 * (0.5 + 0.5 * Math.sin(t * s.r + s.b * 6.28)))
    canvas.setCell(sx, sy, s.b > 0.85 ? '✦' : '·', c2h(bri, bri, bri + 12))
  }

  /* crescent moon */
  const moonX = (W * 0.22) | 0
  const moonY = Math.max(0, (skyH * 0.3) | 0)
  if (moonY < H && moonX < W) canvas.setCell(moonX, moonY, '☾', '#e0d8b8')

  /* trail glow lookup */
  const glowMap = new Map()
  for (let i = 0; i < path.length; i++) {
    const behind = step - i
    if (behind < 0) break
    if (behind > TAIL) continue
    glowMap.set(path[i][0] * 100 + path[i][1], 1 - behind / TAIL)
  }
  const head = step < path.length ? path[step] : path[path.length - 1]
  const done = step >= path.length
  const bloom = done ? Math.min(9, (step - path.length) * 0.45) : 0

  /* maze cells */
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      const px0 = ox + mx * cw, py0 = oy + my * ch
      const wall = m[my][mx]
      const gv = glowMap.get(mx * 100 + my) || 0
      const dC = Math.sqrt((mx - cX) ** 2 + (my - cY) ** 2)
      const dH = Math.sqrt((mx - head[0]) ** 2 + (my - head[1]) ** 2)

      for (let dy = 0; dy < ch; dy++) {
        for (let dx = 0; dx < cw; dx++) {
          const px = px0 + dx, py = py0 + dy
          if (px < 0 || px >= W || py < 0 || py >= H) continue

          if (wall) {
            /* hedge */
            const sd = ((mx * 17 + my * 31 + dx * 7 + dy * 13) & 0xfff) % 100
            let r = 7 + (sd & 11)
            let g = 22 + sd % 18
            let b = 7 + (sd & 6)

            if (dy === 0) { r += 5; g += 8; b += 12 }

            const wg = Math.max(gv * 0.12, dH < 4 ? (1 - dH / 4) * 0.08 : 0)
            r += wg * 55; g += wg * 35; b += wg * 8

            if (bloom > 0 && dC < bloom) {
              const bf = (1 - dC / bloom) * 0.3
              r += bf * 80; g += bf * 55; b += bf * 14
            }

            const hc = sd < 25 ? BLOCK.medium : sd < 55 ? BLOCK.dark : BLOCK.full
            canvas.setCell(px, py, hc, c2h(r, g, b), c2h(r * 0.3, g * 0.3, b * 0.3))

          } else {
            /* path */
            let r = 7, g = 7, b = 15
            let fc = ' ', fg = '#0e0e1c'
            const sd = ((mx * 23 + my * 37 + dx * 11 + dy * 19) & 0xfff) % 100
            if (sd < 3) { fc = '·'; fg = '#1a1a2a' }

            if (gv > 0) {
              r += gv * 42; g += gv * 30; b += gv * 8
              if (gv > 0.85) {
                fc = BLOCK.light; fg = '#ffcc44'
              } else if (gv > 0.35) {
                fc = '·'; fg = c2h(85 + gv * 130, 65 + gv * 95, 18 + gv * 30)
              }
            }

            const glowR = 5 + bloom
            if (dC < glowR) {
              const cg = done
                ? Math.max(0, 1 - dC / glowR) * 0.7
                : Math.max(0, 1 - dC / 5) * 0.15
              r += cg * 110; g += cg * 75; b += cg * 20

              if (mx === cX && my === cY) {
                const p = 0.65 + 0.35 * Math.sin(t * 1.5)
                fc = '✦'; fg = c2h(255 * p, 210 * p, 60 * p)
              }
            }

            canvas.setCell(px, py, fc, fg, c2h(r, g, b))
          }
        }
      }
    }
  }

  /* entrance gate markers */
  {
    const epx = ox + eX * cw, epy = oy - 1
    if (epy >= 0 && epy < H) {
      if (epx - 1 >= 0) canvas.setCell(epx - 1, epy, '╮', '#334455')
      if (epx + cw < W) canvas.setCell(epx + cw, epy, '╭', '#334455')
    }
  }

  /* autumn leaves on hedges */
  const LC = ['#cc4400', '#dd6622', '#eebb33', '#aa3300', '#ff7744']
  for (const lf of leaves) {
    const lpx = ox + lf.lx * cw + ((lf.ox * Math.max(0, cw - 1)) | 0)
    const lpy = oy + lf.ly * ch + ((lf.oy * Math.max(0, ch - 1)) | 0)
    if (lpx >= 0 && lpx < W && lpy >= 0 && lpy < H)
      canvas.setCell(lpx, lpy, '•', LC[lf.ci])
  }

  /* fog wisps */
  for (let i = 0; i < 5; i++) {
    const ph = t * 0.15 + i * 2.1
    const fcx = ox + (0.5 + 0.35 * Math.sin(ph)) * tw
    const fcy = oy + (0.5 + 0.25 * Math.cos(ph * 0.6)) * th
    const fl = 4 + ((3 * Math.abs(Math.sin(ph))) | 0)
    for (let f = 0; f < fl; f++) {
      const fx = (fcx + f * 1.5) | 0
      const fy = (fcy + Math.sin(f * 0.4 + ph)) | 0
      if (fx < ox || fx >= ox + tw || fy < oy || fy >= oy + th) continue
      const dfH = Math.abs(fx - (ox + head[0] * cw)) + Math.abs(fy - (oy + head[1] * ch))
      const dfC = Math.abs(fx - (ox + cX * cw)) + Math.abs(fy - (oy + cY * ch))
      if (dfH < cw * 3 || dfC < cw * 4) continue
      const a = 1 - Math.abs(f - fl / 2) / (fl / 2)
      if (a > 0.25)
        canvas.setCell(fx, fy, SHADE[0], c2h(38 + a * 30, 42 + a * 30, 58 + a * 35))
    }
  }
}
