@echo off
setlocal
cd /d "%~dp0..\backend"
if not exist ".venv\Scripts\python.exe" (
  echo ERROR: Run install_web_app.bat first.
  pause
  exit /b 1
)
if not exist ".env" (
  echo ERROR: backend\.env is missing.
  pause
  exit /b 1
)
echo Checking the safe password-column compatibility migration...
".venv\Scripts\python.exe" -m app.db.migrate || (pause & exit /b 1)
echo Starting FastAPI on http://127.0.0.1:8000 ...
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

