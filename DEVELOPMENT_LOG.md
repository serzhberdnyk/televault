# TeleVault development log

TeleVault — local offline archive for Telegram conversations.

Current focus:
- stable opening of Telegram exports
- clean conversation list
- comfortable chat reading
- reliable photo/video/audio/file viewing
- polished minimal desktop-like UI
- later Windows exe packaging

Do:
- improve core stability
- improve reading experience
- improve media viewing
- improve empty states
- improve visual quality

Do not add:
- Timeline
- Insights
- People tab
- tags
- favorites
- notes
- AI
- statistics
- global advanced search
- new major sections

Rule:
Every change should make storing, opening, reading or viewing Telegram exports more convenient or pleasant.

After every future patch:
- update APP_VERSION
- update CHANGELOG.md
- update DEVELOPMENT_LOG.md
- write what changed and what to test manually

## 2.9.4 - unified message meta and missing media cards

Changed:
- added a shared frontend message meta renderer for sender/time so text messages, audio-only messages and media cards use the same class structure
- moved media-card sender/time above the card content to match the normal message block pattern
- removed duplicate inline file-card sender/time because the parent message already owns the shared meta row
- refreshed missing/unavailable media cards with a lighter compact style, softer icon treatment and the local-archive text `файл отсутствует в этом архиве`
- fixed TeleVault.exe relaunch after closing the app window by ignoring unrelated browser windows whose title only contains TeleVault as part of other text
- added a portable instance identity to `/api/status` so TeleVault.exe can refuse a running TeleVault backend from another folder instead of silently focusing that old window
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and CHANGELOG.md to 2.9.4
- kept backend, parser, storage, media endpoints, search, file opening logic, service notices, sticker behavior and media playback logic unchanged

Manual test:
- run `python -m py_compile app.py backend\parser.py backend\library.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm `/api/status` returns 2.9.4
- launch `TeleVault.exe`, close the app window, then launch it again at least 3 times and confirm each relaunch opens TeleVault
- launch old portable TeleVault 2.9.4, then launch a freshly built TeleVault 2.9.4 portable folder and confirm the new copy shows a clear other-folder message instead of focusing the old window
- confirm text message sender/time, audio/voice sender/time and missing media/file card sender/time follow the same visual system
- confirm missing audio/file cards use the compact unavailable style and do not use network-style retry wording
- confirm audio playback, text messages, photos, videos, stickers and service notices still behave normally
- run `git diff --check`

## 2.9.3 - Windows 7 legacy runtime package

Changed:
- added `requirements-win7.txt` for the separate Windows 7 legacy build profile; it is intentionally empty of external dependencies because TeleVault currently uses the Python standard library only
- added `tools\build_win7_legacy_runtime.ps1` to prepare official Python 3.8.10 embeddable x64 under `runtime\python38-win7`
- added `tools\build_win7_legacy_package.py` and `build_win7_legacy_package.bat` to produce `TeleVault-v2.9.3-win7-legacy-x64.zip`
- updated the native launcher to select `runtime\python38-win7\pythonw.exe` only for a generated Win7 legacy package marker, while the main package keeps `runtime\python\pythonw.exe`
- expanded launcher diagnostics with TeleVault version, detected architecture, selected runtime path, pythonw existence and sanitized launch command
- launcher logging now falls back to `%LOCALAPPDATA%\TeleVault\logs\launcher.log` if the app folder is not writable
- added `README_WIN7.md` and updated Windows compatibility documentation without claiming full Windows 7 support
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion`, README.md, README_RUN.md and CHANGELOG.md to 2.9.3
- kept parser logic, media endpoint, frontend behavior, search logic, storage format and the main Windows 10/11 runtime unchanged

Manual test:
- run `python -m py_compile app.py backend\parser.py backend\library.py backend\windows_folder_picker.py`
- run `python -m py_compile tools\build_portable.py tools\build_exe_launcher.py tools\build_win7_legacy_package.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.9.3\TeleVault.exe` and `dist\TeleVault-v2.9.3.zip` are created
- launch with `run_windows.bat` and confirm `/api/status` returns 2.9.3
- run `py -3.8 -m py_compile app.py backend\*.py` when Python 3.8 is available
- run `build_win7_legacy_package.bat` and confirm `dist\TeleVault-v2.9.3-win7-legacy-x64.zip` contains `runtime\python38-win7\pythonw.exe`
- validate the legacy package on Windows 7 SP1 x64 before calling it supported
- run `git diff --check`

Local verification note:
- legacy package prepared; requires validation on Windows 7 SP1 x64

## 2.9.2 - native Windows launcher

Changed:
- replaced the .NET Framework `TeleVault.exe` launcher with a native C++ Win32 launcher in `tools\launcher\TeleVaultLauncher.cpp`
- removed the old C# launcher source from the build path so startup no longer depends on .NET Framework v4.0.30319 just to show the first window
- the native launcher resolves its own folder with `GetModuleFileNameW`, switches to it with `SetCurrentDirectoryW`, checks `app.py` and `runtime\python\pythonw.exe`, starts `pythonw.exe app.py` with `CreateProcessW`, opens the app with Edge/Chrome app mode or `ShellExecuteW`, and reports errors with `MessageBoxW`
- `/api/status` readiness checks now use WinHTTP wide-character APIs against the existing `127.0.0.1:8766` endpoint; no new port or backend route was added
- repeated `TeleVault.exe` launches still reuse the current-version backend and focus/open the existing app instead of starting more Python processes
- the owned-backend lifecycle from the previous launcher is preserved: when the launcher starts the backend, it monitors the app window and stops that backend after the app window closes
- updated `tools\build_exe_launcher.py` to compile the native launcher with MSVC `cl.exe`, `/MT` static CRT, Windows subsystem and the existing TeleVault icon resource
- if MSVC C++ Build Tools are unavailable, the exe builder stops with a clear blocker instead of silently adding another compiler dependency; local verification on this machine hit that blocker because no MSVC/clang/g++ toolchain was installed
- the build now checks version sync across package version, `app.py`, `frontend/index.html`, `run_windows.bat` and launcher `kAppVersion`
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, README.md, README_RUN.md and CHANGELOG.md to 2.9.2
- kept backend logic, parser, media endpoint, startup recovery, frontend behavior, message rendering, media playback, search logic and storage format unchanged
- Windows 7 SP1 remains best effort; the launcher no longer requires .NET Framework, but a working modern browser is still required

Manual test:
- run `node --check frontend/app.js`
- run `runtime\python\python.exe -m py_compile app.py backend\parser.py backend\library.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py tools/build_exe_launcher.py`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.9.2\TeleVault.exe` and `dist\TeleVault-v2.9.2.zip` are created
- launch with `run_windows.bat` and confirm `/api/status` returns 2.9.2
- launch `dist\TeleVault-v2.9.2\TeleVault.exe` from the normal path, from a path with spaces and from a path with Cyrillic characters
- launch `TeleVault.exe` again while the backend is already running and confirm it opens/focuses the app instead of starting more Python processes
- rerun the 2.9.1 startup recovery scenario: clean APPDATA first-run, autoload an existing export, then rename/delete the saved export folder and confirm the missing export state appears
- scan source, dist and extracted zip for local user paths, settings, cache, logs, user_data and saved export paths
- run `git diff --check`

Local verification note:
- source checks and portable packaging can run without MSVC
- native exe compilation, double-click launch checks, repeated-launch checks, and path-with-spaces/Cyrillic launch checks require MSVC C++ Build Tools on the verification machine

## 2.9.1 - missing saved export startup recovery

Changed:
- made startup restore treat a deleted, renamed or unavailable saved export folder as a recoverable missing state instead of a startup failure
- added a small `/api/forget-missing-vault` action that removes only the saved `lastVaultPath` from per-user settings after explicit user action
- moved the non-Windows settings fallback out of the project folder and into per-user config data so selected export paths are not written into source or packaged files
- added a dedicated frontend missing export state with “папка экспорта больше недоступна”, “выберите папку заново”, a choose-folder action and a secondary action to remove the unavailable saved path
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `AppVersion`, README.md, README_RUN.md and CHANGELOG.md to 2.9.1
- kept parser logic, media endpoint security, playback logic, search logic and regular message rendering unchanged

Manual test:
- run fixed-string grep for local user-specific absolute paths and confirm there are no matches
- run fixed-string grep for the local workspace path and confirm there are no matches
- run `node --check frontend/app.js`
- run `runtime\python\python.exe -m py_compile app.py backend\parser.py backend\library.py`
- launch with `run_windows.bat` and confirm `/api/status` returns 2.9.1
- launch with a clean APPDATA and confirm the first-run screen is shown
- load an export, close TeleVault, reopen it and confirm the export autoloads
- load an export, close TeleVault, rename or delete that export folder, reopen it and confirm TeleVault starts with the missing export state
- choose a new export folder from the missing state and confirm the archive loads normally
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.9.1\TeleVault.exe` and `dist\TeleVault-v2.9.1.zip` are created
- scan `dist\TeleVault-v2.9.1` and `dist\TeleVault-v2.9.1.zip` for local user names and workspace paths
- run `git diff --check`

## 2.9.0 - product wording and first-run polish

Changed:
- updated first-run screen copy so TeleVault is presented as a local offline archive for important Telegram conversations
- changed primary archive actions toward `добавить экспорт` while keeping folder selection behavior unchanged
- polished empty states for no selected chat, no messages, no search results and missing media/files
- reduced technical UI wording around viewer/export/json in user-facing states, while keeping folder export terminology where it describes the real Telegram Desktop action
- updated README.md and README_RUN.md for product positioning and simple Windows startup guidance
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `AppVersion` and CHANGELOG.md to 2.9.0
- kept backend routes, parser, storage logic, media endpoint, playback logic, search logic, import/open export logic and security checks unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm `/api/status` returns 2.9.0
- confirm the first-run screen is understandable without a selected export
- open a saved chat and confirm messages still render
- run sidebar/in-chat search and confirm results still open the expected chat/message
- confirm photo, video, audio and file rendering still work
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.9.0\TeleVault.exe` and `dist\TeleVault-v2.9.0.zip` are created
- run `git diff --check`

## 2.8.9 - launcher version sync check

Changed:
- fixed the launcher version mismatch introduced before 2.8.8: `tools\launcher\TeleVaultLauncher.cs` still had `AppVersion = "2.8.7"`, so a freshly built 2.8.8 `TeleVault.exe` compared an already-running 2.8.8 backend against 2.8.7
- updated `AppVersion` in `TeleVaultLauncher.cs` to 2.8.9
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, README.md, README_RUN.md, RELEASE_CHECKLIST.md and CHANGELOG.md to 2.8.9
- added a build-time version sync check in `tools\build_exe_launcher.py`: package version, `app.py APP_VERSION` and launcher `AppVersion` must match before the portable folder or exe is built
- launcher log now writes `launcher version: 2.8.9` at startup for easier diagnosis
- kept TeleVault icon support from 2.8.8, folder picker foreground fix, window state persistence, single-instance/focus behavior, frontend app logic, backend business logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.9\TeleVault.exe` is created and included in the zip
- confirm the build log prints `version sync check` with package, app.py and launcher all at 2.8.9
- confirm the build log still shows `launcher icon argument: /win32icon:...assets\TeleVault.ico`
- launch `dist\TeleVault-v2.8.9\TeleVault.exe` and confirm `/api/status` returns 2.8.9
- launch `TeleVault.exe` again while its window is open and confirm it focuses the existing window without a version mismatch MessageBox
- confirm launcher log does not mention starting or expecting 2.8.7/2.8.8 for the current exe
- confirm a genuinely older TeleVault backend on port 8766 still triggers the version mismatch guard
- confirm folder picker through `TeleVault.exe` still opens above the app window
- resize and move the app window, close it, launch again and confirm size/position are restored
- confirm `run_windows.bat` still works
- confirm `dist\TeleVault-v2.8.9.zip` contains `TeleVault.exe` and does not contain `user_data/` or `logs/`
- run `git status --short` after builder and confirm ignored `dist/`, `logs/` and `user_data/` output is not listed
- run `git diff --check`

## 2.8.8 - app icon and exe branding

Changed:
- added `tools/generate_icon.py`, a Python standard-library icon generator with no Pillow, ImageMagick, Inkscape or other new dependencies
- generated `assets\TeleVault.ico` with 16x16, 32x32, 48x48 and 256x256 icon entries
- generated `frontend\favicon.ico` from the same icon bytes and added a safe `<link rel="icon" href="/favicon.ico">` in `frontend\index.html`
- kept the icon original to TeleVault: dark vault/private archive styling, cyan/blue accent, safe-door shape and letter T; no Telegram logo or third-party brand mark
- updated `tools\build_exe_launcher.py` logging so icon builds show the `/win32icon` argument and missing icon fallback is reported as a warning
- updated `tools\build_portable.py` so `assets/` is included in the portable folder and zip
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, README.md, README_RUN.md, RELEASE_CHECKLIST.md and CHANGELOG.md to 2.8.8
- documented `assets\TeleVault.ico`, icon regeneration, and future packaging boundaries in assets/docs
- kept folder picker foreground fix, window state persistence, single-instance/focus behavior, frontend app logic, backend business logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `runtime\python\python.exe -m py_compile tools/generate_icon.py`
- run `node --check frontend/app.js`
- run `runtime\python\python.exe tools\generate_icon.py` and confirm it creates `assets\TeleVault.ico` and `frontend\favicon.ico`
- confirm `assets\TeleVault.ico` contains 16x16, 32x32, 48x48 and 256x256 entries
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.8\TeleVault.exe` is created and included in the zip
- confirm the build log shows `launcher icon argument: /win32icon:...assets\TeleVault.ico`
- confirm `dist\TeleVault-v2.8.8.zip` contains `TeleVault.exe`, `assets/TeleVault.ico` and `frontend/favicon.ico`
- launch `dist\TeleVault-v2.8.8\TeleVault.exe` and confirm `/api/status` returns 2.8.8
- launch `TeleVault.exe` again while its window is open and confirm the existing window is focused without opening a second app window
- confirm folder picker through `TeleVault.exe` still opens above the app window
- resize and move the app window, close it, launch again and confirm size/position are restored
- confirm `run_windows.bat` still works
- confirm `dist\TeleVault-v2.8.8.zip` does not contain `user_data/` or `logs/`
- run `git status --short` after builder and confirm ignored `dist/`, `logs/` and `user_data/` output is not listed
- run `git diff --check`

## 2.8.7 - launcher window state persistence fix

Changed:
- diagnosed the 2.8.6 launcher state issue: bounds were only saved after the app window disappeared or backend exited, and the existing-backend/no-window branch opened a browser window then exited without a monitor
- launcher now keeps a hidden monitor alive for Edge/Chrome app-mode windows and saves the first valid bounds immediately, then saves changed bounds with a small throttle
- when the app window closes, launcher saves the last valid bounds; if it started the backend itself, it stops only that owned Python process
- if an existing backend is alive but no app window is found, launcher opens one app-mode window with saved bounds and monitors only the window without stopping the external backend
- minimized windows are no longer treated as closed and minimized bounds are not saved as normal window bounds
- Chromium app-mode args are logged and passed as `--app=http://127.0.0.1:8766/`, `--window-size=WIDTH,HEIGHT` and `--window-position=X,Y`
- launcher logs the state file path, missing/existing state file, loaded bounds, saved bounds, fallback reasons and found app-window hwnd/title/process
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, README_RUN.md, RELEASE_CHECKLIST.md and CHANGELOG.md to 2.8.7
- kept folder picker foreground fix, frontend app logic, backend business logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.7\TeleVault.exe` is created and included in the zip
- launch `dist\TeleVault-v2.8.7\TeleVault.exe` and confirm `/api/status` returns 2.8.7
- resize and move the app window, close it, launch again and confirm the size and position are restored
- confirm `user_data\launcher_window.json` is created in the app root and contains current bounds
- launch `TeleVault.exe` again while its window is open and confirm the existing window is focused without resizing
- confirm folder picker through `TeleVault.exe` still opens above the app window and cancel stays neutral
- confirm `run_windows.bat` still works
- confirm `dist\TeleVault-v2.8.7.zip` contains `TeleVault.exe` and does not contain `user_data/` or `logs/`
- run `git status --short` after builder and confirm ignored `dist/`, `logs/` and `user_data/` output is not listed
- run `git diff --check`

## 2.8.6 - launcher window UX fixes

Changed:
- Windows folder picker helper now finds the visible TeleVault Edge/Chrome app window, requests foreground, and passes that HWND as the owner to `IFileDialog.Show`
- `/api/pick-folder` uses the native Windows helper directly on Windows instead of trying tkinter first
- `TeleVault.exe` stores the last app window size, position and maximized state in `user_data\launcher_window.json`
- launcher startup applies saved bounds through Chromium `--window-size` and `--window-position` only when opening a new app window
- repeated launcher clicks still focus an existing app window without forcing its size or opening a second window
- added validation for too-small or off-screen saved bounds and logs fallback decisions to `logs\launcher.log`
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, README_RUN.md, RELEASE_CHECKLIST.md and CHANGELOG.md to 2.8.6
- kept frontend app logic, backend business logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.6\TeleVault.exe` is created and included in the zip
- launch `dist\TeleVault-v2.8.6\TeleVault.exe` and confirm `/api/status` returns 2.8.6
- open folder picker through `TeleVault.exe` and confirm it appears above the TeleVault app window
- cancel folder picker and confirm the UI remains in a neutral non-error state
- resize and move the app window, close it, launch again and confirm the size/position is restored or safely falls back if off-screen
- launch `TeleVault.exe` again while its window is open and confirm the existing window is focused instead of opening a second app window
- confirm `run_windows.bat` still works
- confirm global search and media tabs still work
- confirm `user_data\launcher_window.json`, `logs\launcher.log` and local state are not included in the zip
- run `git status --short` after builder and confirm ignored `dist/`, `logs/` and `user_data/` output is not listed
- run `git diff --check`

## 2.8.5 - exe launcher branding polish

Changed:
- polished `TeleVault.exe` MessageBox errors so missing runtime/app files, occupied ports, version mismatch and startup timeout are easier to understand
- refined launcher log event names for existing-instance checks, version mismatch, window focus, Python startup, server ready/timeout, browser app-mode opening and errors
- kept technical details in `logs\launcher.log` instead of exposing them in the main user-facing error text
- prepared optional Windows icon support: if `assets\TeleVault.ico` exists, `tools\build_exe_launcher.py` passes it to `csc.exe` through `/win32icon`; otherwise the build continues with an info message
- added `assets\README.md` to document where a future final `TeleVault.ico` should be placed
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.8.5
- kept frontend app logic, backend business logic, `/media`, `/api/search`, parser/storage, media classification, folder picker behavior and single-instance/window focus behavior unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.5\TeleVault.exe` is created and included in the zip
- confirm the build does not fail when `assets\TeleVault.ico` is absent and prints that the default executable icon is used
- launch `dist\TeleVault-v2.8.5\TeleVault.exe` and confirm `/api/status` returns 2.8.5
- confirm `TeleVault.exe` starts without a visible console window
- launch `dist\TeleVault-v2.8.5\TeleVault.exe` again while its window is open and confirm the existing window is focused instead of opening a second app window
- confirm folder picker through `TeleVault.exe` still works
- confirm `run_windows.bat` still works
- confirm `dist\TeleVault-v2.8.5.zip` contains `TeleVault.exe`
- confirm `logs\launcher.log` is not included in the zip
- run `git status --short` after builder and confirm ignored `dist/` and `logs/` output is not listed
- run `git diff --check`

## 2.8.4 - exe launcher instance/window guard

Changed:
- `TeleVault.exe` now treats `/api/status` as current only when `name` is `TeleVault` and `version` is `2.8.4`
- if another TeleVault version is already on port 8766, the launcher shows a version mismatch MessageBox and exits without opening the old instance or starting another backend
- if the current 2.8.4 backend is already running, the launcher first tries to focus an existing Edge/Chrome app window titled `TeleVault`
- if the current backend is alive but no app window is found, the launcher opens one new app-like browser window to the existing backend
- occupied-port handling still refuses to start a backend over a non-TeleVault process and does not kill external processes
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.8.4
- kept frontend app logic, backend business logic, `/media`, `/api/search`, parser/storage, media classification and folder picker behavior unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.4\TeleVault.exe` is created and included in the zip
- launch `dist\TeleVault-v2.8.4\TeleVault.exe` and confirm `/api/status` returns 2.8.4
- launch `dist\TeleVault-v2.8.4\TeleVault.exe` again while its window is open and confirm no second backend or app window starts
- close the browser app window while leaving the backend alive, then launch `TeleVault.exe` again and confirm it opens one app window to the existing backend
- with another TeleVault version on port 8766, confirm the launcher shows the version mismatch MessageBox and does not reuse it
- with a non-TeleVault process on port 8766, confirm the launcher shows the occupied-port MessageBox and does not start a backend
- confirm folder picker through `TeleVault.exe` still works
- confirm `run_windows.bat` still works
- confirm global search and media tabs still work
- run `git status --short` after builder and confirm ignored `dist/` and `logs/` output is not listed
- run `git diff --check`

## 2.8.3 - exe launcher repeated launch handling

Changed:
- `TeleVault.exe` now checks `http://127.0.0.1:8766/api/status` before preflight and before starting bundled Python
- if the status endpoint is an existing TeleVault instance, the launcher opens the existing app window and exits without starting another backend
- if port 8766 is occupied by a non-TeleVault process, the launcher shows a clear MessageBox and does not start a second backend blindly
- launcher logging now records existing-instance checks, detected reuse, occupied-port cases and browser launch attempts
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.8.3
- kept frontend app logic, backend business logic, `/media`, `/api/search`, parser/storage, media classification and folder picker behavior unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.3\TeleVault.exe` is created and included in the zip
- launch `dist\TeleVault-v2.8.3\TeleVault.exe` and confirm `/api/status` returns 2.8.3
- launch `dist\TeleVault-v2.8.3\TeleVault.exe` again while the server is already running and confirm no second backend starts
- confirm repeated launch opens an app-like window to the existing server
- confirm folder picker through `TeleVault.exe` still works
- confirm `run_windows.bat` still works
- confirm global search and media tabs still work
- confirm `dist\TeleVault-v2.8.3.zip` contains `TeleVault.exe`
- run `git status --short` after builder and confirm ignored `dist/` and `logs/` output is not listed
- run `git diff --check`

## 2.8.2 - bundled runtime folder picker fix

Changed:
- added a Windows folder picker fallback through a small `pythonw.exe` helper using native `IFileDialog` via `ctypes`
- kept `tkinter` as the first picker path when it is available
- `/api/pick-folder` now returns the existing neutral cancelled response only for real cancel/no selection
- real picker startup failures now return an error response instead of being silently treated as cancel
- added `backend/windows_folder_picker.py` to isolate the Windows native dialog from the HTTP request thread
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.8.2
- kept frontend app logic, `/media`, `/api/search`, parser/storage, media classification and media rendering unchanged

Manual test:
- run `runtime\python\python.exe -c "import tkinter; print('tk ok')"` and record that bundled tkinter is unavailable if it fails
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.2\TeleVault.exe` is created and included in the zip
- launch `dist\TeleVault-v2.8.2\run_windows.bat` and confirm the folder picker opens
- choose a Telegram export folder through `run_windows.bat` and confirm it loads
- cancel the picker through `run_windows.bat` and confirm the UI stays neutral
- launch `dist\TeleVault-v2.8.2\TeleVault.exe` and confirm the folder picker opens
- choose a Telegram export folder through `TeleVault.exe` and confirm it loads
- cancel the picker through `TeleVault.exe` and confirm the UI stays neutral
- confirm startup vault/autoload, global search, media tabs and `/api/status` returning 2.8.2
- run `git status --short` after builder and confirm ignored `dist/` and `logs/` output is not listed
- run `git diff --check`

## 2.8.1 - exe launcher UX polish

Changed:
- rebuilt the launcher flow as a no-console Windows app with MessageBox preflight errors
- launcher now starts bundled `runtime\python\python.exe` with `CreateNoWindow=true` and `TELEVAULT_NO_AUTO_BROWSER=1`
- launcher waits for `/api/status` on the existing local port before opening the UI
- launcher opens Edge/Chrome with `--app=` when available, otherwise falls back to the default browser with a visible notice
- added technical launcher startup logging to `logs\launcher.log`
- updated `tools/build_exe_launcher.py` to compile with `/target:winexe` and Windows Forms references
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.8.1
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm `/api/status` returns 2.8.1
- run `build_portable.bat` and confirm `dist\TeleVault-v2.8.1\` and `dist\TeleVault-v2.8.1.zip` are created
- run `build_exe_launcher.bat` and confirm `dist\TeleVault-v2.8.1\TeleVault.exe` is created and included in the zip
- launch `dist\TeleVault-v2.8.1\TeleVault.exe` and confirm there is no visible console window
- confirm exe launch opens one app-like Edge/Chrome window or default-browser fallback
- confirm `dist\TeleVault-v2.8.1\run_windows.bat` still works
- confirm global search and media tabs still work after exe launch
- run `git status --short` after builder and confirm ignored `dist/` and `logs/` output is not listed
- run `git diff --check`

## 2.8.0 - exe launcher preview

Changed:
- added `tools/launcher/TeleVaultLauncher.cs` as the C# source for the first Windows launcher-style `TeleVault.exe`
- added `tools/build_exe_launcher.py` and `build_exe_launcher.bat` to build the launcher with `csc.exe` after preparing the existing portable folder
- updated `tools/build_portable.py` to version 2.8.0 and included `EXE_PACKAGING_PLAN.md` in the portable docs allowlist
- updated README.md, README_RUN.md, EXE_PACKAGING_PLAN.md and RELEASE_CHECKLIST.md for the 2.8.0 launcher preview
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and CHANGELOG.md to 2.8.0
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `runtime\python\python.exe -m py_compile tools/build_exe_launcher.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm it uses `runtime\python\python.exe`
- confirm `/api/status` returns 2.8.0
- confirm the UI contains v2.8.0
- run `build_portable.bat` without manual PATH changes
- confirm `dist\TeleVault-v2.8.0\` is created
- confirm `dist\TeleVault-v2.8.0.zip` is created
- run `build_exe_launcher.bat` without manual PATH changes
- confirm `dist\TeleVault-v2.8.0\TeleVault.exe` is created
- confirm the exe is included in `dist\TeleVault-v2.8.0.zip`
- launch `dist\TeleVault-v2.8.0\TeleVault.exe` and confirm the app starts through bundled runtime
- launch `dist\TeleVault-v2.8.0\run_windows.bat` and confirm the fallback still works
- confirm global search and media tabs still work after exe launch
- run `git status --short` after builder and confirm ignored `dist/` output is not listed
- run `git diff --check`

## 2.7.7 - exe packaging preparation

Changed:
- added EXE_PACKAGING_PLAN.md to document the future Windows exe launcher phase without implementing exe packaging in this release
- recommended a launcher-style exe beside existing resources before attempting one-file packaging
- documented exe packaging risks around frontend/backend paths, folder picker, startup vault, `/media`, Range requests, `/api/search`, browser startup, relative paths, runtime hygiene and user data hygiene
- updated README.md, README_RUN.md and RELEASE_CHECKLIST.md with the current portable flow and future exe goal
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.7.7
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm it uses `runtime\python\python.exe`
- confirm `/api/status` returns 2.7.7
- confirm the UI contains v2.7.7
- run `build_portable.bat` without manual PATH changes
- confirm `dist\TeleVault-v2.7.7\` is created
- confirm `dist\TeleVault-v2.7.7.zip` is created
- confirm the zip contains top-level `TeleVault-v2.7.7/`
- confirm the zip contains `runtime/python/python.exe` when bundled runtime exists in the source project
- confirm EXE_PACKAGING_PLAN.md does not promise a ready exe in 2.7.7
- confirm README.md and README_RUN.md do not say that exe is ready in 2.7.7
- run `git status --short` after builder and confirm ignored `dist/` output is not listed
- run `git diff --check`

## 2.7.6 - portable zip package

Changed:
- updated `tools/build_portable.py` so the portable builder creates `dist\TeleVault-v2.7.6.zip` after creating the clean portable folder
- made the zip archive from the already prepared `dist\TeleVault-v2.7.6\` folder so it keeps the same allowlisted contents
- kept the top-level `TeleVault-v2.7.6/` folder inside the zip
- updated README_RUN.md and RELEASE_CHECKLIST.md with portable zip instructions and checks
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.7.6
- kept `build_portable.bat` Python selection unchanged: `runtime\python\python.exe`, then `py`, then `python`
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm it uses `runtime\python\python.exe`
- confirm `/api/status` returns 2.7.6
- confirm the UI contains v2.7.6
- run `build_portable.bat` without manual PATH changes
- confirm `dist\TeleVault-v2.7.6\` is created
- confirm `dist\TeleVault-v2.7.6.zip` is created
- confirm the zip contains top-level `TeleVault-v2.7.6/`
- confirm the zip contains `run_windows.bat`, `app.py`, `backend/` and `frontend/`
- confirm the zip contains `runtime/python/python.exe` when bundled runtime exists in the source project
- extract the zip and confirm the extracted copy launches through bundled runtime
- run `git status --short` after builder and confirm ignored `dist/` output is not listed
- run `git diff --check`

## 2.7.5 - portable builder bundled runtime launcher

Changed:
- updated `build_portable.bat` so it first uses `runtime\python\python.exe` when present, then falls back to `py`, then `python`
- made the portable build launcher print which Python runtime it selected
- made the portable build launcher pause and return a clear error when no Python runtime is available or when the builder fails
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.7.5
- kept `tools/build_portable.py` copy logic and allowlists unchanged
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py`
- run `runtime\python\python.exe -m py_compile tools/build_portable.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm it uses `runtime\python\python.exe`
- confirm `/api/status` returns 2.7.5
- confirm the UI contains v2.7.5
- run `build_portable.bat` without manual PATH changes and confirm `dist\TeleVault-v2.7.5\` is created
- confirm `dist\TeleVault-v2.7.5\runtime\python\python.exe` exists
- confirm portable `dist\TeleVault-v2.7.5\run_windows.bat` launches through bundled runtime
- run `git status --short` after builder and confirm ignored `dist/` output is not listed
- run `git diff --check`

## 2.7.4 - bundled runtime import path fix

Changed:
- added an explicit project root insertion to `sys.path` before importing `backend.library`
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and CHANGELOG.md to 2.7.4
- kept run_windows.bat runtime selection, bundled Python `_pth`, backend logic, frontend app logic, `/media`, `/api/search`, parser/storage and media classification unchanged

Manual test:
- run `python -m py_compile app.py backend/parser.py backend/library.py`
- run `python -m py_compile tools/build_portable.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` using `runtime\python\python.exe` and confirm the UI shows v2.7.4
- confirm `/api/status` returns 2.7.4
- run `build_portable.bat` and confirm `dist/TeleVault-v2.7.4/` is created
- confirm portable `dist\TeleVault-v2.7.4\run_windows.bat` launches through bundled runtime
- run `git status --short` after builder and confirm ignored `dist/` output is not listed
- run `git diff --check`

## 2.7.3 - bundled python runtime support

Changed:
- updated `run_windows.bat` so it first uses `runtime\python\python.exe` when present, then falls back to `py`, then `python`
- made the Windows launcher print a clear `python runtime не найден` message when no bundled or system Python runtime is available
- updated `tools/build_portable.py` so it copies `runtime/python/` only when `runtime/python/python.exe` exists
- kept the portable builder allowlist behavior and warning flow when bundled Python is absent
- set the Windows batch launchers to UTF-8 console output so Russian runtime warnings stay readable
- added source-tree notes for placing a local portable Python runtime under `runtime/python/` without committing Python binaries
- updated README_RUN.md and RELEASE_CHECKLIST.md for the 2.7.3 portable runtime behavior
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and CHANGELOG.md to 2.7.3
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage and search/media logic unchanged

Manual test:
- run `python -m py_compile app.py backend/parser.py backend/library.py`
- run `python -m py_compile tools/build_portable.py`
- run `node --check frontend/app.js`
- launch with `run_windows.bat` and confirm the UI shows v2.7.3
- confirm `/api/status` returns 2.7.3
- run `build_portable.bat` and confirm `dist/TeleVault-v2.7.3/` is created
- confirm builder warning appears when `runtime/python/python.exe` is absent
- confirm portable `run_windows.bat` falls back to system `py` or `python` for dev/local use
- run `git status --short` after builder and confirm ignored `dist/` output is not listed
- run `git diff --check`

## 2.7.2 - release artifact git hygiene

Changed:
- updated `.gitignore` so generated release/dev artifacts such as `dist/`, `build/`, Python caches, virtual environments, `node_modules/`, logs, temp/cache/screenshot folders and local settings stay out of git
- documented that portable dry-run output is a rebuildable generated artifact and should not be committed
- updated the portable dry-run version constant so the generated folder is `dist/TeleVault-v2.7.2/`
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and CHANGELOG.md to 2.7.2
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage, search/media logic and release builder copy logic unchanged

Manual test:
- run `python -m py_compile app.py backend/parser.py backend/library.py`
- run `python -m py_compile tools/build_portable.py`
- run `node --check frontend/app.js`
- launch with run_windows.bat and confirm the UI shows v2.7.2
- confirm /api/status returns 2.7.2
- run `build_portable.bat` and confirm `dist/` is created but does not appear as untracked in `git status --short`
- run `git diff --check`

## 2.7.1 - portable package dry run

Changed:
- added `tools/build_portable.py` as an allowlist-based dry-run builder for `dist/TeleVault-v2.7.1/`
- added `build_portable.bat` as a Windows convenience wrapper for the builder
- copied only app/runtime docs and source folders needed for the portable dry run: `app.py`, `run_windows.bat`, `backend/`, `frontend/`, `README.md`, `README_RUN.md`, `CHANGELOG.md`, `RELEASE_CHECKLIST.md` and `DEVELOPMENT_LOG.md`
- kept `.git/`, caches, virtual environments, `node_modules/`, generated `dist/`/`build/`, logs, local exports, screenshots/cache/dev artifacts and user settings out of the portable folder by allowlist
- documented that bundled Python is not present inside the current project, so the dry-run folder needs an existing Windows `py` or `python` command unless a bundled runtime is added later
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and CHANGELOG.md to 2.7.1
- kept frontend app logic, backend logic, `/media`, `/api/search`, parser/storage, media classification and media/search rendering unchanged

Manual test:
- run `python -m py_compile app.py backend/parser.py backend/library.py`
- run `python -m py_compile tools/build_portable.py`
- run `node --check frontend/app.js`
- launch with run_windows.bat and confirm the UI shows v2.7.1
- confirm /api/status returns 2.7.1
- run `python tools/build_portable.py` and confirm `dist/TeleVault-v2.7.1/` is created
- confirm the portable folder does not contain `.git/`, `__pycache__/`, `.venv/`, `venv/`, `node_modules/`, old export folders, cache/dev artifacts, logs or user settings
- run `dist\TeleVault-v2.7.1\run_windows.bat` if Windows Python is available
- run `git diff --check`

## 2.7.0 - windows release preparation baseline

Changed:
- added RELEASE_CHECKLIST.md to document the expected Windows/portable package contents and release checks before packaging work begins
- documented the future portable folder shape while keeping the current source-tree launch path unchanged
- clarified README_RUN.md that the current supported launch path is still `run_windows.bat`
- updated README.md to mark 2.7.x as the Windows-version preparation branch without promising a ready exe
- updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and CHANGELOG.md to 2.7.0
- kept frontend behavior, backend logic, `/media`, `/api/search`, parser/storage, media classification and media rendering unchanged

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.7.0
- confirm /api/status returns 2.7.0
- confirm startup vault autoloads when the saved export path is available
- confirm media tabs still switch between all/photo/video/audio/sticker/file
- confirm global sidebar search still works for chats and messages
- confirm /media still serves available media and keeps existing range/security behavior
- confirm README.md, README_RUN.md and RELEASE_CHECKLIST.md do not promise a ready exe
- confirm README.md and README_RUN.md do not bring back manual path input or the old load button
- confirm browser console warnings/errors are absent or explained

## 2.6.18 - release readiness docs cleanup

Changed:
- refreshed README.md to describe the current folder picker, multi-result export loading, chat list, message viewer, media tabs, global sidebar search, in-chat search jump behavior and startup vault autoload
- clarified README_RUN.md for normal Windows double-click startup through run_windows.bat
- prepared release notes for the next Windows app packaging phase without adding packaging or exe build work
- updated APP_VERSION, frontend version placeholder and run_windows.bat startup text to 2.6.18
- kept frontend behavior, backend logic, `/media`, search logic, parser/storage, media classification and media tabs unchanged

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.18
- confirm /api/status returns 2.6.18
- confirm README.md and README_RUN.md match the current folder picker workflow
- confirm README.md does not promise unfinished Windows exe packaging
- confirm browser console warnings/errors are absent or explained

## 2.6.17 - global search stability polish

Changed:
- kept the existing 220ms global message search debounce and reused it for the sidebar search flow
- added active `/api/search` cancellation with `AbortController` when the sidebar query changes or search is cleared
- tightened stale response protection so global message results are applied only when the request token and current sidebar query still match
- made the global message loading state compact with "ищу..." and kept "ничего не найдено" hidden until the current search finishes
- changed the global message search error state to the compact "поиск временно недоступен" message
- kept chat title search, global result click-to-open, jump highlight, in-chat search, media tabs, audio-only rendering and sticker/file separation unchanged
- kept backend parser/storage and `/media` unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.17
- confirm /api/status returns 2.6.17
- type quickly in sidebar search and confirm stale message results do not overwrite the current query
- confirm "ищу..." appears only for the active sidebar search and "ничего не найдено" waits until the active search finishes
- global search for "лол" and confirm message cards still show highlighted snippets
- click a global result and confirm the original chat opens, the full conversation is shown, the message is centered and briefly highlighted
- confirm in-chat search still filters messages and keeps click-to-jump behavior
- confirm photo, video, audio, sticker and file media tabs still render normally
- confirm files and stickers remain separated as in 2.6.12
- confirm browser console warnings/errors are absent or explained

## 2.6.16 - global search result polish

Changed:
- changed global search message cards to a snippet-first layout with compact metadata underneath
- reduced repeated chat/sender metadata by omitting the chat title when it matches the sender
- added soft, escaped query highlighting inside global search snippets
- added a small sidebar hint when the global search response reaches the configured 50 result limit
- kept the 2.6.15 `/api/search` endpoint unchanged
- kept global result click-to-open, jump highlight, in-chat search, media tabs, audio-only rendering and sticker/file separation unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.16
- confirm /api/status returns 2.6.16
- global search for "лол" and confirm message cards show the snippet first
- confirm matching "лол" text is softly highlighted in snippets regardless of case
- confirm chat title and sender are not duplicated when they are the same visual label
- confirm a 50-result global search shows "показаны первые 50 результатов, уточни запрос"
- click a global result and confirm the original chat opens, the full conversation is shown, the message is centered and briefly highlighted
- confirm in-chat search still filters messages and keeps click-to-jump behavior
- confirm photo, video, audio, sticker and file media tabs still render normally
- confirm files and stickers remain separated as in 2.6.12
- confirm browser console warnings/errors are absent or explained

## 2.6.15 - global message search v1

Changed:
- added a minimal `/api/search?q=...&limit=50` endpoint that searches loaded messages in the currently opened export
- kept sidebar chat title search intact and added compact message result cards under the same sidebar search input
- global message results open the original chat, clear sidebar search, reset in-chat filters, render the full conversation and reuse the existing jump highlight
- kept in-chat search, media tabs, audio-only rendering, sticker/file separation, parser, storage format and `/media` unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.15
- confirm /api/status returns 2.6.15
- search the sidebar by chat title and confirm conversation matches still appear
- search the sidebar by a word that exists only inside messages and confirm message results appear instead of "ничего не найдено"
- click a global message result and confirm the original chat opens, the full conversation is shown, the message is centered and briefly highlighted
- confirm in-chat search inside the selected conversation still filters messages and click-to-jump behavior still works
- confirm photo, video, audio, sticker and file media tabs still render normally
- confirm audio-only messages, stickers and files keep the behavior from 2.6.8-2.6.12
- confirm browser console warnings/errors are absent or explained

## 2.6.14 - search result polish

Changed:
- added a subtle hover state for clickable in-chat search result messages
- added a compact search hint on the existing filter bar when an active in-chat search has results in the regular conversation view
- polished the jump highlight with softer dark-theme colors and smoother fade-out transitions
- kept the 2.6.13 search result jump behavior unchanged, including ignored clicks from links, buttons, photo triggers and native audio/video controls
- kept audio-only layout, media spacing, compact Audio tab, sticker cleanup, sticker tab, backend parsing, storage, `/media`, Range handling and media classification unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.14
- confirm /api/status returns 2.6.14
- search inside a selected chat and confirm matching messages appear with a clear pointer/hover state
- confirm the search hint appears only when the search query is active and results are visible in the regular conversation view
- click a text search result and confirm search clears, the full conversation opens and the original message is centered
- confirm the jumped message highlight appears, reads well in the dark theme and fades out smoothly without moving layout
- click a link inside a search result and confirm it remains a normal link action
- click native audio/video controls or photo triggers inside a search result and confirm they do not trigger jump
- confirm audio-only messages still render without an outer bubble
- confirm photo, video, audio, file and sticker media tabs still render normally
- confirm sticker and file tabs from 2.6.12 still separate stickers from regular files
- confirm browser console warnings/errors are absent or explained

## 2.6.13 - click search result to jump

Changed:
- added stable `data-message-id` attributes to rendered conversation message elements
- made active in-chat search results clickable in the regular conversation view
- clicking a search result clears search, sender and media filters, rerenders the full conversation, scrolls to the original message and highlights it briefly
- ignored clicks from links, buttons, photo triggers and native audio/video controls inside search results
- kept backend parsing, storage, `/media`, Range handling, media classification and media tab rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.13
- confirm /api/status returns 2.6.13
- search inside a selected chat and confirm matching messages appear
- click a text search result and confirm search clears, the full conversation opens and the original message is centered
- confirm the jumped message is briefly highlighted
- click a link inside a search result and confirm it remains a normal link action
- click native audio/video controls inside a search result and confirm they do not trigger jump
- confirm audio-only messages still render without an outer bubble
- confirm sticker and file tabs from 2.6.12 still separate stickers from regular files
- confirm photo, video, audio, file and sticker media tabs still render normally
- confirm browser console warnings/errors are absent or explained

## 2.6.12 - sticker media tab cleanup

Changed:
- added a dedicated `sticker` media tab next to Audio and Files
- reused the existing `isSticker(msg)` detection for sticker tab filtering
- removed all sticker media from the Files tab by excluding `isSticker(msg)` there
- kept stickers visible in the All tab and preserved the 2.6.11 sticker-first layout
- left photo, video, audio and regular file rendering paths unchanged
- kept `.tgs` stickers as lightweight non-animated sticker fallback previews without adding Lottie or new dependencies
- left backend parsing, storage format, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.12
- confirm /api/status returns 2.6.12
- confirm the media tabs include "стикеры"
- open a chat with `.tgs`, `.webp` or `.webm` stickers and confirm they appear in the Stickers tab
- confirm sticker media no longer appears in the Files tab
- confirm stickers remain visible in the All tab
- confirm the Files tab still shows ordinary files and document-like attachments
- confirm photo, video and audio tabs still render normally
- confirm the 2.6.11 sticker-first fallback does not show `AnimatedSticker.tgs` as primary text
- confirm browser console warnings/errors are absent or explained

## 2.6.11 - media chrome cleanup

Changed:
- removed the visible audio filename label from Audio media tab items so sender/time and the native audio player remain the primary content
- kept the scoped `media-item--audio-compact` layout from 2.6.10 for Audio media tab items
- changed audio-only sender/time metadata to a transparent compact row shared by incoming and outgoing messages
- preserved the 2.6.8 audio-only no-outer-bubble layout and kept audio + text messages on the regular bubble path
- changed sticker fallback rendering to a sticker-first preview/placeholder with only a small secondary original link when available
- stopped showing technical sticker filenames as the primary animated sticker fallback content
- kept native audio controls, lazy audio metadata loading and single active regular media playback unchanged
- left backend parsing, storage format, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.11
- confirm /api/status returns 2.6.11
- open the Audio media tab and confirm audio items do not show technical filenames as primary text
- confirm Audio tab sender/time metadata remains visible and native audio players stay horizontal and responsive
- confirm file cards in the Files tab still show filenames and open actions
- confirm incoming and outgoing audio-only messages use the same compact sender/time style
- confirm audio-only messages still do not have an outer bubble
- confirm audio + text messages still use the normal message bubble
- confirm animated `.tgs` stickers use the lighter sticker-first fallback and do not show the technical filename as primary content
- confirm photo, video and file tabs still render normally
- confirm browser console warnings/errors are absent or explained

## 2.6.10 - audio tab compact layout

Changed:
- added a scoped `media-item--audio-compact` modifier for Audio media tab items
- removed the heavy outer media-card background, border, padding and shadow only for Audio tab items
- made Audio tab audio bodies transparent so the native audio player remains the main visual block
- kept filename/open-original links, sender/time metadata and optional captions visible
- preserved the 2.6.8 chat audio-only no-outer-bubble layout
- preserved the 2.6.9 regular media spacing for chat media and non-audio media tabs
- kept native audio controls, lazy audio metadata loading and single active regular media playback unchanged
- left backend parsing, storage format, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.10
- confirm /api/status returns 2.6.10
- open the Audio media tab and confirm audio items no longer show a large rectangular outer card
- confirm the native audio player stays horizontal, responsive and does not overflow on desktop or narrow viewports
- confirm filename/open-original links work when an audio item has a file name or media URL
- confirm sender/time metadata remains visible
- start audio after audio to confirm single active regular media playback still works
- confirm photo, video, file and sticker tabs still use their existing card layouts
- confirm chat audio-only messages still use the 2.6.8 compact no-outer-bubble layout
- confirm audio + text messages in the regular chat feed still use the normal message bubble
- confirm browser console warnings/errors are absent or explained

## 2.6.9 - media message spacing polish

Changed:
- reduced the extra vertical gap before inline media inside regular conversation bubbles
- slightly tightened media bubble padding and media-card wrapper spacing for photo, video, audio, file and sticker messages
- kept audio-only messages on the 2.6.8 no-outer-bubble path with compact sender/time above the native audio player
- kept audio + text messages on the regular conversation bubble path
- kept native audio controls, lazy audio metadata loading and single active regular media playback unchanged
- preserved the responsive audio width fix from 2.6.5 so audio controls stay horizontal and do not overflow
- left backend parsing, storage format, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.9
- confirm /api/status returns 2.6.9
- confirm startup vault autoloads when the saved export path is available
- open a chat with photo, video, audio, file and sticker messages and confirm media spacing feels consistent
- confirm audio-only messages still show compact sender/time followed directly by the rounded native audio player without an outer rectangular bubble
- confirm audio + text messages still use the regular message bubble and keep readable text/caption spacing
- confirm audio controls stay horizontal, do not collapse into a vertical capsule and do not overflow on desktop or narrow viewports
- confirm photo lightbox, video playback, stickers and files/media tabs still work
- confirm date separators, service notices, storage status and sidebar still work
- confirm manual path input and the old load button did not return
- confirm browser console warnings/errors are absent or explained

## 2.6.8 - audio-only bubble removal

Changed:
- added an `audio-only` conversation message modifier for pure audio/voice messages without text
- removed the regular outer conversation bubble background, border and padding for pure audio/voice messages
- kept sender/time as a compact metadata row above the native audio player
- kept audio + text messages on the regular conversation bubble path
- kept the native audio element, `preload="none"` and lazy audio metadata loading unchanged
- kept single active regular media playback unchanged
- preserved the responsive audio width fix from 2.6.5 so audio controls stay horizontal and do not overflow
- left backend parsing, storage format, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.8
- confirm /api/status returns 2.6.8
- confirm startup vault autoloads when the saved export path is available
- open a chat with voice/audio messages and confirm audio-only messages show sender/time followed directly by the rounded native audio player
- confirm audio-only messages no longer show the rectangular outer message bubble
- confirm audio controls stay horizontal, do not collapse into a vertical capsule and do not overflow on desktop or narrow viewports
- confirm audio + text messages still use the regular message bubble and keep their text
- start audio after audio, audio after video and video after audio to confirm only one regular media player continues playing
- confirm date separators, incoming/outgoing alignment, service notices, photo lightbox, video playback, stickers, files/media tabs, storage status and sidebar still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work
- confirm browser console warnings/errors are absent or explained

## 2.6.7 - storage status cancel polish

Changed:
- removed the repeated export folder name from the opened sidebar storage status, leaving the status title and full path
- made folder picker cancellation explicit in `/api/pick-folder` with a neutral `cancelled` response
- kept an already opened export visually stable when folder selection is cancelled
- kept cancellation without an opened export on the neutral "экспорт не выбран" state instead of an error
- kept true folder/export loading failures on the existing error path
- kept folder picker, startup vault autoload, chat list, chat search, chat opening, service notices, media rendering and `/media` behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder, run_windows.bat startup text and current-version README notes

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.7
- confirm /api/status returns 2.6.7
- confirm startup vault autoloads when the saved export path is available
- confirm an opened export shows "экспорт открыт" and the path without a separate folder-name line
- confirm chat/message/status chips did not return in the opened sidebar storage block
- cancel folder selection with an opened export and confirm the current path, conversation list and selected chat stay intact
- cancel folder selection without an opened export and confirm the sidebar remains neutral, not red
- confirm true invalid-folder/export errors still show the error state
- confirm the folder picker still works and manual path input plus the old load button did not return
- confirm the conversation list, conversation search and chat opening still work
- confirm service notices, photo lightbox, video/audio/stickers/files and single active media playback still work
- confirm /media 200/206/416/403 and path traversal protection still work
- confirm browser console warnings/errors are absent or explained

## 2.6.6 - sidebar storage status cleanup

Changed:
- renamed the sidebar folder action to "выбрать папку экспорта"
- changed the opened storage title from "хранилище открыто" to "экспорт открыт"
- kept the opened status compact: status title, export folder name and full path
- removed chat count, message count and "готово" chips from the opened sidebar storage block
- reduced repeated "хранилище" wording in nearby sidebar loading, empty and error copy
- kept the folder picker, startup vault autoload, chat list, chat search, media rendering, service notices, backend storage data and `/media` behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder, run_windows.bat startup text and current-version README notes

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.6
- confirm /api/status returns 2.6.6
- confirm startup vault autoloads when the saved export path is available
- confirm the sidebar action says "выбрать папку экспорта" and still opens the system folder picker
- confirm an opened export shows compact status with "экспорт открыт", the folder name and the path
- confirm the sidebar storage status no longer shows chat count, message count or "готово" chips
- confirm the word "хранилище" no longer repeats several times in a row in the sidebar
- confirm the conversation list, conversation search and chat opening still work
- confirm service notices, photo lightbox, video/audio/stickers/files and single active media playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work
- confirm browser console warnings/errors are absent or explained

## 2.6.5 - voice audio layout fix

Changed:
- gave inline voice/audio cards a definite responsive width so native browser audio controls do not shrink to their minimum vertical capsule
- kept audio cards capped at the existing 430px visual width and allowed them to shrink on narrow viewports without horizontal overflow
- kept the native audio element, `preload="none"` and lazy audio metadata loading unchanged
- kept single active regular media playback unchanged; sticker `.webm` previews remain excluded from that logic
- left frontend audio markup, backend parsing, `/media`, Range handling, URL encoding, security checks and storage format unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.5
- confirm /api/status returns 2.6.5
- confirm startup vault autoloads when the saved export path is available
- open a chat with Telegram voice messages and confirm each voice message renders as a usable horizontal audio player
- confirm audio controls do not collapse into a narrow vertical block and do not overflow the message bubble on desktop or narrow viewports
- confirm audio starts, pauses, shows metadata/duration after lazy metadata loading and still shows the missing-audio fallback when needed
- start audio after audio, audio after video and video after audio to confirm only one regular media player continues playing
- confirm date separators, incoming/outgoing alignment, create_channel/photo update/pinned service notices, photo lightbox, video poster/playback/seeking, stickers, files/media tabs, empty states and storage status still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work
- confirm browser console warnings/errors are absent or explained

## 2.6.4 - Windows build environment assessment

Changed:
- added BUILD_ASSESSMENT.md as the focused assessment for future Windows exe packaging
- documented the current `run_windows.bat` launch path, local server, default browser UI, folder picker, startup vault settings and frontend static files
- documented that the project currently has no bundled Python runtime, `requirements.txt` or `package.json`
- documented the current Python imports and that the runtime uses the Python standard library plus local backend modules
- documented files to include and exclude from a future build
- documented PyInstaller, Nuitka and Python embeddable runtime candidates with risks and checks
- added the 2.7.0 first Windows exe prototype as the next build step
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text
- kept app startup behavior, port logic, folder picker, `/media`, parser, storage format and frontend rendering unchanged

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.4
- confirm /api/status returns 2.6.4
- confirm startup vault autoloads when the saved export path is available
- confirm the sidebar shows the conversation list and conversation search works
- confirm a chat opens by click
- confirm create_channel, photo update and pinned service notices still render correctly
- confirm date separators, photo lightbox, video poster/duration/playback, audio cards, stickers, files/media tabs and single active media playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work
- confirm browser console warnings/errors are absent or explained

## 2.6.3 - sidebar controls cleanup

Changed:
- removed the visible chat sort dropdown from the sidebar
- kept the existing chat sorting helper and newest-first default as the internal sidebar order
- kept conversation search visible and tightened the sidebar search-to-list spacing
- kept storage status, folder picker, chat opening, service notices, media rendering and `/media` behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.3
- confirm /api/status returns 2.6.3
- confirm startup vault autoloads when the saved export path is available
- confirm the sidebar shows storage status and the "добавить в хранилище" action
- confirm conversation search is visible, returns matches, shows the empty state with no matches, and restores the full list when cleared
- confirm the chat sort dropdown is no longer visible and no empty space is left in its place
- confirm the conversation list remains newest-first and opens chats by click
- confirm create_channel, photo update and pinned service notices still render correctly
- confirm date separators, photo lightbox, video, audio, stickers, files/media tabs and single active media playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.6.2 - channel photo service message rendering

Changed:
- added targeted parser support for Telegram photo update service events
- confirmed the NOT BAND! export uses `action: edit_group_photo` for the 2025-01-09 channel photo update event
- preserved the real `service_action` while rendering `service_text: Фотография канала обновлена` when `actor_id` identifies a channel
- reused existing photo/media URL fields so available service photos can render through the existing `/media` path
- rendered photo update service events as compact centered notices with an optional circular preview
- kept photo update service events out of photo/video/audio/file media cards because they remain system events
- kept `create_channel`, `pin_message`, regular media rendering, `/media`, Range handling, URL encoding, security checks and storage format unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.2
- confirm /api/status returns 2.6.2
- confirm startup vault autoloads when the saved export path is available
- open NOT BAND! around 9 January 2025 and confirm the photo update event shows "Фотография канала обновлена" instead of generic "системное событие Telegram"
- confirm the event shows a circular preview when `photos/photo_8@09-01-2025_10-16-15.jpg` is available
- confirm a missing service photo leaves the text notice visible without a broken image
- confirm create_channel and pinned service notices still render correctly
- confirm date separators, chat search, media tabs, regular messages, incoming/outgoing alignment, stickers, photo lightbox, video playback, audio cards, files and single active playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.6.1 - empty Telegram service messages fix

Changed:
- added explicit parser metadata for Telegram service events without regular text
- preserved the real `create_channel` action from the NOT BAND! export as `service_kind: create_channel`
- rendered channel/chat creation and unknown empty service events as compact centered system notices
- kept pinned service notices on the existing `pin_message` path
- kept `/media`, Range handling, URL encoding, security checks, storage format and media rendering paths unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.1
- confirm /api/status returns 2.6.1
- confirm startup vault autoloads when the saved export path is available
- open NOT BAND! around 11 October 2024 and confirm the `create_channel` service event is a compact system notice, not an empty bubble
- confirm pinned service notices still render as compact centered notices
- confirm date separators, regular text messages, incoming/outgoing alignment, chat search and media tabs still work
- confirm stickers, photo lightbox, video poster/duration/playback, audio cards, files and single active playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.6.0 - Windows release preparation notes

Changed:
- updated README.md as a short product overview for the local desktop app
- updated README_RUN.md with the current Windows startup flow and v2.6.0
- added PROJECT_STRUCTURE.md as a short map of the main project files
- added BUILD_NOTES.md with preparation notes for future Windows exe packaging
- documented that 2.6.0 does not build an exe, add an installer or add dependencies
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.0
- confirm /api/status returns 2.6.0
- confirm startup vault autoloads when the saved export path is available
- confirm conversation list, chat search/sort, chat click, date separators, empty states and storage status still work
- confirm stickers, photo lightbox, video poster/duration/playback, audio cards, pinned service notices and single active playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.27 - native video duration metadata fix

Changed:
- removed the separate video duration badge UI and its frontend formatting helpers/styles
- added lazy metadata loading for regular native video elements using the same cautious pattern as audio metadata loading
- kept rendered regular videos lightweight with `preload="none"` until a video is visible/nearby, hovered, focused or played
- excluded Telegram sticker videos from regular video metadata loading by leaving them on the sticker render path and reusing regular-media checks
- kept regular video poster/thumbnail selection, playback, seeking, width clamp and media fallback behavior unchanged
- kept audio lazy metadata from 2.5.24 unchanged
- left backend parsing, `/media`, Range handling, URL encoding, security checks, storage format and performance cache unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.27
- confirm /api/status returns 2.5.27
- open regular videos and confirm there is no separate duration badge over the preview
- confirm visible/nearby regular videos switch from `preload="none"` to `preload="metadata"` lazily and native controls can show duration after metadata loads
- confirm a big video tab does not set metadata preload on every video at once
- confirm regular video poster, playback, seeking and 206 Partial Content still behave normally
- confirm `.webm` stickers still autoplay loop muted without controls and do not use regular video lazy metadata
- confirm `.webp` stickers, `.tgs` fallback, photo lightbox, audio cards, files, pinned service notices and single active playback still work
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.26 - video duration badge

Changed:
- added a compact frontend duration badge for regular video previews when Telegram export metadata provides `duration_seconds`
- kept the existing parser data shape because `duration_seconds` was already passed through from Telegram export messages
- kept regular video playback, seeking, `preload="none"` and poster selection unchanged
- kept sticker rendering unchanged, including `.webm` Telegram stickers as autoplay loop muted videos without controls
- left `/media`, Range handling, URL encoding, security checks, storage format and performance cache unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.26
- confirm /api/status returns 2.5.26
- open a regular video with `duration_seconds` and confirm a small dark duration badge appears over the preview
- confirm videos without duration do not show a false 0:00 badge
- confirm video poster, playback, seeking, bubble width clamp and media fallbacks still behave normally
- confirm `.webm` stickers, `.webp` stickers, `.tgs` fallback, photo lightbox, audio cards, files, pinned service notices and single active playback still work
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.25 - project safety checkpoint

Changed:
- restored git tracking for the project after the previous empty/broken `.git` state
- added `.gitignore` for Python caches, local environments, temporary files, zip backups and synthetic QA exports
- added `README_RUN.md` with a short Windows run guide
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text
- kept frontend behavior, backend behavior, parser logic, `/media`, Range handling, media rendering and storage format unchanged

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.25
- confirm /api/status returns 2.5.25
- confirm startup vault autoload still works
- confirm conversation list, chat search, sorting, date separators, empty states and storage status still behave normally
- confirm stickers, photo lightbox, video thumbnails, audio cards, files, pinned service notices and single active playback still behave normally
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.24 - audio card polish

Changed:
- wrapped regular audio controls in a compact dark audio body that matches existing media cards better
- added a compact filename link for audio cards when Telegram export data provides a media name/path
- added lazy regular audio metadata loading so visible/nearby audio can show duration more reliably without preloading every audio in a large chat at once
- kept regular video preload/poster behavior unchanged with `preload="none"` and existing poster selection
- kept sticker video autoplay/loop/muted behavior, media fallbacks, photo lightbox, files, pinned notices and single active playback logic unchanged
- left backend parsing, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.24
- confirm /api/status returns 2.5.24
- open chats with audio and confirm audio cards look compact and dark, audio starts, duration appears after metadata loads and no false fallback appears
- start audio after audio, audio after video and video after audio to confirm only one regular media player continues playing
- confirm regular video thumbnails, video seeking, stickers, photo lightbox, files, pinned service notices, date separators and empty states still behave normally
- confirm missing audio still shows "аудио недоступно"
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.23 - pinned notice visual polish

Changed:
- made pinned service notices narrower, lighter and centered without using regular message bubble styling
- removed the decorative service marker dot because it did not carry useful state
- shortened frontend pinned previews to a cleaner display label with `…` and a preference for the first meaningful segment
- kept backend/parser, service message data format, search logic, media tabs, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.23
- confirm /api/status returns 2.5.23
- open a chat with pinned service events and confirm the notice is centered, compact, readable and not styled as an incoming/outgoing bubble
- confirm long pinned previews use a clean `…` truncation and do not stretch the chat width
- confirm date separators, ordinary messages, incoming/outgoing alignment, stickers, photo lightbox, video thumbnails, regular video/audio/files, media fallbacks and single active playback still behave normally
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.22 - pinned service messages rendering

Changed:
- added parser support for Telegram `type: service` / `action: pin_message` events
- preserved service event id, date/date_unixtime, actor/actor_id, action and pinned `message_id`
- built a per-chat message id map so pinned message previews resolve without scanning the chat for every service event
- rendered pinned events as compact centered system notices instead of regular incoming/outgoing bubbles
- included service actor and pinned preview fields in in-chat search text
- left `/media`, Range handling, media URL encoding, security checks, stickers, photo lightbox, video thumbnails, audio/files and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.22
- confirm /api/status returns 2.5.22
- open the saved vault and confirm chats still autoload and open by click
- open an export with `pin_message` service events and confirm the event shows actor plus preview when the referenced message exists
- confirm a missing referenced message falls back to "закреплено сообщение" / actor + "сообщение"
- confirm date separators, in-chat search, sender filter and media tabs still behave normally
- confirm stickers, .webp/.webm/.tgs, photo lightbox, video thumbnails, regular video/audio/files, media fallbacks and single active playback still work
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.21 - video poster preview restore

Changed:
- restored regular video poster previews by using existing Telegram export `thumbnail_url` first and `photo_url` second
- kept regular video `src` on the original `/media` video URL with `controls` and `preload="none"`
- left backend parsing, `/media`, Range handling, media URL encoding, sticker rendering, photo lightbox, audio/files and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.21
- confirm /api/status returns 2.5.21
- open a regular video with a Telegram export thumbnail and confirm the poster is visible before pressing play
- confirm the same video plays, seeks with 206 Partial Content, stays inside the message bubble and still opens through the original media link
- confirm a regular video without a thumbnail remains playable and does not show the unavailable fallback unless the video itself is missing
- confirm .webm sticker autoplay loop muted without controls, .webp stickers, .tgs fallback, photo lightbox, audio/files and single active media playback still behave normally
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.20 - large chat performance polish

Changed:
- measured the largest available saved chat (`катя`, 8742 messages / 2353 media) before changing the render path
- reused preloaded chatCache data for opening chats, in-chat search and media tab switching instead of refetching `/api/chat` for already indexed chats
- consolidated sender/search/media filtering into one frontend pass per render
- avoided rebuilding the sender filter when the sender list did not change
- added an O(1) photo-context index so photo/lightbox lookup does not scan the photo list for every rendered media item
- added opt-in console performance logging behind `localStorage.setItem('televault:perf', '1')`
- kept backend parsing, `/media`, Range handling, URL encoding, security checks, stickers, photo/video/audio/file rendering, lightbox, date separators and empty states unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.20
- confirm /api/status returns 2.5.20
- confirm the last saved vault still autoloads from settings
- confirm the conversation list, conversation search and sorting still work
- open the smallest and largest available chats and confirm they render without long UI stalls
- search inside the largest chat, clear search, and confirm empty states/date separators remain correct
- switch all/photo/video/audio/file tabs and confirm the rendered content matches the active tab without console errors
- confirm sticker visual mode, .webp stickers, .webm sticker autoplay loop muted without controls, .tgs fallback, photo lightbox, regular video/audio/files, media fallback states and single active playback still work
- confirm manual path input and a separate "загрузить" button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.19 - library/storage polish

Changed:
- added a compact sidebar library status with the current export folder, chat count, message count and loading-error count
- made long storage paths ellipsize in the existing sidebar status instead of stretching the layout
- made the no-storage welcome state say that no storage is selected and keep the existing "добавить в хранилище" action
- added calmer loading copy while TeleVault checks or indexes the saved export
- made startup/picker errors show friendly storage messages without traceback-like text
- kept backend parsing, saved-vault autoload, folder picker, conversation list, chat search/sort, chat opening, media rendering, photo lightbox and /media endpoint behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.19
- confirm /api/status returns 2.5.19
- confirm the last saved vault still autoloads from settings
- confirm the sidebar status shows the current folder, chat count and message count after loading
- confirm a long storage path is truncated with ellipsis and does not break the sidebar layout
- confirm missing saved vault or invalid export errors are readable and do not show traceback text
- confirm the "хранилище не выбрано" state keeps the "добавить в хранилище" button
- confirm manual path input and a separate "загрузить" button did not return
- confirm the conversation list, conversation search, sorting and opening chats by click still work
- confirm sticker/photo/video/audio/file rendering, photo lightbox, media fallbacks, single active playback and /media 200/206/416/403/path traversal behavior still work

## 2.5.18 - empty states polish

Changed:
- added a compact shared frontend empty-state helper for sidebar, chat and media empty states
- made chat-list search with no matches show "ничего не найдено" with a short query hint
- made empty in-chat search show "сообщений не найдено" with a different-query hint
- added media-tab-specific empty messages for photos, videos, audio and files
- kept date separators behind the non-empty message/media render path, so empty results do not show standalone separators
- kept backend parsing, /media endpoint, Range handling, URL encoding, security checks, incoming/outgoing detection, sticker rendering, media rendering, photo lightbox, media fallbacks and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.18
- confirm /api/status returns 2.5.18
- confirm the start screen "Выбери переписку слева" still appears after a vault is loaded and no chat is selected
- confirm the conversation list still renders and opens chats by click
- search conversations with no matches and confirm a compact "ничего не найдено" empty state appears in the sidebar
- search inside a selected chat with no matches and confirm a compact "сообщений не найдено" empty state appears in the message area
- confirm a selected chat with no messages shows "сообщений нет" without date separators
- confirm the photo, video, audio and file tabs show their own friendly empty states when that media type is absent
- confirm media tabs with existing items do not show an empty state
- confirm date separators still appear for one or more visible messages and do not appear for empty results
- confirm sticker messages, .webp stickers, .webm sticker autoplay loop muted without controls, .tgs fallback, photo lightbox, regular video/audio/files, media fallback states and single active playback still behave normally
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.17 - chat spacing and date separators polish

Changed:
- added compact frontend date separators before the first visible message of each day
- reused the existing Russian day-title format such as `30 июня 2026`
- kept separators inside the already filtered message list, so chat search, sender filter and media tabs use the same day breaks
- switched regular chat metadata to show sender plus message time while the day is shown by the separator
- slightly increased vertical spacing between message rows and tightened bubble sizing with box sizing
- kept sticker messages on the lightweight no-heavy-bubble visual path
- kept incoming/outgoing detection, sender logic, backend parsing, media endpoints, photo lightbox, media fallbacks and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.17
- confirm /api/status returns 2.5.17
- open a chat and confirm date separators appear only when the visible day changes
- search inside a chat and confirm separators remain correct for the filtered result
- use a 3+ sender chat, if available, and confirm sender filter still works
- confirm incoming/outgoing alignment from 2.5.16 is unchanged
- confirm .webp stickers, .webm sticker autoplay loop muted without controls and .tgs fallback still behave normally
- confirm photo lightbox, regular video/audio/file views, media fallback states, 200/206/416/403 and path traversal protection still work

## 2.5.16 - cleaner chat controls and private dialog alignment

Changed:
- kept the in-chat search field visible while hiding the sender filter in chats with one or two unique senders
- made the reset control appear only when search text or a visible sender filter is active
- added a frontend owner-sender candidate based on the sender that appears across multiple two-person chats
- used that owner candidate for outgoing alignment before falling back to the older chat-title heuristic
- kept group-like or unclear chats neutral instead of forcing right/left alignment aggressively
- kept backend parsing, media rendering, photo lightbox, media fallbacks, single active playback and /media behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.16
- confirm /api/status returns 2.5.16
- open miguel and Александр and confirm the sender filter is hidden while search remains visible
- confirm reset is hidden with no search/sender filter and appears when search text is entered
- confirm sèrzh messages align right in miguel and Александр, while the other participant stays left
- confirm sticker bubbles, .webp stickers, .webm sticker autoplay loop muted without controls and .tgs fallback still behave normally
- confirm photo lightbox, regular video/audio/file views, media fallback states, encoded /media URLs, 200/206/416/403 and path traversal protection still work

## 2.5.15 - chat bubble and sticker visual polish

Changed:
- added frontend message modifier classes for sticker, media, text and cautious incoming/outgoing styling
- made sticker messages render without the regular dense bubble background, border and padding
- kept sticker sender/time metadata visible as a compact service pill
- kept sticker captions as their own small caption bubble instead of dropping text
- refined regular message bubble spacing, contrast, radius and hover states
- added a conservative private-chat direction heuristic while leaving group-like conversations neutral
- kept backend parsing, media URL generation, /media Range behavior, media fallbacks, single active playback and photo lightbox unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.15
- confirm /api/status returns 2.5.15
- open a private chat and confirm incoming/outgoing messages are easier to scan without affecting group-like chats
- confirm .webp stickers, .webm animated stickers and .tgs fallback look like sticker messages rather than dense text bubbles
- confirm sticker captions/text remain readable when present
- confirm regular photos, photo lightbox, small-photo centering, regular videos, audio, files and media fallback states still behave normally
- confirm single active regular media playback still works and muted sticker animations remain independent
- confirm encoded /media URLs return 200, valid Range requests return 206, invalid ranges return 416 and outside-root/path traversal requests return 403

## 2.5.14 - single active media playback

Changed:
- added one delegated frontend play listener for regular video and audio elements
- starting a regular video now pauses other regular videos and audio players
- starting audio now pauses other regular videos and audio players
- kept muted Telegram sticker videos independent by excluding sticker wrappers, sticker media markers and muted autoplay loop videos without controls
- kept media fallback handling, /media endpoint, encoded media URLs, Range video seeking and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.14
- confirm /api/status returns 2.5.14
- open a chat with multiple regular videos and confirm starting the second video pauses the first
- start audio while a video is playing and confirm the video pauses while audio continues
- start video while audio is playing and confirm the audio pauses while video continues
- confirm video seeking still returns 206 Partial Content and picture-in-picture still works
- confirm .webm sticker autoplay loop muted without controls still works and does not pause regular media by itself
- confirm .webp stickers, .tgs fallback, photo lightbox, missing media fallbacks and encoded media URLs still behave normally
- confirm /media returns 200, 206, 416 and 403 for the usual cases

## 2.5.13 - false missing video fallback fix

Changed:
- kept backend media URL generation and existence checks unchanged after confirming IMG_2077.MP4 has media_exists=true and a working /media URL
- made regular video rendering use the available media_url as the only playable video source
- stopped ordinary video fallback from depending on preview or thumbnail availability
- changed the frontend video error handler to verify the same-origin /media source with a small Range request before revealing the unavailable fallback
- kept the 2.5.12 media fallback polish for genuinely missing or unreachable media
- kept /media encoded URLs, safe path validation, Range video seeking and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.13
- confirm /api/status returns 2.5.13
- open IMG_2077.MP4 and confirm it renders as a normal inline video with controls
- confirm open original for IMG_2077.MP4 still opens the same /media video URL
- confirm seeking returns 206 Partial Content and normal /media requests still return 200
- confirm invalid ranges return 416 and outside-root/path traversal requests return 403
- confirm genuinely missing video, photo, audio and file media still show fallback cards
- confirm .webp stickers, .webm animated stickers and .tgs fallback still behave as in 2.5.8
- confirm photo lightbox still opens and small photos remain centered

## 2.5.12 - media fallback polish

Changed:
- added shared frontend fallback rendering for unavailable photo, video, audio, file and sticker media
- show compact type-specific fallback cards instead of native broken img/video/audio UI
- keep fallback cards constrained inside message bubbles, media cards and the photo lightbox
- handle browser media load errors by revealing the nearest local fallback instead of blanking the whole card
- kept /media endpoint, safe path validation, encoded media URLs and Range video seeking unchanged
- kept Telegram sticker classification unchanged, including .webp image stickers, .webm autoplay loop muted stickers and .tgs fallback
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.12
- confirm /api/status returns 2.5.12
- open regular photos, photo lightbox and open original
- confirm regular videos still show controls and seeking still returns 206 from /media
- confirm audio, file links, .webp stickers, .webm stickers and .tgs fallback still behave normally
- load an export with missing media paths and confirm photo, video, audio, file and sticker fallbacks look compact and do not stretch message bubbles
- confirm encoded /media URLs from 2.5.11 still return 200 and outside-root/path traversal requests still return 403

## 2.5.11 - media URL encoding hardening

Changed:
- encode generated /media URLs segment-by-segment for paths with spaces, Cyrillic and reserved URL characters
- generate media, photo and thumbnail URLs relative to the loaded library root instead of exposing absolute filesystem paths
- keep /media path validation rooted at LIBRARY.root before reading files
- keep 200, 206 Partial Content and 416 Range behavior for media responses
- kept frontend media rendering, photo lightbox, open-original links, video controls and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.11
- confirm /api/status returns 2.5.11
- open photos, photo lightbox, open original, regular video seeking, audio, files and stickers
- confirm /media returns 200 for normal requests, 206 for valid Range, 416 for invalid Range and 403 for outside-root paths
- confirm paths with spaces, Cyrillic, #, ?, %, +, &, [ and nested folders produce encoded /media URLs without double encoding

## 2.5.10 - video seeking support

Changed:
- added safe HTTP Range request support to the /media endpoint
- return 206 Partial Content with Accept-Ranges, Content-Range and Content-Length for byte ranges
- keep normal /media requests working as 200 responses with Accept-Ranges: bytes
- kept frontend video controls and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.10
- open a regular video and confirm it stays inside the message bubble
- seek a regular video by clicking and dragging the progress bar
- confirm picture-in-picture and ordinary video controls still work
- confirm .webp, .webm and .tgs Telegram stickers still render as in 2.5.8
- confirm photos, photo lightbox, centered small-photo lightbox behavior, audio and files still work
- in DevTools Network, confirm video seeking sends Range and /media returns 206 with Accept-Ranges and Content-Range

## 2.5.9 - video/media width clamp

Changed:
- clamped inline media wrappers to the available message width
- changed regular inline video sizing so videos use width: min(640px, 100%) instead of intrinsic width
- kept ordinary video controls and sticker-specific rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.9
- open a chat with a wide regular video and confirm it stays inside the message bubble
- confirm ordinary videos still show controls
- confirm photos, photo lightbox and centered small-photo lightbox behavior still work
- confirm .webp, .webm and .tgs Telegram stickers still render as in 2.5.8
- confirm audio, files and the all/photo/video/audio/file tabs still behave normally

## 2.5.8 - Telegram stickers rendering

Changed:
- added conservative Telegram sticker detection in the parser without new dependencies
- marked detected stickers as media_kind="sticker" for the frontend
- rendered static sticker images inline as compact stickers instead of large photos
- rendered playable animated sticker videos autoplay/loop/muted/playsinline without controls
- added a clean fallback for unsupported .tgs animated stickers with an open-original link
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.8
- confirm ordinary photos still open in the photo lightbox and small photos stay centered
- confirm ordinary videos still display as videos with controls
- confirm a .webp Telegram sticker displays as a compact sticker image
- confirm a .webm Telegram sticker autoplays, loops, stays muted and has no controls
- confirm a .tgs Telegram sticker shows the animated-sticker fallback and open-original link
- confirm audio, regular files, chat list, chat search, sender filter and /media access still work

## 2.5.6 - small image lightbox fix

Changed:
- centered the photo lightbox image stage independently from the metadata panel
- added moderate viewer-only upscaling for small photos
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.6
- open a large photo and confirm it still fills the viewer cleanly
- open a small photo and confirm it is centered and not thumbnail-like
- confirm metadata and the open original link stay below the image without shifting it left
- confirm close button, Esc, arrow navigation, backdrop click and open original still work
- confirm video, audio, files, conversation search, sender filter and /media access still behave normally

## 2.5.7 - fullscreen lightbox positioning fix

Changed:
- changed the photo lightbox dialog from a constrained three-column grid into a fullscreen viewer
- positioned close and previous/next controls as overlay buttons
- positioned the caption at the bottom center so it cannot move the image stage
- changed small-photo handling to a CSS class based on natural image size
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.7
- open a small photo and confirm it is centered against the full viewport
- confirm the caption is centered at the bottom and does not shift the photo left
- open a large photo and confirm it still fits cleanly
- confirm close button, Esc, arrow navigation, backdrop click and open original still work
