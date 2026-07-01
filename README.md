# TeleVault

TeleVault is a personal vault for Telegram exports.
It turns static Telegram export folders into a permanent, readable and private local archive.

TeleVault does not replace Telegram. It preserves it.

TeleVault — личное хранилище Telegram.
Оно превращает экспортированные папки Telegram в удобную локальную коллекцию переписок, фотографий, видео, голосовых и файлов.

Чаты, сообщения или аккаунты могут исчезнуть из Telegram, но сохранённые экспорты останутся в вашем хранилище.

## Текущие возможности

- несколько экспортов в одном хранилище
- просмотр сообщений
- просмотр фото, видео, аудио и файлов
- photo lightbox
- Telegram-like интерфейс
- локальная работа без отправки данных наружу
- безопасное открытие медиа только внутри выбранной папки экспорта

## Запуск на Windows

1. Распакуй архив
2. Открой папку `telegram_export_viewer_v2`
3. Дважды нажми `run_windows.bat`
4. В браузере открой `http://127.0.0.1:8766`
5. Нажми **добавить в хранилище** и укажи общую папку с экспортами Telegram

## Структура экспортов

Можно выбрать папку, внутри которой лежат несколько экспортов:

```text
telegram_exports/
  chat_1/result.json
  chat_2/result.json
  chat_3/result.json
```

TeleVault найдёт `result.json`, покажет чаты, медиа и базовые сводки по сохранённому локальному архиву.