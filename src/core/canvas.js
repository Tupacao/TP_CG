/**
 * Módulo do canvas: inicialização, dimensões e primitiva de pixel.
 * putPixel é exposto para ser injetado nos algoritmos (render monta o plotter).
 * clearCanvas usa fillRect no buffer inteiro (limpeza de frame, não primitiva geométrica).
 */

export const CANVAS_W = 800;
export const CANVAS_H = 600;

/** @type {CanvasRenderingContext2D | null} */
let ctx = null;

/**
 * @param {HTMLCanvasElement} canvasEl
 * @returns {CanvasRenderingContext2D}
 */
export function initCanvas(canvasEl) {
  const c = canvasEl.getContext('2d');
  if (!c) throw new Error('Canvas 2D não disponível.');
  ctx = c;
  return c;
}

/**
 * @returns {CanvasRenderingContext2D}
 */
export function getContext() {
  if (!ctx) throw new Error('Canvas não inicializado. Chame initCanvas primeiro.');
  return ctx;
}

/**
 * Um pixel na grade (fillRect 1×1). Mesma assinatura que `plot` injetado nos algoritmos.
 * @param {number} x
 * @param {number} y
 * @param {string} fillStyle
 */
export function putPixel(x, y, fillStyle) {
  const c = getContext();
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= CANVAS_W || yi >= CANVAS_H) return;
  c.fillStyle = fillStyle;
  c.fillRect(xi, yi, 1, 1);
}

/**
 * Limpa o framebuffer com uma cor sólida.
 * @param {string} color
 */
export function clearCanvas(color) {
  const c = getContext();
  c.fillStyle = color;
  c.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

/** @returns {(x: number, y: number, color: string) => void} */
export function createDefaultPlotter() {
  return (x, y, color) => putPixel(x, y, color);
}
