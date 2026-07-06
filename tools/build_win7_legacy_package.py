from __future__ import annotations

from pathlib import Path
import importlib.util
import shutil
import sys
import zipfile


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load module: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


ROOT = Path(__file__).resolve().parents[1]
build_portable = load_module("build_portable", ROOT / "tools" / "build_portable.py")
build_exe_launcher = load_module("build_exe_launcher", ROOT / "tools" / "build_exe_launcher.py")

APP_NAME = build_portable.APP_NAME
APP_VERSION = build_portable.APP_VERSION
PACKAGE_NAME = f"{APP_NAME}-v{APP_VERSION}-win7-legacy-x64"
DIST_ROOT = ROOT / "dist"
PACKAGE_ROOT = DIST_ROOT / PACKAGE_NAME
ZIP_PATH = DIST_ROOT / f"{PACKAGE_NAME}.zip"
WIN7_RUNTIME = ROOT / "runtime" / "python38-win7"
PACKAGE_RUNTIME = PACKAGE_ROOT / "runtime" / "python38-win7"
LEGACY_MARKER = PACKAGE_ROOT / "runtime" / "win7-legacy.txt"
PYTHONW_ENTRY = f"{PACKAGE_NAME}/runtime/python38-win7/pythonw.exe"
LAUNCHER_ENTRY = f"{PACKAGE_NAME}/TeleVault.exe"


def unique(items: list[str]) -> list[str]:
    result: list[str] = []
    for item in items:
        if item not in result:
            result.append(item)
    return result


ALLOWLIST_FILES = unique(build_portable.ALLOWLIST_FILES + [
    "requirements-win7.txt",
])
ALLOWLIST_DIRS = build_portable.ALLOWLIST_DIRS


def ensure_target_is_safe() -> None:
    dist_root = DIST_ROOT.resolve()
    package_root = PACKAGE_ROOT.resolve()
    if package_root == dist_root:
        raise RuntimeError("refusing to delete the dist root")
    try:
        package_root.relative_to(dist_root)
    except ValueError as exc:
        raise RuntimeError(f"unsafe package path: {PACKAGE_ROOT}") from exc
    zip_path = ZIP_PATH.resolve()
    try:
        zip_path.relative_to(dist_root)
    except ValueError as exc:
        raise RuntimeError(f"unsafe zip path: {ZIP_PATH}") from exc
    if zip_path.suffix.lower() != ".zip":
        raise RuntimeError(f"unsafe zip path: {ZIP_PATH}")


def copy_allowlisted_project_files() -> None:
    print("copying allowlisted files")
    for item in ALLOWLIST_FILES:
        source = ROOT / item
        if not source.is_file():
            raise FileNotFoundError(f"required file is missing: {item}")
        build_portable.copy_file(source, PACKAGE_ROOT / item)

    print()
    print("copying allowlisted directories")
    for item in ALLOWLIST_DIRS:
        source = ROOT / item
        if not source.is_dir():
            raise FileNotFoundError(f"required directory is missing: {item}")
        copied = build_portable.copy_tree(source, PACKAGE_ROOT / item)
        print(f"copied directory: {item}/ ({copied} files)")


def copy_win7_runtime() -> None:
    pythonw = WIN7_RUNTIME / "pythonw.exe"
    if not pythonw.is_file():
        raise RuntimeError(
            "Windows 7 legacy runtime is missing. "
            "Run tools\\build_win7_legacy_runtime.ps1 first."
        )

    copied = build_portable.copy_tree(WIN7_RUNTIME, PACKAGE_RUNTIME)
    LEGACY_MARKER.parent.mkdir(parents=True, exist_ok=True)
    LEGACY_MARKER.write_text(
        "TeleVault Windows 7 legacy package marker.\n"
        "Launcher must use runtime/python38-win7/pythonw.exe.\n",
        encoding="ascii",
    )
    print(f"copied Win7 legacy runtime: runtime/python38-win7/ ({copied} files)")


def scan_forbidden_files() -> list[str]:
    issues: list[str] = []
    for path in PACKAGE_ROOT.rglob("*"):
        relative = path.relative_to(PACKAGE_ROOT).as_posix()
        if path.is_dir() and path.name in build_portable.SKIP_DIR_NAMES:
            issues.append(relative + "/")
        elif path.is_file() and build_portable.should_skip_file(path):
            issues.append(relative)
        elif path.is_file() and path.name.lower() == "api-ms-win-core-path-l1-1-0.dll":
            issues.append(relative)
    return issues


def compile_launcher() -> int:
    toolchain = build_exe_launcher.find_msvc_toolchain()
    if toolchain.mode == "missing":
        build_exe_launcher.print_msvc_blocker(toolchain)
        return 1

    build_exe_launcher.BUILD_ROOT = ROOT / "build" / "launcher-win7-legacy"
    build_exe_launcher.OBJECT_OUTPUT = build_exe_launcher.BUILD_ROOT / "TeleVaultLauncher.obj"
    build_exe_launcher.RESOURCE_OUTPUT = build_exe_launcher.BUILD_ROOT / "TeleVaultLauncher.res"
    build_exe_launcher.LAUNCHER_EXE = PACKAGE_ROOT / "TeleVault.exe"
    return build_exe_launcher.compile_launcher(toolchain)


def create_zip_archive() -> Path:
    if ZIP_PATH.exists():
        print(f"cleaning existing legacy zip: {ZIP_PATH}")
        ZIP_PATH.unlink()
    archive = shutil.make_archive(
        str(ZIP_PATH.with_suffix("")),
        "zip",
        root_dir=DIST_ROOT,
        base_dir=PACKAGE_NAME,
    )
    return Path(archive)


def verify_zip(zip_path: Path) -> bool:
    with zipfile.ZipFile(zip_path) as archive:
        names = set(archive.namelist())
    missing = [entry for entry in (PYTHONW_ENTRY, LAUNCHER_ENTRY) if entry not in names]
    if not missing:
        return True
    print("ERROR: legacy zip is missing required entries:")
    for entry in missing:
        print(f"- {entry}")
    return False


def build() -> int:
    print("TeleVault Windows 7 legacy package build")
    print(f"version: {APP_VERSION}")
    print(f"project root: {ROOT}")
    print(f"legacy folder: {PACKAGE_ROOT}")
    print(f"legacy zip: {ZIP_PATH}")
    print()

    if not build_exe_launcher.verify_version_sync():
        return 1

    ensure_target_is_safe()
    if PACKAGE_ROOT.exists():
        print(f"cleaning existing legacy folder: {PACKAGE_ROOT}")
        shutil.rmtree(PACKAGE_ROOT)
    PACKAGE_ROOT.mkdir(parents=True, exist_ok=True)

    copy_allowlisted_project_files()
    print()
    copy_win7_runtime()

    issues = scan_forbidden_files()
    if issues:
        print()
        print("ERROR: forbidden files were found in the legacy package:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print()
    print("compiling launcher for legacy package")
    compile_code = compile_launcher()
    if compile_code != 0:
        return compile_code

    print()
    print("creating legacy zip")
    zip_path = create_zip_archive()
    if not verify_zip(zip_path):
        return 1

    print()
    print("package summary:")
    print(f"- legacy folder: {PACKAGE_ROOT}")
    print(f"- legacy zip: {zip_path}")
    print("- runtime: runtime/python38-win7/pythonw.exe")
    print("- Python: 3.8.10 embeddable x64")
    print("- Windows 7 status: legacy package prepared; requires validation on Windows 7 SP1 x64")
    print()
    print("done")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(build())
    except Exception as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
