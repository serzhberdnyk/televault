# TeleVault screenshots

Public screenshots in `docs/screenshots/` were refreshed from the current TeleVault UI after 2.9.28.

They were captured only with the synthetic demo export in `docs/demo/demo-export/`. The demo export contains fake names, neutral messages and placeholder media created for documentation screenshots. It does not contain real Telegram data.

## Current screenshots

- `01-library.png` - loaded demo export with the add-export button, conversation search and chat list.
- `02-chat-reading.png` - `Project Room` chat with reply preview, edited metadata and service notices.
- `03-media-viewer.png` - safe placeholder photo opened in the lightbox viewer.
- `04-media-in-library.png` - `Media Samples` chat showing placeholder photo, file and audio UI.

## Capture notes

- App version shown by the UI: `v2.9.28`.
- Source export: `docs/demo/demo-export/`.
- Runtime state: captured with isolated temporary app settings so no saved personal exports were loaded.
- Browser viewport: default in-app browser viewport.
- No package, release, tag or app-version change was made for this screenshot refresh.

## Privacy review

Checked before commit:

- demo/synthetic content only
- no real chat names or private messages
- no phone numbers
- no email addresses
- no usernames
- no `C:\Users\...` or other visible local paths
- no private media or personal filenames
- no tokens, keys, logs, cache or `user_data`
- no old sidebar `Архивы` block
- no old `архив открыт` card

## Refresh checklist

When these screenshots are refreshed again:

1. Use only `docs/demo/demo-export/` or another reviewed synthetic export.
2. Load the export in an isolated app settings directory.
3. Capture the four states listed above.
4. Open every PNG and visually check the privacy list.
5. Confirm README screenshot links, if any, point to existing files.
6. Run `git diff --check`.
