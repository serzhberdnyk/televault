# TeleVault runtime folder

Сюда можно положить portable Python runtime для Windows:

```text
runtime/
  python/
    python.exe
```

`run_windows.bat` сначала ищет `runtime\python\python.exe`. Если файла нет, запуск идет через системные `py` или `python`.

Windows 7 legacy runtime is separate and generated into:

```text
runtime/
  python38-win7/
    python.exe
    pythonw.exe
```

Do not replace the main `runtime\python\` runtime with Python 3.8 just for Windows 7. Use the separate Win7 legacy build scripts instead.

Не добавляйте сами бинарники Python в git. Эта папка не создает exe и не заменяет будущую упаковку приложения.
