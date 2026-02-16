/**
 * Motor principal del juego.
 * Orquesta el loop, input, step y render.
 */
import { canvas, ctx } from "./config.js";
import { updatePlayer, drawPlayer, resetPlayer } from "./player.js";
import {
  updateObstacles,
  drawObstacles,
  checkCollision,
  resetObstacles,
  getPointsFromPassedObstacles,
} from "./obstacles.js";
import { getState } from "./state.js";

let gameOver = false;
let score = 0;
let frameCount = 0;
let jumpAction = false;

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (gameOver) {
      resetGame();
    } else {
      jumpAction = true;
    }
  }
});

export function resetGame() {
  gameOver = false;
  score = 0;
  frameCount = 0;
  jumpAction = false;
  resetPlayer();
  resetObstacles(frameCount);
}

/**
 * Avanza un frame. action: 0 = no saltar, 1 = saltar.
 * @returns {{ state: number[], reward: number, done: boolean, score: number }}
 */
export function step(action) {
  if (gameOver) {
    return { state: getState(), reward: 0, done: true, score };
  }

  const prevScore = score;
  updatePlayer(action === 1);
  updateObstacles(frameCount);
  frameCount++;

  score += getPointsFromPassedObstacles();

  let reward = score - prevScore;
  if (checkCollision()) {
    gameOver = true;
    reward = -1;
  } else if (reward === 0) {
    reward = 0.01; // pequeña recompensa por sobrevivir
  }

  return {
    state: getState(),
    reward,
    done: gameOver,
    score,
  };
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  drawObstacles();

  ctx.fillStyle = "#eee";
  ctx.font = "24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 35);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e94560";
    ctx.font = "48px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    ctx.font = "20px system-ui";
    ctx.fillStyle = "#eee";
    ctx.fillText(
      `Score: ${score} — Espacio para reiniciar`,
      canvas.width / 2,
      canvas.height / 2 + 50
    );
  }
}

function gameLoop() {
  const action = jumpAction ? 1 : 0;
  jumpAction = false;

  step(action);
  render();

  requestAnimationFrame(gameLoop);
}

gameLoop();
