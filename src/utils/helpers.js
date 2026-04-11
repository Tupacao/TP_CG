/**
 * Helpers gerais: log, snapshot e pipeline de recorte sobre a lista de objetos.
 * Não importa canvas — apenas muta o estado da aplicação passado explicitamente.
 */

import { clipLineCohenSutherland } from '../algorithms/clipping/cohenSutherland.js';
import { clipLineLiangBarsky } from '../algorithms/clipping/liangBarsky.js';

export function logAction(msg, extra) {
  if (extra !== undefined) {
    console.log('[CG]', msg, extra);
  } else {
    console.log('[CG]', msg);
  }
}

/** @param {ReturnType<import('../core/state.js').createAppState>} state */
export function snapshotLinesFromObjects(state) {
  const lines = [];
  for (const o of state.objects) {
    if (o.type === 'line') {
      lines.push({ x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, id: o.id });
    }
  }
  return lines;
}

/**
 * Aplica recorte a todas as retas; círculos permanecem; atualiza preClipSnapshot.
 * @param {ReturnType<import('../core/state.js').createAppState>} state
 * @param {'cs' | 'lb'} algorithm
 */
export function applyClippingToState(state, algorithm) {
  if (!state.clipWindow) {
    logAction('Recorte cancelado: defina a janela com dois cliques no canvas.');
    return;
  }
  const { xmin, ymin, xmax, ymax } = state.clipWindow;
  if (xmax - xmin < 1 || ymax - ymin < 1) {
    logAction('Recorte cancelado: janela muito pequena.');
    return;
  }

  const before = snapshotLinesFromObjects(state);
  state.preClipSnapshot = { lines: before.map((l) => ({ ...l })) };

  const clipFn = algorithm === 'cs' ? clipLineCohenSutherland : clipLineLiangBarsky;
  const newObjects = [];
  let clippedCount = 0;
  let removedCount = 0;

  for (const o of state.objects) {
    if (o.type === 'circle') {
      newObjects.push(o);
      continue;
    }
    const res = clipFn(o.x1, o.y1, o.x2, o.y2, xmin, ymin, xmax, ymax);
    if (!res) {
      removedCount++;
      continue;
    }
    o.x1 = res.x1;
    o.y1 = res.y1;
    o.x2 = res.x2;
    o.y2 = res.y2;
    newObjects.push(o);
    clippedCount++;
  }

  state.objects = newObjects;
  state.selectedIds.clear();

  logAction('Recorte aplicado (' + (algorithm === 'cs' ? 'Cohen-Sutherland' : 'Liang-Barsky') + ').', {
    antes: before.length,
    depoisSegmentos: clippedCount,
    removidasCompletamente: removedCount,
    janela: state.clipWindow,
  });
  logAction('Compare: snapshot "antes" disponível para desenho cinza (checkbox).');
}
