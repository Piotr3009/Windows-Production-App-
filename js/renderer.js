import { CONSTANTS, deriveWindowData } from './calculations.js';

let panzoom = null;
const canvas = document.getElementById('window-canvas');
const overlay = document.getElementById('bars-overlay');

// --- Helpers graficzne ---
function createWoodGradient(ctx, x, y, w, h, isHorizontal) {
    const grad = isHorizontal 
        ? ctx.createLinearGradient(x, y, x, y + h)
        : ctx.createLinearGradient(x, y, x + w, y);
    
    // Symulacja profilowania drewna (cieniowanie)
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.1, '#cbd5e1');
    grad.addColorStop(0.5, '#f8fafc'); // Highlight na środku
    grad.addColorStop(0.9, '#cbd5e1');
    grad.addColorStop(1, '#94a3b8');
    return grad;
}

function drawGlassEffect(ctx, x, y, w, h) {
    ctx.save();
    // Błękitny odcień szkła z gradientem
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(200, 230, 255, 0.4)');
    grad.addColorStop(1, 'rgba(230, 240, 255, 0.1)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    
    // Refleksy (paski odblaskowe)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.moveTo(x + w * 0.7, y);
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.moveTo(x + w * 0.6, y);
    ctx.lineTo(x + w, y + h * 0.4);
    ctx.stroke();
    ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2, text) {
    const headlen = 8; // długość grotu
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.save();
    ctx.strokeStyle = '#dc2626'; // Czerwony wymiar
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.font = 'bold 12px Inter, sans-serif';
    
    // Linia
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Groty
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + headlen * Math.cos(angle + Math.PI / 6), y1 + headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x1 + headlen * Math.cos(angle - Math.PI / 6), y1 + headlen * Math.sin(angle - Math.PI / 6));
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.fill();

    // Tekst (tło pod tekstem dla czytelności)
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const textMetrics = ctx.measureText(text);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const pad = 2;
    ctx.fillRect(midX - textMetrics.width/2 - pad, midY - 10, textMetrics.width + pad*2, 14);
    
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY - 3);
    
    ctx.restore();
}

// ... (CanvasPanzoom class pozostaje bez zmian - skopiuj z oryginalnego pliku) ...
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
      // Używamy transformacji CSS dla wydajności, canvas renderuje się w wysokiej rozdzielczości
      // this.element.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
      // UWAGA: W tej wersji renderujemy bezpośrednio na canvasie z uwzględnieniem skali,
      // więc CanvasPanzoom służy tylko do trzymania stanu. Odświeżenie następuje przez requestAnimationFrame lub eventy.
      // Aby uprościć integrację z twoim kodem, wywołujemy renderWindowPreview przy każdej zmianie pan/zoom.
      // (Wymagałoby to przekazania referencji do danych okna do klasy, zrobimy to prościej poniżej)
    }
  
    onWheel(event) {
        event.preventDefault();
        const direction = event.deltaY > 0 ? -1 : 1;
        this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale + direction * this.step));
        // Trigger redraw external
        const eventChange = new CustomEvent('canvas-change');
        this.element.dispatchEvent(eventChange);
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
        const eventChange = new CustomEvent('canvas-change');
        this.element.dispatchEvent(eventChange);
    }
  
    onPointerUp(event) {
        this.isDragging = false;
        this.element.releasePointerCapture?.(event.pointerId);
    }
}

let currentWindowSpec = null;
let currentSettings = null;

function ensurePanzoom() {
  if (canvas && !panzoom) {
    panzoom = new CanvasPanzoom(canvas);
    canvas.addEventListener('canvas-change', () => {
        if(currentWindowSpec) renderWindowPreview(currentWindowSpec, currentSettings);
    });
  }
}

function clearCanvas() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawRect(ctx, x, y, w, h, isHorizontal = false) {
    ctx.fillStyle = createWoodGradient(ctx, x, y, w, h, isHorizontal);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
}

function drawFrame(ctx, x, y, w, h) {
    // Rama zewnętrzna
    drawRect(ctx, x, y, w, h, false);
    // Wycieramy środek żeby narysować Sash
    ctx.clearRect(x + 10, y + 10, w - 20, h - 20); // Uproszczone
    ctx.strokeRect(x, y, w, h);
}

export function renderWindowPreview(windowSpec, settings = {}) {
  currentWindowSpec = windowSpec;
  currentSettings = settings;
  ensurePanzoom();
  
  if (!canvas || !windowSpec) return;
  const ctx = canvas.getContext('2d');
  
  // High DPI support
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  clearCanvas();
  // Clear overlay (handles) if needed
  if(overlay) overlay.innerHTML = '';

  const frameWidth = Number(windowSpec.frame?.width ?? 0);
  const frameHeight = Number(windowSpec.frame?.height ?? 0);
  if (!frameWidth || !frameHeight) return;

  const derived = deriveWindowData(windowSpec, settings);
  
  // Obliczanie skali i pozycji (PanZoom)
  const maxDim = Math.max(frameWidth, frameHeight);
  const baseScale = Math.min((rect.width * 0.8) / maxDim, (rect.height * 0.8) / maxDim);
  
  const finalScale = baseScale * panzoom.scale;
  const centerX = rect.width / 2 + panzoom.translateX;
  const centerY = rect.height / 2 + panzoom.translateY;
  
  const drawX = centerX - (frameWidth * finalScale) / 2;
  const drawY = centerY - (frameHeight * finalScale) / 2;

  // 1. Rysowanie RAMY (Box)
  const fw = frameWidth * finalScale;
  const fh = frameHeight * finalScale;
  
  ctx.save();
  // Cień pod oknem
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  
  // HEAD
  drawRect(ctx, drawX, drawY, fw, CONSTANTS.HEAD_WIDTH * finalScale, true);
  // SILL
  drawRect(ctx, drawX, drawY + fh - CONSTANTS.SILL_WIDTH * finalScale, fw, CONSTANTS.SILL_WIDTH * finalScale, true);
  // JAMBS
  drawRect(ctx, drawX, drawY, CONSTANTS.JAMBS_WIDTH * finalScale, fh, false);
  drawRect(ctx, drawX + fw - CONSTANTS.JAMBS_WIDTH * finalScale, drawY, CONSTANTS.JAMBS_WIDTH * finalScale, fh, false);
  ctx.restore();

  // 2. Rysowanie SKRZYDEŁ (Sash)
  const sashW = derived.sashWidth * finalScale;
  const sashH = derived.sashHeight * finalScale;
  const sashX = drawX + (fw - sashW) / 2;
  const sashY = drawY + (fh - sashH) / 2; // Uproszczenie: wyśrodkowane

  // Top Sash
  const topSashH = (derived.sashHeight / 2) * finalScale; 
  // Rysujemy po prostu całe skrzydło jako kontener dla szprosów
  
  // Tło za oknem (wnętrze pokoju / podwórko)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(sashX, sashY, sashW, sashH);

  // Stiles (Pionowe ramy skrzydła)
  const stileW = CONSTANTS.STILE_WIDTH * finalScale;
  drawRect(ctx, sashX, sashY, stileW, sashH, false); // Lewy
  drawRect(ctx, sashX + sashW - stileW, sashY, stileW, sashH, false); // Prawy
  
  // Rails (Poziome ramy)
  const topRailH = CONSTANTS.TOP_RAIL_WIDTH * finalScale;
  const bottomRailH = CONSTANTS.BOTTOM_RAIL_WIDTH * finalScale;
  const meetRailH = CONSTANTS.MEETING_RAIL_WIDTH * finalScale;
  
  drawRect(ctx, sashX, sashY, sashW, topRailH, true); // Top
  drawRect(ctx, sashX, sashY + sashH - bottomRailH, sashW, bottomRailH, true); // Bottom
  drawRect(ctx, sashX, sashY + (sashH/2) - (meetRailH/2), sashW, meetRailH, true); // Meeting rail

  // 3. Szkło i Szprosy
  const glassX = sashX + stileW;
  const glassY = sashY + topRailH;
  const glassW = sashW - 2 * stileW;
  const glassH = sashH - topRailH - bottomRailH;
  
  // Rysowanie efektu szkła na całej powierzchni
  drawGlassEffect(ctx, glassX, glassY, glassW, glassH);

  // Szprosy (Bars)
  const barW = CONSTANTS.GLAZING_BAR_WIDTH * finalScale;
  const bars = windowSpec.sash.grid.mode === 'custom' 
      ? windowSpec.sash.grid.customBars 
      : derived.barPositions;

  ctx.fillStyle = createWoodGradient(ctx, 0, 0, barW, 100, false); // Pattern gradient
  
  // Pionowe
  (bars.vertical || []).forEach(pos => {
      const bx = glassX + pos * finalScale - barW/2;
      drawRect(ctx, bx, glassY, barW, glassH, false);
  });

  // Poziome
  (bars.horizontal || []).forEach(pos => {
      const by = glassY + pos * finalScale - barW/2;
      drawRect(ctx, glassX, by, glassW, barW, true);
  });

  // 4. Wymiarowanie Techniczne
  const dimOffset = 30;
  // Szerokość całkowita
  drawArrow(ctx, drawX, drawY - dimOffset, drawX + fw, drawY - dimOffset, `${Math.round(frameWidth)}`);
  // Wysokość całkowita
  drawArrow(ctx, drawX - dimOffset, drawY, drawX - dimOffset, drawY + fh, `${Math.round(frameHeight)}`);
  
  // Rysowanie "Horns" (rogi)
  if (windowSpec.sash.horns) {
      const hornExt = (windowSpec.sash.hornExtension || 0) * finalScale;
      // Horn lewy
      drawRect(ctx, sashX - stileW/4, sashY + (sashH/2), stileW + stileW/4, hornExt, false);
      // Horn prawy
      drawRect(ctx, sashX + sashW - stileW, sashY + (sashH/2), stileW + stileW/4, hornExt, false);
  }
}