/**
 * renderer.js
 * Odpowiada za rysowanie rzutu 2D okna na canvasie oraz obsługę zoom/pan.
 */

import { CONSTANTS } from './calculations.js';

let panzoomInstance = null;

class CanvasPanzoom {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = Object.assign({
            maxScale: 4,
            minScale: 0.4,
            step: 0.1
        }, options);

        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.lastPointer = { x: 0, y: 0 };

        this.handleWheel = this.handleWheel.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);

        this.canvas.style.touchAction = 'none';
        this.canvas.style.transformOrigin = 'center center';
        this.canvas.style.cursor = 'grab';
        this.canvas.style.willChange = 'transform';

        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        this.canvas.addEventListener('pointerup', this.handlePointerUp);
        this.canvas.addEventListener('pointercancel', this.handlePointerUp);
        this.canvas.addEventListener('pointerleave', this.handlePointerUp);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
    }

    dispose() {
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        this.canvas.removeEventListener('pointerup', this.handlePointerUp);
        this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
        this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.isDragging = false;
        this.lastPointer = { x: 0, y: 0 };
        this.canvas.style.cursor = '';
        this.canvas.style.transform = '';
        this.canvas.style.willChange = '';
        this.canvas.style.touchAction = '';
    }

    clampScale(value) {
        return Math.min(this.options.maxScale, Math.max(this.options.minScale, value));
    }

    applyTransform() {
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }

    handleWheel(event) {
        event.preventDefault();
        const direction = event.deltaY > 0 ? -1 : 1;
        const delta = this.options.step * direction;
        const newScale = this.scale * (1 + delta);
        this.scale = this.clampScale(newScale);
        this.applyTransform();
    }

    handlePointerDown(event) {
        if (typeof event.button === 'number' && event.button !== 0) {
            return;
        }
        this.isDragging = true;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        if (this.canvas.setPointerCapture) {
            try {
                this.canvas.setPointerCapture(event.pointerId);
            } catch (error) {
                // Ignore if capture is not available
            }
        }
        this.canvas.style.cursor = 'grabbing';
    }

    handlePointerMove(event) {
        if (!this.isDragging) return;
        const dx = event.clientX - this.lastPointer.x;
        const dy = event.clientY - this.lastPointer.y;
        this.translateX += dx;
        this.translateY += dy;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        this.applyTransform();
    }

    handlePointerUp(event) {
        this.isDragging = false;
        if (this.canvas.releasePointerCapture) {
            try {
                this.canvas.releasePointerCapture(event.pointerId);
            } catch (error) {
                // Ignore if capture is not available
            }
        }
        this.canvas.style.cursor = 'grab';
    }

    zoomIn() {
        const newScale = this.scale * (1 + this.options.step);
        this.scale = this.clampScale(newScale);
        this.applyTransform();
    }

    zoomOut() {
        const newScale = this.scale / (1 + this.options.step);
        this.scale = this.clampScale(newScale);
        this.applyTransform();
    }

    reset(_options = {}) {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
    }
}

/**
 * Inicjalizuje pan/zoom na canvasie.
 * @param {HTMLCanvasElement} canvas
 */
export function initRenderer(canvas) {
    if (!canvas) return;
    if (panzoomInstance) {
        panzoomInstance.dispose();
    }
    panzoomInstance = new CanvasPanzoom(canvas, {
        maxScale: 4,
        minScale: 0.4,
        step: 0.1
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
