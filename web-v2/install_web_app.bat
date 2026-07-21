@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python launcher was not found. Install Python 3.12 or newer.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Install Node.js 20 or newer.
  pause
  exit /b 1
)

if not exist "backend\.venv\Scripts\python.exe" (
  echo Creating the backend virtual environment...
  py -m venv "backend\.venv" || exit /b 1
)
echo Installing backend packages...
"backend\.venv\Scripts\python.exe" -m pip install --upgrade pip || exit /b 1
"backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt" || exit /b 1

echo Installing frontend packages...
pushd frontend
call npm install || (popd & exit /b 1)
popd

if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  powershell -NoProfile -Command "$p='backend\.env'; $s=[guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N'); (Get-Content $p).Replace('replace_with_a_long_random_secret',$s) | Set-Content $p"
)
if not exist "frontend\.env" copy "frontend\.env.example" "frontend\.env" >nul

echo.
echo INSTALLATION COMPLETE
echo Next: open backend\.env and replace replace_with_your_mysql_password.
echo Then double-click start_web_app.bat.
pause

