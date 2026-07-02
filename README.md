# TeleVault

TeleVault - локальный просмотрщик Telegram exports.

Приложение открывает экспортированные папки Telegram Desktop в браузере, показывает переписки и медиа, а данные остаются на компьютере пользователя.

Текущая версия: `2.8.1`.

Статус: 2.8.1 полирует Windows `TeleVault.exe` launcher UX для portable-комплекта: запуск без видимой консоли, app-like окно Edge/Chrome при наличии и `run_windows.bat` как fallback/debug. Это не installer и не one-file exe: рядом с launcher должны лежать `app.py`, `backend/`, `frontend/` и `runtime/python/`.

## Возможности

- выбор папки экспорта через системный диалог
- открытие одной папки Telegram export или общей папки, внутри которой лежит несколько `result.json`
- список чатов из выбранного экспорта
- просмотр сообщений выбранного чата
- media tabs: photo, video, audio, sticker и file
- global sidebar search по названиям чатов и сообщениям открытого экспорта
- in-chat search внутри выбранного чата с переходом к найденному сообщению
- автозагрузка последнего выбранного vault при старте, если папка доступна
- локальный просмотр медиа без отправки данных наружу

## Быстрый запуск

На Windows в portable-папке 2.8.1 обычный запуск - двойной клик по файлу:

```bat
TeleVault.exe
```

`run_windows.bat` остаётся fallback/debug-способом запуска. Через `TeleVault.exe` приложение откроется в app-like окне Edge/Chrome, если доступно; иначе откроется обычный browser fallback.

Подробная инструкция: [README_RUN.md](README_RUN.md).

## Документация проекта

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - короткая карта файлов проекта
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) - чеклист для подготовки и проверки Windows-комплекта
- [EXE_PACKAGING_PLAN.md](EXE_PACKAGING_PLAN.md) - план launcher-style exe preview и будущих packaging-этапов
- [BUILD_NOTES.md](BUILD_NOTES.md) - заметки для будущей подготовки Windows exe
- [BUILD_ASSESSMENT.md](BUILD_ASSESSMENT.md) - assessment текущего runtime, файлов сборки, рисков и packaging candidates

## Зависимости

Сейчас проект старается обходиться без лишних зависимостей и использует стандартную библиотеку Python для локального сервера.

Отдельный `requirements.txt` отсутствует, потому что в текущем состоянии нет внешних Python-библиотек, которые нужно устанавливать.
