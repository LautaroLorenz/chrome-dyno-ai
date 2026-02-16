/**
 * API del entorno para la IA.
 * Re-exporta step, getState y resetGame para entrenamiento con TensorFlow.js.
 *
 * Uso:
 *   import { step, getState, resetGame } from './env.js';
 *   resetGame();
 *   const { state, reward, done, score } = step(action); // action: 0 o 1
 */
export { step, resetGame } from "./game.js";
export { getState } from "./state.js";
