import { CONSTANTS, deriveWindowData } from './calculations.js';

let panzoom = null;
const canvas = document.getElementById('window-canvas');
const overlay = document.getElementById('bars-overlay');

class CanvasPanzoom {
  constructor(element) {
    this.element = element;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.step = 0.1;
    this.minScale = 0.4;
    this.maxScale = 3;

    this.onWheel = this.onWheel.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    element.style.touchAction = 'none';
    element.addEventListener('wheel', this.onWheel, { passive: false });
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointerleave', this.onPointerUp);
  }

  dispose() {
    this.element.removeEventListener('wheel', this.onWheel);
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointerleave', this.onPointerUp);
    this.element.style.transform = '';
  }

  apply() {
    this.element.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  onWheel(event) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const next = Math.min(this.maxScale, Math.max(this.minScale, this.scale + direction * this.step));
    this.scale = next;
    this.apply();
  }

  onPointerDown(event) {
    if (event.button !== 0) return;
    this.isDragging = true;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.element.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.isDragging) return;
    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.translateX += dx;
    this.translateY += dy;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.apply();
  }

  onPointerUp(event) {
    this.isDragging = false;
    this.element.releasePointerCapture?.(event.pointerId);
  }
}

function ensurePanzoom() {
  if (canvas && !panzoom) {
    panzoom = new CanvasPanzoom(canvas);
  }
}

function clearCanvas() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function clearOverlay() {
  if (overlay) {
    overlay.innerHTML = '';
  }
}

function drawFrame(ctx, x, y, w, h) {
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function drawSash(ctx, x, y, w, h) {
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function drawBars(ctx, sashRect, bars, scale) {
  const stileWidth = CONSTANTS.STILE_WIDTH * scale;
  const topRail = CONSTANTS.TOP_RAIL_WIDTH * scale;
  const bottomRail = CONSTANTS.BOTTOM_RAIL_WIDTH * scale;
  const glazing = {
    x: sashRect.x + stileWidth,
    y: sashRect.y + topRail,
    w: sashRect.w - 2 * stileWidth,
    h: sashRect.h - topRail - bottomRail,
  };

  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.fillRect(glazing.x, glazing.y, glazing.w, glazing.h);
  ctx.strokeRect(glazing.x, glazing.y, glazing.w, glazing.h);

  const barWidth = CONSTANTS.GLAZING_BAR_WIDTH * scale;
  ctx.fillStyle = '#0f172a';

  bars.vertical.forEach((pos) => {
    const x = glazing.x + pos * scale - barWidth / 2;
    ctx.fillRect(x, glazing.y, barWidth, glazing.h);
  });

  bars.horizontal.forEach((pos) => {
    const y = glazing.y + pos * scale - barWidth / 2;
    ctx.fillRect(glazing.x, y, glazing.w, barWidth);
  });
}

function drawDimensions(ctx, rect, actual) {
  ctx.fillStyle = '#ef4444';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(actual.width)} mm`, rect.x + rect.w / 2, rect.y - 8);
  ctx.save();
  ctx.translate(rect.x - 14, rect.y + rect.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${Math.round(actual.height)} mm`, 0, 0);
  ctx.restore();
}

function buildBars(windowSpec, derived) {
  if (windowSpec.sash.grid.mode === 'custom') {
    return {
      vertical: windowSpec.sash.grid.customBars.vertical ?? [],
      horizontal: windowSpec.sash.grid.customBars.horizontal ?? [],
    };
  }
  return {
    vertical: derived.barPositions.vertical ?? [],
    horizontal: derived.barPositions.horizontal ?? [],
  };
}

function renderHandles(bars, sashRect, scale) {
  if (!overlay) return;
  overlay.innerHTML = '';
  const stileWidth = CONSTANTS.STILE_WIDTH * scale;
  const topRail = CONSTANTS.TOP_RAIL_WIDTH * scale;
  const glazing = {
    x: sashRect.x + stileWidth,
    y: sashRect.y + topRail,
    w: sashRect.w - 2 * stileWidth,
    h: sashRect.h - topRail - CONSTANTS.BOTTOM_RAIL_WIDTH * scale,
  };
  const createHandle = (orientation, index, position) => {
    const handle = document.createElement('div');
    handle.className = 'absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-white shadow';
    handle.style.pointerEvents = 'none';
    if (orientation === 'vertical') {
      const x = glazing.x + position * scale;
      handle.style.left = `${(x / canvas.width) * 100}%`;
      handle.style.top = `${((glazing.y + glazing.h / 2) / canvas.height) * 100}%`;
    } else {
      const y = glazing.y + position * scale;
      handle.style.left = `${((glazing.x + glazing.w / 2) / canvas.width) * 100}%`;
      handle.style.top = `${(y / canvas.height) * 100}%`;
    }
    overlay.appendChild(handle);
  };

  bars.vertical.forEach((pos, index) => createHandle('vertical', index, pos));
  bars.horizontal.forEach((pos, index) => createHandle('horizontal', index, pos));
}

export function renderWindowPreview(windowSpec, settings = {}) {
  ensurePanzoom();
  if (!canvas || !windowSpec) return;
  const ctx = canvas.getContext('2d');
  clearCanvas();
  clearOverlay();

  const frameWidth = Number(windowSpec.frame?.width ?? 0);
  const frameHeight = Number(windowSpec.frame?.height ?? 0);
  if (!frameWidth || !frameHeight) return;

  const derived = deriveWindowData(windowSpec, settings);
  const maxDim = Math.max(frameWidth, frameHeight);
  if (!maxDim) return;

  const scale = Math.min((canvas.width * 0.7) / maxDim, (canvas.height * 0.7) / maxDim);
  const offsetX = (canvas.width - frameWidth * scale) / 2;
  const offsetY = (canvas.height - frameHeight * scale) / 2;

  const frameRect = { x: offsetX, y: offsetY, w: frameWidth * scale, h: frameHeight * scale };
  drawFrame(ctx, frameRect.x, frameRect.y, frameRect.w, frameRect.h);

  const sashWidth = derived.sashWidth * scale;
  const sashHeight = derived.sashHeight * scale;
  const sashRect = {
    x: offsetX + (frameRect.w - sashWidth) / 2,
    y: offsetY + (frameRect.h - sashHeight) / 2,
    w: sashWidth,
    h: sashHeight,
  };
  drawSash(ctx, sashRect.x, sashRect.y, sashRect.w, sashRect.h);

  const bars = buildBars(windowSpec, derived);
  drawBars(ctx, sashRect, bars, scale);
  renderHandles(bars, sashRect, scale);
  drawDimensions(ctx, frameRect, { width: frameWidth, height: frameHeight });
}
