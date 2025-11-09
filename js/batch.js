/**
 * batch.js - Batch operations for multiple windows
 */

import { BACKEND_URL, downloadFile, showNotification } from './export.js';

let batchWindows = [];
let getWindowDataFn = () => null;

export function initBatchOperations({ getCurrentWindowData }) {
    getWindowDataFn = typeof getCurrentWindowData === 'function' ? getCurrentWindowData : () => null;

    document.getElementById('add-to-batch')?.addEventListener('click', addToBatch);
    document.getElementById('batch-export-pdf')?.addEventListener('click', exportBatchPDF);
    document.getElementById('batch-aggregate')?.addEventListener('click', generateAggregateShoppingList);
    document.getElementById('batch-clear')?.addEventListener('click', clearBatch);

    updateBatchUI();
}

function addToBatch() {
    const windowData = getWindowDataFn();
    if (!windowData) {
        alert('Calculate window first!');
        return;
    }

    batchWindows.push(windowData);
    updateBatchUI();
    showNotification(`Window added to batch (${batchWindows.length} total)`, 'success');
}

function removeFromBatch(index) {
    batchWindows.splice(index, 1);
    updateBatchUI();
}

function clearBatch() {
    if (batchWindows.length === 0) return;
    if (confirm('Clear all windows from batch?')) {
        batchWindows = [];
        updateBatchUI();
        showNotification('Batch cleared', 'info');
    }
}

function updateBatchUI() {
    const container = document.getElementById('batch-list');
    if (!container) return;

    if (batchWindows.length === 0) {
        container.innerHTML = '<p class="empty-state">No windows in batch</p>';
        return;
    }

    container.innerHTML = batchWindows.map((window, index) => `
        <div class="batch-item">
            <div>
                <p><strong>${window.frame.width}×${window.frame.height}mm</strong> • ${window.config}</p>
                <p class="batch-item-meta">${window.glazing.totalPanes} panes • ${window.glazing.description || window.config}</p>
            </div>
            <button class="btn btn-small btn-danger" data-index="${index}">Remove</button>
        </div>
    `).join('');

    container.querySelectorAll('button[data-index]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const index = Number(event.currentTarget.dataset.index);
            removeFromBatch(index);
        });
    });
}

async function exportBatchPDF() {
    if (batchWindows.length === 0) {
        alert('No windows in batch!');
        return;
    }

    try {
        showNotification('Generating batch PDF…', 'info');

        const response = await fetch(`${BACKEND_URL}/api/export/batch-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ windows: batchWindows })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.detail || 'Batch PDF generation failed');
        }

        const blob = await response.blob();
        downloadFile(blob, `batch_windows_${Date.now()}.pdf`, 'application/pdf');
        showNotification('Batch PDF generated!', 'success');
    } catch (error) {
        console.error('Batch PDF error:', error);
        showNotification(`Batch PDF failed: ${error.message}`, 'error');
    }
}

function generateAggregateShoppingList() {
    if (batchWindows.length === 0) {
        alert('No windows in batch!');
        return;
    }

    const aggregate = {};

    batchWindows.forEach((window) => {
        const groups = window.shoppingList || {};
        (groups.timber || []).forEach((item) => accumulateItem(aggregate, item));
        (groups.glass || []).forEach((item) => accumulateItem(aggregate, item));
        (groups.hardware || []).forEach((item) => accumulateItem(aggregate, item));
        (groups.finishing || []).forEach((item) => accumulateItem(aggregate, item));

        if (Array.isArray(window.shopping)) {
            window.shopping.forEach((item) => accumulateItem(aggregate, item));
        }
    });

    const list = Object.values(aggregate);
    renderAggregateList(list);
    showNotification('Aggregate shopping list ready', 'success');
}

function accumulateItem(aggregate, item) {
    const key = `${item.material}|${item.specification}|${item.unit}`;
    if (!aggregate[key]) {
        aggregate[key] = { ...item, quantity: Number(item.quantity || 0) };
    } else {
        aggregate[key].quantity += Number(item.quantity || 0);
    }
}

function renderAggregateList(items) {
    const container = document.getElementById('batch-aggregate-list');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = '<p class="empty-state">No shopping items available.</p>';
        return;
    }

    container.innerHTML = `
        <table class="aggregate-table">
            <thead>
                <tr>
                    <th>Material</th>
                    <th>Specification</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item) => `
                    <tr>
                        <td>${item.material}</td>
                        <td>${item.specification}</td>
                        <td>${Number(item.quantity).toFixed(2)}</td>
                        <td>${item.unit}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

export function getBatchWindows() {
    return [...batchWindows];
}
