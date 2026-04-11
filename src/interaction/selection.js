/**
 * Seleção retangular por AABB: quais objetos intersectam o retângulo de arraste.
 */

import { bboxLine, bboxCircle, aabbIntersects } from '../utils/geometry.js';
import { logAction } from '../utils/helpers.js';

/**
 * @param {ReturnType<import('../core/state.js').createAppState>} state
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 */
export function finalizeSelectionRect(state, x0, y0, x1, y1) {
  const rSel = {
    xmin: Math.min(x0, x1),
    ymin: Math.min(y0, y1),
    xmax: Math.max(x0, x1),
    ymax: Math.max(y0, y1),
  };
  if (rSel.xmax - rSel.xmin < 2 && rSel.ymax - rSel.ymin < 2) {
    state.selectedIds.clear();
    logAction('Seleção vazia (arraste maior).');
    return;
  }
  state.selectedIds.clear();
  for (const o of state.objects) {
    const bb = o.type === 'line' ? bboxLine(/** @type {*} */ (o)) : bboxCircle(/** @type {*} */ (o));
    if (aabbIntersects(bb, rSel)) {
      state.selectedIds.add(o.id);
    }
  }
  logAction('Seleção retangular aplicada.', {
    retangulo: rSel,
    selecionados: Array.from(state.selectedIds),
  });
}
