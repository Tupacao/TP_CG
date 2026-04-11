/**
 * Reflexões em relação ao centro do canvas:
 * - X: reta horizontal y = centerY
 * - Y: reta vertical x = centerX
 * - XY: diagonal com declive 1 pelo centro (troca relativa ao centro)
 */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} centerY
 */
export function reflectPointXAboutHorizontal(x, y, centerY) {
  return { x, y: centerY - (y - centerY) };
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} centerX
 */
export function reflectPointYAboutVertical(x, y, centerX) {
  return { x: centerX - (x - centerX), y };
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} centerX
 * @param {number} centerY
 */
export function reflectPointXYDiagonal(x, y, centerX, centerY) {
  return {
    x: centerX + (y - centerY),
    y: centerY + (x - centerX),
  };
}

/**
 * @param {Array<{ id: number, type: string } & Record<string, number>>} objects
 * @param {Set<number>} selectedIds
 * @param {'X'|'Y'|'XY'} kind
 * @param {{ centerX: number, centerY: number }} canvasCenter
 */
export function reflectSelected(objects, selectedIds, kind, canvasCenter) {
  const { centerX, centerY } = canvasCenter;
  let fn;
  if (kind === 'X') {
    fn = (x, y) => reflectPointXAboutHorizontal(x, y, centerY);
  } else if (kind === 'Y') {
    fn = (x, y) => reflectPointYAboutVertical(x, y, centerX);
  } else {
    fn = (x, y) => reflectPointXYDiagonal(x, y, centerX, centerY);
  }

  for (const o of objects) {
    if (!selectedIds.has(o.id)) continue;
    if (o.type === 'line') {
      const p1 = fn(o.x1, o.y1);
      const p2 = fn(o.x2, o.y2);
      o.x1 = p1.x;
      o.y1 = p1.y;
      o.x2 = p2.x;
      o.y2 = p2.y;
    } else if (o.type === 'circle') {
      const pc = fn(o.xc, o.yc);
      o.xc = pc.x;
      o.yc = pc.y;
    }
  }
}
