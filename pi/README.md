# Raspberry Pi Setup

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
   chmod +x pi/setup.sh pi/morning-view.sh
   ./pi/setup.sh
   ```

3. Edit `config.json` with your location:
   ```json
   {
     "location": {
       "latitude": 37.7749,
       "longitude": -122.4194,
       "city": "San Francisco"
     }
   }
   ```

4. Set your terminal to portrait mode. Add to `/boot/config.txt`:
   ```
   display_rotate=1
   ```

5. Configure auto-login to console (no desktop):
   ```bash
   sudo raspi-config
   # → System Options → Boot / Auto Login → Console Autologin
   ```

6. Start the display:
   ```bash
   sudo systemctl start morning-view
   ```

## What the Cron Jobs Do

| Time | Job |
|------|-----|
| 6:30 AM | `morning-view.sh` — git pull, npm install if needed, restart service |
| 6:30 AM | Turn display on (`vcgencmd display_power 1`) |
| 11:00 PM | Turn display off (`vcgencmd display_power 0`) |

## Manual Commands

```bash
# Check status
sudo systemctl status morning-view

# View logs
journalctl -u morning-view -f

# Restart
sudo systemctl restart morning-view

# Manual pull
./pi/morning-view.sh

# Test display on/off
vcgencmd display_power 1  # on
vcgencmd display_power 0  # off
```

## Troubleshooting

- **Black screen**: Check `journalctl -u morning-view -f` for errors
- **No weather data**: Verify latitude/longitude in config.json
- **Font issues**: Run `fc-list | grep JetBrains` to verify Nerd Font is installed
- **Wrong orientation**: Check `display_rotate` in `/boot/config.txt`
