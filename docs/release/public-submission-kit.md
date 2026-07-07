# TeleVault public submission kit

## Product Name

TeleVault

## English Tagline

Offline reader for Telegram Desktop exports

## English Short Description

TeleVault turns local Telegram Desktop exports into a private Windows reader for messages, photos, videos, voice notes, audio and files. No Telegram login, cloud sync or uploads.

## Longer English Description

TeleVault is a local offline reader for Telegram Desktop exports. It helps people keep important exported conversations on their own computer and browse them in a cleaner, more comfortable interface than raw export folders.

The app is designed for reading archives, not for chatting. It opens exports that already exist on disk, lets you keep multiple exports in a local library, and makes messages, photos, videos, voice notes, audio and files easier to review.

TeleVault does not require Telegram login, does not upload exports to a server, and does not provide cloud sync. The data stays where the user stores it.

## Short Russian Description

TeleVault — локальный offline reader для экспортов Telegram Desktop. Он помогает хранить несколько экспортов на компьютере и удобно читать сообщения, фото, видео, голосовые, аудио и файлы без Telegram login, cloud/sync и загрузки данных на сервер.

## Key Features

- local library for multiple Telegram Desktop exports
- comfortable chat reading view
- photo viewing inside the archive
- inline video, voice and audio playback
- file list and file opening from the export
- search inside a selected conversation
- clear empty states for first launch, search and media views
- portable Windows zip: unpack and run `TeleVault.exe`

## Privacy And Local-First Points

- works offline with files already exported from Telegram Desktop
- stores data on the user's computer
- does not require Telegram login
- does not require a bot token
- does not upload exports to a cloud service
- does not sync data between devices
- does not include user accounts

## Limitations

- not a Telegram client
- no Telegram login
- no cloud/sync
- works with Telegram Desktop exports
- Windows-first portable app
- does not recover deleted Telegram chats
- opens only files that are present in the selected export folder

## Product Hunt Checklist

- product name: `TeleVault`
- tagline is under 60 characters
- short description is under 260 characters
- use only safe demo screenshots
- prepare a concise maker comment explaining local-first/offline use
- mention that it is a reader for exports, not a Telegram client
- mention Windows portable zip launch: unpack and run `TeleVault.exe`
- do not upload private exports, logs, cache, `user_data`, zip files or exe files as repository docs assets

## AlternativeTo Checklist

- category: Telegram export viewer, offline archive reader or local archive viewer
- platform: Windows
- license/source information: use the current repository metadata
- short description should mention Telegram Desktop exports
- mark cloud/sync/login features as not included
- use only reviewed demo screenshots
- avoid claims that TeleVault connects to Telegram or restores deleted chats

## Screenshot Checklist

Required public PNG files:

- `docs/screenshots/01-library.png`
- `docs/screenshots/02-chat-reading.png`
- `docs/screenshots/03-media-viewer.png`
- `docs/screenshots/04-empty-state.png`

Before publishing, verify every screenshot:

- demo or sanitized content only
- no phone numbers
- no emails
- no usernames
- no private messages
- no local `C:\Users\...` paths
- no personal files
- no tokens, logs, cache or `user_data`
- README references only files that exist
