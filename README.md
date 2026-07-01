# TeleVault

TeleVault - локальный просмотрщик Telegram exports.

Приложение открывает экспортированные папки Telegram Desktop в браузере, показывает переписки и медиа, а данные остаются на компьютере пользователя.

Текущая версия: `2.6.6`.

Статус: desktop/local app preparation. В 2.6.4 добавлен build environment assessment для будущей Windows exe packaging, но exe и installer пока не собираются.

## Возможности

- список чатов
- чтение сообщений
- просмотр фото
- просмотр видео, аудио и файлов
- Telegram stickers
- поиск внутри выбранного чата
- безопасный локальный media endpoint

## Быстрый запуск

На Windows запустите:

```bat
run_windows.bat
```

После запуска откройте `http://127.0.0.1:8766`.

Подробная инструкция: [README_RUN.md](README_RUN.md).

## Документация проекта

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - короткая карта файлов проекта
- [BUILD_NOTES.md](BUILD_NOTES.md) - заметки для будущей подготовки Windows exe
- [BUILD_ASSESSMENT.md](BUILD_ASSESSMENT.md) - assessment текущего runtime, файлов сборки, рисков и packaging candidates

## Зависимости

Сейчас проект старается обходиться без лишних зависимостей и использует стандартную библиотеку Python для локального сервера.

Отдельный `requirements.txt` отсутствует, потому что в текущем состоянии нет внешних Python-библиотек, которые нужно устанавливать вручную.
