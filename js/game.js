import { canvas, ctx } from "./config.js";
import { player, updatePlayer, drawPlayer, resetPlayer } from "./player.js";
import {
  updateObstacles,
  drawObstacles,
  checkCollision,
  resetObstacles,
  getPointsFromPassedObstacles,
} from "./obstacles.js";

let gameOver = false;
let score = 0;

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (gameOver) {
      resetGame();
    } else if (player.y >= player.groundY) {
      player.velocityY = player.jumpForce;
    }
  }
});

function resetGame() {
  gameOver = false;
  score = 0;
  resetPlayer();
  resetObstacles();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    updatePlayer();
    updateObstacles();
    score += getPointsFromPassedObstacles();
    if (checkCollision()) {
      gameOver = true;
    }
  }

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
      canvas.height / 2 + 50,
    );
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
