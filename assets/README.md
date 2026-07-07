# TeleVault Assets

TeleVault 2.8.8 includes the first dedicated application icon:

```text
assets/TeleVault.ico
```

The icon is an original TeleVault mark: dark private-vault background, cyan/blue accent, safe-door shape, and a letter T. It must not use the Telegram logo or any third-party brand mark.

`tools/build_exe_launcher.py` passes this file to `csc.exe` through `/win32icon` when it exists. If the icon is absent, the build keeps working and creates `TeleVault.exe` with the default Windows executable icon.

Regenerate the icon with Python standard library only:

```bat
runtime\python\python.exe tools\generate_icon.py
```

The generator recreates:

```text
assets/TeleVault.ico
frontend/favicon.ico
```

Do not commit generated drafts or temporary icon experiments here.
