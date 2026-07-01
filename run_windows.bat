@echo off
cd /d %~dp0
echo starting TeleVault v2.5.27...
py app.py
if errorlevel 1 (
  echo.
  echo py command failed, trying python...
  python app.py
)
pause
