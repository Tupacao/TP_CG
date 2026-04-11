/**
 * Eventos de ponteiro no canvas: atualiza estado e solicita re-render via callback.
 * Não importa render.js — evita ciclo de dependências.
 */

import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { normalizeClipRect } from '../utils/geometry.js';
import { applyClippingToState } from '../utils/helpers.js';
import { logAction } from '../utils/helpers.js';
import { addLineToState, addCircleToState } from '../core/state.js';
import { finalizeSelectionRect } from './selection.js';
import { registerClickFlash } from '../feedback/clickFeedback.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} clientX
 * @param {number} clientY
 */
export function canvasCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/**
 * @param {{
 *   state: ReturnType<import('../core/state.js').createAppState>,
 *   canvas: HTMLCanvasElement,
 *   requestRender: () => void,
 * }} opts
 */
export function attachMouseHandlers(opts) {
  const { state, canvas, requestRender } = opts;

  function onMouseDown(e) {
    const { x, y } = canvasCoords(canvas, e.clientX, e.clientY);
    if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) return;

    if (state.mode === 'select') {
      state.selectDrag = { x0: x, y0: y, x1: x, y1: y };
      requestRender();
      return;
    }

    if (state.mode === 'dda' || state.mode === 'bresenham') {
      registerClickFlash(state, x, y);
      if (!state.pendingPoint) {
        state.pendingPoint = { x, y };
        logAction('Primeiro ponto da reta definido.', state.pendingPoint);
      } else {
        const p0 = state.pendingPoint;
        const algo = state.mode === 'dda' ? 'dda' : 'bres';
        const obj = addLineToState(state, p0.x, p0.y, x, y, algo);
        logAction('Reta adicionada.', {
          id: obj.id,
          algo,
          x1: obj.x1,
          y1: obj.y1,
          x2: obj.x2,
          y2: obj.y2,
        });
        state.pendingPoint = null;
      }
      requestRender();
      return;
    }

    if (state.mode === 'circle') {
      registerClickFlash(state, x, y);
      if (!state.pendingPoint) {
        state.pendingPoint = { x, y };
        logAction('Centro da circunferência definido.', state.pendingPoint);
      } else {
        const p0 = state.pendingPoint;
        const r = Math.hypot(x - p0.x, y - p0.y);
        const obj = addCircleToState(state, p0.x, p0.y, r);
        logAction('Circunferência adicionada.', { id: obj.id, xc: obj.xc, yc: obj.yc, r: obj.r });
        state.pendingPoint = null;
      }
      requestRender();
      return;
    }

    if (state.mode === 'clip_cs' || state.mode === 'clip_lb') {
      registerClickFlash(state, x, y);
      if (!state.pendingPoint) {
        state.pendingPoint = { x, y };
        logAction('Primeiro canto da janela de recorte.', state.pendingPoint);
      } else {
        const p0 = state.pendingPoint;
        state.clipWindow = normalizeClipRect(p0.x, p0.y, x, y);
        state.pendingPoint = null;
        logAction('Janela de recorte definida.', state.clipWindow);
        applyClippingToState(state, state.mode === 'clip_cs' ? 'cs' : 'lb');
      }
      requestRender();
    }
  }

  function onMouseMove(e) {
    const { x, y } = canvasCoords(canvas, e.clientX, e.clientY);
    state.mouse.x = x;
    state.mouse.y = y;
    state.mouse.inside = x >= 0 && y >= 0 && x < CANVAS_W && y < CANVAS_H;

    if (state.mode === 'select' && state.selectDrag && (e.buttons & 1)) {
      state.selectDrag.x1 = x;
      state.selectDrag.y1 = y;
    }
    requestRender();
  }

  function onMouseLeave() {
    state.mouse.inside = false;
    requestRender();
  }

  function finishSelectDragIfAny(clientX, clientY) {
    if (state.mode !== 'select' || !state.selectDrag) return;
    const { x, y } = canvasCoords(canvas, clientX, clientY);
    const cx = Math.max(0, Math.min(CANVAS_W - 1, x));
    const cy = Math.max(0, Math.min(CANVAS_H - 1, y));
    const d = state.selectDrag;
    d.x1 = cx;
    d.y1 = cy;
    finalizeSelectionRect(state, d.x0, d.y0, d.x1, d.y1);
    state.selectDrag = null;
    requestRender();
  }

  function onWindowMouseUp(e) {
    finishSelectDragIfAny(e.clientX, e.clientY);
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('mouseup', onWindowMouseUp);

  return function detachMouseHandlers() {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('mouseup', onWindowMouseUp);
  };
}
