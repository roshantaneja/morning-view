import { PALETTES, BLOCK, GLYPH, lerpMulti } from '../src/theme.js';

export const title = 'Starfield';
export const description = 'Drifting through an endless field of stars';
export const fps = 3;

const STAR_CHARS = ['·', '✦', '✧', '⋆', '*', '★', '☆', '•'];
const STAR_COLORS = ['#ffffff', '#aaccff', '#ffeebb', '#ffaacc', '#aaffaa', '#ddddff'];

export function setup(canvas) {
  const stars = [];
  const count = Math.floor(canvas.width * canvas.height * 0.04);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.1 + Math.random() * 0.5,
      char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      brightness: Math.random(),
    });
  }

  const nebulaColors = PALETTES.midnight;
  return { stars, nebulaColors };
}

export function render(canvas, data, state) {
  drawNebula(canvas, state.nebulaColors, 0);
  drawStars(canvas, state.stars);
  drawConstellation(canvas);
}

export function update(canvas, data, frame, state) {
  for (const star of state.stars) {
    star.y += star.speed;
    if (star.y >= canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
    star.brightness = 0.3 + Math.sin(frame.elapsed * 2 + star.x) * 0.35 + 0.35;
  }

  canvas.clear();
  drawNebula(canvas, state.nebulaColors, frame.elapsed);
  drawStars(canvas, state.stars);
  drawConstellation(canvas);
}

function drawNebula(canvas, colors, time) {
  for (let y = 0; y < canvas.height; y++) {
    const t = y / Math.max(canvas.height - 1, 1);
    const wave = Math.sin(t * Math.PI * 2 + time * 0.3) * 0.1;
    const color = lerpMulti(colors, Math.max(0, Math.min(1, t + wave)));
    for (let x = 0; x < canvas.width; x++) {
      canvas.setCell(x, y, ' ', null, color);
    }
  }
}

function drawStars(canvas, stars) {
  for (const star of stars) {
    const x = Math.floor(star.x);
    const y = Math.floor(star.y);
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const dim = star.brightness < 0.5;
      const fg = dim ? '#555577' : star.color;
      canvas.setCell(x, y, star.char, fg);
    }
  }
}

function drawConstellation(canvas) {
  const cx = Math.floor(canvas.width * 0.6);
  const cy = Math.floor(canvas.height * 0.3);
  const points = [
    [0, 0], [3, -2], [7, -1], [10, -3],
    [8, 2], [5, 3], [2, 4], [-1, 2],
  ];
  const starColor = '#ffeedd';
  for (const [dx, dy] of points) {
    canvas.setCell(cx + dx, cy + dy, '★', starColor);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    canvas.drawLine(cx + x1, cy + y1, cx + x2, cy + y2, '·', '#444466');
  }
}
