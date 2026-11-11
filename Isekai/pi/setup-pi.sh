#!/usr/bin/env bash
# =====================================================================
#  I Got Isekai'd — Raspberry Pi 400 kiosk setup
#  Turns a Pi 400 into a games console for the game:
#   - serves the game from the SD card (no internet needed)
#   - boots straight into it, fullscreen, in Chromium
#   - keeps the screen from going to sleep
#   - Xbox controllers work over USB straight away; see the README for
#     Bluetooth pairing
#  Run once:   bash ~/isekai/pi/setup-pi.sh
#  Undo:       bash ~/isekai/pi/setup-pi.sh --remove
# =====================================================================
set -e
GAME_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8080
URL="http://localhost:${PORT}/index.html"
USER_NAME="$(whoami)"
SERVICE="$HOME/.config/systemd/user/isekai-server.service"
LAUNCH="$HOME/.local/bin/isekai-kiosk"

if [ "$1" = "--remove" ]; then
  systemctl --user disable --now isekai-server.service 2>/dev/null || true
  rm -f "$SERVICE" "$LAUNCH" "$HOME/.config/autostart/isekai.desktop"
  sed -i '/isekai-kiosk/d' "$HOME/.config/labwc/autostart" 2>/dev/null || true
  sed -i '/isekai-kiosk/d' "$HOME/.config/lxsession/LXDE-pi/autostart" 2>/dev/null || true
  sed -i '/isekai-kiosk/d' "$HOME/.config/wayfire.ini" 2>/dev/null || true
  echo "Removed. The game files are still in $GAME_DIR."
  exit 0
fi

echo "== I Got Isekai'd: setting up the Pi =="
echo "Game folder: $GAME_DIR"
[ -f "$GAME_DIR/index.html" ] || { echo "Can't find index.html in $GAME_DIR — run this from inside the game folder's pi/ directory."; exit 1; }

# 1. a tiny web server for the game (Python is already on Raspberry Pi OS)
command -v python3 >/dev/null || { echo "python3 is missing: sudo apt install -y python3"; exit 1; }
mkdir -p "$(dirname "$SERVICE")"
cat > "$SERVICE" <<EOF
[Unit]
Description=I Got Isekai'd local game server
After=default.target

[Service]
WorkingDirectory=$GAME_DIR
ExecStart=/usr/bin/python3 -m http.server $PORT --bind 127.0.0.1
Restart=always

[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now isekai-server.service
sudo loginctl enable-linger "$USER_NAME" >/dev/null 2>&1 || true

# 2. the launcher: Chromium, fullscreen, GPU on, no nagging
CHROME="$(command -v chromium-browser || command -v chromium || true)"
[ -n "$CHROME" ] || { echo "Chromium not found: sudo apt install -y chromium-browser"; exit 1; }
mkdir -p "$(dirname "$LAUNCH")"
cat > "$LAUNCH" <<EOF
#!/usr/bin/env bash
# wait for the game server, then open the game fullscreen
for i in \$(seq 1 40); do curl -s -o /dev/null "$URL" && break; sleep 0.5; done
# clear any "Chromium didn't shut down correctly" bar
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"Crashed"/"exit_type":"Normal"/' "\$HOME/.config/chromium/Default/Preferences" 2>/dev/null || true
exec "$CHROME" --kiosk "$URL" \\
  --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble \\
  --check-for-update-interval=31536000 --password-store=basic \\
  --autoplay-policy=no-user-gesture-required \\
  --enable-gpu-rasterization --ignore-gpu-blocklist --enable-zero-copy \\
  --disable-features=Translate,TouchpadOverscrollHistoryNavigation \\
  --overscroll-history-navigation=0
EOF
chmod +x "$LAUNCH"

# 3. start it when the desktop starts (works on Bookworm labwc / wayfire and older X11 desktops)
if [ -d "$HOME/.config/labwc" ] || pgrep -x labwc >/dev/null 2>&1; then
  mkdir -p "$HOME/.config/labwc"; touch "$HOME/.config/labwc/autostart"
  grep -q isekai-kiosk "$HOME/.config/labwc/autostart" || echo "$LAUNCH &" >> "$HOME/.config/labwc/autostart"
  echo "Autostart: labwc"
fi
if [ -f "$HOME/.config/wayfire.ini" ]; then
  grep -q isekai-kiosk "$HOME/.config/wayfire.ini" || { grep -q '^\[autostart\]' "$HOME/.config/wayfire.ini" || echo -e "\n[autostart]" >> "$HOME/.config/wayfire.ini"; sed -i "/^\[autostart\]/a isekai = $LAUNCH" "$HOME/.config/wayfire.ini"; }
  echo "Autostart: wayfire"
fi
mkdir -p "$HOME/.config/autostart"
cat > "$HOME/.config/autostart/isekai.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=I Got Isekai'd
Exec=$LAUNCH
X-GNOME-Autostart-enabled=true
EOF
if [ -d "$HOME/.config/lxsession/LXDE-pi" ] || [ -d /etc/xdg/lxsession/LXDE-pi ]; then
  mkdir -p "$HOME/.config/lxsession/LXDE-pi"; touch "$HOME/.config/lxsession/LXDE-pi/autostart"
  grep -q isekai-kiosk "$HOME/.config/lxsession/LXDE-pi/autostart" || echo "@$LAUNCH" >> "$HOME/.config/lxsession/LXDE-pi/autostart"
  echo "Autostart: LXDE"
fi

# 4. no screen blanking, boot to desktop with auto-login
if command -v raspi-config >/dev/null; then
  sudo raspi-config nonint do_blanking 1 || true
  sudo raspi-config nonint do_boot_behaviour B4 || true
fi

# 5. a desktop shortcut, for when you're not in kiosk mode
mkdir -p "$HOME/Desktop"
cp "$HOME/.config/autostart/isekai.desktop" "$HOME/Desktop/isekai.desktop" 2>/dev/null && chmod +x "$HOME/Desktop/isekai.desktop" || true

echo
echo "Done. Reboot to start the game:  sudo reboot"
echo "To leave the game: Alt+F4 (or Ctrl+W). To undo all this: bash $GAME_DIR/pi/setup-pi.sh --remove"
