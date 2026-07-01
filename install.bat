@echo off
title SISUKA ERP - Installer Offline
echo ==========================================
echo    SISUKA ERP - INSTALLER OFFLINE
echo ==========================================
echo.
echo [1] Mengecek Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js tidak ditemukan!
    echo.
    echo Silakan download dan install Node.js dari:
    echo https://nodejs.org/
    echo.
    pause
    exit
)
echo ✅ Node.js ditemukan!
echo.
echo [2] Mengecek dependencies...
if not exist "node_modules" (
    echo 📦 Menginstall dependencies...
    call npm install
) else (
    echo ✅ Dependencies sudah terinstall
)
echo.
echo [3] Menjalankan aplikasi...
echo.
echo ==========================================
echo    SISUKA ERP - SEDANG BERJALAN
echo    Buka browser: http://localhost:3000
echo    Tekan Ctrl+C untuk berhenti
echo ==========================================
echo.
call npm start
pause
