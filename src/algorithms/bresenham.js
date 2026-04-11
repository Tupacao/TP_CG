/**
 * Bresenham — segmento de reta (todos os octantes).
 * Decisão incremental com variável de erro inteira.
 * @param {(x: number, y: number, color: string) => void} plot
 */
export function drawLineBresenham(plot, x1, y1, x2, y2, color) {
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  x2 = Math.round(x2);
  y2 = Math.round(y2);

  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1;
  let y = y1;
  while (true) {
    plot(x, y, color);
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Contorno de retângulo alinhado aos eixos (4 chamadas a Bresenham).
 * @param {(x: number, y: number, color: string) => void} plot
 */
export function drawRectOutlineBresenham(plot, xmin, ymin, xmax, ymax, color) {
  drawLineBresenham(plot, xmin, ymin, xmax, ymin, color);
  drawLineBresenham(plot, xmax, ymin, xmax, ymax, color);
  drawLineBresenham(plot, xmax, ymax, xmin, ymax, color);
  drawLineBresenham(plot, xmin, ymax, xmin, ymin, color);
}

/**
 * Cruz curta centrada em (x,y) — feedback de clique (rasterização trivial).
 * @param {(x: number, y: number, color: string) => void} plot
 */
export function drawPixelCross(plot, x, y, color) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  for (let d = -2; d <= 2; d++) {
    plot(xi + d, yi, color);
    plot(xi, yi + d, color);
  }
}
