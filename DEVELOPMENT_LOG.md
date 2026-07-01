# TeleVault development log

TeleVault — minimal personal vault for Telegram exports.

Current focus:
- stable opening of Telegram exports
- clean conversation list
- comfortable chat reading
- reliable photo/video/audio/file viewing
- polished minimal desktop-like UI
- later Windows exe packaging

Do:
- improve core stability
- improve reading experience
- improve media viewing
- improve empty states
- improve visual quality

Do not add:
- Timeline
- Insights
- People tab
- tags
- favorites
- notes
- AI
- statistics
- global advanced search
- new major sections

Rule:
Every change should make storing, opening, reading or viewing Telegram exports more convenient or pleasant.

After every future patch:
- update APP_VERSION
- update CHANGELOG.md
- update DEVELOPMENT_LOG.md
- write what changed and what to test manually

## 2.6.5 - voice audio layout fix

Changed:
- gave inline voice/audio cards a definite responsive width so native browser audio controls do not shrink to their minimum vertical capsule
- kept audio cards capped at the existing 430px visual width and allowed them to shrink on narrow viewports without horizontal overflow
- kept the native audio element, `preload="none"` and lazy audio metadata loading unchanged
- kept single active regular media playback unchanged; sticker `.webm` previews remain excluded from that logic
- left frontend audio markup, backend parsing, `/media`, Range handling, URL encoding, security checks and storage format unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.5
- confirm /api/status returns 2.6.5
- confirm startup vault autoloads when the saved export path is available
- open a chat with Telegram voice messages and confirm each voice message renders as a usable horizontal audio player
- confirm audio controls do not collapse into a narrow vertical block and do not overflow the message bubble on desktop or narrow viewports
- confirm audio starts, pauses, shows metadata/duration after lazy metadata loading and still shows the missing-audio fallback when needed
- start audio after audio, audio after video and video after audio to confirm only one regular media player continues playing
- confirm date separators, incoming/outgoing alignment, create_channel/photo update/pinned service notices, photo lightbox, video poster/playback/seeking, stickers, files/media tabs, empty states and storage status still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work
- confirm browser console warnings/errors are absent or explained

## 2.6.4 - Windows build environment assessment

Changed:
- added BUILD_ASSESSMENT.md as the focused assessment for future Windows exe packaging
- documented the current `run_windows.bat` launch path, local server, default browser UI, folder picker, startup vault settings and frontend static files
- documented that the project currently has no bundled Python runtime, `requirements.txt` or `package.json`
- documented the current Python imports and that the runtime uses the Python standard library plus local backend modules
- documented files to include and exclude from a future build
- documented PyInstaller, Nuitka and Python embeddable runtime candidates with risks and checks
- added the 2.7.0 first Windows exe prototype as the next build step
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text
- kept app startup behavior, port logic, folder picker, `/media`, parser, storage format and frontend rendering unchanged

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.4
- confirm /api/status returns 2.6.4
- confirm startup vault autoloads when the saved export path is available
- confirm the sidebar shows the conversation list and conversation search works
- confirm a chat opens by click
- confirm create_channel, photo update and pinned service notices still render correctly
- confirm date separators, photo lightbox, video poster/duration/playback, audio cards, stickers, files/media tabs and single active media playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work
- confirm browser console warnings/errors are absent or explained

## 2.6.3 - sidebar controls cleanup

Changed:
- removed the visible chat sort dropdown from the sidebar
- kept the existing chat sorting helper and newest-first default as the internal sidebar order
- kept conversation search visible and tightened the sidebar search-to-list spacing
- kept storage status, folder picker, chat opening, service notices, media rendering and `/media` behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.3
- confirm /api/status returns 2.6.3
- confirm startup vault autoloads when the saved export path is available
- confirm the sidebar shows storage status and the "добавить в хранилище" action
- confirm conversation search is visible, returns matches, shows the empty state with no matches, and restores the full list when cleared
- confirm the chat sort dropdown is no longer visible and no empty space is left in its place
- confirm the conversation list remains newest-first and opens chats by click
- confirm create_channel, photo update and pinned service notices still render correctly
- confirm date separators, photo lightbox, video, audio, stickers, files/media tabs and single active media playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.6.2 - channel photo service message rendering

Changed:
- added targeted parser support for Telegram photo update service events
- confirmed the NOT BAND! export uses `action: edit_group_photo` for the 2025-01-09 channel photo update event
- preserved the real `service_action` while rendering `service_text: Фотография канала обновлена` when `actor_id` identifies a channel
- reused existing photo/media URL fields so available service photos can render through the existing `/media` path
- rendered photo update service events as compact centered notices with an optional circular preview
- kept photo update service events out of photo/video/audio/file media cards because they remain system events
- kept `create_channel`, `pin_message`, regular media rendering, `/media`, Range handling, URL encoding, security checks and storage format unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.2
- confirm /api/status returns 2.6.2
- confirm startup vault autoloads when the saved export path is available
- open NOT BAND! around 9 January 2025 and confirm the photo update event shows "Фотография канала обновлена" instead of generic "системное событие Telegram"
- confirm the event shows a circular preview when `photos/photo_8@09-01-2025_10-16-15.jpg` is available
- confirm a missing service photo leaves the text notice visible without a broken image
- confirm create_channel and pinned service notices still render correctly
- confirm date separators, chat search, media tabs, regular messages, incoming/outgoing alignment, stickers, photo lightbox, video playback, audio cards, files and single active playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.6.1 - empty Telegram service messages fix

Changed:
- added explicit parser metadata for Telegram service events without regular text
- preserved the real `create_channel` action from the NOT BAND! export as `service_kind: create_channel`
- rendered channel/chat creation and unknown empty service events as compact centered system notices
- kept pinned service notices on the existing `pin_message` path
- kept `/media`, Range handling, URL encoding, security checks, storage format and media rendering paths unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.1
- confirm /api/status returns 2.6.1
- confirm startup vault autoloads when the saved export path is available
- open NOT BAND! around 11 October 2024 and confirm the `create_channel` service event is a compact system notice, not an empty bubble
- confirm pinned service notices still render as compact centered notices
- confirm date separators, regular text messages, incoming/outgoing alignment, chat search and media tabs still work
- confirm stickers, photo lightbox, video poster/duration/playback, audio cards, files and single active playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.6.0 - Windows release preparation notes

Changed:
- updated README.md as a short product overview for the local desktop app
- updated README_RUN.md with the current Windows startup flow and v2.6.0
- added PROJECT_STRUCTURE.md as a short map of the main project files
- added BUILD_NOTES.md with preparation notes for future Windows exe packaging
- documented that 2.6.0 does not build an exe, add an installer or add dependencies
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.6.0
- confirm /api/status returns 2.6.0
- confirm startup vault autoloads when the saved export path is available
- confirm conversation list, chat search/sort, chat click, date separators, empty states and storage status still work
- confirm stickers, photo lightbox, video poster/duration/playback, audio cards, pinned service notices and single active playback still work
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.27 - native video duration metadata fix

Changed:
- removed the separate video duration badge UI and its frontend formatting helpers/styles
- added lazy metadata loading for regular native video elements using the same cautious pattern as audio metadata loading
- kept rendered regular videos lightweight with `preload="none"` until a video is visible/nearby, hovered, focused or played
- excluded Telegram sticker videos from regular video metadata loading by leaving them on the sticker render path and reusing regular-media checks
- kept regular video poster/thumbnail selection, playback, seeking, width clamp and media fallback behavior unchanged
- kept audio lazy metadata from 2.5.24 unchanged
- left backend parsing, `/media`, Range handling, URL encoding, security checks, storage format and performance cache unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.27
- confirm /api/status returns 2.5.27
- open regular videos and confirm there is no separate duration badge over the preview
- confirm visible/nearby regular videos switch from `preload="none"` to `preload="metadata"` lazily and native controls can show duration after metadata loads
- confirm a big video tab does not set metadata preload on every video at once
- confirm regular video poster, playback, seeking and 206 Partial Content still behave normally
- confirm `.webm` stickers still autoplay loop muted without controls and do not use regular video lazy metadata
- confirm `.webp` stickers, `.tgs` fallback, photo lightbox, audio cards, files, pinned service notices and single active playback still work
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.26 - video duration badge

Changed:
- added a compact frontend duration badge for regular video previews when Telegram export metadata provides `duration_seconds`
- kept the existing parser data shape because `duration_seconds` was already passed through from Telegram export messages
- kept regular video playback, seeking, `preload="none"` and poster selection unchanged
- kept sticker rendering unchanged, including `.webm` Telegram stickers as autoplay loop muted videos without controls
- left `/media`, Range handling, URL encoding, security checks, storage format and performance cache unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.26
- confirm /api/status returns 2.5.26
- open a regular video with `duration_seconds` and confirm a small dark duration badge appears over the preview
- confirm videos without duration do not show a false 0:00 badge
- confirm video poster, playback, seeking, bubble width clamp and media fallbacks still behave normally
- confirm `.webm` stickers, `.webp` stickers, `.tgs` fallback, photo lightbox, audio cards, files, pinned service notices and single active playback still work
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.25 - project safety checkpoint

Changed:
- restored git tracking for the project after the previous empty/broken `.git` state
- added `.gitignore` for Python caches, local environments, temporary files, zip backups and synthetic QA exports
- added `README_RUN.md` with a short Windows run guide
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text
- kept frontend behavior, backend behavior, parser logic, `/media`, Range handling, media rendering and storage format unchanged

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.25
- confirm /api/status returns 2.5.25
- confirm startup vault autoload still works
- confirm conversation list, chat search, sorting, date separators, empty states and storage status still behave normally
- confirm stickers, photo lightbox, video thumbnails, audio cards, files, pinned service notices and single active playback still behave normally
- confirm manual path input and the old load button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.24 - audio card polish

Changed:
- wrapped regular audio controls in a compact dark audio body that matches existing media cards better
- added a compact filename link for audio cards when Telegram export data provides a media name/path
- added lazy regular audio metadata loading so visible/nearby audio can show duration more reliably without preloading every audio in a large chat at once
- kept regular video preload/poster behavior unchanged with `preload="none"` and existing poster selection
- kept sticker video autoplay/loop/muted behavior, media fallbacks, photo lightbox, files, pinned notices and single active playback logic unchanged
- left backend parsing, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.24
- confirm /api/status returns 2.5.24
- open chats with audio and confirm audio cards look compact and dark, audio starts, duration appears after metadata loads and no false fallback appears
- start audio after audio, audio after video and video after audio to confirm only one regular media player continues playing
- confirm regular video thumbnails, video seeking, stickers, photo lightbox, files, pinned service notices, date separators and empty states still behave normally
- confirm missing audio still shows "аудио недоступно"
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.23 - pinned notice visual polish

Changed:
- made pinned service notices narrower, lighter and centered without using regular message bubble styling
- removed the decorative service marker dot because it did not carry useful state
- shortened frontend pinned previews to a cleaner display label with `…` and a preference for the first meaningful segment
- kept backend/parser, service message data format, search logic, media tabs, `/media`, Range handling, URL encoding and security checks unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.23
- confirm /api/status returns 2.5.23
- open a chat with pinned service events and confirm the notice is centered, compact, readable and not styled as an incoming/outgoing bubble
- confirm long pinned previews use a clean `…` truncation and do not stretch the chat width
- confirm date separators, ordinary messages, incoming/outgoing alignment, stickers, photo lightbox, video thumbnails, regular video/audio/files, media fallbacks and single active playback still behave normally
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.22 - pinned service messages rendering

Changed:
- added parser support for Telegram `type: service` / `action: pin_message` events
- preserved service event id, date/date_unixtime, actor/actor_id, action and pinned `message_id`
- built a per-chat message id map so pinned message previews resolve without scanning the chat for every service event
- rendered pinned events as compact centered system notices instead of regular incoming/outgoing bubbles
- included service actor and pinned preview fields in in-chat search text
- left `/media`, Range handling, media URL encoding, security checks, stickers, photo lightbox, video thumbnails, audio/files and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.22
- confirm /api/status returns 2.5.22
- open the saved vault and confirm chats still autoload and open by click
- open an export with `pin_message` service events and confirm the event shows actor plus preview when the referenced message exists
- confirm a missing referenced message falls back to "закреплено сообщение" / actor + "сообщение"
- confirm date separators, in-chat search, sender filter and media tabs still behave normally
- confirm stickers, .webp/.webm/.tgs, photo lightbox, video thumbnails, regular video/audio/files, media fallbacks and single active playback still work
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.21 - video poster preview restore

Changed:
- restored regular video poster previews by using existing Telegram export `thumbnail_url` first and `photo_url` second
- kept regular video `src` on the original `/media` video URL with `controls` and `preload="none"`
- left backend parsing, `/media`, Range handling, media URL encoding, sticker rendering, photo lightbox, audio/files and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.21
- confirm /api/status returns 2.5.21
- open a regular video with a Telegram export thumbnail and confirm the poster is visible before pressing play
- confirm the same video plays, seeks with 206 Partial Content, stays inside the message bubble and still opens through the original media link
- confirm a regular video without a thumbnail remains playable and does not show the unavailable fallback unless the video itself is missing
- confirm .webm sticker autoplay loop muted without controls, .webp stickers, .tgs fallback, photo lightbox, audio/files and single active media playback still behave normally
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.20 - large chat performance polish

Changed:
- measured the largest available saved chat (`катя`, 8742 messages / 2353 media) before changing the render path
- reused preloaded chatCache data for opening chats, in-chat search and media tab switching instead of refetching `/api/chat` for already indexed chats
- consolidated sender/search/media filtering into one frontend pass per render
- avoided rebuilding the sender filter when the sender list did not change
- added an O(1) photo-context index so photo/lightbox lookup does not scan the photo list for every rendered media item
- added opt-in console performance logging behind `localStorage.setItem('televault:perf', '1')`
- kept backend parsing, `/media`, Range handling, URL encoding, security checks, stickers, photo/video/audio/file rendering, lightbox, date separators and empty states unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.20
- confirm /api/status returns 2.5.20
- confirm the last saved vault still autoloads from settings
- confirm the conversation list, conversation search and sorting still work
- open the smallest and largest available chats and confirm they render without long UI stalls
- search inside the largest chat, clear search, and confirm empty states/date separators remain correct
- switch all/photo/video/audio/file tabs and confirm the rendered content matches the active tab without console errors
- confirm sticker visual mode, .webp stickers, .webm sticker autoplay loop muted without controls, .tgs fallback, photo lightbox, regular video/audio/files, media fallback states and single active playback still work
- confirm manual path input and a separate "загрузить" button did not return
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.19 - library/storage polish

Changed:
- added a compact sidebar library status with the current export folder, chat count, message count and loading-error count
- made long storage paths ellipsize in the existing sidebar status instead of stretching the layout
- made the no-storage welcome state say that no storage is selected and keep the existing "добавить в хранилище" action
- added calmer loading copy while TeleVault checks or indexes the saved export
- made startup/picker errors show friendly storage messages without traceback-like text
- kept backend parsing, saved-vault autoload, folder picker, conversation list, chat search/sort, chat opening, media rendering, photo lightbox and /media endpoint behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.19
- confirm /api/status returns 2.5.19
- confirm the last saved vault still autoloads from settings
- confirm the sidebar status shows the current folder, chat count and message count after loading
- confirm a long storage path is truncated with ellipsis and does not break the sidebar layout
- confirm missing saved vault or invalid export errors are readable and do not show traceback text
- confirm the "хранилище не выбрано" state keeps the "добавить в хранилище" button
- confirm manual path input and a separate "загрузить" button did not return
- confirm the conversation list, conversation search, sorting and opening chats by click still work
- confirm sticker/photo/video/audio/file rendering, photo lightbox, media fallbacks, single active playback and /media 200/206/416/403/path traversal behavior still work

## 2.5.18 - empty states polish

Changed:
- added a compact shared frontend empty-state helper for sidebar, chat and media empty states
- made chat-list search with no matches show "ничего не найдено" with a short query hint
- made empty in-chat search show "сообщений не найдено" with a different-query hint
- added media-tab-specific empty messages for photos, videos, audio and files
- kept date separators behind the non-empty message/media render path, so empty results do not show standalone separators
- kept backend parsing, /media endpoint, Range handling, URL encoding, security checks, incoming/outgoing detection, sticker rendering, media rendering, photo lightbox, media fallbacks and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.18
- confirm /api/status returns 2.5.18
- confirm the start screen "Выбери переписку слева" still appears after a vault is loaded and no chat is selected
- confirm the conversation list still renders and opens chats by click
- search conversations with no matches and confirm a compact "ничего не найдено" empty state appears in the sidebar
- search inside a selected chat with no matches and confirm a compact "сообщений не найдено" empty state appears in the message area
- confirm a selected chat with no messages shows "сообщений нет" without date separators
- confirm the photo, video, audio and file tabs show their own friendly empty states when that media type is absent
- confirm media tabs with existing items do not show an empty state
- confirm date separators still appear for one or more visible messages and do not appear for empty results
- confirm sticker messages, .webp stickers, .webm sticker autoplay loop muted without controls, .tgs fallback, photo lightbox, regular video/audio/files, media fallback states and single active playback still behave normally
- confirm /media 200/206/416/403 and path traversal protection still work

## 2.5.17 - chat spacing and date separators polish

Changed:
- added compact frontend date separators before the first visible message of each day
- reused the existing Russian day-title format such as `30 июня 2026`
- kept separators inside the already filtered message list, so chat search, sender filter and media tabs use the same day breaks
- switched regular chat metadata to show sender plus message time while the day is shown by the separator
- slightly increased vertical spacing between message rows and tightened bubble sizing with box sizing
- kept sticker messages on the lightweight no-heavy-bubble visual path
- kept incoming/outgoing detection, sender logic, backend parsing, media endpoints, photo lightbox, media fallbacks and single active playback unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.17
- confirm /api/status returns 2.5.17
- open a chat and confirm date separators appear only when the visible day changes
- search inside a chat and confirm separators remain correct for the filtered result
- use a 3+ sender chat, if available, and confirm sender filter still works
- confirm incoming/outgoing alignment from 2.5.16 is unchanged
- confirm .webp stickers, .webm sticker autoplay loop muted without controls and .tgs fallback still behave normally
- confirm photo lightbox, regular video/audio/file views, media fallback states, 200/206/416/403 and path traversal protection still work

## 2.5.16 - cleaner chat controls and private dialog alignment

Changed:
- kept the in-chat search field visible while hiding the sender filter in chats with one or two unique senders
- made the reset control appear only when search text or a visible sender filter is active
- added a frontend owner-sender candidate based on the sender that appears across multiple two-person chats
- used that owner candidate for outgoing alignment before falling back to the older chat-title heuristic
- kept group-like or unclear chats neutral instead of forcing right/left alignment aggressively
- kept backend parsing, media rendering, photo lightbox, media fallbacks, single active playback and /media behavior unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.16
- confirm /api/status returns 2.5.16
- open miguel and Александр and confirm the sender filter is hidden while search remains visible
- confirm reset is hidden with no search/sender filter and appears when search text is entered
- confirm sèrzh messages align right in miguel and Александр, while the other participant stays left
- confirm sticker bubbles, .webp stickers, .webm sticker autoplay loop muted without controls and .tgs fallback still behave normally
- confirm photo lightbox, regular video/audio/file views, media fallback states, encoded /media URLs, 200/206/416/403 and path traversal protection still work

## 2.5.15 - chat bubble and sticker visual polish

Changed:
- added frontend message modifier classes for sticker, media, text and cautious incoming/outgoing styling
- made sticker messages render without the regular dense bubble background, border and padding
- kept sticker sender/time metadata visible as a compact service pill
- kept sticker captions as their own small caption bubble instead of dropping text
- refined regular message bubble spacing, contrast, radius and hover states
- added a conservative private-chat direction heuristic while leaving group-like conversations neutral
- kept backend parsing, media URL generation, /media Range behavior, media fallbacks, single active playback and photo lightbox unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.15
- confirm /api/status returns 2.5.15
- open a private chat and confirm incoming/outgoing messages are easier to scan without affecting group-like chats
- confirm .webp stickers, .webm animated stickers and .tgs fallback look like sticker messages rather than dense text bubbles
- confirm sticker captions/text remain readable when present
- confirm regular photos, photo lightbox, small-photo centering, regular videos, audio, files and media fallback states still behave normally
- confirm single active regular media playback still works and muted sticker animations remain independent
- confirm encoded /media URLs return 200, valid Range requests return 206, invalid ranges return 416 and outside-root/path traversal requests return 403

## 2.5.14 - single active media playback

Changed:
- added one delegated frontend play listener for regular video and audio elements
- starting a regular video now pauses other regular videos and audio players
- starting audio now pauses other regular videos and audio players
- kept muted Telegram sticker videos independent by excluding sticker wrappers, sticker media markers and muted autoplay loop videos without controls
- kept media fallback handling, /media endpoint, encoded media URLs, Range video seeking and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.14
- confirm /api/status returns 2.5.14
- open a chat with multiple regular videos and confirm starting the second video pauses the first
- start audio while a video is playing and confirm the video pauses while audio continues
- start video while audio is playing and confirm the audio pauses while video continues
- confirm video seeking still returns 206 Partial Content and picture-in-picture still works
- confirm .webm sticker autoplay loop muted without controls still works and does not pause regular media by itself
- confirm .webp stickers, .tgs fallback, photo lightbox, missing media fallbacks and encoded media URLs still behave normally
- confirm /media returns 200, 206, 416 and 403 for the usual cases

## 2.5.13 - false missing video fallback fix

Changed:
- kept backend media URL generation and existence checks unchanged after confirming IMG_2077.MP4 has media_exists=true and a working /media URL
- made regular video rendering use the available media_url as the only playable video source
- stopped ordinary video fallback from depending on preview or thumbnail availability
- changed the frontend video error handler to verify the same-origin /media source with a small Range request before revealing the unavailable fallback
- kept the 2.5.12 media fallback polish for genuinely missing or unreachable media
- kept /media encoded URLs, safe path validation, Range video seeking and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.13
- confirm /api/status returns 2.5.13
- open IMG_2077.MP4 and confirm it renders as a normal inline video with controls
- confirm open original for IMG_2077.MP4 still opens the same /media video URL
- confirm seeking returns 206 Partial Content and normal /media requests still return 200
- confirm invalid ranges return 416 and outside-root/path traversal requests return 403
- confirm genuinely missing video, photo, audio and file media still show fallback cards
- confirm .webp stickers, .webm animated stickers and .tgs fallback still behave as in 2.5.8
- confirm photo lightbox still opens and small photos remain centered

## 2.5.12 - media fallback polish

Changed:
- added shared frontend fallback rendering for unavailable photo, video, audio, file and sticker media
- show compact type-specific fallback cards instead of native broken img/video/audio UI
- keep fallback cards constrained inside message bubbles, media cards and the photo lightbox
- handle browser media load errors by revealing the nearest local fallback instead of blanking the whole card
- kept /media endpoint, safe path validation, encoded media URLs and Range video seeking unchanged
- kept Telegram sticker classification unchanged, including .webp image stickers, .webm autoplay loop muted stickers and .tgs fallback
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.12
- confirm /api/status returns 2.5.12
- open regular photos, photo lightbox and open original
- confirm regular videos still show controls and seeking still returns 206 from /media
- confirm audio, file links, .webp stickers, .webm stickers and .tgs fallback still behave normally
- load an export with missing media paths and confirm photo, video, audio, file and sticker fallbacks look compact and do not stretch message bubbles
- confirm encoded /media URLs from 2.5.11 still return 200 and outside-root/path traversal requests still return 403

## 2.5.11 - media URL encoding hardening

Changed:
- encode generated /media URLs segment-by-segment for paths with spaces, Cyrillic and reserved URL characters
- generate media, photo and thumbnail URLs relative to the loaded library root instead of exposing absolute filesystem paths
- keep /media path validation rooted at LIBRARY.root before reading files
- keep 200, 206 Partial Content and 416 Range behavior for media responses
- kept frontend media rendering, photo lightbox, open-original links, video controls and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.11
- confirm /api/status returns 2.5.11
- open photos, photo lightbox, open original, regular video seeking, audio, files and stickers
- confirm /media returns 200 for normal requests, 206 for valid Range, 416 for invalid Range and 403 for outside-root paths
- confirm paths with spaces, Cyrillic, #, ?, %, +, &, [ and nested folders produce encoded /media URLs without double encoding

## 2.5.10 - video seeking support

Changed:
- added safe HTTP Range request support to the /media endpoint
- return 206 Partial Content with Accept-Ranges, Content-Range and Content-Length for byte ranges
- keep normal /media requests working as 200 responses with Accept-Ranges: bytes
- kept frontend video controls and sticker rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.10
- open a regular video and confirm it stays inside the message bubble
- seek a regular video by clicking and dragging the progress bar
- confirm picture-in-picture and ordinary video controls still work
- confirm .webp, .webm and .tgs Telegram stickers still render as in 2.5.8
- confirm photos, photo lightbox, centered small-photo lightbox behavior, audio and files still work
- in DevTools Network, confirm video seeking sends Range and /media returns 206 with Accept-Ranges and Content-Range

## 2.5.9 - video/media width clamp

Changed:
- clamped inline media wrappers to the available message width
- changed regular inline video sizing so videos use width: min(640px, 100%) instead of intrinsic width
- kept ordinary video controls and sticker-specific rendering unchanged
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.9
- open a chat with a wide regular video and confirm it stays inside the message bubble
- confirm ordinary videos still show controls
- confirm photos, photo lightbox and centered small-photo lightbox behavior still work
- confirm .webp, .webm and .tgs Telegram stickers still render as in 2.5.8
- confirm audio, files and the all/photo/video/audio/file tabs still behave normally

## 2.5.8 - Telegram stickers rendering

Changed:
- added conservative Telegram sticker detection in the parser without new dependencies
- marked detected stickers as media_kind="sticker" for the frontend
- rendered static sticker images inline as compact stickers instead of large photos
- rendered playable animated sticker videos autoplay/loop/muted/playsinline without controls
- added a clean fallback for unsupported .tgs animated stickers with an open-original link
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.8
- confirm ordinary photos still open in the photo lightbox and small photos stay centered
- confirm ordinary videos still display as videos with controls
- confirm a .webp Telegram sticker displays as a compact sticker image
- confirm a .webm Telegram sticker autoplays, loops, stays muted and has no controls
- confirm a .tgs Telegram sticker shows the animated-sticker fallback and open-original link
- confirm audio, regular files, chat list, chat search, sender filter and /media access still work

## 2.5.6 - small image lightbox fix

Changed:
- centered the photo lightbox image stage independently from the metadata panel
- added moderate viewer-only upscaling for small photos
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.6
- open a large photo and confirm it still fills the viewer cleanly
- open a small photo and confirm it is centered and not thumbnail-like
- confirm metadata and the open original link stay below the image without shifting it left
- confirm close button, Esc, arrow navigation, backdrop click and open original still work
- confirm video, audio, files, conversation search, sender filter and /media access still behave normally

## 2.5.7 - fullscreen lightbox positioning fix

Changed:
- changed the photo lightbox dialog from a constrained three-column grid into a fullscreen viewer
- positioned close and previous/next controls as overlay buttons
- positioned the caption at the bottom center so it cannot move the image stage
- changed small-photo handling to a CSS class based on natural image size
- updated APP_VERSION, CHANGELOG.md, frontend version placeholder and run_windows.bat startup text

Manual test:
- launch with run_windows.bat and confirm the UI shows v2.5.7
- open a small photo and confirm it is centered against the full viewport
- confirm the caption is centered at the bottom and does not shift the photo left
- open a large photo and confirm it still fits cleanly
- confirm close button, Esc, arrow navigation, backdrop click and open original still work
