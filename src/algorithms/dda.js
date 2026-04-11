/**
 * DDA — reta pixel a pixel.
 * Função pura: recebe `plot(x, y, cor)` sem acessar estado global.
 *
 * Ideia: r(t) = p1 + t·(p2-p1), steps = max(|Δx|,|Δy|), incrementos fracionários + arredondamento.
 * @param {(x: number, y: number, color: string) => void} plot
 */
export function drawLineDDA(plot, x1, y1, x2, y2, color) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (steps === 0) {
    plot(x1, y1, color);
    return;
  }
  dx /= steps;
  dy /= steps;
  let x = x1;
  let y = y1;
  for (let i = 0; i <= steps; i++) {
    plot(Math.round(x), Math.round(y), color);
    x += dx;
    y += dy;
  }
}
