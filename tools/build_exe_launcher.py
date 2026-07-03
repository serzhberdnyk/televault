from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import importlib.util
import os
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
FRONTEND_INDEX = ROOT / "frontend" / "index.html"
RUN_WINDOWS_BAT = ROOT / "run_windows.bat"
LAUNCHER_SOURCE = ROOT / "tools" / "launcher" / "TeleVaultLauncher.cpp"
LAUNCHER_RESOURCE = ROOT / "tools" / "launcher" / "TeleVaultLauncher.rc"
LAUNCHER_EXE = build_portable.PACKAGE_ROOT / "TeleVault.exe"
PACKAGE_PYTHONW = build_portable.PACKAGE_ROOT / "runtime" / "python" / "pythonw.exe"
ZIP_LAUNCHER_ENTRY = f"{build_portable.PACKAGE_NAME}/TeleVault.exe"
BUILD_ROOT = ROOT / "build" / "launcher"
OBJECT_OUTPUT = BUILD_ROOT / "TeleVaultLauncher.obj"
RESOURCE_OUTPUT = BUILD_ROOT / "TeleVaultLauncher.res"
APP_VERSION_PATTERN = re.compile(r'^APP_VERSION\s*=\s*"([^"]+)"', re.MULTILINE)
FRONTEND_VERSION_PATTERN = re.compile(r'id="version">v([^<]+)<')
RUN_WINDOWS_VERSION_PATTERN = re.compile(r'starting TeleVault v([0-9]+(?:\.[0-9]+)*)')
LAUNCHER_VERSION_PATTERN = re.compile(r'kAppVersion\[\]\s*=\s*L"([^"]+)"')


@dataclass(frozen=True)
class MsvcToolchain:
    mode: str
    vcvarsall: Path | None
    checked: tuple[Path, ...]


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
    versions = {
        "package version": package_version,
        "app.py APP_VERSION": read_version(APP_SOURCE, APP_VERSION_PATTERN, "app"),
        "frontend placeholder": read_version(FRONTEND_INDEX, FRONTEND_VERSION_PATTERN, "frontend"),
        "run_windows.bat startup text": read_version(RUN_WINDOWS_BAT, RUN_WINDOWS_VERSION_PATTERN, "run_windows"),
        "launcher kAppVersion": read_version(LAUNCHER_SOURCE, LAUNCHER_VERSION_PATTERN, "launcher"),
    }

    print("version sync check:")
    for label, version in versions.items():
        print(f"- {label}: {version}")

    mismatches = [
        f"{label} is {version}, expected {package_version}"
        for label, version in versions.items()
        if version != package_version
    ]

    if not mismatches:
        return True

    print()
    print("ERROR: version mismatch between package, backend, frontend, run script and launcher.")
    for mismatch in mismatches:
        print(f"- {mismatch}")
    print("Update app.py, frontend/index.html, run_windows.bat, tools/build_portable.py and tools/launcher/TeleVaultLauncher.cpp together.")
    return False


def find_vswhere() -> Path | None:
    candidates = [
        Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"))
        / "Microsoft Visual Studio"
        / "Installer"
        / "vswhere.exe",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def find_vcvarsall_with_vswhere(checked: list[Path]) -> Path | None:
    vswhere = find_vswhere()
    if vswhere is None:
        checked.append(Path(r"C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"))
        return None

    checked.append(vswhere)
    command = [
        str(vswhere),
        "-latest",
        "-products",
        "*",
        "-requires",
        "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
        "-property",
        "installationPath",
    ]
    result = subprocess.run(command, text=True, capture_output=True)
    install_path = result.stdout.strip()
    if not install_path:
        return None

    vcvarsall = Path(install_path) / "VC" / "Auxiliary" / "Build" / "vcvarsall.bat"
    checked.append(vcvarsall)
    return vcvarsall if vcvarsall.is_file() else None


def find_vcvarsall_known_paths(checked: list[Path]) -> Path | None:
    roots = [
        Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Microsoft Visual Studio" / "2022",
        Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Microsoft Visual Studio" / "2019",
    ]
    editions = ["BuildTools", "Community", "Professional", "Enterprise"]
    for root in roots:
        for edition in editions:
            candidate = root / edition / "VC" / "Auxiliary" / "Build" / "vcvarsall.bat"
            checked.append(candidate)
            if candidate.is_file():
                return candidate
    return None


def find_msvc_toolchain() -> MsvcToolchain:
    checked: list[Path] = []

    cl_path = shutil.which("cl.exe") or shutil.which("cl")
    rc_path = shutil.which("rc.exe") or shutil.which("rc")
    if cl_path:
        checked.append(Path(cl_path))
    if rc_path:
        checked.append(Path(rc_path))
    if cl_path and rc_path:
        return MsvcToolchain("path", None, tuple(checked))

    vcvarsall = find_vcvarsall_with_vswhere(checked)
    if vcvarsall is None:
        vcvarsall = find_vcvarsall_known_paths(checked)
    if vcvarsall is not None:
        return MsvcToolchain("vcvarsall", vcvarsall, tuple(checked))

    return MsvcToolchain("missing", None, tuple(checked))


def print_msvc_blocker(toolchain: MsvcToolchain) -> None:
    print()
    print("ERROR: MSVC C++ build tools were not found; native TeleVault.exe was not created.")
    print("Install Visual Studio Build Tools with the C++ toolchain, then run build_exe_launcher.bat again.")
    if toolchain.checked:
        print("Checked paths:")
        for path in toolchain.checked:
            print(f"- {path}")


def launcher_compile_args(include_resource: bool) -> list[str]:
    args = [
        "cl.exe",
        "/nologo",
        "/std:c++17",
        "/O2",
        "/MT",
        "/EHsc",
        "/DUNICODE",
        "/D_UNICODE",
        "/DWINVER=0x0601",
        "/D_WIN32_WINNT=0x0601",
        f"/Fo{OBJECT_OUTPUT}",
        f"/Fe:{LAUNCHER_EXE}",
        str(LAUNCHER_SOURCE),
    ]
    if include_resource:
        args.append(str(RESOURCE_OUTPUT))
    args.extend(["/link", "/SUBSYSTEM:WINDOWS,6.01"])
    return args


def compile_with_path() -> int:
    BUILD_ROOT.mkdir(parents=True, exist_ok=True)
    include_resource = False

    if LAUNCHER_RESOURCE.is_file():
        print("compiling launcher resources with rc.exe")
        result = subprocess.run([
            "rc.exe",
            "/nologo",
            f"/fo{RESOURCE_OUTPUT}",
            str(LAUNCHER_RESOURCE),
        ], cwd=ROOT)
        if result.returncode != 0:
            print(f"ERROR: rc.exe failed with exit code {result.returncode}")
            return result.returncode
        include_resource = True
    else:
        print("WARNING: launcher resource file not found; TeleVault.exe will be built without the custom icon.")

    print("compiling native launcher with cl.exe")
    result = subprocess.run(launcher_compile_args(include_resource), cwd=ROOT)
    if result.returncode != 0:
        print(f"ERROR: cl.exe failed with exit code {result.returncode}")
    return result.returncode


def quote_batch(path: Path) -> str:
    return f'"{path}"'


def compile_with_vcvarsall(vcvarsall: Path) -> int:
    BUILD_ROOT.mkdir(parents=True, exist_ok=True)
    batch_path = BUILD_ROOT / "compile_launcher.cmd"
    include_resource = LAUNCHER_RESOURCE.is_file()

    lines = [
        "@echo off",
        f"call {quote_batch(vcvarsall)} x64",
        "if errorlevel 1 exit /b %errorlevel%",
    ]
    if include_resource:
        lines.extend([
            "echo compiling launcher resources with rc.exe",
            f'rc.exe /nologo /fo"{RESOURCE_OUTPUT}" "{LAUNCHER_RESOURCE}"',
            "if errorlevel 1 exit /b %errorlevel%",
        ])
    else:
        lines.append("echo WARNING: launcher resource file not found; building without the custom icon.")

    compile_args = launcher_compile_args(include_resource)
    lines.extend([
        "echo compiling native launcher with cl.exe",
        " ".join(f'"{arg}"' if " " in arg or "\\" in arg else arg for arg in compile_args),
        "exit /b %errorlevel%",
        "",
    ])
    batch_path.write_text("\r\n".join(lines), encoding="utf-8")

    result = subprocess.run(["cmd.exe", "/d", "/s", "/c", str(batch_path)], cwd=ROOT)
    if result.returncode != 0:
        print(f"ERROR: native launcher compile failed with exit code {result.returncode}")
    return result.returncode


def compile_launcher(toolchain: MsvcToolchain) -> int:
    if not LAUNCHER_SOURCE.is_file():
        print(f"ERROR: launcher source is missing: {LAUNCHER_SOURCE}")
        return 1

    print()
    print("native launcher build:")
    print(f"- launcher source: {LAUNCHER_SOURCE}")
    print(f"- launcher resource: {LAUNCHER_RESOURCE}")
    print(f"- launcher output: {LAUNCHER_EXE}")
    print("- compiler: MSVC cl.exe")
    print("- runtime: /MT static CRT")
    print("- subsystem: WINDOWS,6.01")

    if toolchain.mode == "path":
        return compile_with_path()
    if toolchain.vcvarsall is None:
        print("ERROR: vcvarsall.bat path is missing")
        return 1
    print(f"- vcvarsall: {toolchain.vcvarsall}")
    return compile_with_vcvarsall(toolchain.vcvarsall)


def verify_zip_contains_launcher(zip_path: Path) -> bool:
    with zipfile.ZipFile(zip_path) as archive:
        names = set(archive.namelist())
    return ZIP_LAUNCHER_ENTRY in names


def verify_package_runtime() -> bool:
    if PACKAGE_PYTHONW.is_file():
        return True
    print()
    print("ERROR: package is missing runtime\\python\\pythonw.exe required by the native launcher.")
    print("Rebuild or restore the bundled Python runtime before creating TeleVault.exe.")
    return False


def build() -> int:
    print("TeleVault native exe launcher build")
    print(f"version: {build_portable.APP_VERSION}")
    print(f"project root: {ROOT}")
    print()
    if not verify_version_sync():
        return 1

    print()
    print("step 1: locating MSVC C++ build tools")
    toolchain = find_msvc_toolchain()
    if toolchain.mode == "missing":
        print_msvc_blocker(toolchain)
        return 1

    print()
    print("step 2: building portable folder and base zip")
    portable_code = build_portable.build()
    if portable_code != 0:
        return portable_code
    if not verify_package_runtime():
        return 1

    print()
    print("step 3: compiling native launcher")
    compile_code = compile_launcher(toolchain)
    if compile_code != 0:
        return compile_code

    if not LAUNCHER_EXE.is_file():
        print(f"ERROR: native compiler completed but output is missing: {LAUNCHER_EXE}")
        return 1

    print()
    print("step 4: rebuilding zip with TeleVault.exe")
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
