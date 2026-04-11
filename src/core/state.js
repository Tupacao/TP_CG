/**
 * Estado global centralizado da aplicação.
 * Export controlado: um objeto `appState` mutável e funções que o reinicializam / criam primitivas.
 */

/** Paleta visual (não é estado dinâmico de interação, mas centralizado com a cena). */
export const palette = {
  bg: '#0b0f14',
  fg: '#e2e8f0',
  rubber: '#64748b',
  selectionRect: '#38bdf8',
  selectedHull: '#fbbf24',
  preClip: '#475569',
  clipFrame: '#a78bfa',
  selectedFg: '#22d3ee',
  clickFlash: '#f87171',
};

export function createAppState() {
  return {
    mode: /** @type {'select'|'dda'|'bresenham'|'circle'|'clip_cs'|'clip_lb'} */ ('select'),
    /** @type {Array<{ id: number, type: string } & Record<string, number>>} */
    objects: [],
    /** @type {Set<number>} */
    selectedIds: new Set(),
    pendingPoint: /** @type {{ x: number, y: number } | null} */ (null),
    selectDrag: /** @type {{ x0: number, y0: number, x1: number, y1: number } | null} */ (null),
    mouse: { x: 0, y: 0, inside: false },
    preClipSnapshot: /** @type {{ lines: Array<{ x1: number, y1: number, x2: number, y2: number, id?: number }> } | null} */ (
      null
    ),
    clipWindow: /** @type {{ xmin: number, ymin: number, xmax: number, ymax: number } | null} */ (null),
    /** @type {Array<{ x: number, y: number, ttl: number }>} */
    clickFlashes: [],
    nextId: 1,
  };
}

/** Instância única usada pela aplicação (main.js). */
export const appState = createAppState();

/**
 * @param {ReturnType<typeof createAppState>} state
 */
export function resetState(state) {
  state.objects = [];
  state.selectedIds.clear();
  state.pendingPoint = null;
  state.selectDrag = null;
  state.preClipSnapshot = null;
  state.clipWindow = null;
  state.clickFlashes = [];
  state.nextId = 1;
}

/**
 * @param {ReturnType<typeof createAppState>} state
 */
export function clearSceneState(state) {
  resetState(state);
}

/**
 * @param {ReturnType<typeof createAppState>} state
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {'dda'|'bres'} algo
 */
export function addLineToState(state, x1, y1, x2, y2, algo) {
  const obj = {
    id: state.nextId++,
    type: /** @type {'line'} */ ('line'),
    x1,
    y1,
    x2,
    y2,
    algo,
  };
  state.objects.push(obj);
  return obj;
}

/**
 * @param {ReturnType<typeof createAppState>} state
 */
export function addCircleToState(state, xc, yc, r) {
  const obj = {
    id: state.nextId++,
    type: /** @type {'circle'} */ ('circle'),
    xc,
    yc,
    r,
  };
  state.objects.push(obj);
  return obj;
}
