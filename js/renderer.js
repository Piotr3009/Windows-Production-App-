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

    const sashWidth = data.sash.width;
    const sashHeight = data.sash.height;
    const sashX = (frameWidth - sashWidth) / 2;
    const sashY = (frameHeight - sashHeight) / 2;

    drawRect(sashX, sashY, sashWidth, sashHeight, '#e5e7eb', '#1f2937', 3);

    const glassWidth = data.glazing.clearWidth;
    const glassHeight = data.glazing.clearHeight;
    const glassX = sashX + (sashWidth - glassWidth) / 2;
    const glassY = sashY + (sashHeight - glassHeight) / 2;

    drawRect(glassX, glassY, glassWidth, glassHeight, 'rgba(147, 197, 253, 0.35)', '#0f172a', 1.5);

    const drawBar = (x, y, width, height) => {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(offsetX + x * scale, offsetY + y * scale, width * scale, height * scale);
    };

    const verticalX = glassX + glassWidth / 2 - CONSTANTS.GLAZING_BAR_WIDTH / 2;
    drawBar(verticalX, glassY, CONSTANTS.GLAZING_BAR_WIDTH, glassHeight);

    const horizontalY = glassY + glassHeight / 2 - CONSTANTS.GLAZING_BAR_WIDTH / 2;
    drawBar(glassX, horizontalY, glassWidth, CONSTANTS.GLAZING_BAR_WIDTH);
}
