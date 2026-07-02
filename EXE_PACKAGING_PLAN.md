# TeleVault: exe packaging plan

TeleVault 2.8.0 added the first Windows `TeleVault.exe` launcher preview. TeleVault 2.8.1 polishes that launcher UX: no visible console window, app-like browser window when Edge/Chrome is available, and `run_windows.bat` remains the debug/fallback launcher.

## Goal

The exe phase should make TeleVault easier to start on Windows without changing the current app behavior.

In 2.8.1, the user should get:

- `TeleVault.exe`
- startup by double-clicking `TeleVault.exe`
- no visible console window during normal exe startup
- an app-like browser window when Microsoft Edge or Google Chrome is available
- normal default-browser fallback when app-mode is not available
- no need to install or open Python, Git, or a terminal

## Current First Approach

Do not start with a one-file exe. The 2.8.x milestone uses a launcher-style exe placed next to the existing app resources.

Expected folder shape:

```text
TeleVault/
- TeleVault.exe
- app.py
- backend/
- frontend/
- runtime/python/
- README_RUN.md
```

The exe launches the existing portable flow through `runtime\python\python.exe app.py`. The backend, frontend, and runtime stay as normal folders beside the launcher.

## Why Launcher-Style First

Launcher-style exe is recommended before one-file packaging because it is:

- easier to debug
- less risky for frontend and backend path resolution
- less likely to trigger antivirus false positives than a heavily packed one-file exe
- easier to keep aligned with the current working portable zip flow

This also gives a beginner-friendly release path: first make the existing folder double-clickable through `TeleVault.exe`, then consider deeper packaging.

## Launcher Risks To Check

Before shipping the launcher preview, verify that:

- `TeleVault.exe` exists in `dist/TeleVault-v2.8.1/`
- the zip contains `TeleVault-v2.8.1/TeleVault.exe`
- the launcher finds `runtime/python/python.exe`, `app.py`, `backend/` and `frontend/` relative to its own folder
- the launcher does not depend on the current working directory
- missing required files produce a readable MessageBox error
- `run_windows.bat` still works as a fallback
- the app finds `frontend/` after packaging
- the app finds backend modules after packaging
- the folder picker still works
- startup vault/autoload still works
- `/media` serves files from the selected export correctly
- Range request behavior stays intact: 200, 206, 416, and 403
- `/api/search` still works
- `TeleVault.exe` opens Edge/Chrome app-mode after the server is ready, or falls back to the default browser
- `run_windows.bat` keeps the existing app auto-browser behavior
- relative paths do not depend on the current working directory
- bundled runtime files do not get committed to git
- user settings, exports, and caches do not get included in the release package

## Later Options

After the launcher preview is stable, later packaging options can be evaluated:

- single-folder PyInstaller build
- one-file exe
- installer
- desktop shortcut or Start Menu integration

These are future options, not part of 2.8.1.
