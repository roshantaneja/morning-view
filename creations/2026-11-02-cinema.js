import { BLOCK, SHADE, BOX } from '../src/theme.js'

export const title = 'The Picture Palace'
export const description =
  'Somewhere between the projector hum and the silver screen, every story ever told is still playing'
export const fps = 3

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

const DARK_BG    = '#0a0608'
const WALL_DARK  = '#1a0c10'
const WALL_MID   = '#2a1418'
const WALL_LITE  = '#3a1c22'
const GOLD       = '#c8942c'
const GOLD_DIM   = '#7a5818'
const GOLD_BRIGHT= '#e8b840'
const CURTAIN_D  = '#5a0818'
const CURTAIN_M  = '#8a1020'
const CURTAIN_L  = '#a81830'
const SCREEN_BG  = '#d8dce8'
const SCREEN_LT  = '#eef0f8'
const BEAM_CORE  = '#38302a'
const BEAM_EDGE  = '#1a1210'
const SEAT_DARK  = '#1a0a0e'
const SEAT_MID   = '#2c1018'
const SEAT_BACK  = '#221014'
const VELVET     = '#3a1420'

export function setup(canvas, data) {
  const rng = srand(20261102)
  const motes = []
  for (let i = 0; i < 80; i++) {
    motes.push({
      x: rng(), y: rng(),
      speed: 0.003 + rng() * 0.008,
      drift: (rng() - 0.5) * 0.004,
      size: rng() < 0.3 ? 2 : 1,
      bright: 0.3 + rng() * 0.7,
      phase: rng() * TAU,
    })
  }
  const filmGrain = []
  for (let i = 0; i < 40; i++) {
    filmGrain.push({ x: rng(), y: rng(), life: rng() })
  }
  return { motes, filmGrain, phase: 0, rng, flickerSeed: 0 }
}

function drawBackground(canvas) {
  const W = canvas.width, H = canvas.height
  for (let y = 0; y < H; y++) {
    const t = y / H
    const bg = mix(DARK_BG, WALL_DARK, t * 0.5)
    for (let x = 0; x < W; x++) {
      canvas.setCell(x, y, ' ', null, bg)
    }
  }
}

function drawWalls(canvas) {
  const W = canvas.width, H = canvas.height
  const wallW = Math.floor(W * 0.12)
  for (let y = 0; y < H; y++) {
    const t = y / H
    for (let side = 0; side < 2; side++) {
      const baseX = side === 0 ? 0 : W - wallW
      for (let dx = 0; dx < wallW; dx++) {
        const x = baseX + dx
        const edgeDist = side === 0 ? dx / wallW : 1 - dx / wallW
        const wallColor = mix(WALL_MID, WALL_DARK, edgeDist * 0.6 + t * 0.3)
        canvas.setCell(x, y, ' ', null, wallColor)
      }
    }
  }
}

function drawArtDeco(canvas, phase) {
  const W = canvas.width, H = canvas.height
  const wallW = Math.floor(W * 0.12)
  const panelH = Math.floor(H * 0.08)
  const numPanels = Math.floor((H * 0.65) / (panelH + 4))

  for (let side = 0; side < 2; side++) {
    const cx = side === 0 ? Math.floor(wallW * 0.5) : W - Math.floor(wallW * 0.5)
    for (let p = 0; p < numPanels; p++) {
      const py = Math.floor(H * 0.08) + p * (panelH + 4)
      const pw = Math.floor(wallW * 0.6)
      const px = cx - Math.floor(pw / 2)
      for (let dy = 0; dy < panelH; dy++) {
        for (let dx = 0; dx < pw; dx++) {
          const x = px + dx, y = py + dy
          if (x >= 0 && x < W && y >= 0 && y < H) {
            if (dy === 0 || dy === panelH - 1 || dx === 0 || dx === pw - 1) {
              canvas.setCell(x, y, ' ', null, GOLD_DIM)
            }
          }
        }
      }
      const lightY = py + Math.floor(panelH / 2)
      const flicker = 0.7 + 0.3 * Math.sin(phase * 1.5 + p * 1.2 + side * 2.0)
      const lightColor = mix(GOLD_DIM, GOLD_BRIGHT, flicker)
      if (cx >= 0 && cx < W && lightY >= 0 && lightY < H) {
        canvas.setCell(cx, lightY, '◆', lightColor, null)
      }
      if (cx >= 0 && cx < W && lightY - 1 >= 0) {
        canvas.setCell(cx, lightY - 1, '│', GOLD_DIM, null)
      }
      if (cx >= 0 && cx < W && lightY + 1 < H) {
        canvas.setCell(cx, lightY + 1, '│', GOLD_DIM, null)
      }
    }

    const columnX = side === 0 ? wallW - 1 : W - wallW
    for (let y = Math.floor(H * 0.05); y < Math.floor(H * 0.75); y++) {
      if (columnX >= 0 && columnX < W) {
        const stripe = y % 6
        const ch = stripe < 2 ? '║' : stripe < 4 ? '│' : '┃'
        canvas.setCell(columnX, y, ch, GOLD_DIM, null)
      }
    }
  }

  const archY = Math.floor(H * 0.03)
  const archCx = Math.floor(W / 2)
  const archW = W - wallW * 2 - 4
  const archR = Math.floor(archW / 2)
  for (let dx = -archR; dx <= archR; dx++) {
    const x = archCx + dx
    if (x >= wallW && x < W - wallW) {
      const t = Math.abs(dx) / archR
      const decoChar = t < 0.3 ? '═' : t < 0.6 ? '─' : '╌'
      canvas.setCell(x, archY, decoChar, GOLD_DIM, null)
      if (archY + 1 < H && Math.abs(dx) % 8 === 0 && Math.abs(dx) > 2) {
        canvas.setCell(x, archY + 1, '◇', GOLD_DIM, null)
      }
    }
  }
}

function drawScreen(canvas, phase, filmGrain) {
  const W = canvas.width, H = canvas.height
  const wallW = Math.floor(W * 0.12)
  const sX = wallW + 6
  const sW = W - wallW * 2 - 12
  const sY = Math.floor(H * 0.06)
  const sH = Math.floor(H * 0.32)

  for (let dy = -1; dy <= sH; dy++) {
    for (let dx = -1; dx <= sW; dx++) {
      const x = sX + dx, y = sY + dy
      if (x < 0 || x >= W || y < 0 || y >= H) continue
      if (dy === -1 || dy === sH || dx === -1 || dx === sW) {
        canvas.setCell(x, y, ' ', null, '#444444')
        continue
      }

      const tx = dx / sW
      const ty = dy / sH
      const vigDist = Math.sqrt((tx - 0.5) ** 2 + (ty - 0.5) ** 2) * 2
      const vig = Math.max(0, 1 - vigDist * 0.4)

      const horizonY = 0.55
      if (ty > horizonY) {
        const groundT = (ty - horizonY) / (1 - horizonY)
        const base = mix('#3a5040', '#1a2820', groundT)
        const lit = mix(base, SCREEN_LT, vig * 0.2)
        canvas.setCell(x, y, ' ', null, lit)
      } else {
        const skyT = ty / horizonY
        const sunX = 0.5 + 0.1 * Math.sin(phase * 0.3)
        const sunY = 0.35 + 0.05 * Math.sin(phase * 0.2)
        const sunDist = Math.sqrt((tx - sunX) ** 2 + (skyT - sunY) ** 2)

        let skyColor
        if (sunDist < 0.12) {
          skyColor = mix('#fff8e0', '#ffc848', sunDist / 0.12)
        } else if (sunDist < 0.35) {
          skyColor = mix('#ffc848', '#e87830', (sunDist - 0.12) / 0.23)
        } else {
          const t2 = Math.min(1, (sunDist - 0.35) / 0.5)
          skyColor = mix('#e87830', '#2840a0', t2 * 0.6 + skyT * 0.4)
        }
        const lit = mix(skyColor, SCREEN_BG, vig * 0.08)
        canvas.setCell(x, y, ' ', null, lit)
      }
    }
  }

  const treePositions = [0.15, 0.3, 0.7, 0.85]
  for (const tx of treePositions) {
    const baseX = sX + Math.floor(tx * sW)
    const baseY = sY + Math.floor(0.55 * sH)
    const trunkH = Math.floor(sH * 0.18)
    for (let dy = 0; dy < trunkH; dy++) {
      const x = baseX, y = baseY - dy
      if (x >= sX && x < sX + sW && y >= sY && y < sY + sH) {
        canvas.setCell(x, y, '│', '#1a1208', null)
      }
    }
    const canopyR = Math.floor(sW * 0.04) + 1
    const canopyCY = baseY - trunkH
    for (let cdy = -canopyR; cdy <= canopyR; cdy++) {
      for (let cdx = -canopyR - 1; cdx <= canopyR + 1; cdx++) {
        const dist = Math.sqrt(cdx * cdx + cdy * cdy)
        if (dist <= canopyR + 0.5) {
          const cx = baseX + cdx, cy = canopyCY + cdy
          if (cx >= sX && cx < sX + sW && cy >= sY && cy < sY + sH) {
            const shade = mix('#0a2010', '#183018', dist / canopyR)
            canvas.setCell(cx, cy, SHADE[Math.floor(dist / canopyR * 2)], '#1a3020', shade)
          }
        }
      }
    }
  }

  for (const grain of filmGrain) {
    grain.life -= 0.05
    if (grain.life <= 0) {
      grain.x = Math.random()
      grain.y = Math.random()
      grain.life = 0.5 + Math.random() * 0.5
    }
    const gx = sX + Math.floor(grain.x * sW)
    const gy = sY + Math.floor(grain.y * sH)
    if (gx >= sX && gx < sX + sW && gy >= sY && gy < sY + sH) {
      const existing = canvas.getCell(gx, gy)
      if (existing && existing.bg) {
        const flickered = mix(existing.bg, '#ffffff', 0.08 * grain.life)
        canvas.setCell(gx, gy, existing.char, existing.fg, flickered)
      }
    }
  }
}

function drawCurtains(canvas) {
  const W = canvas.width, H = canvas.height
  const wallW = Math.floor(W * 0.12)
  const screenTop = Math.floor(H * 0.04)
  const screenBot = Math.floor(H * 0.06) + Math.floor(H * 0.32) + 2
  const curtainW = 5

  for (let side = 0; side < 2; side++) {
    const baseX = side === 0 ? wallW + 1 : W - wallW - curtainW - 1
    for (let y = screenTop; y < screenBot + 4; y++) {
      for (let dx = 0; dx < curtainW; dx++) {
        const x = baseX + dx
        if (x < 0 || x >= W || y < 0 || y >= H) continue
        const fold = Math.sin(dx * 1.2 + y * 0.15)
        const t = fold * 0.5 + 0.5
        const color = mix(CURTAIN_D, CURTAIN_L, t)
        const ch = fold > 0.3 ? SHADE[3] : fold > -0.2 ? SHADE[2] : SHADE[1]
        canvas.setCell(x, y, ch, color, mix(color, CURTAIN_D, 0.5))
      }
    }
    const valanceY = screenTop - 1
    if (valanceY >= 0) {
      for (let dx = -1; dx < curtainW + 1; dx++) {
        const x = baseX + dx
        if (x >= 0 && x < W) {
          canvas.setCell(x, valanceY, '▓', CURTAIN_M, CURTAIN_D)
        }
      }
    }
  }

  const pelmetY = screenTop - 2
  if (pelmetY >= 0) {
    for (let x = wallW; x < W - wallW; x++) {
      canvas.setCell(x, pelmetY, '═', GOLD_DIM, null)
    }
  }

  const tassels = [wallW + 6, W - wallW - 7]
  for (const tx of tassels) {
    for (let dy = 0; dy < 3; dy++) {
      const y = screenTop + dy
      if (tx >= 0 && tx < W && y >= 0 && y < H) {
        canvas.setCell(tx, y, dy === 0 ? '●' : dy === 1 ? '║' : '╨', GOLD, null)
      }
    }
  }
}

function drawProjectorBeam(canvas, phase, motes) {
  const W = canvas.width, H = canvas.height
  const projX = Math.floor(W / 2)
  const projY = Math.floor(H * 0.58)
  const screenCX = Math.floor(W / 2)
  const screenCY = Math.floor(H * 0.22)

  const beamLen = projY - screenCY
  for (let step = 0; step < beamLen; step++) {
    const t = step / beamLen
    const y = projY - step
    const spread = (1 - t) * 2 + t * Math.floor(W * 0.25)
    const halfW = Math.floor(spread / 2)
    const cx = projX + Math.floor(Math.sin(t * 0.3) * 2)

    for (let dx = -halfW; dx <= halfW; dx++) {
      const x = cx + dx
      if (x < 0 || x >= W || y < 0 || y >= H) continue
      const edgeDist = Math.abs(dx) / (halfW || 1)
      if (edgeDist > 1) continue
      const alpha = (1 - edgeDist * edgeDist) * 0.06 * (0.5 + 0.5 * t)
      const existing = canvas.getCell(x, y)
      if (existing && existing.bg) {
        const lit = mix(existing.bg, '#c8b898', alpha)
        canvas.setCell(x, y, existing.char, existing.fg, lit)
      }
    }
  }

  for (const mote of motes) {
    mote.y -= mote.speed
    mote.x += mote.drift + Math.sin(phase * 2 + mote.phase) * 0.001
    if (mote.y < 0) { mote.y = 1; mote.x = Math.random() }
    if (mote.x < 0 || mote.x > 1) { mote.x = Math.random(); mote.y = 0.8 + Math.random() * 0.2 }

    const beamT = 1 - mote.y
    const beamWidth = (1 - beamT) * 0.02 + beamT * 0.42
    const centerOff = Math.abs(mote.x - 0.5)
    if (centerOff > beamWidth) continue

    const mx = Math.floor(projX + (mote.x - 0.5) * W * 0.6)
    const my = Math.floor(screenCY + mote.y * beamLen)
    if (mx < 0 || mx >= W || my < 0 || my >= H) continue

    const flicker = 0.5 + 0.5 * Math.sin(phase * 3 + mote.phase)
    const bright = mote.bright * flicker
    const moteColor = mix('#50483a', '#f0e0c0', bright)
    const ch = mote.size > 1 ? '·' : '∙'
    canvas.setCell(mx, my, ch, moteColor, null)
  }

  if (projX >= 0 && projX < W && projY >= 0 && projY < H) {
    canvas.setCell(projX, projY, '◈', GOLD, DARK_BG)
    const flicker = 0.6 + 0.4 * Math.sin(phase * 4)
    const lensColor = mix('#887040', '#e8d0a0', flicker)
    if (projX - 1 >= 0) canvas.setCell(projX - 1, projY, '▐', lensColor, DARK_BG)
    if (projX + 1 < W) canvas.setCell(projX + 1, projY, '▌', lensColor, DARK_BG)
    if (projY - 1 >= 0) canvas.setCell(projX, projY - 1, '▄', GOLD_DIM, DARK_BG)
    if (projY + 1 < H) canvas.setCell(projX, projY + 1, '▀', GOLD_DIM, DARK_BG)
  }
}

function drawSeats(canvas) {
  const W = canvas.width, H = canvas.height
  const wallW = Math.floor(W * 0.12)
  const seatStartY = Math.floor(H * 0.62)
  const numRows = Math.min(12, Math.floor((H - seatStartY - 6) / 3))
  const seatAreaW = W - wallW * 2 - 8
  const seatsPerRow = Math.floor(seatAreaW / 3)

  for (let row = 0; row < numRows; row++) {
    const y = seatStartY + row * 3
    const rowScale = 1 + row * 0.08
    const rowW = Math.min(Math.floor(seatsPerRow * rowScale), Math.floor(seatAreaW / 2))
    const startX = Math.floor(W / 2) - Math.floor(rowW * 1.5)

    for (let s = 0; s < rowW; s++) {
      const x = startX + s * 3
      if (x < wallW + 2 || x >= W - wallW - 2) continue
      if (y < 0 || y >= H - 4) continue

      const distFromCenter = Math.abs(x - W / 2) / (W / 2)
      const rowDarkness = row / numRows
      const seatColor = mix(SEAT_MID, SEAT_DARK, rowDarkness * 0.5 + distFromCenter * 0.3)
      const backColor = mix(VELVET, SEAT_BACK, rowDarkness * 0.6)

      canvas.setCell(x, y, '▄', seatColor, backColor)
      if (x + 1 < W) canvas.setCell(x + 1, y, '▄', seatColor, backColor)
      if (y + 1 < H) {
        canvas.setCell(x, y + 1, BLOCK.upper, SEAT_DARK, null)
        if (x + 1 < W) canvas.setCell(x + 1, y + 1, BLOCK.upper, SEAT_DARK, null)
      }
    }

    if (row === 0 || row === numRows - 1) {
      const aisleL = startX - 2
      const aisleR = startX + rowW * 3 + 1
      if (aisleL >= 0 && aisleL < W && y < H) {
        canvas.setCell(aisleL, y, '│', GOLD_DIM, null)
      }
      if (aisleR >= 0 && aisleR < W && y < H) {
        canvas.setCell(aisleR, y, '│', GOLD_DIM, null)
      }
    }
  }
}

function drawFloorLights(canvas, phase) {
  const W = canvas.width, H = canvas.height
  const wallW = Math.floor(W * 0.12)
  const aisleY = Math.floor(H * 0.60)

  for (let x = wallW + 4; x < W - wallW - 4; x += 8) {
    if (x >= 0 && x < W && aisleY >= 0 && aisleY < H) {
      const flicker = 0.6 + 0.4 * Math.sin(phase * 2 + x * 0.3)
      const color = mix('#4a3018', GOLD, flicker * 0.5)
      canvas.setCell(x, aisleY, '•', color, null)
    }
  }
}

function drawScene(canvas, state, elapsed) {
  const phase = elapsed || state.phase
  drawBackground(canvas)
  drawWalls(canvas)
  drawArtDeco(canvas, phase)
  drawScreen(canvas, phase, state.filmGrain)
  drawCurtains(canvas)
  drawProjectorBeam(canvas, phase, state.motes)
  drawSeats(canvas)
  drawFloorLights(canvas, phase)
}

export function render(canvas, data, state) {
  if (!state) state = { motes: [], filmGrain: [], phase: 0 }
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  state.phase = frame.elapsed
  drawScene(canvas, state, frame.elapsed)
}
