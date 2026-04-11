/**
 * Módulo de feedback visual de cliques (marcas temporárias na cena).
 * Não desenha nem acessa canvas — apenas mantém a lista de flashes no estado.
 */

/**
 * @param {ReturnType<import('../core/state.js').createAppState>} state
 * @param {number} x
 * @param {number} y
 * @param {number} [ttl=2] quantidade de chamadas a render() em que a marca permanece visível
 */
export function registerClickFlash(state, x, y, ttl = 2) {
  state.clickFlashes.push({ x, y, ttl });
}

/**
 * Após desenhar as marcas no render, decai o TTL e remove entradas esgotadas.
 * @param {ReturnType<import('../core/state.js').createAppState>} state
 */
export function decayClickFlashes(state) {
  state.clickFlashes = state.clickFlashes
    .map((f) => ({ x: f.x, y: f.y, ttl: f.ttl - 1 }))
    .filter((f) => f.ttl > 0);
}

/**
 * @param {ReturnType<import('../core/state.js').createAppState>} state
 */
export function clearClickFlashes(state) {
  state.clickFlashes = [];
}
