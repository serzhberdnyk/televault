# Changelog

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
