# TeleVault

**TeleVault — офлайн-ридер экспортов Telegram Desktop для Windows 10/11.**

Открыл папку экспорта → добавил в библиотеку → читаешь переписки и медиа без интернета.

TeleVault работает с уже созданными экспортами Telegram Desktop. Это не Telegram-клиент, не облако и не синхронизация.

## что умеет

* добавлять несколько экспортов в локальную библиотеку;
* открывать переписки из Telegram Desktop exports;
* удобно читать сообщения;
* просматривать фото, видео, голосовые, аудио и файлы;
* искать внутри выбранной переписки;
* показывать понятные ошибки, если экспорт или медиафайл недоступны;
* запускаться как portable-приложение: распаковал zip и открыл `TeleVault.exe`.

## privacy / local-first

TeleVault работает с файлами на твоём компьютере.

Приложение не требует:

* входа в Telegram;
* bot token;
* облачного аккаунта;
* синхронизации;
* отправки экспортов на внешний сервер.

## как запустить

1. скачай последнюю версию в разделе **Releases**.
2. распакуй архив `TeleVault-vX.X.X.zip` в отдельную папку.
3. запусти `TeleVault.exe`.
4. выбери папку экспорта Telegram Desktop.
5. добавь экспорт в библиотеку и открой нужную переписку.

## какой экспорт нужен

TeleVault рассчитан на экспорт, созданный в Telegram Desktop.

Рекомендуется экспортировать данные в формате **JSON** и сохранять медиафайлы вместе с перепиской.

## платформы

* Windows 10 / 11;
* portable zip, без установки.

## ограничения

TeleVault не получает данные из Telegram и не восстанавливает удалённые чаты.

Он открывает только те экспортированные файлы, которые уже есть на компьютере.

В проект не входят:

* Telegram login;
* cloud/sync;
* аккаунты пользователей;
* AI;
* теги, заметки, избранное и статистика.

## english

**TeleVault is an offline reader for Telegram Desktop exports.**

It lets you add local Telegram exports to a library and read messages, photos, videos, voice messages, audio and files on your Windows PC without logging in to Telegram or syncing data to the cloud.
