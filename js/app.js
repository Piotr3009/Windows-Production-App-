import { calculateWindow } from './calculations.js';
import { initRenderer, renderWindow, getPanzoomInstance } from './renderer.js';
import { initialiseTabs, updateSummary, populatePrecutTable, populateCutTable, populateShoppingTable, populateGlazingTable } from './ui.js';
import { registerExportHandlers } from './export.js';

let latestResult = null;

function getResult() {
    return latestResult;
}

export function getCurrentWindowData() {
    const frameWidthInput = document.getElementById('frame-width');
    const frameHeightInput = document.getElementById('frame-height');
    const configurationSelect = document.getElementById('configuration');
    const paintColorSelect = document.getElementById('paint-color');
    const glazingTypeSelect = document.getElementById('glazing-type');

    const frameWidth = Number(frameWidthInput?.value);
    const frameHeight = Number(frameHeightInput?.value);

    if (!Number.isFinite(frameWidth) || !Number.isFinite(frameHeight)) {
        return null;
    }

    const configuration = configurationSelect?.value || '2x2';
    const paintColor = paintColorSelect?.value || 'RAL 9010 White';
    const glazingType = glazingTypeSelect?.value || '4mm Clear';

    try {
        const result = calculateWindow(frameWidth, frameHeight, configuration, { paintColor, glazingType });
        return { ...result, config: configuration };
    } catch (error) {
        console.error('Failed to prepare window data for export:', error);
        return null;
    }
}

function setupForm() {
    const form = document.getElementById('window-form');
    const resetBtn = document.getElementById('reset-form');
    const canvas = document.getElementById('window-canvas');
    const emptyState = document.getElementById('canvas-empty');
    const submitBtn = document.getElementById('calculate-btn');
    const errorBox = document.getElementById('form-error');
    const defaultSubmitLabel = submitBtn ? submitBtn.textContent : 'Calculate';

    const setLoading = (isLoading) => {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Calculating…' : defaultSubmitLabel;
        submitBtn.classList.toggle('opacity-70', isLoading);
        submitBtn.classList.toggle('cursor-not-allowed', isLoading);
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (errorBox) {
            errorBox.textContent = '';
            errorBox.classList.add('hidden');
        }
        setLoading(true);

        try {
            const formData = new FormData(form);
            const frameWidth = Number(formData.get('frameWidth'));
            const frameHeight = Number(formData.get('frameHeight'));
            const configuration = formData.get('configuration');
            const paintColor = formData.get('paintColor');
            const glazingType = formData.get('glazingType');

            latestResult = calculateWindow(frameWidth, frameHeight, configuration, { paintColor, glazingType });
            latestResult.config = configuration;

            updateSummary(latestResult);
            populatePrecutTable(latestResult.precutList);
            populateCutTable(latestResult.cutList);
            populateShoppingTable(latestResult.shoppingList);
            populateGlazingTable(latestResult.glazing);

            renderWindow(canvas, latestResult);
            emptyState.style.display = 'none';
        } catch (error) {
            console.error(error);
            if (errorBox) {
                errorBox.textContent = error.message;
                errorBox.classList.remove('hidden');
            }
        }

        setLoading(false);
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        latestResult = null;
        updateSummaryPlaceholder();
        clearTables();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        emptyState.style.display = '';
        if (errorBox) {
            errorBox.textContent = '';
            errorBox.classList.add('hidden');
        }
        setLoading(false);
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
    ['summary-frame', 'summary-sash', 'summary-glass', 'summary-pane'].forEach(id => {
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
    registerExportHandlers(getResult, getCurrentWindowData);
    updateSummaryPlaceholder();
});
