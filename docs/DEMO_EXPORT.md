# TeleVault demo export plan

## Purpose

The demo export is a future fake Telegram Desktop export for safe public screenshots and manual checks. It should let TeleVault show realistic archive reading, media preview, and search behavior without exposing personal chats, local machine details, private files, or real media.

This document is only a plan. The demo export does not exist yet.

## Current parser assumptions

- Supported export format: Telegram Desktop JSON export with one or more `result.json` files.
- HTML export support: not confirmed yet. The current backend searches for `result.json` and reads JSON only.
- Expected entry files: the selected folder may be a single export folder containing `result.json`, or a parent folder containing several exports. TeleVault scans recursively for `result.json` and loads each readable file as a chat.
- Minimal JSON shape: a top-level object with a `messages` array. `name` or `title` is used for the chat title when present; otherwise the export folder name is used.
- Expected media paths: message media is read from `file`, `photo`, or `thumbnail` fields. Paths are expected to be relative to the folder that contains that `result.json`.
- Media classification: file extension, `mime_type`, `media_type`, and whether the field is `file`, `photo`, or `thumbnail` are used to classify image, video, audio, sticker, or file messages.
- Media safety: media URLs are served only from inside the selected export root. Absolute paths or paths outside that root should not be used in demo data.
- Any uncertainty: not confirmed yet whether the proposed media folder names below match every Telegram Desktop export variant. The current parser follows the relative paths written in `result.json` rather than requiring fixed folder names.

## Recommended safe demo content

Use only fake, neutral chats:

- `Alice`
- `Bob`
- `Family Archive`
- `Work Notes`

Use short, ordinary messages:

- travel plans, such as train times, hotel check-in, or packing reminders
- project notes, such as draft status, meeting agenda, or follow-up items
- grocery reminders, such as milk, apples, bread, or coffee
- photo placeholder messages, such as "Here is the photo placeholder."
- voice note placeholder messages, such as "Voice note placeholder for the demo."
- file attachment placeholder messages, such as "Attached notes-example.txt for review."

Do not include:

- real people
- real chats
- real usernames
- real phone numbers
- real emails
- real avatars
- private media
- real file paths
- private filenames

## Proposed minimal export structure

Do not create this folder in this patch. A future fake fixture could use a small JSON export with relative media paths:

```text
demo-export/
  result.json
  photos/
    photo-example.jpg
  video_files/
    video-example.mp4
  voice_messages/
    voice-example.ogg
  audio_files/
    audio-example.mp3
  files/
    notes-example.txt
```

For several fake chats, use separate export folders under one parent folder so TeleVault can exercise recursive `result.json` loading:

```text
demo-library/
  alice/
    result.json
    photos/
  bob/
    result.json
    voice_messages/
  family-archive/
    result.json
    video_files/
  work-notes/
    result.json
    files/
```

The future `result.json` files should reference media with relative paths only, for example `photos/photo-example.jpg` or `files/notes-example.txt`.

## Media placeholders

Future placeholder files should be clearly fake and safe:

- `photo-example.jpg`
- `video-example.mp4`
- `voice-example.ogg`
- `audio-example.mp3`
- `notes-example.txt`

Do not add these files yet. Do not use real photos, recordings, documents, thumbnails, avatars, screenshots, or private filenames.

## Screenshot coverage

A safe demo export should cover:

- library screen with multiple fake exports loaded
- chat reading with short neutral messages
- photo preview or lightbox with a placeholder image
- voice, audio, video, and file messages with placeholder media
- search inside a conversation using a neutral query

## Release/package caution

- The demo export must not be bundled into the user release zip unless explicitly intended.
- The release zip must not contain personal exports, cache, logs, or `user_data`.
- Any demo data must be clearly fake, safe, and reviewed before public use.
- Current portable packaging appears allowlist-based and does not include `docs/` or arbitrary fixture folders by default, but this should be rechecked before any release packaging change.

## Next implementation step

A later patch can:

- create a minimal fake demo export fixture
- verify TeleVault can import it
- visually review the app with that fixture
- take screenshots manually after privacy and visual review
