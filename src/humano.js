/**
 * Modo humano: loop del juego, tecla Space para saltar.
 */
import { createInitialState, updateState } from "./gameState.js";
import { setCanvasSize, render } from "./render.js";

export function runHumanoGame(canvas) {
  setCanvasSize(canvas);
  const state = createInitialState();
  let pendingJump = false;

  const onKeyDown = (e) => {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      pendingJump = true;
    }
  };
  window.addEventListener("keydown", onKeyDown);

  let rafId;
  function loop() {
    updateState(state, pendingJump);
    pendingJump = false;
    render(canvas, state);
    if (state.alive) {
      rafId = requestAnimationFrame(loop);
    } else {
      window.removeEventListener("keydown", onKeyDown);
    }
  }
  rafId = requestAnimationFrame(loop);

  return function stop() {
    window.removeEventListener("keydown", onKeyDown);
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}
