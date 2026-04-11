/**
 * =============================================================================
 * SISTEMA GRÁFICO ACADÊMICO — Canvas 800×600, pixel a pixel (fillRect 1×1)
 * =============================================================================
 * Estruturas:
 *   Ponto:        { x, y }
 *   Reta:         { x1, y1, x2, y2 } (armazenada nos objetos tipo 'line')
 *   Circunferência: { xc, yc, r } (tipo 'circle')
 *   Lista de objetos: state.objects
 *   Selecionados:     state.selectedIds (Set em runtime, array ao exportar)
 *
 * Renderização: render() redesenha toda a cena chamando apenas putPixel().
 *
 * Alterações recentes (manutenção):
 * - Reflexões em relação ao CENTRO do canvas (evita jogar primitivas para fora).
 * - Rotação não altera circunferências (invariância geométrica).
 * - Feedback visual de clique (cruz curta em vermelho, some após poucos renders).
 * - Objetos selecionados desenhados com cor distinta + contorno de bbox.
 * =============================================================================
 */

(function () {
  'use strict';

  const CANVAS_W = 800;
  const CANVAS_H = 600;

  /** Centro geométrico do canvas — usado nas reflexões (eixos “passando” pelo meio da tela). */
  const CENTER_X = CANVAS_W / 2;
  const CENTER_Y = CANVAS_H / 2;

  /** @type {CanvasRenderingContext2D} */
  let ctx;

  // ---------------------------------------------------------------------------
  // Estruturas e estado global
  // ---------------------------------------------------------------------------

  let nextId = 1;

  const state = {
    mode: 'select', // select | dda | bresenham | circle | clip_cs | clip_lb
    objects: /** @type {Array<LineObj|CircleObj>} */ ([]),
    selectedIds: /** @type {Set<number>} */ (new Set()),

    /** Primeiro clique / estado temporário para primitivas */
    pendingPoint: null, // { x, y } ou null

    /** Retângulo de seleção em arraste */
    selectDrag: null, // { x0, y0, x1, y1 } em coords de canvas

    /** Posição atual do mouse (para rubber-band e HUD) */
    mouse: { x: 0, y: 0, inside: false },

    /** Último recorte: cópia das retas antes do recorte (para visualização) */
    preClipSnapshot: null, // { lines: Array<{x1,y1,x2,y2}> } | null

    /** Janela de recorte normalizada (após definir com 2 cliques) */
    clipWindow: null, // { xmin, ymin, xmax, ymax } | null

    /**
     * Feedback visual de clique: cada entrada desenha uma marca por `ttl` chamadas a render().
     * Decrementamos ao fim de render() para a marca “sumir” após poucos frames (mousemove típico).
     */
    clickFlashes: /** @type {Array<{ x: number; y: number; ttl: number }>} */ ([]),
  };

  const COLORS = {
    bg: '#0b0f14',
    fg: '#e2e8f0',
    gridHint: '#1e293b',
    rubber: '#64748b',
    selectionRect: '#38bdf8',
    selectedHull: '#fbbf24',
    preClip: '#475569',
    clipFrame: '#a78bfa',
    /** Primitivas selecionadas — cor distinta do traço normal */
    selectedFg: '#22d3ee',
    /** Marca de clique (cruz curta) */
    clickFlash: '#f87171',
  };

  /**
   * @typedef {{ x: number, y: number }} Point
   * @typedef {{ id: number, type: 'line', x1: number, y1: number, x2: number, y2: number }} LineObj
   * @typedef {{ id: number, type: 'circle', xc: number, yc: number, r: number }} CircleObj
   */

  // ---------------------------------------------------------------------------
  // Utilitários de pixel (ÚNICO desenho permitido: fillRect 1×1)
  // ---------------------------------------------------------------------------

  /**
   * Acende um pixel na grade inteira. Clampa limites do canvas.
   * @param {number} x
   * @param {number} y
   * @param {string} fillStyle
   */
  function putPixel(x, y, fillStyle) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || yi < 0 || xi >= CANVAS_W || yi >= CANVAS_H) return;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(xi, yi, 1, 1);
  }

  function clearCanvas(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /**
   * Marca visual no pixel clicado (cruz 5×5) — didático para apresentação.
   * Usa apenas putPixel (internamente fillRect 1×1).
   */
  function drawClickMarker(x, y) {
    const c = COLORS.clickFlash;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    for (let d = -2; d <= 2; d++) {
      putPixel(xi + d, yi, c);
      putPixel(xi, yi + d, c);
    }
  }

  function addClickFlash(x, y) {
    state.clickFlashes.push({ x, y, ttl: 2 });
  }

  function logAction(msg, extra) {
    if (extra !== undefined) {
      console.log('[CG]', msg, extra);
    } else {
      console.log('[CG]', msg);
    }
  }

  // ---------------------------------------------------------------------------
  // 1) DDA — Digital Differential Analyzer
  // ---------------------------------------------------------------------------
  /**
   * Ideia: parametrizar a reta r(t) = p1 + t·(p2-p1), t ∈ [0,1].
   * Passo: quantos pixels cobrir? steps = max(|Δx|, |Δy|) (evita buracos).
   * Em cada passo incrementamos x e y pelos diferentesiais (Δx/steps, Δy/steps)
   * e arredondamos para o pixel mais próximo (Math.round).
   */
  function drawLineDDA(x1, y1, x2, y2, color) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) {
      putPixel(x1, y1, color);
      return;
    }
    dx /= steps;
    dy /= steps;
    let x = x1;
    let y = y1;
    for (let i = 0; i <= steps; i++) {
      putPixel(Math.round(x), Math.round(y), color);
      x += dx;
      y += dy;
    }
  }

  // ---------------------------------------------------------------------------
  // 2) Bresenham — reta (decisão incremental inteira)
  // ---------------------------------------------------------------------------
  /**
   * Trabalhamos no 1º octante (0 ≤ dy ≤ dx) com incrementos em x.
   * Variável de decisão d = 2dy - dx; se d < 0, mantemos y; senão y++.
   * Para outros octantes espelhamos trocando sinais e eixos.
   * Comentários didáticos: evitamos aritmética flutuante; só inteiros.
   */
  function drawLineBresenham(x1, y1, x2, y2, color) {
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    x2 = Math.round(x2);
    y2 = Math.round(y2);

    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;
    while (true) {
      putPixel(x, y, color);
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      // Decisão incremental: priorizamos corrigir o erro na direção dominante
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

  // ---------------------------------------------------------------------------
  // 3) Circunferência — Bresenham com simetria em 8 octantes
  // ---------------------------------------------------------------------------
  /**
   * Partimos do arco no 2º octante (x de 0 a r/√2) e espelhamos:
   * (xc±x, yc±y) e trocas (xc±y, yc±x) geram os 8 pontos simétricos.
   */
  function drawCircleBresenham(xc, yc, r, color) {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r = Math.round(r);
    if (r <= 0) {
      putPixel(xc, yc, color);
      return;
    }

    /**
     * Variante inteira clássica com d = 3 - 2r.
     * A cada iteração: desenhamos o anel simétrico atual (x, y), depois
     * atualizamos (x, y) e d — nunca incrementamos x antes do primeiro plot.
     */
    let x = 0;
    let y = r;
    let d = 3 - 2 * r;

    function plotCirclePoints(cx, cy, px, py) {
      putPixel(cx + px, cy + py, color);
      putPixel(cx - px, cy + py, color);
      putPixel(cx + px, cy - py, color);
      putPixel(cx - px, cy - py, color);
      putPixel(cx + py, cy + px, color);
      putPixel(cx - py, cy + px, color);
      putPixel(cx + py, cy - px, color);
      putPixel(cx - py, cy - px, color);
    }

    while (x <= y) {
      plotCirclePoints(xc, yc, x, y);
      if (d < 0) {
        d += 4 * x + 6;
      } else {
        d += 4 * (x - y) + 10;
        y--;
      }
      x++;
    }
  }

  // ---------------------------------------------------------------------------
  // Primitivas auxiliares (sempre via Bresenham + putPixel)
  // ---------------------------------------------------------------------------

  function drawRectOutlineBresenham(xmin, ymin, xmax, ymax, color) {
    drawLineBresenham(xmin, ymin, xmax, ymin, color);
    drawLineBresenham(xmax, ymin, xmax, ymax, color);
    drawLineBresenham(xmax, ymax, xmin, ymax, color);
    drawLineBresenham(xmin, ymax, xmin, ymin, color);
  }

  // ---------------------------------------------------------------------------
  // Bounding boxes e interseção (seleção retangular)
  // ---------------------------------------------------------------------------

  function bboxLine(o) {
    return {
      xmin: Math.min(o.x1, o.x2),
      ymin: Math.min(o.y1, o.y2),
      xmax: Math.max(o.x1, o.x2),
      ymax: Math.max(o.y1, o.y2),
    };
  }

  function bboxCircle(o) {
    return {
      xmin: o.xc - o.r,
      ymin: o.yc - o.r,
      xmax: o.xc + o.r,
      ymax: o.yc + o.r,
    };
  }

  function aabbIntersects(a, b) {
    return !(a.xmax < b.xmin || a.xmin > b.xmax || a.ymax < b.ymin || a.ymin > b.ymax);
  }

  // ---------------------------------------------------------------------------
  // 4) Transformações geométricas (aplicadas aos selecionados)
  // ---------------------------------------------------------------------------

  function objectCenter(o) {
    if (o.type === 'line') {
      return { x: (o.x1 + o.x2) / 2, y: (o.y1 + o.y2) / 2 };
    }
    return { x: o.xc, y: o.yc };
  }
  
  function rotatePointAround(p, cx, cy, deg) {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x = p.x - cx;
    const y = p.y - cy;
    return {
      x: cx + x * cos - y * sin,
      y: cy + x * sin + y * cos,
    };
  }

  function scalePointAround(p, cx, cy, sx, sy) {
    return {
      x: cx + (p.x - cx) * sx,
      y: cy + (p.y - cy) * sy,
    };
  }

  /**
   * Reflexão “eixo X” em relação à reta horizontal que passa pelo CENTRO do canvas.
   * Mantém x; inverte a distância vertical ao meio: y' = CENTER_Y - (y - CENTER_Y).
   */
  function reflectCanvasX(x, y) {
    return { x, y: CENTER_Y - (y - CENTER_Y) };
  }

  /**
   * Reflexão “eixo Y” em relação à reta vertical pelo centro: x' = CENTER_X - (x - CENTER_X).
   */
  function reflectCanvasY(x, y) {
    return { x: CENTER_X - (x - CENTER_X), y };
  }

  /**
   * Reflexão na diagonal de declive 1 passando pelo centro (análoga a y=x deslocada):
   * transladar o centro à origem, trocar (x,y)↔(y,x), transladar de volta.
   * x' = CENTER_X + (y - CENTER_Y), y' = CENTER_Y + (x - CENTER_X).
   */
  function reflectCanvasXY(x, y) {
    return {
      x: CENTER_X + (y - CENTER_Y),
      y: CENTER_Y + (x - CENTER_X),
    };
  }

  function applyTranslation(dx, dy) {
    if (state.selectedIds.size === 0) {
      logAction('Translação ignorada: nenhum objeto selecionado.');
      return;
    }
    for (const o of state.objects) {
      if (!state.selectedIds.has(o.id)) continue;
      if (o.type === 'line') {
        o.x1 += dx;
        o.y1 += dy;
        o.x2 += dx;
        o.y2 += dy;
      } else if (o.type === 'circle') {
        o.xc += dx;
        o.yc += dy;
      }
    }
    logAction('Translação aplicada aos selecionados.', { dx, dy });
  }

  function applyRotation(deg) {
    if (state.selectedIds.size === 0) {
      logAction('Rotação ignorada: nenhum objeto selecionado.');
      return;
    }
    for (const o of state.objects) {
      if (!state.selectedIds.has(o.id)) continue;
      const c = objectCenter(o);
      if (o.type === 'line') {
        const p1 = rotatePointAround({ x: o.x1, y: o.y1 }, c.x, c.y, deg);
        const p2 = rotatePointAround({ x: o.x2, y: o.y2 }, c.x, c.y, deg);
        o.x1 = p1.x;
        o.y1 = p1.y;
        o.x2 = p2.x;
        o.y2 = p2.y;
      } else if (o.type === 'circle') {
        // Circunferências são invariantes à rotação em torno do próprio centro:
        // o conjunto de pontos à distância r de (xc, yc) não muda ao girar o plano
        // em torno desse centro. Mantemos xc, yc e r intocados.
        continue;
      }
    }
    logAction('Rotação aplicada (graus, em torno do centro de cada objeto; círculos ignorados).', { deg });
  }

  function applyScale(sx, sy) {
    if (state.selectedIds.size === 0) {
      logAction('Escala ignorada: nenhum objeto selecionado.');
      return;
    }
    for (const o of state.objects) {
      if (!state.selectedIds.has(o.id)) continue;
      const c = objectCenter(o);
      if (o.type === 'line') {
        const p1 = scalePointAround({ x: o.x1, y: o.y1 }, c.x, c.y, sx, sy);
        const p2 = scalePointAround({ x: o.x2, y: o.y2 }, c.x, c.y, sx, sy);
        o.x1 = p1.x;
        o.y1 = p1.y;
        o.x2 = p2.x;
        o.y2 = p2.y;
      } else if (o.type === 'circle') {
        const pc = scalePointAround({ x: o.xc, y: o.yc }, c.x, c.y, sx, sy);
        o.xc = pc.x;
        o.yc = pc.y;
        const factor = (Math.abs(sx) + Math.abs(sy)) / 2;
        o.r = Math.max(1, o.r * factor);
      }
    }
    logAction('Escala aplicada em torno do centro de cada objeto.', { sx, sy });
  }

  function applyReflection(kind) {
    if (state.selectedIds.size === 0) {
      logAction('Reflexão ignorada: nenhum objeto selecionado.');
      return;
    }
    let fn;
    let name = '';
    if (kind === 'X') {
      fn = reflectCanvasX;
      name = 'reta horizontal y=' + CENTER_Y + ' (centro do canvas)';
    } else if (kind === 'Y') {
      fn = reflectCanvasY;
      name = 'reta vertical x=' + CENTER_X + ' (centro do canvas)';
    } else {
      fn = reflectCanvasXY;
      name = 'diagonal pelo centro (troca relativa ao centro)';
    }
    for (const o of state.objects) {
      if (!state.selectedIds.has(o.id)) continue;
      if (o.type === 'line') {
        const p1 = fn(o.x1, o.y1);
        const p2 = fn(o.x2, o.y2);
        o.x1 = p1.x;
        o.y1 = p1.y;
        o.x2 = p2.x;
        o.y2 = p2.y;
      } else if (o.type === 'circle') {
        const pc = fn(o.xc, o.yc);
        o.xc = pc.x;
        o.yc = pc.y;
      }
    }
    logAction('Reflexão aplicada em relação ao centro do canvas: ' + name);
  }

  // ---------------------------------------------------------------------------
  // 5) Cohen–Sutherland — códigos de região (outcodes) e recorte de retas
  // ---------------------------------------------------------------------------

  const CS_INSIDE = 0;
  const CS_LEFT = 1;
  const CS_RIGHT = 2;
  const CS_BOTTOM = 4;
  const CS_TOP = 8;

  /**
   * Sistema de coordenadas do canvas: y cresce para baixo.
   * TOP: acima da janela (y < ymin), BOTTOM: abaixo (y > ymax).
   */
  function computeOutcode(x, y, xmin, ymin, xmax, ymax) {
    let code = CS_INSIDE;
    if (x < xmin) code |= CS_LEFT;
    else if (x > xmax) code |= CS_RIGHT;
    if (y < ymin) code |= CS_TOP;
    else if (y > ymax) code |= CS_BOTTOM;
    return code;
  }

  /**
   * Retorna { x1,y1,x2,y2 } se houver segmento visível, ou null se totalmente fora.
   */
  function clipLineCohenSutherland(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
    const EPS = 1e-9;
    let outcode0 = computeOutcode(x1, y1, xmin, ymin, xmax, ymax);
    let outcode1 = computeOutcode(x2, y2, xmin, ymin, xmax, ymax);

    while (true) {
      if (!(outcode0 | outcode1)) {
        // Ambos dentro
        return { x1, y1, x2, y2 };
      }
      if (outcode0 & outcode1) {
        // Mesma região exterior trivialmente rejeitável
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

  // ---------------------------------------------------------------------------
  // 6) Liang–Barsky — forma paramétrica P(u)=P0 + u·ΔP, u ∈ [0,1]
  // ---------------------------------------------------------------------------
  /**
   * Limites da janela impõem desigualdades lineares em u.
   * Calculamos u_enter (máximo dos u mínimos) e u_leave (mínimo dos u máximos).
   * Se u_enter ≤ u_leave, o trecho visível é u ∈ [u_enter, u_leave] ∩ [0,1].
   */
  function clipLineLiangBarsky(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let u0 = 0;
    let u1 = 1;

    const p = [-dx, dx, -dy, dy];
    const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];

    for (let k = 0; k < 4; k++) {
      if (p[k] === 0) {
        if (q[k] < 0) return null; // paralelo e fora
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

  function normalizeClipRect(xa, ya, xb, yb) {
    return {
      xmin: Math.min(xa, xb),
      ymin: Math.min(ya, yb),
      xmax: Math.max(xa, xb),
      ymax: Math.max(ya, yb),
    };
  }

  function snapshotLines() {
    const lines = [];
    for (const o of state.objects) {
      if (o.type === 'line') {
        lines.push({ x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, id: o.id });
      }
    }
    return lines;
  }

  function applyClipping(algorithm) {
    if (!state.clipWindow) {
      logAction('Recorte cancelado: defina a janela com dois cliques no canvas.');
      return;
    }
    const { xmin, ymin, xmax, ymax } = state.clipWindow;
    if (xmax - xmin < 1 || ymax - ymin < 1) {
      logAction('Recorte cancelado: janela muito pequena.');
      return;
    }

    const before = snapshotLines();
    state.preClipSnapshot = { lines: before.map((l) => ({ ...l })) };

    const newObjects = [];
    let clippedCount = 0;
    let removedCount = 0;

    for (const o of state.objects) {
      if (o.type === 'circle') {
        newObjects.push(o);
        continue;
      }
      const clipFn = algorithm === 'cs' ? clipLineCohenSutherland : clipLineLiangBarsky;
      const res = clipFn(o.x1, o.y1, o.x2, o.y2, xmin, ymin, xmax, ymax);
      if (!res) {
        removedCount++;
        continue;
      }
      o.x1 = res.x1;
      o.y1 = res.y1;
      o.x2 = res.x2;
      o.y2 = res.y2;
      newObjects.push(o);
      clippedCount++;
    }

    state.objects = newObjects;
    state.selectedIds.clear();

    logAction('Recorte aplicado (' + (algorithm === 'cs' ? 'Cohen-Sutherland' : 'Liang-Barsky') + ').', {
      antes: before.length,
      depoisSegmentos: clippedCount,
      removidasCompletamente: removedCount,
      janela: state.clipWindow,
    });
    logAction('Compare: snapshot "antes" disponível para desenho cinza (checkbox).');
  }

  // ---------------------------------------------------------------------------
  // Seleção por retângulo
  // ---------------------------------------------------------------------------

  function finalizeSelectionRect(x0, y0, x1, y1) {
    const rSel = {
      xmin: Math.min(x0, x1),
      ymin: Math.min(y0, y1),
      xmax: Math.max(x0, x1),
      ymax: Math.max(y0, y1),
    };
    if (rSel.xmax - rSel.xmin < 2 && rSel.ymax - rSel.ymin < 2) {
      state.selectedIds.clear();
      logAction('Seleção vazia (arraste maior).');
      return;
    }
    state.selectedIds.clear();
    for (const o of state.objects) {
      const bb = o.type === 'line' ? bboxLine(o) : bboxCircle(o);
      if (aabbIntersects(bb, rSel)) {
        state.selectedIds.add(o.id);
      }
    }
    logAction('Seleção retangular aplicada.', {
      retangulo: rSel,
      selecionados: Array.from(state.selectedIds),
    });
  }

  // ---------------------------------------------------------------------------
  // Adicionar primitivas à lista
  // ---------------------------------------------------------------------------

  function addLine(x1, y1, x2, y2, algo) {
    const obj = {
      id: nextId++,
      type: 'line',
      x1,
      y1,
      x2,
      y2,
      algo, // 'dda' | 'bres'
    };
    state.objects.push(obj);
    logAction('Reta adicionada.', { id: obj.id, algo, x1, y1, x2, y2 });
  }

  function addCircle(xc, yc, r) {
    const obj = {
      id: nextId++,
      type: 'circle',
      xc,
      yc,
      r,
    };
    state.objects.push(obj);
    logAction('Circunferência adicionada.', { id: obj.id, xc, yc, r });
  }

  // ---------------------------------------------------------------------------
  // render() — redesenha toda a cena
  // ---------------------------------------------------------------------------

  function drawObject(o) {
    const stroke = state.selectedIds.has(o.id) ? COLORS.selectedFg : COLORS.fg;
    if (o.type === 'line') {
      if (o.algo === 'dda') {
        drawLineDDA(o.x1, o.y1, o.x2, o.y2, stroke);
      } else {
        drawLineBresenham(o.x1, o.y1, o.x2, o.y2, stroke);
      }
    } else if (o.type === 'circle') {
      drawCircleBresenham(o.xc, o.yc, o.r, stroke);
    }
  }

  function drawSelectionHighlights() {
    for (const o of state.objects) {
      if (!state.selectedIds.has(o.id)) continue;
      const bb = o.type === 'line' ? bboxLine(o) : bboxCircle(o);
      drawRectOutlineBresenham(
        Math.floor(bb.xmin),
        Math.floor(bb.ymin),
        Math.floor(bb.xmax),
        Math.floor(bb.ymax),
        COLORS.selectedHull
      );
    }
  }

  function render() {
    clearCanvas(COLORS.bg);

    const showPre = document.getElementById('showPreClip');
    if (showPre && showPre.checked && state.preClipSnapshot) {
      for (const l of state.preClipSnapshot.lines) {
        drawLineBresenham(l.x1, l.y1, l.x2, l.y2, COLORS.preClip);
      }
    }

    for (const o of state.objects) {
      drawObject(o);
    }

    // Janela de recorte definida
    if (state.clipWindow) {
      const w = state.clipWindow;
      drawRectOutlineBresenham(
        Math.floor(w.xmin),
        Math.floor(w.ymin),
        Math.floor(w.xmax),
        Math.floor(w.ymax),
        COLORS.clipFrame
      );
    }

    // Rubber-band: reta em construção
    if (state.pendingPoint && state.mode !== 'select' && state.mode !== 'clip_cs' && state.mode !== 'clip_lb') {
      const p0 = state.pendingPoint;
      if (state.mode === 'circle') {
        const r = Math.hypot(state.mouse.x - p0.x, state.mouse.y - p0.y);
        drawCircleBresenham(p0.x, p0.y, r, COLORS.rubber);
      } else if (state.mode === 'dda') {
        drawLineDDA(p0.x, p0.y, state.mouse.x, state.mouse.y, COLORS.rubber);
      } else if (state.mode === 'bresenham') {
        drawLineBresenham(p0.x, p0.y, state.mouse.x, state.mouse.y, COLORS.rubber);
      }
    }

    // Retângulo de recorte em definição
    if ((state.mode === 'clip_cs' || state.mode === 'clip_lb') && state.pendingPoint) {
      const p0 = state.pendingPoint;
      drawRectOutlineBresenham(
        Math.floor(Math.min(p0.x, state.mouse.x)),
        Math.floor(Math.min(p0.y, state.mouse.y)),
        Math.floor(Math.max(p0.x, state.mouse.x)),
        Math.floor(Math.max(p0.y, state.mouse.y)),
        COLORS.rubber
      );
    }

    // Retângulo de seleção durante arraste
    if (state.mode === 'select' && state.selectDrag) {
      const d = state.selectDrag;
      drawRectOutlineBresenham(
        Math.floor(Math.min(d.x0, d.x1)),
        Math.floor(Math.min(d.y0, d.y1)),
        Math.floor(Math.max(d.x0, d.x1)),
        Math.floor(Math.max(d.y0, d.y1)),
        COLORS.selectionRect
      );
    }

    drawSelectionHighlights();

    // Marcas de clique (somem após ttl renders — ver addClickFlash)
    for (const f of state.clickFlashes) {
      drawClickMarker(f.x, f.y);
    }
    state.clickFlashes = state.clickFlashes
      .map((f) => ({ x: f.x, y: f.y, ttl: f.ttl - 1 }))
      .filter((f) => f.ttl > 0);

    updateHud();
  }

  function updateHud() {
    const modeLabel = document.getElementById('modeLabel');
    const mouseLabel = document.getElementById('mouseLabel');
    const objCount = document.getElementById('objCount');
    const selCount = document.getElementById('selCount');

    const names = {
      select: 'Selecionar',
      dda: 'DDA (2 cliques)',
      bresenham: 'Bresenham reta (2 cliques)',
      circle: 'Circunferência (centro, depois raio)',
      clip_cs: 'Recorte Cohen-Sutherland (2 cliques na janela)',
      clip_lb: 'Recorte Liang-Barsky (2 cliques na janela)',
    };
    if (modeLabel) modeLabel.textContent = names[state.mode] || state.mode;

    if (mouseLabel) {
      if (state.mouse.inside) {
        mouseLabel.textContent = Math.floor(state.mouse.x) + ', ' + Math.floor(state.mouse.y);
      } else {
        mouseLabel.textContent = 'fora do canvas';
      }
    }
    if (objCount) objCount.textContent = String(state.objects.length);
    if (selCount) selCount.textContent = String(state.selectedIds.size);
  }

  // ---------------------------------------------------------------------------
  // reset — estado inicial completo
  // ---------------------------------------------------------------------------

  function reset() {
    state.objects = [];
    state.selectedIds.clear();
    state.pendingPoint = null;
    state.selectDrag = null;
    state.preClipSnapshot = null;
    state.clipWindow = null;
    state.clickFlashes = [];
    nextId = 1;
    logAction('reset(): cena e memória de recorte limpos.');
    render();
  }

  function clearScreen() {
    state.objects = [];
    state.selectedIds.clear();
    state.pendingPoint = null;
    state.selectDrag = null;
    state.preClipSnapshot = null;
    state.clipWindow = null;
    state.clickFlashes = [];
    nextId = 1;
    logAction('Limpar tela: todos os objetos removidos.');
    render();
  }

  // ---------------------------------------------------------------------------
  // Coordenadas do mouse no canvas
  // ---------------------------------------------------------------------------

  function canvasCoords(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  // ---------------------------------------------------------------------------
  // UI: modos e botões
  // ---------------------------------------------------------------------------

  function setMode(mode) {
    if (mode === 'clear') {
      clearScreen();
      return;
    }
    state.mode = mode;
    state.pendingPoint = null;
    state.selectDrag = null;
    state.clickFlashes = [];
    logAction('Modo alterado.', { mode });
    syncModeButtons();
    render();
  }

  function syncModeButtons() {
    document.querySelectorAll('.mode-btn[data-mode]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === state.mode);
    });
  }

  function wireUi() {
    document.querySelectorAll('.mode-btn[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = btn.getAttribute('data-mode');
        setMode(m);
      });
    });

    document.getElementById('resetBtn').addEventListener('click', () => reset());

    const txRange = document.getElementById('txRange');
    const tyRange = document.getElementById('tyRange');
    const rotRange = document.getElementById('rotRange');
    const sxRange = document.getElementById('sxRange');
    const syRange = document.getElementById('syRange');

    const bindSpan = (range, spanId) => {
      const span = document.getElementById(spanId);
      range.addEventListener('input', () => {
        span.textContent = range.value;
      });
    };
    bindSpan(txRange, 'txVal');
    bindSpan(tyRange, 'tyVal');
    bindSpan(rotRange, 'rotVal');
    bindSpan(sxRange, 'sxVal');
    bindSpan(syRange, 'syVal');

    document.getElementById('applyTranslate').addEventListener('click', () => {
      const dx = Number(txRange.value);
      const dy = Number(tyRange.value);
      applyTranslation(dx, dy);
      render();
    });

    document.getElementById('applyRotate').addEventListener('click', () => {
      const deg = Number(rotRange.value);
      applyRotation(deg);
      render();
    });

    document.getElementById('applyScale').addEventListener('click', () => {
      const sx = Number(sxRange.value) / 100;
      const sy = Number(syRange.value) / 100;
      applyScale(sx, sy);
      render();
    });

    document.getElementById('reflectX').addEventListener('click', () => {
      applyReflection('X');
      render();
    });
    document.getElementById('reflectY').addEventListener('click', () => {
      applyReflection('Y');
      render();
    });
    document.getElementById('reflectXY').addEventListener('click', () => {
      applyReflection('XY');
      render();
    });

    document.getElementById('showPreClip').addEventListener('change', () => render());
  }

  // ---------------------------------------------------------------------------
  // Eventos de mouse no canvas
  // ---------------------------------------------------------------------------

  function onMouseDown(e) {
    const canvas = e.target;
    const { x, y } = canvasCoords(canvas, e.clientX, e.clientY);
    if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) return;

    if (state.mode === 'select') {
      state.selectDrag = { x0: x, y0: y, x1: x, y1: y };
      return;
    }

    if (state.mode === 'dda' || state.mode === 'bresenham') {
      addClickFlash(x, y);
      if (!state.pendingPoint) {
        state.pendingPoint = { x, y };
        logAction('Primeiro ponto da reta definido.', state.pendingPoint);
      } else {
        const p0 = state.pendingPoint;
        addLine(p0.x, p0.y, x, y, state.mode === 'dda' ? 'dda' : 'bres');
        state.pendingPoint = null;
      }
      render();
      return;
    }

    if (state.mode === 'circle') {
      addClickFlash(x, y);
      if (!state.pendingPoint) {
        state.pendingPoint = { x, y };
        logAction('Centro da circunferência definido.', state.pendingPoint);
      } else {
        const p0 = state.pendingPoint;
        const r = Math.hypot(x - p0.x, y - p0.y);
        addCircle(p0.x, p0.y, r);
        state.pendingPoint = null;
      }
      render();
      return;
    }

    if (state.mode === 'clip_cs' || state.mode === 'clip_lb') {
      addClickFlash(x, y);
      if (!state.pendingPoint) {
        state.pendingPoint = { x, y };
        logAction('Primeiro canto da janela de recorte.', state.pendingPoint);
      } else {
        const p0 = state.pendingPoint;
        state.clipWindow = normalizeClipRect(p0.x, p0.y, x, y);
        state.pendingPoint = null;
        logAction('Janela de recorte definida.', state.clipWindow);
        applyClipping(state.mode === 'clip_cs' ? 'cs' : 'lb');
      }
      render();
      return;
    }
  }

  function onMouseMove(e) {
    const canvas = e.target;
    const { x, y } = canvasCoords(canvas, e.clientX, e.clientY);
    state.mouse.x = x;
    state.mouse.y = y;
    state.mouse.inside = x >= 0 && y >= 0 && x < CANVAS_W && y < CANVAS_H;

    if (state.mode === 'select' && state.selectDrag && (e.buttons & 1)) {
      state.selectDrag.x1 = x;
      state.selectDrag.y1 = y;
    }
    render();
  }

  function finishSelectDragIfAny(clientX, clientY) {
    if (state.mode !== 'select' || !state.selectDrag) return;
    const canvas = document.getElementById('gfx');
    const { x, y } = canvasCoords(canvas, clientX, clientY);
    const cx = Math.max(0, Math.min(CANVAS_W - 1, x));
    const cy = Math.max(0, Math.min(CANVAS_H - 1, y));
    const d = state.selectDrag;
    d.x1 = cx;
    d.y1 = cy;
    finalizeSelectionRect(d.x0, d.y0, d.x1, d.y1);
    state.selectDrag = null;
    render();
  }

  function onMouseLeave() {
    state.mouse.inside = false;
    render();
  }

  function init() {
    const canvas = document.getElementById('gfx');
    if (!canvas || !canvas.getContext) {
      console.error('Canvas não suportado.');
      return;
    }
    ctx = canvas.getContext('2d');
    wireUi();
    syncModeButtons();

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseup', (e) => finishSelectDragIfAny(e.clientX, e.clientY));

    logAction('Aplicação iniciada. Canvas ' + CANVAS_W + '×' + CANVAS_H + '.');
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
