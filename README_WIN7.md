# TeleVault Windows 7 legacy build

Use this only for Windows 7 SP1 x64, and only when a separate win7 legacy package is actually published in the GitHub release assets.

This is a legacy / best effort package. The main Windows 10/11 package does not support Windows 7 because its current bundled Python runtime depends on newer Windows APIs.

The Win7 legacy package uses the official Python 3.8.10 embeddable x64 runtime in:

```text
runtime/python38-win7/
```

If Windows shows an `api-ms-win-core-path-l1-1-0.dll is missing` error, you are likely running the main package or the legacy runtime was built incorrectly.

Do not download `api-ms-win-core-path-l1-1-0.dll` from random DLL websites. Do not copy DLLs into `System32` or `SysWOW64`.
