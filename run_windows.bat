@echo off
cd /d %~dp0
echo starting TeleVault v2.6.3...
py app.py
if errorlevel 1 (
  echo.
  echo py command failed, trying python...
  python app.py
)
pause
