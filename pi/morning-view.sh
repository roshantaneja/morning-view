#!/bin/bash
# Daily updater. Designed so the display can never silently stay stale:
#  - runs at 6:30 AND at every boot (cron @reboot), so a Pi that was powered
#    off at 6:30 catches up as soon as it starts
#  - fetch retries 3x, and stale git lock files (power loss mid-git) are
#    cleaned automatically before retrying
#  - every failure path still restarts the service and logs loudly
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() { echo "[$(date '+%F %T')] $*"; }

# Rotate our log if cron has grown it past ~1MB (takes effect next run)
LOG_FILE="$HOME/morning-view-pull.log"
if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE")" -gt 1048576 ]; then
  tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

export NVM_DIR="$HOME/.nvm"
# nvm.sh is not set -u clean; relax while sourcing (pattern from nvm's README)
set +u; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; set -u

cd "$PROJECT_DIR" || { log "FATAL: project dir $PROJECT_DIR missing"; exit 1; }

deps_hash() {
  # || true: package-lock.json may be momentarily absent; only content matters
  { cat package.json package-lock.json 2>/dev/null || true; } | md5sum | cut -d' ' -f1
}

clean_stale_locks() {
  # Power loss mid-git leaves lock files that wedge every later run. Only
  # remove them when no git process is alive and the lock is >10 min old.
  if ! pgrep -x git >/dev/null 2>&1; then
    find .git -name '*.lock' -mmin +10 -print -delete 2>/dev/null || true
  fi
}

# --- update the checkout (self-healing) -------------------------------------
fetch_ok=false
for attempt in 1 2 3; do
  if git fetch origin main; then fetch_ok=true; break; fi
  log "git fetch failed (attempt $attempt/3) — cleaning stale locks and retrying"
  clean_stale_locks
  [ "$attempt" -lt 3 ] && sleep 20
done

if $fetch_ok; then
  OLD_HEAD=$(git rev-parse --short HEAD 2>/dev/null || echo none)
  DEPS_BEFORE=$(deps_hash)
  # The Pi is a pure consumer of this repo — hard-reset so a stray local
  # change can never wedge the daily update. config.json is skip-worktree
  # (set by setup.sh) so local location/rotation settings survive the reset.
  if ! git reset --hard origin/main; then
    log "git reset failed — cleaning stale locks and retrying once"
    clean_stale_locks
    git reset --hard origin/main || log "ERROR: reset still failing — keeping current checkout"
  fi
  NEW_HEAD=$(git rev-parse --short HEAD 2>/dev/null || echo none)
  if [ "$OLD_HEAD" = "$NEW_HEAD" ]; then
    log "Already up to date at $NEW_HEAD"
  else
    log "Updated $OLD_HEAD -> $NEW_HEAD"
  fi
  DEPS_AFTER=$(deps_hash)
  if [ "$DEPS_BEFORE" != "$DEPS_AFTER" ]; then
    log "Dependencies changed, running npm ci..."
    npm ci || log "WARNING: npm ci failed — continuing with existing node_modules"
  fi
else
  log "All fetch attempts failed — keeping current version (network down?)"
fi

# --- visibility: is there art for today? ------------------------------------
TODAY=$(date +%F)
NEWEST=$(ls creations/ 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}-' | sort | tail -1)
log "Newest creation: ${NEWEST:-none} (today is $TODAY)"
case "${NEWEST:-}" in
  "$TODAY"*) : ;;
  *) log "WARNING: no creation dated $TODAY — if git is up to date, the generator machine didn't push last night" ;;
esac

# --- restart the display (always) --------------------------------------------
log "Restarting morning-view service..."
# -n: fail loudly if passwordless sudo is broken instead of hanging on a
# password prompt cron can never answer (setup.sh installs the sudoers rule)
if ! sudo -n systemctl restart morning-view; then
  log "ERROR: service restart failed — is the sudoers rule installed? (re-run pi/setup.sh)"
fi

# wake the monitor for the day
sleep 8
"$SCRIPT_DIR/display-power.sh" on || true

log "Done."
