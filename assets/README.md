# TeleVault Assets

Place the final branded Windows icon at:

```text
assets/TeleVault.ico
```

`tools/build_exe_launcher.py` will pass this file to `csc.exe` through `/win32icon` when it exists. If the icon is absent, the build keeps working and creates `TeleVault.exe` with the default Windows executable icon.

Do not commit generated drafts or temporary icon experiments here.
