/**
 * Eventos de ponteiro no canvas: atualiza estado e solicita re-render via callback.
 * Não importa render.js — evita ciclo de dependências.
 */

import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { normalizeClipRect } from '../utils/geometry.js';
import { applyClippingToState } from '../utils/helpers.js';
import { logAction } from '../utils/helpers.js';
import { addLineToState, addCircleToState, addBezierToState, addHermiteToState } from '../core/state.js';
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
      return;
    }

    // Curva de Bézier: coleta 4 pontos de controle (P0, P1, P2, P3)
    if (state.mode === 'bezier') {
      registerClickFlash(state, x, y);
      state.pendingPoints.push({ x, y });
      logAction(`Ponto de controle ${state.pendingPoints.length} de Bézier definido.`, { x, y });

      if (state.pendingPoints.length === 4) {
        const p = state.pendingPoints;
        const obj = addBezierToState(state, p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y);
        logAction('Curva de Bézier cúbica adicionada.', {
          id: obj.id,
          type: 'bezier',
          points: p,
        });
        state.pendingPoints = [];
      }
      requestRender();
      return;
    }

    // Curva de Hermite: coleta 2 pontos (P0, P1) + 2 pontos de tangente (T0, T1)
    // Total: 4 cliques
    if (state.mode === 'hermite') {
      registerClickFlash(state, x, y);
      state.pendingPoints.push({ x, y });
      
      const pointCount = state.pendingPoints.length;
      let msg = '';
      if (pointCount === 1) msg = 'Ponto inicial P0 definido.';
      else if (pointCount === 2) msg = 'Ponto final P1 definido.';
      else if (pointCount === 3) msg = 'Extremo da tangente inicial T0 definido.';
      else if (pointCount === 4) msg = 'Extremo da tangente final T1 definido.';
      
      logAction(msg, { x, y });

      if (state.pendingPoints.length === 4) {
        const p = state.pendingPoints;
        // P0 = p[0], P1 = p[1]
        // Tangente T0 = p[2] - p[0]
        // Tangente T1 = p[3] - p[1]
        const tx0 = p[2].x - p[0].x;
        const ty0 = p[2].y - p[0].y;
        const tx1 = p[3].x - p[1].x;
        const ty1 = p[3].y - p[1].y;
        
        const obj = addHermiteToState(state, p[0].x, p[0].y, p[1].x, p[1].y, tx0, ty0, tx1, ty1);
        logAction('Curva de Hermite cúbica adicionada.', {
          id: obj.id,
          type: 'hermite',
          P0: { x: p[0].x, y: p[0].y },
          P1: { x: p[1].x, y: p[1].y },
          T0: { x: tx0, y: ty0 },
          T1: { x: tx1, y: ty1 },
        });
        state.pendingPoints = [];
      }
      requestRender();
      return;
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
