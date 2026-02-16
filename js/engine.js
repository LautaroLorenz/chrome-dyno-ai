/**
 * Motor del juego (lógica pura).
 * step(), resetGame(), render() — sin loop ni input.
 */
import { canvas, ctx, groundLevel, SURVIVAL_SCORE_BONUS } from "./config.js";
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

export function resetGame() {
  gameOver = false;
  score = 0;
  frameCount = 0;
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
  if (!checkCollision()) {
    score += SURVIVAL_SCORE_BONUS;
  }

  let reward = score - prevScore;
  if (checkCollision()) {
    gameOver = true;
    reward = -1;
  }

  return {
    state: getState(),
    reward,
    done: gameOver,
    score,
  };
}

export function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#0f3460";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundLevel);
  ctx.lineTo(canvas.width, groundLevel);
  ctx.stroke();

  drawPlayer();
  drawObstacles();

  ctx.fillStyle = "#eee";
  ctx.font = "24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score.toFixed(2)}`, 20, 35);

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
      `Score: ${score.toFixed(2)} — Espacio para reiniciar`,
      canvas.width / 2,
      canvas.height / 2 + 50
    );
  }
}
