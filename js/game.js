/**
 * Entrada para jugar como humano.
 * Loop + input de teclado.
 */
import { step, resetGame, render } from "./engine.js";

let jumpAction = false;
let isGameOver = false;

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (isGameOver) {
      resetGame();
    } else {
      jumpAction = true;
    }
  }
});

function gameLoop() {
  const action = jumpAction ? 1 : 0;
  jumpAction = false;

  const result = step(action);
  isGameOver = result.done;

  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();
