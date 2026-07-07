# Morning View

Terminal art display for a bedside Raspberry Pi. Each day, a new creation is added to `creations/`.

## Creating a Daily Creation

Create a file at `creations/YYYY-MM-DD-slug.js` (e.g., `creations/2026-06-26-aurora.js`).

### Export Contract

```js
// Required
export const title = 'Aurora Borealis'
export const description = 'Northern lights shimmer across the arctic sky'
export function render(canvas, data, state) { /* draw here */ }

// Optional — animation
export const fps = 3  // 1-5, omit for static
export function setup(canvas, data) { return { /* state */ } }
export function update(canvas, data, frame, state) { /* advance state AND redraw the full frame */ }
export function teardown() { /* cleanup */ }
```

### Canvas API

The canvas is a character grid (~120 cols x 100 rows in portrait). Coordinates are `(x, y)` where `(0,0)` is top-left.

**Low-level:**
- `canvas.setCell(x, y, char, fg?, bg?)` — set one cell
- `canvas.getCell(x, y)` — read `{ char, fg, bg }`
- `canvas.clear(bg?)` — clear buffer
- `canvas.fill(x, y, w, h, char, fg?, bg?)` — fill region

**High-level:**
- `canvas.drawText(x, y, text, fg?, bg?)` — horizontal text
- `canvas.drawTextVertical(x, y, text, fg?, bg?)` — vertical text
- `canvas.drawBox(x, y, w, h, style?, fg?, bg?)` — box with border (styles: 'single', 'double', 'rounded', 'heavy', 'dashed')
- `canvas.drawLine(x1, y1, x2, y2, char?, fg?)` — Bresenham line
- `canvas.drawBorder(x, y, w, h, style?, fg?)` — border only
- `canvas.fillRect(x, y, w, h, char, fg?, bg?)` — filled rectangle
- `canvas.gradient(x, y, w, h, colors[], direction?)` — color gradient ('horizontal' or 'vertical')
- `canvas.braille(x, y, bitmap[][])` — render boolean 2D array as braille (2x4 dots per cell)

**Utilities:**
- `canvas.width` / `canvas.height` — dimensions
- `canvas.centerX(text)` — x to center text
- `canvas.centerY(lines)` — y to center vertically

**Colors** are hex strings (`'#ff4444'`) or ANSI escapes. Import helpers from `../src/theme.js`:
- `rgb(r, g, b)`, `bgRgb(r, g, b)`, `hex(color)`, `bgHex(color)`
- `lerp(color1, color2, t)`, `lerpMulti(colors, t)` — interpolation
- `BOLD`, `DIM`, `ITALIC`, `RESET` — ANSI modifiers
- `BOX` — border character sets (`.single`, `.double`, `.rounded`, `.heavy`)
- `BLOCK` — block characters (`.full █`, `.dark ▓`, `.medium ▒`, `.light ░`, `.upper ▀`, `.lower ▄`)
- `SHADE` — array `['░', '▒', '▓', '█']`
- `GLYPH` — symbols (`.star`, `.heart`, `.sun`, `.moon`, `.cloud`, `.snowflake`, `.arrow.*`, `.triangle.*`, `.nerd.*`)
- `PALETTES` — named color arrays (`.ocean`, `.sunset`, `.forest`, `.ember`, `.arctic`, `.neon`, `.mono`, `.warm`, `.candy`, `.midnight`)

### Data Bundle

The `data` parameter contains:
```
data.weather    — { temp, condition, humidity, windSpeed } or null
data.date       — { formatted, year, month, day, dayOfWeek, dayOfYear, season, daysInYear, weekNumber }
data.facts      — { onThisDay, randomFact } (strings or null)
data.config     — contents of config.json
```

### Animation

Each frame the framework **clears the canvas** and then asks your creation to
draw it: on the first frame it calls `render()`, and on every frame after it
calls `update()`. Because the canvas is wiped each time, **`update()` must draw
the entire scene, not just advance state** — think of it as `render()` with
motion. The common mistake is to only mutate state in `update()` and leave the
drawing in `render()`; that makes the piece vanish after the first frame. Two
correct patterns:

```js
// Pattern A — draw directly in update()
export function update(canvas, data, frame, state) {
  state.phase += 0.05
  drawScene(canvas, state, frame.elapsed)   // fully redraws every frame
}

// Pattern B — advance, then delegate to render()
export function update(canvas, data, frame, state) {
  state.phase += 0.05
  render(canvas, data, state)               // render() does the full draw
}
```

(As a safety net the framework will fall back to calling `render()` itself if
an `update()` leaves the canvas blank — but write `update()` to draw so the
animation actually moves.)

The `frame` parameter in `update()`:
- `frame.count` — frame number (0-based)
- `frame.elapsed` — seconds since start
- `frame.dt` — seconds since last frame

The `state` returned from `setup()` is passed to both `render()` and `update()`.

### Rules

- **Only modify files under `creations/`** — the framework (`src/`, `config.json`, `CLAUDE.md`, `pi/`, `package.json`) is protected by a pre-commit hook and must not be changed by automated workflows
- Test the creation runs without error before committing: `timeout 5 node src/index.js`
- The display has no keyboard or mouse — do not require interaction
- Keep animations gentle (1-3 FPS preferred) — this runs on a Raspberry Pi
- The framework overlays time (top-right) and title/description (bottom-left) — leave ~3 chars padding in those corners
- The terminal uses a Nerd Font (JetBrainsMono) — Nerd Font glyphs, braille, and box-drawing characters are available
- Truecolor (24-bit) is supported
- Commit message format: `art: short description of the creation`
- You may add npm dependencies to package.json if needed
