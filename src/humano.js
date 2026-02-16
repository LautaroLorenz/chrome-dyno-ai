/**
 * Modo humano: loop del juego, tecla Space para saltar.
 * Juega en el nivel 1 con obstáculos fijos.
 */
import { createInitialState, updateState } from "./gameState.js";
import { setCanvasSize, render } from "./render.js";
import { getLevel, createLevelRunner } from "./levels/index.js";
import * as C from "./constants.js";

export function runHumanoGame(canvas) {
  setCanvasSize(canvas);
  let state = createInitialState();
  let levelRunner = createLevelRunner(getLevel(1));
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
    const sharedObstacles = levelRunner.advance(C.OBSTACLE_SPEED);
    updateState(state, pendingJump, sharedObstacles);
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
    levelRunner = createLevelRunner(getLevel(1));
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
