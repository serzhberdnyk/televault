# TeleVault: exe packaging plan

TeleVault 2.7.7 does not include a ready exe. This document records the next packaging direction so the project can move from the current portable zip to a Windows exe in a controlled step.

## Goal

The exe phase should make TeleVault easier to start on Windows without changing the current app behavior.

In a future release, the user should get:

- `TeleVault.exe`
- startup by double-clicking `TeleVault.exe`
- no need to install or open Python, Git, or a terminal

## Recommended First Approach

Do not start with a one-file exe. The safest first milestone is a launcher-style exe placed next to the existing app resources.

Expected folder shape:

```text
TeleVault/
- TeleVault.exe
- app.py or packaged app entry
- backend/
- frontend/
- runtime/python/ or embedded runtime
- README_RUN.md
```

The exe should launch the existing portable flow first. The backend, frontend, and runtime can stay as normal folders beside the launcher.

## Why Launcher-Style First

Launcher-style exe is recommended before one-file packaging because it is:

- easier to debug
- less risky for frontend and backend path resolution
- less likely to trigger antivirus false positives than a heavily packed one-file exe
- easier to keep aligned with the current working portable zip flow

This also gives a beginner-friendly release path: first make the existing folder double-clickable through `TeleVault.exe`, then consider deeper packaging.

## Packaging Risks To Check

Before shipping an exe build, verify that:

- the app finds `frontend/` after packaging
- the app finds backend modules after packaging
- the folder picker still works
- startup vault/autoload still works
- `/media` serves files from the selected export correctly
- Range request behavior stays intact: 200, 206, 416, and 403
- `/api/search` still works
- the browser opens automatically
- relative paths do not depend on the current working directory
- bundled runtime files do not get committed to git
- user settings, exports, and caches do not get included in the release package

## Future Milestone

Recommended next milestone:

```text
v2.8.0 - exe launcher preview
```

Goal for that future step:

- add a minimal `TeleVault.exe` launcher
- let the exe start the existing portable flow
- keep `backend/`, `frontend/`, and `runtime/` beside the launcher
- do not add an installer immediately

## Later Options

After the launcher preview is stable, later packaging options can be evaluated:

- single-folder PyInstaller build
- one-file exe
- installer
- desktop shortcut or Start Menu integration

These are future options, not part of 2.7.7.
