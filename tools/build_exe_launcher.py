from __future__ import annotations

from pathlib import Path
import importlib.util
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
LAUNCHER_SOURCE = ROOT / "tools" / "launcher" / "TeleVaultLauncher.cs"
LAUNCHER_EXE = build_portable.PACKAGE_ROOT / "TeleVault.exe"
ZIP_LAUNCHER_ENTRY = f"{build_portable.PACKAGE_NAME}/TeleVault.exe"

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


def compile_launcher(csc: Path) -> int:
    if not LAUNCHER_SOURCE.is_file():
        print(f"ERROR: launcher source is missing: {LAUNCHER_SOURCE}")
        return 1

    command = [
        str(csc),
        "/nologo",
        "/target:winexe",
        "/reference:System.dll",
        "/reference:System.Windows.Forms.dll",
        f"/out:{LAUNCHER_EXE}",
        str(LAUNCHER_SOURCE),
    ]

    print()
    print(f"compiling launcher with: {csc}")
    print(f"launcher source: {LAUNCHER_SOURCE}")
    print(f"launcher output: {LAUNCHER_EXE}")

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
