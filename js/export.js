/**
 * export.js
 * Udostępnia funkcję tworzenia i pobierania plików CSV na podstawie danych obliczeniowych.
 */

let currentResult = null;

export function registerExportHandlers(getResult) {
    currentResult = getResult;
    const buttons = document.querySelectorAll('.export-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const result = currentResult();
            if (!result) {
                alert('Najpierw wykonaj obliczenia.');
                return;
            }
            const csv = buildCsv(type, result);
            downloadFile(csv, `${type}_list.csv`);
        });
    });
}

function buildCsv(type, result) {
    switch (type) {
        case 'precut':
            return convertArrayToCsv(['Element', 'Width (mm)', 'Length (mm)', 'Quantity', 'Material'], result.precutList.map(item => [
                item.element,
                item.width ?? '',
                item.length ?? '',
                item.quantity ?? 1,
                item.section || 'Hardwood'
            ]));
        case 'cut':
            return convertArrayToCsv(['Element', 'Specification', 'Quantity', 'Notes'], result.cutList.map(item => [
                item.element,
                item.specification,
                item.quantity,
                item.notes || ''
            ]));
        case 'shopping':
            const shoppingRows = [];
            ['timber', 'glass', 'hardware', 'finishing'].forEach(group => {
                (result.shoppingList[group] || []).forEach(item => {
                    shoppingRows.push([item.material, item.specification, item.quantity, item.unit]);
                });
            });
            return convertArrayToCsv(['Material', 'Specification', 'Quantity', 'Unit'], shoppingRows);
        case 'glazing':
            return convertArrayToCsv(['Pane', 'Width (mm)', 'Height (mm)', 'Type'], result.glazing.panes.map(pane => [
                pane.id,
                pane.width.toFixed(1),
                pane.height.toFixed(1),
                result.glazing.glazingType
            ]));
        default:
            throw new Error(`Nieobsługiwany typ CSV: ${type}`);
    }
}

function convertArrayToCsv(headers, rows) {
    const allRows = [headers, ...rows];
    return allRows.map(cols => cols.map(escapeCsvValue).join(',')).join('\n');
}

function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
