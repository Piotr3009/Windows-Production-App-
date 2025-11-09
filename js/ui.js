/**
 * ui.js
 * Funkcje pomocnicze do aktualizacji interfejsu użytkownika.
 */

export function initialiseTabs() {
    const tabButtons = Array.from(document.querySelectorAll('.result-tab'));
    const panels = Array.from(document.querySelectorAll('.result-panel'));

    const activate = (id) => {
        panels.forEach(panel => {
            panel.hidden = panel.id !== id;
        });
        tabButtons.forEach(btn => {
            const active = btn.dataset.target === id;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', String(active));
        });
    };

    if (tabButtons.length > 0) {
        activate(tabButtons[0].dataset.target);
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activate(btn.dataset.target));
    });
}

export function updateSummary(result) {
    const formatPair = (width, height) => `${Math.round(width)} × ${Math.round(height)} mm`;
    const summary = {
        frame: document.getElementById('summary-frame'),
        sash: document.getElementById('summary-sash'),
        glass: document.getElementById('summary-glass'),
        pane: document.getElementById('summary-pane')
    };

    summary.frame.textContent = formatPair(result.frame.width, result.frame.height);
    summary.sash.textContent = formatPair(result.sash.width, result.sash.height);
    summary.glass.textContent = formatPair(result.glazing.clearWidth, result.glazing.clearHeight);

    const pane = result.glazing.panes[0];
    summary.pane.textContent = pane ? formatPair(pane.width, pane.height) : '–';
}

export function populatePrecutTable(items) {
    const body = document.getElementById('precut-body');
    body.innerHTML = '';

    if (!items || items.length === 0) {
        appendEmptyRow(body, 5);
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-3 py-2">${item.element}</td>
            <td class="px-3 py-2">${formatMeasurement(item.width)}</td>
            <td class="px-3 py-2">${formatMeasurement(item.length)}</td>
            <td class="px-3 py-2">${item.quantity ?? 1}</td>
            <td class="px-3 py-2">${item.section || 'Hardwood'}</td>
        `;
        body.appendChild(tr);
    });
}

export function populateCutTable(items) {
    const body = document.getElementById('cut-body');
    body.innerHTML = '';

    if (!items || items.length === 0) {
        appendEmptyRow(body, 4);
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-3 py-2">${item.element}</td>
            <td class="px-3 py-2">${item.specification}</td>
            <td class="px-3 py-2">${item.quantity}</td>
            <td class="px-3 py-2">${item.notes || ''}</td>
        `;
        body.appendChild(tr);
    });
}

export function populateShoppingTable(list) {
    const body = document.getElementById('shopping-body');
    body.innerHTML = '';

    const rows = [];
    ['timber', 'glass', 'hardware', 'finishing'].forEach(group => {
        (list[group] || []).forEach(item => rows.push(item));
    });

    if (rows.length === 0) {
        appendEmptyRow(body, 4);
        return;
    }

    rows.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-3 py-2">${item.material}</td>
            <td class="px-3 py-2">${item.specification}</td>
            <td class="px-3 py-2">${item.quantity}</td>
            <td class="px-3 py-2">${item.unit}</td>
        `;
        body.appendChild(tr);
    });
}

export function populateGlazingTable(glazing) {
    const body = document.getElementById('glazing-body');
    body.innerHTML = '';

    if (!glazing || !glazing.panes || glazing.panes.length === 0) {
        appendEmptyRow(body, 4);
        return;
    }

    glazing.panes.forEach(pane => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-3 py-2">${pane.id}</td>
            <td class="px-3 py-2">${pane.width.toFixed(1)}</td>
            <td class="px-3 py-2">${pane.height.toFixed(1)}</td>
            <td class="px-3 py-2">${glazing.glazingType}</td>
        `;
        body.appendChild(tr);
    });
}

function appendEmptyRow(body, colspan) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colspan;
    td.className = 'table-empty';
    td.textContent = 'No data available yet.';
    tr.appendChild(td);
    body.appendChild(tr);
}

function formatMeasurement(value) {
    if (value === null || value === undefined || value === '') {
        return '–';
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value % 1 === 0 ? `${value}` : value.toFixed(1);
    }
    return value;
}
