/**
 * Único módulo que orquestra o desenho da cena por frame.
 * Usa clearCanvas do core/canvas e delega rasterização aos algoritmos via `plot` injetado.
 */

import { clearCanvas, createDefaultPlotter } from './canvas.js';
import { palette } from './state.js';
import { drawLineDDA } from '../algorithms/dda.js';
import {
  drawLineBresenham,
  drawRectOutlineBresenham,
  drawPixelCross,
} from '../algorithms/bresenham.js';
import { drawCircleBresenham } from '../algorithms/circle.js';
import { drawBezierCurve, drawBezierControlHull } from '../algorithms/bezier.js';
import { drawHermiteCurve, drawHermiteControlHull } from '../algorithms/hermite.js';
import { bboxLine, bboxCircle, bboxBezier, bboxHermite } from '../utils/geometry.js';
import { decayClickFlashes } from '../feedback/clickFeedback.js';
import { updateHud } from '../ui/hud.js';

/**
 * @param {ReturnType<import('./state.js').createAppState>} state
 */
function drawObject(plot, state, o) {
  const stroke = state.selectedIds.has(o.id) ? palette.selectedFg : palette.fg;
  if (o.type === 'line') {
    if (o.algo === 'dda') {
      drawLineDDA(plot, o.x1, o.y1, o.x2, o.y2, stroke);
    } else {
      drawLineBresenham(plot, o.x1, o.y1, o.x2, o.y2, stroke);
    }
  } else if (o.type === 'circle') {
    drawCircleBresenham(plot, o.xc, o.yc, o.r, stroke);
  } else if (o.type === 'bezier') {
    const bezierO = /** @type {*} */ (o);
    drawBezierCurve(plot, bezierO.x0, bezierO.y0, bezierO.x1, bezierO.y1, bezierO.x2, bezierO.y2, bezierO.x3, bezierO.y3, stroke);
  } else if (o.type === 'hermite') {
    const hermiteO = /** @type {*} */ (o);
    drawHermiteCurve(plot, hermiteO.x0, hermiteO.y0, hermiteO.x1, hermiteO.y1, hermiteO.tx0, hermiteO.ty0, hermiteO.tx1, hermiteO.ty1, stroke);
  }
}

/**
 * @param {ReturnType<import('./state.js').createAppState>} state
 */
function drawSelectionHighlights(plot, state) {
  for (const o of state.objects) {
    if (!state.selectedIds.has(o.id)) continue;
    let bb;
    if (o.type === 'line') {
      bb = bboxLine(/** @type {*} */ (o));
    } else if (o.type === 'circle') {
      bb = bboxCircle(/** @type {*} */ (o));
    } else if (o.type === 'bezier') {
      bb = bboxBezier(/** @type {*} */ (o));
    } else if (o.type === 'hermite') {
      bb = bboxHermite(/** @type {*} */ (o));
    }
    if (bb) {
      drawRectOutlineBresenham(
        plot,
        Math.floor(bb.xmin),
        Math.floor(bb.ymin),
        Math.floor(bb.xmax),
        Math.floor(bb.ymax),
        palette.selectedHull
      );
    }

    // Desenha cascos de controle para visualização
    if (o.type === 'bezier') {
      const bezierO = /** @type {*} */ (o);
      drawBezierControlHull(plot, bezierO.x0, bezierO.y0, bezierO.x1, bezierO.y1, bezierO.x2, bezierO.y2, bezierO.x3, bezierO.y3, palette.selectedHull);
    } else if (o.type === 'hermite') {
      const hermiteO = /** @type {*} */ (o);
      drawHermiteControlHull(plot, hermiteO.x0, hermiteO.y0, hermiteO.x1, hermiteO.y1, hermiteO.tx0, hermiteO.ty0, hermiteO.tx1, hermiteO.ty1, palette.selectedHull);
    }
  }
}

/**
 * Redesenha toda a cena a partir do estado atual.
 * @param {ReturnType<import('./state.js').createAppState>} state
 */
export function render(state) {
  const plot = createDefaultPlotter();

  clearCanvas(palette.bg);

  const showPre = document.getElementById('showPreClip');
  if (showPre && showPre.checked && state.preClipSnapshot) {
    for (const l of state.preClipSnapshot.lines) {
      drawLineBresenham(plot, l.x1, l.y1, l.x2, l.y2, palette.preClip);
    }
  }

  for (const o of state.objects) {
    drawObject(plot, state, o);
  }

  if (state.clipWindow) {
    const w = state.clipWindow;
    drawRectOutlineBresenham(
      plot,
      Math.floor(w.xmin),
      Math.floor(w.ymin),
      Math.floor(w.xmax),
      Math.floor(w.ymax),
      palette.clipFrame
    );
  }

  if (state.pendingPoint && state.mode !== 'select' && state.mode !== 'clip_cs' && state.mode !== 'clip_lb') {
    const p0 = state.pendingPoint;
    if (state.mode === 'circle') {
      const r = Math.hypot(state.mouse.x - p0.x, state.mouse.y - p0.y);
      drawCircleBresenham(plot, p0.x, p0.y, r, palette.rubber);
    } else if (state.mode === 'dda') {
      drawLineDDA(plot, p0.x, p0.y, state.mouse.x, state.mouse.y, palette.rubber);
    } else if (state.mode === 'bresenham') {
      drawLineBresenham(plot, p0.x, p0.y, state.mouse.x, state.mouse.y, palette.rubber);
    }
  }

  if ((state.mode === 'clip_cs' || state.mode === 'clip_lb') && state.pendingPoint) {
    const p0 = state.pendingPoint;
    drawRectOutlineBresenham(
      plot,
      Math.floor(Math.min(p0.x, state.mouse.x)),
      Math.floor(Math.min(p0.y, state.mouse.y)),
      Math.floor(Math.max(p0.x, state.mouse.x)),
      Math.floor(Math.max(p0.y, state.mouse.y)),
      palette.rubber
    );
  }

  // Preview de curva de Bézier (4 pontos de controle)
  if (state.mode === 'bezier' && state.pendingPoints.length > 0) {
    const points = state.pendingPoints;
    if (points.length === 1) {
      // Mostrar ponto de controle P0
      drawPixelCross(plot, points[0].x, points[0].y, palette.rubber);
    } else if (points.length === 2) {
      // Mostrar P0, P1 e linha entre eles
      drawLineBresenham(plot, points[0].x, points[0].y, points[1].x, points[1].y, palette.rubber);
      drawPixelCross(plot, points[0].x, points[0].y, palette.rubber);
      drawPixelCross(plot, points[1].x, points[1].y, palette.rubber);
    } else if (points.length === 3) {
      // Mostrar P0, P1, P2 e polígono de controle
      drawLineBresenham(plot, points[0].x, points[0].y, points[1].x, points[1].y, palette.rubber);
      drawLineBresenham(plot, points[1].x, points[1].y, points[2].x, points[2].y, palette.rubber);
      drawPixelCross(plot, points[0].x, points[0].y, palette.rubber);
      drawPixelCross(plot, points[1].x, points[1].y, palette.rubber);
      drawPixelCross(plot, points[2].x, points[2].y, palette.rubber);
    }
  }

  // Preview de curva de Hermite (2 pontos + 2 tangentes com 4 cliques totais)
  if (state.mode === 'hermite' && state.pendingPoints.length > 0) {
    const points = state.pendingPoints;
    if (points.length === 1) {
      // Mostrar ponto P0
      drawPixelCross(plot, points[0].x, points[0].y, palette.rubber);
    } else if (points.length === 2) {
      // Mostrar P0, P1 e linha entre eles
      drawLineBresenham(plot, points[0].x, points[0].y, points[1].x, points[1].y, palette.rubber);
      drawPixelCross(plot, points[0].x, points[0].y, palette.rubber);
      drawPixelCross(plot, points[1].x, points[1].y, palette.rubber);
    } else if (points.length === 3) {
      // Mostrar P0, P1 e tangente inicial T0
      drawLineBresenham(plot, points[0].x, points[0].y, points[1].x, points[1].y, palette.rubber);
      drawLineBresenham(plot, points[0].x, points[0].y, points[2].x, points[2].y, palette.rubber);
      drawPixelCross(plot, points[0].x, points[0].y, palette.rubber);
      drawPixelCross(plot, points[1].x, points[1].y, palette.rubber);
      drawPixelCross(plot, points[2].x, points[2].y, palette.rubber);
    }
  }

  if (state.mode === 'select' && state.selectDrag) {
    const d = state.selectDrag;
    drawRectOutlineBresenham(
      plot,
      Math.floor(Math.min(d.x0, d.x1)),
      Math.floor(Math.min(d.y0, d.y1)),
      Math.floor(Math.max(d.x0, d.x1)),
      Math.floor(Math.max(d.y0, d.y1)),
      palette.selectionRect
    );
  }

  drawSelectionHighlights(plot, state);

  for (const f of state.clickFlashes) {
    drawPixelCross(plot, f.x, f.y, palette.clickFlash);
  }
  decayClickFlashes(state);

  updateHud(state);
}
