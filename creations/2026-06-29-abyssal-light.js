import { lerpMulti, lerp, BLOCK, SHADE } from '../src/theme.js'

export const title = 'Abyssal Light'
export const description = 'Bioluminescent jellyfish drift through midnight ocean depths'
export const fps = 2

const OCEAN = ['#010208', '#020410', '#030818', '#041020', '#051428']

export function setup(canvas) {
  const jellies = [
    makeJelly(canvas, 0.28, 0.22, 1.0, ['#881155', '#cc2288', '#ee66cc', '#ff99ee'], '#ff44aa'),
    makeJelly(canvas, 0.65, 0.38, 0.85, ['#114488', '#2266cc', '#66aaee', '#99ccff'], '#44aaff'),
    makeJelly(canvas, 0.38, 0.58, 0.7, ['#551199', '#8822cc', '#cc66ee', '#ee99ff'], '#aa44ff'),
    makeJelly(canvas, 0.80, 0.68, 0.55, ['#117755', '#22aa88', '#66eebb', '#99ffdd'], '#44ffcc'),
  ]

  const snowCount = Math.floor(canvas.width * canvas.height * 0.007)
  const snow = Array.from({ length: snowCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 0.12 + Math.random() * 0.2,
    drift: Math.random() * Math.PI * 2,
    char: Math.random() > 0.6 ? '·' : '∘',
    brightness: 0.15 + Math.random() * 0.25,
  }))

  const specks = []
  for (const j of jellies) {
    const count = Math.floor(6 * j.size)
    for (let i = 0; i < count; i++) {
      specks.push({
        baseX: j.x + (Math.random() - 0.5) * 24 * j.size,
        baseY: j.baseY + (Math.random() - 0.5) * 18 * j.size,
        orbit: Math.random() * Math.PI * 2,
        radius: 4 + Math.random() * 10,
        speed: 0.15 + Math.random() * 0.3,
        color: j.colors[2],
        twinkle: Math.random() * Math.PI * 2,
      })
    }
  }

  return { jellies, snow, specks }
}

function makeJelly(canvas, fracX, fracY, size, colors, glow) {
  return {
    x: canvas.width * fracX,
    baseY: canvas.height * fracY,
    y: canvas.height * fracY,
    size, colors, glow,
    phase: Math.random() * Math.PI * 2,
    tentPhase: Math.random() * Math.PI * 2,
  }
}

export function render(canvas, data, state) {
  drawAll(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  const t = frame.elapsed
  for (const j of state.jellies) {
    j.y = j.baseY + Math.sin(t * 0.3 + j.phase) * 3
    j.x += Math.sin(t * 0.12 + j.phase * 2) * 0.06
  }
  for (const s of state.snow) {
    s.y += s.speed
    s.x += Math.sin(t * 0.2 + s.drift) * 0.04
    if (s.y >= canvas.height) { s.y = -1; s.x = Math.random() * canvas.width }
  }
  canvas.clear()
  drawAll(canvas, state, t)
}

function drawAll(canvas, state, time) {
  drawOcean(canvas)
  drawRays(canvas, time)
  const sorted = [...state.jellies].sort((a, b) => a.size - b.size)
  for (const j of sorted) drawGlow(canvas, j, time)
  drawSnow(canvas, state.snow)
  drawSpecks(canvas, state.specks, time)
  for (const j of sorted) {
    drawBell(canvas, j, time)
    drawTentacles(canvas, j, time)
    drawOralArms(canvas, j, time)
  }
}

function oceanColorAt(y, height) {
  const t = Math.min(Math.max(y / Math.max(height - 1, 1), 0), 1)
  return lerpMulti(OCEAN, t)
}

function drawOcean(canvas) {
  for (let y = 0; y < canvas.height; y++) {
    const c = oceanColorAt(y, canvas.height)
    for (let x = 0; x < canvas.width; x++) {
      canvas.setCell(x, y, ' ', null, c)
    }
  }
}

function drawRays(canvas, time) {
  for (let i = 0; i < 4; i++) {
    const baseX = canvas.width * (0.12 + i * 0.26)
    const sway = Math.sin(time * 0.06 + i * 1.3) * 4
    const depth = Math.floor(canvas.height * 0.5)
    for (let y = 0; y < depth; y++) {
      const fade = 1 - y / depth
      const w = 1.5 + y * 0.035
      const tilt = y * 0.06 * (i % 2 === 0 ? 1 : -1)
      for (let dx = -Math.ceil(w); dx <= Math.ceil(w); dx++) {
        const x = Math.floor(baseX + sway + dx + tilt)
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const edge = 1 - Math.abs(dx) / Math.max(w, 1)
          const alpha = fade * fade * edge * 0.035
          if (alpha > 0.003) {
            const base = oceanColorAt(y, canvas.height)
            canvas.setCell(x, y, ' ', null, lerp(base, '#0e1e40', Math.min(alpha * 12, 1)))
          }
        }
      }
    }
  }
}

function drawGlow(canvas, j, time) {
  const pulse = 0.55 + Math.sin(time * 0.6 + j.phase) * 0.45
  const rx = Math.floor(14 * j.size)
  const ry = Math.floor(12 * j.size)
  const cx = Math.floor(j.x)
  const cy = Math.floor(j.y)
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const nd = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)
      if (nd < 1) {
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const dist = Math.sqrt(nd)
          const intensity = (1 - dist) * (1 - dist) * pulse * 0.18 * j.size
          if (intensity > 0.008) {
            const base = oceanColorAt(y, canvas.height)
            canvas.setCell(x, y, ' ', null, lerp(base, j.glow, Math.min(intensity, 0.35)))
          }
        }
      }
    }
  }
}

function drawSnow(canvas, snow) {
  for (const s of snow) {
    const x = Math.floor(s.x)
    const y = Math.floor(s.y)
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      canvas.setCell(x, y, s.char, lerp('#040810', '#162840', s.brightness))
    }
  }
}

function drawSpecks(canvas, specks, time) {
  for (const sp of specks) {
    const angle = sp.orbit + time * sp.speed
    const x = Math.floor(sp.baseX + Math.cos(angle) * sp.radius)
    const y = Math.floor(sp.baseY + Math.sin(angle) * sp.radius * 0.5)
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const twinkle = 0.3 + Math.sin(time * 1.5 + sp.twinkle) * 0.35 + 0.35
      if (twinkle > 0.5) {
        canvas.setCell(x, y, twinkle > 0.8 ? '✦' : '·', lerp('#030610', sp.color, twinkle * 0.6))
      }
    }
  }
}

function drawBell(canvas, j, time) {
  const cx = Math.floor(j.x)
  const cy = Math.floor(j.y)
  const bellW = Math.floor(7 * j.size)
  const bellH = Math.floor(5 * j.size)
  const pulse = 0.55 + Math.sin(time * 0.6 + j.phase) * 0.45

  for (let dy = -bellH; dy <= 1; dy++) {
    let rowW
    if (dy <= 0) {
      const f = dy / Math.max(bellH, 1)
      rowW = Math.floor(bellW * Math.sqrt(Math.max(1 - f * f, 0)))
    } else {
      rowW = Math.floor(bellW * 0.85)
    }
    for (let dx = -rowW; dx <= rowW; dx++) {
      const x = cx + dx
      const y = cy + dy
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const fromEdge = 1 - Math.abs(dx) / Math.max(rowW, 1)
        const colorT = Math.min(fromEdge * pulse, 1)
        const color = lerpMulti(j.colors, colorT)

        if (dy === -bellH) {
          if (Math.abs(dx) < rowW) canvas.setCell(x, y, BLOCK.upper, color)
        } else if (dy === 1) {
          const frill = (cx + dx) % 2 === 0 ? '~' : '≈'
          canvas.setCell(x, y, frill, lerpMulti(j.colors, pulse * 0.7))
        } else {
          const inner = fromEdge > 0.7
          const mid = fromEdge > 0.35
          const ch = inner ? SHADE[3] : mid ? SHADE[2] : SHADE[1]
          const bg = lerp('#010208', j.colors[0], fromEdge * 0.2 * pulse)
          canvas.setCell(x, y, ch, color, bg)
        }
      }
    }
  }

  const innerW = Math.floor(bellW * 0.4)
  const innerH = Math.floor(bellH * 0.5)
  for (let dy = -innerH; dy <= 0; dy++) {
    const f = dy / Math.max(innerH, 1)
    const rw = Math.floor(innerW * Math.sqrt(Math.max(1 - f * f, 0)))
    for (let dx = -rw; dx <= rw; dx++) {
      const x = cx + dx
      const y = cy + dy
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const glow = lerpMulti(j.colors, pulse * 0.9)
        canvas.setCell(x, y, SHADE[3], glow, lerp('#010208', j.colors[1], pulse * 0.3))
      }
    }
  }
}

function drawTentacles(canvas, j, time) {
  const cx = Math.floor(j.x)
  const startY = Math.floor(j.y) + 2
  const count = Math.max(3, Math.floor(6 * j.size))
  const maxLen = Math.floor(22 * j.size)

  for (let t = 0; t < count; t++) {
    const spread = count > 1 ? (t / (count - 1)) * 2 - 1 : 0
    const ox = Math.floor(spread * 5 * j.size)
    const len = maxLen - Math.floor(Math.abs(spread) * maxLen * 0.3)

    for (let i = 0; i < len; i++) {
      const p = i / Math.max(len - 1, 1)
      const sway = Math.sin(time * 0.35 + j.tentPhase + t * 0.6 + i * 0.22)
        * (1.2 + p * 3.5) * j.size
      const x = Math.floor(cx + ox + sway + spread * i * 0.15)
      const y = startY + i
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const fade = 1 - p * 0.9
        const color = lerp(j.colors[2], j.colors[0], p)
        const dimmed = lerp(color, '#010208', 1 - fade)
        const chars = ['│', '╎', '┊', '·']
        canvas.setCell(x, y, chars[Math.min(Math.floor(p * 4), 3)], dimmed)
      }
    }
  }
}

function drawOralArms(canvas, j, time) {
  const cx = Math.floor(j.x)
  const startY = Math.floor(j.y) + 2
  const armCount = Math.max(2, Math.floor(3 * j.size))
  const armLen = Math.floor(8 * j.size)

  for (let a = 0; a < armCount; a++) {
    const spread = armCount > 1 ? (a / (armCount - 1)) * 2 - 1 : 0
    const ox = Math.floor(spread * 2 * j.size)
    for (let i = 0; i < armLen; i++) {
      const p = i / Math.max(armLen - 1, 1)
      const wobble = Math.sin(time * 0.5 + j.phase + a * 1.2 + i * 0.4)
        * (0.8 + p * 2) * j.size
      const x = Math.floor(cx + ox + wobble)
      const y = startY + i
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const fade = 1 - p * 0.7
        const color = lerp(j.colors[3], j.colors[1], p)
        const dimmed = lerp(color, '#010208', 1 - fade)
        canvas.setCell(x, y, i < armLen / 2 ? '┃' : '╏', dimmed)
      }
    }
  }
}
