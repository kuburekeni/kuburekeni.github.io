#!/usr/bin/env bash
# =====================================================================
#  Bring the console's own tools up to date from the game folder this
#  script sits in (server, updater, pairing, Bluetooth settings).
#  Run as root. Safe to run any number of times. Called by the boot-time
#  updater and by update-pi.bat.
# =====================================================================
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
[ "$(id -u)" = 0 ] || { echo "run with sudo"; exit 1; }
[ -f "$HERE/isekai-server.py" ] || exit 0
install -m 755 "$HERE/isekai-pair" /usr/local/bin/isekai-pair
install -m 755 "$HERE/isekai-update" /usr/local/bin/isekai-update
mkdir -p /opt/isekai-console
cp "$HERE/isekai-server.py" "$HERE/refresh-tools.sh" /opt/isekai-console/
[ -f "$HERE/../install-console.sh" ] && cp "$HERE/../install-console.sh" /opt/isekai-console/

# the game server needs to reach the user's sound system
SVC=/etc/systemd/system/isekai-server.service
if [ -f "$SVC" ]; then
  U=$(sed -n 's/^User=//p' "$SVC" | head -1)
  if [ -n "$U" ] && ! grep -q XDG_RUNTIME_DIR "$SVC"; then
    sed -i "/^User=/a Environment=XDG_RUNTIME_DIR=/run/user/$(id -u "$U")" "$SVC"
  fi
  systemctl daemon-reload
fi

# settings that help Xbox controllers pair and reconnect
f=/etc/bluetooth/main.conf
if [ -f "$f" ]; then
  grep -q '^\[General\]' "$f" || echo '[General]' >> "$f"
  for kv in "Privacy=device" "JustWorksRepairing=always" "FastConnectable=true" "ControllerMode=dual"; do
    k=${kv%%=*}
    if grep -qE "^#?\s*$k\s*=" "$f"; then sed -i -E "s|^#?\s*$k\s*=.*|$kv|" "$f"
    else sed -i "/^\[General\]/a $kv" "$f"; fi
  done
fi
echo "Console tools refreshed."
