import { lerpMulti, lerp, SHADE } from '../src/theme.js'

export const title = 'Strange Attractor'
export const description = 'The Lorenz system traces its luminous, never-repeating orbit through phase space'
export const fps = 2

const BG = ['#02010a', '#030112', '#04021a', '#050322']

const TRAIL = [
  '#04031a', '#080628', '#0e0a40', '#161060',
  '#201880', '#2c28a0', '#3a40b8', '#4c60cc',
  '#6088e0', '#80b0f0', '#a8d8f8', '#d8f4ff',
]

const STAR_COLORS = ['#1a2838', '#283848', '#384858', '#486878']

const SIGMA = 10
const RHO = 28
const BETA = 8 / 3
const DT = 0.004
const NUM_POINTS = 50000
const WARMUP = 1000
const ASPECT = 2.0
const TILT = 55 * Math.PI / 180
const COS_TILT = Math.cos(TILT)
const SIN_TILT = Math.sin(TILT)
const CENTER_Z = 23.5

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function computeTrajectory() {
  let x = 0.1, y = 0, z = 0
  const buf = new Float32Array(NUM_POINTS * 3)

  for (let i = 0; i < WARMUP; i++) {
    const dx = SIGMA * (y - x)
    const dy = x * (RHO - z) - y
    const dz = x * y - BETA * z
    x += dx * DT
    y += dy * DT
    z += dz * DT
  }

  for (let i = 0; i < NUM_POINTS; i++) {
    const dx = SIGMA * (y - x)
    const dy = x * (RHO - z) - y
    const dz = x * y - BETA * z
    x += dx * DT
    y += dy * DT
    z += dz * DT
    buf[i * 3] = x
    buf[i * 3 + 1] = y
    buf[i * 3 + 2] = z
  }

  return buf
}

export function setup(canvas) {
  const traj = computeTrajectory()

  const rng = seededRandom(77)
  const stars = Array.from({ length: 60 }, function () {
    return {
      x: Math.floor(rng() * canvas.width),
      y: Math.floor(rng() * canvas.height),
      b: rng(),
      sp: 0.3 + rng() * 1.2,
      ph: rng() * Math.PI * 2,
    }
  })

  return { traj: traj, stars: stars, angle: 0, head: 0 }
}

export function render(canvas, data, state) {
  drawScene(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  state.angle += 0.02
  state.head = (state.head + 150) % NUM_POINTS
  drawScene(canvas, state, frame.elapsed)
}

function drawScene(canvas, state, time) {
  var w = canvas.width
  var h = canvas.height
  var traj = state.traj
  var stars = state.stars
  var angle = state.angle
  var head = state.head

  var y, x, cell

  for (y = 0; y < h; y++) {
    var rowT = y / h
    var bgColor = lerpMulti(BG, rowT)
    for (x = 0; x < w; x++) {
      canvas.setCell(x, y, ' ', null, bgColor)
    }
  }

  for (var si = 0; si < stars.length; si++) {
    var s = stars[si]
    var tw = Math.sin(time * s.sp + s.ph) * 0.5 + 0.5
    var bright = s.b * tw
    if (bright < 0.2) continue
    var starColor = lerpMulti(STAR_COLORS, Math.min(bright, 1))
    var starCh = bright > 0.8 ? '✦' : '·'
    cell = canvas.getCell(s.x, s.y)
    if (cell && cell.char === ' ') {
      canvas.setCell(s.x, s.y, starCh, starColor, cell.bg)
    }
  }

  var cosA = Math.cos(angle)
  var sinA = Math.sin(angle)

  var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9
  for (var i = 0; i < NUM_POINTS; i += 40) {
    var ax = traj[i * 3]
    var ay = traj[i * 3 + 1]
    var az = traj[i * 3 + 2] - CENTER_Z
    var rx = ax * cosA - ay * sinA
    var ry = ax * sinA + ay * cosA
    var sx = rx
    var sy = -(ry * SIN_TILT + az * COS_TILT) / ASPECT
    if (sx < mnx) mnx = sx
    if (sx > mxx) mxx = sx
    if (sy < mny) mny = sy
    if (sy > mxy) mxy = sy
  }

  var midX = (mnx + mxx) / 2
  var midY = (mny + mxy) / 2
  var rangeX = mxx - mnx
  var rangeY = mxy - mny
  if (rangeX < 1) rangeX = 1
  if (rangeY < 1) rangeY = 1
  var pad = Math.min(5, Math.floor(Math.min(w, h) / 4))
  var scaleX = (w - pad * 2) / rangeX
  var scaleY = (h - pad * 2) / rangeY
  var scale = Math.min(scaleX, scaleY)

  var density = new Float32Array(w * h)

  for (var i = 0; i < NUM_POINTS; i++) {
    var ax = traj[i * 3]
    var ay = traj[i * 3 + 1]
    var az = traj[i * 3 + 2] - CENTER_Z
    var rx = ax * cosA - ay * sinA
    var ry = ax * sinA + ay * cosA
    var sx = (rx - midX) * scale
    var sy = ((-(ry * SIN_TILT + az * COS_TILT) / ASPECT) - midY) * scale
    var cx = Math.floor(w / 2 + sx)
    var cy = Math.floor(h / 2 + sy)

    if (cx >= 1 && cx < w - 1 && cy >= 0 && cy < h) {
      density[cy * w + cx] += 1
      density[cy * w + cx - 1] += 0.25
      density[cy * w + cx + 1] += 0.25
    }
  }

  var maxD = 1
  for (var i = 0; i < w * h; i++) {
    if (density[i] > maxD) maxD = density[i]
  }

  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      var d = density[y * w + x]
      if (d < 0.1) continue

      var t = Math.pow(d / maxD, 0.4)
      var color = lerpMulti(TRAIL, Math.min(t, 1))

      var ch
      if (t > 0.7) ch = SHADE[3]
      else if (t > 0.4) ch = SHADE[2]
      else if (t > 0.2) ch = SHADE[1]
      else ch = SHADE[0]

      cell = canvas.getCell(x, y)
      var bg = (cell && cell.bg) || '#02010a'
      canvas.setCell(x, y, ch, color, lerp(bg, color, t * 0.25))
    }
  }

  var hi = head
  var hx = traj[hi * 3]
  var hy = traj[hi * 3 + 1]
  var hz = traj[hi * 3 + 2] - CENTER_Z
  var hrx = hx * cosA - hy * sinA
  var hry = hx * sinA + hy * cosA
  var hsx = (hrx - midX) * scale
  var hsy = ((-(hry * SIN_TILT + hz * COS_TILT) / ASPECT) - midY) * scale
  var hcx = Math.floor(w / 2 + hsx)
  var hcy = Math.floor(h / 2 + hsy)

  var glowR = 4
  for (var dy = -glowR; dy <= glowR; dy++) {
    for (var dx = -glowR - 1; dx <= glowR + 1; dx++) {
      var gx = hcx + dx
      var gy = hcy + dy
      if (gx < 0 || gx >= w || gy < 0 || gy >= h) continue
      var dist = Math.sqrt(dx * dx + dy * dy * ASPECT * ASPECT) / glowR
      if (dist > 1.2) continue
      var falloff = Math.pow(Math.max(0, 1 - dist), 2) * 0.3
      if (falloff < 0.02) continue
      cell = canvas.getCell(gx, gy)
      var gbg = (cell && cell.bg) || '#02010a'
      canvas.setCell(gx, gy, (cell && cell.char) || ' ', cell && cell.fg, lerp(gbg, '#3050cc', falloff))
    }
  }

  if (hcx >= 0 && hcx < w && hcy >= 0 && hcy < h) {
    canvas.setCell(hcx, hcy, '●', '#ffffff', '#2838aa')
  }
}
