# TeleVault screenshots guide

This guide explains which public screenshots TeleVault needs and how to capture them safely for GitHub, Product Hunt, Show HN, AlternativeTo, and similar pages.

## Goal

Create clear product screenshots without exposing personal Telegram chats, local machine details, private files, or real media.

## Safety Rules

- use only demo/fake Telegram exports
- do not use personal chats
- do not show real names, usernames, phone numbers, emails or avatars
- do not show private messages or real media
- do not show local file paths like `C:\Users\...`
- do not show personal filenames
- do not show logs, cache, user_data or developer machine details
- blur or crop anything uncertain
- when in doubt, do not publish the screenshot

## Recommended Demo Content

Use small, neutral demo data that looks realistic but contains no personal content.
See the [demo export plan](DEMO_EXPORT.md) before creating any fake export data.

- fake chat names: Alice, Bob, Family Archive, Work Notes
- neutral messages about travel, photos, project notes, reminders
- placeholder photos/videos/audio/files only
- example filenames: `photo-example.jpg`, `voice-example.ogg`, `notes-example.txt`
- no personal content

## Required Screenshots

Capture at least these five screenshots.

### 1. Library Screen

- purpose: show that TeleVault can keep several Telegram exports in a local library
- what to show: empty or populated archive screen with demo export names only
- what to avoid: real chat names, real export paths, local usernames, cache or log folders
- suggested filename: `01-library.png`

### 2. Chat Reading View

- purpose: show the main reading experience for Telegram messages
- what to show: a clean demo conversation with short neutral messages
- what to avoid: personal messages, real names, usernames, avatars, phone numbers, emails
- suggested filename: `02-chat-reading.png`

### 3. Photo Or Media Preview

- purpose: show photo/media viewing inside TeleVault
- what to show: placeholder media opened in the preview or lightbox
- what to avoid: real photos, faces, documents, screenshots from private chats
- suggested filename: `03-photo-viewer.png`

### 4. Media Messages

- purpose: show that voice, audio, video and file messages are readable in the archive
- what to show: demo voice/audio/video/file items with placeholder names
- what to avoid: personal filenames, real recordings, private files, real thumbnails
- suggested filename: `04-media-messages.png`

### 5. Conversation Search

- purpose: show search inside a conversation
- what to show: a neutral query and matching demo messages
- what to avoid: sensitive keywords, personal names, emails, phone numbers, private message text
- suggested filename: `05-search.png`

## Optional Screenshots

- first launch / empty state
- add export flow
- files/media view if visually useful
- error/empty state if it looks polished

## Visual Quality Notes

- use a clean app window
- avoid tiny unreadable screenshots
- keep window size consistent
- avoid desktop clutter
- prefer light/dark mode only if it matches current product design
- crop browser/windows chrome only if it improves clarity
- keep screenshots honest: no fake UI features that do not exist

## Future Location

When screenshots are ready, place them in:

`docs/screenshots/`

Do not add placeholder images or screenshots until safe demo data exists.

## Pre-Publish Checklist

- demo data only
- no real identities
- no local paths
- no private media
- no cache/log/user_data
- image filenames are clean
- README references only screenshots that actually exist
- screenshots match current TeleVault version
