import { calculateWindow } from './calculations.js';
import { initRenderer, renderWindow, getPanzoomInstance } from './renderer.js';
import {
    initialiseTabs,
    updateSummary,
    populatePrecutTable,
    populateCutTable,
    populateShoppingTable,
    populateGlazingTable
} from './ui.js';
import { registerExportHandlers } from './export.js';
import { initProjectManagement } from './projects.js';
import { initBatchOperations } from './batch.js';

let latestResult = null;
let canvasRef = null;
let emptyStateRef = null;
let errorBoxRef = null;
let formRef = null;

function getResult() {
    return latestResult;
}

export function getCurrentWindowData() {
    if (!latestResult) return null;
    if (typeof structuredClone === 'function') {
        return structuredClone(latestResult);
    }
    try {
        return JSON.parse(JSON.stringify(latestResult));
    } catch (error) {
        return latestResult;
    }
}

function getFormValues() {
    const formData = new FormData(formRef);
    const frameWidth = Number(formData.get('frameWidth'));
    const frameHeight = Number(formData.get('frameHeight'));
    const configuration = formData.get('configuration');
    const paintColor = formData.get('paintColor');
    const glazingType = formData.get('glazingType');
    const profile = formData.get('profile');
    const hardware = formData.get('hardware');
    const customRows = formData.get('customRows');
    const customCols = formData.get('customCols');

    return {
        frameWidth,
        frameHeight,
        configuration,
        options: {
            paintColor,
            glazingType,
            profile,
            hardware,
            customRows,
            customCols
        }
    };
}

function performCalculation(values) {
    const submitBtn = document.getElementById('calculate-btn');
    const defaultSubmitLabel = submitBtn ? submitBtn.dataset.defaultLabel || submitBtn.textContent : 'Calculate';

    const setLoading = (isLoading) => {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Calculating…' : defaultSubmitLabel;
        submitBtn.classList.toggle('opacity-70', isLoading);
        submitBtn.classList.toggle('cursor-not-allowed', isLoading);
    };

    setLoading(true);
    hideError();

    try {
        const { frameWidth, frameHeight, configuration, options } = values;
        latestResult = calculateWindow(frameWidth, frameHeight, configuration, options);
        latestResult.config = latestResult.config || configuration;
        latestResult.shopping = latestResult.shoppingList;

        updateSummary(latestResult);
        populatePrecutTable(latestResult.precutList);
        populateCutTable(latestResult.cutList);
        populateShoppingTable(latestResult.shoppingList);
        populateGlazingTable(latestResult.glazing);

        renderWindow(canvasRef, latestResult);
        if (emptyStateRef) emptyStateRef.style.display = 'none';
    } catch (error) {
        console.error(error);
        showError(error.message);
    }

    setLoading(false);
}

function setupForm() {
    formRef = document.getElementById('window-form');
    const resetBtn = document.getElementById('reset-form');
    canvasRef = document.getElementById('window-canvas');
    emptyStateRef = document.getElementById('canvas-empty');
    errorBoxRef = document.getElementById('form-error');
    const configurationSelect = document.getElementById('configuration');
    const customConfigGroup = document.getElementById('custom-config-group');
    const submitBtn = document.getElementById('calculate-btn');

    if (submitBtn && !submitBtn.dataset.defaultLabel) {
        submitBtn.dataset.defaultLabel = submitBtn.textContent || 'Calculate';
    }

    const toggleCustomFields = () => {
        const isCustom = configurationSelect?.value === 'custom';
        customConfigGroup?.classList.toggle('hidden', !isCustom);
    };

    configurationSelect?.addEventListener('change', toggleCustomFields);
    toggleCustomFields();

    formRef.addEventListener('submit', (event) => {
        event.preventDefault();
        const values = getFormValues();
        performCalculation(values);
    });

    resetBtn.addEventListener('click', () => {
        formRef.reset();
        latestResult = null;
        updateSummaryPlaceholder();
        clearTables();
        const ctx = canvasRef.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
        if (emptyStateRef) emptyStateRef.style.display = '';
        hideError();
        const panzoom = getPanzoomInstance();
        panzoom?.reset();
        toggleCustomFields();
    });

    initRenderer(canvasRef);

    document.getElementById('zoom-in')?.addEventListener('click', () => {
        getPanzoomInstance()?.zoomIn();
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
        getPanzoomInstance()?.zoomOut();
    });
    document.getElementById('reset-view')?.addEventListener('click', () => {
        getPanzoomInstance()?.reset();
    });
}

function showError(message) {
    if (!errorBoxRef) return;
    errorBoxRef.textContent = message;
    errorBoxRef.classList.remove('hidden');
}

function hideError() {
    if (!errorBoxRef) return;
    errorBoxRef.textContent = '';
    errorBoxRef.classList.add('hidden');
}

function updateSummaryPlaceholder() {
    ['summary-frame', 'summary-sash', 'summary-glass', 'summary-pane'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '–';
    });
}

function clearTables() {
    ['precut-body', 'cut-body', 'shopping-body', 'glazing-body'].forEach((id) => {
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

function loadWindowData(windowData) {
    if (!windowData) return;

    const frameWidthInput = document.getElementById('frame-width');
    const frameHeightInput = document.getElementById('frame-height');
    const configurationSelect = document.getElementById('configuration');
    const paintColorSelect = document.getElementById('paint-color');
    const glazingTypeSelect = document.getElementById('glazing-type');
    const profileSelect = document.getElementById('profile');
    const hardwareSelect = document.getElementById('hardware');
    const customRowsInput = document.getElementById('custom-rows');
    const customColsInput = document.getElementById('custom-cols');

    frameWidthInput.value = Math.round(windowData.frame?.width ?? 0);
    frameHeightInput.value = Math.round(windowData.frame?.height ?? 0);
    configurationSelect.value = windowData.config || windowData.glazing?.configuration || '2x2';

    if (paintColorSelect && windowData.options?.paintColor) {
        paintColorSelect.value = windowData.options.paintColor;
    }
    if (glazingTypeSelect && windowData.options?.glazingType) {
        glazingTypeSelect.value = windowData.options.glazingType;
    }
    if (profileSelect && windowData.options?.profile) {
        profileSelect.value = windowData.options.profile;
    }
    if (hardwareSelect && windowData.options?.hardware) {
        hardwareSelect.value = windowData.options.hardware;
    }

    if (customRowsInput && windowData.options?.customRows) {
        customRowsInput.value = windowData.options.customRows;
    }
    if (customColsInput && windowData.options?.customCols) {
        customColsInput.value = windowData.options.customCols;
    }

    const toggleCustomFields = () => {
        const customGroup = document.getElementById('custom-config-group');
        const isCustom = configurationSelect.value === 'custom';
        customGroup?.classList.toggle('hidden', !isCustom);
    };
    toggleCustomFields();

    performCalculation(getFormValues());
}

ready(() => {
    initialiseTabs();
    setupForm();
    registerExportHandlers(getResult, getCurrentWindowData);
    initProjectManagement({ getCurrentWindowData, loadWindowData });
    initBatchOperations({ getCurrentWindowData });
    updateSummaryPlaceholder();
});
