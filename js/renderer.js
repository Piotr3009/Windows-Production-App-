/**
 * renderer.js
 * Odpowiada za rysowanie rzutu 2D okna na canvasie oraz obsługę zoom/pan.
 */

import { CONSTANTS } from './calculations.js';

let panzoomInstance = null;

/**
 * Inicjalizuje pan/zoom na canvasie.
 * @param {HTMLCanvasElement} canvas
 */
export function initRenderer(canvas) {
    if (!canvas) return;
    if (panzoomInstance) {
        panzoomInstance.dispose();
    }
    panzoomInstance = Panzoom(canvas, {
        maxScale: 4,
        minScale: 0.4,
        step: 0.1,
        contain: 'outside'
    });
}

/**
 * Zwraca instancję Panzoom dla obsługi przycisków sterujących.
 */
export function getPanzoomInstance() {
    return panzoomInstance;
}

/**
 * Renderuje okno w oparciu o dane obliczeniowe.
 * @param {HTMLCanvasElement} canvas
 * @param {object} data wynik calculateWindow
 */
export function renderWindow(canvas, data) {
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    const frameWidth = data.frame.width;
    const frameHeight = data.frame.height;

    const scale = Math.min(
        availableWidth / frameWidth,
        availableHeight / frameHeight
    );

    const offsetX = (canvas.width - frameWidth * scale) / 2;
    const offsetY = (canvas.height - frameHeight * scale) / 2;

    const drawRect = (x, y, width, height, fill, stroke, lineWidth = 2) => {
        ctx.save();
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.rect(offsetX + x * scale, offsetY + y * scale, width * scale, height * scale);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };

    // Frame
    drawRect(0, 0, frameWidth, frameHeight, '#1f2937', '#111827', 4);

    const sashWidth = data.sashes.top.width;
    const topSashHeight = data.sashes.top.heightWithHorn;
    const bottomSashHeight = data.sashes.bottom.height;

    const sashX = (frameWidth - sashWidth) / 2;

    // Top sash (with horns as overhang at bottom)
    drawRect(sashX, 0, sashWidth, topSashHeight, '#e5e7eb', '#1f2937', 2);

    // Bottom sash
    drawRect(sashX, frameHeight - bottomSashHeight, sashWidth, bottomSashHeight, '#f1f5f9', '#1f2937', 2);

    // Glass areas inside sashes
    const glassWidth = sashWidth - CONSTANTS.GLASS_WIDTH_DEDUCTION + CONSTANTS.GLASS_WIDTH_ADD_BACK;
    const topGlassHeight = data.sashes.top.height - CONSTANTS.GLASS_TOP_HEIGHT_DEDUCTION + CONSTANTS.GLASS_HEIGHT_ADD_BACK;
    const bottomGlassHeight = data.sashes.bottom.height - CONSTANTS.GLASS_BOTTOM_HEIGHT_DEDUCTION + CONSTANTS.GLASS_HEIGHT_ADD_BACK;

    const glassX = sashX + (sashWidth - glassWidth) / 2;
    const topGlassY = (data.sashes.top.height - topGlassHeight) / 2;
    const bottomGlassY = frameHeight - bottomSashHeight + (bottomSashHeight - bottomGlassHeight) / 2;

    drawRect(glassX, topGlassY, glassWidth, topGlassHeight, 'rgba(147, 197, 253, 0.35)', '#0f172a', 1.5);
    drawRect(glassX, bottomGlassY, glassWidth, bottomGlassHeight, 'rgba(147, 197, 253, 0.35)', '#0f172a', 1.5);

    // Glazing bars (2x2)
    const halfPaneWidth = (glassWidth - CONSTANTS.GLAZING_BAR_WIDTH) / 2;
    const topHalfPaneHeight = (topGlassHeight - CONSTANTS.GLAZING_BAR_WIDTH) / 2;
    const bottomHalfPaneHeight = (bottomGlassHeight - CONSTANTS.GLAZING_BAR_WIDTH) / 2;

    const drawBar = (x, y, width, height) => {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(offsetX + x * scale, offsetY + y * scale, width * scale, height * scale);
    };

    drawBar(glassX + halfPaneWidth - CONSTANTS.GLAZING_BAR_WIDTH / 2, topGlassY, CONSTANTS.GLAZING_BAR_WIDTH, topGlassHeight);
    drawBar(glassX + halfPaneWidth - CONSTANTS.GLAZING_BAR_WIDTH / 2, bottomGlassY, CONSTANTS.GLAZING_BAR_WIDTH, bottomGlassHeight);

    drawBar(glassX, topGlassY + topHalfPaneHeight - CONSTANTS.GLAZING_BAR_WIDTH / 2, glassWidth, CONSTANTS.GLAZING_BAR_WIDTH);
    drawBar(glassX, bottomGlassY + bottomHalfPaneHeight - CONSTANTS.GLAZING_BAR_WIDTH / 2, glassWidth, CONSTANTS.GLAZING_BAR_WIDTH);
}
