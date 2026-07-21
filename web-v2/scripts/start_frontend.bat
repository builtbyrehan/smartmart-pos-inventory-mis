@echo off
setlocal
cd /d "%~dp0..\frontend"
if not exist "node_modules" (
  echo ERROR: Run install_web_app.bat first.
  pause
  exit /b 1
)
echo Starting React on http://127.0.0.1:5173 ...
call npm run dev -- --host 127.0.0.1

