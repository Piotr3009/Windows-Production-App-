/**
 * projects.js - Project management UI helpers
 */

import {
    saveProject,
    loadProject,
    getAllProjects,
    deleteProject,
    importProjectFromFile,
    exportProjectToFile,
    createProjectData
} from './storage.js';
import { showNotification } from './export.js';

let getWindowDataFn = () => null;
let loadWindowFn = () => {};

export function initProjectManagement({ getCurrentWindowData, loadWindowData }) {
    getWindowDataFn = typeof getCurrentWindowData === 'function' ? getCurrentWindowData : () => null;
    loadWindowFn = typeof loadWindowData === 'function' ? loadWindowData : () => {};

    const openBtn = document.getElementById('open-project-manager');
    const saveBtn = document.getElementById('save-project');

    openBtn?.addEventListener('click', showProjectManager);
    saveBtn?.addEventListener('click', saveCurrentWork);
}

function showProjectManager() {
    closeProjectManager();

    const modal = document.createElement('div');
    modal.id = 'project-manager-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-window" role="dialog" aria-modal="true">
            <div class="modal-header">
                <h2>Project Manager</h2>
                <button class="modal-close" id="close-project-manager" aria-label="Close">&times;</button>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" id="new-project-btn">New Project</button>
                <label class="btn btn-secondary">
                    Import Project
                    <input type="file" id="import-project-file" accept="application/json" hidden>
                </label>
            </div>
            <div class="modal-content">
                <div id="project-list" class="project-list">Loading projects…</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#close-project-manager').addEventListener('click', closeProjectManager);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeProjectManager();
    });

    modal.querySelector('#new-project-btn').addEventListener('click', newProject);
    modal.querySelector('#import-project-file').addEventListener('change', handleImportFile);

    refreshProjectList();
}

function refreshProjectList() {
    const listContainer = document.getElementById('project-list');
    if (!listContainer) return;

    const projects = getAllProjects();
    const entries = Object.values(projects)
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    if (entries.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No projects yet. Create one to get started!</p>';
        return;
    }

    listContainer.innerHTML = entries.map((project) => {
        const windowCount = project.windows?.length || 0;
        const lastModified = new Date(project.lastModified).toLocaleString();
        return `
            <div class="project-item">
                <div>
                    <h3>${project.name}</h3>
                    <p>${windowCount} window(s) • Last modified: ${lastModified}</p>
                </div>
                <div class="project-item-actions">
                    <button class="btn btn-small" data-action="load" data-id="${project.id}">Load</button>
                    <button class="btn btn-small" data-action="export" data-id="${project.id}">Export</button>
                    <button class="btn btn-small btn-danger" data-action="delete" data-id="${project.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    listContainer.querySelectorAll('.project-item-actions button').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const { action, id } = event.currentTarget.dataset;
            switch (action) {
                case 'load':
                    loadProjectById(id);
                    break;
                case 'export':
                    exportExistingProject(id);
                    break;
                case 'delete':
                    confirmDeleteProject(id);
                    break;
                default:
                    break;
            }
        });
    });
}

function newProject() {
    const name = prompt('Project name:');
    if (!name) return;

    const projectData = createProjectData(name, []);
    saveProject(projectData);
    showNotification(`Project "${name}" created!`, 'success');
    refreshProjectList();
}

function loadProjectById(projectId) {
    const project = loadProject(projectId);
    if (!project) {
        alert('Project not found');
        return;
    }

    const primaryWindow = project.windows?.[0];
    if (primaryWindow) {
        loadWindowFn(primaryWindow);
        showNotification(`Project "${project.name}" loaded`, 'success');
    } else {
        showNotification(`Project "${project.name}" has no windows yet`, 'info');
    }

    closeProjectManager();
}

function exportExistingProject(projectId) {
    const project = loadProject(projectId);
    if (!project) return;
    exportProjectToFile(project);
}

async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        await importProjectFromFile(file);
        showNotification('Project imported successfully', 'success');
        refreshProjectList();
    } catch (error) {
        showNotification(`Import failed: ${error.message}`, 'error');
    } finally {
        event.target.value = '';
    }
}

function confirmDeleteProject(projectId) {
    const project = loadProject(projectId);
    if (!project) return;

    if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
        deleteProject(projectId);
        refreshProjectList();
        showNotification('Project deleted', 'info');
    }
}

function closeProjectManager() {
    const modal = document.getElementById('project-manager-modal');
    if (modal) {
        modal.remove();
    }
}

function saveCurrentWork() {
    const windowData = getWindowDataFn();
    if (!windowData) {
        alert('No data to save. Calculate first!');
        return;
    }

    const projectName = prompt('Save as project name:', `Window ${Date.now()}`);
    if (!projectName) return;

    const projectData = createProjectData(projectName, [windowData]);
    saveProject(projectData);
    showNotification('Project saved!', 'success');
}

export function loadWindowDataIntoUI(windowData) {
    if (!windowData) return;
    loadWindowFn(windowData);
}
