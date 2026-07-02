# TeleVault: запуск на Windows

TeleVault - локальный просмотрщик Telegram exports. Он открывает папки Telegram Desktop export в браузере и не отправляет данные наружу.

## Основной способ

1. Откройте portable-папку `TeleVault-v2.8.8` в Проводнике Windows.
2. Дважды нажмите `TeleVault.exe`.
3. Подождите несколько секунд, пока откроется app-like окно Edge/Chrome или обычный браузер fallback.
4. Если exe отсутствует или нужна диагностика, дважды нажмите `run_windows.bat`.

Обычному пользователю не нужно открывать терминал, Git или редактор кода. В комплекте с `TeleVault.exe` запуск начинается с двойного клика по exe.

Если `TeleVault.exe` не запускается или показывает ошибку, проверьте `logs\launcher.log` рядом с приложением. `run_windows.bat` остаётся fallback/debug-способом запуска.

Если браузер не открылся сам, откройте адрес:

```text
http://127.0.0.1:8766
```

## Запуск через TeleVault.exe

`TeleVault.exe` в 2.8.8 - основной пользовательский способ запуска portable-папки. Это не installer и не one-file exe.

Launcher должен лежать рядом с файлами и папками приложения:

```text
TeleVault-v2.8.8/
- TeleVault.exe
- app.py
- assets/
- backend/
- frontend/
- runtime/python/python.exe
- run_windows.bat
```

При запуске `TeleVault.exe` определяет папку, где лежит сам exe, считает её корнем приложения, проверяет `runtime\python\python.exe`, `app.py`, `backend\` и `frontend\`, затем запускает локальный сервер без видимого окна командной строки:

```bat
runtime\python\python.exe app.py
```

`TeleVault.exe` запоминает последний размер и позицию app-like окна между запусками. Локальное состояние хранится рядом с приложением в `user_data\launcher_window.json` и не должно попадать в git или release zip. Если размер или позиция не восстановились, проверьте `logs\launcher.log`: там должны быть путь state-файла, loaded/saved bounds и причина fallback.

После готовности сервера launcher открывает интерфейс в app-like окне через Microsoft Edge или Google Chrome, если один из них найден. Если app-like режим недоступен, TeleVault откроется в обычном браузере fallback и launcher покажет понятное сообщение.

`run_windows.bat` остаётся fallback/debug-способом запуска и полезен для диагностики. При запуске через `run_windows.bat` поведение приложения остаётся прежним.

## Что делает run_windows.bat

`run_windows.bat` запускает локальный сервер TeleVault и печатает адрес, который нужно открыть в браузере.

Порядок запуска:

1. Если рядом с приложением есть `runtime\python\python.exe`, используется этот bundled Python runtime.
2. Если bundled runtime нет, скрипт пробует системный `py`.
3. Если `py` недоступен, скрипт пробует системный `python`.

Если Python не найден ни одним способом, окно не закрывается мгновенно и показывает понятное сообщение. Для настоящей portable-папки нужен bundled Python runtime внутри `runtime\python\`.

## Создание portable-папки

TeleVault использует builder для подготовки чистой Windows-папки. `build_portable.bat` не собирает exe, не добавляет упаковщик и не меняет поведение приложения.

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
dist\TeleVault-v2.8.8\
dist\TeleVault-v2.8.8.zip
```

Папка `dist\` является generated artifact: её можно удалить или пересоздать повторным запуском `build_portable.bat`, и она не должна попадать в commit.

В portable-папку копируются только allowlist-файлы:

```text
TeleVault-v2.8.8/
- run_windows.bat
- app.py
- assets/
- backend/
- frontend/
- README_RUN.md
- README.md
- CHANGELOG.md
- RELEASE_CHECKLIST.md
- EXE_PACKAGING_PLAN.md
- DEVELOPMENT_LOG.md
- runtime/python/ только если в исходном проекте есть runtime/python/python.exe
```

Не копируются `.git/`, `__pycache__/`, `.venv/`, `venv/`, `node_modules/`, `dist/`, `build/`, `*.pyc`, `*.log`, локальные export-папки, временные screenshots/cache/dev artifacts и пользовательские настройки с личными путями.

Если в исходной папке есть `runtime/python/python.exe`, builder копирует всю папку `runtime/python/` в portable-комплект. Если runtime отсутствует, builder не падает и печатает предупреждение: portable folder создан, но без bundled Python; запуск будет работать только там, где есть `py` или `python`.

## Portable zip

1. Запустите `build_portable.bat` или `build_exe_launcher.bat`.
2. Получите архив `dist\TeleVault-v2.8.8.zip`.
3. Распакуйте zip в обычную папку.
4. Откройте распакованную папку `TeleVault-v2.8.8`.
5. Если архив собран через `build_exe_launcher.bat`, дважды нажмите `TeleVault.exe`.
6. Если архив собран через `build_portable.bat`, дважды нажмите `run_windows.bat`.

Zip содержит верхнюю папку `TeleVault-v2.8.8\`, а внутри неё те же файлы, что и clean portable folder. Если zip собран через `build_exe_launcher.bat`, внутри верхней папки также есть `TeleVault.exe`. Если в исходном проекте есть `runtime\python\python.exe`, bundled Python попадёт и в zip. Если runtime отсутствует, zip всё равно создаётся, но для запуска на другой машине понадобится установленный `py` или `python`.

## Создание portable-папки с TeleVault.exe

`build_exe_launcher.bat` сначала создаёт обычную portable-папку через текущий portable builder, затем компилирует `tools\launcher\TeleVaultLauncher.cs` в:

```text
dist\TeleVault-v2.8.8\TeleVault.exe
```

После этого builder пересобирает:

```text
dist\TeleVault-v2.8.8.zip
```

и проверяет, что `TeleVault-v2.8.8/TeleVault.exe` есть внутри zip.

Для сборки используется `csc.exe`: сначала из PATH, затем из типичных путей `.NET Framework`:

```text
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
```

Если `csc.exe` не найден, exe не подменяется и не создаётся фейковый результат: builder печатает blocker message и завершает работу с ошибкой.

В 2.8.8 репозиторий содержит `assets\TeleVault.ico`, поэтому builder передаёт его в `csc.exe` через `/win32icon`, и `TeleVault.exe` собирается с dedicated TeleVault icon. Если файла нет, сборка не падает и печатает warning, что custom icon не найден, а exe будет собран со стандартной Windows-иконкой.

Та же иконка пересоздаётся как `frontend\favicon.ico`, поэтому browser/app-window получает TeleVault favicon без изменения `app.py` или static routing. Пересоздать оба файла можно командой:

```bat
runtime\python\python.exe tools\generate_icon.py
```

## Как открыть Telegram export

1. Нажмите `выбрать папку экспорта` в TeleVault.
2. Выберите папку Telegram Desktop export или общую папку, внутри которой есть один или несколько `result.json`.
3. После загрузки слева появится список чатов.

Окно выбора папки в Windows должно открываться поверх app-like окна TeleVault. Если оно всё же не видно, попробуйте `Alt+Tab` как troubleshooting и проверьте `logs\launcher.log`.

При следующем старте TeleVault попробует автоматически открыть последнюю выбранную папку, если она всё ещё доступна.

## Где видна версия

Версия видна в правом верхнем углу интерфейса и в ответе `/api/status`.

Текущая версия: `2.8.8`.
