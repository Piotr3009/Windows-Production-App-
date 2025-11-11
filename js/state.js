import { loadStateSnapshot, persistStateSnapshot } from './storage.js';

const DEFAULT_SECTION_MAP = {
  '57x57': '63x63',
  '57x90': '63x95',
  '57x43': '63x63',
};

const defaultSettings = {
  kerf: 3,
  endTrim: 10,
  minimumPiece: 200,
  stockLengthSash: 5900,
  stockLengthBox: 2500,
  boxWidthAllowance: 20,
  hornExtensionDefault: 75,
  glazingAllowanceWidth: 4,
  glazingAllowanceHeight: 4,
  sectionMap: { ...DEFAULT_SECTION_MAP },
  darkMode: false,
  labels: false,
};

function createEmptyWindow() {
  return {
    id: null,
    name: '',
    frame: { width: null, height: null },
    sash: {
      horns: false,
      hornExtension: defaultSettings.hornExtensionDefault,
      grid: {
        mode: '2x2',
        rows: 2,
        cols: 2,
        customBars: { vertical: [], horizontal: [] },
      },
    },
    color: { ral: '', inside: '', outside: '' },
    hardware: { finish: '', catches: 'NON PAS24' },
    cill: { extension: 60 },
    glazing: {
      thickness: 24,
      makeup: '4x16x4',
      toughened: false,
      frosted: false,
      spacerColour: 'White',
    },
    materials: {
      sashRaw: [
        { section: '63x63', stockLength: 5900, enabled: true },
        { section: '63x95', stockLength: 5900, enabled: true },
        { section: '63x120', stockLength: 5900, enabled: false },
      ],
      boxRaw: { stockLength: 2500, widthAllowance: 20 },
    },
    components: { box: [], sash: [] },
    glazingItems: [],
  };
}

const storedState = loadStateSnapshot();

export const state = storedState ?? {
  project: {
    id: null,
    name: 'Nowy projekt',
    client: '',
    notes: '',
    status: 'draft',
    windows: [],
    finishedAt: null,
  },
  currentWindow: createEmptyWindow(),
  selectedWindowId: null,
  precut: { sashEngineering: [], boxSapele: [] },
  cutLists: { sash: [], box: [] },
  glazingSummary: [],
  optimization: { sashEngineering: [], boxSapele: [] },
  settings: { ...defaultSettings },
  ui: {
    activeView: 'designer',
    precutTab: 'sash',
    cutlistTab: 'box',
  },
};

const listeners = new Set();

function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function notify() {
  persistStateSnapshot(state);
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

function mergeDeep(target, patch) {
  const output = Array.isArray(target) ? [...target] : { ...target };
  Object.entries(patch).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = mergeDeep(target[key] ?? {}, value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

export function updateProjectInfo(patch) {
  state.project = mergeDeep(state.project, patch);
  notify();
}

export function resetCurrentWindow() {
  state.currentWindow = createEmptyWindow();
  notify();
}

export function updateCurrentWindow(patch) {
  state.currentWindow = mergeDeep(state.currentWindow, patch);
  notify();
}

export function setWindowGridMode(mode, config = {}) {
  const gridPatch = { mode };
  if (mode !== 'custom') {
    const [rows, cols] = mode.split('x').map((n) => Number(n));
    gridPatch.rows = rows;
    gridPatch.cols = cols;
  } else {
    if (Number.isFinite(config.rows)) gridPatch.rows = config.rows;
    if (Number.isFinite(config.cols)) gridPatch.cols = config.cols;
  }
  state.currentWindow.sash.grid = mergeDeep(state.currentWindow.sash.grid, gridPatch);
  notify();
}

export function toggleCustomBar(orientation, value) {
  const list = state.currentWindow.sash.grid.customBars[orientation];
  const idx = list.indexOf(value);
  if (idx === -1) {
    list.push(value);
  } else {
    list.splice(idx, 1);
  }
  list.sort((a, b) => a - b);
  notify();
}

function ensureWindowId(windowSpec) {
  if (!windowSpec.id) {
    return { ...windowSpec, id: `window_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
  }
  return windowSpec;
}

export function addWindow(windowSpec) {
  const windowWithId = ensureWindowId(windowSpec);
  state.project.windows = [...state.project.windows, clone(windowWithId)];
  state.selectedWindowId = windowWithId.id;
  notify();
}

export function updateWindow(windowId, patch) {
  state.project.windows = state.project.windows.map((win) =>
    win.id === windowId ? mergeDeep(win, patch) : win,
  );
  if (state.selectedWindowId === windowId) {
    state.currentWindow = state.project.windows.find((win) => win.id === windowId) ?? state.currentWindow;
  }
  notify();
}

export function selectWindow(windowId) {
  state.selectedWindowId = windowId;
  const found = state.project.windows.find((win) => win.id === windowId);
  if (found) {
    state.currentWindow = clone(found);
  }
  notify();
}

export function removeWindow(windowId) {
  state.project.windows = state.project.windows.filter((win) => win.id !== windowId);
  if (state.selectedWindowId === windowId) {
    state.selectedWindowId = state.project.windows.length ? state.project.windows[0].id : null;
    state.currentWindow = state.project.windows.length ? clone(state.project.windows[0]) : createEmptyWindow();
  }
  notify();
}

export function setDerivedData({ precut, cutLists, glazing, optimization }) {
  if (precut) state.precut = precut;
  if (cutLists) state.cutLists = cutLists;
  if (glazing) state.glazingSummary = glazing;
  if (optimization) state.optimization = optimization;
  notify();
}

export function finishProject() {
  state.project.status = 'finished';
  state.project.finishedAt = new Date().toISOString();
  notify();
}

export function updateSettings(patch) {
  if (patch.sectionMap) {
    state.settings.sectionMap = { ...state.settings.sectionMap, ...patch.sectionMap };
    delete patch.sectionMap;
  }
  state.settings = mergeDeep(state.settings, patch);
  notify();
}

export function setActiveView(view) {
  state.ui.activeView = view;
  notify();
}

export function setActiveSubTab(group, value) {
  if (group === 'precut') state.ui.precutTab = value;
  if (group === 'cutlist') state.ui.cutlistTab = value;
  notify();
}

export function getDefaultSettings() {
  return { ...defaultSettings };
}

export function getDefaultSectionMap() {
  return { ...DEFAULT_SECTION_MAP };
}
