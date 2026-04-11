/**
 * Escala em torno do centro de cada objeto selecionado.
 */

import { objectCenter } from '../utils/geometry.js';
import { scalePointAround } from '../utils/math.js';

/**
 * @param {Array<{ id: number, type: string } & Record<string, number>>} objects
 * @param {Set<number>} selectedIds
 * @param {number} sx
 * @param {number} sy
 */
export function scaleSelected(objects, selectedIds, sx, sy) {
  for (const o of objects) {
    if (!selectedIds.has(o.id)) continue;
    const c = objectCenter(o);
    if (o.type === 'line') {
      const p1 = scalePointAround({ x: o.x1, y: o.y1 }, c.x, c.y, sx, sy);
      const p2 = scalePointAround({ x: o.x2, y: o.y2 }, c.x, c.y, sx, sy);
      o.x1 = p1.x;
      o.y1 = p1.y;
      o.x2 = p2.x;
      o.y2 = p2.y;
    } else if (o.type === 'circle') {
      const pc = scalePointAround({ x: o.xc, y: o.yc }, c.x, c.y, sx, sy);
      o.xc = pc.x;
      o.yc = pc.y;
      const factor = (Math.abs(sx) + Math.abs(sy)) / 2;
      o.r = Math.max(1, o.r * factor);
    }
  }
}
