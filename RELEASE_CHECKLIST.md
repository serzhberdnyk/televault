# TeleVault: release checklist

TeleVault 2.7.7 - patch-релиз для exe packaging preparation. Этот чеклист фиксирует, что нужно проверить после подготовки `dist/TeleVault-v2.7.7/` и `dist/TeleVault-v2.7.7.zip`. В 2.7.7 exe не собирается, installer не добавляется, упаковщик не выбирается, поведение приложения не меняется.

## Что должно быть в Windows-комплекте

Будущий Windows-комплект должен содержать файлы, без которых TeleVault не запустится из одной папки:

- `run_windows.bat`
- `app.py`
- `backend/`
- `frontend/`
- `README_RUN.md`
- `README.md`
- `CHANGELOG.md`
- `RELEASE_CHECKLIST.md`
- `DEVELOPMENT_LOG.md`
- `runtime/python/` только если в исходном проекте есть `runtime/python/python.exe`

`run_windows.bat` сначала пробует `runtime\python\python.exe`, затем системный `py`, затем системный `python`. Если Python не найден, окно остаётся открытым и показывает понятное сообщение.

## Portable dry-run папка

В 2.7.7 эту папку создаёт `tools/build_portable.py`. Это dry run: он готовит чистую папку по allowlist, но не собирает exe.

```text
TeleVault-v2.7.7/
- run_windows.bat
- app.py
- backend/
  - library.py
  - parser.py
- frontend/
  - index.html
  - app.js
  - styles.css
- README_RUN.md
- README.md
- CHANGELOG.md
- RELEASE_CHECKLIST.md
- DEVELOPMENT_LOG.md
- runtime/python/ optional, only when `runtime/python/python.exe` exists in the source project
```

## Проверка portable dry run

1. Запустить `py tools\build_portable.py` или `build_portable.bat`.
2. Убедиться, что создана папка `dist/TeleVault-v2.7.7/`.
3. Убедиться, что builder печатает список скопированных файлов и каталогов.
4. Убедиться, что portable folder содержит `runtime/python/python.exe` или builder явно предупреждает, что runtime отсутствует.
5. Убедиться, что `run_windows.bat` запускается через bundled runtime, если он есть.
6. Убедиться, что fallback на system `py` или `python` используется только для dev/local use, когда bundled runtime отсутствует.
7. Убедиться, что в portable-папке есть только allowlist-файлы и каталоги из раздела выше.
8. Убедиться, что в portable-папке нет `.git/`, `__pycache__/`, `.venv/`, `venv/`, `node_modules/`, `dist/`, `build/`, `*.pyc`, `*.log`, локальных export-папок, screenshots/cache/dev artifacts и пользовательских настроек с личными путями.
9. Убедиться, что `dist/` является generated artifact и не добавляется в commit.
10. После запуска `build_portable.bat` выполнить `git status --short` и убедиться, что он не показывает `dist/` как untracked.
11. Запустить `dist\TeleVault-v2.7.7\run_windows.bat` и проверить старт приложения через bundled runtime, если он есть.

## Проверка portable zip

1. Убедиться, что создан zip `dist\TeleVault-v2.7.7.zip`.
2. Убедиться, что внутри zip есть верхняя папка `TeleVault-v2.7.7/`.
3. Убедиться, что внутри `TeleVault-v2.7.7/` есть `run_windows.bat`.
4. Убедиться, что внутри `TeleVault-v2.7.7/` есть `app.py`, `backend/` и `frontend/`.
5. Если в исходном проекте есть bundled runtime, убедиться, что внутри zip есть `TeleVault-v2.7.7/runtime/python/python.exe`.
6. Распаковать zip в отдельную папку.
7. Запустить распакованный `TeleVault-v2.7.7\run_windows.bat`.
8. Убедиться, что распакованная копия запускается через bundled runtime, если он есть.
9. Убедиться, что распакованная копия показывает `v2.7.7` в UI и `"version": "2.7.7"` в `/api/status`.

## Exe packaging preparation

Перед будущей exe-упаковкой нужно проверить:

1. Portable zip создаётся и запускается перед любыми exe-экспериментами.
2. `runtime/python/` есть в portable package, если bundled runtime есть в исходном проекте.
3. Приложение не зависит от dev-only paths и запускается из подготовленной portable-папки.
4. Пути к `frontend/` и `backend/` описаны и проверены для будущей упаковки.
5. Folder picker продолжает работать после запуска из portable-папки.
6. Startup vault/autoload продолжает работать.
7. `/media` корректно отдаёт файлы из выбранного export.
8. Range requests сохраняют ожидаемые статусы 200, 206, 416 и 403.
9. `/api/search` продолжает работать.
10. Browser открывается автоматически.
11. Relative paths не зависят от current working directory.
12. Bundled runtime не попадает в git.
13. Пользовательские settings/export/cache не попадают в package.

## Запуск двойным кликом

1. Открыть папку TeleVault в Проводнике Windows.
2. Дважды нажать `run_windows.bat`.
3. Убедиться, что локальный сервер стартовал и браузер открылся автоматически.
4. Если браузер не открылся, открыть адрес, который напечатал скрипт.

## Проверка версии

1. Убедиться, что в правом верхнем углу UI показано `v2.7.7`.
2. Открыть `/api/status`.
3. Убедиться, что JSON содержит `"version": "2.7.7"`.

## Проверка startup vault

1. Открыть Telegram export через существующий выбор папки.
2. Закрыть TeleVault.
3. Снова запустить TeleVault через `run_windows.bat`.
4. Убедиться, что последний vault загружается автоматически, если сохраненная папка доступна.

## Проверка media tabs

1. Открыть чат, где есть медиа.
2. Переключить вкладки all, photo, video, audio, sticker и file.
3. Убедиться, что каждая вкладка сохраняет существующее поведение отображения.

## Проверка global search

1. Использовать поиск в sidebar.
2. Убедиться, что поиск по названиям чатов работает.
3. Найти текст, который есть в сообщениях открытого экспорта.
4. Убедиться, что результаты сообщений появились и клик по результату открывает исходный чат/сообщение.

## Проверка /media

1. Открыть export с доступными медиафайлами.
2. Убедиться, что фото, видео, аудио, стикеры и файлы открываются через существующие `/media` URL.
3. Убедиться, что seek в видео/аудио работает.
4. Убедиться, что ожидания безопасности `/media` сохранены: обычный media-запрос возвращает 200, валидный Range возвращает 206, invalid Range возвращает 416, outside-root path возвращает 403.

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

## Проверка документации

- `README.md`, `README_RUN.md`, `EXE_PACKAGING_PLAN.md` и этот чеклист не должны обещать готовый exe в 2.7.7.
- Документация должна оставлять `run_windows.bat` текущим поддерживаемым способом запуска.
- Документация не должна возвращать ручной ввод пути или старую кнопку загрузки.
