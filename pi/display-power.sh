#!/bin/bash
# Turn the monitor on/off from cron. Bookworm's KMS driver makes the old
# vcgencmd display_power a silent no-op, and bookworm's cage (0.1.4) predates
# the compositor protocols wlr-randr/wlopm need — so talk to the monitor
# itself: DDC/CI first (most desktop monitors), then HDMI-CEC (TVs).
# Usage: display-power.sh on|off
set -uo pipefail

MODE="${1:-}"
case "$MODE" in on|off) ;; *) echo "usage: $0 on|off"; exit 2 ;; esac

if command -v ddcutil >/dev/null 2>&1; then
  if [ "$MODE" = on ]; then VCP=01; else VCP=04; fi
  if sudo -n ddcutil setvcp d6 "$VCP" >/dev/null 2>&1; then
    echo "[$(date)] display $MODE (ddcutil)"
    exit 0
  fi
fi

if command -v cec-ctl >/dev/null 2>&1; then
  if [ "$MODE" = on ]; then CEC=--image-view-on; else CEC=--standby; fi
  if cec-ctl --skip-info --to 0 "$CEC" >/dev/null 2>&1; then
    echo "[$(date)] display $MODE (cec)"
    exit 0
  fi
fi

echo "[$(date)] could not turn display $MODE — monitor answered neither DDC/CI (ddcutil) nor CEC. Diagnose with: sudo ddcutil detect"
exit 1
