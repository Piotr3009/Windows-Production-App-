# Sash Window Production Designer (ETAP 1)

Vanilla JavaScript MVP aplikacji do projektowania okien skrzyniowych (sash windows). Wszystkie zależności odwzorowują arkusz kalkulacyjny **"Sash Windows - 10.xlsx"**.

## Funkcjonalności

- Formularz wejściowy z walidacją dla szerokości/wysokości ramy, konfiguracji (2×2), koloru farby i typu szklenia.
- Silnik kalkulacyjny odwzorowujący potrącenia i współczynniki z Excela (stałe: 178, 106, 62.5, 29.5, 204, 170, 70, 114, 24, 100, 133, współczynniki 1.15/1.1 itp.).
- Dynamiczna wizualizacja okna na płótnie 2D z obsługą zoom/pan (biblioteka Panzoom).
- Podsumowanie kluczowych wymiarów, listy Pre-cut, Cut, Shopping oraz Glazing.
- Eksport każdej listy do pliku CSV.

## Struktura projektu

```
sash-window-web/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── calculations.js
│   ├── renderer.js
│   ├── ui.js
│   └── export.js
└── Sash Windows - 10.xlsx
```

## Uruchamianie

1. Otwórz `index.html` w nowoczesnej przeglądarce (Chrome/Edge/Firefox).
2. Wprowadź wymiary ramy i wybierz opcje.
3. Kliknij **Calculate**, aby zobaczyć wyniki oraz podgląd 2D.
4. W zakładkach znajdziesz listy materiałowe wraz z możliwością eksportu CSV.

## Zależności

- [Tailwind CSS CDN](https://cdn.tailwindcss.com)
- [Panzoom](https://github.com/timmywil/panzoom) – obsługa zoom/pan na canvasie

## TODO (następne etapy)

- Konfiguracje 3×3, 4×4, 6×6, 9×9.
- Szczegółowe kalkulacje hardware, ciężarów i malowania.
- Testy jednostkowe dla modułu kalkulacyjnego.
- Obsługa dodatkowych opcji (vent, obscure glazing, spacer colour, VAT kalkulacja kosztów).
- Generowanie raportów PDF.
