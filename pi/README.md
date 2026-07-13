# Raspberry Pi Setup

## How It Works

The app renders truecolor art with braille and Nerd Font glyphs — the raw
Linux console (tty1) can't display any of that (256-glyph font, 16 colors).
So the service runs a minimal graphics stack with no desktop:

```
systemd (owns tty1) → cage (Wayland kiosk) → foot (truecolor terminal) → node src/index.js
```

Everything is installed and wired up by `pi/setup.sh`.

## Prerequisites

- Raspberry Pi with Raspberry Pi OS (Bookworm or later)
- 15"+ monitor connected in portrait orientation
- Network connection (for git pull and weather API)

## Quick Start

1. Clone the repo:
   ```bash
   git clone <your-repo-url> ~/morning-view
   cd ~/morning-view
   ```

2. Run the setup script:
   ```bash
   chmod +x pi/*.sh
   ./pi/setup.sh
   ```

3. Edit `config.json` with your location and rotation:
   ```json
   {
     "location": { "latitude": 37.87, "longitude": -122.27, "city": "Berkeley" },
     "display": { "rotation": 90 }
   }
   ```
   `rotation: 90` = clockwise portrait, `270` = counter-clockwise, `0` = landscape.
   Setup marks `config.json` skip-worktree, so your local edits survive the
   daily update (which hard-resets everything else to origin/main).

4. Set the Pi to boot to console (no desktop):
   ```bash
   sudo raspi-config
   # → System Options → Boot / Auto Login → Console
   ```
   Autologin is not needed — the morning-view service takes over tty1 itself.

5. Start the display:
   ```bash
   sudo systemctl start morning-view   # or just: sudo reboot
   ```

## What the Cron Jobs Do

| Time | Job |
|------|-----|
| 6:30 AM | `morning-view.sh` — fetch + hard reset to origin/main (retries, self-heals stale git locks), `npm ci` if deps changed, restart service (which also wakes the display) |
| Every boot | `morning-view.sh` again (after 45s) — cron never re-runs a missed 6:30, so this catches up a Pi that was powered off overnight |
| 11:00 PM | `display-power.sh off` — put the monitor to sleep via DDC/CI (`ddcutil`), falling back to HDMI-CEC |

Update logs land in `~/morning-view-pull.log` and `~/morning-view-display.log`.

After setup, verify your monitor supports scheduled sleep: `./pi/display-power.sh off`
(screen should sleep), then `./pi/display-power.sh on`. If neither DDC/CI nor
CEC works on your monitor, the art still displays fine — the panel just stays
on overnight (or use its built-in sleep timer).

## Manual Commands

```bash
# Check status
sudo systemctl status morning-view

# View logs (app errors land here too)
journalctl -u morning-view -f

# Restart
sudo systemctl restart morning-view

# Manual update
./pi/morning-view.sh

# Display on/off
./pi/display-power.sh on
./pi/display-power.sh off
```

## Troubleshooting

Start with the doctor — it checks the whole pipeline (cron, git, sudo rule,
creations, service) and names the fix for anything broken:
```bash
./pi/doctor.sh
```

- **Stuck on the same artwork every day**: Run `./pi/doctor.sh`. Usual causes:
  the daily cron isn't installed (re-run `./pi/setup.sh`), a stale git lock
  from a power loss (the updater now cleans these itself), or the Pi was off
  at 6:30 (the @reboot entry now catches that up). `~/morning-view-pull.log`
  shows what each update run did.
- **Only the clock and title are visible, no art**: The app is running on the
  raw kernel console instead of inside cage+foot. Re-run `./pi/setup.sh` to
  regenerate the service, then `sudo systemctl daemon-reload && sudo systemctl
  restart morning-view`.
- **Service starts then stops instantly**: getty is fighting the service for
  tty1 — the unit needs `Conflicts=getty@tty1.service`. Re-run `./pi/setup.sh`
  to regenerate it.
- **Black screen at boot but works when started manually**: Plymouth (boot
  splash) ordering — the unit needs `After=plymouth-quit-wait.service`.
  Re-run `./pi/setup.sh`.
- **Display dies when you plug in a keyboard and switch VTs**: Expected —
  switching back to tty1 spawns a getty that kills the service (by design,
  this is a keyboardless display). `sudo systemctl restart morning-view`.
- **Wrong orientation**: Edit `display.rotation` in `config.json` (90/270/0),
  then `sudo systemctl restart morning-view`.
- **Display never turns off at 11 PM**: Your monitor may not answer DDC/CI or
  CEC. Check `/tmp/morning-view-display.log` and run `sudo ddcutil detect` —
  some monitors need DDC/CI enabled in their on-screen menu.
- **No weather data**: Verify latitude/longitude in config.json.
- **Font issues**: `fc-list | grep JetBrains` should list the Nerd Font. If
  empty, re-run `./pi/setup.sh` (the font install is retried safely).
- **Can't edit boot files**: `/boot/firmware` is FAT32 — `chmod` doesn't work
  there and isn't needed. Use `sudo nano` directly; if read-only:
  `sudo mount -o remount,rw /boot/firmware`. (With the cage setup you normally
  don't need to touch boot files at all — rotation is handled in config.json.)
- **Boot messages sideways**: Cosmetic only. If it bothers you, append
  `fbcon=rotate:1` to the single line in `/boot/firmware/cmdline.txt` to
  rotate the text console too.
