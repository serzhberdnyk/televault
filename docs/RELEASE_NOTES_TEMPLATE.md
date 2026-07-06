# TeleVault release notes template

## Purpose

This file is a manual copy-paste template for future GitHub Releases.

- This file is not an automated GitHub release configuration.
- Fill it manually for each public release.
- Do not publish a release until build, package and privacy checks are completed.

## GitHub Release Description Template

Copy this block into the GitHub Release description and replace the placeholders.

```markdown
# TeleVault vX.Y.Z

TeleVault is a local offline archive for important Telegram chats.

## highlights

- short user-facing highlight 1
- short user-facing highlight 2
- short user-facing highlight 3

## download

Download the Windows package:

`TeleVault-vX.Y.Z-windows-x64.zip`

Then:

1. unzip the archive
2. run `TeleVault.exe`
3. add a Telegram Desktop export folder
4. open a chat from your local library

## privacy / local-first

- no cloud account
- no Telegram login
- no bot token
- no sync
- your exports stay on your computer

## supported platforms

- main package: Windows 10/11 x64
- Windows 7: legacy / best effort only if a separate legacy package is published and tested

## known limitations

- works with exported Telegram data, not live Telegram sync
- does not restore deleted Telegram cloud messages
- does not upload chats online

## checks before publishing

- version is synchronized
- app starts
- app closes
- app starts again after closing
- export can be added
- chat can be opened
- messages are visible
- photos open
- video plays
- voice/audio plays
- files open/download when present
- zip contains `TeleVault.exe`
- zip does not contain personal exports/cache/logs/user_data
```

## Writing Notes

- Keep release notes user-facing.
- Do not paste a raw dev-log unless it is useful to users.
- Avoid scary marketing like "Telegram may disappear".
- Avoid promising cloud, sync or live backup.
- Avoid promising full Windows 7 support unless it was tested.
- Mention only features that exist in the release.

## Good Highlights

- Improved local archive library experience
- Cleaner chat reading view
- Better media playback behavior
- Safer Windows relaunch behavior
- Updated public documentation

## Bad Highlights

- Fixed internal variable name in parser
- Refactored random function
- Added enterprise-grade secure AI cloud backup
- Windows 7 is fully supported
