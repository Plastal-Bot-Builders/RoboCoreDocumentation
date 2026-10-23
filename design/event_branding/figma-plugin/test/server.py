# Local asset + review server for the event branding builder (127.0.0.1:8767).
#   python3 -I test/server.py <review-out-folder>
# GET /asset?name=robot_hero.png serves ../../assets/<name>; POST /save?name=… stores review PNGs and report.json.
import http.server, os, re, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, '..', '..', 'assets'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'review-out')
os.makedirs(OUT, exist_ok=True)


class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path == '/asset':
            name = urllib.parse.parse_qs(u.query).get('name', [''])[0]
            p = os.path.normpath(os.path.join(ASSETS, name))            # assets/<name> or assets/renders/<name>
            if not name or not p.startswith(ASSETS + os.sep) or not os.path.isfile(p):
                self.send_response(404); self._cors(); self.end_headers(); return
            data = open(p, 'rb').read()
            self.send_response(200); self._cors(); self.send_header('Content-Type', 'application/octet-stream'); self.send_header('Content-Length', str(len(data))); self.end_headers()
            self.wfile.write(data); print('served', name, len(data), flush=True); return
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'ok')

    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = re.sub(r'[^\w.\-]+', '_', q.get('name', ['upload.bin'])[0])[:120]
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(data)
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'saved')
        print('saved', name, len(data), flush=True)

    def log_message(self, *a):
        pass


http.server.ThreadingHTTPServer(('127.0.0.1', 8767), H).serve_forever()
