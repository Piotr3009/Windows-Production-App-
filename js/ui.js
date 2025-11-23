import { state, subscribe, setActiveSubTab, setActiveView } from './state.js';

let callbacks = {
  onProjectChange: () => {},
  onWindowChange: () => {},
  onToggleRawSection: () => {},
  onNewWindow: () => {},
  onSaveWindow: () => {},
  onFinishProject: () => {},
  onSelectWindow: () => {},
  onRemoveWindow: () => {},
  onAddManualBar: () => {},
  onRemoveManualBar: () => {},
  onSettingsChange: () => {},
};

// --- Helpers do bezpiecznego pobierania elementów ---
const getEl = (id) => document.getElementById(id);

// --- Pobieranie elementów interfejsu ---

// Projekt
const projectNameInput = getEl('project-name');
const projectClientInput = getEl('project-client');
const projectNotesInput = getEl('project-notes');

// Okno - Dane
const windowNameInput = getEl('window-name');
const frameWidthInput = getEl('frame-width');
const frameHeightInput = getEl('frame-height');
const hornsCheckbox = getEl('horns');
const hornExtensionInput = getEl('horn-extension-mm');
const colorRalInput = getEl('color-ral');
const colorIntInput = getEl('color-int');
const colorExtInput = getEl('color-ext');

// Grid / Szprosy
const gridModeSelect = getEl('grid-mode');
const gridCustomContainer = getEl('grid-custom');
const rowsInput = getEl('rows');
const colsInput = getEl('cols');
const customBarsList = getEl('custom-bars-list');

// Szkło
const glassThicknessInput = getEl('glass-thickness');
const glassMakeupInput = getEl('glass-makeup');
const glassToughenedInput = getEl('glass-toughened');
const glassFrostedInput = getEl('glass-frosted');
const spacerColourInput = getEl('spacer-colour');

// Surowce (Raw Materials)
const sashRawInputs = {
  '63x63': getEl('raw-63x63'),
  '63x95': getEl('raw-63x95'),
  '63x120': getEl('raw-63x120'),
};

// Kontenery (Listy i Widoki)
const windowsList = getEl('windows-list');
const precutContent = getEl('precut-content');
const cutlistContent = getEl('cutlist-content');
const glazingSummaryContainer = getEl('glazing-summary');
const activeWindowLabel = getEl('active-window-label');
const projectStatus = getEl('project-status');

// Ustawienia (Mogą nie istnieć w widoku uproszczonym)
const settingsKerf = getEl('settings-kerf');
const settingsEndTrim = getEl('settings-end-trim');
const settingsMinPiece = getEl('settings-min-piece');
const settingsStockSash = getEl('settings-stock-sash');
const settingsStockBox = getEl('settings-stock-box');
const settingsHornDefault = getEl('settings-horn-extension');
const settingsGlassAllowanceW = getEl('settings-glass-allowance-w');
const settingsGlassAllowanceH = getEl('settings-glass-allowance-h');
const settingsSectionMap = getEl('settings-section-map');

// Przyciski
const btnNewWindow = getEl('btn-new-window');
const btnSaveWindow = getEl('btn-save-window');
const btnFinishProject = getEl('btn-finish-project');
const addVerticalBarBtn = getEl('add-vertical-bar');
const addHorizontalBarBtn = getEl('add-horizontal-bar');
const openSettingsLink = getEl('open-settings');
const btnRunOpt = getEl('btn-run-opt'); // Przycisk optymalizacji

// Taby
const precutTabs = Array.from(document.querySelectorAll('.precut-tab'));
const cutlistTabs = Array.from(document.querySelectorAll('.cutlist-tab'));

let isRendering = false;

// --- Bezpieczne Handlery (NAPRAWA BŁĘDU) ---

function handleInput(element, handler) {
  if (!element) return; // Jeśli element nie istnieje, nie rób nic (nie wyrzucaj błędu)
  element.addEventListener('input', (event) => {
    if (isRendering) return;
    handler(event.target.value);
  });
}

function handleChange(element, handler) {
  if (!element) return;
  element.addEventListener('change', (event) => {
    if (isRendering) return;
    handler(event.target.type === 'checkbox' ? event.target.checked : event.target.value);
  });
}

function handleClick(element, handler) {
  if (!element) return;
  element.addEventListener('click', (event) => {
    event.preventDefault();
    handler(event);
  });
}

// --- Funkcje Renderowania UI ---

function updateTabStyles() {
  const updateBtn = (tabs, activeVal, datasetKey) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset[datasetKey] === activeVal;
        if (isActive) {
            tab.classList.remove('btn-ghost');
            tab.classList.add('btn-primary');
        } else {
            tab.classList.add('btn-ghost');
            tab.classList.remove('btn-primary');
        }
      });
  };

  updateBtn(precutTabs, state.ui.precutTab, 'precut');
  updateBtn(cutlistTabs, state.ui.cutlistTab, 'cutlist');
}

function renderSectionMap(sectionMap) {
  if (!settingsSectionMap) return;
  settingsSectionMap.innerHTML = '';
  Object.entries(sectionMap).forEach(([finished, raw]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white';
    wrapper.innerHTML = `
      <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">${finished}</span>
      <input data-section-key="${finished}" type="text" value="${raw}" class="w-24 form-input text-xs py-1" />
    `;
    settingsSectionMap.appendChild(wrapper);
  });
}

function renderCustomBars(bars) {
  if (!customBarsList) return;
  customBarsList.innerHTML = '';
  const createItem = (orientation, value) => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between rounded border border-slate-200 px-2 py-1 bg-white text-xs';
    li.innerHTML = `
      <span class="text-slate-600">${orientation === 'vertical' ? 'Pion' : 'Poz'} • ${value} mm</span>
      <button data-remove-bar="${orientation}" data-value="${value}" class="text-rose-500 hover:text-rose-700 font-bold px-2">×</button>
    `;
    customBarsList.appendChild(li);
  };
  bars.vertical.forEach((value) => createItem('vertical', value));
  bars.horizontal.forEach((value) => createItem('horizontal', value));
}

function renderWindowsList(project) {
  if (!windowsList) return;
  windowsList.innerHTML = '';
  if (!project.windows.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state text-sm text-slate-500 text-center py-4 italic';
    empty.textContent = 'Brak zapisanych okien.';
    windowsList.appendChild(empty);
    return;
  }

  project.windows.forEach((window) => {
    const item = document.createElement('li');
    const isActive = state.selectedWindowId === window.id;
    item.className = `rounded-lg border px-3 py-2 text-sm transition-colors flex items-center justify-between group ${
        isActive ? 'border-primary bg-blue-50' : 'border-slate-200 hover:border-blue-200 bg-white'
    }`;
    
    item.innerHTML = `
      <div class="cursor-pointer flex-1" data-select-window="${window.id}">
        <p class="font-semibold text-slate-700">${window.name || 'Bez nazwy'}</p>
        <p class="text-xs text-slate-500">${window.frame.width} × ${window.frame.height} mm</p>
      </div>
      <button data-remove-window="${window.id}" class="ml-2 text-slate-300 hover:text-rose-500 p-1 transition-colors" title="Usuń">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    `;
    windowsList.appendChild(item);
  });
}

function renderPrecut(precut) {
  if (!precutContent) return;
  if (!precut) {
    precutContent.innerHTML = '<p class="text-sm text-slate-500 col-span-full text-center">Brak danych. Dodaj okna i zakończ projekt.</p>';
    return;
  }

  const active = state.ui.precutTab;
  const groups = active === 'sash' ? precut.sashEngineering : precut.boxSapele;
  
  precutContent.innerHTML = '';
  
  if (!groups || !groups.length) {
    precutContent.innerHTML = '<p class="text-sm text-slate-500 col-span-full text-center py-8">Brak elementów w tej sekcji.</p>';
    return;
  }

  groups.forEach((group) => {
    const card = document.createElement('div');
    card.className = 'card bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm';
    
    const title = active === 'sash' ? `Sekcja: ${group.section}` : `Szerokość: ${group.preCutWidth} mm`;
    
    card.innerHTML = `
      <div class="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
        <span class="font-semibold text-sm text-slate-700">${title}</span>
        <span class="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">${group.items.length} poz.</span>
      </div>
      <ul class="divide-y divide-slate-100">
        ${group.items.map(item => `
            <li class="px-4 py-2 flex justify-between items-center text-sm hover:bg-slate-50 transition-colors">
                <div class="flex items-baseline gap-2">
                    <span class="font-mono font-medium text-slate-700 text-base">${item.length}</span>
                    <span class="text-xs text-slate-400">mm</span>
                    <span class="text-slate-300">×</span>
                    <span class="font-bold text-primary">${item.quantity}</span>
                </div>
                <div class="text-right">
                    <div class="text-xs font-medium text-slate-600">${item.elementName}</div>
                    <div class="text-[10px] text-slate-400 truncate max-w-[120px]">${item.windowName}</div>
                </div>
            </li>
        `).join('')}
      </ul>
    `;
    precutContent.appendChild(card);
  });
}

function renderCutLists(cutLists) {
  if (!cutlistContent) return;
  if (!cutLists) {
    cutlistContent.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Brak list cięć.</p>';
    return;
  }
  const active = state.ui.cutlistTab;
  const rows = cutLists[active] ?? [];
  
  if (!rows.length) {
    cutlistContent.innerHTML = '<p class="text-sm text-slate-500 text-center py-8">Brak elementów.</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.className = 'min-w-full divide-y divide-slate-200 text-sm';
  table.innerHTML = `
    <thead class="bg-slate-50">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Element</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Długość</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ilość</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Okno</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-slate-200"></tbody>
  `;
  
  const tbody = table.querySelector('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="px-4 py-2">
        <div class="font-medium text-slate-700">${row.elementName}</div>
        <div class="text-xs text-slate-400">${row.section}</div>
      </td>
      <td class="px-4 py-2 font-mono text-slate-600">${row.length} mm</td>
      <td class="px-4 py-2 font-bold text-primary">${row.quantity}</td>
      <td class="px-4 py-2 text-xs text-slate-500">${row.windowName || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
  
  cutlistContent.innerHTML = '';
  cutlistContent.appendChild(table);
}

function renderGlazing(glazingSummary) {
  if (!glazingSummaryContainer) return;
  if (!glazingSummary || !glazingSummary.length) {
    glazingSummaryContainer.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Brak danych.</p>';
    return;
  }
  const table = document.createElement('table');
  table.className = 'min-w-full divide-y divide-slate-200 text-sm';
  table.innerHTML = `
    <thead class="bg-slate-50">
      <tr>
        <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Wymiar</th>
        <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pane</th>
        <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Specyfikacja</th>
        <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Okno</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-slate-200"></tbody>
  `;
  
  const tbody = table.querySelector('tbody');
  glazingSummary.forEach((pane) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-slate-700">${pane.width} × ${pane.height} mm</td>
      <td class="px-4 py-2 font-bold text-primary">${pane.panes} szt.</td>
      <td class="px-4 py-2 text-xs text-slate-500">
        ${pane.thickness}mm ${pane.makeup}<br>
        ${pane.toughened ? 'Hart.' : ''} ${pane.frosted ? 'Mroż.' : ''}
      </td>
      <td class="px-4 py-2 text-xs text-slate-500">${pane.windowName}</td>
    `;
    tbody.appendChild(tr);
  });
  
  glazingSummaryContainer.innerHTML = '';
  glazingSummaryContainer.appendChild(table);
}

function renderSettings(settings) {
  if(settingsKerf) settingsKerf.value = settings.kerf;
  if(settingsEndTrim) settingsEndTrim.value = settings.endTrim;
  if(settingsMinPiece) settingsMinPiece.value = settings.minimumPiece;
  if(settingsStockSash) settingsStockSash.value = settings.stockLengthSash;
  if(settingsStockBox) settingsStockBox.value = settings.stockLengthBox;
  if(settingsHornDefault) settingsHornDefault.value = settings.hornExtensionDefault;
  if(settingsGlassAllowanceW) settingsGlassAllowanceW.value = settings.glazingAllowanceWidth;
  if(settingsGlassAllowanceH) settingsGlassAllowanceH.value = settings.glazingAllowanceHeight;
  
  if(settingsSectionMap) renderSectionMap(settings.sectionMap);
}

function render(stateSnapshot) {
  isRendering = true;
  
  // Projekt
  if(projectNameInput) projectNameInput.value = stateSnapshot.project.name ?? '';
  if(projectClientInput) projectClientInput.value = stateSnapshot.project.client ?? '';
  if(projectNotesInput) projectNotesInput.value = stateSnapshot.project.notes ?? '';
  
  if(projectStatus) {
      const status = stateSnapshot.project.status;
      projectStatus.textContent = status === 'finished' ? 'Zamknięty' : 'W toku';
      projectStatus.className = status === 'finished' ? 'badge badge-success' : 'badge badge-warning';
  }

  // Okno
  const current = stateSnapshot.currentWindow;
  
  if(windowNameInput) windowNameInput.value = current.name ?? '';
  if(frameWidthInput) frameWidthInput.value = current.frame.width ?? '';
  if(frameHeightInput) frameHeightInput.value = current.frame.height ?? '';
  if(hornsCheckbox) hornsCheckbox.checked = Boolean(current.sash.horns);
  if(hornExtensionInput) hornExtensionInput.value = current.sash.hornExtension ?? '';
  if(colorRalInput) colorRalInput.value = current.color.ral ?? '';
  if(colorIntInput) colorIntInput.value = current.color.inside ?? '';
  if(colorExtInput) colorExtInput.value = current.color.outside ?? '';

  if(gridModeSelect) gridModeSelect.value = current.sash.grid.mode;
  if(rowsInput) rowsInput.value = current.sash.grid.rows ?? '';
  if(colsInput) colsInput.value = current.sash.grid.cols ?? '';
  
  if(gridCustomContainer) {
      gridCustomContainer.classList.toggle('hidden', current.sash.grid.mode !== 'custom');
  }
  renderCustomBars(current.sash.grid.customBars);

  if(glassThicknessInput) glassThicknessInput.value = current.glazing.thickness ?? '';
  if(glassMakeupInput) glassMakeupInput.value = current.glazing.makeup ?? '';
  if(glassToughenedInput) glassToughenedInput.checked = Boolean(current.glazing.toughened);
  if(glassFrostedInput) glassFrostedInput.checked = Boolean(current.glazing.frosted);
  if(spacerColourInput) spacerColourInput.value = current.glazing.spacerColour ?? '';

  Object.entries(sashRawInputs).forEach(([section, input]) => {
    if(input) {
        const item = current.materials.sashRaw.find((entry) => entry.section === section);
        input.checked = item ? Boolean(item.enabled) : false;
    }
  });

  if(activeWindowLabel) activeWindowLabel.textContent = current.name || 'Nowe okno';

  renderWindowsList(stateSnapshot.project);
  renderPrecut(stateSnapshot.precut);
  renderCutLists(stateSnapshot.cutLists);
  renderGlazing(stateSnapshot.glazingSummary);
  renderSettings(stateSnapshot.settings);
  
  updateTabStyles();
  isRendering = false;
}

function bindEvents() {
  handleInput(projectNameInput, (value) => callbacks.onProjectChange('name', value));
  handleInput(projectClientInput, (value) => callbacks.onProjectChange('client', value));
  handleInput(projectNotesInput, (value) => callbacks.onProjectChange('notes', value));

  handleInput(windowNameInput, (value) => callbacks.onWindowChange('name', value));
  handleInput(frameWidthInput, (value) => callbacks.onWindowChange('frame.width', Number(value)));
  handleInput(frameHeightInput, (value) => callbacks.onWindowChange('frame.height', Number(value)));
  handleChange(hornsCheckbox, (value) => callbacks.onWindowChange('sash.horns', value));
  handleInput(hornExtensionInput, (value) => callbacks.onWindowChange('sash.hornExtension', Number(value)));
  handleInput(colorRalInput, (value) => callbacks.onWindowChange('color.ral', value));
  handleInput(colorIntInput, (value) => callbacks.onWindowChange('color.inside', value));
  handleInput(colorExtInput, (value) => callbacks.onWindowChange('color.outside', value));

  handleChange(gridModeSelect, (value) => callbacks.onWindowChange('sash.grid.mode', value));
  handleInput(rowsInput, (value) => callbacks.onWindowChange('sash.grid.rows', Number(value)));
  handleInput(colsInput, (value) => callbacks.onWindowChange('sash.grid.cols', Number(value)));

  handleInput(glassThicknessInput, (value) => callbacks.onWindowChange('glazing.thickness', Number(value)));
  handleInput(glassMakeupInput, (value) => callbacks.onWindowChange('glazing.makeup', value));
  handleChange(glassToughenedInput, (value) => callbacks.onWindowChange('glazing.toughened', value));
  handleChange(glassFrostedInput, (value) => callbacks.onWindowChange('glazing.frosted', value));
  handleInput(spacerColourInput, (value) => callbacks.onWindowChange('glazing.spacerColour', value));

  Object.entries(sashRawInputs).forEach(([section, input]) => {
    handleChange(input, (checked) => callbacks.onToggleRawSection(section, checked));
  });

  precutTabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveSubTab('precut', tab.dataset.precut));
  });

  cutlistTabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveSubTab('cutlist', tab.dataset.cutlist));
  });

  handleClick(btnNewWindow, () => callbacks.onNewWindow());
  handleClick(btnSaveWindow, () => callbacks.onSaveWindow());
  handleClick(btnFinishProject, () => callbacks.onFinishProject());
  handleClick(addVerticalBarBtn, () => callbacks.onAddManualBar('vertical'));
  handleClick(addHorizontalBarBtn, () => callbacks.onAddManualBar('horizontal'));
  
  handleClick(openSettingsLink, () => setActiveView('reports'));
  handleClick(btnRunOpt, () => {}); 

  if(customBarsList) {
      customBarsList.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-remove-bar]');
        if (!button) return;
        event.preventDefault();
        const orientation = button.dataset.removeBar;
        const value = Number(button.dataset.value);
        callbacks.onRemoveManualBar(orientation, value);
      });
  }

  if(windowsList) {
      windowsList.addEventListener('click', (event) => {
        const selectTrigger = event.target.closest('[data-select-window]');
        if (selectTrigger) {
          callbacks.onSelectWindow(selectTrigger.dataset.selectWindow);
          return;
        }
        const removeButton = event.target.closest('button[data-remove-window]');
        if (removeButton) {
          callbacks.onRemoveWindow(removeButton.dataset.removeWindow);
        }
      });
  }

  const settingInputs = [
    settingsKerf,
    settingsEndTrim,
    settingsMinPiece,
    settingsStockSash,
    settingsStockBox,
    settingsHornDefault,
    settingsGlassAllowanceW,
    settingsGlassAllowanceH,
  ];

  settingInputs.forEach((input) => {
    if(input) {
        handleInput(input, (value) => callbacks.onSettingsChange(input.id, Number(value)));
    }
  });

  if(settingsSectionMap) {
      settingsSectionMap.addEventListener('input', (event) => {
        const target = event.target.closest('input[data-section-key]');
        if (!target || isRendering) return;
        callbacks.onSettingsChange(`sectionMap.${target.dataset.sectionKey}`, target.value);
      });
  }
}

export function initUI(nextCallbacks) {
  callbacks = { ...callbacks, ...nextCallbacks };
  bindEvents();
  subscribe(render);
}