# TeleVault: простой запуск на Windows

TeleVault - локальный оффлайн-архив Telegram-переписок. Он открывает экспорт Telegram Desktop на вашем компьютере, показывает переписки и медиа в удобном окне и не отправляет данные наружу.

Текущая версия: `2.9.3`.

## Обычный запуск

1. Откройте папку `TeleVault-v2.9.3` в Проводнике Windows.
2. Дважды нажмите `TeleVault.exe`.
3. Дождитесь окна TeleVault.
4. Нажмите `добавить экспорт`.
5. Выберите папку экспорта Telegram Desktop или общую папку с несколькими экспортами.

Обычному пользователю не нужно открывать терминал, Git или редактор кода.

## Если Windows показывает SmartScreen

Для неподписанного portable exe Windows может показать предупреждение SmartScreen. Если вы скачали TeleVault из ожидаемого релиза GitHub, нажмите `Подробнее`, затем `Выполнить в любом случае`.

## Если TeleVault.exe не открылся

1. Дважды нажмите `run_windows.bat` в той же папке.
2. Если браузер не открылся сам, откройте адрес:

```text
http://127.0.0.1:8766
```

Если `TeleVault.exe` показывает ошибку, проверьте файл `logs\launcher.log` рядом с приложением. Также убедитесь, что папка была полностью распакована из zip. Для portable-комплекта рядом с `TeleVault.exe` должны лежать:

```text
TeleVault-v2.9.3/
- TeleVault.exe
- app.py
- assets/
- backend/
- frontend/
- runtime/python/python.exe
- runtime/python/pythonw.exe
- run_windows.bat
```

Если рядом с exe нельзя создать лог, launcher пишет диагностику в `%LOCALAPPDATA%\TeleVault\logs\launcher.log`.

Windows 7 SP1 x64: legacy / best effort только через отдельную сборку `TeleVault-v2.9.3-win7-legacy-x64.zip`. Основная Windows 10/11 сборка не поддерживает Windows 7. Не скачивайте `api-ms-win-core-path-l1-1-0.dll` отдельно.

## Как выбрать архив

В TeleVault нажмите `добавить экспорт` и выберите папку, которую создал Telegram Desktop при экспорте данных.

Можно выбрать:

- одну папку экспорта
- общую папку, внутри которой лежит несколько экспортов

После загрузки слева появятся переписки. При следующем запуске TeleVault попробует автоматически открыть последнюю выбранную папку, если она всё ещё доступна.

## Где видна версия

Версия видна в правом верхнем углу интерфейса и в ответе:

```text
http://127.0.0.1:8766/api/status
```

## Для разработчика: сборка portable

Создать portable-папку и zip:

```bat
build_portable.bat
```

Создать portable-папку, zip и `TeleVault.exe` launcher:

```bat
build_exe_launcher.bat
```

Результат:

```text
dist\TeleVault-v2.9.3\
dist\TeleVault-v2.9.3.zip
```

`build_exe_launcher.bat` перед сборкой проверяет, что package version, `app.py APP_VERSION`, frontend placeholder, `run_windows.bat` startup text и launcher `kAppVersion` совпадают.

Собрать отдельный Windows 7 legacy runtime и package:

```bat
build_win7_legacy_package.bat
```

Результат:

```text
dist\TeleVault-v2.9.3-win7-legacy-x64\
dist\TeleVault-v2.9.3-win7-legacy-x64.zip
```

Win7 legacy package prepared; requires validation on Windows 7 SP1 x64.
