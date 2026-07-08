# TeleVault Build Assessment

Historical release snapshot: 2.6.4
Purpose: document the Windows build environment before the first exe prototype.

This document is historical. It is useful for understanding early packaging decisions, but current release checks live in `docs/release/RELEASE_CHECKLIST.md`.

This is an assessment-only patch. It does not build an exe, add an installer, add
dependencies, or change app runtime behavior.

## Current Launch

- Windows entry point: `run_windows.bat`
- Server entry point: `app.py`
- Preferred local URL: `http://127.0.0.1:8766`
- Port behavior: `app.py` tries `8766`; if it is busy, it binds another free local port and prints the actual URL.
- UI opening: `webbrowser.open(url)` opens the user's normal default browser after server startup.
- Embedded webview: not used.
- Server runtime: Python standard library `ThreadingHTTPServer` on `127.0.0.1`.
- Frontend delivery: `app.py` serves static files from `frontend/`.
- Frontend API access: browser `fetch()` calls relative endpoints such as `/api/status`, `/api/startup-vault`, `/api/chat`, `/api/pick-folder`, and `/media/...`.

`run_windows.bat` currently changes to the project folder, runs `py app.py`, and
falls back to `python app.py` if the `py` launcher fails. There is no bundled
Python runtime inside the TeleVault project. During Codex verification, the
bundled Codex Python can be used as a test runtime, but it is not part of the
app release package.

## Runtime Details

- App version source: `APP_VERSION` in `app.py`.
- UI version display: initial placeholder in `frontend/index.html`, then `/api/status` updates it at runtime.
- Folder picker: `POST /api/pick-folder` opens a native `tkinter.filedialog.askdirectory()` dialog from the Python process.
- Startup vault: stored in `%APPDATA%\TeleVault\settings.json` on Windows.
- Startup vault loading: `GET /api/startup-vault` reads `lastVaultPath` and reloads the saved folder if it still exists.
- Library root: selected export folder, or a parent folder containing one or more `result.json` files.
- Media serving: `/media/...` resolves paths inside the loaded library root only and supports Range requests.

## Dependency Assessment

- `requirements.txt`: absent.
- `package.json`: absent.
- External Python dependencies: none found.
- External JavaScript dependencies: none found.
- Frontend assets: plain HTML, CSS, and JavaScript served locally.
- Python modules imported by `app.py` and `backend/`: `http.server`, `pathlib`, `urllib.parse`, `json`, `mimetypes`, `os`, `socket`, `subprocess`, `sys`, `threading`, `webbrowser`, `dataclasses`, `datetime`, `typing`, plus local `backend.library` and `backend.parser`.
- Dynamic Python standard-library module: `tkinter` for the folder picker.

The practical packaging risk is not third-party libraries. It is making sure the
chosen Windows Python runtime includes the standard-library pieces TeleVault
uses, especially `tkinter`/Tcl-Tk for folder selection and `mimetypes` data for
media content types.

## Files To Include In A Future Build

- `app.py`
- `backend/`
- `frontend/index.html`
- `frontend/app.js`
- `frontend/styles.css`
- a production replacement for `run_windows.bat` or a generated launcher
- short user docs if the packaged folder includes documentation
- static frontend assets under `frontend/`

User settings and local data should not be baked into the exe. If a packaged app
needs to preserve startup vault behavior, it should continue reading and writing
`%APPDATA%\TeleVault\settings.json` at runtime.

## Files To Exclude From A Future Build

- Telegram export folders and media
- private user data
- `%APPDATA%\TeleVault\settings.json`
- backup zip files
- `backup/`
- `.git/`
- `__pycache__/`
- synthetic or local test exports
- generated `dist/` or `build/` folders

## Packaging Candidates

### PyInstaller

Pros:
- common first choice for small Python desktop utilities
- can bundle the Python interpreter and standard library into a distributable folder or one-file exe
- likely enough for the current standard-library server plus static frontend files
- easier for a novice to prototype than lower-level runtime packaging

Cons:
- one-file startup can be slower because files are unpacked at launch
- static files must be included explicitly
- `tkinter` and Tcl-Tk assets need verification
- antivirus and SmartScreen warnings are common for unsigned fresh exe builds

Risks:
- `frontend/` files missing from the bundle
- browser opens before the server is ready
- `tkinter` folder picker fails in the packaged runtime
- `/media` Range requests behave differently if paths are resolved incorrectly

Checks:
- launch from the generated folder, not the source tree
- confirm `/api/status`
- confirm folder picker
- confirm startup vault in `%APPDATA%`
- confirm `/media` 200, 206, 416, and 403 cases
- test paths with spaces and Cyrillic characters

### Nuitka

Pros:
- can produce a compiled Windows executable
- may have better performance characteristics after a working build is tuned
- useful if PyInstaller has runtime or antivirus friction

Cons:
- heavier first prototype path
- build time and compiler setup are more complex
- may be harder for a novice to debug
- static files and `tkinter` still need explicit verification

Risks:
- Windows compiler/toolchain setup delays the first exe prototype
- hidden standard-library data files may be missed
- debugging startup failures can take longer than with PyInstaller

Checks:
- confirm build can run on the same machine without source-tree assumptions
- confirm `frontend/` bundling
- confirm folder picker and Tcl-Tk
- confirm media serving with Range headers

### Python Embeddable Runtime With Launcher

Pros:
- keeps the runtime layout explicit and debuggable
- avoids some one-file extraction issues
- can be a useful fallback if exe packagers hide too much

Cons:
- not a true single-file exe
- needs launcher work and careful file layout
- still requires a later installer or zip distribution decision

Risks:
- novice users may find a folder distribution less polished
- Python path setup can be fragile if the layout changes
- `tkinter` availability must be checked because the embeddable distribution may not include it by default

Checks:
- run from a clean copied folder
- confirm no dependency on the source checkout
- confirm folder picker support
- confirm browser launch and local API calls

Historical preliminary recommendation: try PyInstaller first in 2.7.0. The app was a
standard-library Python local server with static frontend files, so PyInstaller
looked like the shortest path to a useful Windows exe prototype. This is no longer
the current release plan; use `docs/release/RELEASE_CHECKLIST.md` for current
packaging checks.

## Risk Checklist

- [ ] local server port is already occupied
- [ ] fallback port is printed and browser opens the actual URL
- [ ] Windows Firewall blocks local server access
- [ ] antivirus or SmartScreen blocks the generated exe
- [ ] Telegram export files are not readable from the packaged process
- [ ] paths with spaces work
- [ ] paths with Cyrillic characters work
- [ ] media files load through `/media`
- [ ] Range requests work in the packaged app
- [ ] invalid Range requests return 416
- [ ] path traversal attempts return 403
- [ ] folder picker works in the packaged app
- [ ] startup vault still reads `%APPDATA%\TeleVault\settings.json`
- [ ] frontend static files are found after packaging
- [ ] default browser does not open automatically
- [ ] large chats remain usable
- [ ] backup/privacy check: user exports are not included in the exe

## Historical Next Step

Historical expected next release target: 2.7.0 - first Windows exe prototype.

Historical 2.7.0 plan:
- choose the first packaging candidate to prototype
- build the first prototype exe
- verify launch on the same machine
- verify launch from a separate folder outside the source checkout
- verify folder picker
- verify `/media`
- verify a real Telegram export

Do not promise a production installer in the first exe prototype. The first goal
is to prove that the packaged runtime can start, open the browser, load exports,
serve media safely, and keep current app behavior intact.
