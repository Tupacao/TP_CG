/**
 * Geometria 2D auxiliar (AABBs, centro de primitivas, retângulo de recorte).
 * Funções puras — sem canvas nem estado da aplicação.
 */

/** @param {{ x1: number, y1: number, x2: number, y2: number }} o */
export function bboxLine(o) {
  return {
    xmin: Math.min(o.x1, o.x2),
    ymin: Math.min(o.y1, o.y2),
    xmax: Math.max(o.x1, o.x2),
    ymax: Math.max(o.y1, o.y2),
  };
}

/** @param {{ xc: number, yc: number, r: number }} o */
export function bboxCircle(o) {
  return {
    xmin: o.xc - o.r,
    ymin: o.yc - o.r,
    xmax: o.xc + o.r,
    ymax: o.yc + o.r,
  };
}

/**
 * Calcula bounding box de uma curva de Bézier cúbica.
 * Usa os 4 pontos de controle como aproximação conservadora.
 * 
 * @param {{ x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number }} o
 */
export function bboxBezier(o) {
  return {
    xmin: Math.min(o.x0, o.x1, o.x2, o.x3),
    ymin: Math.min(o.y0, o.y1, o.y2, o.y3),
    xmax: Math.max(o.x0, o.x1, o.x2, o.x3),
    ymax: Math.max(o.y0, o.y1, o.y2, o.y3),
  };
}

/**
 * Calcula bounding box de uma curva de Hermite cúbica.
 * Usa os 2 pontos de interpolação e projeta as tangentes.
 * 
 * @param {{ x0: number, y0: number, x1: number, y1: number, tx0: number, ty0: number, tx1: number, ty1: number }} o
 */
export function bboxHermite(o) {
  // Pontos da curva
  const points = [o.x0, o.x1, o.y0, o.y1];
  
  // Extremos das tangentes escaladas
  const scale = 0.3;
  const x0_end = o.x0 + o.tx0 * scale;
  const x1_end = o.x1 + o.tx1 * scale;
  const y0_end = o.y0 + o.ty0 * scale;
  const y1_end = o.y1 + o.ty1 * scale;
  
  return {
    xmin: Math.min(o.x0, o.x1, x0_end, x1_end),
    ymin: Math.min(o.y0, o.y1, y0_end, y1_end),
    xmax: Math.max(o.x0, o.x1, x0_end, x1_end),
    ymax: Math.max(o.y0, o.y1, y0_end, y1_end),
  };
}

export function aabbIntersects(a, b) {
  return !(a.xmax < b.xmin || a.xmin > b.xmax || a.ymax < b.ymin || a.ymin > b.ymax);
}

/** @param {{ type: string, x1?: number, y1?: number, x2?: number, y2?: number, xc?: number, yc?: number }} o */
export function objectCenter(o) {
  if (o.type === 'line') {
    return { x: (o.x1 + o.x2) / 2, y: (o.y1 + o.y2) / 2 };
  }
  if (o.type === 'bezier') {
    const bezierO = /** @type {*} */ (o);
    return { x: (bezierO.x0 + bezierO.x3) / 2, y: (bezierO.y0 + bezierO.y3) / 2 };
  }
  if (o.type === 'hermite') {
    const hermiteO = /** @type {*} */ (o);
    return { x: (hermiteO.x0 + hermiteO.x1) / 2, y: (hermiteO.y0 + hermiteO.y1) / 2 };
  }
  return { x: o.xc, y: o.yc };
}

export function normalizeClipRect(xa, ya, xb, yb) {
  return {
    xmin: Math.min(xa, xb),
    ymin: Math.min(ya, yb),
    xmax: Math.max(xa, xb),
    ymax: Math.max(ya, yb),
  };
}
