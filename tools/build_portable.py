from __future__ import annotations

from pathlib import Path
import shutil


APP_NAME = "TeleVault"
APP_VERSION = "2.7.1"
PACKAGE_NAME = f"{APP_NAME}-v{APP_VERSION}"

ROOT = Path(__file__).resolve().parents[1]
DIST_ROOT = ROOT / "dist"
PACKAGE_ROOT = DIST_ROOT / PACKAGE_NAME

ALLOWLIST_FILES = [
    "app.py",
    "run_windows.bat",
    "README.md",
    "README_RUN.md",
    "CHANGELOG.md",
    "RELEASE_CHECKLIST.md",
    "DEVELOPMENT_LOG.md",
]

ALLOWLIST_DIRS = [
    "backend",
    "frontend",
]

BUNDLED_PYTHON_CANDIDATES = [
    ROOT / "python",
    ROOT / "python-embed",
    ROOT / "python_embedded",
    ROOT / "runtime" / "python",
    ROOT / "vendor" / "python",
]

SKIP_DIR_NAMES = {
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "node_modules",
    "dist",
    "build",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "tmp",
    "temp",
    "backup",
    "backups",
    "synthetic_exports",
    "qa_exports",
    "test_exports",
}

SKIP_FILE_NAMES = {
    "settings.json",
    "Thumbs.db",
    ".DS_Store",
}

SKIP_FILE_SUFFIXES = {
    ".pyc",
    ".pyo",
    ".log",
    ".tmp",
    ".bak",
}


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def ensure_target_is_safe() -> None:
    dist_root = DIST_ROOT.resolve()
    package_root = PACKAGE_ROOT.resolve()
    if package_root == dist_root:
        raise RuntimeError("refusing to delete the dist root")
    try:
        package_root.relative_to(dist_root)
    except ValueError as exc:
        raise RuntimeError(f"unsafe package path: {PACKAGE_ROOT}") from exc


def should_skip_file(path: Path) -> bool:
    return path.name in SKIP_FILE_NAMES or path.suffix.lower() in SKIP_FILE_SUFFIXES


def copy_file(source: Path, destination: Path) -> None:
    if should_skip_file(source):
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    print(f"copied file: {relative(source)}")


def copy_tree(source: Path, destination: Path) -> int:
    copied = 0
    for child in sorted(source.rglob("*")):
        if any(part in SKIP_DIR_NAMES for part in child.relative_to(source).parts[:-1]):
            continue
        if child.is_dir():
            if child.name in SKIP_DIR_NAMES:
                continue
            (destination / child.relative_to(source)).mkdir(parents=True, exist_ok=True)
            continue
        if should_skip_file(child):
            continue
        target = destination / child.relative_to(source)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(child, target)
        copied += 1
    return copied


def find_bundled_python() -> Path | None:
    for candidate in BUNDLED_PYTHON_CANDIDATES:
        if not candidate.is_dir():
            continue
        if (candidate / "python.exe").exists() or (candidate / "pythonw.exe").exists():
            return candidate
    return None


def scan_forbidden_files() -> list[str]:
    issues: list[str] = []
    for path in PACKAGE_ROOT.rglob("*"):
        if path.is_dir() and path.name in SKIP_DIR_NAMES:
            issues.append(path.relative_to(PACKAGE_ROOT).as_posix() + "/")
        elif path.is_file() and should_skip_file(path):
            issues.append(path.relative_to(PACKAGE_ROOT).as_posix())
    return issues


def build() -> int:
    print(f"{APP_NAME} portable package dry run")
    print(f"version: {APP_VERSION}")
    print(f"project root: {ROOT}")
    print(f"portable folder: {PACKAGE_ROOT}")
    print()

    ensure_target_is_safe()
    if PACKAGE_ROOT.exists():
        print(f"cleaning existing portable folder: {PACKAGE_ROOT}")
        shutil.rmtree(PACKAGE_ROOT)

    PACKAGE_ROOT.mkdir(parents=True, exist_ok=True)

    print("copying allowlisted files")
    for item in ALLOWLIST_FILES:
        source = ROOT / item
        if not source.is_file():
            raise FileNotFoundError(f"required file is missing: {item}")
        copy_file(source, PACKAGE_ROOT / item)

    print()
    print("copying allowlisted directories")
    for item in ALLOWLIST_DIRS:
        source = ROOT / item
        if not source.is_dir():
            raise FileNotFoundError(f"required directory is missing: {item}")
        copied = copy_tree(source, PACKAGE_ROOT / item)
        print(f"copied directory: {item}/ ({copied} files)")

    print()
    bundled_python = find_bundled_python()
    if bundled_python:
        destination = PACKAGE_ROOT / bundled_python.relative_to(ROOT)
        copied = copy_tree(bundled_python, destination)
        print(f"bundled Python: found {relative(bundled_python)} and copied {copied} files")
    else:
        print("WARNING: bundled Python was not found inside the TeleVault project.")
        print("This dry-run folder can run only on Windows where `py` or `python` is already installed.")

    issues = scan_forbidden_files()
    if issues:
        print()
        print("ERROR: forbidden files were found in the portable folder:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print()
    print("not copied by design:")
    print("- .git/, __pycache__/, .venv/, venv/, node_modules/, dist/, build/")
    print("- *.pyc, *.log, settings.json, local export folders, screenshots/cache/dev artifacts")

    print()
    print("next manual checks:")
    print("- run python -m py_compile app.py backend/parser.py backend/library.py")
    print("- run python -m py_compile tools/build_portable.py")
    print("- run node --check frontend/app.js")
    print("- open dist/TeleVault-v2.7.1/ and confirm only allowlisted project files are present")
    print("- run dist/TeleVault-v2.7.1/run_windows.bat if Windows Python is available")
    print("- confirm the UI and /api/status show 2.7.1")

    print()
    print(f"done: {PACKAGE_ROOT}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(build())
    except Exception as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
