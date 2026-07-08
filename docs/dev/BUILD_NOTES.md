# Build Notes

Historical note: этот файл был создан в эпоху 2.6.4 как подготовительные заметки перед первым Windows release. Сейчас TeleVault уже имеет portable/launcher-style Windows package flow, поэтому актуальные release-проверки находятся в `docs/release/RELEASE_CHECKLIST.md`.

Подробный historical assessment runtime, файлов для будущей сборки, рисков и packaging candidates находится в [BUILD_ASSESSMENT.md](BUILD_ASSESSMENT.md).

## Цель будущего этапа

Поддерживать Windows package так, чтобы обычный пользователь мог запускать TeleVault без ручной настройки Python.

На момент этой исторической заметки рабочий запуск оставался через:

```bat
run_windows.bat
```

## Historical pre-exe checks

- запуск из чистой папки проекта
- bundled Python или другой способ поставки Python runtime
- отсутствие лишних внешних зависимостей
- доступность статических файлов `frontend`
- доступ к local media endpoint
- folder picker на Windows
- startup vault после перезапуска
- отсутствие ручного ввода пути в UI

## Historical packaging notes

Эти заметки про выбор упаковщика исторические. В проект не добавлены PyInstaller, Nuitka, Electron, Tauri или новые зависимости.

Новые решения по упаковке лучше делать отдельным шагом после проверки текущего release checklist.

## Риски

- доступ к файлам Telegram export после упаковки
- большие чаты и долгий первичный разбор
- media paths с кириллицей, пробелами и encoded URLs
- browser/webview behavior на разных версиях Windows
- antivirus и Windows SmartScreen

## Зависимости

Проект по-прежнему старается обходиться без лишних зависимостей. Отдельный `requirements.txt` отсутствует, потому что сервер использует стандартную библиотеку Python.
