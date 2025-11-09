/**
 * export.js
 * Obsługuje eksport CSV oraz komunikację z backendem PDF.
 */

const BACKEND_URL = 'http://localhost:8000';

let resultProvider = null;
let windowDataProvider = null;

export function registerExportHandlers(getResult, getWindowData) {
    resultProvider = getResult;
    windowDataProvider = typeof getWindowData === 'function' ? getWindowData : null;

    const csvButtons = document.querySelectorAll('.export-btn');
    csvButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const result = resultProvider ? resultProvider() : null;
            if (!result) {
                alert('Najpierw wykonaj obliczenia.');
                return;
            }
            const csv = buildCsv(type, result);
            downloadFile(csv, `${type}_list.csv`);
        });
    });

    const pdfButtons = document.querySelectorAll('.export-pdf-btn');
    pdfButtons.forEach(btn => {
        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            await exportPDF(btn);
        });
    });

    if (typeof window !== 'undefined') {
        window.exportPDF = exportPDF;
        window.checkBackendHealth = checkBackendHealth;
    }
}

/**
 * Eksport pomocniczy dla testów – zwraca CSV bez pobierania pliku.
 * @param {string} type
 * @param {object} result
 * @returns {string}
 */
export function generateCsvContent(type, result) {
    return buildCsv(type, result);
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

/**
 * Export window specification to PDF via backend.
 * @param {HTMLButtonElement|null} triggerButton
 */
export async function exportPDF(triggerButton = null) {
    const pdfButtons = triggerButton ? [triggerButton] : Array.from(document.querySelectorAll('.export-pdf-btn'));
    setPdfButtonsState(pdfButtons, true);

    try {
        const rawWindowData = windowDataProvider ? windowDataProvider() : (resultProvider ? resultProvider() : null);
        if (!rawWindowData) {
            throw new Error('Brak danych okna. Najpierw wykonaj obliczenia.');
        }

        const windowData = prepareWindowDataForPdf(rawWindowData);
        if (!windowData) {
            throw new Error('Nie udało się przygotować danych do PDF.');
        }

        const requestBody = {
            windowData,
            includeDrawings: true,
            includePreCutList: true,
            includeCutList: true,
            includeShoppingList: true,
            includeGlazingSpec: true
        };

        const response = await fetch(`${BACKEND_URL}/api/export/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await safeParseJson(response);
            const message = error?.detail || 'PDF generation failed';
            throw new Error(message);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `window_spec_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showNotification('PDF generated successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification(`PDF export failed: ${error.message}`, 'error');
    } finally {
        setPdfButtonsState(pdfButtons, false);
    }
}

export async function checkBackendHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

function prepareWindowDataForPdf(rawData) {
    if (!rawData) return null;

    const config = rawData.glazing?.configuration || rawData.config || '2x2';
    const frame = {
        width: Number(rawData.frame?.width ?? 0),
        height: Number(rawData.frame?.height ?? 0)
    };
    const sash = {
        width: Number(rawData.sash?.width ?? 0),
        height: Number(rawData.sash?.height ?? 0)
    };

    const components = {
        frame: transformComponentGroup(rawData.components?.frame || {}),
        sash: transformComponentGroup(rawData.components?.sash || {})
    };

    const glazingPanes = (rawData.glazing?.panes || []).map((pane, index) => ({
        id: typeof pane.id === 'number' ? pane.id : index + 1,
        width: Number(pane.width ?? 0),
        height: Number(pane.height ?? 0),
        position: pane.position || `Pane ${index + 1}`
    }));

    const glazing = {
        configuration: config,
        totalPanes: glazingPanes.length,
        panes: glazingPanes
    };

    const shoppingItems = flattenShoppingList(rawData.shoppingList || rawData.shopping || {});

    return {
        frame,
        sash,
        components,
        glazing,
        shopping: shoppingItems.length ? shoppingItems : undefined,
        config,
        options: rawData.options || {}
    };
}

function transformComponentGroup(group) {
    const result = {};
    Object.entries(group).forEach(([key, value]) => {
        if (!value) return;
        result[key] = {
            element: value.element || key,
            width: Number(value.width ?? 0),
            length: Number(value.length ?? value.cutLength ?? value.preCutLength ?? 0),
            quantity: Number(value.quantity ?? 1),
            material: value.material || value.section || 'Timber',
            preCutLength: value.preCutLength ?? value.length ?? null,
            cutLength: value.cutLength ?? null
        };
    });
    return result;
}

function flattenShoppingList(shopping) {
    if (!shopping || typeof shopping !== 'object') return [];
    const items = [];
    Object.values(shopping).forEach(group => {
        (group || []).forEach(item => {
            items.push({
                material: item.material,
                specification: item.specification,
                quantity: Number(item.quantity ?? 0),
                unit: item.unit || 'ea'
            });
        });
    });
    return items;
}

async function safeParseJson(response) {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
}

function showNotification(message, type = 'info') {
    if (typeof document === 'undefined') return;
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function setPdfButtonsState(buttons, isLoading) {
    const list = Array.isArray(buttons) ? buttons : [];
    list.forEach(btn => {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.textContent = isLoading ? 'Generating PDF…' : 'Export PDF';
        btn.classList.toggle('opacity-60', isLoading);
        btn.classList.toggle('cursor-not-allowed', isLoading);
    });
}
