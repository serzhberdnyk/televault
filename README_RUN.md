# TeleVault: простой запуск на Windows

TeleVault - локальный оффлайн-архив Telegram-переписок. Он открывает экспорт Telegram Desktop на вашем компьютере, показывает переписки и медиа в удобном окне и не отправляет данные наружу.

Текущая версия: `2.9.0`.

## Обычный запуск

1. Откройте папку `TeleVault-v2.9.0` в Проводнике Windows.
2. Дважды нажмите `TeleVault.exe`.
3. Дождитесь окна TeleVault.
4. Нажмите `добавить экспорт`.
5. Выберите папку экспорта Telegram Desktop или общую папку с несколькими экспортами.

Обычному пользователю не нужно открывать терминал, Git или редактор кода.

## Если TeleVault.exe не открылся

1. Дважды нажмите `run_windows.bat` в той же папке.
2. Если браузер не открылся сам, откройте адрес:

```text
http://127.0.0.1:8766
```

Если `TeleVault.exe` показывает ошибку, проверьте файл `logs\launcher.log` рядом с приложением. Для portable-комплекта рядом с `TeleVault.exe` должны лежать:

```text
TeleVault-v2.9.0/
- TeleVault.exe
- app.py
- assets/
- backend/
- frontend/
- runtime/python/python.exe
- run_windows.bat
```

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
dist\TeleVault-v2.9.0\
dist\TeleVault-v2.9.0.zip
```

`build_exe_launcher.bat` перед сборкой проверяет, что package version, `app.py APP_VERSION` и launcher `AppVersion` совпадают.
