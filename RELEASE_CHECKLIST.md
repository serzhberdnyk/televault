# TeleVault: release checklist

TeleVault 2.8.5 - patch-релиз для полировки Windows `TeleVault.exe` launcher UX. Это не installer и не one-file exe: launcher лежит рядом с `app.py`, `backend/`, `frontend/` и `runtime/python/` и запускает существующий portable flow.

В 2.8.5 нельзя менять frontend app logic, backend logic, `/media`, `/api/search`, parser/storage/media classification. `run_windows.bat` должен сохранить прежнее поведение запуска.

## Что должно быть в Windows-комплекте

Комплект после `build_exe_launcher.bat` должен содержать:

- `TeleVault.exe`
- `run_windows.bat`
- `app.py`
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

## Portable build без обязательного exe

`build_portable.bat` по-прежнему создаёт clean portable folder/zip без обязательного `TeleVault.exe`.

```text
dist/TeleVault-v2.8.5/
- run_windows.bat
- app.py
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
2. Убедиться, что создана папка `dist\TeleVault-v2.8.5\`.
3. Убедиться, что создан zip `dist\TeleVault-v2.8.5.zip`.
4. Убедиться, что zip содержит верхнюю папку `TeleVault-v2.8.5/`.
5. Убедиться, что `build_portable.bat` не требует ручного PATH.
6. Убедиться, что `dist/` не появляется в `git status --short`.

## Exe launcher build

`build_exe_launcher.bat` должен сначала собрать portable folder через текущий portable builder, затем скомпилировать:

```text
tools/launcher/TeleVaultLauncher.cs
```

в:

```text
dist/TeleVault-v2.8.5/TeleVault.exe
```

После добавления exe builder должен пересобрать:

```text
dist/TeleVault-v2.8.5.zip
```

Проверки:

1. Запустить `build_exe_launcher.bat`.
2. Убедиться, что `csc.exe` найден через PATH или один из типичных путей `.NET Framework`.
3. Убедиться, что `dist\TeleVault-v2.8.5\TeleVault.exe` существует.
4. Убедиться, что zip содержит `TeleVault-v2.8.5/TeleVault.exe`.
5. Убедиться, что fake exe не создаётся, если `csc.exe` не найден.
6. Убедиться, что в отчёте builder видны проверенные пути `csc.exe` при blocker.
7. Если `assets\TeleVault.ico` существует, убедиться, что builder сообщает `launcher icon:` и exe собирается с `/win32icon`.
8. Если `assets\TeleVault.ico` отсутствует, убедиться, что build не падает и сообщает, что custom icon не найден.

## Запуск через TeleVault.exe

1. Открыть `dist\TeleVault-v2.8.5\`.
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
13. Убедиться, что JSON содержит `"version": "2.8.5"`.
14. Убедиться, что правый верхний угол UI показывает `v2.8.5`.

## Fallback run_windows.bat

1. Открыть `dist\TeleVault-v2.8.5\`.
2. Дважды нажать `run_windows.bat`.
3. Убедиться, что fallback всё ещё запускает TeleVault через bundled runtime.
4. Открыть `/api/status` и убедиться, что версия `2.8.5`.

## Zip extraction

1. Распаковать `dist\TeleVault-v2.8.5.zip` в отдельную папку.
2. Убедиться, что внутри есть верхняя папка `TeleVault-v2.8.5/`.
3. Убедиться, что распакованная копия содержит `TeleVault.exe`.
4. Запустить распакованную копию через `TeleVault.exe`.
5. Убедиться, что распакованная копия запускается через bundled runtime.
6. Убедиться, что `run_windows.bat` в распакованной копии тоже работает.
7. Убедиться, что zip не содержит `logs/` и `logs/launcher.log`.

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

`dist/` и `build/` должны оставаться в `.gitignore`: это generated artifacts, которые можно пересоздать, а не исходники релиза.

## Документация

- `README.md` должен указывать версию 2.8.5 и launcher-style exe UX polish.
- `README_RUN.md` должен объяснять запуск через `TeleVault.exe` и fallback через `run_windows.bat`.
- `EXE_PACKAGING_PLAN.md` должен оставлять one-file exe и installer будущими этапами.
- `CHANGELOG.md` и `DEVELOPMENT_LOG.md` должны содержать запись 2.8.5.
