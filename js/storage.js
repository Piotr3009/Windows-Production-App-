/**
 * storage.js - Local storage persistence for projects
 */

const STORAGE_KEY = 'sash_window_projects';
const CURRENT_PROJECT_KEY = 'sash_window_current';

function safeParse(json, fallback) {
    try {
        return JSON.parse(json);
    } catch (error) {
        console.error('Failed to parse JSON from storage', error);
        return fallback;
    }
}

export function saveProject(projectData) {
    if (!projectData) throw new Error('Missing project data');

    const projects = getAllProjects();
    const projectId = projectData.id || generateProjectId();
    const timestamp = new Date().toISOString();

    const dataToStore = {
        ...projectData,
        id: projectId,
        lastModified: timestamp,
        created: projectData.created || timestamp
    };

    projects[projectId] = dataToStore;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);

    return projectId;
}

export function loadProject(projectId) {
    if (!projectId) return null;
    const projects = getAllProjects();
    return projects[projectId] || null;
}

export function getAllProjects() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return safeParse(raw, {});
}

export function deleteProject(projectId) {
    const projects = getAllProjects();
    if (projects[projectId]) {
        delete projects[projectId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }

    if (localStorage.getItem(CURRENT_PROJECT_KEY) === projectId) {
        localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
}

export function getCurrentProject() {
    const projectId = localStorage.getItem(CURRENT_PROJECT_KEY);
    return projectId ? loadProject(projectId) : null;
}

export function exportProjectToFile(projectData) {
    if (!projectData) throw new Error('No project data to export');
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${projectData.name || 'unnamed'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function importProjectFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                const projectId = saveProject(projectData);
                resolve(projectId);
            } catch (error) {
                reject(new Error('Invalid project file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

export function generateProjectId() {
    return `project_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createProjectData(name, windows = []) {
    const timestamp = new Date().toISOString();
    return {
        id: null,
        name,
        created: timestamp,
        lastModified: timestamp,
        windows,
        metadata: {
            version: '1.0',
            totalWindows: windows.length
        }
    };
}
