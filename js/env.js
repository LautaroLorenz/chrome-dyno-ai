/**
 * API del entorno para la IA.
 * Re-exporta step, getState, resetGame y render para entrenamiento.
 * Importa de engine.js (no game.js) para evitar que arranque el loop de juego.
 *
 * Uso:
 *   import { step, getState, resetGame, render } from './env.js';
 *   resetGame();
 *   const { state, reward, done, score } = step(action); // action: 0 o 1
 *   render(); // opcional, para visualizar
 */
export { step, resetGame, render } from "./engine.js";
export { getState } from "./state.js";
