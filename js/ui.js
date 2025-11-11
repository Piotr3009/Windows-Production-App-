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

const designerTabs = Array.from(document.querySelectorAll('.designer-tab'));
const precutTabs = Array.from(document.querySelectorAll('.precut-tab'));
const cutlistTabs = Array.from(document.querySelectorAll('.cutlist-tab'));

const projectNameInput = document.getElementById('project-name');
const projectClientInput = document.getElementById('project-client');
const projectNotesInput = document.getElementById('project-notes');

const windowNameInput = document.getElementById('window-name');
const frameWidthInput = document.getElementById('frame-width');
const frameHeightInput = document.getElementById('frame-height');
const hornsCheckbox = document.getElementById('horns');
const hornExtensionInput = document.getElementById('horn-extension-mm');
const colorRalInput = document.getElementById('color-ral');
const colorIntInput = document.getElementById('color-int');
const colorExtInput = document.getElementById('color-ext');

const gridModeSelect = document.getElementById('grid-mode');
const gridCustomContainer = document.getElementById('grid-custom');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const customBarsList = document.getElementById('custom-bars-list');

const glassThicknessInput = document.getElementById('glass-thickness');
const glassMakeupInput = document.getElementById('glass-makeup');
const glassToughenedInput = document.getElementById('glass-toughened');
const glassFrostedInput = document.getElementById('glass-frosted');
const spacerColourInput = document.getElementById('spacer-colour');

const sashRawInputs = {
  '63x63': document.getElementById('raw-63x63'),
  '63x95': document.getElementById('raw-63x95'),
  '63x120': document.getElementById('raw-63x120'),
};

const windowsList = document.getElementById('windows-list');
const precutContent = document.getElementById('precut-content');
const cutlistContent = document.getElementById('cutlist-content');
const glazingSummaryContainer = document.getElementById('glazing-summary');
const activeWindowLabel = document.getElementById('active-window-label');
const projectStatus = document.getElementById('project-status');

const settingsKerf = document.getElementById('settings-kerf');
const settingsEndTrim = document.getElementById('settings-end-trim');
const settingsMinPiece = document.getElementById('settings-min-piece');
const settingsStockSash = document.getElementById('settings-stock-sash');
const settingsStockBox = document.getElementById('settings-stock-box');
const settingsHornDefault = document.getElementById('settings-horn-extension');
const settingsGlassAllowanceW = document.getElementById('settings-glass-allowance-w');
const settingsGlassAllowanceH = document.getElementById('settings-glass-allowance-h');
const settingsSectionMap = document.getElementById('settings-section-map');

const btnNewWindow = document.getElementById('btn-new-window');
const btnSaveWindow = document.getElementById('btn-save-window');
const btnFinishProject = document.getElementById('btn-finish-project');
const addVerticalBarBtn = document.getElementById('add-vertical-bar');
const addHorizontalBarBtn = document.getElementById('add-horizontal-bar');
const openSettingsLink = document.getElementById('open-settings');

let isRendering = false;

function handleInput(element, handler) {
  element.addEventListener('input', (event) => {
    if (isRendering) return;
    handler(event.target.value);
  });
}

function handleChange(element, handler) {
  element.addEventListener('change', (event) => {
    if (isRendering) return;
    handler(event.target.type === 'checkbox' ? event.target.checked : event.target.value);
  });
}

function updateTabStyles() {
  designerTabs.forEach((tab) => {
    const isActive = tab.dataset.view === state.ui.activeView;
    tab.classList.toggle('bg-slate-900', isActive);
    tab.classList.toggle('text-white', isActive);
  });
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    const isActive = panel.dataset.viewPanel === state.ui.activeView;
    panel.classList.toggle('hidden', !isActive);
  });

  precutTabs.forEach((tab) => {
    const isActive = tab.dataset.precut === state.ui.precutTab;
    tab.classList.toggle('bg-slate-900', isActive);
    tab.classList.toggle('text-white', isActive);
  });

  cutlistTabs.forEach((tab) => {
    const isActive = tab.dataset.cutlist === state.ui.cutlistTab;
    tab.classList.toggle('bg-slate-900', isActive);
    tab.classList.toggle('text-white', isActive);
  });
}

function renderSectionMap(sectionMap) {
  settingsSectionMap.innerHTML = '';
  Object.entries(sectionMap).forEach(([finished, raw]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2';
    wrapper.innerHTML = `
      <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">${finished}</span>
      <input data-section-key="${finished}" type="text" value="${raw}" class="w-24 rounded border border-slate-200 px-2 py-1 text-sm" />
    `;
    settingsSectionMap.appendChild(wrapper);
  });
}

function renderCustomBars(bars) {
  customBarsList.innerHTML = '';
  const createItem = (orientation, value) => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2';
    li.innerHTML = `
      <span>${orientation === 'vertical' ? 'Pionowy' : 'Poziomy'} • ${value} mm</span>
      <button data-remove-bar="${orientation}" data-value="${value}" class="rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">Usuń</button>
    `;
    customBarsList.appendChild(li);
  };
  bars.vertical.forEach((value) => createItem('vertical', value));
  bars.horizontal.forEach((value) => createItem('horizontal', value));
}

function renderWindowsList(project) {
  windowsList.innerHTML = '';
  if (!project.windows.length) {
    const empty = document.createElement('li');
    empty.className = 'rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500';
    empty.textContent = 'Brak zapisanych okien.';
    windowsList.appendChild(empty);
    return;
  }

  project.windows.forEach((window) => {
    const item = document.createElement('li');
    const isActive = state.selectedWindowId === window.id;
    item.className = `rounded-lg border px-3 py-2 text-sm ${isActive ? 'border-slate-900 bg-slate-900/5' : 'border-slate-200'}`;
    item.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="font-semibold text-slate-700">${window.name || 'Okno'}</p>
          <p class="text-xs text-slate-500">${window.frame.width || '-'} × ${window.frame.height || '-'} mm</p>
        </div>
        <div class="flex gap-2">
          <button data-select-window="${window.id}" class="rounded border border-slate-200 px-2 py-1 text-xs">Podgląd</button>
          <button data-remove-window="${window.id}" class="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600">Usuń</button>
        </div>
      </div>
    `;
    windowsList.appendChild(item);
  });
}

function renderPrecut(precut) {
  if (!precut) {
    precutContent.innerHTML = '<p class="text-sm text-slate-500">Brak danych pre-cut. Zakończ projekt aby wyświetlić.</p>';
    return;
  }

  const active = state.ui.precutTab;
  const groups = active === 'sash' ? precut.sashEngineering : precut.boxSapele;
  if (!groups.length) {
    precutContent.innerHTML = '<p class="text-sm text-slate-500">Brak pozycji w tej sekcji.</p>';
    return;
  }

  const table = document.createElement('div');
  table.className = 'space-y-4';
  groups.forEach((group) => {
    const header = document.createElement('div');
    header.className = 'rounded-lg border border-slate-200 bg-slate-50 p-3';
    header.innerHTML = `
      <div class="flex items-center justify-between text-sm">
        <span class="font-semibold text-slate-700">${active === 'sash' ? group.section : group.preCutWidth + ' mm'}</span>
        <span class="text-xs text-slate-500">${group.items.length} pozycji</span>
      </div>
    `;
    const list = document.createElement('ul');
    list.className = 'mt-2 space-y-1 text-xs text-slate-600';
    group.items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between rounded border border-slate-100 bg-white px-2 py-1';
      li.innerHTML = `<span>${item.elementName} • ${item.windowName}</span><span>${item.length} mm × ${item.quantity}</span>`;
      list.appendChild(li);
    });
    table.appendChild(header);
    table.appendChild(list);
  });
  precutContent.innerHTML = '';
  precutContent.appendChild(table);
}

function renderCutLists(cutLists) {
  if (!cutLists) {
    cutlistContent.innerHTML = '<p class="text-sm text-slate-500">Brak list cięć.</p>';
    return;
  }
  const active = state.ui.cutlistTab;
  const rows = cutLists[active] ?? [];
  if (!rows.length) {
    cutlistContent.innerHTML = '<p class="text-sm text-slate-500">Brak elementów.</p>';
    return;
  }
  const table = document.createElement('table');
  table.className = 'min-w-full text-sm';
  table.innerHTML = `
    <thead>
      <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
        <th class="px-2 py-1">Okno</th>
        <th class="px-2 py-1">Element</th>
        <th class="px-2 py-1">Sekcja</th>
        <th class="px-2 py-1">Długość</th>
        <th class="px-2 py-1">Ilość</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100"></tbody>
  `;
  const tbody = table.querySelector('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-2 py-1">${row.windowName || ''}</td>
      <td class="px-2 py-1">${row.elementName}</td>
      <td class="px-2 py-1">${row.section}</td>
      <td class="px-2 py-1">${row.length} mm</td>
      <td class="px-2 py-1">${row.quantity}</td>
    `;
    tbody.appendChild(tr);
  });
  cutlistContent.innerHTML = '';
  cutlistContent.appendChild(table);
}

function renderGlazing(glazingSummary) {
  if (!glazingSummary || !glazingSummary.length) {
    glazingSummaryContainer.innerHTML = '<p class="text-sm text-slate-500">Brak danych o szybach.</p>';
    return;
  }
  const table = document.createElement('table');
  table.className = 'min-w-full text-sm';
  table.innerHTML = `
    <thead>
      <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
        <th class="px-2 py-1">Okno</th>
        <th class="px-2 py-1">Format</th>
        <th class="px-2 py-1">Pane</th>
        <th class="px-2 py-1">Szkło</th>
        <th class="px-2 py-1">Spacer</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100"></tbody>
  `;
  const tbody = table.querySelector('tbody');
  glazingSummary.forEach((pane) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-2 py-1">${pane.windowName}</td>
      <td class="px-2 py-1">${pane.width} × ${pane.height} mm</td>
      <td class="px-2 py-1">${pane.rows}×${pane.cols} (${pane.panes} szt.)</td>
      <td class="px-2 py-1">${pane.thickness} • ${pane.makeup}${pane.toughened ? ' • Hart.' : ''}${pane.frosted ? ' • Mroż.' : ''}</td>
      <td class="px-2 py-1">${pane.spacerColour}</td>
    `;
    tbody.appendChild(tr);
  });
  glazingSummaryContainer.innerHTML = '';
  glazingSummaryContainer.appendChild(table);
}

function renderProjectStatus(project) {
  projectStatus.textContent = project.status === 'finished' ? 'Zamknięty' : 'W toku';
}

function renderSettings(settings) {
  settingsKerf.value = settings.kerf;
  settingsEndTrim.value = settings.endTrim;
  settingsMinPiece.value = settings.minimumPiece;
  settingsStockSash.value = settings.stockLengthSash;
  settingsStockBox.value = settings.stockLengthBox;
  settingsHornDefault.value = settings.hornExtensionDefault;
  settingsGlassAllowanceW.value = settings.glazingAllowanceWidth;
  settingsGlassAllowanceH.value = settings.glazingAllowanceHeight;
  renderSectionMap(settings.sectionMap);
}

function render(stateSnapshot) {
  isRendering = true;
  projectNameInput.value = stateSnapshot.project.name ?? '';
  projectClientInput.value = stateSnapshot.project.client ?? '';
  projectNotesInput.value = stateSnapshot.project.notes ?? '';
  renderProjectStatus(stateSnapshot.project);

  const current = stateSnapshot.currentWindow;
  windowNameInput.value = current.name ?? '';
  frameWidthInput.value = current.frame.width ?? '';
  frameHeightInput.value = current.frame.height ?? '';
  hornsCheckbox.checked = Boolean(current.sash.horns);
  hornExtensionInput.value = current.sash.hornExtension ?? '';
  colorRalInput.value = current.color.ral ?? '';
  colorIntInput.value = current.color.inside ?? '';
  colorExtInput.value = current.color.outside ?? '';

  gridModeSelect.value = current.sash.grid.mode;
  rowsInput.value = current.sash.grid.rows ?? '';
  colsInput.value = current.sash.grid.cols ?? '';
  gridCustomContainer.classList.toggle('hidden', current.sash.grid.mode !== 'custom');
  renderCustomBars(current.sash.grid.customBars);

  glassThicknessInput.value = current.glazing.thickness ?? '';
  glassMakeupInput.value = current.glazing.makeup ?? '';
  glassToughenedInput.checked = Boolean(current.glazing.toughened);
  glassFrostedInput.checked = Boolean(current.glazing.frosted);
  spacerColourInput.value = current.glazing.spacerColour ?? '';

  Object.entries(sashRawInputs).forEach(([section, input]) => {
    const item = current.materials.sashRaw.find((entry) => entry.section === section);
    input.checked = item ? Boolean(item.enabled) : false;
  });

  renderWindowsList(stateSnapshot.project);
  activeWindowLabel.textContent = current.name || 'Brak okna';

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

  designerTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveView(tab.dataset.view);
    });
  });

  precutTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveSubTab('precut', tab.dataset.precut);
    });
  });

  cutlistTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveSubTab('cutlist', tab.dataset.cutlist);
    });
  });

  btnNewWindow.addEventListener('click', (event) => {
    event.preventDefault();
    callbacks.onNewWindow();
  });

  btnSaveWindow.addEventListener('click', (event) => {
    event.preventDefault();
    callbacks.onSaveWindow();
  });

  btnFinishProject.addEventListener('click', (event) => {
    event.preventDefault();
    callbacks.onFinishProject();
  });

  addVerticalBarBtn.addEventListener('click', (event) => {
    event.preventDefault();
    callbacks.onAddManualBar('vertical');
  });

  addHorizontalBarBtn.addEventListener('click', (event) => {
    event.preventDefault();
    callbacks.onAddManualBar('horizontal');
  });

  customBarsList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-remove-bar]');
    if (!button) return;
    event.preventDefault();
    const orientation = button.dataset.removeBar;
    const value = Number(button.dataset.value);
    callbacks.onRemoveManualBar(orientation, value);
  });

  windowsList.addEventListener('click', (event) => {
    const selectButton = event.target.closest('button[data-select-window]');
    if (selectButton) {
      callbacks.onSelectWindow(selectButton.dataset.selectWindow);
      return;
    }
    const removeButton = event.target.closest('button[data-remove-window]');
    if (removeButton) {
      callbacks.onRemoveWindow(removeButton.dataset.removeWindow);
    }
  });

  openSettingsLink.addEventListener('click', (event) => {
    event.preventDefault();
    setActiveView('settings');
  });

  [
    settingsKerf,
    settingsEndTrim,
    settingsMinPiece,
    settingsStockSash,
    settingsStockBox,
    settingsHornDefault,
    settingsGlassAllowanceW,
    settingsGlassAllowanceH,
  ].forEach((input) => {
    handleInput(input, (value) => callbacks.onSettingsChange(input.id, Number(value)));
  });

  settingsSectionMap.addEventListener('input', (event) => {
    const target = event.target.closest('input[data-section-key]');
    if (!target || isRendering) return;
    callbacks.onSettingsChange(`sectionMap.${target.dataset.sectionKey}`, target.value);
  });
}

export function initUI(nextCallbacks) {
  callbacks = { ...callbacks, ...nextCallbacks };
  bindEvents();
  subscribe(render);
}
