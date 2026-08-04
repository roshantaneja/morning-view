import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Late Night Ramen'
export const description = 'Steam curls from a neon-lit doorway on a quiet rain-soaked street'
export const fps = 3

function srand(seed) {
  let s = Math.abs(seed | 0) || 1
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const NIGHT = ['#020208', '#040412', '#06061a', '#080822', '#0a0a28']
const BLDG_L = ['#070710', '#090914', '#0b0b18']
const BLDG_R = ['#080812', '#0a0a16', '#0c0c1a']

const WALL = ['#18140e', '#1c1812', '#201c16', '#24201a']
const WALL_WARM = ['#2c2418', '#34301e', '#3c3824', '#44402a']
const AWNING_COL = ['#10080c', '#180c10', '#201014']
const SIGN_BG = '#140810'

const GLOW = ['#ffa030', '#ffb848', '#ffcc60', '#ffdd78', '#ffe890']
const GLOW_SPILL = '#2a1808'

const NEON = '#ff1088'
const NEON_HALO = '#30081a'

const NOREN_COL = ['#0c1540', '#10194a', '#141d54', '#18215e']

const LANTERN_COL = ['#dd3300', '#ee4411', '#ff5522', '#ff7744']
const LANTERN_WIRE = '#664422'

const STREET_WET = ['#040408', '#06060c', '#080810', '#0a0a14']
const CURB = '#161618'

const STEAM_COL = ['#998877', '#887766', '#776655', '#665544', '#443322']
const RAIN_COL = '#1a2840'

export function setup(canvas) {
  const rng = srand(804)
  const w = canvas.width
  const h = canvas.height

  const stars = []
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.floor(rng() * w),
      y: Math.floor(rng() * Math.floor(h * 0.18)),
      b: 0.15 + rng() * 0.5,
      ph: rng() * 6.28,
      sp: 0.3 + rng() * 0.6,
    })
  }

  const rain = []
  for (let i = 0; i < 100; i++) {
    rain.push({
      x: rng() * w,
      y: rng() * h,
      sp: 2.5 + rng() * 3.5,
      br: 0.08 + rng() * 0.2,
    })
  }

  const steam = []
  for (let i = 0; i < 18; i++) {
    steam.push({
      xOff: (rng() - 0.5) * 6,
      t: rng(),
      sp: 0.012 + rng() * 0.02,
      phase: rng() * 6.28,
      amp: 0.3 + rng() * 1.0,
      freq: 0.08 + rng() * 0.15,
      sw: 1 + Math.floor(rng() * 2),
    })
  }

  const bldgWins = []
  for (let i = 0; i < 24; i++) {
    bldgWins.push({
      side: rng() < 0.5 ? 0 : 1,
      rx: Math.floor(rng() * 25) + 3,
      ry: Math.floor(rng() * 25) + 4,
      lit: rng() < 0.22,
      col: lerp('#aa8830', '#ddcc55', rng()),
    })
  }

  return { stars, rain, steam, bldgWins, rng }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  for (const d of state.rain) {
    d.y += d.sp
    d.x += 0.3
    if (d.y > canvas.height) { d.y = -1; d.x = state.rng() * canvas.width }
    if (d.x > canvas.width) d.x -= canvas.width
  }
  drawScene(canvas, state, frame.elapsed)
}

function dims(w, h) {
  const shopW = Math.max(28, Math.floor(w * 0.42))
  const shopL = Math.floor((w - shopW) / 2)
  const shopR = shopL + shopW
  const mid = Math.floor((shopL + shopR) / 2)
  const signY = Math.floor(h * 0.28)
  const awningY = signY - 3
  const streetY = Math.floor(h * 0.62)

  const winL = shopL + Math.max(2, Math.floor(shopW * 0.06))
  const winR = mid - 2
  const winTop = signY + 4
  const winBot = streetY - Math.max(4, Math.floor((streetY - signY) * 0.18))

  const doorL = mid + 2
  const doorR = shopR - Math.max(3, Math.floor(shopW * 0.08))
  const doorTop = signY + 5
  const doorBot = streetY - 1

  return { shopW, shopL, shopR, mid, signY, awningY, streetY,
    winL, winR, winTop, winBot, doorL, doorR, doorTop, doorBot }
}

function drawScene(canvas, state, t) {
  const w = canvas.width
  const h = canvas.height
  const D = dims(w, h)

  drawSky(canvas, state, t, D)
  drawBuildings(canvas, state, w, h, D)
  drawShopWalls(canvas, D)
  drawAwning(canvas, D)
  drawWindow(canvas, D)
  drawDoor(canvas, D)
  drawNoren(canvas, D, t)
  drawNeonSign(canvas, D, t)
  drawLantern(canvas, D, t)
  drawStreet(canvas, w, h, D)
  drawInteriorGlow(canvas, w, h, D)
  drawReflections(canvas, w, h, D, t)
  drawRain(canvas, state, w, h)
  drawSteam(canvas, state, h, D, t)
}

function drawSky(canvas, state, t, D) {
  const w = canvas.width
  for (let y = 0; y < D.streetY; y++) {
    const col = lerpMulti(NIGHT, Math.min(1, y / (D.streetY * 0.6)))
    for (let x = 0; x < w; x++) canvas.setCell(x, y, ' ', null, col)
  }
  for (const s of state.stars) {
    const tw = Math.sin(t * s.sp + s.ph) * 0.25 + 0.75
    const b = s.b * tw
    if (b < 0.1 || s.x < 4 || s.x >= canvas.width - 4) continue
    canvas.setCell(s.x, s.y, b > 0.4 ? '·' : '.', lerp('#0a0a22', '#ccccff', b))
  }
}

function drawBuildings(canvas, state, w, h, D) {
  const lTop = Math.floor(h * 0.14)
  const rTop = Math.floor(h * 0.17)

  for (let y = lTop; y < D.streetY; y++) {
    const bt = Math.min(1, (y - lTop) / 40)
    for (let x = 0; x < D.shopL - 1; x++) {
      canvas.setCell(x, y, ' ', null, lerpMulti(BLDG_L, bt * 0.6))
    }
  }
  for (let y = rTop; y < D.streetY; y++) {
    const bt = Math.min(1, (y - rTop) / 40 + 0.15)
    for (let x = D.shopR + 1; x < w; x++) {
      canvas.setCell(x, y, ' ', null, lerpMulti(BLDG_R, bt * 0.6))
    }
  }

  for (const win of state.bldgWins) {
    if (!win.lit) continue
    const bx = win.side === 0 ? win.rx : D.shopR + 1 + win.rx
    const by = (win.side === 0 ? lTop : rTop) + win.ry
    if (win.side === 0 && bx >= D.shopL - 2) continue
    if (win.side === 1 && bx >= w - 4) continue
    if (by >= D.streetY - 3 || by < (win.side === 0 ? lTop : rTop) + 2) continue
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const px = bx + dx, py = by + dy
        if (px >= 0 && px < w && py >= 0) {
          canvas.setCell(px, py, ' ', null, lerp(win.col, '#443311', 0.55))
        }
      }
    }
  }
}

function drawShopWalls(canvas, D) {
  for (let y = D.awningY; y < D.streetY; y++) {
    const wallT = (y - D.awningY) / (D.streetY - D.awningY)
    for (let x = D.shopL; x < D.shopR; x++) {
      const distMid = Math.abs(x - D.mid) / (D.shopW / 2)
      const warmth = Math.max(0, 1 - distMid * 1.4) * 0.4
      const col = lerp(
        lerpMulti(WALL, wallT * 0.7 + 0.1),
        lerpMulti(WALL_WARM, wallT * 0.5),
        warmth
      )
      canvas.setCell(x, y, ' ', null, col)
    }
  }
}

function drawAwning(canvas, D) {
  for (let x = D.shopL; x < D.shopR; x++) {
    for (let dy = 0; dy < 3; dy++) {
      const y = D.awningY + dy
      const col = lerpMulti(AWNING_COL, dy / 2)
      if (dy === 2) {
        canvas.setCell(x, y, '▄', '#3a1818', col)
      } else {
        canvas.setCell(x, y, ' ', null, col)
      }
    }
  }
}

function drawWindow(canvas, D) {
  for (let y = D.winTop; y <= D.winBot; y++) {
    for (let x = D.winL; x <= D.winR; x++) {
      if (y === D.winTop || y === D.winBot || x === D.winL || x === D.winR) {
        canvas.setCell(x, y, ' ', null, '#3a3020')
      } else {
        const intT = (y - D.winTop) / (D.winBot - D.winTop)
        const col = lerp(lerpMulti(GLOW, intT * 0.4 + 0.15), '#402010', 0.45)
        canvas.setCell(x, y, ' ', null, col)
      }
    }
  }

  const counterY = D.winBot - 3
  if (counterY > D.winTop + 2) {
    for (let x = D.winL + 1; x < D.winR; x++) {
      canvas.setCell(x, counterY, '─', '#60400a')
    }
    const spacing = Math.max(2, Math.floor((D.winR - D.winL - 4) / 5))
    for (let i = 0; i < 5; i++) {
      const bx = D.winL + 2 + i * spacing
      if (bx >= D.winR - 1) break
      if (counterY - 1 > D.winTop) canvas.setCell(bx, counterY - 1, '▌', '#301508')
      if (counterY - 2 > D.winTop) canvas.setCell(bx, counterY - 2, '│', '#281008')
    }
  }

  const crossX = Math.floor((D.winL + D.winR) / 2)
  for (let y = D.winTop + 1; y < D.winBot; y++) {
    canvas.setCell(crossX, y, '│', '#3a3020')
  }
}

function drawDoor(canvas, D) {
  for (let y = D.doorTop; y <= D.doorBot; y++) {
    for (let x = D.doorL; x <= D.doorR; x++) {
      const intT = (y - D.doorTop) / (D.doorBot - D.doorTop)
      canvas.setCell(x, y, ' ', null, lerpMulti(GLOW, intT * 0.25 + 0.05))
    }
  }
  for (let y = D.doorTop; y <= D.doorBot; y++) {
    canvas.setCell(D.doorL, y, '│', '#4a3a20')
    canvas.setCell(D.doorR, y, '│', '#4a3a20')
  }
  for (let x = D.doorL; x <= D.doorR; x++) {
    canvas.setCell(x, D.doorTop, '─', '#4a3a20')
  }
  canvas.setCell(D.doorL, D.doorTop, '┌', '#4a3a20')
  canvas.setCell(D.doorR, D.doorTop, '┐', '#4a3a20')
}

function drawNoren(canvas, D, t) {
  const norenBot = D.doorTop + Math.floor((D.doorBot - D.doorTop) * 0.42)
  const norenW = D.doorR - D.doorL - 1
  const strips = 4
  const stripW = Math.max(2, Math.floor(norenW / strips))

  for (let y = D.doorTop + 1; y <= norenBot; y++) {
    const curtT = (y - D.doorTop - 1) / Math.max(1, norenBot - D.doorTop - 1)
    for (let x = D.doorL + 1; x < D.doorR; x++) {
      const localX = x - D.doorL - 1
      const posInStrip = localX % stripW
      if (curtT > 0.5 && (posInStrip === 0 || posInStrip === stripW - 1)) continue
      if (curtT > 0.75 && (posInStrip === 1 || posInStrip === stripW - 2)) continue

      const depth = Math.sin(curtT * 3.14) * 0.3
      canvas.setCell(x, y, BLOCK.full, lerpMulti(NOREN_COL, curtT * 0.5 + depth))
    }
  }

  const circCX = Math.floor((D.doorL + D.doorR) / 2)
  const circCY = D.doorTop + Math.max(2, Math.floor((norenBot - D.doorTop) * 0.35))
  const circR = Math.min(3, Math.max(1, Math.floor(norenW * 0.12)))
  for (let dy = -circR; dy <= circR; dy++) {
    for (let dx = -circR * 2; dx <= circR * 2; dx++) {
      const dist = Math.sqrt((dx / 2) * (dx / 2) + dy * dy)
      if (dist <= circR * 0.85) {
        const px = circCX + dx
        const py = circCY + dy
        if (px > D.doorL && px < D.doorR && py > D.doorTop && py <= norenBot) {
          canvas.setCell(px, py, BLOCK.full, '#c0c8e0')
        }
      }
    }
  }
}

function drawNeonSign(canvas, D, t) {
  const text = 'R A M E N'
  const startX = D.mid - Math.floor(text.length / 2)
  const pulse = Math.sin(t * 2.5) * 0.12 + 0.88

  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= text.length + 2; dx++) {
      const px = startX + dx
      const py = D.signY + dy
      if (px < D.shopL || px >= D.shopR || py < D.awningY || py >= D.streetY) continue
      const distY = Math.abs(dy)
      const distX = dx < 0 ? -dx : (dx >= text.length ? dx - text.length + 1 : 0)
      const dist = Math.sqrt(distX * distX + distY * distY * 1.5)
      if (dist > 3) continue
      const str = (1 - dist / 3) * 0.35 * pulse
      const cell = canvas.getCell(px, py)
      if (cell && cell.bg) {
        canvas.setCell(px, py, cell.char, cell.fg, lerp(cell.bg, NEON_HALO, str))
      }
    }
  }

  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue
    const px = startX + i
    if (px >= D.shopL && px < D.shopR) {
      canvas.setCell(px, D.signY, text[i], lerp(NEON, '#ff50c0', (1 - pulse) * 2), SIGN_BG)
    }
  }
}

function drawLantern(canvas, D, t) {
  const lx = D.shopR - Math.max(4, Math.floor(D.shopW * 0.1))
  const ly = D.signY + 3
  const pulse = Math.sin(t * 1.6) * 0.08 + 0.92

  if (ly - 1 >= D.awningY && lx >= D.shopL && lx < D.shopR) {
    canvas.setCell(lx, ly - 1, '│', LANTERN_WIRE)
  }

  for (let dy = 0; dy < 4; dy++) {
    const py = ly + dy
    if (py >= D.streetY) break
    const bw = dy === 0 || dy === 3 ? 1 : 2
    for (let dx = -bw; dx <= bw; dx++) {
      const px = lx + dx
      if (px < D.shopL || px >= D.shopR) continue
      const brightness = (1 - Math.abs(dx) / (bw + 1)) * pulse
      const col = lerpMulti(LANTERN_COL, brightness * 0.4 + (1 - dy / 3) * 0.3)
      canvas.setCell(px, py, dy === 0 || dy === 3 ? '─' : BLOCK.full, col)
    }
  }

  for (let dy = -2; dy <= 6; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const px = lx + dx, py = ly + 1 + dy
      if (px < D.shopL || px >= D.shopR || py < D.awningY || py >= D.streetY) continue
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 5.5) continue
      const str = (1 - dist / 5.5) * 0.12 * pulse
      const cell = canvas.getCell(px, py)
      if (cell && cell.bg && cell.char === ' ') {
        canvas.setCell(px, py, ' ', null, lerp(cell.bg, '#2a1208', str))
      }
    }
  }
}

function drawStreet(canvas, w, h, D) {
  for (let x = 0; x < w; x++) {
    canvas.setCell(x, D.streetY, BLOCK.upper, CURB, lerpMulti(NIGHT, 0.8))
  }
  for (let y = D.streetY + 1; y < h; y++) {
    const stT = (y - D.streetY) / (h - D.streetY)
    for (let x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, lerpMulti(STREET_WET, stT * 0.5 + 0.2))
    }
  }
}

function drawInteriorGlow(canvas, w, h, D) {
  const doorCX = Math.floor((D.doorL + D.doorR) / 2)
  const doorW = D.doorR - D.doorL
  for (let dy = 0; dy < 8; dy++) {
    const y = D.streetY + 1 + dy
    if (y >= h - 3) break
    const fade = Math.max(0, 1 - dy / 8)
    const spreadW = Math.floor(doorW * (1 + dy * 0.5))
    for (let dx = -spreadW; dx <= spreadW; dx++) {
      const px = doorCX + dx
      if (px < 0 || px >= w) continue
      const edgeFade = 1 - Math.abs(dx) / (spreadW + 1)
      const str = fade * edgeFade * 0.25
      if (str < 0.01) continue
      const cell = canvas.getCell(px, y)
      if (cell && cell.bg) {
        canvas.setCell(px, y, cell.char, cell.fg, lerp(cell.bg, GLOW_SPILL, str))
      }
    }
  }

  for (let y = D.winTop - 2; y <= D.winBot + 2; y++) {
    for (let x = D.winL - 3; x <= D.winR + 3; x++) {
      if (x < D.shopL || x >= D.shopR || y < D.awningY || y >= D.streetY) continue
      if (x >= D.winL && x <= D.winR && y >= D.winTop && y <= D.winBot) continue
      const distX = x < D.winL ? D.winL - x : (x > D.winR ? x - D.winR : 0)
      const distY = y < D.winTop ? D.winTop - y : (y > D.winBot ? y - D.winBot : 0)
      const dist = Math.sqrt(distX * distX + distY * distY)
      if (dist > 4) continue
      const str = (1 - dist / 4) * 0.12
      const cell = canvas.getCell(x, y)
      if (cell && cell.bg && cell.char === ' ') {
        canvas.setCell(x, y, ' ', null, lerp(cell.bg, '#281808', str))
      }
    }
  }
}

function drawReflections(canvas, w, h, D, t) {
  const pulse = Math.sin(t * 2.5) * 0.12 + 0.88

  for (let y = D.streetY + 2; y < Math.min(h - 3, D.streetY + 22); y++) {
    const reflT = (y - D.streetY - 2) / 20
    const fade = Math.max(0, 1 - reflT) * 0.1 * pulse
    if (fade < 0.005) continue
    for (let dx = -12; dx <= 12; dx++) {
      const px = D.mid + dx
      if (px < 0 || px >= w) continue
      const edgeFade = 1 - Math.abs(dx) / 13
      const str = fade * edgeFade
      if (str < 0.005) continue
      const cell = canvas.getCell(px, y)
      if (cell && cell.bg) {
        canvas.setCell(px, y, cell.char, cell.fg, lerp(cell.bg, '#180410', str))
      }
    }
  }

  const text = 'R A M E N'
  const signStartX = D.mid - Math.floor(text.length / 2)
  for (let y = D.streetY + 2; y < Math.min(h - 3, D.streetY + 26); y++) {
    const reflT = (y - D.streetY - 2) / 24
    const fade = Math.max(0, 1 - reflT) * 0.22 * pulse
    if (fade < 0.01) continue
    const ripple = Math.sin(t * 1.8 + y * 0.6) * reflT * 1.5
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') continue
      const px = signStartX + i + Math.round(ripple)
      if (px >= 0 && px < w) {
        const cell = canvas.getCell(px, y)
        if (cell && cell.bg) {
          canvas.setCell(px, y, cell.char, cell.fg, lerp(cell.bg, '#280818', fade))
        }
      }
    }
  }

  for (let y = D.streetY + 1; y < Math.min(h - 3, D.streetY + 18); y++) {
    const reflT = (y - D.streetY - 1) / 17
    const fade = Math.max(0, 1 - reflT) * 0.15
    if (fade < 0.01) continue
    const ripple = Math.sin(t * 1.3 + y * 0.5) * reflT
    for (let x = D.doorL - 1; x <= D.doorR + 1; x++) {
      const px = x + Math.round(ripple)
      if (px >= 0 && px < w) {
        const cell = canvas.getCell(px, y)
        if (cell && cell.bg) {
          canvas.setCell(px, y, cell.char, cell.fg, lerp(cell.bg, '#1a1008', fade))
        }
      }
    }
  }

  const lx = D.shopR - Math.max(4, Math.floor(D.shopW * 0.1))
  const lanternPulse = Math.sin(t * 1.6) * 0.08 + 0.92
  for (let y = D.streetY + 2; y < Math.min(h - 3, D.streetY + 14); y++) {
    const reflT = (y - D.streetY - 2) / 12
    const fade = Math.max(0, 1 - reflT) * 0.1 * lanternPulse
    if (fade < 0.01) continue
    const ripple = Math.sin(t * 2.0 + y * 0.7) * reflT
    for (let dx = -2; dx <= 2; dx++) {
      const px = lx + dx + Math.round(ripple)
      if (px >= 0 && px < w) {
        const cell = canvas.getCell(px, y)
        if (cell && cell.bg) {
          canvas.setCell(px, y, cell.char, cell.fg, lerp(cell.bg, '#1a0804', fade))
        }
      }
    }
  }
}

function drawRain(canvas, state, w, h) {
  for (const d of state.rain) {
    const px = Math.floor(d.x)
    const py = Math.floor(d.y)
    if (px < 0 || px >= w || py < 0 || py >= h - 3) continue
    canvas.setCell(px, py, '┊', lerp('#060610', RAIN_COL, d.br))
  }
}

function drawSteam(canvas, state, h, D, t) {
  const w = canvas.width
  const doorCX = Math.floor((D.doorL + D.doorR) / 2)
  const baseY = D.doorTop

  for (const sp of state.steam) {
    const cycle = ((t || 0) * sp.sp * 10 + sp.t) % 1
    const sy = baseY - cycle * 18
    const drift = Math.sin((t || 0) * sp.freq + sp.phase) * sp.amp * (0.3 + cycle * 0.7)
    const sx = doorCX + sp.xOff + drift
    const px = Math.round(sx)
    const py = Math.round(sy)
    if (px < 4 || px >= w - 4 || py < 3 || py >= h) continue

    const fade = cycle < 0.15 ? cycle / 0.15 : Math.max(0, 1 - (cycle - 0.15) / 0.85)
    if (fade < 0.08) continue

    const col = lerpMulti(STEAM_COL, cycle * 0.8)
    const alpha = fade * 0.18
    for (let dx = 0; dx < sp.sw; dx++) {
      const ppx = px + dx
      if (ppx >= 4 && ppx < w - 4) {
        const cell = canvas.getCell(ppx, py)
        if (cell && cell.bg) {
          canvas.setCell(ppx, py, SHADE[0], lerp(cell.bg, col, alpha), cell.bg)
        }
      }
    }
  }
}
