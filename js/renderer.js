import { CONSTANTS, deriveWindowData } from './calculations.js';

let panzoom = null;
const canvas = document.getElementById('window-canvas');
const overlay = document.getElementById('bars-overlay');

// --- Styl techniczny (CAD) ---
const STYLES = {
    background: '#ffffff',
    frameFill: '#f1f5f9',
    frameStroke: '#0f172a',
    sashFill: '#ffffff',
    sashStroke: '#334155',
    glassFill: 'rgba(224, 242, 254, 0.3)', // Bardzo jasny błękit
    dimensionColor: '#dc2626',
    dimensionText: '#dc2626',
    barStroke: '#0f172a'
};

// --- Klasa PanZoom (Nawigacja po rysunku) ---
class CanvasPanzoom {
    constructor(element) {
      this.element = element;
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.isDragging = false;
      this.lastPointer = { x: 0, y: 0 };
      this.minScale = 0.1;
      this.maxScale = 10;

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
      if (!this.element) return;
      this.element.removeEventListener('wheel', this.onWheel);
      this.element.removeEventListener('pointerdown', this.onPointerDown);
      this.element.removeEventListener('pointermove', this.onPointerMove);
      this.element.removeEventListener('pointerup', this.onPointerUp);
      this.element.removeEventListener('pointerleave', this.onPointerUp);
    }
  
    onWheel(event) {
        event.preventDefault();
        const zoomIntensity = 0.1;
        const direction = event.deltaY > 0 ? -1 : 1;
        
        // Zoom w kierunku kursora (uproszczony)
        const oldScale = this.scale;
        const newScale = Math.min(this.maxScale, Math.max(this.minScale, oldScale + direction * zoomIntensity * oldScale));
        this.scale = newScale;
        
        const eventChange = new CustomEvent('redraw-request');
        this.element.dispatchEvent(eventChange);
    }
  
    onPointerDown(event) {
        this.isDragging = true;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        this.element.setPointerCapture?.(event.pointerId);
        this.element.style.cursor = 'grabbing';
    }
  
    onPointerMove(event) {
        if (!this.isDragging) return;
        const dx = event.clientX - this.lastPointer.x;
        const dy = event.clientY - this.lastPointer.y;
        this.translateX += dx;
        this.translateY += dy;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        const eventChange = new CustomEvent('redraw-request');
        this.element.dispatchEvent(eventChange);
    }
  
    onPointerUp(event) {
        this.isDragging = false;
        if (this.element) {
            this.element.releasePointerCapture?.(event.pointerId);
            this.element.style.cursor = 'grab';
        }
    }
}

// --- Funkcje Rysowania ---

function clearCanvas(ctx, w, h) {
    ctx.fillStyle = STYLES.background;
    ctx.fillRect(0, 0, w, h);
    
    // Siatka pomocnicza (Grid) - opcjonalnie
    ctx.beginPath();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 50;
    // Rysowanie siatki można pominąć dla czystości, lub dodać jeśli potrzebne
}

function drawRect(ctx, x, y, w, h, fill, stroke) {
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5; // Grubsze linie dla konturów
        ctx.strokeRect(x, y, w, h);
    }
    
    // Opcjonalnie: Szrafowanie (Hatch) dla przekrojów drewna
    // Tu pomijamy dla czytelności widoku elewacji
}

function drawDimensionLine(ctx, x1, y1, x2, y2, text, offset = 40) {
    ctx.save();
    ctx.strokeStyle = STYLES.dimensionColor;
    ctx.fillStyle = STYLES.dimensionColor;
    ctx.lineWidth = 1;
    ctx.font = '600 12px Inter, sans-serif';

    // Oblicz wektor prostopadły dla offsetu
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    let udx = -dy/len; // Normalna
    let udy = dx/len;
    
    // Jeśli wymiar jest pionowy (dx=0), upewnij się że offset idzie w lewo
    if (Math.abs(dx) < 0.001 && offset > 0) { udx = -1; udy = 0; }
    
    const ox = udx * offset;
    const oy = udy * offset;

    const p1x = x1 + ox; 
    const p1y = y1 + oy;
    const p2x = x2 + ox;
    const p2y = y2 + oy;

    // Linie pomocnicze (witness lines)
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(p1x + udx * 5, p1y + udy * 5); // Lekki nadmiar
    ctx.moveTo(x2, y2);
    ctx.lineTo(p2x + udx * 5, p2y + udy * 5);
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)'; // Jaśniejszy czerwony dla linii pomocniczych
    ctx.stroke();

    // Główna linia wymiarowa
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.strokeStyle = STYLES.dimensionColor;
    ctx.stroke();

    // Groty (Tick marks architektoniczne - ukośne kreski)
    const tickSize = 4;
    ctx.beginPath();
    ctx.lineWidth = 2;
    // Tick 1
    ctx.moveTo(p1x - tickSize, p1y - tickSize);
    ctx.lineTo(p1x + tickSize, p1y + tickSize);
    // Tick 2
    ctx.moveTo(p2x - tickSize, p2y - tickSize);
    ctx.lineTo(p2x + tickSize, p2y + tickSize);
    ctx.stroke();

    // Tekst
    const midX = (p1x + p2x) / 2;
    const midY = (p1y + p2y) / 2;
    
    ctx.fillStyle = STYLES.background; // Tło pod tekst
    const textW = ctx.measureText(text).width + 8;
    ctx.fillRect(midX - textW/2, midY - 8, textW, 16);
    
    ctx.fillStyle = STYLES.dimensionText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY);

    ctx.restore();
}

let currentWindowSpec = null;
let currentSettings = null;

function ensurePanzoom() {
  if (canvas && !panzoom) {
    panzoom = new CanvasPanzoom(canvas);
    canvas.addEventListener('redraw-request', () => {
        if(currentWindowSpec) renderWindowPreview(currentWindowSpec, currentSettings);
    });
  }
}

// --- Główny Render ---
export function renderWindowPreview(windowSpec, settings = {}) {
    currentWindowSpec = windowSpec;
    currentSettings = settings;

    if (!canvas || !windowSpec || !windowSpec.frame) return;
    ensurePanzoom();

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (rect.width === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    clearCanvas(ctx, rect.width, rect.height);
    if (overlay) overlay.innerHTML = '';

    const frameWidth = Number(windowSpec.frame.width);
    const frameHeight = Number(windowSpec.frame.height);
    if (!frameWidth || !frameHeight) return;

    let derived;
    try {
        derived = deriveWindowData(windowSpec, settings);
    } catch (e) { console.error(e); return; }

    // Oblicz skalę
    const margin = 80; // Większy margines na wymiary
    const maxDim = Math.max(frameWidth, frameHeight);
    const fitScale = Math.min((rect.width - margin*2) / maxDim, (rect.height - margin*2) / maxDim);
    const finalScale = fitScale * panzoom.scale;

    const centerX = (rect.width / 2) + panzoom.translateX;
    const centerY = (rect.height / 2) + panzoom.translateY;

    const startX = centerX - (frameWidth * finalScale) / 2;
    const startY = centerY - (frameHeight * finalScale) / 2;

    // --- RYSOWANIE ---

    const C = CONSTANTS;
    const fw = frameWidth * finalScale;
    const fh = frameHeight * finalScale;

    // 1. RAMA (Frame)
    drawRect(ctx, startX, startY, fw, fh, STYLES.frameFill, STYLES.frameStroke);
    
    // Frame profile widths (visible from front)
    const JAMB_W = (C.JAMBS_WIDTH || 28) * finalScale;
    const HEAD_W = (C.HEAD_WIDTH || 28) * finalScale;
    const SILL_W = (C.SILL_WIDTH || 46) * finalScale;

    // Wewnętrzna krawędź ramy
    const innerX = startX + JAMB_W;
    const innerY = startY + HEAD_W;
    const innerW = fw - 2 * JAMB_W;
    const innerH = fh - HEAD_W - SILL_W;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.strokeRect(innerX, innerY, innerW, innerH);

    // 2. SKRZYDŁA (Sash) - top and bottom with correct heights
    const sashW = derived.sashWidth * finalScale;
    const topSashH = (derived.topSashHeight || derived.sashHeight / 2) * finalScale;
    const botSashH = (derived.bottomSashHeight || derived.sashHeight / 2) * finalScale;
    const sashX = startX + (fw - sashW) / 2;
    
    // Top sash sits at the top of the inner frame
    const topSashY = startY + HEAD_W + 3 * finalScale;
    // Bottom sash sits at the bottom
    const botSashY = startY + fh - SILL_W - 3 * finalScale - botSashH;

    // Top Sash
    drawRect(ctx, sashX, topSashY, sashW, topSashH, STYLES.sashFill, STYLES.sashStroke);
    // Bottom Sash
    drawRect(ctx, sashX, botSashY, sashW, botSashH, STYLES.sashFill, STYLES.sashStroke);

    // 3. SZPROSY I SZKŁO
    const STILE_W = (C.STILE_WIDTH || 57) * finalScale;
    const TOP_RAIL_H = (C.TOP_RAIL_WIDTH || 57) * finalScale;
    const BOT_RAIL_H = (C.BOTTOM_RAIL_WIDTH || 90) * finalScale;
    const MEET_RAIL_H = (C.MEETING_RAIL_WIDTH || 43) * finalScale;
    const BAR_W = (C.GLAZING_BAR_WIDTH || 18) * finalScale;

    // Glass area - Top sash
    const glassX = sashX + STILE_W;
    const glassW = sashW - 2 * STILE_W;
    const glassTopY = topSashY + TOP_RAIL_H;
    const glassTopH = topSashH - TOP_RAIL_H - MEET_RAIL_H;

    // Glass area - Bottom sash
    const glassBotY = botSashY + MEET_RAIL_H;
    const glassBotH = botSashH - MEET_RAIL_H - BOT_RAIL_H;

    // Wypełnienie szkła
    ctx.fillStyle = STYLES.glassFill;
    ctx.fillRect(glassX, glassTopY, glassW, glassTopH);
    ctx.fillRect(glassX, glassBotY, glassW, glassBotH);

    // Szprosy
    const bars = windowSpec.sash.grid.mode === 'custom' 
            ? windowSpec.sash.grid.customBars 
            : derived.barPositions;

    ctx.fillStyle = STYLES.barStroke;

    // Rysowanie szprosów - funkcja pomocnicza
    const drawBarsForSash = (baseY, glassH) => {
        // Pionowe
        if (bars.vertical) {
            bars.vertical.forEach(pos => {
                const bx = glassX + pos * finalScale - BAR_W/2;
                ctx.fillRect(bx, baseY, BAR_W, glassH);
                ctx.strokeRect(bx, baseY, BAR_W, glassH);
            });
        }
        // Poziome
        if (bars.horizontal) {
            bars.horizontal.forEach(pos => {
                const by = baseY + pos * finalScale - BAR_W/2;
                if (pos * finalScale < glassH) {
                    ctx.fillRect(glassX, by, glassW, BAR_W);
                    ctx.strokeRect(glassX, by, glassW, BAR_W);
                }
            });
        }
    };

    drawBarsForSash(glassTopY, glassTopH);
    drawBarsForSash(glassBotY, glassBotH);

    // Horns
    if (windowSpec.sash.horns) {
        const hornExt = (windowSpec.sash.hornExtension || 70) * finalScale;
        const hornY = topSashY + topSashH;
        // Lewy horn
        drawRect(ctx, sashX, hornY, STILE_W, hornExt, STYLES.sashFill, STYLES.sashStroke);
        // Prawy horn
        drawRect(ctx, sashX + sashW - STILE_W, hornY, STILE_W, hornExt, STYLES.sashFill, STYLES.sashStroke);
    }

    // 4. WYMIAROWANIE (Technical Dimensions)
    
    // Całkowita szerokość (Na górze)
    drawDimensionLine(ctx, startX, startY, startX + fw, startY, `${Math.round(frameWidth)}`, 30);
    
    // Całkowita wysokość (Z lewej)
    drawDimensionLine(ctx, startX, startY, startX, startY + fh, `${Math.round(frameHeight)}`, 30);

    // Wymiar światła szyby (orientacyjnie, na dole)
    // drawDimensionLine(ctx, glassX, startY + fh, glassX + glassW, startY + fh, `Glass W: ${Math.round(derived.glazing.paneWidth)}`, -30);
}