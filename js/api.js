const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || 'Request failed');
  }
  return response.json();
}

export async function fetchProjects() {
  const response = await fetch(`${API_BASE}/projects`);
  return handleResponse(response);
}

export async function saveProject(project) {
  const method = project.project_id ? 'PUT' : 'POST';
  const url = project.project_id ? `${API_BASE}/projects/${project.project_id}` : `${API_BASE}/projects`;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  return handleResponse(response);
}

export async function runOptimization(components, config) {
  const response = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ components, configuration: config }),
  });
  return handleResponse(response);
}

async function downloadFile(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || 'Failed to export');
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch ? filenameMatch[1] : `export-${Date.now()}`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function exportPdf(payload) {
  return downloadFile(`${API_BASE}/export/pdf`, payload);
}

export function exportExcel(payload) {
  return downloadFile(`${API_BASE}/export/excel`, payload);
}
