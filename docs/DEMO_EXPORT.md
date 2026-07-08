# TeleVault demo export

`docs/demo/demo-export/` is a minimal synthetic Telegram Desktop JSON export used for safe public screenshots and manual UI checks.

The fixture is intentionally small. It exists only to show the current TeleVault UI without exposing private Telegram data, local machine details, private media or personal filenames.

## Structure

```text
docs/demo/demo-export/
  result.json
  photos/
    photo-example.svg
  files/
    notes-example.txt
  audio/
    voice-note-example.ogg
```

The export uses a full-export style `result.json` with `chats.list` so TeleVault can show several conversations from one selected export folder.

## Demo content

The fixture contains only fake chats and neutral messages:

- `Project Room`
- `Travel Notes`
- `Family Notes`
- `Media Samples`

Covered UI states:

- loaded export with several chats
- chat reading
- reply preview
- edited message metadata
- service notices
- placeholder photo preview
- placeholder photo lightbox
- safe text file attachment
- safe audio UI placeholder
- special-content fallback through a demo poll
- neutral search terms such as `demo` and `checklist`

## Safety rules

The demo export must stay synthetic:

- no real people or real chat names
- no usernames
- no phone numbers
- no email addresses
- no private messages
- no private photos, recordings, documents or screenshots
- no absolute local paths
- no personal filenames
- no tokens, keys, logs, cache or `user_data`

Media references in `result.json` must stay relative to `docs/demo/demo-export/`.

## Packaging caution

This fixture is documentation/demo data. Do not include it in release packages unless a future release task explicitly asks for that and reviews the privacy impact.

Current release/package scripts were not changed for this screenshot refresh.
