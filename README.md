# TeleVault

TeleVault - локальный оффлайн-архив важных Telegram-переписок.

Приложение открывает папки экспорта Telegram Desktop, собирает переписки, медиа и файлы в удобный локальный интерфейс и не отправляет данные наружу. Архив остаётся на компьютере пользователя и доступен без облака.

Актуальная версия: `v2.9.6`.

Статус v2.9.6: добавлена локальная защита state-changing API `POST` endpoints от внешних origin/referer/host запросов. `GET` endpoints, media endpoint, parser, storage и frontend UI не менялись.

## Возможности

- добавление папки экспорта Telegram через системный диалог
- поддержка одной папки экспорта или общей папки с несколькими экспортами
- список переписок выбранного локального архива
- чтение сообщений выбранной переписки
- просмотр фото, видео, голосовых, аудио, стикеров и файлов из локального архива
- поиск по перепискам и сообщениям открытого архива
- поиск внутри выбранной переписки с переходом к найденному сообщению
- автозагрузка последнего выбранного архива при старте, если папка доступна
- локальная работа без облака и синхронизации

## Быстрый запуск

Основной сценарий - Windows 10/11 x64.

1. Откройте [GitHub Releases](https://github.com/serzhberdnyk/televault/releases).
2. Скачайте portable zip `TeleVault-v2.9.6.zip` из assets нужного релиза.
3. Распакуйте zip в отдельную папку.
4. Запустите TeleVault двойным кликом по файлу:

```bat
TeleVault.exe
```

После запуска нажмите `добавить экспорт` и выберите папку экспорта Telegram Desktop или общую папку с несколькими экспортами.

`run_windows.bat` остаётся fallback/debug-способом запуска. Через `TeleVault.exe` приложение откроется в app-like окне Edge/Chrome, если доступно; иначе откроется обычный браузер.

## Windows compatibility

Recommended: Windows 10/11 x64 через основную portable-сборку.

Legacy / best effort: Windows 7 SP1 x64 только через отдельную win7 legacy-сборку, если она отдельно опубликована как release asset.

Основная сборка v2.9.6 предназначена для Windows 10/11 и не является официальной Windows 7-сборкой. Win7 legacy package - отдельный best-effort asset, если он опубликован для конкретного релиза; его нужно проверять отдельно на Windows 7 SP1 x64.

Не скачивайте отсутствующие DLL, включая `api-ms-win-core-path-l1-1-0.dll`, с случайных сайтов и не копируйте их в `System32` или `SysWOW64`.

Подробная инструкция: [README_RUN.md](README_RUN.md).
Инструкция по Win7 legacy-сборке: [README_WIN7.md](README_WIN7.md).

## Документация проекта

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - короткая карта файлов проекта
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) - чеклист для подготовки и проверки Windows-комплекта
- [EXE_PACKAGING_PLAN.md](EXE_PACKAGING_PLAN.md) - план launcher-style exe preview и будущих packaging-этапов
- [BUILD_NOTES.md](BUILD_NOTES.md) - заметки для будущей подготовки Windows exe
- [BUILD_ASSESSMENT.md](BUILD_ASSESSMENT.md) - assessment текущего runtime, файлов сборки, рисков и packaging candidates
- [README_WIN7.md](README_WIN7.md) - ограничения отдельной Windows 7 legacy-сборки

## Зависимости

Сейчас проект старается обходиться без лишних зависимостей и использует стандартную библиотеку Python для локального сервера.

Отдельный `requirements.txt` отсутствует, потому что в текущем состоянии нет внешних Python-библиотек, которые нужно устанавливать.

`requirements-win7.txt` существует только для Windows 7 legacy build profile. Сейчас он не содержит внешних зависимостей, потому что TeleVault использует стандартную библиотеку Python.
