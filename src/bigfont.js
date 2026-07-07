// Block-letter renderer for overlays. The terminal can't scale a single glyph,
// so large text is drawn as multi-cell block letters from a 3x5 bitmap font.
// Each lit font pixel becomes a `scale`x`scale` square of full-block cells, with
// a 1-cell dark outline so the text stays legible over busy artwork.

const GLYPH_W = 3;
const GLYPH_H = 5;

// Each glyph is 5 rows of 3 chars; '#' = lit. Missing chars (incl. space) render
// as a blank advance, so unknown punctuation just leaves a gap.
const FONT = {
  '0': ['###', '# #', '# #', '# #', '###'],
  '1': [' # ', '## ', ' # ', ' # ', '###'],
  '2': ['###', '  #', '###', '#  ', '###'],
  '3': ['###', '  #', '###', '  #', '###'],
  '4': ['# #', '# #', '###', '  #', '  #'],
  '5': ['###', '#  ', '###', '  #', '###'],
  '6': ['###', '#  ', '###', '# #', '###'],
  '7': ['###', '  #', '  #', '  #', '  #'],
  '8': ['###', '# #', '###', '# #', '###'],
  '9': ['###', '# #', '###', '  #', '###'],
  ':': ['   ', ' # ', '   ', ' # ', '   '],
  '.': ['   ', '   ', '   ', '   ', ' # '],
  ',': ['   ', '   ', '   ', ' # ', '#  '],
  "'": [' # ', ' # ', '   ', '   ', '   '],
  '-': ['   ', '   ', '###', '   ', '   '],
  '!': [' # ', ' # ', ' # ', '   ', ' # '],
  '?': ['###', '  #', ' ##', '   ', ' # '],
  '/': ['  #', '  #', ' # ', '#  ', '#  '],
  'A': [' # ', '# #', '###', '# #', '# #'],
  'B': ['## ', '# #', '## ', '# #', '## '],
  'C': ['###', '#  ', '#  ', '#  ', '###'],
  'D': ['## ', '# #', '# #', '# #', '## '],
  'E': ['###', '#  ', '## ', '#  ', '###'],
  'F': ['###', '#  ', '## ', '#  ', '#  '],
  'G': ['###', '#  ', '# #', '# #', '###'],
  'H': ['# #', '# #', '###', '# #', '# #'],
  'I': ['###', ' # ', ' # ', ' # ', '###'],
  'J': ['  #', '  #', '  #', '# #', '###'],
  'K': ['# #', '## ', '#  ', '## ', '# #'],
  'L': ['#  ', '#  ', '#  ', '#  ', '###'],
  'M': ['# #', '###', '###', '# #', '# #'],
  'N': ['# #', '## ', '###', ' ##', '# #'],
  'O': ['###', '# #', '# #', '# #', '###'],
  'P': ['###', '# #', '###', '#  ', '#  '],
  'Q': ['###', '# #', '# #', '###', '  #'],
  'R': ['###', '# #', '###', '## ', '# #'],
  'S': ['###', '#  ', '###', '  #', '###'],
  'T': ['###', ' # ', ' # ', ' # ', ' # '],
  'U': ['# #', '# #', '# #', '# #', '###'],
  'V': ['# #', '# #', '# #', '# #', ' # '],
  'W': ['# #', '# #', '###', '###', '# #'],
  'X': ['# #', '# #', ' # ', '# #', '# #'],
  'Y': ['# #', '# #', ' # ', ' # ', ' # '],
  'Z': ['###', '  #', ' # ', '#  ', '###'],
};

const ADVANCE = GLYPH_W + 1; // 1 blank column between glyphs

// Width/height in cells for `text` at `scale`.
export function measureBig(text, scale) {
  if (!text || text.length === 0) return { w: 0, h: 0 };
  return {
    w: text.length * ADVANCE * scale - scale, // drop the trailing gap
    h: GLYPH_H * scale,
  };
}

// Draw `text` with its top-left at (x, y). `fg` is the letter color; `outline`
// (default black) is drawn as a 1-cell halo for contrast — pass null to skip it.
export function drawBigText(canvas, x, y, text, scale, fg, outline = '#000000') {
  const up = String(text).toUpperCase();
  const lit = new Set();
  const key = (px, py) => px + ',' + py;

  let cx = x;
  for (const ch of up) {
    const glyph = FONT[ch];
    if (glyph) {
      for (let ry = 0; ry < GLYPH_H; ry++) {
        for (let rx = 0; rx < GLYPH_W; rx++) {
          if (glyph[ry][rx] === '#') {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                lit.add(key(cx + rx * scale + sx, y + ry * scale + sy));
              }
            }
          }
        }
      }
    }
    cx += ADVANCE * scale;
  }

  if (outline != null) {
    for (const k of lit) {
      const [px, py] = k.split(',').map(Number);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (!lit.has(key(px + dx, py + dy))) {
            canvas.setCell(px + dx, py + dy, '█', outline, outline);
          }
        }
      }
    }
  }

  for (const k of lit) {
    const [px, py] = k.split(',').map(Number);
    canvas.setCell(px, py, '█', fg);
  }
}

// Greedy word-wrap to at most `maxChars` per line; hard-breaks over-long words.
export function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const word of words) {
    let w = word;
    while (w.length > maxChars) {
      if (cur) { lines.push(cur); cur = ''; }
      lines.push(w.slice(0, maxChars));
      w = w.slice(maxChars);
    }
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
