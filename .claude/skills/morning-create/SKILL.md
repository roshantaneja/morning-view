---
name: morning-create
description: "Generate a new daily terminal art creation for the Morning View bedside display. Use this skill when the user says 'morning create', 'create a morning view', 'new creation', 'make something for the Pi', 'morning art', or any variation of wanting to generate a new daily piece for the Morning View project. Also triggers for scheduled/automated runs that need to produce a fresh creation. This skill is fully autonomous — it needs no user input to run."
---

# Morning Create

You are creating a daily terminal art piece for "Morning View" — a bedside Raspberry Pi connected to a portrait monitor that displays terminal art. Each morning the user wakes up to something new and surprising.

Your job: dream up an original creation, write it, test it, commit it, and push it.

## Step 1: Understand the canvas

Read the project's CLAUDE.md to learn the creation contract, canvas API, and available theme helpers:

```
Read: <project-root>/CLAUDE.md
```

The project root is `C:\Users\yoshi\Downloads\Web Development\morning-view`. If running on a different machine, look for a `morning-view` project directory.

## Step 2: Survey what's been done

List all files in `creations/` to see what already exists. Read a few recent ones to understand the themes and techniques that have been used. Your goal is to **never repeat a theme** — each day should feel genuinely different.

## Step 3: Choose your creation

Pick something from the creative space below that hasn't been done recently. Don't just pick the first idea that comes to mind — sit with it for a moment and find something that excites you.

### Creative Categories

Rotate across these. Don't repeat a category two days in a row.

**Nature & Landscapes**
- Rain falling on a still pond, ripples expanding
- Aurora borealis curtains flowing across the sky
- Ocean waves rolling in with seafoam (braille for water detail)
- A mountain range with shifting fog layers
- Cherry blossoms falling past a window frame
- A thunderstorm with lightning flashes
- Sunrise gradient slowly shifting through warm colors
- Fireflies blinking in a meadow at dusk
- Snow falling and accumulating on pine trees

**Generative Art & Math**
- Perlin noise terrain rendered in braille
- Conway's Game of Life evolving from a random seed
- A Lorenz attractor traced in braille dots
- Mandelbrot zoom into a specific region
- Spirograph / harmonograph patterns
- Voronoi diagram with colored cells
- Reaction-diffusion patterns (Turing patterns)
- A fractal tree growing and swaying
- Cellular automata (Rule 30, Rule 110)
- Lissajous curves in braille

**Typography & Poetry**
- A haiku rendered in large block letters with a gradient
- ASCII art of a word with animated particles orbiting it
- A quote from a philosopher, elegantly framed with ornamental borders
- Concrete poetry — where the shape of the text IS the art
- A single kanji or symbol, massive, drawn in block characters
- A word cloud of beautiful or interesting words

**Data Visualization**
- A real-time clock rendered as a massive analog dial
- The current date as a progress bar through the year
- Weather data visualized (if available in the data bundle)
- A histogram of letter frequencies in a random word
- The golden ratio spiral drawn in braille

**Abstract & Geometric**
- Concentric shapes pulsing outward
- A grid of characters morphing between patterns
- Moiré patterns from overlapping grids
- A kaleidoscope rotating slowly
- Pixel sorting effect on a gradient
- Nested boxes with rotating color schemes
- A matrix-style rain of characters (but make it YOUR version)
- Orbiting particles around a central point

**Scenes & Vignettes**
- A cozy room interior (desk, lamp, window, bookshelf)
- A cityscape at night with twinkling windows
- An aquarium with swimming fish
- A retro computer terminal showing code
- A campfire with drifting embers and smoke
- A vinyl record spinning on a turntable
- A cat sleeping on a windowsill with rain outside
- A bookshelf with colored spines

**Interactive with Data**
- Use `data.date.season` to theme the piece seasonally
- Use `data.weather` to reflect current weather conditions
- Use `data.facts.onThisDay` rendered beautifully as part of the art
- Use `data.date.dayOfYear / data.date.daysInYear` as a progress element

### Techniques to Mix In

Don't just draw — combine techniques for depth:

- **Braille rendering** (`canvas.braille()`) for high-resolution curves and shapes — each cell is 2x4 dots, so you get 8x the resolution of regular characters
- **Color gradients** (`canvas.gradient()` or manual `lerpMulti()`) for atmospheric backgrounds
- **Layering**: draw a gradient background, then shapes on top, then text or detail on top of that
- **Block characters** (`BLOCK.full`, `BLOCK.upper`, `BLOCK.lower`) for semi-pixel art
- **Box-drawing characters** (`BOX.rounded`, `BOX.double`) for structured layouts and frames
- **Shade characters** (`SHADE` array) for depth and texture
- **Nerd Font glyphs** (`GLYPH.nerd.*`) for icons and decoration
- **Animation**: subtle is better — slow drifts, gentle pulses, twinkling. 1-2 FPS is ideal.
- **Custom palettes**: don't just use PALETTES — create your own color arrays for unique moods

### Quality Bar

A good creation:
- Fills the canvas meaningfully (no sad little drawing in the corner of a blank screen)
- Has depth — background, midground, foreground layers
- Uses color intentionally — a cohesive palette, not random rainbow
- Has a title and description that add context, like a museum placard
- If animated, the motion is ambient and calming, not frantic
- Works at any terminal size (use `canvas.width` and `canvas.height`, not hardcoded positions)
- Leaves padding (~3 chars) in the top-right (clock) and bottom-left (title) corners

## Step 4: Write the creation

Create the file at `creations/YYYY-MM-DD-slug.js` where the date is tomorrow's date (the date the user will see it) and the slug is a short lowercase-kebab-case description.

Use ESM imports. The file must export at minimum: `title`, `description`, and `render(canvas, data, state)`. Optionally export `fps`, `setup()`, `update()`, and `teardown()`.

All position calculations should be relative to `canvas.width` and `canvas.height`, never hardcoded pixel positions.

**If you animate, `update()` must draw the whole frame.** The framework clears
the canvas every frame and calls `render()` on frame 0, then `update()` on
every frame after. If `update()` only advances state and leaves the drawing to
`render()`, the art shows for one frame and then goes blank. Either draw the
full scene inside `update()`, or end `update()` by calling `render()`:

```js
export function render(canvas, data, state) {
  drawScene(canvas, state)          // full draw from state
}
export function update(canvas, data, frame, state) {
  state.phase += 0.05               // advance
  render(canvas, data, state)       // ...then redraw the whole frame
}
```

When testing (Step 5), don't just check that it starts — let it run a few
seconds and confirm the animation still fills the screen after the first
frame, not just at startup.

## Step 5: Test it

Run the app to verify no crashes:

```bash
cd <project-root>
timeout 5 node src/index.js
```

On Windows use:
```powershell
$proc = Start-Process node -ArgumentList "src/index.js" -PassThru -NoNewWindow; Start-Sleep 5; Stop-Process $proc -Force -ErrorAction SilentlyContinue
```

If it crashes, read the error, fix the creation, and test again. Common issues:
- Importing something that doesn't exist in theme.js
- Off-by-one errors in canvas coordinates
- Using `Math.floor()` on values that could be NaN
- Forgetting to handle the case where `data.weather` is null

## Step 6: Commit and push

```bash
cd <project-root>
git add creations/
git add package.json package-lock.json  # only if you added dependencies
git commit -m "art: <short description of the creation>"
git push origin main
```

## Boundary Rules

**You may ONLY create or modify files under `creations/`.** Do not touch any framework files:
- `src/` — the rendering engine, canvas, theme, loader, data fetcher
- `config.json` — display configuration
- `CLAUDE.md` — project documentation
- `package.json` / `package-lock.json` — dependencies
- `pi/` — Raspberry Pi setup scripts
- `.claude/` — skill definitions

A pre-commit hook enforces this — if you stage framework files, the commit will be rejected. Work within the canvas API as documented; if something is missing, leave it for the user to add.

Only stage `creations/` files in your commit:
```bash
git add creations/
```

## Important Notes

- This skill is designed to run autonomously via scheduled task. Do not ask the user for input — just create something wonderful.
- Every creation should be a surprise. If you find yourself reaching for the same patterns, push further.
- The terminal uses JetBrainsMono Nerd Font — take advantage of the extended glyph set.
- Truecolor (24-bit) is fully supported. Go wild with color.
- The display is portrait orientation (~120 cols x 100 rows). Design vertically.
- Animations should be 1-3 FPS to be gentle on the Raspberry Pi's CPU.
