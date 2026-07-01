@echo off
chcp 65001 >nul
setlocal
set "PYTHONUTF8=1"
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo building TeleVault portable dry-run folder...

set "BUILD_SCRIPT=%ROOT_DIR%tools\build_portable.py"
set "BUNDLED_PYTHON=%ROOT_DIR%runtime\python\python.exe"

if exist "%BUNDLED_PYTHON%" (
  set "PYTHON_CMD=%BUNDLED_PYTHON%"
  echo using bundled Python runtime: runtime\python\python.exe
  goto run_build
)

where py >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py"
  echo bundled Python runtime not found, trying py...
  goto run_build
)

where python >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=python"
  echo bundled Python runtime not found, trying python...
  goto run_build
)

echo.
echo python runtime not found
echo place bundled Python in runtime\python\python.exe or install Python/py launcher
echo.
pause
exit /b 1

:run_build
"%PYTHON_CMD%" "%BUILD_SCRIPT%"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo TeleVault portable build stopped with error code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)
pause
exit /b 0
