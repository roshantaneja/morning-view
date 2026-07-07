#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

export NVM_DIR="$HOME/.nvm"
# nvm.sh is not set -u clean; relax while sourcing (pattern from nvm's README)
set +u; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; set -u

cd "$PROJECT_DIR"

deps_hash() {
  # || true: package-lock.json may be momentarily absent; only content matters
  { cat package.json package-lock.json 2>/dev/null || true; } | md5sum | cut -d' ' -f1
}

# Update if we can, but never let a network blip keep the display dark —
# the restart and wake below run regardless of fetch success.
if git fetch origin main; then
  DEPS_BEFORE=$(deps_hash)
  # The Pi is a pure consumer of this repo — hard-reset so a stray local
  # change can never wedge the daily update. config.json is skip-worktree
  # (set by setup.sh) so local location/rotation settings survive the reset.
  git reset --hard origin/main
  DEPS_AFTER=$(deps_hash)
  if [ "$DEPS_BEFORE" != "$DEPS_AFTER" ]; then
    echo "[$(date)] Dependencies changed, running npm ci..."
    npm ci
  fi
else
  echo "[$(date)] git fetch failed — keeping current version"
fi

echo "[$(date)] Restarting morning-view service..."
# -n: fail loudly if passwordless sudo is broken instead of hanging on a
# password prompt cron can never answer (setup.sh installs the sudoers rule)
sudo -n systemctl restart morning-view

# wake the monitor for the day
sleep 8
"$SCRIPT_DIR/display-power.sh" on || true

echo "[$(date)] Done."
