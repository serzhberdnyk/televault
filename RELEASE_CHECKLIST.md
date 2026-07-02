# TeleVault: release checklist

TeleVault 2.8.8 - patch-релиз для Windows `TeleVault.exe` app icon branding. Это не installer и не one-file exe: launcher лежит рядом с `app.py`, `assets/`, `backend/`, `frontend/` и `runtime/python/` и запускает существующий portable flow.

В 2.8.8 нельзя менять frontend app logic, backend logic, `/media`, `/api/search`, parser/storage/media classification. `run_windows.bat` должен сохранить прежнее поведение запуска.

## Что должно быть в Windows-комплекте

Комплект после `build_exe_launcher.bat` должен содержать:

- `TeleVault.exe`
- `run_windows.bat`
- `app.py`
- `assets/` с `assets/TeleVault.ico`
- `backend/`
- `frontend/`
- `README.md`
- `README_RUN.md`
- `CHANGELOG.md`
- `RELEASE_CHECKLIST.md`
- `EXE_PACKAGING_PLAN.md`
- `DEVELOPMENT_LOG.md`
- `runtime/python/` с `runtime/python/python.exe`

`TeleVault.exe` запускает `runtime\python\python.exe app.py` из папки, где лежит сам exe, без видимой консоли, ждёт готовности сервера и открывает app-like окно через Edge/Chrome или обычный browser fallback. `run_windows.bat` остаётся fallback/debug launcher и сначала пробует `runtime\python\python.exe`, затем системный `py`, затем системный `python`.

`logs\launcher.log` нужен только для runtime-диагностики. Он не должен попадать в git или release zip.

`user_data\launcher_window.json` хранит локальный размер и позицию app-like окна. Это пользовательское runtime-состояние, оно не должно попадать в git или release zip.

## Portable build без обязательного exe

`build_portable.bat` по-прежнему создаёт clean portable folder/zip без обязательного `TeleVault.exe`.

```text
dist/TeleVault-v2.8.8/
- run_windows.bat
- app.py
- assets/
- backend/
- frontend/
- README.md
- README_RUN.md
- CHANGELOG.md
- RELEASE_CHECKLIST.md
- EXE_PACKAGING_PLAN.md
- DEVELOPMENT_LOG.md
- runtime/python/ optional, only when runtime/python/python.exe exists in the source project
```

Проверки:

1. Запустить `build_portable.bat`.
2. Убедиться, что создана папка `dist\TeleVault-v2.8.8\`.
3. Убедиться, что создан zip `dist\TeleVault-v2.8.8.zip`.
4. Убедиться, что zip содержит верхнюю папку `TeleVault-v2.8.8/`.
5. Убедиться, что `build_portable.bat` не требует ручного PATH.
6. Убедиться, что `dist/` не появляется в `git status --short`.

## Exe launcher build

`build_exe_launcher.bat` должен сначала собрать portable folder через текущий portable builder, затем скомпилировать:

```text
tools/launcher/TeleVaultLauncher.cs
```

в:

```text
dist/TeleVault-v2.8.8/TeleVault.exe
```

После добавления exe builder должен пересобрать:

```text
dist/TeleVault-v2.8.8.zip
```

Проверки:

1. Запустить `build_exe_launcher.bat`.
2. Убедиться, что `csc.exe` найден через PATH или один из типичных путей `.NET Framework`.
3. Убедиться, что `dist\TeleVault-v2.8.8\TeleVault.exe` существует.
4. Убедиться, что zip содержит `TeleVault-v2.8.8/TeleVault.exe`.
5. Убедиться, что fake exe не создаётся, если `csc.exe` не найден.
6. Убедиться, что в отчёте builder видны проверенные пути `csc.exe` при blocker.
7. Убедиться, что `assets\TeleVault.ico` существует.
8. Убедиться, что builder сообщает `launcher icon:` и `launcher icon argument: /win32icon:...`.
9. Убедиться, что `TeleVault.exe` собирается с custom TeleVault icon.
10. Если `assets\TeleVault.ico` отсутствует, убедиться, что build не падает и сообщает, что custom icon не найден.

## Запуск через TeleVault.exe

1. Открыть `dist\TeleVault-v2.8.8\`.
2. Дважды нажать `TeleVault.exe`.
3. Убедиться, что launcher использует папку, где лежит exe, а не current working directory.
4. Убедиться, что launcher проверяет `runtime\python\python.exe`, `app.py`, `backend\` и `frontend\`.
5. Убедиться, что `TeleVault.exe` не показывает видимое окно консоли.
6. Убедиться, что локальный сервер стартовал до открытия браузера.
7. Убедиться, что `TeleVault.exe` открывает app-like окно через Edge/Chrome или обычный browser fallback.
8. Убедиться, что `TeleVault.exe` не открывает два browser window.
9. Запустить `TeleVault.exe` повторно и убедиться, что существующее окно фокусируется, а второе окно не открывается.
10. Убедиться, что при отсутствии обязательных файлов launcher показывает понятный MessageBox, а технические детали пишет в `logs\launcher.log`.
11. Убедиться, что `logs\launcher.log` создаётся только как runtime-лог и не попадает в git/package как dev-мусор.
12. Открыть `/api/status`.
13. Убедиться, что JSON содержит `"version": "2.8.8"`.
14. Убедиться, что правый верхний угол UI показывает `v2.8.8`.

## Launcher UX patch checks

1. Изменить размер app-like окна, закрыть окно, запустить `TeleVault.exe` снова и убедиться, что размер восстановился.
2. Изменить позицию app-like окна, закрыть окно, запустить `TeleVault.exe` снова и убедиться, что позиция восстановилась или корректно сброшена, если была вне экрана.
3. Нажать `выбрать папку экспорта` и убедиться, что Windows folder picker открывается поверх окна TeleVault.
4. Нажать cancel в folder picker и убедиться, что UI не переходит в error state и уже открытый export не сбрасывается.
5. Запустить `TeleVault.exe` повторно при открытом окне и убедиться, что существующее окно фокусируется, второе окно не открывается, а размер не меняется принудительно.
6. Закрыть app-like окно при живом backend, запустить `TeleVault.exe` снова и убедиться, что открывается одно новое app-like окно с сохранённым размером/позицией.
7. Убедиться, что `user_data\launcher_window.json` локальный, игнорируется git и не попадает в zip/source release.
8. Убедиться, что `logs\launcher.log` содержит события loaded/no/invalid/saved window state и owner hwnd found/not found без export paths и private message data.

## Fallback run_windows.bat

1. Открыть `dist\TeleVault-v2.8.8\`.
2. Дважды нажать `run_windows.bat`.
3. Убедиться, что fallback всё ещё запускает TeleVault через bundled runtime.
4. Открыть `/api/status` и убедиться, что версия `2.8.8`.

## Zip extraction

1. Распаковать `dist\TeleVault-v2.8.8.zip` в отдельную папку.
2. Убедиться, что внутри есть верхняя папка `TeleVault-v2.8.8/`.
3. Убедиться, что распакованная копия содержит `TeleVault.exe`.
4. Запустить распакованную копию через `TeleVault.exe`.
5. Убедиться, что распакованная копия запускается через bundled runtime.
6. Убедиться, что `run_windows.bat` в распакованной копии тоже работает.
7. Убедиться, что zip содержит `TeleVault-v2.8.8/assets/TeleVault.ico`.
8. Убедиться, что zip содержит `TeleVault-v2.8.8/frontend/favicon.ico`.
9. Убедиться, что zip не содержит `logs/`, `logs/launcher.log`, `user_data/` и `user_data/launcher_window.json`.

## App behavior checks

1. Открыть Telegram export через выбор папки.
2. Убедиться, что folder picker открывается и выбранный export загружается.
3. Убедиться, что startup vault/autoload продолжает работать.
4. Проверить media tabs: all, photo, video, audio, sticker и file.
5. Проверить global search в sidebar.
6. Проверить in-chat search внутри выбранного чата.
7. Проверить, что `/api/search` возвращает результаты как раньше.
8. Проверить, что `/media` продолжает отдавать файлы из выбранного export.
9. Проверить Range request behavior для `/media`: 200, 206, 416 и 403, если проверка не слишком долгая.
10. Убедиться, что app не зависит от dev-only absolute paths.

## Static checks

Выполнить:

```bat
runtime\python\python.exe -m py_compile app.py backend/parser.py backend/library.py backend/windows_folder_picker.py
runtime\python\python.exe -m py_compile tools/build_portable.py
runtime\python\python.exe -m py_compile tools/build_exe_launcher.py
runtime\python\python.exe -m py_compile tools/generate_icon.py
node --check frontend/app.js
git diff --check
```

## Что не должно попасть в релизный комплект

Не включать локальные dev-файлы и пользовательские данные:

- `.git/`
- `__pycache__/`
- `.venv/`
- `venv/`
- `node_modules/`
- `.pytest_cache/`
- сгенерированные `build/` или `dist/` из экспериментов
- `*.pyc`
- `*.log`
- временные логи и scratch-файлы
- screenshots/cache/dev artifacts
- backup-архивы
- локальные тестовые exports
- реальные Telegram export папки и медиа
- `%APPDATA%\TeleVault\settings.json`
- `user_data/`
- `user_data/launcher_window.json`

`dist/` и `build/` должны оставаться в `.gitignore`: это generated artifacts, которые можно пересоздать, а не исходники релиза.

## Документация

- `README.md` должен указывать версию 2.8.8 и TeleVault.exe icon branding.
- `README_RUN.md` должен объяснять запуск через `TeleVault.exe` и fallback через `run_windows.bat`.
- `EXE_PACKAGING_PLAN.md` должен оставлять one-file exe и installer будущими этапами.
- `assets/README.md` должен объяснять `assets\TeleVault.ico` и пересоздание иконки через `tools\generate_icon.py`.
- `CHANGELOG.md` и `DEVELOPMENT_LOG.md` должны содержать запись 2.8.8.
