#!/usr/bin/env bash
# =====================================================================
#  I Got Isekai'd — turn a Raspberry Pi 400 into a games console
#
#  Made for Raspberry Pi OS *Lite* (no desktop). After this, switching
#  the Pi on goes: quiet boot with the game's splash -> straight into
#  the game, fullscreen. No desktop, no login, no browser window — and
#  without a desktop running, the game gets the Pi's memory and CPU to
#  itself.
#
#  Run once, with the Pi online (it downloads the browser and a tiny
#  window manager), from wherever this folder is:
#      sudo bash /boot/firmware/isekai/pi/install-console.sh
#  Undo:
#      sudo bash /opt/isekai-console/install-console.sh --remove
# =====================================================================
set -e
say()  { echo -e "\n\033[1;33m== $*\033[0m"; }
warn() { echo -e "\033[1;31m!! $*\033[0m"; }

[ "$(id -u)" = 0 ] || { echo "Run it with sudo:  sudo bash $0"; exit 1; }
U="${SUDO_USER:-}"
if [ -z "$U" ] || [ "$U" = root ]; then U=$(getent passwd 1000 | cut -d: -f1); fi
[ -n "$U" ] || { echo "Couldn't work out your user name."; exit 1; }
H=$(getent passwd "$U" | cut -d: -f6)
UIDN=$(id -u "$U")
SRC="$(cd "$(dirname "$0")/.." && pwd)"            # the game folder this script came in
BOOT=/boot/firmware; [ -d "$BOOT" ] || BOOT=/boot
CMDLINE="$BOOT/cmdline.txt"; CONFIG="$BOOT/config.txt"
TOOLS=/opt/isekai-console

bt_conf() {   # settings that help Xbox controllers pair and reconnect
  local f=/etc/bluetooth/main.conf; [ -f "$f" ] || return 0
  grep -q '^\[General\]' "$f" || echo '[General]' >> "$f"
  for kv in "Privacy=device" "JustWorksRepairing=always" "FastConnectable=true" "ControllerMode=dual"; do
    k=${kv%%=*}
    if grep -qE "^#?\s*$k\s*=" "$f"; then sed -i -E "s|^#?\s*$k\s*=.*|$kv|" "$f"
    else sed -i "/^\[General\]/a $kv" "$f"; fi
  done
}

# ------------------------------------------------------------------ undo
if [ "${1:-}" = "--remove" ]; then
  say "Removing the console setup"
  systemctl disable --now isekai-server.service isekai-update.service 2>/dev/null || true
  rm -f /etc/systemd/system/isekai-server.service /etc/systemd/system/isekai-update.service
  rm -f /etc/systemd/system/getty@tty1.service.d/isekai-autologin.conf
  rm -f /etc/sudoers.d/isekai /usr/local/bin/isekai /usr/local/bin/isekai-session /usr/local/bin/isekai-pair /usr/local/bin/isekai-update
  sed -i '/# isekai-console/,/# end isekai-console/d' "$H/.bash_profile" "$H/.profile" 2>/dev/null || true
  [ -f "$CMDLINE.isekai-backup" ] && cp "$CMDLINE.isekai-backup" "$CMDLINE"
  sed -i '/# isekai-console/,/# end isekai-console/d' "$CONFIG" 2>/dev/null || true
  command -v plymouth-set-default-theme >/dev/null && plymouth-set-default-theme -R text 2>/dev/null || true
  systemctl daemon-reload
  echo "Done. The game files are still in /opt/isekai (delete them with: sudo rm -rf /opt/isekai /opt/isekai-console)."
  echo "Reboot to go back to a normal login."
  exit 0
fi

[ -f "$SRC/index.html" ] || { echo "Can't find the game next to this script (looked in $SRC)."; exit 1; }
echo "Setting up the console for user '$U' from $SRC"
if dpkg -l 2>/dev/null | grep -qE '^ii\s+(lightdm|labwc|wayfire|lxde-core|raspberrypi-ui-mods)\s'; then
  warn "This looks like the desktop version of Raspberry Pi OS."
  warn "That works too — the Pi will boot past the desktop straight into the game —"
  warn "but Raspberry Pi OS Lite leaves a lot more room. Continuing in 5 seconds (Ctrl+C to stop)..."
  sleep 5
fi

# ------------------------------------------------------------------ 1. software
say "1/7  Installing the browser and a tiny full-screen window manager (needs internet)"
export DEBIAN_FRONTEND=noninteractive
if ! apt-get update; then
  warn "Couldn't reach the internet. Connect the Pi (Wi-Fi: sudo raspi-config > System Options > Wireless LAN,"
  warn "or plug in a network cable) and run this again."
  exit 1
fi
CHROME_PKG=chromium; apt-cache show chromium >/dev/null 2>&1 || CHROME_PKG=chromium-browser
apt-get install -y cage "$CHROME_PKG" python3 unzip curl bluez rfkill \
  pipewire pipewire-pulse wireplumber fonts-dejavu-core libgl1-mesa-dri
apt-get install -y plymouth plymouth-themes || warn "No boot splash available — that's fine."
CHROME=$(command -v chromium || command -v chromium-browser)
[ -n "$CHROME" ] || { warn "The browser didn't install. Check the internet connection and run this again."; exit 1; }

# ------------------------------------------------------------------ 2. the game + console tools
say "2/7  Copying the game to /opt/isekai"
mkdir -p /opt/isekai "$TOOLS" /var/lib/isekai
cp -r "$SRC/." /opt/isekai/
chmod -R a+rX /opt/isekai
cp "$SRC/pi/console/isekai-server.py" "$TOOLS/"
cp "$0" "$TOOLS/install-console.sh" 2>/dev/null || cp "$SRC/pi/install-console.sh" "$TOOLS/"
install -m 755 "$SRC/pi/console/isekai-pair" /usr/local/bin/isekai-pair
install -m 755 "$SRC/pi/console/isekai-update" /usr/local/bin/isekai-update
# remember this copy so the boot-time updater doesn't reinstall it
( cd /opt/isekai && find . -type f ! -name .stamp -printf '%P %s\n' | sort; cat index.html sw.js 2>/dev/null ) | sha1sum | cut -c1-40 > /opt/isekai/.stamp
cat /opt/isekai/.stamp >> /var/lib/isekai/seen
[ -f "$SRC/../isekai.zip" ] && sha1sum "$SRC/../isekai.zip" | cut -c1-40 >> /var/lib/isekai/seen || true

# ------------------------------------------------------------------ 3. services
say "3/7  Game server and boot-time updater"
cat > /etc/systemd/system/isekai-update.service <<EOF
[Unit]
Description=I Got Isekai'd: install a newer copy from USB or the boot partition
Before=isekai-server.service
After=local-fs.target
[Service]
Type=oneshot
ExecStart=/usr/local/bin/isekai-update
TimeoutStartSec=120
[Install]
WantedBy=multi-user.target
EOF
cat > /etc/systemd/system/isekai-server.service <<EOF
[Unit]
Description=I Got Isekai'd: local game server
After=isekai-update.service
[Service]
User=$U
Environment=ISEKAI_GAME=/opt/isekai
ExecStart=/usr/bin/python3 $TOOLS/isekai-server.py
Restart=always
RestartSec=1
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable isekai-update.service isekai-server.service
systemctl restart isekai-server.service || true
# the game may turn the Pi off, restart it, and pair controllers — nothing else
cat > /etc/sudoers.d/isekai <<EOF
$U ALL=(root) NOPASSWD: /usr/bin/systemctl poweroff, /usr/bin/systemctl reboot, /usr/local/bin/isekai-pair
EOF
chmod 440 /etc/sudoers.d/isekai
visudo -cf /etc/sudoers.d/isekai >/dev/null || { rm -f /etc/sudoers.d/isekai; warn "Skipped the power permissions (sudoers check failed)."; }

# ------------------------------------------------------------------ 4. boot straight into the game
say "4/7  Log in automatically and start the game"
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/isekai-autologin.conf <<EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $U --noclear --noissue --skip-login %I \$TERM
EOF
command -v raspi-config >/dev/null && raspi-config nonint do_boot_behaviour B2 >/dev/null 2>&1 || true
systemctl set-default multi-user.target >/dev/null 2>&1 || true
touch "$H/.hushlogin"; chown "$U:" "$H/.hushlogin"
usermod -aG video,render,input,audio,bluetooth "$U" 2>/dev/null || true

cat > /usr/local/bin/isekai-session <<EOF
#!/usr/bin/env bash
# one run of the game: wait for the server, then the browser, fullscreen, under cage
for i in \$(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8080/index.html && break; sleep 0.5; done
P="\$HOME/.config/chromium/Default/Preferences"
[ -f "\$P" ] && sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"Crashed"/"exit_type":"Normal"/' "\$P"
exec cage -d -s -- $CHROME --kiosk http://127.0.0.1:8080/index.html \\
  --ozone-platform=wayland --noerrdialogs --disable-infobars --no-first-run \\
  --disable-session-crashed-bubble --check-for-update-interval=31536000 --password-store=basic \\
  --autoplay-policy=no-user-gesture-required --enable-gpu-rasterization --ignore-gpu-blocklist \\
  --disable-features=Translate,TouchpadOverscrollHistoryNavigation --overscroll-history-navigation=0 \\
  --disable-pinch --hide-scrollbars --disk-cache-size=33554432 --disable-component-update
EOF
cat > /usr/local/bin/isekai <<'EOF'
#!/usr/bin/env bash
# start the game (and keep it running: if it closes, it comes straight back)
rm -f /tmp/isekai-exit
while [ ! -f /tmp/isekai-exit ]; do /usr/local/bin/isekai-session; sleep 1; done
rm -f /tmp/isekai-exit
clear
echo "You're at the Pi's terminal. Type  isekai  to go back to the game,"
echo "or  sudo poweroff  to turn off."
EOF
chmod 755 /usr/local/bin/isekai /usr/local/bin/isekai-session
PROF="$H/.profile"; [ -f "$H/.bash_profile" ] && PROF="$H/.bash_profile"
touch "$PROF"
sed -i '/# isekai-console/,/# end isekai-console/d' "$PROF"
cat >> "$PROF" <<'EOF'
# isekai-console: on the main screen, go straight into the game
if [ "$(tty)" = /dev/tty1 ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then /usr/local/bin/isekai; fi
# end isekai-console
EOF
chown "$U:" "$PROF"
loginctl enable-linger "$U" 2>/dev/null || true

# ------------------------------------------------------------------ 5. controller + sound
say "5/7  Bluetooth controllers and sound"
echo 'options bluetooth disable_ertm=Y' > /etc/modprobe.d/xbox_bt.conf
bt_conf
systemctl enable bluetooth >/dev/null 2>&1 || true
rfkill unblock bluetooth 2>/dev/null || true
sudo -u "$U" XDG_RUNTIME_DIR=/run/user/$UIDN systemctl --user enable pipewire pipewire-pulse wireplumber >/dev/null 2>&1 || true

# ------------------------------------------------------------------ 6. a quiet boot with the game's splash
say "6/7  Quiet boot with a splash screen"
[ -f "$CMDLINE.isekai-backup" ] || cp "$CMDLINE" "$CMDLINE.isekai-backup"
line=$(head -n1 "$CMDLINE")
for opt in quiet splash loglevel=3 logo.nologo vt.global_cursor_default=0 consoleblank=0 plymouth.ignore-serial-consoles; do
  case " $line " in *" $opt "*) ;; *) line="$line $opt";; esac
done
line=$(echo "$line" | sed 's/console=tty1/console=tty3/')
echo "$line" > "$CMDLINE"
sed -i '/# isekai-console/,/# end isekai-console/d' "$CONFIG"
cat >> "$CONFIG" <<'EOF'
# isekai-console
disable_splash=1
# end isekai-console
EOF
if command -v plymouth-set-default-theme >/dev/null; then
  T=/usr/share/plymouth/themes/isekai; mkdir -p "$T"
  cp /opt/isekai/icon-512.png "$T/logo.png" 2>/dev/null || true
  cat > "$T/isekai.plymouth" <<'EOF'
[Plymouth Theme]
Name=I Got Isekai'd
Description=The game's boot splash
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/isekai
ScriptFile=/usr/share/plymouth/themes/isekai/isekai.script
EOF
  cat > "$T/isekai.script" <<'EOF'
Window.SetBackgroundTopColor(0.02, 0.01, 0.04);
Window.SetBackgroundBottomColor(0.06, 0.03, 0.10);
logo = Image("logo.png");
s = 0.55 * Window.GetHeight() / logo.GetHeight();
if (s > 1) s = 1;
logo = logo.Scale(logo.GetWidth() * s, logo.GetHeight() * s);
sp = Sprite(logo);
sp.SetX(Window.GetWidth() / 2 - logo.GetWidth() / 2);
sp.SetY(Window.GetHeight() / 2 - logo.GetHeight() / 2 - 20);
t = 0;
fun refresh() { t++; sp.SetOpacity(0.75 + 0.25 * Math.Sin(t / 18)); }
Plymouth.SetRefreshFunction(refresh);
EOF
  plymouth-set-default-theme -R isekai >/dev/null 2>&1 || warn "Couldn't set the splash (the game still boots straight in)."
fi

# ------------------------------------------------------------------ 7. leave the Pi to the game
say "7/7  Switching off things the console doesn't need"
for s in triggerhappy.service ModemManager.service cups.service cups-browsed.service lightdm.service; do
  systemctl disable --now "$s" >/dev/null 2>&1 || true
done

say "All done!"
echo "Reboot now:   sudo reboot"
echo
echo "From now on the Pi boots straight into the game. In the game, the title"
echo "screen has a Power option (turn off, restart, pair a controller)."
echo "To update: put a new isekai.zip on a USB stick, plug it in, restart."
echo "Get to a terminal any time with Ctrl+Alt+F2."
