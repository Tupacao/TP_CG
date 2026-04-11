/**
 * Liang–Barsky: recorte paramétrico do segmento [0,1] na janela.
 * Função pura.
 * @returns {{ x1: number, y1: number, x2: number, y2: number } | null}
 */
export function clipLineLiangBarsky(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let u0 = 0;
  let u1 = 1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];

  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return null;
    } else {
      const r = q[k] / p[k];
      if (p[k] < 0) {
        u0 = Math.max(u0, r);
      } else {
        u1 = Math.min(u1, r);
      }
    }
  }

  if (u0 > u1) return null;

  return {
    x1: x1 + u0 * dx,
    y1: y1 + u0 * dy,
    x2: x1 + u1 * dx,
    y2: y1 + u1 * dy,
  };
}
