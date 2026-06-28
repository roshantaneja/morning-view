#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$PROJECT_DIR"

echo "[$(date)] Pulling latest changes..."
LOCK_BEFORE=""
if [ -f package-lock.json ]; then
  LOCK_BEFORE=$(md5sum package-lock.json | cut -d' ' -f1)
fi

git pull origin main

LOCK_AFTER=""
if [ -f package-lock.json ]; then
  LOCK_AFTER=$(md5sum package-lock.json | cut -d' ' -f1)
fi

if [ "$LOCK_BEFORE" != "$LOCK_AFTER" ]; then
  echo "[$(date)] package-lock.json changed, running npm install..."
  npm install
fi

echo "[$(date)] Restarting morning-view service..."
sudo systemctl restart morning-view

echo "[$(date)] Done."
