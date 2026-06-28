export function rgb(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function bgRgb(r, g, b) {
  return `\x1b[48;2;${r};${g};${b}m`;
}

export function hex(color) {
  const c = color.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return rgb(r, g, b);
}

export function bgHex(color) {
  const c = color.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return bgRgb(r, g, b);
}

export function hexToRgb(color) {
  const c = color.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function lerp(color1, color2, t) {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t),
  );
}

export function lerpMulti(colors, t) {
  if (colors.length === 1) return colors[0];
  const segment = t * (colors.length - 1);
  const i = Math.min(Math.floor(segment), colors.length - 2);
  return lerp(colors[i], colors[i + 1], segment - i);
}

export const RESET = '\x1b[0m';
export const BOLD = '\x1b[1m';
export const DIM = '\x1b[2m';
export const ITALIC = '\x1b[3m';
export const UNDERLINE = '\x1b[4m';
export const BLINK = '\x1b[5m';
export const INVERSE = '\x1b[7m';

export const BOX = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  heavy: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
  dashed: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '┄', v: '┊' },
};

export const BLOCK = {
  full: '█', dark: '▓', medium: '▒', light: '░',
  upper: '▀', lower: '▄', left: '▌', right: '▐',
};

export const SHADE = ['░', '▒', '▓', '█'];

export const GLYPH = {
  star: '★', starEmpty: '☆', heart: '♥', diamond: '♦',
  club: '♣', spade: '♠', note: '♪', notes: '♫',
  sun: '☀', moon: '☾', cloud: '☁', umbrella: '☂',
  snowflake: '❄', flower: '✿', leaf: '🌿',
  check: '✓', cross: '✗', bullet: '•', ring: '○',
  arrow: { up: '↑', down: '↓', left: '←', right: '→' },
  doubleArrow: { up: '⇑', down: '⇓', left: '⇐', right: '⇒' },
  triangle: { up: '▲', down: '▼', left: '◀', right: '▶' },
  nerd: {
    branch: '', lock: '', gear: '',
    folder: '', file: '', code: '',
    terminal: '', fire: '', bolt: '',
    eye: '', clock: '', calendar: '',
    globe: '', cpu: '', memory: '',
    temp: '', wind: '', drop: '',
  },
};

export const PALETTES = {
  ocean: ['#0a1628', '#1a3a5c', '#2d6a8f', '#4ecdc4', '#a8e6cf'],
  sunset: ['#2d1b69', '#8b2252', '#d4445f', '#f59e42', '#ffe066'],
  forest: ['#0b1a0b', '#1a3c1a', '#2d5f2d', '#5fa55f', '#a8d8a8'],
  ember: ['#1a0a00', '#4a1a00', '#8b3a00', '#d45a00', '#ff9a44'],
  arctic: ['#0a1a2e', '#1a3050', '#3a5a7a', '#7aaaca', '#c0e0f0'],
  neon: ['#0d0221', '#370a5e', '#8c1aff', '#ff2ef1', '#00ff87'],
  mono: ['#1a1a1a', '#3a3a3a', '#6a6a6a', '#9a9a9a', '#dadada'],
  warm: ['#2d1b00', '#5a3600', '#8b5e1a', '#c49a42', '#f0d890'],
  candy: ['#1a0a1e', '#5e1a6e', '#c040a0', '#ff6eb4', '#ffc0e0'],
  midnight: ['#020010', '#0a0030', '#1a1060', '#3030a0', '#6060e0'],
};
