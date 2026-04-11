/**
 * Ligação dos controles HTML aos comandos da aplicação.
 */

import { translateSelected } from '../transformations/translate.js';
import { rotateSelected } from '../transformations/rotate.js';
import { scaleSelected } from '../transformations/scale.js';
import { reflectSelected } from '../transformations/reflect.js';
import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { logAction } from '../utils/helpers.js';

/**
 * Restaura translação, rotação e escala aos valores iniciais da interface
 * (alinhado ao HTML: Δx/Δy/θ = 0; Sx/Sy = 100 → exibição "1").
 */
export function resetTransformSliders() {
  const pairs = [
    { rangeId: 'txRange', value: 0, spanId: 'txVal', spanText: '0' },
    { rangeId: 'tyRange', value: 0, spanId: 'tyVal', spanText: '0' },
    { rangeId: 'rotRange', value: 0, spanId: 'rotVal', spanText: '0' },
    { rangeId: 'sxRange', value: 100, spanId: 'sxVal', spanText: '1' },
    { rangeId: 'syRange', value: 100, spanId: 'syVal', spanText: '1' },
  ];
  for (const { rangeId, value, spanId, spanText } of pairs) {
    const range = /** @type {HTMLInputElement | null} */ (document.getElementById(rangeId));
    const span = document.getElementById(spanId);
    if (range) range.value = String(value);
    if (span) span.textContent = spanText;
  }
}

/**
 * @param {{
 *   state: ReturnType<import('../core/state.js').createAppState>,
 *   requestRender: () => void,
 *   onReset: () => void,
 *   onClearScreen: () => void,
 *   onModeChange: (mode: string) => void,
 * }} api
 */
export function wireControls(api) {
  const { state, requestRender, onReset, onClearScreen, onModeChange } = api;

  const canvasCenter = { centerX: CANVAS_W / 2, centerY: CANVAS_H / 2 };

  document.querySelectorAll('.mode-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.getAttribute('data-mode');
      if (m === 'clear') {
        onClearScreen();
        return;
      }
      onModeChange(m);
    });
  });

  document.getElementById('resetBtn').addEventListener('click', () => onReset());

  const txRange = /** @type {HTMLInputElement} */ (document.getElementById('txRange'));
  const tyRange = /** @type {HTMLInputElement} */ (document.getElementById('tyRange'));
  const rotRange = /** @type {HTMLInputElement} */ (document.getElementById('rotRange'));
  const sxRange = /** @type {HTMLInputElement} */ (document.getElementById('sxRange'));
  const syRange = /** @type {HTMLInputElement} */ (document.getElementById('syRange'));

  const bindSpan = (range, spanId) => {
    const span = document.getElementById(spanId);
    if (!span || !range) return;
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
    if (state.selectedIds.size === 0) {
      logAction('Translação ignorada: nenhum objeto selecionado.');
      return;
    }
    const dx = Number(txRange.value);
    const dy = Number(tyRange.value);
    translateSelected(state.objects, state.selectedIds, dx, dy);
    logAction('Translação aplicada aos selecionados.', { dx, dy });
    requestRender();
  });

  document.getElementById('applyRotate').addEventListener('click', () => {
    if (state.selectedIds.size === 0) {
      logAction('Rotação ignorada: nenhum objeto selecionado.');
      return;
    }
    const deg = Number(rotRange.value);
    rotateSelected(state.objects, state.selectedIds, deg);
    logAction('Rotação aplicada (graus, em torno do centro de cada objeto; círculos ignorados).', { deg });
    requestRender();
  });

  document.getElementById('applyScale').addEventListener('click', () => {
    if (state.selectedIds.size === 0) {
      logAction('Escala ignorada: nenhum objeto selecionado.');
      return;
    }
    const sx = Number(sxRange.value) / 100;
    const sy = Number(syRange.value) / 100;
    scaleSelected(state.objects, state.selectedIds, sx, sy);
    logAction('Escala aplicada em torno do centro de cada objeto.', { sx, sy });
    requestRender();
  });

  function applyReflect(kind) {
    if (state.selectedIds.size === 0) {
      logAction('Reflexão ignorada: nenhum objeto selecionado.');
      return;
    }
    let name = '';
    if (kind === 'X') name = 'reta horizontal y=' + canvasCenter.centerY;
    else if (kind === 'Y') name = 'reta vertical x=' + canvasCenter.centerX;
    else name = 'diagonal pelo centro';
    reflectSelected(state.objects, state.selectedIds, kind, canvasCenter);
    logAction('Reflexão aplicada em relação ao centro do canvas: ' + name);
    requestRender();
  }

  document.getElementById('reflectX').addEventListener('click', () => applyReflect('X'));
  document.getElementById('reflectY').addEventListener('click', () => applyReflect('Y'));
  document.getElementById('reflectXY').addEventListener('click', () => applyReflect('XY'));

  document.getElementById('showPreClip').addEventListener('change', () => requestRender());
}

/**
 * @param {ReturnType<import('../core/state.js').createAppState>} state
 */
export function syncModeButtons(state) {
  document.querySelectorAll('.mode-btn[data-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === state.mode);
  });
}
