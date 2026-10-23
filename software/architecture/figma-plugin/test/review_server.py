# Local review server for the Figma builder plugin: receives PNG previews + report.json.
#   python3 test/review_server.py <output-folder>      (listens on 127.0.0.1:8765)
import http.server, os, re, sys, urllib.parse

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'review-out')
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


http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
