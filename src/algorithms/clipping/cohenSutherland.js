/**
 * Cohen–Sutherland: recorte de segmento contra retângulo.
 * Função pura — sem estado, sem canvas.
 */

const CS_INSIDE = 0;
const CS_LEFT = 1;
const CS_RIGHT = 2;
const CS_BOTTOM = 4;
const CS_TOP = 8;

export function computeOutcode(x, y, xmin, ymin, xmax, ymax) {
  let code = CS_INSIDE;
  if (x < xmin) code |= CS_LEFT;
  else if (x > xmax) code |= CS_RIGHT;
  if (y < ymin) code |= CS_TOP;
  else if (y > ymax) code |= CS_BOTTOM;
  return code;
}

/**
 * @returns {{ x1: number, y1: number, x2: number, y2: number } | null}
 */
export function clipLineCohenSutherland(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  const EPS = 1e-9;
  let outcode0 = computeOutcode(x1, y1, xmin, ymin, xmax, ymax);
  let outcode1 = computeOutcode(x2, y2, xmin, ymin, xmax, ymax);

  while (true) {
    if (!(outcode0 | outcode1)) {
      return { x1, y1, x2, y2 };
    }
    if (outcode0 & outcode1) {
      return null;
    }

    const out = outcode0 ? outcode0 : outcode1;
    let x = 0;
    let y = 0;

    if (out & CS_TOP) {
      if (Math.abs(y2 - y1) < EPS) return null;
      x = x1 + ((x2 - x1) * (ymin - y1)) / (y2 - y1);
      y = ymin;
    } else if (out & CS_BOTTOM) {
      if (Math.abs(y2 - y1) < EPS) return null;
      x = x1 + ((x2 - x1) * (ymax - y1)) / (y2 - y1);
      y = ymax;
    } else if (out & CS_RIGHT) {
      if (Math.abs(x2 - x1) < EPS) return null;
      y = y1 + ((y2 - y1) * (xmax - x1)) / (x2 - x1);
      x = xmax;
    } else if (out & CS_LEFT) {
      if (Math.abs(x2 - x1) < EPS) return null;
      y = y1 + ((y2 - y1) * (xmin - x1)) / (x2 - x1);
      x = xmin;
    }

    if (out === outcode0) {
      x1 = x;
      y1 = y;
      outcode0 = computeOutcode(x1, y1, xmin, ymin, xmax, ymax);
    } else {
      x2 = x;
      y2 = y;
      outcode1 = computeOutcode(x2, y2, xmin, ymin, xmax, ymax);
    }
  }
}
