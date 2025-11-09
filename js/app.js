import { calculateWindow } from './calculations.js';
import { initRenderer, renderWindow, getPanzoomInstance } from './renderer.js';
import { initialiseTabs, updateSummary, populatePrecutTable, populateCutTable, populateShoppingTable, populateGlazingTable } from './ui.js';
import { registerExportHandlers } from './export.js';

let latestResult = null;

function getResult() {
    return latestResult;
}

function setupForm() {
    const form = document.getElementById('window-form');
    const resetBtn = document.getElementById('reset-form');
    const canvas = document.getElementById('window-canvas');
    const emptyState = document.getElementById('canvas-empty');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
            const formData = new FormData(form);
            const frameWidth = Number(formData.get('frameWidth'));
            const frameHeight = Number(formData.get('frameHeight'));
            const configuration = formData.get('configuration');
            const paintColor = formData.get('paintColor');
            const glazingType = formData.get('glazingType');

            latestResult = calculateWindow(frameWidth, frameHeight, configuration, { paintColor, glazingType });

            updateSummary(latestResult);
            populatePrecutTable(latestResult.precutList);
            populateCutTable(latestResult.cutList);
            populateShoppingTable(latestResult.shoppingList);
            populateGlazingTable(latestResult.glazing);

            renderWindow(canvas, latestResult);
            emptyState.style.display = 'none';
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        latestResult = null;
        updateSummaryPlaceholder();
        clearTables();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        emptyState.style.display = '';
    });

    initRenderer(canvas);

    document.getElementById('zoom-in').addEventListener('click', () => {
        const instance = getPanzoomInstance();
        if (instance) instance.zoomIn();
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        const instance = getPanzoomInstance();
        if (instance) instance.zoomOut();
    });
    document.getElementById('reset-view').addEventListener('click', () => {
        const instance = getPanzoomInstance();
        if (instance) instance.reset({ animate: true });
    });
}

function updateSummaryPlaceholder() {
    ['summary-frame', 'summary-top-sash', 'summary-bottom-sash', 'summary-glass-top', 'summary-glass-bottom'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '–';
    });
}

function clearTables() {
    ['precut-body', 'cut-body', 'shopping-body', 'glazing-body'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

function ready(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

ready(() => {
    initialiseTabs();
    setupForm();
    registerExportHandlers(getResult);
    updateSummaryPlaceholder();
});
