# TeleVault Assets

TeleVault 2.8.8 includes the first dedicated application icon:

```text
assets/TeleVault.ico
```

The icon is an original TeleVault mark: dark private-vault background, cyan/blue accent, safe-door shape, and a letter T. It must not use the Telegram logo or any third-party brand mark.

`tools/build_exe_launcher.py` compiles `tools/launcher/TeleVaultLauncher.rc` with `rc.exe` and links the compiled resource into the native launcher when this icon exists. If the icon is absent, the build keeps working and creates `TeleVault.exe` with the default Windows executable icon.

The frontend uses the same mark for the browser favicon and web app manifest:

```text
frontend/favicon.ico
frontend/icons/televault-192.png
frontend/icons/televault-256.png
frontend/icons/televault-512.png
```

Regenerate the icon with Python standard library only:

```bat
runtime\python\python.exe tools\generate_icon.py
```

The generator recreates:

```text
assets/TeleVault.ico
frontend/favicon.ico
frontend/icons/televault-192.png
frontend/icons/televault-256.png
frontend/icons/televault-512.png
```

Do not commit generated drafts or temporary icon experiments here.
