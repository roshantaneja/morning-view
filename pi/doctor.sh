#!/bin/bash
# Health check for the Morning View daily-update pipeline. Run on the Pi:
#   ./pi/doctor.sh
# Checks every link in the chain (cron -> git -> creations -> service) and
# prints [ok]/[FAIL] per item with the fix for anything broken.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR" || { echo "FATAL: cannot cd to $PROJECT_DIR"; exit 1; }

PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  [ok]   $*"; }
bad()  { FAIL=$((FAIL+1)); echo "  [FAIL] $*"; }
info() { echo "         $*"; }

echo "== Morning View doctor — $(date '+%F %T') =="

echo "-- cron --"
if systemctl is-active cron >/dev/null 2>&1; then
  ok "cron daemon active"
else
  bad "cron daemon not active (sudo systemctl enable --now cron)"
fi
MANAGED=$(crontab -l 2>/dev/null | grep -F 'managed-by:morning-view' || true)
COUNT=$(printf '%s' "$MANAGED" | grep -c . || true)
if [ "$COUNT" -ge 3 ]; then
  ok "$COUNT managed cron entries installed:"
  printf '%s\n' "$MANAGED" | sed 's/^/           /'
else
  bad "expected 3 managed cron entries (6:30, @reboot, 23:00), found $COUNT — re-run pi/setup.sh"
  [ -n "$MANAGED" ] && printf '%s\n' "$MANAGED" | sed 's/^/           /'
fi

echo "-- scripts --"
for s in morning-view.sh kiosk-launcher.sh display-power.sh; do
  if [ -x "$SCRIPT_DIR/$s" ]; then ok "$s executable"; else bad "$s missing or not executable (chmod +x pi/*.sh)"; fi
done

echo "-- sudo rule --"
if sudo -n -l 2>/dev/null | grep -q 'systemctl restart morning-view'; then
  ok "passwordless service restart allowed"
else
  bad "sudoers rule missing — cron cannot restart the service (re-run pi/setup.sh)"
fi

echo "-- git --"
STALE=$(find .git -name '*.lock' 2>/dev/null || true)
if [ -n "$STALE" ]; then
  bad "stale git lock file(s) present (these wedge updates):"
  printf '%s\n' "$STALE" | sed 's/^/           /'
else
  ok "no stale git locks"
fi
if git fetch origin main >/dev/null 2>&1; then
  ok "origin reachable (fetched)"
  BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo '?')
  if [ "$BEHIND" = "0" ]; then
    ok "checkout is up to date with origin/main"
  else
    bad "checkout is $BEHIND commit(s) behind origin/main — the daily update is not applying"
  fi
else
  bad "cannot fetch origin (network down, or remote auth issue)"
fi
if git ls-files -v config.json 2>/dev/null | grep -q '^S'; then
  ok "config.json is skip-worktree (local edits can't wedge updates)"
else
  bad "config.json is NOT skip-worktree — local edits may block updates (re-run pi/setup.sh)"
fi

echo "-- creations --"
TODAY=$(date +%F)
NEWEST=$(ls creations/ 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}-' | sort | tail -1)
info "newest creation: ${NEWEST:-none}"
case "${NEWEST:-}" in
  "$TODAY"*) ok "a creation exists for today ($TODAY)" ;;
  *) bad "no creation dated $TODAY — if git is up to date above, the generator machine didn't push last night" ;;
esac

echo "-- service --"
STATE=$(systemctl is-active morning-view 2>/dev/null || true)
if [ "$STATE" = "active" ]; then ok "morning-view service active"; else bad "service state: ${STATE:-unknown} (journalctl -u morning-view -b)"; fi
LOADED=$(journalctl -u morning-view -b --no-pager -o cat 2>/dev/null | grep -F 'Loaded creation:' | tail -1 || true)
if [ -n "$LOADED" ]; then info "currently displaying -> ${LOADED#Loaded creation: }"; fi

echo "-- update log --"
FOUND_LOG=false
for L in "$HOME/morning-view-pull.log" /tmp/morning-view-pull.log; do
  if [ -f "$L" ]; then
    FOUND_LOG=true
    info "last lines of $L:"
    tail -n 6 "$L" | sed 's/^/           /'
  fi
done
$FOUND_LOG || info "no update log found yet (the 6:30/@reboot job has not run since install)"

echo ""
echo "== result: $PASS ok, $FAIL failed =="
[ "$FAIL" -eq 0 ]
