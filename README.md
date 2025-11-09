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

## Jak używać:
1. Uruchom lokalny serwer (np. Live Server w VS Code) lub otwórz `index.html` w przeglądarce.
2. Wprowadź Frame Width i Frame Height.
3. Wybierz konfigurację (2x2).
4. Kliknij "Calculate".
5. Zobacz wyniki w zakładkach.
6. Exportuj do CSV.

## Testowane wymiary:
- Minimum: 400x600mm
- Maximum: 3000x3000mm
- Typowe: 1200x1500mm

## Technologie:
- HTML5
- CSS3 (Tailwind CDN)
- Vanilla JavaScript
- Canvas API

## Struktura:
```
/css/styles.css      # Style
/js/app.js           # Main logic
/js/calculations.js  # Formuły z Excel
/js/renderer.js      # Canvas rendering
/js/ui.js            # UI updates
/js/export.js        # CSV export
```

## TODO ETAP 2:
- Python backend dla PDF generation
- FastAPI endpoints
- Professional PDF z drawings
- DXF export (opcjonalnie)

## TODO ETAP 3:
- Konfiguracje 3x3, 4x4, 6x6, 9x9
- Save/Load projects
- Excel export
- Database integration
