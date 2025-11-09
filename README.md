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
1. Uruchom frontend (np. Live Server w VS Code) i otwórz `index.html`.
2. W osobnym terminalu uruchom backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # lub venv\Scripts\activate na Windows
   pip install -r requirements.txt
   python -m app.main
   ```
3. Wprowadź Frame Width i Frame Height.
4. Wybierz konfigurację (2x2) i opcje.
5. Kliknij "Calculate" i przejrzyj wyniki w zakładkach.
6. Exportuj listy do CSV lub kliknij "Export PDF" aby pobrać raport z backendu.

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

## TODO ETAP 2:
- DXF export (opcjonalnie)

## TODO ETAP 3:
- Konfiguracje 3x3, 4x4, 6x6, 9x9
- Save/Load projects
- Excel export
- Database integration
