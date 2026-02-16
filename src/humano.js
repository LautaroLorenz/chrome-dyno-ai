/**
 * Modo humano: loop del juego, tecla Space para saltar.
 */
import { createInitialState, updateState } from "./gameState.js";
import { setCanvasSize, render } from "./render.js";

export function runHumanoGame(canvas) {
  setCanvasSize(canvas);
  let state = createInitialState();
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

  function restart() {
    if (rafId != null) cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    state = createInitialState();
    pendingJump = false;
    window.addEventListener("keydown", onKeyDown);
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  return {
    stop() {
      window.removeEventListener("keydown", onKeyDown);
      if (rafId != null) cancelAnimationFrame(rafId);
    },
    restart,
  };
}
