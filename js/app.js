import { deriveWindowData, summariseProjectWindows } from './calculations.js';
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
  statusText.textContent = message;
  timestamp.textContent = new Date().toLocaleString();
}

function handleProjectChange(field, value) {
  updateProjectInfo({ [field]: value });
  if (field === 'name') {
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

  subscribe(() => {
    projectLabel.textContent = state.project.name || 'Nowy projekt';
    schedulePreview();
  });

  schedulePreview();
  notifyStatus('Gotowy do konfiguracji.');
}

window.addEventListener('DOMContentLoaded', initialise);
