@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo starting TeleVault v2.9.5...

set "APP_SCRIPT=%~dp0app.py"
set "BUNDLED_PYTHON=%~dp0runtime\python\python.exe"

if exist "%BUNDLED_PYTHON%" (
  echo using bundled Python runtime: runtime\python\python.exe
  "%BUNDLED_PYTHON%" "%APP_SCRIPT%"
  goto after_run
)

where py >nul 2>nul
if not errorlevel 1 (
  echo bundled Python runtime not found, trying py...
  py "%APP_SCRIPT%"
  goto after_run
)

where python >nul 2>nul
if not errorlevel 1 (
  echo bundled Python runtime not found, trying python...
  python "%APP_SCRIPT%"
  goto after_run
)

echo.
echo python runtime не найден
echo запустите из подготовленного portable-комплекта или установите python
echo.
pause
exit /b 1

:after_run
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo TeleVault stopped with error code %EXIT_CODE%.
)
pause
exit /b %EXIT_CODE%
