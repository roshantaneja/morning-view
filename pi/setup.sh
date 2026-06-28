#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FONT_URL="https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip"

echo "=== Morning View — Pi Setup ==="
echo ""

# Install nvm and Node 20
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  echo "Installing Node.js 20 LTS via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  echo "Node $(node -v) already installed."
fi

# Install Nerd Font
FONT_DIR="$HOME/.local/share/fonts"
if [ ! -d "$FONT_DIR/JetBrainsMono" ]; then
  echo "Installing JetBrainsMono Nerd Font..."
  mkdir -p "$FONT_DIR/JetBrainsMono"
  TMP_ZIP="/tmp/JetBrainsMono.zip"
  curl -fsSL "$FONT_URL" -o "$TMP_ZIP"
  unzip -o "$TMP_ZIP" -d "$FONT_DIR/JetBrainsMono"
  rm "$TMP_ZIP"
  fc-cache -fv
else
  echo "JetBrainsMono Nerd Font already installed."
fi

# Install npm dependencies
echo "Installing dependencies..."
cd "$PROJECT_DIR"
npm install

# Create systemd service
echo "Setting up systemd service..."
sudo tee /etc/systemd/system/morning-view.service > /dev/null << EOF
[Unit]
Description=Morning View Terminal Art Display
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which node) src/index.js
Restart=on-failure
RestartSec=10
Environment=TERM=xterm-256color
StandardOutput=tty
StandardInput=tty
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable morning-view

# Set up cron entries
echo "Setting up cron jobs..."
CRON_PULL="30 6 * * * $SCRIPT_DIR/morning-view.sh >> /tmp/morning-view-pull.log 2>&1"
CRON_DISPLAY_ON="30 6 * * * vcgencmd display_power 1"
CRON_DISPLAY_OFF="0 23 * * * vcgencmd display_power 0"

(crontab -l 2>/dev/null | grep -v 'morning-view\|display_power'; echo "$CRON_PULL"; echo "$CRON_DISPLAY_ON"; echo "$CRON_DISPLAY_OFF") | crontab -

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit $PROJECT_DIR/config.json with your location (latitude/longitude)"
echo "  2. Configure your terminal to use JetBrainsMono Nerd Font"
echo "  3. Test: sudo systemctl start morning-view"
echo "  4. Check: sudo systemctl status morning-view"
echo ""
