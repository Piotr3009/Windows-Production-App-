const defaultSettings = {
  stockLength: 5900,
  kerf: 3,
  endTrim: 10,
  minimumPiece: 200,
  units: 'mm',
  darkMode: false,
  labels: false,
};

export const state = {
  project: {
    project_id: null,
    name: 'Untitled Project',
    client: '',
    type: 'Sash',
    material: 'Softwood',
    section_sizes: '63x63',
    payload: {
      configuration: { key: '2x2' },
      components: [],
      cut_list: [],
      precut_patterns: [],
      reports: {},
    },
  },
  optimization: null,
  settings: { ...defaultSettings },
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener(state));
}

export function setProject(project) {
  state.project = project;
  notify();
}

export function updateProject(patch) {
  const payloadPatch = patch.payload
    ? { ...state.project.payload, ...patch.payload }
    : state.project.payload;
  const next = { ...patch };
  delete next.payload;
  state.project = {
    ...state.project,
    ...next,
    payload: payloadPatch,
  };
  notify();
}

export function setComponents(components) {
  state.project.payload.components = [...components];
  notify();
}

export function addComponent(component) {
  state.project.payload.components = [...state.project.payload.components, component];
  notify();
}

export function updateComponent(componentId, patch) {
  state.project.payload.components = state.project.payload.components.map((component) =>
    component.id === componentId ? { ...component, ...patch } : component,
  );
  notify();
}

export function removeComponent(componentId) {
  state.project.payload.components = state.project.payload.components.filter((component) => component.id !== componentId);
  notify();
}

export function setOptimization(result) {
  state.optimization = result;
  notify();
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  notify();
}
