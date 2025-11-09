/**
 * export.js - ETAP 3
 * CSV/PDF/Excel export utilities and backend integration.
 */

export const BACKEND_URL = 'http://localhost:8000';

let resultProvider = null;
let windowDataProvider = null;

export function registerExportHandlers(getResult, getWindowData) {
    resultProvider = getResult;
    windowDataProvider = typeof getWindowData === 'function' ? getWindowData : null;

    const csvButtons = document.querySelectorAll('.export-btn');
    csvButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const result = resultProvider ? resultProvider() : null;
            if (!result) {
                alert('Please run calculations first.');
                return;
            }
            const csv = buildCsv(type, result);
            downloadFile(csv, `${type}_list.csv`, 'text/csv');
        });
    });

    const pdfButtons = document.querySelectorAll('.export-pdf-btn');
    pdfButtons.forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            await exportPDF(btn);
        });
    });

    const excelBtn = document.getElementById('export-excel-btn');
    if (excelBtn) {
        excelBtn.addEventListener('click', exportExcel);
    }

    if (typeof window !== 'undefined') {
        window.exportPDF = exportPDF;
        window.exportExcel = exportExcel;
        window.checkBackendHealth = checkBackendHealth;
    }
}

export function generateCsvContent(type, result) {
    return buildCsv(type, result);
}

function buildCsv(type, result) {
    switch (type) {
        case 'precut':
            return convertArrayToCsv(['Element', 'Width (mm)', 'Length (mm)', 'Quantity', 'Material'], result.precutList.map((item) => [
                item.element,
                item.width ?? '',
                item.length ?? '',
                item.quantity ?? 1,
                item.section || item.material || 'Hardwood'
            ]));
        case 'cut':
            return convertArrayToCsv(['Element', 'Specification', 'Quantity', 'Notes'], result.cutList.map((item) => [
                item.element,
                item.specification,
                item.quantity,
                item.notes || ''
            ]));
        case 'shopping':
            const shoppingRows = [];
            ['timber', 'glass', 'hardware', 'finishing'].forEach((group) => {
                (result.shoppingList[group] || []).forEach((item) => {
                    shoppingRows.push([item.material, item.specification, item.quantity, item.unit]);
                });
            });
            return convertArrayToCsv(['Material', 'Specification', 'Quantity', 'Unit'], shoppingRows);
        case 'glazing':
            return convertArrayToCsv(['Pane', 'Width (mm)', 'Height (mm)', 'Type'], result.glazing.panes.map((pane) => [
                pane.id,
                pane.width.toFixed(1),
                pane.height.toFixed(1),
                result.glazing.glazingType
            ]));
        default:
            throw new Error(`Unsupported CSV type: ${type}`);
    }
}

function convertArrayToCsv(headers, rows) {
    const allRows = [headers, ...rows];
    return allRows.map((cols) => cols.map(escapeCsvValue).join(',')).join('\n');
}

function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

export function downloadFile(content, filename, mimeType = 'application/octet-stream') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function exportPDF(triggerButton = null) {
    const pdfButtons = triggerButton ? [triggerButton] : Array.from(document.querySelectorAll('.export-pdf-btn'));
    setPdfButtonsState(pdfButtons, true);

    try {
        const rawWindowData = windowDataProvider ? windowDataProvider() : (resultProvider ? resultProvider() : null);
        if (!rawWindowData) {
            throw new Error('No window data. Run calculations first.');
        }

        const windowData = prepareWindowDataForPdf(rawWindowData);
        if (!windowData) {
            throw new Error('Failed to prepare data for PDF export.');
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
        downloadFile(blob, `window_spec_${Date.now()}.pdf`, 'application/pdf');
        showNotification('PDF generated successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification(`PDF export failed: ${error.message}`, 'error');
    } finally {
        setPdfButtonsState(pdfButtons, false);
    }
}

export async function exportExcel() {
    try {
        const exportBtn = document.getElementById('export-excel-btn');
        if (exportBtn) {
            exportBtn.textContent = 'Generating Excel…';
            exportBtn.disabled = true;
        }

        const windowData = windowDataProvider ? windowDataProvider() : (resultProvider ? resultProvider() : null);
        if (!windowData) {
            throw new Error('No window data available');
        }

        const response = await fetch(`${BACKEND_URL}/api/export/excel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ windowData: prepareWindowDataForPdf(windowData) })
        });

        if (!response.ok) {
            const error = await safeParseJson(response);
            throw new Error(error?.detail || 'Excel generation failed');
        }

        const blob = await response.blob();
        downloadFile(blob, `window_spec_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        showNotification('Excel generated successfully!', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification(`Excel export failed: ${error.message}`, 'error');
    } finally {
        const exportBtn = document.getElementById('export-excel-btn');
        if (exportBtn) {
            exportBtn.textContent = 'Export Excel';
            exportBtn.disabled = false;
        }
    }
}

export async function checkBackendHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
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
        panes: glazingPanes,
        rows: rawData.glazing?.rows ?? null,
        cols: rawData.glazing?.cols ?? null
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
        if (value && typeof value === 'object' && (value.vertical || value.horizontal)) {
            if (value.vertical) {
                result[`${key}Vertical`] = {
                    element: value.vertical.element || 'Vertical glazing bar',
                    width: Number(value.vertical.width ?? 0),
                    length: Number(value.vertical.length ?? 0),
                    quantity: Number(value.vertical.quantity ?? 0),
                    material: value.vertical.material || 'Timber',
                    preCutLength: value.vertical.preCutLength ?? value.vertical.length ?? null,
                    cutLength: value.vertical.cutLength ?? value.vertical.length ?? null,
                    positions: value.vertical.positions || []
                };
            }
            if (value.horizontal) {
                result[`${key}Horizontal`] = {
                    element: value.horizontal.element || 'Horizontal glazing bar',
                    width: Number(value.horizontal.width ?? 0),
                    length: Number(value.horizontal.length ?? 0),
                    quantity: Number(value.horizontal.quantity ?? 0),
                    material: value.horizontal.material || 'Timber',
                    preCutLength: value.horizontal.preCutLength ?? value.horizontal.length ?? null,
                    cutLength: value.horizontal.cutLength ?? value.horizontal.length ?? null,
                    positions: value.horizontal.positions || []
                };
            }
            return;
        }
        result[key] = {
            element: value.element || key,
            width: Number(value.width ?? 0),
            length: Number(value.length ?? value.cutLength ?? value.preCutLength ?? 0),
            quantity: Number(value.quantity ?? 1),
            material: value.material || value.section || 'Timber',
            preCutLength: value.preCutLength ?? value.length ?? null,
            cutLength: value.cutLength ?? null,
            section: value.section || null
        };
    });
    return result;
}

function flattenShoppingList(shopping) {
    if (!shopping || typeof shopping !== 'object') return [];
    const items = [];
    Object.values(shopping).forEach((group) => {
        (group || []).forEach((item) => {
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

export function showNotification(message, type = 'info') {
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
    list.forEach((btn) => {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.textContent = isLoading ? 'Generating PDF…' : 'Export PDF';
        btn.classList.toggle('opacity-60', isLoading);
        btn.classList.toggle('cursor-not-allowed', isLoading);
    });
}
