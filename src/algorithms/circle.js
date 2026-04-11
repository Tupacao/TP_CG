/**
 * Circunferência — algoritmo de Bresenham com simetria em 8 octantes.
 * @param {(x: number, y: number, color: string) => void} plot
 */
export function drawCircleBresenham(plot, xc, yc, r, color) {
  xc = Math.round(xc);
  yc = Math.round(yc);
  r = Math.round(r);
  if (r <= 0) {
    plot(xc, yc, color);
    return;
  }

  let x = 0;
  let y = r;
  let d = 3 - 2 * r;

  function plot8(cx, cy, px, py) {
    plot(cx + px, cy + py, color);
    plot(cx - px, cy + py, color);
    plot(cx + px, cy - py, color);
    plot(cx - px, cy - py, color);
    plot(cx + py, cy + px, color);
    plot(cx - py, cy + px, color);
    plot(cx + py, cy - px, color);
    plot(cx - py, cy - px, color);
  }

  while (x <= y) {
    plot8(xc, yc, x, y);
    if (d < 0) {
      d += 4 * x + 6;
    } else {
      d += 4 * (x - y) + 10;
      y--;
    }
    x++;
  }
}
