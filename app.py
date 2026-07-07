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
import tempfile
import threading
import webbrowser

APP_DIR = Path(__file__).resolve().parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from backend.library import ExportLibrary

APP_NAME = "TeleVault"
APP_VERSION = "2.9.9"
NO_AUTO_BROWSER_ENV = "TELEVAULT_NO_AUTO_BROWSER"
PORT = 8766
ROOT = Path(__file__).parent.resolve()
FRONTEND = ROOT / "frontend"
LIBRARY = ExportLibrary()
MEDIA_CHUNK_SIZE = 1024 * 1024


def stable_app_root_id(root: Path) -> str:
    value = root.as_posix()
    while len(value) > 3 and value.endswith("/"):
        value = value[:-1]
    data = value.lower().encode("utf-8")

    hash_value = 14695981039346656037
    for byte in data:
        hash_value ^= byte
        hash_value = (hash_value * 1099511628211) & 0xFFFFFFFFFFFFFFFF
    return f"{hash_value:016x}"


APP_ROOT_ID = stable_app_root_id(ROOT)


def frontend_asset_url(name: str) -> str:
    path = FRONTEND / name
    try:
        version = str(path.stat().st_mtime_ns)
    except OSError:
        version = APP_VERSION
    return f"/{name}?v={version}"


def frontend_file_bytes(file_path: Path) -> bytes:
    data = file_path.read_bytes()
    if file_path.name != "index.html":
        return data

    html = data.decode("utf-8")
    html = html.replace('href="/styles.css"', f'href="{frontend_asset_url("styles.css")}"')
    html = html.replace('src="/app.js"', f'src="{frontend_asset_url("app.js")}"')
    return html.encode("utf-8")


class FolderPickerError(RuntimeError):
    pass


def app_data_dir() -> Path:
    appdata = os.environ.get("APPDATA")
    if appdata:
        return Path(appdata).expanduser() / APP_NAME
    xdg_config = os.environ.get("XDG_CONFIG_HOME")
    if xdg_config:
        return Path(xdg_config).expanduser() / APP_NAME
    return Path.home().expanduser() / ".config" / APP_NAME


def settings_file() -> Path:
    return app_data_dir() / "settings.json"


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


def missing_saved_vault_response(folder: str, error: str = "") -> dict:
    return {
        "loaded": False,
        "missing": True,
        "unavailable": True,
        "reason": "missing",
        "lastVaultPath": folder,
        "error": error or "папка экспорта больше недоступна",
        "message": "выберите папку заново",
    }


def forget_saved_vault_path() -> dict:
    settings = read_settings()
    removed_path = str(settings.pop("lastVaultPath", "") or "")
    if removed_path:
        write_settings(settings)
    return {"ok": True, "removed": bool(removed_path), "lastVaultPath": removed_path}


def load_saved_vault() -> dict:
    folder = str(read_settings().get("lastVaultPath") or "").strip()
    if not folder:
        return {"loaded": False}
    try:
        path = Path(folder).expanduser()
        if not path.exists() or not path.is_dir():
            return missing_saved_vault_response(folder)
    except OSError as e:
        return missing_saved_vault_response(folder, str(e))
    try:
        result = LIBRARY.load_folder(str(path))
        result["loaded"] = True
        result["lastVaultPath"] = str(path.resolve())
        return result
    except OSError as e:
        return missing_saved_vault_response(folder, str(e))
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


def request_local_port(handler: BaseHTTPRequestHandler) -> int:
    try:
        return int(handler.server.server_address[1])
    except Exception:
        return PORT


def local_app_origins(handler: BaseHTTPRequestHandler) -> tuple[str, str]:
    port = request_local_port(handler)
    return (f"http://127.0.0.1:{port}", f"http://localhost:{port}")


def is_allowed_host(handler: BaseHTTPRequestHandler) -> bool:
    port = request_local_port(handler)
    host = str(handler.headers.get("Host") or "").strip().lower()
    return host in {
        f"127.0.0.1:{port}",
        f"localhost:{port}",
        "127.0.0.1",
        "localhost",
    }


def is_allowed_local_post(handler: BaseHTTPRequestHandler) -> bool:
    if not is_allowed_host(handler):
        return False

    origins = local_app_origins(handler)
    origin = str(handler.headers.get("Origin") or "").strip().lower()
    if origin and origin not in origins:
        return False

    referer = str(handler.headers.get("Referer") or "").strip().lower()
    if referer and not any(referer.startswith(f"{origin}/") for origin in origins):
        return False

    sec_fetch_site = str(handler.headers.get("Sec-Fetch-Site") or "").strip().lower()
    if sec_fetch_site == "cross-site":
        return False

    return True


def empty_response(handler: BaseHTTPRequestHandler, status: int) -> None:
    handler.send_response(status)
    handler.send_header("Content-Length", "0")
    handler.end_headers()


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


def stream_file_response(handler: BaseHTTPRequestHandler, file_path: Path, start: int, length: int) -> None:
    remaining = length
    with file_path.open("rb") as f:
        f.seek(start)
        while remaining > 0:
            chunk = f.read(min(MEDIA_CHUNK_SIZE, remaining))
            if not chunk:
                break
            try:
                handler.wfile.write(chunk)
            except (BrokenPipeError, ConnectionError):
                break
            remaining -= len(chunk)


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
        handler.send_response(206)
        handler.send_header("Content-Type", content_type)
        handler.send_header("Accept-Ranges", "bytes")
        handler.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        handler.send_header("Content-Length", str(length))
        handler.end_headers()
        stream_file_response(handler, file_path, start, length)
        return

    handler.send_response(200)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Accept-Ranges", "bytes")
    handler.send_header("Content-Length", str(file_size))
    handler.end_headers()
    stream_file_response(handler, file_path, 0, file_size)


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


def choose_folder_with_tkinter() -> str:
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()
    try:
        root.withdraw()
        root.attributes("-topmost", True)
        folder = filedialog.askdirectory(title="выбери папку с telegram export")
        return folder or ""
    finally:
        try:
            root.destroy()
        except Exception:
            pass


def windows_picker_python_executable() -> str:
    pythonw = Path(sys.executable).with_name("pythonw.exe")
    if pythonw.is_file():
        return str(pythonw)
    return sys.executable


def choose_folder_with_windows_helper() -> str:
    helper = ROOT / "backend" / "windows_folder_picker.py"
    if not helper.is_file():
        raise FolderPickerError(f"Windows folder picker helper is missing: {helper}")

    output_path = Path(tempfile.gettempdir()) / f"televault-folder-picker-{os.getpid()}-{threading.get_ident()}.json"
    try:
        if output_path.exists():
            output_path.unlink()
        result = subprocess.run(
            [windows_picker_python_executable(), str(helper), str(output_path)],
            cwd=ROOT,
        )

        if not output_path.is_file():
            raise FolderPickerError(f"Windows folder picker did not return a result; exit code {result.returncode}")

        data = json.loads(output_path.read_text(encoding="utf-8"))
        if data.get("error"):
            raise FolderPickerError(str(data["error"]))
        return str(data.get("folder") or "")
    finally:
        try:
            output_path.unlink()
        except FileNotFoundError:
            pass
        except Exception:
            pass


def choose_folder_dialog() -> str:
    if os.name == "nt":
        return choose_folder_with_windows_helper()

    try:
        return choose_folder_with_tkinter()
    except Exception as exc:
        print(f"folder picker tkinter failed: {type(exc).__name__}: {exc}")

    raise FolderPickerError("Folder picker is unavailable on this system.")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        print(format % args)

    def do_GET(self) -> None:
        if not is_allowed_host(self):
            empty_response(self, 403)
            return

        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/status":
            json_response(self, {"name": APP_NAME, "version": APP_VERSION, "ready": True, "app_root_id": APP_ROOT_ID})
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

        if path == "/api/search":
            params = parse_qs(parsed.query)
            query = params.get("q", [""])[0]
            try:
                limit = int(params.get("limit", ["50"])[0])
            except ValueError:
                limit = 50
            json_response(self, LIBRARY.search_messages(query, limit))
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
        try:
            file_path.relative_to(FRONTEND)
        except ValueError:
            self.send_error(404)
            return
        if not file_path.exists():
            self.send_error(404)
            return
        mt, _ = mimetypes.guess_type(str(file_path))
        data = frontend_file_bytes(file_path)
        self.send_response(200)
        self.send_header("Content-Type", mt or "text/plain")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        if not is_allowed_host(self):
            empty_response(self, 403)
            return

        parsed = urlparse(self.path)
        if parsed.path == "/api/pick-folder":
            if not is_allowed_local_post(self):
                json_response(self, {"error": "forbidden"}, 403)
                return
            try:
                folder = choose_folder_dialog()
            except FolderPickerError as e:
                json_response(self, {"error": str(e)}, 500)
                return
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
            if not is_allowed_local_post(self):
                json_response(self, {"error": "forbidden"}, 403)
                return
            try:
                body = read_body(self)
                folder = str(body.get("folder", ""))
                result = load_folder_and_remember(folder)
                json_response(self, result)
            except Exception as e:
                json_response(self, {"error": str(e)}, 400)
            return

        if parsed.path == "/api/forget-missing-vault":
            if not is_allowed_local_post(self):
                json_response(self, {"error": "forbidden"}, 403)
                return
            try:
                json_response(self, forget_saved_vault_path())
            except Exception as e:
                json_response(self, {"error": str(e)}, 500)
            return

        json_response(self, {"error": "not found"}, 404)

    def do_OPTIONS(self) -> None:
        if not is_allowed_host(self):
            empty_response(self, 403)
            return

        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            if not is_allowed_local_post(self):
                empty_response(self, 403)
                return
            self.send_response(204)
            self.send_header("Allow", "GET, POST, OPTIONS")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        empty_response(self, 404)


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
    if os.environ.get(NO_AUTO_BROWSER_ENV) != "1":
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("stopping...")


if __name__ == "__main__":
    main()
