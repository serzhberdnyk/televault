from __future__ import annotations

from ctypes import wintypes
from datetime import datetime
from pathlib import Path
import ctypes
import json
import sys
import uuid


APP_NAME = "TeleVault"
TITLE = "выбери папку с telegram export"
ALLOWED_OWNER_PROCESSES = {"msedge", "msedge.exe", "chrome", "chrome.exe"}
PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
SHOW_WINDOW_SHOW = 5
SHOW_WINDOW_RESTORE = 9
ENUM_WINDOWS_PROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)


class FolderPickerError(RuntimeError):
    pass


class GUID(ctypes.Structure):
    _fields_ = [
        ("Data1", wintypes.DWORD),
        ("Data2", wintypes.WORD),
        ("Data3", wintypes.WORD),
        ("Data4", ctypes.c_ubyte * 8),
    ]

    @classmethod
    def from_string(cls, value: str) -> "GUID":
        parsed = uuid.UUID(value)
        data4 = (ctypes.c_ubyte * 8).from_buffer_copy(parsed.bytes[8:])
        return cls(parsed.time_low, parsed.time_mid, parsed.time_hi_version, data4)


def hresult_code(value: int) -> int:
    return int(value) & 0xFFFFFFFF


def hresult_failed(value: int) -> bool:
    return bool(hresult_code(value) & 0x80000000)


def format_hresult(value: int) -> str:
    return f"0x{hresult_code(value):08X}"


def check_hresult(value: int, action: str) -> None:
    if hresult_failed(value):
        raise FolderPickerError(f"{action} failed: {format_hresult(value)}")


def com_method(com_ptr: ctypes.c_void_p, index: int, restype, *argtypes):
    vtable = ctypes.cast(com_ptr, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents
    prototype = ctypes.WINFUNCTYPE(restype, ctypes.c_void_p, *argtypes)
    return prototype(vtable[index])


def release_com_object(com_ptr: ctypes.c_void_p) -> None:
    if not com_ptr:
        return
    release = com_method(com_ptr, 2, wintypes.ULONG)
    release(com_ptr)


def log_launcher(message: str) -> None:
    try:
        root = Path(__file__).resolve().parents[1]
        logs_dir = root / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        line = f"{datetime.now():%Y-%m-%d %H:%M:%S} folder picker: {message}\n"
        with (logs_dir / "launcher.log").open("a", encoding="utf-8") as handle:
            handle.write(line)
    except Exception:
        pass


def safe_log_value(value: str) -> str:
    value = str(value or "").replace("\r", " ").replace("\n", " ").strip()
    return value or "(missing)"


def hwnd_to_int(hwnd) -> int:
    try:
        return int(hwnd or 0)
    except TypeError:
        return int(getattr(hwnd, "value", 0) or 0)


def configure_window_api(user32, kernel32) -> None:
    user32.EnumWindows.argtypes = [ENUM_WINDOWS_PROC, wintypes.LPARAM]
    user32.EnumWindows.restype = wintypes.BOOL
    user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    user32.GetWindowTextLengthW.restype = ctypes.c_int
    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int
    user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    user32.GetWindowThreadProcessId.restype = wintypes.DWORD
    user32.IsIconic.argtypes = [wintypes.HWND]
    user32.IsIconic.restype = wintypes.BOOL
    user32.IsWindowVisible.argtypes = [wintypes.HWND]
    user32.IsWindowVisible.restype = wintypes.BOOL
    user32.SetForegroundWindow.argtypes = [wintypes.HWND]
    user32.SetForegroundWindow.restype = wintypes.BOOL
    user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
    user32.ShowWindow.restype = wintypes.BOOL

    kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL
    if hasattr(kernel32, "QueryFullProcessImageNameW"):
        kernel32.QueryFullProcessImageNameW.argtypes = [
            wintypes.HANDLE,
            wintypes.DWORD,
            wintypes.LPWSTR,
            ctypes.POINTER(wintypes.DWORD),
        ]
        kernel32.QueryFullProcessImageNameW.restype = wintypes.BOOL


def get_window_title(user32, hwnd) -> str:
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ""
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, len(buffer))
    return buffer.value


def get_window_process_name(user32, kernel32, hwnd) -> str:
    process_id = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(process_id))
    if not process_id.value:
        return ""

    handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, process_id.value)
    if not handle:
        return ""

    try:
        if not hasattr(kernel32, "QueryFullProcessImageNameW"):
            return ""
        buffer = ctypes.create_unicode_buffer(32768)
        size = wintypes.DWORD(len(buffer))
        if not kernel32.QueryFullProcessImageNameW(handle, 0, buffer, ctypes.byref(size)):
            return ""
        return Path(buffer.value).name
    finally:
        kernel32.CloseHandle(handle)


def is_owner_process_allowed(process_name: str) -> bool:
    if not process_name:
        return True
    return process_name.lower() in ALLOWED_OWNER_PROCESSES


def find_televault_owner_hwnd() -> int:
    try:
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        configure_window_api(user32, kernel32)
        found: list[tuple[int, str]] = []

        @ENUM_WINDOWS_PROC
        def enum_window(hwnd, _lparam):
            if not user32.IsWindowVisible(hwnd):
                return True

            title = get_window_title(user32, hwnd)
            if APP_NAME.lower() not in title.lower():
                return True

            process_name = get_window_process_name(user32, kernel32, hwnd)
            if not is_owner_process_allowed(process_name):
                return True

            found.append((hwnd_to_int(hwnd), process_name))
            return False

        user32.EnumWindows(enum_window, 0)
        if found:
            hwnd, process_name = found[0]
            log_launcher(f"owner hwnd found: 0x{hwnd:X}, process={safe_log_value(process_name)}")
            return hwnd

        log_launcher("owner hwnd not found")
        return 0
    except Exception as exc:
        log_launcher(f"owner hwnd lookup failed: {type(exc).__name__}")
        return 0


def bring_window_to_foreground(hwnd: int) -> None:
    if not hwnd:
        return
    try:
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        user32.IsIconic.argtypes = [wintypes.HWND]
        user32.IsIconic.restype = wintypes.BOOL
        user32.SetForegroundWindow.argtypes = [wintypes.HWND]
        user32.SetForegroundWindow.restype = wintypes.BOOL
        user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
        user32.ShowWindow.restype = wintypes.BOOL

        owner = wintypes.HWND(hwnd)
        show_command = SHOW_WINDOW_RESTORE if user32.IsIconic(owner) else SHOW_WINDOW_SHOW
        user32.ShowWindow(owner, show_command)
        foreground = user32.SetForegroundWindow(owner)
        log_launcher(
            f"owner foreground requested: 0x{hwnd:X}"
            + ("" if foreground else " (foreground request returned false)")
        )
    except Exception as exc:
        log_launcher(f"owner foreground request failed: {type(exc).__name__}")


def pick_folder(title: str = TITLE) -> str:
    clsid_file_open_dialog = GUID.from_string("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")
    iid_file_open_dialog = GUID.from_string("D57C7288-D4AD-4768-BE02-9D969532D960")
    clsctx_inproc_server = 0x1
    coinit_apartmentthreaded = 0x2
    rpc_e_changed_mode = 0x80010106
    hresult_cancelled = 0x800704C7
    fos_pickfolders = 0x20
    fos_forcefilesystem = 0x40
    fos_pathmustexist = 0x800
    sigdn_filesyspath = 0x80058000

    ole32 = ctypes.WinDLL("ole32", use_last_error=True)
    ole32.CoInitializeEx.argtypes = [ctypes.c_void_p, wintypes.DWORD]
    ole32.CoInitializeEx.restype = ctypes.c_long
    ole32.CoUninitialize.argtypes = []
    ole32.CoUninitialize.restype = None
    ole32.CoCreateInstance.argtypes = [
        ctypes.POINTER(GUID),
        ctypes.c_void_p,
        wintypes.DWORD,
        ctypes.POINTER(GUID),
        ctypes.POINTER(ctypes.c_void_p),
    ]
    ole32.CoCreateInstance.restype = ctypes.c_long
    ole32.CoTaskMemFree.argtypes = [ctypes.c_void_p]
    ole32.CoTaskMemFree.restype = None

    coinitialized = False
    dialog = ctypes.c_void_p()
    shell_item = ctypes.c_void_p()
    path_ptr = wintypes.LPWSTR()

    hr = ole32.CoInitializeEx(None, coinit_apartmentthreaded)
    if hresult_failed(hr):
        if hresult_code(hr) == rpc_e_changed_mode:
            raise FolderPickerError("Windows folder picker needs an STA thread.")
        check_hresult(hr, "CoInitializeEx")
    else:
        coinitialized = True

    try:
        hr = ole32.CoCreateInstance(
            ctypes.byref(clsid_file_open_dialog),
            None,
            clsctx_inproc_server,
            ctypes.byref(iid_file_open_dialog),
            ctypes.byref(dialog),
        )
        check_hresult(hr, "CoCreateInstance(FileOpenDialog)")

        get_options = com_method(dialog, 10, ctypes.c_long, ctypes.POINTER(wintypes.DWORD))
        set_options = com_method(dialog, 9, ctypes.c_long, wintypes.DWORD)
        set_title = com_method(dialog, 17, ctypes.c_long, wintypes.LPCWSTR)
        show = com_method(dialog, 3, ctypes.c_long, wintypes.HWND)
        get_result = com_method(dialog, 20, ctypes.c_long, ctypes.POINTER(ctypes.c_void_p))

        options = wintypes.DWORD()
        check_hresult(get_options(dialog, ctypes.byref(options)), "IFileDialog.GetOptions")
        options.value |= fos_pickfolders | fos_forcefilesystem | fos_pathmustexist
        check_hresult(set_options(dialog, options), "IFileDialog.SetOptions")
        check_hresult(set_title(dialog, title), "IFileDialog.SetTitle")

        owner_hwnd = find_televault_owner_hwnd()
        bring_window_to_foreground(owner_hwnd)

        hr = show(dialog, wintypes.HWND(owner_hwnd) if owner_hwnd else None)
        if hresult_code(hr) == hresult_cancelled:
            return ""
        check_hresult(hr, "IFileDialog.Show")

        check_hresult(get_result(dialog, ctypes.byref(shell_item)), "IFileDialog.GetResult")
        get_display_name = com_method(shell_item, 5, ctypes.c_long, ctypes.c_uint, ctypes.POINTER(wintypes.LPWSTR))
        check_hresult(
            get_display_name(shell_item, sigdn_filesyspath, ctypes.byref(path_ptr)),
            "IShellItem.GetDisplayName",
        )
        return path_ptr.value or ""
    finally:
        if path_ptr:
            ole32.CoTaskMemFree(path_ptr)
        release_com_object(shell_item)
        release_com_object(dialog)
        if coinitialized:
            ole32.CoUninitialize()


def write_result(output_path: Path, payload: dict) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_suffix(output_path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    tmp_path.replace(output_path)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: windows_folder_picker.py <output-json>", file=sys.stderr)
        return 2

    output_path = Path(argv[1]).expanduser().resolve()
    try:
        write_result(output_path, {"folder": pick_folder()})
        return 0
    except Exception as exc:
        write_result(output_path, {"error": str(exc)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
