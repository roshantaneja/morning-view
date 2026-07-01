import { lerpMulti, lerp, SHADE } from '../src/theme.js'

export const title = 'Thermal Bloom'
export const description = 'Heat signatures pulse and converge in amber darkness'
export const fps = 2

const HEAT = [
  '#04010a', '#120408', '#280a10', '#44101a',
  '#662010', '#993818', '#cc5a20', '#ee8830',
  '#ffbb44', '#ffe888', '#fffadd',
]

export function setup(canvas) {
  const blobs = [
    makeBlob(canvas, 0.25, 0.18, 12, 0),
    makeBlob(canvas, 0.62, 0.28, 10, 1),
    makeBlob(canvas, 0.40, 0.48, 14, 2),
    makeBlob(canvas, 0.78, 0.42, 9, 3),
    makeBlob(canvas, 0.30, 0.68, 11, 4),
    makeBlob(canvas, 0.68, 0.62, 13, 5),
    makeBlob(canvas, 0.50, 0.82, 8, 6),
  ]

  const particles = Array.from({ length: 30 }, () => spawnParticle(blobs))

  return { blobs, particles }
}

function makeBlob(canvas, xf, yf, radius, i) {
  return {
    x: xf * canvas.width,
    baseY: yf * canvas.height,
    y: yf * canvas.height,
    radius,
    ySpeed: 0.05 + i * 0.012,
    yAmp: 4 + (i % 3) * 3.5,
    xSpeed: 0.02 + i * 0.007,
    phase: (i / 7) * Math.PI * 2,
  }
}

function spawnParticle(blobs) {
  const b = blobs[Math.floor(Math.random() * blobs.length)]
  return {
    x: b.x + (Math.random() - 0.5) * b.radius,
    y: b.y + (Math.random() - 0.5) * b.radius * 0.4,
    vy: -(0.3 + Math.random() * 0.5),
    vx: (Math.random() - 0.5) * 0.15,
    life: 0.7 + Math.random() * 0.3,
    decay: 0.01 + Math.random() * 0.015,
    char: Math.random() > 0.5 ? '·' : '∘',
  }
}

export function render(canvas, data, state) {
  drawAll(canvas, state)
}

export function update(canvas, data, frame, state) {
  const t = frame.elapsed

  for (const b of state.blobs) {
    b.y = b.baseY + Math.sin(t * b.ySpeed + b.phase) * b.yAmp
    b.x += Math.sin(t * b.xSpeed + b.phase * 1.5) * 0.1
    b.x = Math.max(5, Math.min(canvas.width - 5, b.x))
  }

  for (const p of state.particles) {
    p.y += p.vy
    p.x += p.vx + Math.sin(t * 0.4 + p.x * 0.1) * 0.06
    p.life -= p.decay
    if (p.life <= 0 || p.y < 0) Object.assign(p, spawnParticle(state.blobs))
  }

  canvas.clear()
  drawAll(canvas, state)
}

function drawAll(canvas, state) {
  drawField(canvas, state.blobs)
  drawParticles(canvas, state.particles)
}

function drawField(canvas, blobs) {
  const w = canvas.width
  const h = canvas.height

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let field = 0
      for (const b of blobs) {
        const dx = x - b.x
        const dy = (y - b.y) * 1.6
        field += (b.radius * b.radius) / (dx * dx + dy * dy + 1)
      }

      const t = Math.min(Math.sqrt(field * 0.5), 1)

      if (t < 0.06) {
        canvas.setCell(x, y, ' ', null, '#04010a')
      } else {
        const color = lerpMulti(HEAT, t)
        if (t > 0.75) {
          canvas.setCell(x, y, SHADE[3], color, lerp('#04010a', color, 0.35))
        } else if (t > 0.5) {
          canvas.setCell(x, y, SHADE[2], color, '#04010a')
        } else if (t > 0.3) {
          canvas.setCell(x, y, SHADE[1], color, '#04010a')
        } else {
          canvas.setCell(x, y, SHADE[0], color, '#04010a')
        }
      }
    }
  }
}

function drawParticles(canvas, particles) {
  for (const p of particles) {
    if (p.life <= 0) continue
    const x = Math.floor(p.x)
    const y = Math.floor(p.y)
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const color = lerp('#442010', '#ffcc66', Math.min(p.life * 1.2, 1))
      canvas.setCell(x, y, p.char, color)
    }
  }
}
