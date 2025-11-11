import { addComponent, removeComponent, state, subscribe, updateSettings } from './state.js';
import { componentToSVG } from './drawings.js';

const moduleNav = document.getElementById('module-nav');
const moduleCards = document.querySelectorAll('.module-card');
const componentTable = document.getElementById('component-table');
const statusText = document.getElementById('status-text');
const timestamp = document.getElementById('timestamp');

function formatDate(date = new Date()) {
  return date.toLocaleString();
}

function setActiveModule(targetId) {
  moduleCards.forEach((card) => {
    if (card.id === targetId) {
      card.classList.remove('hidden');
      card.classList.add('module-card-active');
    } else {
      card.classList.add('hidden');
      card.classList.remove('module-card-active');
    }
  });

  moduleNav.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', button.dataset.module === targetId);
  });
}

function createComponentRow(component) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="px-4 py-3 font-medium text-slate-600">${component.id}</td>
    <td class="px-4 py-3 text-slate-500">${component.type}</td>
    <td class="px-4 py-3 text-slate-500">${component.length}</td>
    <td class="px-4 py-3 text-slate-500">${component.quantity}</td>
    <td class="px-4 py-3 text-slate-500">${component.section}</td>
    <td class="px-4 py-3">
      ${component.drawing ? `<img src="${component.drawing}" alt="${component.id}" class="h-12 w-auto rounded border border-slate-200 bg-slate-50 p-1" />` : '-'}
    </td>
    <td class="px-4 py-3">
      <div class="flex gap-2">
        <button data-action="duplicate" data-id="${component.id}" class="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">Duplicate</button>
        <button data-action="delete" data-id="${component.id}" class="rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">Remove</button>
      </div>
    </td>
  `;
  return row;
}

function renderComponents() {
  componentTable.innerHTML = '';
  state.project.payload.components.forEach((component) => {
    componentTable.appendChild(createComponentRow(component));
  });
}

function renderOptimization() {
  const container = document.getElementById('optimization-output');
  container.innerHTML = '';
  const optimization = state.optimization;
  if (!optimization) {
    container.innerHTML = '<p class="text-sm text-slate-500">Run the optimizer to see cutting patterns.</p>';
    return;
  }

  optimization.groups.forEach((group) => {
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-slate-200 p-4';
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">${group.material}</p>
          <h3 class="text-base font-semibold text-slate-700">${group.section}</h3>
        </div>
        <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">${group.summary.totalBars} bars</span>
      </div>
      <div class="mt-3 space-y-2">
        ${group.bars
          .map(
            (bar) => `
              <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div class="flex items-center justify-between text-xs text-slate-600">
                  <span class="font-semibold">${bar.barId}</span>
                  <span>${(bar.utilization * 100).toFixed(1)}% utilisation</span>
                </div>
                <div class="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  ${bar.cuts.map((cut) => `<span class="rounded bg-white px-2 py-1 font-medium text-slate-600 shadow-sm">${cut}</span>`).join('')}
                </div>
                <p class="mt-2 text-xs text-slate-500">Waste: ${bar.waste} mm</p>
              </div>
            `,
          )
          .join('')}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderReportsPreview() {
  const cutList = document.getElementById('report-cut-list');
  cutList.innerHTML = '';
  state.project.payload.components.forEach((component) => {
    const item = document.createElement('li');
    item.className = 'flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2';
    item.innerHTML = `
      <span>${component.id} • ${component.type}</span>
      <span class="text-xs text-slate-500">${component.length} mm × ${component.quantity}</span>
    `;
    cutList.appendChild(item);
  });

  const optimizerList = document.getElementById('report-optimizer');
  optimizerList.innerHTML = '';
  if (state.optimization) {
    state.optimization.groups.forEach((group) => {
      const item = document.createElement('li');
      item.className = 'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600';
      item.innerHTML = `${group.section} (${group.material}) – ${group.summary.totalBars} bars, average waste ${group.summary.avgWaste} mm`;
      optimizerList.appendChild(item);
    });
  }
}

function updateStatus(message) {
  statusText.textContent = message;
  timestamp.textContent = formatDate();
}

export function initNavigation() {
  moduleNav.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-module]');
    if (!button) return;
    setActiveModule(button.dataset.module);
  });
  setActiveModule('cut-list');
}

export function initComponentActions() {
  componentTable.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    const component = state.project.payload.components.find((item) => item.id === id);
    if (!component) return;

    if (button.dataset.action === 'delete') {
      removeComponent(id);
      updateStatus(`Component ${id} removed.`);
    }

    if (button.dataset.action === 'duplicate') {
      const clone = { ...component, id: `${component.id}-COPY` };
      addComponent(clone);
      updateStatus(`Component ${component.id} duplicated.`);
    }
  });
}

export function bindGlobalControls({ onAddComponent, onRunOptimization, onToggleLabels }) {
  document.querySelector('[data-action="add-component"]').addEventListener('click', onAddComponent);
  document.querySelector('[data-action="run-optimization"]').addEventListener('click', onRunOptimization);
  document.getElementById('toggle-labels').addEventListener('change', (event) => {
    onToggleLabels(event.target.checked);
  });

  document.getElementById('stock-length').addEventListener('change', (event) => {
    updateSettings({ stockLength: Number(event.target.value) });
  });
  document.getElementById('kerf').addEventListener('change', (event) => {
    updateSettings({ kerf: Number(event.target.value) });
  });
  document.getElementById('end-trim').addEventListener('change', (event) => {
    updateSettings({ endTrim: Number(event.target.value) });
  });
  document.getElementById('min-piece').addEventListener('change', (event) => {
    updateSettings({ minimumPiece: Number(event.target.value) });
  });
}

subscribe(() => {
  state.project.payload.components = state.project.payload.components.map((component) => {
    if (!component.drawing) {
      return { ...component, drawing: componentToSVG(component) };
    }
    return component;
  });
  renderComponents();
  renderOptimization();
  renderReportsPreview();
  document.getElementById('active-project-label').textContent = state.project.name;
});

export function initialiseUI() {
  renderComponents();
  renderOptimization();
  renderReportsPreview();
  updateStatus('Workspace ready');
}

export { updateStatus };
