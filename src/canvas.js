import { BOX, hexToRgb, rgbToHex, lerpMulti, RESET } from './theme.js';

const BRAILLE_BASE = 0x2800;
const BRAILLE_MAP = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

export class Canvas {
  constructor(width, height) {
    this._width = width;
    this._height = height;
    this._cells = [];
    this.clear();
  }

  get width() { return this._width; }
  get height() { return this._height; }

  clear(bg) {
    this._cells = Array.from({ length: this._height }, () =>
      Array.from({ length: this._width }, () => ({ char: ' ', fg: null, bg: bg || null }))
    );
  }

  _inBounds(x, y) {
    return x >= 0 && x < this._width && y >= 0 && y < this._height;
  }

  setCell(x, y, char, fg, bg) {
    if (!this._inBounds(x, y)) return;
    const cell = this._cells[y][x];
    if (char != null) cell.char = char;
    if (fg !== undefined) cell.fg = fg;
    if (bg !== undefined) cell.bg = bg;
  }

  getCell(x, y) {
    if (!this._inBounds(x, y)) return null;
    const { char, fg, bg } = this._cells[y][x];
    return { char, fg, bg };
  }

  fill(x, y, w, h, char, fg, bg) {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        this.setCell(col, row, char, fg, bg);
      }
    }
  }

  drawText(x, y, text, fg, bg) {
    for (let i = 0; i < text.length; i++) {
      this.setCell(x + i, y, text[i], fg, bg);
    }
  }

  drawTextVertical(x, y, text, fg, bg) {
    for (let i = 0; i < text.length; i++) {
      this.setCell(x, y + i, text[i], fg, bg);
    }
  }

  drawBox(x, y, w, h, style, fg, bg) {
    const s = typeof style === 'string' ? (BOX[style] || BOX.single) : (style || BOX.single);
    this.setCell(x, y, s.tl, fg, bg);
    this.setCell(x + w - 1, y, s.tr, fg, bg);
    this.setCell(x, y + h - 1, s.bl, fg, bg);
    this.setCell(x + w - 1, y + h - 1, s.br, fg, bg);
    for (let i = 1; i < w - 1; i++) {
      this.setCell(x + i, y, s.h, fg, bg);
      this.setCell(x + i, y + h - 1, s.h, fg, bg);
    }
    for (let i = 1; i < h - 1; i++) {
      this.setCell(x, y + i, s.v, fg, bg);
      this.setCell(x + w - 1, y + i, s.v, fg, bg);
    }
    if (bg) {
      for (let row = y + 1; row < y + h - 1; row++) {
        for (let col = x + 1; col < x + w - 1; col++) {
          this.setCell(col, row, ' ', undefined, bg);
        }
      }
    }
  }

  drawBorder(x, y, w, h, style, fg) {
    this.drawBox(x, y, w, h, style, fg);
  }

  drawLine(x1, y1, x2, y2, char, fg) {
    const c = char || '·';
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let cx = x1, cy = y1;
    while (true) {
      this.setCell(cx, cy, c, fg);
      if (cx === x2 && cy === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
  }

  fillRect(x, y, w, h, char, fg, bg) {
    this.fill(x, y, w, h, char, fg, bg);
  }

  centerX(text) {
    return Math.floor((this._width - text.length) / 2);
  }

  centerY(lines) {
    const count = Array.isArray(lines) ? lines.length : lines;
    return Math.floor((this._height - count) / 2);
  }

  gradient(x, y, w, h, colors, direction = 'horizontal') {
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const t = direction === 'horizontal'
          ? col / Math.max(w - 1, 1)
          : row / Math.max(h - 1, 1);
        const color = lerpMulti(colors, t);
        this.setCell(x + col, y + row, undefined, undefined, color);
      }
    }
  }

  braille(x, y, bitmap) {
    const rows = bitmap.length;
    const cols = bitmap[0]?.length || 0;
    const cellRows = Math.ceil(rows / 4);
    const cellCols = Math.ceil(cols / 2);
    for (let cy = 0; cy < cellRows; cy++) {
      for (let cx = 0; cx < cellCols; cx++) {
        let code = BRAILLE_BASE;
        for (let dy = 0; dy < 4; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const py = cy * 4 + dy;
            const px = cx * 2 + dx;
            if (py < rows && px < cols && bitmap[py][px]) {
              code += BRAILLE_MAP[dy][dx];
            }
          }
        }
        this.setCell(x + cx, y + cy, String.fromCharCode(code));
      }
    }
  }

  _colorCode(color, isBg) {
    if (!color) return '';
    if (color.startsWith('\x1b')) return color;
    if (color.startsWith('#')) {
      const [r, g, b] = hexToRgb(color);
      return isBg ? `\x1b[48;2;${r};${g};${b}m` : `\x1b[38;2;${r};${g};${b}m`;
    }
    return color;
  }

  toAnsiRows() {
    return this._cells.map(row => {
      let result = '';
      let lastFg = null;
      let lastBg = null;
      for (const cell of row) {
        const fgCode = this._colorCode(cell.fg, false);
        const bgCode = this._colorCode(cell.bg, true);
        if (fgCode !== lastFg || bgCode !== lastBg) {
          result += RESET;
          if (fgCode) result += fgCode;
          if (bgCode) result += bgCode;
          lastFg = fgCode;
          lastBg = bgCode;
        }
        result += cell.char;
      }
      result += RESET;
      return result;
    });
  }
}
