# Changelog

## 2.9.10

### Security

* Restricted `/media` serving to files referenced by the currently loaded Telegram export messages.
* Added a transactional media allowlist built from existing `media`, `photo` and `thumbnail` files in loaded chats, without scanning the export root as a general file server.
* `/media` keeps the existing root containment and traversal guards, then rejects existing in-root files that are not in the loaded export media allowlist.
* Existing range responses for allowed video/audio media remain handled by the same streaming code.

### Changed

* Updated APP_VERSION, frontend version placeholder, run_windows.bat startup text, portable package version and launcher `kAppVersion` to 2.9.10.
* Frontend rendering, parser output format, storage format, package scripts and release assets were not intentionally changed.

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
