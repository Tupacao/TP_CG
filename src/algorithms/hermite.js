/**
 * Curva de Hermite Cúbica — rasterização através de amostragem paramétrica.
 * 
 * Utiliza 2 pontos de interpolação e 2 tangentes:
 *   - P0: ponto inicial
 *   - P1: ponto final
 *   - T0: vetor tangente inicial
 *   - T1: vetor tangente final
 * 
 * A curva é parametrizada por t ∈ [0, 1].
 * 
 * Funções base de Hermite (polinômios cúbicos):
 *   h1(t) = 2t³ − 3t² + 1
 *   h2(t) = −2t³ + 3t²
 *   h3(t) = t³ − 2t² + t
 *   h4(t) = t³ − t²
 * 
 * Equação interpolada:
 *   H(t) = h1(t)·P0 + h2(t)·P1 + h3(t)·T0 + h4(t)·T1
 * 
 * Nota: As tangentes T0 e T1 normalmente representam a derivada no intervalo [0, 1].
 */

/**
 * Calcula um ponto na curva de Hermite para um valor de t.
 * 
 * @param {{x: number, y: number}} P0 Ponto inicial
 * @param {{x: number, y: number}} P1 Ponto final
 * @param {{x: number, y: number}} T0 Vetor tangente inicial
 * @param {{x: number, y: number}} T1 Vetor tangente final
 * @param {number} t Parâmetro [0, 1]
 * @returns {{x: number, y: number}}
 */
export function evaluateHermite(P0, P1, T0, T1, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  // Funções base de Hermite
  const h1 = 2 * t3 - 3 * t2 + 1;        // 2t³ − 3t² + 1
  const h2 = -2 * t3 + 3 * t2;            // −2t³ + 3t²
  const h3 = t3 - 2 * t2 + t;             // t³ − 2t² + t
  const h4 = t3 - t2;                     // t³ − t²

  return {
    x: h1 * P0.x + h2 * P1.x + h3 * T0.x + h4 * T1.x,
    y: h1 * P0.y + h2 * P1.y + h3 * T0.y + h4 * T1.y,
  };
}

/**
 * Desenha uma curva de Hermite cúbica usando amostragem e rasterização.
 * 
 * @param {(x: number, y: number, color: string) => void} plot Função de desenho de pixel
 * @param {number} x0 Coordenada X do ponto inicial (P0)
 * @param {number} y0 Coordenada Y do ponto inicial (P0)
 * @param {number} x1 Coordenada X do ponto final (P1)
 * @param {number} y1 Coordenada Y do ponto final (P1)
 * @param {number} tx0 Componente X da tangente inicial (T0)
 * @param {number} ty0 Componente Y da tangente inicial (T0)
 * @param {number} tx1 Componente X da tangente final (T1)
 * @param {number} ty1 Componente Y da tangente final (T1)
 * @param {string} color Cor da curva (ex: '#ffffff')
 * @param {number} [samples=100] Número de amostras da curva (maior = suavidade)
 */
export function drawHermiteCurve(plot, x0, y0, x1, y1, tx0, ty0, tx1, ty1, color, samples = 100) {
  const P0 = { x: x0, y: y0 };
  const P1 = { x: x1, y: y1 };
  const T0 = { x: tx0, y: ty0 };
  const T1 = { x: tx1, y: ty1 };

  let prevPoint = P0;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const currentPoint = evaluateHermite(P0, P1, T0, T1, t);

    // Liga o ponto anterior ao atual com uma reta
    drawLineBresenhamInternal(plot, prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y, color);

    prevPoint = currentPoint;
  }
}

/**
 * Versão simplificada de Bresenham para desenhar segmento dentro de drawHermiteCurve.
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
 * Desenha os pontos de interpolação, tangentes e linhas auxiliares (para visualização educativa).
 * 
 * As tangentes são desenhadas como vetores saindo dos pontos P0 e P1.
 * 
 * @param {(x: number, y: number, color: string) => void} plot
 * @param {number} x0 Coordenada X do ponto inicial (P0)
 * @param {number} y0 Coordenada Y do ponto inicial (P0)
 * @param {number} x1 Coordenada X do ponto final (P1)
 * @param {number} y1 Coordenada Y do ponto final (P1)
 * @param {number} tx0 Componente X da tangente inicial (T0)
 * @param {number} ty0 Componente Y da tangente inicial (T0)
 * @param {number} tx1 Componente X da tangente final (T1)
 * @param {number} ty1 Componente Y da tangente final (T1)
 * @param {string} color Cor do polígono auxiliar
 */
export function drawHermiteControlHull(plot, x0, y0, x1, y1, tx0, ty0, tx1, ty1, color) {
  // Escalar as tangentes para visualização (reduzir tamanho se muito grande)
  const scale = 0.3;
  const tx0_scaled = tx0 * scale;
  const ty0_scaled = ty0 * scale;
  const tx1_scaled = tx1 * scale;
  const ty1_scaled = ty1 * scale;

  // Linhas das tangentes (saindo dos pontos de interpolação)
  drawLineBresenhamInternal(plot, x0, y0, x0 + tx0_scaled, y0 + ty0_scaled, color);
  drawLineBresenhamInternal(plot, x1, y1, x1 + tx1_scaled, y1 + ty1_scaled, color);

  // Pontos de interpolação (cruzes pequenas)
  const drawSmallCross = (x, y) => {
    plot(x, y, color);
    plot(x + 1, y, color);
    plot(x - 1, y, color);
    plot(x, y + 1, color);
    plot(x, y - 1, color);
  };
  drawSmallCross(x0, y0);
  drawSmallCross(x1, y1);

  // Pontas das tangentes (marcas pequenas)
  drawSmallCross(x0 + tx0_scaled, y0 + ty0_scaled);
  drawSmallCross(x1 + tx1_scaled, y1 + ty1_scaled);
}
