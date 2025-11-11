function encodeSvg(svg) {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function componentToSVG(component) {
  const length = component.length || 0;
  const width = component.width || component.thickness || 60;
  const label = component.id || component.type;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80">
      <style>
        .label { font: 600 12px 'Inter', sans-serif; fill: #0f172a; }
        .caption { font: 500 10px 'Inter', sans-serif; fill: #1e293b; }
      </style>
      <rect x="20" y="30" width="180" height="20" rx="4" fill="#e2e8f0" stroke="#334155" stroke-width="2" />
      <line x1="20" y1="60" x2="200" y2="60" stroke="#334155" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
      <text x="110" y="75" text-anchor="middle" class="caption">${length.toFixed(0)} mm</text>
      <text x="110" y="23" text-anchor="middle" class="label">${label}</text>
      <text x="110" y="40" text-anchor="middle" class="caption">${component.section || ''}</text>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6" fill="#334155" />
        </marker>
      </defs>
    </svg>
  `;

  return encodeSvg(svg);
}
