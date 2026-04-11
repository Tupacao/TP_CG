/**
 * Atualiza rótulos da barra de status (somente DOM, sem desenho no canvas).
 */

/**
 * @param {ReturnType<import('../core/state.js').createAppState>} state
 */
export function updateHud(state) {
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
