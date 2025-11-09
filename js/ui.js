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
        topSash: document.getElementById('summary-top-sash'),
        bottomSash: document.getElementById('summary-bottom-sash'),
        glassTop: document.getElementById('summary-glass-top'),
        glassBottom: document.getElementById('summary-glass-bottom')
    };

    summary.frame.textContent = formatPair(result.frame.width, result.frame.height);
    summary.topSash.textContent = formatPair(result.sashes.top.width, result.sashes.top.height);
    summary.bottomSash.textContent = formatPair(result.sashes.bottom.width, result.sashes.bottom.height);

    const topGlass = result.glazing.panes.filter(p => p.id.startsWith('T'))[0];
    const bottomGlass = result.glazing.panes.filter(p => p.id.startsWith('B'))[0];

    summary.glassTop.textContent = topGlass ? formatPair(topGlass.width, topGlass.height) : '–';
    summary.glassBottom.textContent = bottomGlass ? formatPair(bottomGlass.width, bottomGlass.height) : '–';
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
            <td class="px-3 py-2">${item.width ?? '–'}</td>
            <td class="px-3 py-2">${item.length ?? '–'}</td>
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
