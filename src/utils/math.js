/**
 * Utilitários numéricos elementares.
 */

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Rotação 2D de um ponto em torno de (cx, cy).
 * @param {{ x: number, y: number }} p
 * @param {number} cx
 * @param {number} cy
 * @param {number} deg graus
 */
export function rotatePointAround(p, cx, cy, deg) {
  const rad = degToRad(deg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const x = p.x - cx;
  const y = p.y - cy;
  return {
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos,
  };
}

/**
 * Escala 2D em torno de (cx, cy).
 */
export function scalePointAround(p, cx, cy, sx, sy) {
  return {
    x: cx + (p.x - cx) * sx,
    y: cy + (p.y - cy) * sy,
  };
}
