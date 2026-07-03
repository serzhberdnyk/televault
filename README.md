# TeleVault

TeleVault - локальный оффлайн-архив Telegram-переписок.

Приложение открывает папки экспорта Telegram Desktop, собирает переписки, медиа и файлы в удобный локальный интерфейс и не отправляет данные наружу. Архив остаётся на компьютере пользователя и доступен без облака.

Текущая версия: `2.9.3`.

Статус: 2.9.3 добавляет отдельный Windows 7 legacy build profile. Основная Windows 10/11 сборка остаётся на текущем runtime; parser, media endpoint, playback logic и search logic не менялись.

## Возможности

- добавление папки экспорта через системный диалог
- поддержка одной папки экспорта или общей папки с несколькими экспортами
- список сохранённых переписок
- чтение сообщений выбранной переписки
- просмотр фото, видео, аудио, стикеров и файлов из локального архива
- поиск по перепискам и сообщениям открытого архива
- поиск внутри выбранной переписки с переходом к найденному сообщению
- автозагрузка последнего выбранного архива при старте, если папка доступна
- локальная работа без отправки данных наружу

## Быстрый запуск

Основной сценарий - Windows 10/11. Скачайте portable zip, распакуйте его и запустите TeleVault двойным кликом по файлу:

```bat
TeleVault.exe
```

`run_windows.bat` остаётся fallback/debug-способом запуска. Через `TeleVault.exe` приложение откроется в app-like окне Edge/Chrome, если доступно; иначе откроется обычный браузер.

## Windows compatibility

Recommended: Windows 10/11 x64 через основную portable-сборку.

Legacy / best effort: Windows 7 SP1 x64 только через отдельную сборку `TeleVault-v2.9.3-win7-legacy-x64.zip`.

Основная сборка не поддерживает Windows 7: она остаётся на текущем Python runtime для Windows 10/11. Win7 legacy-сборка использует отдельный Python 3.8 legacy runtime.

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
