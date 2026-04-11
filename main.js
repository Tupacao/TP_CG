/**
 * Ponto de entrada da aplicação (ES Module).
 * Inicializa canvas, estado, render, UI e interação.
 */

import { initCanvas, CANVAS_W, CANVAS_H } from './src/core/canvas.js';
import { appState, resetState, clearSceneState } from './src/core/state.js';
import { render } from './src/core/render.js';
import { wireControls, syncModeButtons, resetTransformSliders } from './src/ui/controls.js';
import { attachMouseHandlers } from './src/interaction/mouse.js';
import { clearClickFlashes } from './src/feedback/clickFeedback.js';
import { logAction } from './src/utils/helpers.js';

function requestRender() {
  render(appState);
}

function onReset() {
  resetState(appState);
  resetTransformSliders();
  logAction('reset(): cena, memória de recorte e sliders de transformação limpos.');
  syncModeButtons(appState);
  requestRender();
}

function onClearScreen() {
  clearSceneState(appState);
  logAction('Limpar tela: todos os objetos removidos.');
  syncModeButtons(appState);
  requestRender();
}

/**
 * @param {string} mode
 */
function onModeChange(mode) {
  appState.mode = /** @type {*} */ (mode);
  appState.pendingPoint = null;
  appState.selectDrag = null;
  clearClickFlashes(appState);
  logAction('Modo alterado.', { mode });
  syncModeButtons(appState);
  requestRender();
}

function bootstrap() {
  const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('gfx'));
  if (!canvas) {
    console.error('Elemento #gfx não encontrado.');
    return;
  }

  initCanvas(canvas);

  wireControls({
    state: appState,
    requestRender,
    onReset,
    onClearScreen,
    onModeChange,
  });

  attachMouseHandlers({
    state: appState,
    canvas,
    requestRender,
  });

  syncModeButtons(appState);
  logAction('Aplicação iniciada (módulos ES). Canvas ' + CANVAS_W + '×' + CANVAS_H + '.');
  requestRender();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
