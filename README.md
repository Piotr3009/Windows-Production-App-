# Sash Window Production App

## Opis
Aplikacja webowa do projektowania okien skrzyniowych i generowania list produkcyjnych.

## Funkcje ETAP 1 (MVP):
✅ Obliczanie wymiarów okien (konfiguracja 2x2)
✅ Real-time 2D preview
✅ Pre-cut list
✅ Cut list
✅ Shopping list
✅ Glazing specification
✅ CSV export

## Funkcje ETAP 2:
✅ Python FastAPI backend
✅ Generowanie profesjonalnego PDF (ReportLab + Matplotlib)
✅ Rysunki techniczne i listy materiałowe
✅ Integracja frontendu z backendem (fetch JSON → PDF download)

## Jak używać:

### Szybki start (zalecane):

#### Linux/Mac:
```bash
# 1. Uruchom backend
chmod +x start_backend.sh
./start_backend.sh
```

#### Windows:
```cmd
# 1. Uruchom backend
start_backend.bat
```

### 2. Uruchom frontend:
Po uruchomieniu backendu, otwórz plik `index.html` w przeglądarce lub użyj Live Server w VS Code.

Backend będzie dostępny pod adresem: http://localhost:8000

### Ręczne uruchomienie backendu:
Jeśli skrypty startowe nie działają, możesz uruchomić backend ręcznie:
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Korzystanie z aplikacji:
1. Dodaj komponenty używając przycisku "Add Component"
2. Skonfiguruj parametry optymalizacji w zakładce "Pre-Pre Cut"
3. Uruchom optymalizację klikając "Run Optimization"
4. Generuj raporty w zakładce "Reports"
5. Eksportuj do PDF lub Excel używając przycisków w nagłówku

## Testowane wymiary:
- Minimum: 400x600mm
- Maximum: 3000x3000mm
- Typowe: 1200x1500mm

## Technologie:
- HTML5
- CSS3 (Tailwind CDN)
- Vanilla JavaScript
- Canvas API
- Python 3.11+
- FastAPI, ReportLab, Matplotlib

## Struktura:
```
backend/
  app/
    main.py          # FastAPI aplikacja
    models.py        # Pydantic modele
    pdf_generator.py # Generowanie PDF
  requirements.txt
  README.md
css/styles.css       # Style
js/app.js            # Main logic + integracja PDF
js/calculations.js   # Formuły z Excel
js/renderer.js       # Canvas rendering
js/ui.js             # UI updates
js/export.js         # CSV + PDF export
output/              # Wygenerowane pliki PDF
```

## Funkcje ETAP 3:
✅ Konfiguracje 2x2, 3x3, 4x4, 6x6, 9x9, custom
✅ Save/Load projects (SQLite database)
✅ Excel export (openpyxl)
✅ Database integration
✅ Professional UI with workshop theme
✅ Component drawings in SVG
✅ Optimization with Best-Fit Decreasing heuristic
✅ PDF and Excel report generation

## TODO:
- DXF export (opcjonalnie)
- OR-Tools integration for exact optimization
- Multi-project management UI
- Project templates
