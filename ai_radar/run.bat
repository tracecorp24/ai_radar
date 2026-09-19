@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "PORT=3000"
set "APP_URL=http://127.0.0.1:%PORT%"
set "SERVER_READY=0"
set "REBUILD=0"

echo ======================================
echo   Savvy - One Click Local Runtime
echo ======================================
if not exist "package.json" (
  echo package.json bulunamadi.
  pause
  exit /b 1
)

for /f "tokens=*" %%P in ('powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { 'READY' }"') do if "%%P"=="READY" set "SERVER_READY=1"
if "%SERVER_READY%"=="1" (
  if not exist ".data\runtime.json" (
    call stop.bat
    set "SERVER_READY=0"
  ) else (
    for /f "tokens=*" %%R in ('node scripts\needs-production-build.mjs') do if "%%R"=="YES" set "REBUILD=1"
    if "!REBUILD!"=="1" (
      call stop.bat
      set "SERVER_READY=0"
    ) else (
      call :open_browser
      if errorlevel 1 echo Tarayici otomatik acilamadi. Adres: %APP_URL%
      exit /b 0
    )
  )
)

if not exist "node_modules" call npm install --legacy-peer-deps
if errorlevel 1 (
  echo npm install basarisiz oldu.
  pause
  exit /b 1
)
if not exist ".next-prod\BUILD_ID" set "REBUILD=1"
if exist ".next-prod\BUILD_ID" for /f "tokens=*" %%R in ('node scripts\needs-production-build.mjs') do if "%%R"=="YES" set "REBUILD=1"
if "%REBUILD%"=="1" call npm run build
if errorlevel 1 (
  echo Production build basarisiz oldu.
  pause
  exit /b 1
)

echo Next.js ve scheduler tek supervisor altinda baslatiliyor...
powershell -NoProfile -Command "$p=Start-Process -FilePath 'node.exe' -ArgumentList @('%~dp0scripts/runtime-supervisor.mjs') -WorkingDirectory '%~dp0' -WindowStyle Hidden -PassThru; if(-not $p){exit 1}"
if errorlevel 1 (
  echo Runtime baslatilamadi.
  pause
  exit /b 1
)
powershell -NoProfile -Command "$ready=$false; for($i=0;$i -lt 90;$i++){try{$r=Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%/api/system/readiness' -TimeoutSec 2;if($r.StatusCode -eq 200){$ready=$true;break}}catch{};Start-Sleep -Seconds 1};if(-not $ready){exit 1}"
if errorlevel 1 (
  echo Runtime hazir olmadi. .data\runtime.log dosyasini kontrol edin.
  pause
  exit /b 1
)
call :open_browser
if errorlevel 1 echo Tarayici otomatik acilamadi. Adres: %APP_URL%
echo Savvy hazir. Durdurmak icin stop.bat dosyasini calistirin.
exit /b 0

:open_browser
powershell -NoProfile -Command "try { Start-Process -FilePath '%APP_URL%' -ErrorAction Stop; exit 0 } catch { exit 1 }"
if not errorlevel 1 exit /b 0
rundll32.exe url.dll,FileProtocolHandler "%APP_URL%"
exit /b %errorlevel%
