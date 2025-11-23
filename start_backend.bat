@echo off
REM Skrypt uruchamiajacy backend serwera produkcyjnego (Smart Detection)

echo =========================================
echo   Sash Production Planner - Backend
echo =========================================
echo.

REM Przejdz do katalogu backendu
cd /d "%~dp0backend"

REM 1. Proba znalezienia Pythona (python, py, lub python3)
set PYTHON_CMD=python
%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% equ 0 goto :FOUND

set PYTHON_CMD=py
%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% equ 0 goto :FOUND

set PYTHON_CMD=python3
%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% equ 0 goto :FOUND

REM Jesli zaden nie dziala
echo Blad: Python nie zostal wykryty w systemie (PATH).
echo Sprobuj zainstalowac Python ponownie i zaznacz opcje "Add Python to PATH".
pause
exit /b 1

:FOUND
echo + Wykryto Pythona jako: %PYTHON_CMD%
echo.

REM 2. Sprawdzanie i instalacja zaleznosci
echo Sprawdzanie bibliotek...
%PYTHON_CMD% -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ! Instalowanie brakujacych zaleznosci...
    %PYTHON_CMD% -m pip install -r requirements.txt
) else (
    echo + Biblioteki sa juz zainstalowane
)

echo.
echo =========================================
echo   Uruchamianie serwera...
echo   Adres: http://localhost:8000
echo =========================================
echo.

REM 3. Uruchom serwer uzywajac wykrytej komendy
%PYTHON_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause