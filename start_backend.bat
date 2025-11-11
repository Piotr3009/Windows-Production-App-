@echo off
REM Skrypt uruchamiajacy backend serwera produkcyjnego

echo =========================================
echo   Sash Production Planner - Backend
echo =========================================
echo.

REM Przejdz do katalogu backendu
cd /d "%~dp0backend"

REM Sprawdz, czy Python jest zainstalowany
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Blad: Python nie jest zainstalowany!
    pause
    exit /b 1
)

echo + Python znaleziony
echo.

REM Sprawdz, czy zaleznosci sa zainstalowane
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ! Instalowanie zaleznosci...
    python -m pip install -r requirements.txt
)

echo + Wszystkie zaleznosci zainstalowane
echo.
echo Uruchamianie serwera backendu...
echo URL: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Nacisnij Ctrl+C aby zatrzymac serwer
echo.

REM Uruchom serwer
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
