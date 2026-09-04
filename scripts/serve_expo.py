#!/usr/bin/env python3
"""Static file server for Expo web export with extensionless HTML routes."""
import http.server
import socketserver
import urllib.parse
from pathlib import Path

ROOT = Path("/workspace/frontend/dist")
PORT = 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path: str) -> str:
        parsed = urllib.parse.urlparse(path)
        rel = urllib.parse.unquote(parsed.path)
        candidate = ROOT / rel.lstrip("/")
        if candidate.is_file():
            return super().translate_path(path)
        if candidate.is_dir() and (candidate / "index.html").is_file():
            return super().translate_path(path)
        html = ROOT / (rel.lstrip("/") + ".html")
        if html.is_file():
            mapped = "/" + rel.lstrip("/") + ".html"
            return super().translate_path(mapped)
        if not candidate.exists():
            return super().translate_path("/index.html")
        return super().translate_path(path)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableTCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Serving {ROOT} on {PORT}", flush=True)
        httpd.serve_forever()
