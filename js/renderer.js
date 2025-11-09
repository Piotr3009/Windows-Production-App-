/**
 * renderer.js - ETAP 3
 * Canvas renderer with zoom/pan support for all sash window configurations.
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
                // Ignore capture errors
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
                // Ignore release errors
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

    reset() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
    }
}

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

export function getPanzoomInstance() {
    return panzoomInstance;
}

export function renderWindow(canvas, windowData) {
    if (!canvas || !windowData) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frameW = windowData.frame.width;
    const frameH = windowData.frame.height;
    const maxDim = Math.max(frameW, frameH);
    if (maxDim <= 0) return;

    const scale = Math.min(canvas.width * 0.8, canvas.height * 0.8) / maxDim;
    const offsetX = (canvas.width - frameW * scale) / 2;
    const offsetY = (canvas.height - frameH * scale) / 2;

    drawFrame(ctx, offsetX, offsetY, frameW * scale, frameH * scale);

    const sashW = windowData.sash.width * scale;
    const sashH = windowData.sash.height * scale;
    const sashOffsetX = offsetX + (frameW * scale - sashW) / 2;
    const sashOffsetY = offsetY + (frameH * scale - sashH) / 2;
    drawSash(ctx, sashOffsetX, sashOffsetY, sashW, sashH);

    if (windowData.components?.sash?.glazingBars) {
        drawGlazingBars(
            ctx,
            sashOffsetX,
            sashOffsetY,
            sashW,
            sashH,
            windowData.components.sash.glazingBars,
            scale
        );
    }

    drawDimensions(ctx, offsetX, offsetY, frameW * scale, frameH * scale, frameW, frameH);
}

function drawFrame(ctx, x, y, w, h) {
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
}

function drawSash(ctx, x, y, w, h) {
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
}

function drawGlazingBars(ctx, sashX, sashY, sashW, sashH, glazingBars, scale) {
    const stileWidth = CONSTANTS.STILE_WIDTH * scale;
    const topRailWidth = CONSTANTS.TOP_RAIL_WIDTH * scale;
    const bottomRailWidth = CONSTANTS.BOTTOM_RAIL_WIDTH * scale;

    const glazingX = sashX + stileWidth;
    const glazingY = sashY + topRailWidth;
    const glazingW = sashW - 2 * stileWidth;
    const glazingH = sashH - topRailWidth - bottomRailWidth;

    ctx.fillStyle = 'rgba(147, 197, 253, 0.28)';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.fillRect(glazingX, glazingY, glazingW, glazingH);
    ctx.strokeRect(glazingX, glazingY, glazingW, glazingH);

    ctx.fillStyle = '#1f2937';

    if (glazingBars.vertical?.positions?.length) {
        glazingBars.vertical.positions.forEach((pos) => {
            const width = glazingBars.vertical.width * scale;
            const x = glazingX + pos * scale - width / 2;
            ctx.fillRect(x, glazingY, width, glazingH);
        });
    }

    if (glazingBars.horizontal?.positions?.length) {
        glazingBars.horizontal.positions.forEach((pos) => {
            const height = glazingBars.horizontal.width * scale;
            const y = glazingY + pos * scale - height / 2;
            ctx.fillRect(glazingX, y, glazingW, height);
        });
    }
}

function drawDimensions(ctx, x, y, w, h, actualW, actualH) {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';

    ctx.fillText(`${Math.round(actualW)}mm`, x + w / 2, y - 10);

    ctx.save();
    ctx.translate(x - 15, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${Math.round(actualH)}mm`, 0, 0);
    ctx.restore();
}
