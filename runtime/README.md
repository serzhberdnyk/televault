# TeleVault runtime folder

Сюда можно положить portable Python runtime для Windows:

```text
runtime/
  python/
    python.exe
```

`run_windows.bat` сначала ищет `runtime\python\python.exe`. Если файла нет, запуск идет через системные `py` или `python`.

Не добавляйте сами бинарники Python в git. Эта папка не создает exe и не заменяет будущую упаковку приложения.
