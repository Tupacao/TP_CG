/**
 * Curva de Bézier Cúbica — rasterização através de amostragem paramétrica.
 * 
 * Utiliza 4 pontos de controle (P0, P1, P2, P3).
 * A curva é parametrizada por t ∈ [0, 1].
 * 
 * Equação de Bézier Cúbica:
 *   B(t) = (1-t)³·P0 + 3(1-t)²·t·P1 + 3(1-t)·t²·P2 + t³·P3
 * 
 * Implementação:
 * - Amostra a curva em n_samples pontos
 * - Liga pontos consecutivos com reta (Bresenham)
 * - Resolve por força bruta para simplificar
 */

/**
 * Calcula um ponto na curva de Bézier para um valor de t.
 * @param {{x: number, y: number}} P0
 * @param {{x: number, y: number}} P1
 * @param {{x: number, y: number}} P2
 * @param {{x: number, y: number}} P3
 * @param {number} t Parâmetro [0, 1]
 * @returns {{x: number, y: number}}
 */
export function evaluateBezier(P0, P1, P2, P3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  // Pesos Bernstein para n=3 (grau 3)
  const w0 = mt3;                    // (1-t)³
  const w1 = 3 * mt2 * t;             // 3(1-t)²t
  const w2 = 3 * mt * t2;             // 3(1-t)t²
  const w3 = t3;                      // t³

  return {
    x: w0 * P0.x + w1 * P1.x + w2 * P2.x + w3 * P3.x,
    y: w0 * P0.y + w1 * P1.y + w2 * P2.y + w3 * P3.y,
  };
}

/**
 * Desenha uma curva de Bézier cúbica usando amostragem e rasterização.
 * 
 * @param {(x: number, y: number, color: string) => void} plot Função de desenho de pixel
 * @param {number} x0 Coordenada X do 1º ponto de controle (P0)
 * @param {number} y0 Coordenada Y do 1º ponto de controle (P0)
 * @param {number} x1 Coordenada X do 2º ponto de controle (P1)
 * @param {number} y1 Coordenada Y do 2º ponto de controle (P1)
 * @param {number} x2 Coordenada X do 3º ponto de controle (P2)
 * @param {number} y2 Coordenada Y do 3º ponto de controle (P2)
 * @param {number} x3 Coordenada X do 4º ponto de controle (P3)
 * @param {number} y3 Coordenada Y do 4º ponto de controle (P3)
 * @param {string} color Cor da curva (ex: '#ffffff')
 * @param {number} [samples=100] Número de amostras da curva (maior = suavidade)
 */
export function drawBezierCurve(plot, x0, y0, x1, y1, x2, y2, x3, y3, color, samples = 100) {
  const P0 = { x: x0, y: y0 };
  const P1 = { x: x1, y: y1 };
  const P2 = { x: x2, y: y2 };
  const P3 = { x: x3, y: y3 };

  let prevPoint = P0;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const currentPoint = evaluateBezier(P0, P1, P2, P3, t);

    // Liga o ponto anterior ao atual com uma reta
    drawLineBresenhamInternal(plot, prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y, color);

    prevPoint = currentPoint;
  }
}

/**
 * Versão simplificada de Bresenham para desenhar segmento dentro de drawBezierCurve.
 * Implementação inline para evitar importação circular.
 * 
 * @param {(x: number, y: number, color: string) => void} plot
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} color
 */
function drawLineBresenhamInternal(plot, x1, y1, x2, y2, color) {
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
 * Desenha os pontos de controle e linhas de conexão (para visualização educativa).
 * 
 * @param {(x: number, y: number, color: string) => void} plot
 * @param {number} x0 Coordenada X do 1º ponto de controle (P0)
 * @param {number} y0 Coordenada Y do 1º ponto de controle (P0)
 * @param {number} x1 Coordenada X do 2º ponto de controle (P1)
 * @param {number} y1 Coordenada Y do 2º ponto de controle (P1)
 * @param {number} x2 Coordenada X do 3º ponto de controle (P2)
 * @param {number} y2 Coordenada Y do 3º ponto de controle (P2)
 * @param {number} x3 Coordenada X do 4º ponto de controle (P3)
 * @param {number} y3 Coordenada Y do 4º ponto de controle (P3)
 * @param {string} color Cor do polígono de controle
 */
export function drawBezierControlHull(plot, x0, y0, x1, y1, x2, y2, x3, y3, color) {
  // Linhas de controle
  drawLineBresenhamInternal(plot, x0, y0, x1, y1, color);
  drawLineBresenhamInternal(plot, x1, y1, x2, y2, color);
  drawLineBresenhamInternal(plot, x2, y2, x3, y3, color);

  // Pontos de controle (pequenas cruzes)
  const drawSmallCross = (x, y) => {
    plot(x, y, color);
    plot(x + 1, y, color);
    plot(x - 1, y, color);
    plot(x, y + 1, color);
    plot(x, y - 1, color);
  };
  drawSmallCross(x0, y0);
  drawSmallCross(x1, y1);
  drawSmallCross(x2, y2);
  drawSmallCross(x3, y3);
}
