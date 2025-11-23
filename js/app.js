import { deriveWindowData, summariseProjectWindows, CONSTANTS } from './calculations.js';
import { optimisePrecut } from './optimizer.js';
import {
  addWindow,
  finishProject,
  removeWindow,
  resetCurrentWindow,
  selectWindow,
  setDerivedData,
  setActiveView,
  state,
  subscribe,
  updateCurrentWindow,
  updateProjectInfo,
  updateSettings,
} from './state.js';
import { renderWindowPreview } from './renderer.js';
import { initUI } from './ui.js';
import { registerExportHandlers } from './export.js';

const projectLabel = document.getElementById('active-project-label');
const statusText = document.getElementById('status-text');
const timestamp = document.getElementById('timestamp');

function buildPatchFromPath(path, value) {
  const segments = path.split('.');
  const patch = {};
  let cursor = patch;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
    } else {
      cursor[segment] = {};
      cursor = cursor[segment];
    }
  });
  return patch;
}

function notifyStatus(message) {
  if (statusText) statusText.textContent = message;
  if (timestamp) timestamp.textContent = new Date().toLocaleString();
}

function handleProjectChange(field, value) {
  updateProjectInfo({ [field]: value });
  if (field === 'name' && projectLabel) {
    projectLabel.textContent = value || 'Nowy projekt';
  }
}

function handleWindowChange(path, value) {
  updateCurrentWindow(buildPatchFromPath(path, value));
  if (path === 'sash.grid.mode' && value !== 'custom') {
    const [rows, cols] = value.split('x').map((num) => Number(num));
    updateCurrentWindow({ sash: { grid: { rows, cols } } });
  }
  schedulePreview();
}

function handleToggleRawSection(section, enabled) {
  const next = state.currentWindow.materials.sashRaw.map((entry) =>
    entry.section === section ? { ...entry, enabled } : entry,
  );
  updateCurrentWindow({ materials: { sashRaw: next } });
}

function createWindowPayload() {
  const frameWidth = Number(state.currentWindow.frame.width);
  const frameHeight = Number(state.currentWindow.frame.height);
  
  if (!Number.isFinite(frameWidth) || frameWidth <= 0) {
    throw new Error('Podaj poprawną szerokość ramy.');
  }
  if (!Number.isFinite(frameHeight) || frameHeight <= 0) {
    throw new Error('Podaj poprawną wysokość ramy.');
  }

  const derived = deriveWindowData(state.currentWindow, state.settings);
  return {
    ...state.currentWindow,
    components: derived.components,
    glazingItems: derived.glazingItems,
    sash: {
      ...state.currentWindow.sash,
      grid: {
        ...state.currentWindow.sash.grid,
        rows: derived.config.rows,
        cols: derived.config.cols,
      },
    },
  };
}

function refreshDerivedData() {
  const summary = summariseProjectWindows(state.project.windows, state.settings);
  const optimization = optimisePrecut(summary.precut);
  setDerivedData({ cutLists: summary.cutLists, precut: summary.precut, glazing: summary.glazing, optimization });
}

function schedulePreview() {
  try {
    renderWindowPreview(state.currentWindow, state.settings);
  } catch (error) {
    console.warn('Preview rendering skipped', error);
  }
}

function handleNewWindow() {
  resetCurrentWindow();
  schedulePreview();
  notifyStatus('Przygotowano formularz nowego okna.');
}

function handleSaveWindow() {
  try {
    const payload = createWindowPayload();
    addWindow(payload);
    resetCurrentWindow();
    refreshDerivedData();
    notifyStatus('Okno zapisane do projektu.');
  } catch (error) {
    notifyStatus(error.message);
  }
}

function handleFinishProject() {
  finishProject();
  refreshDerivedData();
  setActiveView('precut');
  notifyStatus('Projekt zakończony. Sprawdź zakładkę Pre-Cut.');
}

function handleSelectWindow(windowId) {
  selectWindow(windowId);
  schedulePreview();
}

function handleRemoveWindow(windowId) {
  removeWindow(windowId);
  refreshDerivedData();
  schedulePreview();
}

function handleAddManualBar(orientation) {
  const derived = deriveWindowData(state.currentWindow, state.settings);
  const existing = [...state.currentWindow.sash.grid.customBars[orientation]];
  const dimension = orientation === 'vertical' ? derived.sashWidth : derived.sashHeight / 2;
  const defaultPosition = Math.round(dimension / (existing.length + 2));
  const nextBars = [...existing, defaultPosition].sort((a, b) => a - b);
  const patch = { sash: { grid: { customBars: { [orientation]: nextBars } } } };
  updateCurrentWindow(patch);
  schedulePreview();
}

function handleRemoveManualBar(orientation, value) {
  const nextBars = state.currentWindow.sash.grid.customBars[orientation].filter((item) => item !== value);
  const patch = { sash: { grid: { customBars: { [orientation]: nextBars } } } };
  updateCurrentWindow(patch);
  schedulePreview();
}

function handleSettingsChange(key, value) {
  if (Number.isNaN(value) && !key.startsWith('sectionMap')) return;
  if (key.startsWith('sectionMap')) {
    const [, mapKey] = key.split('.');
    updateSettings({ sectionMap: { [mapKey]: value } });
  } else {
    const mapping = {
      'settings-kerf': 'kerf',
      'settings-end-trim': 'endTrim',
      'settings-min-piece': 'minimumPiece',
      'settings-stock-sash': 'stockLengthSash',
      'settings-stock-box': 'stockLengthBox',
      'settings-horn-extension': 'hornExtensionDefault',
      'settings-glass-allowance-w': 'glazingAllowanceWidth',
      'settings-glass-allowance-h': 'glazingAllowanceHeight',
    };
    const targetKey = mapping[key];
    if (targetKey) {
      updateSettings({ [targetKey]: value });
    }
  }
  refreshDerivedData();
  schedulePreview();
}

// --- DXF Export Logic ---

function generateDXF(windowSpec) {
  if (!windowSpec) return null;
  const { width, height } = windowSpec.frame;
  
  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
  
  const rect = (x, y, w, h, layer) => {
      return `0\nLWPOLYLINE\n8\n${layer}\n90\n4\n70\n1\n` +
             `10\n${x}\n20\n${y}\n` +
             `10\n${x+w}\n20\n${y}\n` +
             `10\n${x+w}\n20\n${y+h}\n` +
             `10\n${x}\n20\n${y+h}\n` +
             `10\n${x}\n20\n${y}\n` + // Zamknięcie pętli
             `0\nSEQEND\n`;
  };

  // Frame Layer
  dxf += rect(0, 0, width, height, "FRAME");
  
  // Sash Layer
  // Używamy bezpiecznych wartości domyślnych, jeśli CONSTANTS nie są załadowane
  const sashWidthDeduction = (CONSTANTS && CONSTANTS.SASH_WIDTH_DEDUCTION) || 178;
  const sashHeightDeduction = (CONSTANTS && CONSTANTS.SASH_HEIGHT_DEDUCTION) || 106;

  const sashW = width - sashWidthDeduction;
  const sashH = height - sashHeightDeduction;
  const sashX = (width - sashW) / 2;
  const sashY = (height - sashH) / 2;
  dxf += rect(sashX, sashY, sashW, sashH, "SASH");
  
  dxf += `0\nENDSEC\n0\nEOF`;
  return dxf;
}

function handleDxfExport() {
  try {
      const dxfContent = generateDXF(state.currentWindow);
      if (!dxfContent) throw new Error("Brak danych okna do eksportu.");

      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.currentWindow.name || 'window'}.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notifyStatus('Pobrano plik DXF.');
  } catch (e) {
      console.error(e);
      notifyStatus('Błąd generowania DXF.');
  }
}

// --- Initialization ---

function initialise() {
  initUI({
    onProjectChange: handleProjectChange,
    onWindowChange: handleWindowChange,
    onToggleRawSection: handleToggleRawSection,
    onNewWindow: handleNewWindow,
    onSaveWindow: handleSaveWindow,
    onFinishProject: handleFinishProject,
    onSelectWindow: handleSelectWindow,
    onRemoveWindow: handleRemoveWindow,
    onAddManualBar: handleAddManualBar,
    onRemoveManualBar: handleRemoveManualBar,
    onSettingsChange: handleSettingsChange,
  });

  // Rejestracja handlerów eksportu PDF/CSV/Excel
  if (typeof registerExportHandlers === 'function') {
      registerExportHandlers(
          () => state.project, // getResult (może wymagać dostosowania zależnie od export.js)
          () => state.currentWindow // getWindowData
      );
  }

  subscribe(() => {
    if (projectLabel) projectLabel.textContent = state.project.name || 'Nowy projekt';
    schedulePreview();
  });

  // Obsługa przycisku DXF
  const dxfBtn = document.getElementById('btn-dxf-export');
  if (dxfBtn) {
    dxfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDxfExport();
    });
  }
  
  // Obsługa przycisku Optymalizacji
  const optBtn = document.getElementById('btn-run-opt');
  if (optBtn) {
      optBtn.addEventListener('click', (e) => {
          e.preventDefault();
          refreshDerivedData();
          notifyStatus('Optymalizacja zaktualizowana.');
      });
  }

  schedulePreview();
  notifyStatus('Gotowy do konfiguracji.');
}

window.addEventListener('DOMContentLoaded', initialise);