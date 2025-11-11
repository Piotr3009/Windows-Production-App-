import { state } from './state.js';

export function buildOptimizationRequest() {
  const components = state.project.payload.components.map((component) => ({
    id: component.id,
    section: component.section,
    material: component.material,
    length: Number(component.length),
    quantity: Number(component.quantity),
  }));

  return {
    components,
    configuration: {
      stock_length: state.settings.stockLength,
      kerf: state.settings.kerf,
      end_trim: state.settings.endTrim,
      minimum_piece: state.settings.minimumPiece,
      solver: 'heuristic',
    },
  };
}
