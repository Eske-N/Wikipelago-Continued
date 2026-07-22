@echo off
setlocal
cd /d %~dp0

if exist .venv (
  echo Removing broken local .venv...
  rmdir /s /q .venv
)

call start_bridge.bat

endlocal
