@echo off
setlocal

set "ROOT_DIR=%~dp0"
if not exist "%ROOT_DIR%ai_radar\run.bat" (
  echo ai_radar klasoru veya run.bat bulunamadi.
  pause
  exit /b 1
)

cd /d "%ROOT_DIR%ai_radar"
call run.bat
