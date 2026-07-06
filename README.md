# TeleVault

Локальный оффлайн-архив важных Telegram-переписок.

TeleVault помогает сохранить экспортированные Telegram-переписки на компьютере, открыть их оффлайн и удобно просматривать сообщения, фото, видео, голосовые, аудио и файлы.

Важные переписки должны быть под рукой, даже если доступ к аккаунту, чату или интернету однажды пропадет.

## почему это удобно

- Все хранится локально на вашем компьютере.
- Переписки можно открыть без интернета.
- Не нужен вход в Telegram.
- Экспорт удобно читать в одном интерфейсе, а не искать сообщения в папках, JSON или HTML.
- Фото, видео, голосовые, аудио и файлы доступны рядом с перепиской.
- Можно хранить несколько экспортов в локальной библиотеке.
- Простой portable-запуск на Windows: распаковали zip и запустили `TeleVault.exe`.

## privacy / local-first

- Без облачного аккаунта.
- Без входа в Telegram.
- Без bot token.
- Без синхронизации.
- Без загрузки переписок на сервер.
- Экспорт остается на компьютере пользователя.
- Приложение работает с локальной папкой экспорта Telegram Desktop.

TeleVault - локальное приложение для чтения уже сохраненных экспортов. Это не облачный сервис, не Telegram-клиент и не инструмент синхронизации.

## скриншоты

### чтение переписки

![чтение переписки в TeleVault](docs/screenshots/01-chat-reading.png)

### просмотр фото

![просмотр фото в TeleVault](docs/screenshots/02-photo-viewer.png)

## скачать и запустить

1. Откройте [GitHub Releases](https://github.com/serzhberdnyk/televault/releases).
2. Скачайте последний `TeleVault-vX.Y.Z-windows-x64.zip`.
3. Распакуйте архив в отдельную папку.
4. Запустите `TeleVault.exe`.
5. Выберите папку экспорта Telegram Desktop.
6. Откройте чат из локальной библиотеки.

Для portable-пакета не нужно устанавливать Python, Git или инструменты разработчика.

Если Windows SmartScreen показывает предупреждение для нового exe, выберите `More info` -> `Run anyway`, если доверяете скачанному архиву.

Если `TeleVault.exe` не открывается, запустите `run_windows.bat` из той же папки. Если браузер не открылся автоматически, перейдите на `http://127.0.0.1:8766`.

Если лаунчер сообщает об ошибке, проверьте `logs\launcher.log` рядом с приложением. Если эта папка недоступна для записи, диагностика сохраняется в `%LOCALAPPDATA%\TeleVault\logs\launcher.log`.

## платформы

- Основной пакет: Windows 10/11 x64.
- Windows 7: только legacy / best effort, если опубликован и проверен отдельный legacy-пакет.

Основной пакет для Windows 10/11 не предназначен для Windows 7. Не скачивайте отсутствующие системные DLL с случайных сайтов.

## ограничения

- TeleVault работает с экспортированными данными Telegram Desktop, а не с live-синхронизацией Telegram.
- Приложение не входит в Telegram-аккаунт.
- Приложение не восстанавливает удаленные сообщения из облака Telegram.
- Приложение не загружает архивы онлайн.
- Качество отображения зависит от структуры конкретного Telegram export.

## обратная связь

Если нашли ошибку, создайте [GitHub Issue](https://github.com/serzhberdnyk/televault/issues).

Желательно указать:

- версию TeleVault;
- версию Windows;
- тип экспорта, если это безопасно;
- что ожидали увидеть;
- что произошло.

## english

TeleVault is a local offline archive for important Telegram chats.

It lets you add Telegram Desktop export folders to a local library and browse saved conversations offline, including messages, photos, videos, voice messages, audio and files.

Privacy / local-first:

- no cloud account
- no Telegram login
- no bot token
- no sync
- your exports stay on your computer

Download the latest Windows package from [GitHub Releases](https://github.com/serzhberdnyk/televault/releases), unzip it and run `TeleVault.exe`.

Main package: Windows 10/11 x64.

Windows 7 is legacy / best effort only if a separate legacy package is published and tested.
