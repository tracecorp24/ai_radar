@echo off
echo ========================================================
echo   Vendor-Bagimsiz AI Urunu Gelistirici ve Test Betigi
echo ========================================================
echo.

cd backend
if not exist ".venv" (
    echo [1/3] Python sanal ortami (.venv) olusturuluyor...
    python -m venv .venv
)

echo [2/3] Sanal ortam aktif ediliyor ve testler calistiriliyor...
call .venv\Scripts\activate.bat
pytest

echo.
echo ========================================================
echo   Testler Tamamlandi! API Sunucusunu Baslatmak Icin:
echo   uvicorn app.main:app --reload --port 8000
echo ========================================================
pause
