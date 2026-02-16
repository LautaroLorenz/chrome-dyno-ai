import { canvas, ctx } from "./config.js";
import { player, updatePlayer, drawPlayer, resetPlayer } from "./player.js";
import {
  updateObstacles,
  drawObstacles,
  checkCollision,
  resetObstacles,
} from "./obstacles.js";

let gameOver = false;

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
  resetPlayer();
  resetObstacles();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    updatePlayer();
    updateObstacles();
    if (checkCollision()) {
      gameOver = true;
    }
  }

  drawPlayer();
  drawObstacles();

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
      "Espacio para reiniciar",
      canvas.width / 2,
      canvas.height / 2 + 50,
    );
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
