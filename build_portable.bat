@echo off
cd /d %~dp0
echo building TeleVault portable dry-run folder...
py tools\build_portable.py
if errorlevel 1 (
  echo.
  echo py command failed, trying python...
  python tools\build_portable.py
)
pause
