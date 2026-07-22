@echo off
setlocal
cd /d %~dp0

set "PYEXE="
if exist "%LocalAppData%\Python\pythoncore-3.14-64\python.exe" set "PYEXE=%LocalAppData%\Python\pythoncore-3.14-64\python.exe"
if not defined PYEXE if exist "%LocalAppData%\Programs\Python\Python313\python.exe" set "PYEXE=%LocalAppData%\Programs\Python\Python313\python.exe"
if not defined PYEXE if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "PYEXE=%LocalAppData%\Programs\Python\Python312\python.exe"

if not defined PYEXE (
  echo Could not find Python executable.
  echo Install Python, then run this again.
  pause
  exit /b 1
)

"%PYEXE%" -c "import aiohttp,websockets" >nul 2>nul
if errorlevel 1 (
  echo Installing required packages for current user...
  "%PYEXE%" -m pip install --user --upgrade pip
  "%PYEXE%" -m pip install --user -r requirements.txt
)

echo Starting Wikipelago bridge...
"%PYEXE%" bridge.py

endlocal
