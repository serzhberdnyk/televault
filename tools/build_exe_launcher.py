from __future__ import annotations

from pathlib import Path
import importlib.util
import re
import shutil
import subprocess
import zipfile


def load_build_portable():
    module_path = Path(__file__).resolve().with_name("build_portable.py")
    spec = importlib.util.spec_from_file_location("build_portable", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load portable builder: {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


build_portable = load_build_portable()


ROOT = Path(__file__).resolve().parents[1]
APP_SOURCE = ROOT / "app.py"
LAUNCHER_SOURCE = ROOT / "tools" / "launcher" / "TeleVaultLauncher.cs"
LAUNCHER_EXE = build_portable.PACKAGE_ROOT / "TeleVault.exe"
ZIP_LAUNCHER_ENTRY = f"{build_portable.PACKAGE_NAME}/TeleVault.exe"
ICON_PATH = ROOT / "assets" / "TeleVault.ico"
APP_VERSION_PATTERN = re.compile(r'^APP_VERSION\s*=\s*"([^"]+)"', re.MULTILINE)
LAUNCHER_VERSION_PATTERN = re.compile(
    r'private\s+const\s+string\s+AppVersion\s*=\s*"([^"]+)"\s*;'
)

CSC_FALLBACK_PATHS = [
    Path(r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"),
    Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"),
]


def find_csc() -> tuple[Path | None, list[Path]]:
    checked: list[Path] = []
    from_path = shutil.which("csc.exe") or shutil.which("csc")
    if from_path:
        path = Path(from_path).resolve()
        checked.append(path)
        if path.is_file():
            return path, checked

    for path in CSC_FALLBACK_PATHS:
        checked.append(path)
        if path.is_file():
            return path, checked

    return None, checked


def print_csc_blocker(checked: list[Path]) -> None:
    print()
    print("ERROR: csc.exe was not found; TeleVault.exe was not created.")
    print("Install .NET Framework build tools or run this on Windows with csc.exe available.")
    print("Checked paths:")
    for path in checked:
        print(f"- {path}")


def read_version(path: Path, pattern: re.Pattern[str], label: str) -> str:
    if not path.is_file():
        raise FileNotFoundError(f"{label} source is missing: {path}")
    text = path.read_text(encoding="utf-8")
    match = pattern.search(text)
    if not match:
        raise RuntimeError(f"could not find {label} version in {path}")
    return match.group(1)


def verify_version_sync() -> bool:
    package_version = build_portable.APP_VERSION
    app_version = read_version(APP_SOURCE, APP_VERSION_PATTERN, "app")
    launcher_version = read_version(LAUNCHER_SOURCE, LAUNCHER_VERSION_PATTERN, "launcher")

    print("version sync check:")
    print(f"- package version: {package_version}")
    print(f"- app.py APP_VERSION: {app_version}")
    print(f"- launcher AppVersion: {launcher_version}")

    mismatches = []
    if app_version != package_version:
        mismatches.append(f"app.py APP_VERSION is {app_version}, expected {package_version}")
    if launcher_version != package_version:
        mismatches.append(f"launcher AppVersion is {launcher_version}, expected {package_version}")

    if not mismatches:
        return True

    print()
    print("ERROR: version mismatch between package, backend and launcher.")
    for mismatch in mismatches:
        print(f"- {mismatch}")
    print("Update app.py, tools/build_portable.py and tools/launcher/TeleVaultLauncher.cs together.")
    return False


def compile_launcher(csc: Path) -> int:
    if not LAUNCHER_SOURCE.is_file():
        print(f"ERROR: launcher source is missing: {LAUNCHER_SOURCE}")
        return 1

    icon_arg = None
    if ICON_PATH.is_file():
        icon_arg = f"/win32icon:{ICON_PATH}"
    else:
        print()
        print("WARNING: custom launcher icon not found: assets/TeleVault.ico")
        print("WARNING: TeleVault.exe will be built with the default Windows executable icon.")

    command = [
        str(csc),
        "/nologo",
        "/target:winexe",
        "/reference:System.dll",
        "/reference:System.Windows.Forms.dll",
        f"/out:{LAUNCHER_EXE}",
        str(LAUNCHER_SOURCE),
    ]
    if icon_arg is not None:
        command.insert(-1, icon_arg)

    print()
    print(f"compiling launcher with: {csc}")
    print(f"launcher source: {LAUNCHER_SOURCE}")
    print(f"launcher output: {LAUNCHER_EXE}")
    if icon_arg is not None:
        print(f"launcher icon: {ICON_PATH}")
        print(f"launcher icon argument: {icon_arg}")

    result = subprocess.run(command, cwd=ROOT)
    if result.returncode != 0:
        print(f"ERROR: csc.exe failed with exit code {result.returncode}")
        return result.returncode

    if not LAUNCHER_EXE.is_file():
        print(f"ERROR: csc.exe completed but output is missing: {LAUNCHER_EXE}")
        return 1

    return 0


def verify_zip_contains_launcher(zip_path: Path) -> bool:
    with zipfile.ZipFile(zip_path) as archive:
        names = set(archive.namelist())
    return ZIP_LAUNCHER_ENTRY in names


def build() -> int:
    print("TeleVault exe launcher build")
    print(f"version: {build_portable.APP_VERSION}")
    print(f"project root: {ROOT}")
    print()
    if not verify_version_sync():
        return 1
    print()
    print("step 1: building portable folder and base zip")

    portable_code = build_portable.build()
    if portable_code != 0:
        return portable_code

    print()
    print("step 2: locating csc.exe")
    csc, checked = find_csc()
    if csc is None:
        print_csc_blocker(checked)
        return 1
    print(f"found csc.exe: {csc}")

    compile_code = compile_launcher(csc)
    if compile_code != 0:
        return compile_code

    print()
    print("step 3: rebuilding zip with TeleVault.exe")
    zip_path = build_portable.create_zip_archive()
    if not verify_zip_contains_launcher(zip_path):
        print(f"ERROR: zip does not contain {ZIP_LAUNCHER_ENTRY}")
        return 1

    print(f"created launcher: {LAUNCHER_EXE}")
    print(f"created zip with launcher: {zip_path}")
    print(f"zip entry verified: {ZIP_LAUNCHER_ENTRY}")
    print()
    print("done")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(build())
    except Exception as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
