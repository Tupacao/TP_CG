/**
 * Rotação 2D das primitivas selecionadas em torno do centro geométrico de cada uma.
 * Circunferências são invariantes à rotação em torno do próprio centro:
 * o conjunto de pontos à distância r de (xc, yc) não muda — não alteramos xc, yc, r.
 */

import { objectCenter } from '../utils/geometry.js';
import { rotatePointAround } from '../utils/math.js';

/**
 * @param {Array<{ id: number, type: string } & Record<string, number>>} objects
 * @param {Set<number>} selectedIds
 * @param {number} deg graus
 */
export function rotateSelected(objects, selectedIds, deg) {
  for (const o of objects) {
    if (!selectedIds.has(o.id)) continue;
    if (o.type === 'circle') {
      continue;
    }
    const c = objectCenter(o);
    const p1 = rotatePointAround({ x: o.x1, y: o.y1 }, c.x, c.y, deg);
    const p2 = rotatePointAround({ x: o.x2, y: o.y2 }, c.x, c.y, deg);
    o.x1 = p1.x;
    o.y1 = p1.y;
    o.x2 = p2.x;
    o.y2 = p2.y;
  }
}
