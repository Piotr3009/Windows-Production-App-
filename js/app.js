import { calculateWindow } from './calculations.js';
import { exportExcel, exportPdf, runOptimization, saveProject } from './api.js';
import { buildOptimizationRequest } from './optimizer.js';
import {
  addComponent,
  setComponents,
  setOptimization,
  state,
  updateProject,
  updateSettings,
} from './state.js';
import {
  bindGlobalControls,
  initComponentActions,
  initNavigation,
  initialiseUI,
  updateStatus,
} from './ui.js';
import { componentToSVG } from './drawings.js';

function transformCalculationToComponents(calculation) {
  const components = [];
  const push = (source, typePrefix) => {
    Object.entries(source).forEach(([key, value]) => {
      if (!value || typeof value !== 'object' || !('length' in value)) return;
      components.push({
        id: `${typePrefix}-${key}`.toUpperCase(),
        type: key,
        section: value.section || `${value.width}x${value.width}`,
        material: value.material || 'Softwood',
        width: value.width,
        thickness: value.width,
        length: Math.round(value.length),
        quantity: value.quantity || 1,
        drawing: componentToSVG({
          id: `${typePrefix}-${key}`.toUpperCase(),
          length: Math.round(value.length),
          section: value.section,
        }),
      });
    });
  };

  push(calculation.components.frame, 'frame');
  push(calculation.components.sash, 'sash');

  return components;
}

function seedDemoData() {
  const calculation = calculateWindow(1450, 1600, '2x2');
  const components = transformCalculationToComponents(calculation);
  setComponents(components);
  updateProject({ payload: { configuration: calculation.configuration } });
}

async function handleAddComponent() {
  const id = prompt('Component ID (e.g. SASH-1001)');
  if (!id) return;
  const length = Number(prompt('Length (mm)', '1000')) || 0;
  const quantity = Number(prompt('Quantity', '1')) || 1;
  const section = prompt('Section', '63x63') || '63x63';
  const type = prompt('Type', 'custom_component') || 'custom_component';
  const material = prompt('Material', 'Softwood') || 'Softwood';

  addComponent({
    id,
    type,
    section,
    material,
    width: Number(section.split('x')[0]) || 63,
    thickness: Number(section.split('x')[1]) || 63,
    length,
    quantity,
    drawing: componentToSVG({ id, length, section }),
  });
  updateStatus(`Component ${id} added.`);
}

async function handleOptimization() {
  if (!state.project.payload.components.length) {
    updateStatus('Add components before optimising.');
    return;
  }

  try {
    updateStatus('Optimising stock usage…');
    const request = buildOptimizationRequest();
    const result = await runOptimization(request.components, request.configuration);
    setOptimization(result);
    updateStatus('Optimisation complete.');
  } catch (error) {
    updateStatus(error.message);
  }
}

function handleToggleLabels(enabled) {
  updateSettings({ labels: enabled });
  updateStatus(`QR labels ${enabled ? 'enabled' : 'disabled'}.`);
}

async function handleSaveProject() {
  const payload = {
    ...state.project,
    payload: state.project.payload,
  };
  try {
    updateStatus('Saving project…');
    const saved = await saveProject(payload);
    updateProject(saved);
    updateStatus('Project saved successfully.');
  } catch (error) {
    updateStatus(error.message);
  }
}

async function handleExportPdf() {
  if (!state.project.project_id) {
    await handleSaveProject();
  }
  const payload = {
    project: state.project,
    optimization: state.optimization,
    include_drawings: state.settings.labels,
  };
  try {
    updateStatus('Generating PDF report…');
    await exportPdf(payload);
    updateStatus('PDF exported.');
  } catch (error) {
    updateStatus(error.message);
  }
}

async function handleExportExcel() {
  if (!state.project.project_id) {
    await handleSaveProject();
  }
  const payload = {
    project: state.project,
    optimization: state.optimization,
    include_drawings: true,
    workbook_name: `${state.project.name.replace(/\s+/g, '-')}.xlsx`,
  };
  try {
    updateStatus('Preparing Excel workbook…');
    await exportExcel(payload);
    updateStatus('Excel exported.');
  } catch (error) {
    updateStatus(error.message);
  }
}

function bindHeaderActions() {
  document.querySelector('[data-action="new-project"]').addEventListener('click', () => {
    updateProject({
      project_id: null,
      name: prompt('Project name', 'Untitled Project') || 'Untitled Project',
    });
    updateStatus('New project initialised.');
  });
  document.querySelector('[data-action="save-project"]').addEventListener('click', handleSaveProject);
  document.querySelector('[data-action="export-pdf"]').addEventListener('click', handleExportPdf);
  document.querySelector('[data-action="export-excel"]').addEventListener('click', handleExportExcel);
  document.querySelector('[data-action="preview-pdf"]').addEventListener('click', handleExportPdf);
  document.querySelector('[data-action="preview-excel"]').addEventListener('click', handleExportExcel);
}

window.addEventListener('DOMContentLoaded', () => {
  seedDemoData();
  initNavigation();
  initComponentActions();
  bindGlobalControls({
    onAddComponent: handleAddComponent,
    onRunOptimization: handleOptimization,
    onToggleLabels: handleToggleLabels,
  });
  bindHeaderActions();
  initialiseUI();
});
