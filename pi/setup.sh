#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FONT_URL="https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip"

echo "=== Morning View — Pi Setup ==="
echo ""

# System packages: cage (Wayland kiosk compositor), foot (truecolor terminal),
# ddcutil + v4l-utils (monitor power via DDC/CI or HDMI-CEC), plus tools this
# script needs. The app cannot run on the raw kernel console — that console
# has a 256-glyph font and 16 colors, so braille/Nerd Font art renders as
# blanks and dark truecolor palettes crush to black-on-black. foot-inside-cage
# gives truecolor and fontconfig fonts with no desktop environment.
echo "Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y cage foot ddcutil v4l-utils unzip fontconfig curl git seatd

# Install nvm and Node 20
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  set +u; . "$NVM_DIR/nvm.sh"; set -u
fi
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  echo "Installing Node.js 20 LTS via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  set +u; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; set -u
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  echo "Node $(node -v) already installed."
fi
NODE_BIN_DIR="$(dirname "$(which node)")"

# Install Nerd Font (transactional: only lands in place if download+unzip succeed)
FONT_DIR="$HOME/.local/share/fonts"
if ! compgen -G "$FONT_DIR/JetBrainsMono/*.ttf" > /dev/null; then
  echo "Installing JetBrainsMono Nerd Font..."
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT
  curl -fsSL "$FONT_URL" -o "$TMP_DIR/font.zip"
  unzip -oq "$TMP_DIR/font.zip" -d "$TMP_DIR/JetBrainsMono"
  mkdir -p "$FONT_DIR"
  rm -rf "$FONT_DIR/JetBrainsMono"
  mv "$TMP_DIR/JetBrainsMono" "$FONT_DIR/JetBrainsMono"
  fc-cache -f
else
  echo "JetBrainsMono Nerd Font already installed."
fi
if ! fc-list | grep -q "JetBrainsMono Nerd Font Mono"; then
  echo "WARNING: 'JetBrainsMono Nerd Font Mono' not visible to fontconfig —"
  echo "         foot will silently fall back to 'monospace' and art glyphs will break."
fi

# foot terminal config — the Nerd Font at a size that yields roughly the
# ~120x100 portrait grid the creations are designed for
mkdir -p "$HOME/.config/foot"
cat > "$HOME/.config/foot/foot.ini" << 'FOOTEOF'
[main]
font=JetBrainsMono Nerd Font Mono:size=14
pad=0x0
FOOTEOF

# Install npm dependencies
echo "Installing dependencies..."
cd "$PROJECT_DIR"
npm ci || npm install

# Keep local config.json edits (location, rotation) from ever blocking the
# daily update — the Pi hard-resets to origin/main each morning
git update-index --skip-worktree config.json 2>/dev/null || true

# Allow the daily cron jobs to restart the service and drive the monitor's
# DDC/CI power without a password prompt (cron has no TTY for one). Validated
# with visudo before install — a malformed sudoers.d file disables sudo.
SUDOERS_TMP="$(mktemp)"
echo "$USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart morning-view, /usr/bin/systemctl start morning-view, /usr/bin/systemctl stop morning-view, /usr/bin/ddcutil setvcp d6 01, /usr/bin/ddcutil setvcp d6 04" > "$SUDOERS_TMP"
sudo visudo -cf "$SUDOERS_TMP"
sudo install -m 440 "$SUDOERS_TMP" /etc/sudoers.d/morning-view
rm -f "$SUDOERS_TMP"

# Seat/display access for cage. cage (via wlroots/libseat) needs a seat to
# become DRM master on tty1; without this it exits 1 instantly in a crash loop.
# Give the user device access and enable seatd as a reliable fallback for when
# logind's session isn't marked active.
echo "Granting seat + display access..."
sudo usermod -aG video,render,input,tty "$USER"
sudo systemctl enable --now seatd
sudo usermod -aG _seatd "$USER" 2>/dev/null || true

# Create systemd service — runs cage (Wayland kiosk), which runs foot, which
# runs the app. Conflicts/After getty@tty1: take exclusive ownership of tty1,
# otherwise console-autologin getty hangs up our TTY and the app dies
# instantly (SIGHUP is a "clean exit" signal, so on-failure would not even
# restart it — hence Restart=always).
# Plymouth ordering matters: with getty@tty1's start job cancelled by our
# Conflicts=, its transitive plymouth ordering disappears, and without it we
# can grab the display while the boot splash still owns it -> black screen.
# Note: plugging in a keyboard and VT-switching away from and back to tty1
# spawns autovt@tty1, which kills the service. Fine for a keyboardless display.
echo "Setting up systemd service..."
sudo rm -rf /etc/systemd/system/morning-view.service.d  # clear old manual overrides
sudo tee /etc/systemd/system/morning-view.service > /dev/null << EOF
[Unit]
Description=Morning View Terminal Art Display
After=systemd-user-sessions.service plymouth-quit-wait.service getty@tty1.service network-online.target dbus.socket systemd-logind.service
Wants=network-online.target dbus.socket systemd-logind.service
Conflicts=getty@tty1.service
ConditionPathExists=/dev/tty0

[Service]
Type=simple
User=$USER
PAMName=login
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$NODE_BIN_DIR:/usr/local/bin:/usr/bin:/bin
ExecStart=$SCRIPT_DIR/kiosk-launcher.sh
Restart=always
RestartSec=10
TimeoutStopSec=10
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes
TTYVTDisallocate=yes
StandardInput=tty-fail
StandardOutput=journal
StandardError=journal
UtmpIdentifier=tty1
UtmpMode=user

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable morning-view

# Cron: daily update+restart at 6:30 (which also wakes the display), display
# off at 23:00, and a catch-up update at every boot — cron never re-runs a
# missed 6:30, so a Pi that was powered off overnight would otherwise stay on
# yesterday's art all day. Logs go to $HOME (not /tmp) so they survive
# reboots. Lines are tagged so re-runs only ever replace our own entries
# (an unanchored 'morning-view' filter would eat unrelated user cron lines
# that merely mention the repo path). The `|| true` keeps a fresh/empty
# crontab from aborting under pipefail and installing an empty crontab.
echo "Setting up cron jobs..."
chmod +x "$SCRIPT_DIR/morning-view.sh" "$SCRIPT_DIR/kiosk-launcher.sh" "$SCRIPT_DIR/display-power.sh" "$SCRIPT_DIR/doctor.sh"
CRON_TAG='# managed-by:morning-view'
CRON_PULL="30 6 * * * $SCRIPT_DIR/morning-view.sh >> $HOME/morning-view-pull.log 2>&1 $CRON_TAG"
CRON_BOOT="@reboot sleep 45; $SCRIPT_DIR/morning-view.sh >> $HOME/morning-view-pull.log 2>&1 $CRON_TAG"
CRON_DISPLAY_OFF="0 23 * * * $SCRIPT_DIR/display-power.sh off >> $HOME/morning-view-display.log 2>&1 $CRON_TAG"
{ crontab -l 2>/dev/null | grep -vF "$CRON_TAG" | grep -vF 'vcgencmd display_power' | grep -vF "$SCRIPT_DIR/morning-view.sh" || true; echo "$CRON_PULL"; echo "$CRON_BOOT"; echo "$CRON_DISPLAY_OFF"; } | crontab -

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit $PROJECT_DIR/config.json — location, and display.rotation (90 or 270)"
echo "     (safe to edit: setup marked it skip-worktree so daily updates ignore it)"
echo "  2. Start the display: sudo systemctl start morning-view"
echo "  3. Check: sudo systemctl status morning-view  /  journalctl -u morning-view -f"
echo ""
