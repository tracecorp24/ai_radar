@echo off
setlocal EnableExtensions
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-runtime.ps1"
if errorlevel 1 (
  echo Runtime guvenli bicimde durdurulamadi.
  pause
  exit /b 1
)
exit /b 0
