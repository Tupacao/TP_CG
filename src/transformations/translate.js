/**
 * Translação de primitivas selecionadas.
 * Opera sobre objetos passados no array `objects`, filtrando por `selectedIds`.
 */

/**
 * @param {Array<{ id: number, type: string } & Record<string, number>>} objects
 * @param {Set<number>} selectedIds
 * @param {number} dx
 * @param {number} dy
 */
export function translateSelected(objects, selectedIds, dx, dy) {
  for (const o of objects) {
    if (!selectedIds.has(o.id)) continue;
    if (o.type === 'line') {
      o.x1 += dx;
      o.y1 += dy;
      o.x2 += dx;
      o.y2 += dy;
    } else if (o.type === 'circle') {
      o.xc += dx;
      o.yc += dy;
    }
  }
}
