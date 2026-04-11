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

export function aabbIntersects(a, b) {
  return !(a.xmax < b.xmin || a.xmin > b.xmax || a.ymax < b.ymin || a.ymin > b.ymax);
}

/** @param {{ type: string, x1?: number, y1?: number, x2?: number, y2?: number, xc?: number, yc?: number }} o */
export function objectCenter(o) {
  if (o.type === 'line') {
    return { x: (o.x1 + o.x2) / 2, y: (o.y1 + o.y2) / 2 };
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
