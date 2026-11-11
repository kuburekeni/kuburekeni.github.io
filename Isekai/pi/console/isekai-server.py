#!/usr/bin/env python3
# =====================================================================
#  I Got Isekai'd — console server
#  Serves the game to the kiosk browser on this machine only, and gives
#  the game a few console powers: turn off, restart, drop to a terminal,
#  and pair a Bluetooth controller.
#  Listens on 127.0.0.1 only, so nothing on the network can reach it.
# =====================================================================
import http.server, json, os, socketserver, subprocess, sys, threading, time

GAME = os.environ.get('ISEKAI_GAME', '/opt/isekai')
PORT = int(os.environ.get('ISEKAI_PORT', '8080'))
DRY = os.environ.get('ISEKAI_DRYRUN') == '1'      # for testing off the Pi
TOOLS = os.path.dirname(os.path.abspath(__file__))
EXIT_FLAG = '/tmp/isekai-exit'
os.environ.setdefault('XDG_RUNTIME_DIR', f'/run/user/{os.getuid()}')

def wp(*args, timeout=6):
    r = subprocess.run(['wpctl', *args], capture_output=True, text=True, timeout=timeout)
    return r.stdout

def sinks():
    # parse the Sinks list out of `wpctl status`
    out, in_audio, in_sinks, res = wp('status'), False, False, []
    for line in out.splitlines():
        t = line.strip(' │├└─\t')
        if line.startswith('Audio'): in_audio = True; continue
        if in_audio and line.startswith(('Video', 'Settings')): break
        if in_audio and 'Sinks:' in line: in_sinks = True; continue
        if in_sinks and ('Sources:' in line or 'Filters:' in line or 'Streams:' in line): break
        if in_sinks and t:
            m = __import__('re').match(r'(\*)?\s*(\d+)\.\s+(.*?)\s*(\[vol:\s*([\d.]+)(\s+MUTED)?\])?$', t)
            if m:
                res.append({'id': int(m.group(2)), 'name': m.group(3), 'default': bool(m.group(1)),
                            'vol': float(m.group(5)) if m.group(5) else None, 'muted': bool(m.group(6))})
    return res

def version():
    try:
        with open(os.path.join(GAME, '.stamp')) as f: return f.read().strip()[:12]
    except Exception: return 'dev'

def health():
    # what the Pi's firmware says about power and heat (vcgencmd ships with Raspberry Pi OS)
    out = {'ok': True}
    def vc(*a):
        try: return subprocess.run(['vcgencmd', *a], capture_output=True, text=True, timeout=3).stdout.strip()
        except Exception: return ''
    t = vc('get_throttled')            # throttled=0x50005
    if '=' in t:
        try:
            v = int(t.split('=')[1], 16)
            out.update(throttled=v, undervolt_now=bool(v & 1), capped_now=bool(v & 2), throttled_now=bool(v & 4),
                       hot_now=bool(v & 8), undervolt_seen=bool(v & 0x10000), throttled_seen=bool(v & 0x40000))
        except ValueError: pass
    c = vc('measure_clock', 'arm')     # frequency(48)=1800404352
    if '=' in c:
        try: out['arm_mhz'] = int(c.split('=')[1]) // 1000000
        except ValueError: pass
    tt = vc('measure_temp')            # temp=52.1'C
    if '=' in tt:
        try: out['temp_c'] = float(tt.split('=')[1].split("'")[0])
        except ValueError: pass
    if DRY: out.update(throttled=0x50005, undervolt_now=True, capped_now=False, throttled_now=True, hot_now=False, undervolt_seen=True, throttled_seen=True, arm_mhz=600, temp_c=55.0)
    return out

def later(cmd, delay=1.2):
    # reply to the game first, then act
    def go():
        time.sleep(delay)
        if DRY: print('DRYRUN would run:', cmd, flush=True); return
        subprocess.run(cmd)
    threading.Thread(target=go, daemon=True).start()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=GAME, **k)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def reply(self, obj, code=200):
        b = json.dumps(obj).encode()
        self.send_response(code); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith('/__console'):
            return self.reply({'console': True, 'version': version(), 'audio': True})
        if self.path.startswith('/__health'):
            return self.reply(health())
        if self.path.startswith('/__audio'):
            if DRY: return self.reply({'ok': True, 'sinks': [{'id': 47, 'name': 'Built-in Audio Digital Stereo (HDMI)', 'default': True, 'vol': 1.0, 'muted': False}, {'id': 52, 'name': 'Built-in Audio Digital Stereo (HDMI 2)', 'default': False, 'vol': 0.4, 'muted': False}]})
            try: return self.reply({'ok': True, 'sinks': sinks()})
            except Exception as e: return self.reply({'ok': False, 'error': str(e)[:160], 'sinks': []})
        return super().do_GET()
    def do_POST(self):
        p = self.path.split('?')[0]
        if p == '/__power/off':
            later(['sudo', '-n', '/usr/bin/systemctl', 'poweroff']); return self.reply({'ok': True})
        if p == '/__power/reboot':
            later(['sudo', '-n', '/usr/bin/systemctl', 'reboot']); return self.reply({'ok': True})
        if p == '/__power/terminal':
            open(EXIT_FLAG, 'w').close()
            later(['pkill', '-f', 'chromium'], 0.8); return self.reply({'ok': True})
        if p == '/__log':
            try:
                n = min(int(self.headers.get('Content-Length') or 0), 8000)
                line = self.rfile.read(n).decode('utf-8', 'replace').replace('\n', ' ')
                log = '/tmp/isekai-log.txt'
                if os.path.exists(log) and os.path.getsize(log) > 400000: os.replace(log, log + '.old')
                with open(log, 'a') as f: f.write(line + '\n')
            except Exception: pass
            return self.reply({'ok': True})
        if p.startswith('/__audio/'):
            from urllib.parse import urlparse, parse_qs
            q = parse_qs(urlparse(self.path).query)
            try:
                if DRY: print('DRYRUN audio', self.path, flush=True); return self.reply({'ok': True})
                if p == '/__audio/default':
                    sid = str(int(q['id'][0])); wp('set-default', sid); wp('set-mute', sid, '0')
                elif p == '/__audio/volume':
                    v = max(0.0, min(1.5, float(q['v'][0])))
                    wp('set-volume', '@DEFAULT_AUDIO_SINK@', f'{v:.2f}'); wp('set-mute', '@DEFAULT_AUDIO_SINK@', '0')
                else:
                    return self.reply({'ok': False, 'error': 'unknown'}, 404)
                return self.reply({'ok': True})
            except Exception as e:
                return self.reply({'ok': False, 'error': str(e)[:160]})
        if p == '/__pair':
            if DRY: time.sleep(2); return self.reply({'ok': True, 'name': 'Xbox Wireless Controller (test)'})
            try:
                r = subprocess.run(['sudo', '-n', '/usr/local/bin/isekai-pair'], capture_output=True, text=True, timeout=75)
                last = (r.stdout.strip().splitlines() or ['{}'])[-1]
                return self.reply(json.loads(last))
            except subprocess.TimeoutExpired:
                return self.reply({'ok': False, 'error': 'timed out'})
            except Exception as e:
                return self.reply({'ok': False, 'error': str(e)[:120]})
        self.reply({'ok': False, 'error': 'unknown'}, 404)

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == '__main__':
    with Server(('127.0.0.1', PORT), Handler) as s:
        print(f'I Got Isekai\'d: serving {GAME} on http://127.0.0.1:{PORT}', flush=True)
        s.serve_forever()
