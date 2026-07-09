#!/usr/bin/env python3
"""Single-user save endpoint for the tailnet host.

Contract (docs/save-endpoint.md is the canonical copy):

    GET  /save  ->  200 + the stored JSON blob
                    204 before any save exists (the documented empty response)
    PUT  /save  ->  204, replaces the blob
                    400 malformed JSON, 413 over 1 MiB
    anything else -> 404

One user, one opaque blob, no auth: privacy comes from the tailnet — this
binds loopback only and `tailscale serve` fronts it next to the static game.
Storage is a single JSON file, replaced atomically so a crash mid-write can
never corrupt the save.

Usage: python3 tools/save-server.py [save-file] [port]
       defaults: ~/.local/share/sigilbound/save.json, 8754
"""
import json
import os
import pathlib
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

PATH = (pathlib.Path(sys.argv[1]) if len(sys.argv) > 1
        else pathlib.Path.home() / ".local/share/sigilbound/save.json")
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8754
LIMIT = 1 << 20


class SaveHandler(BaseHTTPRequestHandler):
    def _bare(self, code):
        self.send_response(code)
        self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") != "/save":
            return self._bare(404)
        if not PATH.exists():
            return self._bare(204)
        body = PATH.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_PUT(self):
        if self.path.rstrip("/") != "/save":
            return self._bare(404)
        length = int(self.headers.get("Content-Length") or 0)
        if length > LIMIT:
            return self._bare(413)
        raw = self.rfile.read(length)
        try:
            json.loads(raw)
        except ValueError:
            return self._bare(400)
        PATH.parent.mkdir(parents=True, exist_ok=True)
        tmp = PATH.with_suffix(".tmp")
        tmp.write_bytes(raw)
        os.replace(tmp, PATH)
        self._bare(204)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", PORT), SaveHandler).serve_forever()
