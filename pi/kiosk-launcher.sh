#!/bin/bash
# Launched by systemd (ExecStart). Reads the rotation from config.json and
# starts cage with matching -r flags — bookworm's cage (0.1.4) predates
# wlr-output-management, so rotation must go through cage's own flag rather
# than wlr-randr. The app runs in foot (truecolor terminal with the Nerd Font).
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR" || exit 1

command -v node >/dev/null || { echo "kiosk-launcher: node not on PATH ($PATH)" >&2; exit 1; }

# display.rotation: 90 (clockwise portrait), 180, 270, or 0 (landscape).
# config.json is skip-worktree on the Pi, so this is a safe local setting.
ROTATION=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('./config.json'));console.log(c.display && c.display.rotation != null ? c.display.rotation : 90)}catch(e){console.log(90)}" 2>/dev/null || echo 90)

FLAGS=()
case "$ROTATION" in
  90)  FLAGS=(-r) ;;
  180) FLAGS=(-r -r) ;;
  270) FLAGS=(-r -r -r) ;;
esac

# -s allows VT switching so a plugged-in keyboard can always reach a console
# with Ctrl+Alt+F2 (the escape hatch when SSH isn't handy). Note: switching
# back to tty1 kills the service (getty conflict) — restart it when done.
exec /usr/bin/cage -s "${FLAGS[@]}" -- foot node src/index.js
