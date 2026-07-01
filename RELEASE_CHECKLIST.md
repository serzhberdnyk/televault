# TeleVault: release checklist

TeleVault 2.7.1 - patch-релиз для dry-run portable-папки Windows. Этот чеклист фиксирует, что нужно проверить после подготовки `dist/TeleVault-v2.7.1/`. В 2.7.1 exe не собирается, installer не добавляется, упаковщик не выбирается, поведение приложения не меняется.

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
- bundled Python только если подготовленный комплект будет использовать встроенный Python

В текущей исходной папке проекта bundled Python нет. `run_windows.bat` сейчас пробует `py app.py`, а затем `python app.py`.

## Portable dry-run папка

В 2.7.1 эту папку создаёт `tools/build_portable.py`. Это dry run: он готовит чистую папку по allowlist, но не собирает exe.

```text
TeleVault-v2.7.1/
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
```

## Проверка portable dry run

1. Запустить `py tools\build_portable.py` или `build_portable.bat`.
2. Убедиться, что создана папка `dist/TeleVault-v2.7.1/`.
3. Убедиться, что builder печатает список скопированных файлов и каталогов.
4. Убедиться, что builder явно пишет предупреждение, если bundled Python не найден внутри проекта.
5. Убедиться, что в portable-папке есть только allowlist-файлы и каталоги из раздела выше.
6. Убедиться, что в portable-папке нет `.git/`, `__pycache__/`, `.venv/`, `venv/`, `node_modules/`, `dist/`, `build/`, `*.pyc`, `*.log`, локальных export-папок, screenshots/cache/dev artifacts и пользовательских настроек с личными путями.
7. Если на машине доступен `py` или `python`, запустить `dist\TeleVault-v2.7.1\run_windows.bat` и проверить обычный старт приложения.

## Запуск двойным кликом

1. Открыть папку TeleVault в Проводнике Windows.
2. Дважды нажать `run_windows.bat`.
3. Убедиться, что локальный сервер стартовал и браузер открылся автоматически.
4. Если браузер не открылся, открыть адрес, который напечатал скрипт.

## Проверка версии

1. Убедиться, что в правом верхнем углу UI показано `v2.7.1`.
2. Открыть `/api/status`.
3. Убедиться, что JSON содержит `"version": "2.7.1"`.

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

## Проверка документации

- `README.md`, `README_RUN.md` и этот чеклист не должны обещать готовый exe в 2.7.1.
- Документация должна оставлять `run_windows.bat` текущим поддерживаемым способом запуска.
- Документация не должна возвращать ручной ввод пути или старую кнопку загрузки.
