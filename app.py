from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse, unquote
import json
import mimetypes
import os
import socket
import subprocess
import sys
import threading
import webbrowser

from backend.library import ExportLibrary

APP_NAME = "TeleVault"
APP_VERSION = "2.6.9"
PORT = 8766
ROOT = Path(__file__).parent.resolve()
FRONTEND = ROOT / "frontend"
LIBRARY = ExportLibrary()


def settings_file() -> Path:
    appdata = os.environ.get("APPDATA")
    if appdata:
        return Path(appdata).expanduser() / APP_NAME / "settings.json"
    return ROOT / "settings.json"


def read_settings() -> dict:
    path = settings_file()
    try:
        if not path.exists():
            return {}
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def write_settings(data: dict) -> None:
    path = settings_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def remember_vault_path(folder: str) -> None:
    settings = read_settings()
    settings["lastVaultPath"] = str(Path(folder).expanduser().resolve())
    write_settings(settings)


def load_folder_and_remember(folder: str) -> dict:
    result = LIBRARY.load_folder(folder)
    try:
        remember_vault_path(folder)
    except Exception as e:
        result["settings_error"] = str(e)
    return result


def load_saved_vault() -> dict:
    folder = str(read_settings().get("lastVaultPath") or "").strip()
    if not folder:
        return {"loaded": False}
    path = Path(folder).expanduser()
    if not path.exists() or not path.is_dir():
        return {
            "loaded": False,
            "missing": True,
            "lastVaultPath": folder,
            "error": "сохранённое хранилище не найдено",
        }
    try:
        result = LIBRARY.load_folder(str(path))
        result["loaded"] = True
        result["lastVaultPath"] = str(path.resolve())
        return result
    except Exception as e:
        return {"loaded": False, "lastVaultPath": folder, "error": str(e)}


def json_response(handler: BaseHTTPRequestHandler, data: dict, status: int = 200) -> None:
    raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


def read_body(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0") or 0)
    if length <= 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    return json.loads(raw or "{}")


def parse_range_header(range_header: str, file_size: int) -> tuple[int, int]:
    unit, separator, spec = range_header.partition("=")
    if file_size <= 0 or unit.strip().lower() != "bytes" or not separator:
        raise ValueError("unsupported range")

    spec = spec.strip()
    if "," in spec or "-" not in spec:
        raise ValueError("unsupported range")

    start_text, end_text = spec.split("-", 1)
    if not start_text:
        if not end_text.isdigit():
            raise ValueError("invalid suffix range")
        suffix_length = int(end_text)
        if suffix_length <= 0:
            raise ValueError("invalid suffix range")
        start = max(file_size - suffix_length, 0)
        end = file_size - 1
    else:
        if not start_text.isdigit() or (end_text and not end_text.isdigit()):
            raise ValueError("invalid range")
        start = int(start_text)
        end = int(end_text) if end_text else file_size - 1
        if start >= file_size or start > end:
            raise ValueError("range not satisfiable")
        end = min(end, file_size - 1)

    return start, end


def send_empty_range_error(handler: BaseHTTPRequestHandler, file_size: int, content_type: str) -> None:
    handler.send_response(416)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Accept-Ranges", "bytes")
    handler.send_header("Content-Range", f"bytes */{file_size}")
    handler.send_header("Content-Length", "0")
    handler.end_headers()


def send_media_file(handler: BaseHTTPRequestHandler, file_path: Path) -> None:
    content_type, _ = mimetypes.guess_type(str(file_path))
    content_type = content_type or "application/octet-stream"
    file_size = file_path.stat().st_size
    range_header = str(handler.headers.get("Range") or "").strip()

    if range_header:
        try:
            start, end = parse_range_header(range_header, file_size)
        except ValueError:
            send_empty_range_error(handler, file_size, content_type)
            return

        length = end - start + 1
        with file_path.open("rb") as f:
            f.seek(start)
            data = f.read(length)

        handler.send_response(206)
        handler.send_header("Content-Type", content_type)
        handler.send_header("Accept-Ranges", "bytes")
        handler.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        handler.send_header("Content-Length", str(len(data)))
        handler.end_headers()
        handler.wfile.write(data)
        return

    data = file_path.read_bytes()
    handler.send_response(200)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Accept-Ranges", "bytes")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class MediaForbiddenError(Exception):
    pass


def ensure_media_inside_root(file_path: Path, root: Path) -> None:
    try:
        file_path.relative_to(root)
    except ValueError as exc:
        raise MediaForbiddenError() from exc


def resolve_media_request(parsed) -> Path:
    if not LIBRARY.root:
        raise MediaForbiddenError()

    root = LIBRARY.root.resolve()
    if parsed.path == "/media":
        params = parse_qs(parsed.query)
        raw_path = params.get("path", [""])[0]
        if not raw_path:
            raise FileNotFoundError()
        decoded_path = unquote(raw_path)
        candidate = Path(decoded_path)
        file_path = candidate.resolve() if candidate.is_absolute() else (root / candidate).resolve()
    else:
        encoded_path = parsed.path[len("/media/"):]
        if not encoded_path:
            raise FileNotFoundError()
        decoded_path = unquote(encoded_path)
        candidate = Path(decoded_path)
        if candidate.is_absolute():
            raise MediaForbiddenError()
        file_path = (root / candidate).resolve()

    ensure_media_inside_root(file_path, root)
    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError()
    return file_path


def choose_folder_dialog() -> str:
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        folder = filedialog.askdirectory(title="выбери папку с telegram export")
        root.destroy()
        return folder or ""
    except Exception:
        return ""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        print(format % args)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/status":
            json_response(self, {"name": APP_NAME, "version": APP_VERSION, "ready": True})
            return

        if path == "/api/startup-vault":
            json_response(self, load_saved_vault())
            return

        if path == "/api/chat":
            params = parse_qs(parsed.query)
            chat_id = params.get("id", [""])[0]
            query = params.get("q", [""])[0]
            sender = params.get("sender", [""])[0]
            media_only = params.get("media", ["0"])[0] == "1"
            try:
                json_response(self, LIBRARY.get_chat(chat_id, query, sender, media_only))
            except Exception as e:
                json_response(self, {"error": str(e)}, 400)
            return

        if path == "/media" or path.startswith("/media/"):
            try:
                file_path = resolve_media_request(parsed)
                send_media_file(self, file_path)
            except MediaForbiddenError:
                self.send_error(403)
            except FileNotFoundError:
                self.send_error(404)
            except Exception:
                self.send_error(500)
            return

        if path == "/":
            path = "/index.html"
        file_path = (FRONTEND / path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(FRONTEND)) or not file_path.exists():
            self.send_error(404)
            return
        mt, _ = mimetypes.guess_type(str(file_path))
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mt or "text/plain")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/pick-folder":
            folder = choose_folder_dialog()
            if not folder:
                json_response(self, {"status": "cancelled", "cancelled": True, "canceled": True})
                return
            try:
                result = load_folder_and_remember(folder)
                json_response(self, result)
            except Exception as e:
                json_response(self, {"error": str(e)}, 400)
            return

        if parsed.path == "/api/load-folder":
            try:
                body = read_body(self)
                folder = str(body.get("folder", ""))
                result = load_folder_and_remember(folder)
                json_response(self, result)
            except Exception as e:
                json_response(self, {"error": str(e)}, 400)
            return

        json_response(self, {"error": "not found"}, 404)


def find_free_port(preferred: int) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


def main() -> None:
    port = find_free_port(PORT)
    url = f"http://127.0.0.1:{port}"
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"{APP_NAME} {APP_VERSION}")
    print(f"open: {url}")
    print("press ctrl+c to stop")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("stopping...")


if __name__ == "__main__":
    main()
