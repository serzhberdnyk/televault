# Changelog

## Docs after 2.9.31

### Changed

* Clarified that normal portable Windows usage is: download the zip, extract it and launch `TeleVault.exe`.
* Documented `run_windows.bat` as a fallback/dev diagnostics path that can differ from launcher behavior.
* Updated release/dev launcher notes so taskbar/start icon, repeat launch, window focus and owned-backend shutdown checks are performed through `TeleVault.exe`.
* No app version, backend, frontend, launcher code, build scripts, package artifacts or screenshots were changed.

## 2.9.31

### Changed

* Polished launcher repeat-start behavior by logging existing-backend reuse before focusing the already-open Edge/Chrome app-mode window.
* The existing-window focus path now restores, raises and requests foreground focus with concise per-step diagnostics.
* Closing the app window now logs owned-backend shutdown confirmation, timeout or termination errors more clearly.
* Taskbar identity remains non-critical: property-store, property-write or commit failures are logged briefly while startup continues.
* Reduced normal launcher log path noise by keeping routine app-root and window-state entries to safe short values.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.31.
* WebView2, Electron, backend, parser, library storage, media endpoint/security, frontend behavior, search and release/package publishing were not intentionally changed.

## 2.9.30

### Changed

* Added a native launcher prototype that tries to assign TeleVault taskbar identity to the opened Edge/Chrome app-mode window through Windows Shell AppUserModelID relaunch properties.
* The launcher now logs taskbar identity property-store success or failure without blocking startup when Windows or the browser ignores the properties.
* Kept the existing `--app=http://127.0.0.1:8766/` browser app-mode launch and default browser fallback.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.30.
* WebView2, Electron, backend, parser, library storage, media endpoint/security, search, service notices, replies/edited, text entities, audio metadata, special content fallbacks and release/package publishing were not intentionally changed.

## 2.9.29

### Changed

* Wired the prepared TeleVault archive-box icon into the frontend favicon links and web manifest.
* Added `frontend/manifest.webmanifest` with TeleVault app metadata and icon entries from `frontend/assets/icons/`.
* Updated `/favicon.ico` to use the prepared TeleVault icon bytes.
* Updated the native launcher resource file so future `TeleVault.exe` builds embed `frontend/assets/icons/televault.ico`.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.29.
* Parser, library storage, media endpoint/security, search, service notices, replies/edited, text entities, audio metadata, special content fallbacks and release/package artifacts were not intentionally changed.

## Docs after 2.9.28

### Changed

* Updated README copy after the 2.9.28 audit-fix cycle to explain the local offline reader/archive clearly without promising a visible multi-export manager or cloud/sync behavior.
* Refreshed the public screenshots in `docs/screenshots/` from the current 2.9.28 UI using only synthetic demo data.
* Added `docs/demo/demo-export/` as a minimal safe Telegram Desktop JSON export fixture for screenshot capture and manual documentation checks.
* Updated screenshot and demo-export docs with capture notes and privacy-review status for the refreshed PNG files.
* Updated README to describe the current local/offline Telegram Desktop export reader without promising a visible archive manager, sidebar archive cards or visible multi-export UI.
* Clarified current support for full JSON exports with `chats.list`, `left_chats.list`, single-chat exports, replies/edited metadata, service notices, text entities, audio metadata and special-content fallbacks.
* Updated screenshot, demo-export, public-submission and dev docs that still described old multi-export library UI or old build-plan versions as current instructions.
* Replaced the historical public screenshots that showed old UI and local/path-like details.
* No app version, backend, frontend, parser, storage, media endpoint, build scripts or release/package logic changed.

## 2.9.28

### Changed

* Removed the visible sidebar `архивы` entry and its archive manager modal markup from the UI.
* Removed the visible sidebar archive status card, including the `архив открыт` state, indicator dot and current archive folder label.
* Kept the existing add-export flow, startup active-export restore and internal export catalog refresh behavior intact.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.28.
* Backend parser/library/storage format, export catalog API/model, `/api/exports`, `/open`, `/forget`, media endpoint/security, search logic, service notices, replies/entities/audio metadata, special content fallbacks, README and release packaging logic were not intentionally changed.

## 2.9.27

### Changed

* Added a compact "архивы" button under the export picker that opens an archive manager modal instead of restoring permanent sidebar archive cards.
* The archive manager lists saved exports by safe label/folder name, marks the current archive and unavailable archives, and keeps absolute local paths out of the normal UI.
* Available non-active exports can be opened from the manager through the existing `/api/exports/<id>/open` flow, then the manager closes after the archive loads.
* Saved exports can be forgotten from the manager with confirmation that files on disk stay in place, using the existing `/api/exports/<id>/forget` behavior.
* Added an empty archive-manager state for libraries without saved exports.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.27.
* Backend parser/library/storage format, export catalog API/model, media endpoint/security, search logic, service notices, replies/entities/audio metadata, special content fallbacks, README and release packaging logic were not intentionally changed.

## 2.9.26

### Changed

* Corrupted `result.json` now returns a dedicated friendly message asking the user to export from Telegram Desktop again.
* Unreadable `result.json` due to file access, encoding or I/O errors now returns a separate friendly message without traceback, Python exception text or absolute local paths.
* Missing/wrong-folder `result.json` handling and bounded export scanning were kept intact.
* Saved-export startup/open failures now preserve safe parser/library messages instead of collapsing readable `result.json` problems into a missing-folder state.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.26.
* Storage format, export catalog API/model, `/media`, media security, search logic, sidebar archive cards, service notices, replies/entities/audio metadata, special content fallbacks, README and release packaging logic were not intentionally changed.

## 2.9.25

### Changed

* Hid absolute local export/media paths from visible UI status text, library tooltips, missing-export welcome notes, user-facing error details and global search result snippets.
* Kept media/file fallbacks and lightbox missing states on safe filenames or neutral unavailable text instead of full local paths.
* Search still finds media by filename/basename, while frontend and backend search text no longer rely on full media paths for visible results.
* Backend partial load errors now report `result.json` basenames instead of absolute `result.json` paths.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.25.
* Storage settings, export catalog internals, `/api/exports`, `/open`, `/forget`, media endpoint, media security model, sidebar archive cards, service notices, replies/entities/audio metadata, special content fallbacks, README and release packaging logic were not intentionally changed.

## 2.9.24

### Changed

* Removed the visible sidebar "Архивы" catalog block, including saved export cards, the archive counter, active/unavailable badges, last-opened dates and per-card forget buttons.
* Kept the internal export catalog state refresh for startup/missing-export handling, while leaving `/api/exports`, `/api/exports/<id>/open`, `/api/exports/<id>/forget`, `exports[]`, `activeExportId` and `lastVaultPath` backend behavior intact.
* Removed the now-unused archive-card frontend rendering code and CSS.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.24.
* Parser, library storage, media endpoint, media security model, search logic, service notices, replies/edited rendering, audio metadata, text entity rendering, special content fallbacks, README and release packaging logic were not intentionally changed.

## 2.9.23

### Changed

* Telegram poll, contact, location, venue, invoice/payment, game and dice messages now get compact normalized `special_*` fallback fields when those export fields are present.
* Unknown non-media `media_type` values now keep a neutral Telegram special-message fallback instead of disappearing as empty messages.
* Special fallback text and safe detail fields are included in backend message search, global search snippets and reply previews.
* The chat view now renders special content as compact message-like content inside the normal message bubble, not as centered service notices.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.23.
* Media endpoint, media security model, storage settings format, export catalog/forget behavior, search UI, service notice labels, audio playback, text entity rendering, README and release packaging logic were not intentionally changed.

## 2.9.22

### Changed

* Telegram `text_entities` and array-form text now pass through the parser as lightweight formatting metadata while keeping plain `text`/`caption` fields searchable and human-readable.
* Message text and media captions now render safe basic entities: bold, italic, underline, strikethrough, inline code, preformatted blocks, `url`, `text_link`, Telegram Desktop `link`, mention, hashtag and spoiler.
* Entity rendering only emits escaped text with whitelisted local tags; unknown entities keep their text as plain text and unsafe link schemes stay inactive.
* Long entity links, inline code and preformatted blocks now wrap inside message bubbles instead of stretching the layout.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.22.
* Media endpoint, media security model, storage settings format, export catalog/forget behavior, search UI, service notice labels, reply preview rendering, audio playback, README and release packaging logic were not intentionally changed.

## 2.9.21

### Changed

* Audio exports now preserve normalized `performer` and `title` metadata for audio messages when Telegram Desktop includes those fields.
* Regular audio players show a compact track metadata row with `performer — title` and duration when performer/title metadata exists.
* Voice messages keep the existing compact audio player and do not get the music-track metadata row.
* Shared backend/frontend search text now includes audio `performer` and `title` metadata.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.21.
* Media endpoint, playback/range request logic, storage settings format, export catalog/forget behavior, search UI, README and release packaging logic were not intentionally changed.

## 2.9.20

### Changed

* Aligned in-chat search and `/api/search` around the same searchable message text: text/caption, service notice text, sender/actor/author fields, forwarded/saved/via labels, reply preview text and media metadata.
* Media-tab search now reuses the same message searchable text while still filtering by the selected media type.
* The legacy `/api/chat?q=...` backend filter now uses the shared backend searchable text for compatibility.
* Search normalization now compacts whitespace and keeps Cyrillic/Latin matching case-insensitive.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.20.
* Parser, storage format, media endpoint, media security model, search UI, export catalog/forget behavior, README and release packaging logic were not intentionally changed.

## 2.9.19

### Changed

* Added `POST /api/exports/<id>/forget` to remove a saved export record from the local TeleVault catalog without deleting the export folder or media files.
* The sidebar "Архивы" list now has a safe "забыть из библиотеки" action for every saved export, including unavailable ones.
* Forgetting a non-active export only removes it from the saved list and keeps the currently opened archive untouched.
* Forgetting the active export switches to the most recently opened available saved export, or shows the empty library state when no available exports remain.
* Confirmation copy now says that files on disk stay in place, and the UI avoids delete-style wording for this action.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.19.
* Parser, library chat/message storage, media endpoint, media security model, search, README and release packaging logic were not intentionally changed.

## 2.9.18

### Changed

* Added `GET /api/exports` for a safe saved-export catalog view with ids, labels, display folder names, active state, missing state and timestamps.
* Added `POST /api/exports/<id>/open` to switch the active export from the saved catalog without choosing the folder again.
* The sidebar now shows a compact "Архивы" list above conversations, marks the active export and shows unavailable saved exports without mixing them into the chat list.
* Adding a new export through the existing folder picker still updates the catalog, makes that export active and refreshes the conversation list.
* Visible sidebar status and export list display folder labels instead of long absolute paths; full paths remain out of the main UI.
* Missing or broken saved exports are marked unavailable on open failure without clearing the current in-memory library.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.18.
* Remove/forget export UI, parser, library chat/message storage, media endpoint, search and release packaging logic were not intentionally changed.

## 2.9.17

### Changed

* Added an internal export catalog settings model with `exports`, `activeExportId` and transitional `lastVaultPath`.
* Old settings that only contain `lastVaultPath` now migrate to a single active export record while keeping startup behavior compatible.
* Loading an export updates the existing catalog record instead of creating duplicates, using a normalized resolved path for comparison.
* Startup now opens the active export record first, then falls back to `lastVaultPath` for older settings.
* Missing saved exports are marked in the catalog without crashing startup, while wrong-folder loads are not added to settings.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.17.
* UI, parser, library chat/message storage, media endpoint, search and release packaging logic were not intentionally changed.

## 2.9.16

### Changed

* Frontend no longer preloads every chat through `/api/chat` after opening an export.
* Messages are loaded when the user opens a specific chat, then kept in the existing in-memory `chatCache` for quick repeat openings.
* Sidebar chat list and global search continue to use the existing chat summaries and `/api/search` endpoint.
* Chat message load failures now show a local in-chat error state instead of marking the whole library as failed.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version, launcher `kAppVersion` and project logs to 2.9.16.
* Backend parser, media endpoint, storage/library format and release scripts were not intentionally changed.

## 2.9.15

### Changed

* Telegram replies now keep `reply_to_message_id` in normalized message data and resolve a same-chat reply preview when the target message is present.
* Message bubbles show a compact reply preview with the original author and short text/media fallback, or a clear missing-export fallback when the replied message is absent.
* Edited messages now show a compact `изменено` marker next to the message time.
* Service/system messages remain compact service notices when reply metadata is present.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and project logs to 2.9.15.
* Search, media endpoint, storage/library format, build scripts, release scripts and packaging were not intentionally changed.

## 2.9.14

### Changed

* Added readable service notice labels for common Telegram actions: title/photo changes, member invites/removals, joins by link/request, migrations, calls, message TTL, topics, chat theme changes and clear history.
* Service/system messages continue to render as compact timeline notices instead of regular user bubbles.
* Unknown or rare Telegram service actions still use the existing generic service notice fallback.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and project logs to 2.9.14.
* Media endpoint, media playback, storage/library format, search, build scripts, release scripts and packaging were not intentionally changed.

## 2.9.13

### Fixed

* Selecting a wrong or overly broad folder no longer triggers an unbounded recursive `result.json` scan.
* Library loading now checks the selected folder for `result.json` first, then searches only a shallow set of nearby folders with directory and entry limits.
* Wrong folders, empty folders and too-broad folders now return a clear Telegram Desktop export folder error instead of appearing to hang.

### Changed

* Correct single-chat exports with `result.json` next to the selected folder still open directly.
* Full Telegram Desktop exports with `chats.list` keep the existing parser path.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and project logs to 2.9.13.
* Storage format, parser output, media endpoint, search, frontend design, build scripts, release scripts and packaging were not intentionally changed.

## 2.9.12

### Fixed

* Full Telegram Desktop JSON exports are now opened as a set of conversations from `result.json` `chats.list`.
* `left_chats.list` entries are included when present and valid.
* Empty chats inside a full export no longer collapse the import into a fake single empty conversation.
* Malformed full-export chat lists are reported through the existing load errors instead of breaking the whole library load.

### Changed

* Existing single-chat exports with top-level `messages` keep the previous parser path.
* Media paths for full exports remain resolved relative to the export root.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text and project logs to 2.9.12.
* Frontend UI, media endpoint, search, build scripts, release scripts and packaging were not intentionally changed.

## 2.9.11

### Packaging

* Portable package builds now include the root MIT `LICENSE` file.
* No app behavior changes.

## 2.9.10

### Security

* Restricted `/media` serving to files referenced by the currently loaded Telegram export messages.
* Added a transactional media allowlist built from existing `media`, `photo` and `thumbnail` files in loaded chats, without scanning the export root as a general file server.
* `/media` keeps the existing root containment and traversal guards, then rejects existing in-root files that are not in the loaded export media allowlist.
* Existing range responses for allowed video/audio media remain handled by the same streaming code.

### Changed

* Portable package builds now include the approved public README screenshots from `docs/screenshots/` by explicit allowlist.
* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and launcher `kAppVersion` to 2.9.10.
* Frontend rendering, parser output format, storage format and release assets were not intentionally changed.

## 2.9.9

### Security

* Includes the local `Host` guard work from the superseded internal 2.9.8 checkpoint.
* Added a local `Host` guard before API, static file and media routing to reject unexpected Host headers for local app requests.
* Requests are accepted only for the local app host on the actual server port: `127.0.0.1:<port>` or `localhost:<port>`; local host headers without a port are tolerated for simple test clients.
* Requests with an external or missing `Host` now receive an empty 403 response before business logic, POST body reading, static file serving or media file resolving.
* The existing state-changing POST Origin/Referer/Sec-Fetch guard remains in place.

### Fixed

* Made `ExportLibrary.load_folder()` transactional: a failed or malformed new export no longer clears the currently opened in-memory library.
* Existing chat, search and media state remain backed by the previous valid export when a later folder load fails.

### Documentation / public presentation

* Includes the public documentation cleanup from the superseded internal 2.9.8 checkpoint.
* Rewrote README as a Russian benefits-first public page.
* Added privacy and local-first positioning.
* Added public screenshots to README:
  * `docs/screenshots/01-chat-reading.png`
  * `docs/screenshots/02-photo-viewer.png`
* Cleaned repository root documentation.
* Moved internal build, development and release docs under `docs/`.
* Removed extra root `README_RUN.md` and `README_WIN7.md`.

### Release preparation

* Added screenshots guide, demo export plan and release notes template.
* Updated package/build allowlist paths for moved docs.

### Changed

* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and launcher `kAppVersion` to 2.9.9.
* Runtime app behavior includes the local Host guard security hardening; frontend, parser, media endpoints and storage format were not intentionally changed.

## 2.9.8 (internal, superseded; GitHub Release unpublished)

2.9.8 was an intermediate internal checkpoint. Its GitHub Release was removed, and the user-facing changes are documented under 2.9.9 instead of presenting 2.9.8 as a published download release.

## 2.9.7

### Improved

* Large chats now show a calm in-chat loading state before the expensive browser DOM insertion starts.
* The full chat view yields for two animation frames before rendering more than 500 filtered messages, so the loading state can visibly paint first.
* Cache-miss chat loads show the same loading state only after a short delay, avoiding a quick flash for fast small chats.

### Changed

* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and launcher `kAppVersion` to 2.9.7.
* Preload strategy, backend, parser, storage, media endpoints, albums, stickers, video notes and audio/video lazy loading are unchanged.

## 2.9.6

### Security

* Added a local request guard for state-changing API `POST` endpoints: `/api/pick-folder`, `/api/load-folder` and `/api/forget-missing-vault`.
* External `Origin`, external `Referer`, wrong `Host` and `Sec-Fetch-Site: cross-site` requests are rejected before folder picker, request body parsing, loading or settings changes.
* `OPTIONS /api/*` now returns no CORS permission for external origins.

### Changed

* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and launcher `kAppVersion` to 2.9.6.
* GET endpoints, media endpoint, parser, storage and frontend UI are unchanged.

## 2.9.5

### Improved

* Large chats now defer regular audio, voice and video `src` assignment until user interaction while keeping native browser controls.
* Regular audio/video metadata is now requested only for near-viewport or interacted media instead of every media element in a large chat.
* Initial large-chat render keeps ordinary audio/video at `preload="none"` and avoids binding a source to every native media control upfront.

### Fixed

* Restored native audio, voice and video duration display without a separate custom duration badge over native media controls.

### Changed

* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and launcher `kAppVersion` to 2.9.5.
* Backend, parser, storage, media endpoint, search behavior, sticker autoplay previews and the visual layout are unchanged.

## 2.9.4

### Improved

* Unified sender/time metadata styling across text, audio, file and missing media message blocks.
* Refreshed unavailable media cards with a lighter compact style and local-archive wording.
* Media classification, parser, backend storage and search behavior are unchanged.

### Fixed

* TeleVault.exe relaunches normally after the app window is closed, even when another browser tab title contains TeleVault.
* TeleVault.exe no longer silently focuses a TeleVault window from another portable folder when that other copy is already running.
* Audio/voice playback is smoother in large chats.
* Single-active playback no longer scans every audio/video element on each play.

## 2.9.3

### Added

* Added a separate Windows 7 legacy runtime build profile.
* Added Python 3.8-compatible dependency pins for the Win7 legacy build.
* Added clearer launcher diagnostics for legacy runtime issues.

### Changed

* Main Windows 10/11 build keeps the current Python runtime.

## 2.9.2

### Changed

* replaced .NET Framework launcher with native Windows launcher
* TeleVault.exe no longer requires installed .NET Framework just to start
* improved portable startup compatibility
* preserved Windows 10/11 launch behavior
* Windows 7 SP1 remains best effort
* no backend/parser/media/search behavior changes

## 2.9.1

### Fixed

* TeleVault now starts normally when the saved export folder was deleted, renamed or became unavailable
* startup restore now shows a clear missing export state with a button to choose the export folder again
* the missing export state can remove only the unavailable saved path without clearing the rest of user data
* saved export paths are written to per-user app data instead of falling back to a project-local settings file

## 2.9.0

### Improved

* first-run screen now presents TeleVault as a local offline archive for important Telegram conversations
* empty states were polished for no selected chat, no messages, no search results and missing media/files
* key UI wording now favors archive, conversation, local and offline language over technical export/viewer wording
* README and README_RUN were refreshed for product positioning and simpler Windows startup guidance

## 2.8.9

### Fixed

* TeleVault.exe launcher version check now stays synchronized with the packaged app version
* launcher no longer reports the previous version when starting the latest portable package

## 2.8.8

### Added

* TeleVault.exe now includes a dedicated TeleVault application icon

### Improved

* release branding assets were prepared for the Windows launcher package

## 2.8.7

### Fixed

* TeleVault.exe now reliably restores the last app window size and position
* launcher window state saving was made more robust for Edge/Chrome app-mode windows

## 2.8.6

### Fixed

* Windows folder picker now opens in front of the TeleVault app window

### Improved

* TeleVault.exe now remembers the last app window size and position between launches

## 2.8.5

### Improved

* TeleVault.exe launcher messages were polished for clearer user-facing errors
* launcher logging was refined for easier troubleshooting
* optional TeleVault.exe icon support was prepared for future branding work

## 2.8.4

### Fixed

* TeleVault.exe now refuses to reuse an already running TeleVault backend from a different version
* repeated TeleVault.exe launches now focus the existing app window when possible instead of opening another window
* occupied-port handling was made safer for launcher startup

## 2.8.3

### Improved

* TeleVault.exe now reuses an already running TeleVault instance instead of starting a second backend
* repeated launcher clicks now open the existing app window more safely
* launcher error handling was improved for occupied port scenarios

## 2.8.2

### Fixed

* folder picker now works when TeleVault runs through the bundled Python runtime
* Windows export folder selection now works from both TeleVault.exe and run_windows.bat
* folder picker cancel behavior remains stable

## 2.8.1

### Improved

* TeleVault.exe launcher now starts without a visible console window
* TeleVault.exe now opens the app in an app-like browser window when available
* run_windows.bat remains available as a debug/fallback launcher

## 2.8.0

### Added

* first Windows TeleVault.exe launcher preview for the portable package

### Improved

* release tooling can now build a launcher-style exe next to the existing portable runtime
* run_windows.bat remains available as a fallback launcher

## 2.7.7

### Added

* exe packaging plan was added for the upcoming Windows launcher phase

### Improved

* release checklist now documents exe preparation risks and verification steps
* Windows run documentation now clarifies the current portable flow and future exe goal

## 2.7.6

### Added

* portable builder now creates a zip archive for Windows release testing

### Improved

* release checklist now includes portable zip verification steps

## 2.7.5

### Fixed

* portable build script now finds bundled runtime\python\python.exe without requiring PATH changes
* portable release dry-run can now be launched more reliably by double-clicking build_portable.bat

## 2.7.4

### Fixed

* bundled Python runtime startup now resolves TeleVault project modules correctly
* app startup no longer fails with ModuleNotFoundError for the backend package when using runtime/python/python.exe

## 2.7.3

### Improved

* Windows launcher now prefers a bundled local Python runtime when available
* portable builder now copies runtime/python when present
* portable run instructions now explain bundled Python fallback behavior

## 2.7.2

### Improved

* generated release and development artifacts are now ignored by Git
* portable dry-run output is documented as a rebuildable artifact that should not be committed

## 2.7.1

### Added

* portable package dry-run builder for preparing a clean Windows release folder

### Improved

* release checklist now includes portable folder verification steps

## 2.7.0

### Improved

* release readiness documentation was added for the upcoming Windows packaging phase
* Windows portable package expectations are now documented
* current run and verification steps were clarified before exe packaging work begins

## 2.6.18

### Improved

* documentation was refreshed to match the current TeleVault workflow
* Windows run instructions were clarified for normal double-click startup
* release notes were prepared for the next Windows app packaging phase

## 2.6.17

### Improved

* global sidebar search now handles fast typing more reliably
* stale search responses no longer overwrite newer results
* global search loading and error states were made more stable

## 2.6.16

### Improved

* global search result cards now use a cleaner snippet-first layout
* repeated chat/sender metadata is reduced in sidebar search results
* matched search text is softly highlighted in global search snippets

## 2.6.15

### Added

* sidebar search now supports basic global message search across the opened export

### Improved

* global search results can be clicked to open the original chat message in context
* sidebar search now handles both chat title matches and message matches

## 2.6.14

### Improved

* search results now have clearer clickable styling
* in-chat search now shows a small hint that results can be opened in context
* jumped message highlighting was polished for better readability

## 2.6.13

### Improved

* search results can now be clicked to jump back to the original message in the conversation
* jumped messages are briefly highlighted after navigation
* existing chat search and media rendering behavior was preserved

## 2.6.12

### Improved

* stickers now have their own media tab instead of being mixed into regular files
* the Files tab now focuses on document-like attachments
* sticker-first presentation from 2.6.11 was preserved

## 2.6.11

### Improved

* audio items in the Audio tab no longer show technical file names as primary content
* audio-only sender/time metadata now uses a more consistent compact style
* animated sticker messages now use a lighter sticker-first presentation instead of a heavy file-card look

## 2.6.10

### Improved

* audio items in the Audio media tab now use a lighter compact layout
* the native audio player is now the main visual block in the Audio tab
* chat audio-only behavior from 2.6.8 and media spacing from 2.6.9 were preserved

## 2.6.9

### Improved

* media message spacing was lightly polished for a more consistent reading experience
* photo, video, audio, file, and sticker messages now feel more visually aligned
* audio-only bubble removal from 2.6.8 was preserved

## 2.6.8

### Improved

* audio-only and voice-only messages now render without an extra outer message bubble
* the rounded native audio player is now the main visual block for pure audio messages
* responsive audio layout improvements from 2.6.5 were preserved

## 2.6.7

### Fixed

* cancelling folder selection no longer replaces an opened export with a red “folder not selected” state
* opened storage status is now more compact and no longer repeats the folder name above the path

## 2.6.6

### Improved

* simplified the sidebar storage status copy
* reduced repeated "storage" wording in the sidebar
* removed noisy chat/message/status chips from the compact storage block

## 2.6.5

### Fixed

* Telegram voice messages now render with a usable horizontal audio player
* audio controls no longer collapse into a narrow vertical block
* audio card styling remains compatible with dark UI and lazy metadata loading

## 2.6.4

### Added

* added a build environment assessment for future Windows exe packaging
* documented packaging candidates, required files and release risks

### Improved

* clarified the next steps toward a Windows release without changing app behavior

## 2.6.3

### Improved

* simplified the sidebar by removing the visible chat sort dropdown
* chats continue to use the default newest-first order
* chat search now has a cleaner layout in the sidebar

## 2.6.2

### Improved

* Telegram channel/chat photo update service events now render as clear system notices
* channel photo updates can show a circular preview when the exported image is available
* generic service fallbacks are used less often for known Telegram events

## 2.6.1

### Fixed

* Telegram service messages without regular text no longer render as empty message bubbles
* channel/chat creation events now show as compact system notices
* pinned service notices continue to render correctly

## 2.6.0

### Added

* added project documentation for Windows release preparation
* added build preparation notes for future exe packaging

### Improved

* clarified how to run TeleVault locally on Windows
* documented the current project structure and stable app status

## 2.5.27

### Fixed

* removed the separate video duration badge from video previews
* regular videos now load metadata lazily so native controls can show duration more naturally
* video previews remain lightweight without preloading every video at once

## 2.5.26

### Improved

* video thumbnails now show a compact duration badge when duration metadata is available
* video previews remain lightweight and keep the performance improvements from 2.5.20

## 2.5.25

### Maintenance

* added a project safety checkpoint with git tracking and a stable backup
* added a short Windows run guide
* current stable TeleVault state is now easier to preserve and restore

## 2.5.24

### Improved

* audio cards now fit the dark conversation UI better
* audio metadata loading was adjusted so duration is shown more reliably
* audio playback behavior remains compatible with single active media playback

## 2.5.23

### Improved

* pinned message notices are now more compact and easier to read
* pinned service notices no longer look like heavy regular message bubbles

## 2.5.22

### Improved

* Telegram pinned message service events are now displayed in the conversation
* pinned service messages render as compact system notices instead of disappearing
* pinned message previews are shown when the referenced message can be resolved

## 2.5.21

### Fixed

* video thumbnails are shown again for videos that have Telegram export previews
* performance improvements from 2.5.20 are preserved while restoring video poster previews

## 2.5.20

### Improved

* conversation rendering was reviewed and lightly optimized for larger chats
* chat search and media tab switching are now more responsive on bigger exports
* performance checks were added to protect the polished chat experience

## 2.5.19

### Improved

* library status is now clearer when a Telegram export is loaded
* storage empty and error states are easier to understand
* long storage paths now display more cleanly without breaking layout

## 2.5.18

### Improved

* empty search results now show clearer empty states
* media tabs now show friendly messages when there are no photos, videos, audio or files
* empty states now better match the polished conversation UI

## 2.5.17

### Improved

* conversation view now includes compact date separators between message days
* message spacing is now slightly cleaner and easier to scan
* sticker messages keep their lightweight visual style

## 2.5.16

### Improved

* sender filter is now hidden in simple one-to-one chats
* reset control now appears only when search or filters are active
* outgoing message alignment is more consistent across private dialogs

## 2.5.15

### Improved

* sticker messages now render without the heavy regular message bubble styling
* chat bubbles have improved visual distinction and readability
* incoming and outgoing messages are easier to scan in conversation view

## 2.5.14

### Improved

* starting a video now automatically pauses other regular video and audio players
* starting audio now automatically pauses other regular video and audio players
* muted Telegram sticker animations continue to behave independently

## 2.5.13

### Fixed

* available videos no longer incorrectly show the "video unavailable" fallback
* video fallback detection now distinguishes missing files from missing previews

## 2.5.12

### Improved

* missing and unavailable media now show cleaner fallback states
* broken photo, video, audio, file and sticker previews no longer leave confusing empty or native broken UI
* media fallback cards now keep message layout stable

## 2.5.11

### Fixed

* media URLs are now safely encoded for paths with spaces, Cyrillic and special characters
* /media links remain compatible with video seeking and secure path validation

## 2.5.10

### Fixed

* regular videos can now be seeked using the browser video controls
* media endpoint now supports safe HTTP range requests for video/audio playback

## 2.5.9

### Fixed

* regular videos no longer overflow outside message bubbles
* media blocks are now clamped to the available message width

## 2.5.8

### Improved

* Telegram stickers are now rendered as stickers instead of regular videos/files
* static .webp stickers display inline as sticker images
* animated .webm stickers autoplay, loop, stay muted and hide video controls
* unsupported .tgs animated stickers now show a cleaner sticker fallback

## 2.5.7

### Fixed

* photo lightbox now uses a true fullscreen viewer layout
* small photos are centered against the viewport instead of the lightbox content column
* lightbox caption now sits below the viewer without affecting image positioning

## 2.5.6

### Fixed

* small images in the photo lightbox are now centered properly
* lightbox metadata no longer pulls small images to the left
* small photos now open in a real viewer-style layout instead of thumbnail-like positioning

## 2.5.5

### Improved

* polished the chat reading experience
* improved message bubble spacing and readability
* refined the conversation header and controls
* reduced visual weight in the sidebar and chat view

## 2.5.4

### Fixed

* startup vault loading no longer opens a conversation automatically
* restored browser scroll position no longer jumps into an old message on startup

## 2.5.3

### Improved

* improved visible layout polish for the main vault screen
* refined conversation list cards
* made message bubbles feel more like a chat view
* improved welcome screen composition
* fixed small-image positioning in the photo lightbox

## 2.5.2

### Improved

* cleaned up the main vault interface
* improved spacing and alignment across the app
* polished conversation cards and message layout
* improved lightbox visual consistency
* simplified empty and loading states

## 2.5.1

### Added

* last selected vault folder is remembered between launches
* TeleVault can automatically reopen the previous vault on startup

### Fixed

* close button in photo lightbox is now centered and clickable
* lightbox now opens photos in a proper viewer-style layout
* duplicated/awkward import controls were removed from the main UI

### Improved

* import flow is now simplified to a single “add to vault” action
* photo viewing now prioritizes the original image instead of preview thumbnails when available

## 2.5.0

### Changed

* simplified the app into a focused personal Telegram vault
* removed Timeline and Insights from the main interface
* focused the product around saved conversations and media browsing

### Added

* conversation search in the left panel
* conversation sorting controls
* cleaner minimal vault layout

### Improved

* main screen now focuses on storing, sorting and reading saved Telegram exports

## 2.4.0

### Changed

* navigation is now conversation-first
* “People” is no longer a separate top-level section
* main vault view is focused on saved conversations

### Improved

* message hover behavior is now consistent across conversation and person views
* person-related views now feel like part of the main vault experience

## 2.3.1

### Improved

* photo lightbox now works across Storage, Timeline and People sections
* photo previews can be opened from person pages and day details
* media preview behavior is now consistent across the vault

### Fixed

* photo lightbox was only available from the main photo tab

## 2.3.0

### Added

* vault-focused product identity
* new welcome screen for personal Telegram vault
* archive navigation sections
* timeline foundation
* people overview foundation
* insights summary

### Improved

* wording changed from export viewer to personal Telegram vault
* primary action renamed to add to vault
* onboarding now explains that TeleVault keeps Telegram exports as a private local vault

## 2.2.0

### Added

* photo lightbox for gallery images
* keyboard navigation for photos
* open original photo action

### Improved

* lazy loading for photo gallery images

## 2.1.0

### Added

* media tabs: all, photos, videos, audio, files
* photo gallery
* video, audio and file cards

### Improved

* search and sender filters now work with media modes
