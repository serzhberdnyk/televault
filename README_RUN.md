# TeleVault: запуск на Windows

TeleVault - локальный просмотрщик Telegram exports. Он открывает папки Telegram Desktop export в браузере и не отправляет данные наружу.

## Основной способ

1. Откройте папку TeleVault в Проводнике Windows.
2. Дважды нажмите `run_windows.bat`.
3. Подождите несколько секунд, пока откроется браузер.

Обычному пользователю не нужно открывать терминал, Git или редактор кода. Запуск начинается с двойного клика по `run_windows.bat`.

Если браузер не открылся сам, откройте адрес:

```text
http://127.0.0.1:8766
```

## Что делает run_windows.bat

`run_windows.bat` запускает локальный сервер TeleVault и печатает адрес, который нужно открыть в браузере.

Порядок запуска:

1. Если рядом с приложением есть `runtime\python\python.exe`, используется этот bundled Python runtime.
2. Если bundled runtime нет, скрипт пробует системный `py`.
3. Если `py` недоступен, скрипт пробует системный `python`.

Если Python не найден ни одним способом, окно не закрывается мгновенно и показывает понятное сообщение. Для настоящей portable-папки нужен bundled Python runtime внутри `runtime\python\`.

## Создание portable-папки

TeleVault использует dry-run builder для подготовки чистой Windows-папки. Он не собирает exe, не добавляет упаковщик и не меняет поведение приложения.

Способ для двойного клика:

1. Откройте исходную папку проекта.
2. Дважды нажмите `build_portable.bat`.
3. Проверьте вывод в консоли.

Способ из терминала:

```bat
py tools\build_portable.py
```

Если `py` недоступен:

```bat
python tools\build_portable.py
```

Builder создаёт:

```text
dist\TeleVault-v2.7.7\
dist\TeleVault-v2.7.7.zip
```

Папка `dist\` является generated artifact: её можно удалить или пересоздать повторным запуском `build_portable.bat`, и она не должна попадать в commit.

В portable-папку копируются только allowlist-файлы:

```text
TeleVault-v2.7.7/
- run_windows.bat
- app.py
- backend/
- frontend/
- README_RUN.md
- README.md
- CHANGELOG.md
- RELEASE_CHECKLIST.md
- DEVELOPMENT_LOG.md
- runtime/python/ только если в исходном проекте есть runtime/python/python.exe
```

Не копируются `.git/`, `__pycache__/`, `.venv/`, `venv/`, `node_modules/`, `dist/`, `build/`, `*.pyc`, `*.log`, локальные export-папки, временные screenshots/cache/dev artifacts и пользовательские настройки с личными путями.

Если в исходной папке есть `runtime/python/python.exe`, builder копирует всю папку `runtime/python/` в portable-комплект. Если runtime отсутствует, builder не падает и печатает предупреждение: portable folder создан, но без bundled Python; запуск будет работать только там, где есть `py` или `python`.

## Portable zip

1. Запустите `build_portable.bat`.
2. Получите архив `dist\TeleVault-v2.7.7.zip`.
3. Распакуйте zip в обычную папку.
4. Откройте распакованную папку `TeleVault-v2.7.7`.
5. Дважды нажмите `run_windows.bat`.

Zip содержит верхнюю папку `TeleVault-v2.7.7\`, а внутри неё те же файлы, что и clean portable folder. Если в исходном проекте есть `runtime\python\python.exe`, bundled Python попадёт и в zip. Если runtime отсутствует, zip всё равно создаётся, но для запуска на другой машине понадобится установленный `py` или `python`.

Готовый exe в 2.7.7 не создаётся.

## Будущий exe-запуск

Сейчас рабочий способ запуска - `run_windows.bat` или portable zip.

Будущая цель - `TeleVault.exe`, который запускает приложение двойным кликом без ручного открытия Python, Git или терминала.

Exe ещё не включён в 2.7.7. Текущий релиз только документирует подготовку к будущему launcher-style exe.

## Как открыть Telegram export

1. Нажмите `выбрать папку экспорта` в TeleVault.
2. Выберите папку Telegram Desktop export или общую папку, внутри которой есть один или несколько `result.json`.
3. После загрузки слева появится список чатов.

При следующем старте TeleVault попробует автоматически открыть последнюю выбранную папку, если она всё ещё доступна.

## Где видна версия

Версия видна в правом верхнем углу интерфейса и в ответе `/api/status`.

Текущая версия: `2.7.7`.
