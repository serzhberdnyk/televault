# TeleVault: exe packaging plan

TeleVault 2.8.0 added the first Windows `TeleVault.exe` launcher preview. TeleVault 2.9.2 replaced the .NET Framework launcher with a native Windows launcher while keeping the launcher-style portable package. TeleVault 2.9.3 keeps that main package and adds a separate Windows 7 legacy package profile. `run_windows.bat` remains the debug/fallback launcher.

## Goal

The exe phase should make TeleVault easier to start on Windows without changing the current app behavior.

In 2.9.3, the main Windows 10/11 package should provide:

- `TeleVault.exe`
- startup by double-clicking `TeleVault.exe`
- no visible console window during normal exe startup
- an app-like browser window when Microsoft Edge or Google Chrome is available
- normal default-browser fallback when app-mode is not available
- clearer MessageBox errors with technical details in `logs/launcher.log`
- `TeleVault.exe` compiled as a native Windows subsystem executable with the dedicated `assets/TeleVault.ico` icon resource
- no .NET Framework requirement just to start `TeleVault.exe`
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
- assets/
- runtime/python/
- README_RUN.md
```

The exe launches the existing portable flow through `runtime\python\pythonw.exe app.py`. The backend, frontend, and runtime stay as normal folders beside the launcher.

## Why Launcher-Style First

Launcher-style exe is recommended before one-file packaging because it is:

- easier to debug
- less risky for frontend and backend path resolution
- less likely to trigger antivirus false positives than a heavily packed one-file exe
- easier to keep aligned with the current working portable zip flow

This also gives a beginner-friendly release path: first make the existing folder double-clickable through `TeleVault.exe`, then consider deeper packaging.

## Launcher Risks To Check

Before shipping the launcher preview, verify that:

- `TeleVault.exe` exists in `dist/TeleVault-v2.9.3/`
- the zip contains `TeleVault-v2.9.3/TeleVault.exe`
- the launcher finds `runtime/python/pythonw.exe`, `app.py`, `backend/` and `frontend/` relative to its own folder
- the launcher does not depend on the current working directory
- missing required files produce a readable MessageBox error
- `logs/launcher.log` remains runtime troubleshooting output and is not included in git or zip artifacts
- when `assets/TeleVault.ico` exists, the launcher build compiles `tools/launcher/TeleVaultLauncher.rc` through MSVC `rc.exe`
- when `assets/TeleVault.ico` is absent, the launcher build continues and reports that the default executable icon is used
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

Installer and one-file exe remain future options, not part of 2.9.3.
