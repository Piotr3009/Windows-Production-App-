#!/bin/bash
# Skrypt uruchamiający backend serwera produkcyjnego

echo "========================================="
echo "  Sash Production Planner - Backend"
echo "========================================="
echo ""

# Przejdź do katalogu backendu
cd "$(dirname "$0")/backend"

# Sprawdź, czy Python jest zainstalowany
if ! command -v python3 &> /dev/null; then
    echo "Błąd: Python 3 nie jest zainstalowany!"
    exit 1
fi

echo "✓ Python 3 znaleziony"

# Sprawdź, czy zależności są zainstalowane
if ! python3 -c "import fastapi" &> /dev/null; then
    echo ""
    echo "⚠ Instalowanie zależności..."
    python3 -m pip install -r requirements.txt
fi

echo "✓ Wszystkie zależności zainstalowane"
echo ""
echo "Uruchamianie serwera backendu..."
echo "URL: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Naciśnij Ctrl+C aby zatrzymać serwer"
echo ""

# Uruchom serwer
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
