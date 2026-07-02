from __future__ import annotations

from ctypes import wintypes
from pathlib import Path
import ctypes
import json
import sys
import uuid


TITLE = "выбери папку с telegram export"


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

        hr = show(dialog, None)
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
