import { hex, bgHex, BLOCK, SHADE } from '../src/theme.js'

export const title = "Witch's Cottage"
export const description =
  'Past the jack-o’-lanterns and the crooked gate, the kettle is already singing — come in, come in'
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

const P = {
  skyTop: '#05030a', skyBot: '#18102e',
  moon: '#f0e8c0', moonDim: '#c0b880',
  star: '#e8e0b0',
  roofDark: '#181520', roofMid: '#242030', roofEdge: '#302838',
  wallDark: '#36281e', wallMid: '#46362a', wallLight: '#564838',
  chimneyCol: '#2e2828',
  windowGlow: '#e89030', windowHot: '#ffb848', windowFrame: '#201810',
  doorWood: '#382818', doorLight: '#483820',
  treeDark: '#0c0a08',
  ground: '#0c0a06', groundMid: '#14100c',
  path: '#28201a', pathEdge: '#342a20',
  pumpkin: '#c85818', pumpkinLit: '#e87828', pumpkinInner: '#ff9838',
  pumpkinStem: '#283010',
  smoke: '#585860', smokeFade: '#383840',
  leafA: '#7a4018', leafB: '#5a3018', leafC: '#6a2818',
}

export function setup(canvas) {
  const W = canvas.width, H = canvas.height
  const rng = srand(103029)

  const skyH = Math.floor(H * 0.45)
  const stars = []
  for (let i = 0; i < 55; i++) {
    stars.push({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * skyH),
      b: 0.3 + rng() * 0.7,
      sp: 0.4 + rng() * 0.8,
      ph: rng() * TAU,
    })
  }

  const cw = Math.max(30, Math.floor(W * 0.32))
  const ch = Math.max(16, Math.floor(H * 0.2))
  const cx = Math.floor((W - cw) / 2)
  const cy = Math.floor(H * 0.34)
  const roofH = Math.floor(ch * 0.55)
  const roofPeak = cy - roofH
  const groundLine = cy + ch
  const ovh = 3

  const chimX = cx + Math.floor(cw * 0.76)
  const chimW = Math.max(2, Math.floor(cw * 0.08))
  const chimTop = roofPeak - 3

  const winW = Math.max(5, Math.floor(cw * 0.18))
  const winH = Math.max(3, Math.floor(ch * 0.28))
  const winY = cy + Math.floor(ch * 0.18)
  const w1x = cx + Math.floor(cw * 0.12)
  const w2x = cx + Math.floor(cw * 0.62)

  const doorW = Math.max(5, Math.floor(cw * 0.16))
  const doorH = Math.max(6, Math.floor(ch * 0.42))
  const doorX = Math.floor(cx + cw / 2 - doorW / 2)
  const doorY = cy + ch - doorH

  const pumpkins = []
  for (let i = 0; i < 10; i++) {
    const px = Math.floor(rng() * W)
    const py = groundLine + 2 + Math.floor(rng() * Math.max(1, Math.floor(H * 0.12)))
    if (Math.abs(px - W / 2) < cw * 0.4 && py < groundLine + 4) continue
    if (py >= H - 4 || px < 2 || px >= W - 2) continue
    pumpkins.push({
      x: px, y: py,
      big: rng() > 0.6,
      face: Math.floor(rng() * 3),
      gph: rng() * TAU,
    })
  }

  const trees = []
  for (let i = 0; i < Math.floor(W / 12); i++) {
    const tx = Math.floor(rng() * W)
    if (Math.abs(tx - W / 2) < cw * 0.65) continue
    trees.push({
      x: tx,
      h: Math.floor(H * 0.25 + rng() * H * 0.2),
      tw: 1 + Math.floor(rng()),
      branches: 3 + Math.floor(rng() * 4),
      seed: Math.floor(rng() * 99999),
    })
  }

  return {
    stars, pumpkins, trees,
    smoke: [],
    cot: { x: cx, y: cy, w: cw, h: ch },
    roofPeak, ovh, groundLine,
    chim: { x: chimX, w: chimW, top: chimTop },
    wins: [
      { x: w1x, y: winY, w: winW, h: winH },
      { x: w2x, y: winY, w: winW, h: winH },
    ],
    door: { x: doorX, y: doorY, w: doorW, h: doorH },
  }
}

function draw(canvas, st, t) {
  const W = canvas.width, H = canvas.height
  const { stars, pumpkins, trees, smoke, cot, roofPeak, ovh, groundLine, chim, wins, door } = st

  // sky + ground gradient
  for (let y = 0; y < H; y++) {
    const bg = y <= groundLine
      ? mix(P.skyTop, P.skyBot, y / groundLine)
      : mix(P.ground, P.groundMid, Math.min(1, (y - groundLine) / (H - groundLine)))
    for (let x = 0; x < W; x++) canvas.setCell(x, y, ' ', null, bgHex(bg))
  }

  // moon
  const moonX = Math.floor(W * 0.8), moonY = Math.floor(H * 0.08), moonR = 4
  for (let dy = -moonR - 2; dy <= moonR + 2; dy++) {
    for (let dx = -moonR - 2; dx <= moonR + 2; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      const px = moonX + dx, py = moonY + dy
      if (px < 0 || px >= W || py < 0 || py >= H) continue
      if (d <= moonR) {
        const inner = Math.sqrt((dx - 2.5) * (dx - 2.5) + dy * dy)
        if (inner > moonR - 0.3) {
          const br = 1 - d / moonR * 0.3
          canvas.setCell(px, py, BLOCK.full, hex(mix(P.moonDim, P.moon, br)),
            bgHex(mix(P.skyTop, P.moon, 0.15)))
        }
      } else if (d <= moonR + 2) {
        const g = 1 - (d - moonR) / 2
        const skyC = mix(P.skyTop, P.skyBot, py / (groundLine || 1))
        canvas.setCell(px, py, ' ', null, bgHex(mix(skyC, P.moonDim, g * 0.12)))
      }
    }
  }

  // stars
  const sc = ['.', '·', '∙', '+', '✦']
  for (const s of stars) {
    const tw = Math.sin(t * s.sp + s.ph) * 0.5 + 0.5
    if (tw < 0.15) continue
    const b = s.b * tw
    const ci = Math.min(sc.length - 1, Math.floor(b * sc.length))
    if (s.x >= 0 && s.x < W && s.y >= 0 && s.y < H)
      canvas.setCell(s.x, s.y, sc[ci], hex(mix('#303040', P.star, b)))
  }

  // trees (silhouettes)
  for (const tr of trees) {
    const rng = srand(tr.seed)
    const base = groundLine
    const top = Math.max(0, base - tr.h)
    for (let y = base; y > top; y--) {
      for (let dx = 0; dx < tr.tw; dx++) {
        const px = tr.x + dx
        if (px >= 0 && px < W && y >= 0 && y < H)
          canvas.setCell(px, y, BLOCK.full, hex(P.treeDark), bgHex(P.treeDark))
      }
    }
    for (let b = 0; b < tr.branches; b++) {
      const by = Math.floor(top + (base - top) * (0.05 + rng() * 0.55))
      const dir = rng() > 0.5 ? 1 : -1
      const len = Math.floor(4 + rng() * 10)
      for (let i = 0; i < len; i++) {
        const bx = tr.x + i * dir
        const bby = by - Math.floor(i * 0.25)
        if (bx >= 0 && bx < W && bby >= 0 && bby < H)
          canvas.setCell(bx, bby, BLOCK.full, hex(P.treeDark), bgHex(P.treeDark))
        if (i > 2 && rng() > 0.5) {
          for (let dy = -1; dy <= 1; dy++) {
            const lx = bx + (rng() > 0.5 ? 1 : -1), ly = bby + dy
            if (lx >= 0 && lx < W && ly >= 0 && ly < H && rng() > 0.3)
              canvas.setCell(lx, ly, SHADE[Math.floor(rng() * 2)],
                hex(P.treeDark), bgHex('#000000'))
          }
        }
      }
    }
  }

  // cottage walls
  for (let y = cot.y; y < cot.y + cot.h; y++) {
    for (let x = cot.x; x < cot.x + cot.w; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue
      const h = Math.sin(x * 13.7 + y * 27.3) * 43758.5453
      const v = h - Math.floor(h)
      const c = v > 0.65 ? P.wallLight : v > 0.3 ? P.wallMid : P.wallDark
      const mortar = (x % 5 === 0 || (y % 3 === 0 && x % 5 < 2))
      canvas.setCell(x, y, SHADE[1], hex(mortar ? P.wallDark : c), bgHex(P.wallDark))
    }
  }

  // chimney (draw before roof so roof covers the base)
  for (let y = chim.top; y < cot.y + 2; y++) {
    for (let x = chim.x; x < chim.x + chim.w; x++) {
      if (x >= 0 && x < W && y >= 0 && y < H)
        canvas.setCell(x, y, SHADE[2], hex(P.chimneyCol), bgHex(mix(P.chimneyCol, '#000000', 0.4)))
    }
  }
  for (let x = chim.x - 1; x <= chim.x + chim.w; x++) {
    const capY = chim.top - 1
    if (x >= 0 && x < W && capY >= 0 && capY < H)
      canvas.setCell(x, capY, BLOCK.lower, hex('#403838'))
  }

  // roof (triangle)
  const roofCX = cot.x + Math.floor(cot.w / 2)
  const roofBot = cot.y + 2
  for (let y = roofPeak; y < roofBot; y++) {
    const prog = (y - roofPeak) / Math.max(1, roofBot - roofPeak)
    const hw = Math.floor(prog * (cot.w / 2 + ovh))
    for (let x = roofCX - hw; x <= roofCX + hw; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue
      // skip chimney area (chimney rises above roof)
      if (x >= chim.x && x < chim.x + chim.w && y >= chim.top) continue
      const tex = ((x + y) % 3 === 0) ? P.roofMid : P.roofEdge
      canvas.setCell(x, y, SHADE[1 + ((x + y) % 2)], hex(tex), bgHex(P.roofDark))
    }
    // edge highlights
    const lx = roofCX - hw, rx = roofCX + hw
    if (lx >= 0 && lx < W && y >= 0 && y < H)
      canvas.setCell(lx, y, BLOCK.full, hex(P.roofEdge), bgHex(P.roofDark))
    if (rx >= 0 && rx < W && y >= 0 && y < H)
      canvas.setCell(rx, y, BLOCK.full, hex(P.roofEdge), bgHex(P.roofDark))
  }

  // windows
  for (const w of wins) {
    const pulse = Math.sin(t * 0.7 + w.x * 0.1) * 0.08 + 0.92
    // frame
    for (let y = w.y - 1; y <= w.y + w.h; y++)
      for (let x = w.x - 1; x <= w.x + w.w; x++)
        if (x >= 0 && x < W && y >= 0 && y < H)
          canvas.setCell(x, y, BLOCK.full, hex(P.windowFrame), bgHex(P.windowFrame))
    // warm panes
    for (let y = w.y; y < w.y + w.h; y++)
      for (let x = w.x; x < w.x + w.w; x++)
        if (x >= 0 && x < W && y >= 0 && y < H) {
          const d = Math.sqrt(((x - w.x - w.w / 2) / w.w) ** 2 +
            ((y - w.y - w.h / 2) / w.h) ** 2)
          const c = mix(P.windowHot, P.windowGlow, d)
          const f = mix(c, '#000000', 1 - pulse)
          canvas.setCell(x, y, BLOCK.full, hex(f), bgHex(f))
        }
    // mullions
    const mx = w.x + Math.floor(w.w / 2), my = w.y + Math.floor(w.h / 2)
    for (let y = w.y; y < w.y + w.h; y++)
      if (mx >= 0 && mx < W && y >= 0 && y < H)
        canvas.setCell(mx, y, '│', hex(P.windowFrame))
    for (let x = w.x; x < w.x + w.w; x++)
      if (x >= 0 && x < W && my >= 0 && my < H)
        canvas.setCell(x, my, '─', hex(P.windowFrame))
    if (mx >= 0 && mx < W && my >= 0 && my < H)
      canvas.setCell(mx, my, '┼', hex(P.windowFrame))
    // light spill below window on wall
    for (let dy = 1; dy <= 3; dy++) {
      const spread = dy + 1
      for (let dx = -spread; dx <= w.w + spread; dx++) {
        const px = w.x + dx - 1, py = w.y + w.h + dy
        if (px >= 0 && px < W && py >= 0 && py < H && py < cot.y + cot.h)
          canvas.setCell(px, py, SHADE[0],
            hex(mix(P.wallDark, P.windowGlow, (1 - dy / 4) * pulse * 0.15)))
      }
    }
  }

  // door
  for (let y = door.y; y < door.y + door.h; y++)
    for (let x = door.x; x < door.x + door.w; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue
      if (y === door.y) {
        const dx = (x - door.x - door.w / 2) / (door.w / 2)
        if (Math.abs(dx) > 0.9) continue
      }
      const h = Math.sin(x * 47.1) * 43758.5453
      const c = (h - Math.floor(h)) > 0.5 ? P.doorLight : P.doorWood
      canvas.setCell(x, y, SHADE[2], hex(c), bgHex(mix(c, '#000000', 0.3)))
    }
  const hx = door.x + door.w - 2, hy = door.y + Math.floor(door.h * 0.45)
  if (hx >= 0 && hx < W && hy >= 0 && hy < H)
    canvas.setCell(hx, hy, '●', hex('#a08040'))

  // path
  const pcx = Math.floor(W / 2)
  const pathEnd = Math.min(H - 5, groundLine + Math.floor(H * 0.28))
  for (let y = groundLine; y < pathEnd; y++) {
    const prog = (y - groundLine) / Math.max(1, pathEnd - groundLine)
    const pw = Math.floor(door.w / 2 + prog * 6)
    const wobble = Math.sin(y * 0.12) * 2
    for (let dx = -pw; dx <= pw; dx++) {
      const px = pcx + dx + Math.floor(wobble)
      if (px >= 0 && px < W && y >= 0 && y < H) {
        const edge = Math.abs(dx) / (pw + 0.1)
        const c = edge > 0.75 ? P.pathEdge : P.path
        canvas.setCell(px, y, SHADE[0], hex(c), bgHex(mix(c, P.ground, 0.3)))
      }
    }
  }

  // door light spill on ground
  const dg = Math.sin(t * 0.4) * 0.05 + 0.95
  for (let dy = 0; dy < 6; dy++) {
    const spread = Math.floor((dy + 1) * 1.5)
    for (let ddx = -spread; ddx <= door.w + spread; ddx++) {
      const px = door.x + ddx, py = groundLine + dy
      if (px >= 0 && px < W && py >= 0 && py < H) {
        const d = Math.sqrt(ddx * ddx + dy * dy * 2)
        const fall = Math.max(0, 1 - d / 10) * dg
        if (fall > 0.03)
          canvas.setCell(px, py, SHADE[0],
            hex(mix(P.ground, P.windowGlow, fall * 0.2)),
            bgHex(mix(P.ground, P.windowGlow, fall * 0.12)))
      }
    }
  }

  // pumpkins
  for (const p of pumpkins) {
    if (p.x < 2 || p.x >= W - 2 || p.y < 1 || p.y >= H - 1) continue
    const glow = Math.sin(t * 1.6 + p.gph) * 0.25 + 0.75
    const pc = mix(P.pumpkin, P.pumpkinLit, glow)
    const gc = mix(P.pumpkinLit, P.pumpkinInner, glow)

    if (p.big && p.y + 1 < H) {
      canvas.setCell(p.x - 2, p.y, '(', hex(pc))
      canvas.setCell(p.x - 1, p.y, '▴', hex('#080400'), bgHex(gc))
      canvas.setCell(p.x, p.y, BLOCK.full, hex(gc), bgHex(gc))
      canvas.setCell(p.x + 1, p.y, '▴', hex('#080400'), bgHex(gc))
      canvas.setCell(p.x + 2, p.y, ')', hex(pc))
      if (p.y - 1 >= 0) canvas.setCell(p.x, p.y - 1, '│', hex(P.pumpkinStem))
      canvas.setCell(p.x - 1, p.y + 1, BLOCK.upper, hex(pc))
      canvas.setCell(p.x, p.y + 1, '▿', hex('#080400'), bgHex(gc))
      canvas.setCell(p.x + 1, p.y + 1, BLOCK.upper, hex(pc))
    } else {
      canvas.setCell(p.x - 1, p.y, '(', hex(pc))
      canvas.setCell(p.x + 1, p.y, ')', hex(pc))
      if (p.y - 1 >= 0) canvas.setCell(p.x, p.y - 1, '│', hex(P.pumpkinStem))
      const faces = ['▾', '◡', '⌂']
      canvas.setCell(p.x, p.y, faces[p.face], hex('#080400'), bgHex(gc))
    }

    // pumpkin glow on ground
    for (let gy = 1; gy <= 2; gy++)
      for (let gx = -2; gx <= 2; gx++) {
        const gpx = p.x + gx, gpy = p.y + gy + (p.big ? 1 : 0)
        if (gpx >= 0 && gpx < W && gpy >= 0 && gpy < H) {
          const d = Math.sqrt(gx * gx + gy * gy)
          const f = Math.max(0, 1 - d / 3) * glow * 0.12
          if (f > 0.02)
            canvas.setCell(gpx, gpy, ' ', null, bgHex(mix(P.ground, P.pumpkinInner, f)))
        }
      }
  }

  // scattered leaves
  const leafC = [P.leafA, P.leafB, P.leafC]
  const leafCh = ['~', ',', '·']
  const lrng = srand(8675309)
  for (let i = 0; i < 40; i++) {
    const lx = Math.floor(lrng() * W)
    const ly = groundLine + 1 + Math.floor(lrng() * Math.max(1, H - groundLine - 3))
    const ci = Math.floor(lrng() * 3)
    if (lx >= 0 && lx < W && ly >= 0 && ly < H)
      canvas.setCell(lx, ly, leafCh[ci], hex(leafC[ci]))
  }

  // mushrooms
  const mrng = srand(2718)
  for (let i = 0; i < 6; i++) {
    const mx = Math.floor(mrng() * W)
    const my = groundLine + 1 + Math.floor(mrng() * 4)
    if (mx >= 0 && mx < W && my >= 0 && my < H && my + 1 < H) {
      if (Math.abs(mx - W / 2) > cot.w * 0.4) {
        canvas.setCell(mx, my, '♠', hex('#8a2018'))
        canvas.setCell(mx, my + 1, '│', hex('#c0a880'))
      }
    }
  }

  // bats (a few tiny silhouettes near the moon)
  const batPhase = t * 0.6
  for (let i = 0; i < 3; i++) {
    const bx = Math.floor(W * 0.7 + Math.sin(batPhase + i * 2.1) * 12 + i * 5)
    const by = Math.floor(H * 0.12 + Math.cos(batPhase * 0.7 + i * 1.7) * 4)
    const wingUp = Math.sin(t * 3 + i * 2) > 0
    if (bx >= 1 && bx < W - 1 && by >= 0 && by < H) {
      canvas.setCell(bx, by, wingUp ? 'ʌ' : 'w', hex('#181018'))
    }
  }

  // smoke
  const smokeCh = ['░', '▒', '·', '∙', ' ']
  for (const s of smoke) {
    if (s.age > 1) continue
    const a = 1 - s.age
    const c = mix(P.smokeFade, P.smoke, a)
    const ci = Math.min(smokeCh.length - 1, Math.floor(s.age * smokeCh.length))
    const px = Math.floor(s.x), py = Math.floor(s.y)
    if (px >= 0 && px < W && py >= 0 && py < H)
      canvas.setCell(px, py, smokeCh[ci], hex(c))
  }
}

export function render(canvas, data, state) {
  draw(canvas, state, 0)
}

export function update(canvas, data, frame, state) {
  if (frame.count % 2 === 0) {
    state.smoke.push({
      x: state.chim.x + state.chim.w / 2 + (Math.random() - 0.5) * 1.5,
      y: state.chim.top - 2,
      vx: 0.15 + Math.random() * 0.2,
      vy: -0.4 - Math.random() * 0.3,
      age: 0,
    })
  }
  for (let i = state.smoke.length - 1; i >= 0; i--) {
    const s = state.smoke[i]
    s.x += s.vx
    s.y += s.vy
    s.vx += (Math.random() - 0.45) * 0.05
    s.age += 0.05
    if (s.age > 1 || s.y < 0) state.smoke.splice(i, 1)
  }
  draw(canvas, state, frame.elapsed)
}
