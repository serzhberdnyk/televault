# TeleVault public screenshot capture guide

Use this guide to create or replace public PNG screenshots for GitHub, AlternativeTo and Product Hunt.

Committed public screenshots must be manually reviewed and approved before publishing.

## Output Files

Save the reviewed screenshots as:

- `docs/screenshots/01-library.png`
- `docs/screenshots/02-chat-reading.png`
- `docs/screenshots/03-media-viewer.png`
- `docs/screenshots/04-media-in-library.png`

Do not add placeholder images. Add these files only after the visible content is demo or sanitized.

The currently committed PNG files are historical. Replace them only after a separate screenshot task with reviewed demo/sanitized content.

## Safety Rules

- use only demo or sanitized Telegram Desktop exports
- do not show phone numbers
- do not show emails
- do not show usernames
- do not show private messages
- do not show real private media
- do not show local paths such as `C:\Users\...`
- do not show personal filenames
- do not show tokens, logs, cache, `user_data` or developer folders
- crop or retake the screenshot if anything is uncertain

## Recommended Demo Data

Use short neutral demo chats and fake names, for example:

- `Alice`
- `Bob`
- `Family Archive`
- `Work Notes`

Use neutral message text about travel plans, project notes, grocery reminders, demo photos or placeholder files. Use relative demo filenames such as `photo-example.jpg`, `voice-example.ogg` and `notes-example.txt`.

## Required Screens

### 1. Library

File: `docs/screenshots/01-library.png`

Capture the selected Telegram Desktop export with several demo conversations visible. The screenshot should communicate that TeleVault opens a local export folder and makes its chats readable.

Before saving, verify that no real chat names, local paths, usernames, phones, emails, logs, personal folders, removed archive manager controls or sidebar archive status cards are visible.

### 2. Chat Reading

File: `docs/screenshots/02-chat-reading.png`

Capture the main reading view with a selected demo chat and several short neutral messages. Include ordinary text and, if safe, one demo attachment preview.

Before saving, verify that every visible message is fake or sanitized and that sender names are demo names only.

### 3. Media Viewer

File: `docs/screenshots/03-media-viewer.png`

Capture a safe media view: photo lightbox, video preview, voice/audio message or file/media tab. Use only placeholder media or media created specifically for the demo.

Before saving, verify that no real faces, private photos, documents, filenames or chat text are visible.

### 4. Media In Library

File: `docs/screenshots/04-media-in-library.png`

Capture media thumbnails or media messages inside a safe demo chat. The screenshot should show that photos, videos, voice messages, audio or files are readable inside the archive.

Before saving, verify that no real private media, filenames, chat text, machine path, export name or private folder name is visible.

## Manual Capture Steps

1. Create or choose a reviewed demo Telegram Desktop export.
2. Launch TeleVault locally.
3. Load only the demo export.
4. Resize the app window to a clean, readable desktop size.
5. Capture each required screen as PNG.
6. Save the files with the exact names listed above.
7. Review every PNG at full size before committing.

## Pre-Commit Checklist

- all screenshot files are PNG
- filenames match the required list
- only demo or sanitized content is visible
- no phone numbers, emails or usernames are visible
- no private messages or personal media are visible
- no `C:\Users\...` paths are visible
- no logs, cache, `user_data`, tokens or local developer details are visible
- README links only to screenshots that actually exist
