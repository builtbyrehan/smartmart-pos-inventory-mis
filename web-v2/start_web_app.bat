@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.venv\Scripts\python.exe" (
  echo ERROR: Run install_web_app.bat first.
  pause
  exit /b 1
)
if not exist "backend\.env" (
  echo ERROR: backend\.env is missing. Run install_web_app.bat first.
  pause
  exit /b 1
)
findstr /c:"replace_with_your_mysql_password" "backend\.env" >nul
if not errorlevel 1 (
  echo ERROR: Open backend\.env and enter your MySQL password first.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_all.ps1"

