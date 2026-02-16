/**
 * Dibuja el estado del juego en el canvas.
 */
import * as C from "./constants.js";

export function setCanvasSize(canvas) {
  canvas.width = C.WORLD_WIDTH;
  canvas.height = C.WORLD_HEIGHT;
}

export function render(canvas, state) {
  const ctx = canvas.getContext("2d");
  const w = C.WORLD_WIDTH;
  const h = C.WORLD_HEIGHT;

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#2d2d44";
  ctx.fillRect(0, C.GROUND_Y + C.PLAYER_SIZE, w, h - C.GROUND_Y - C.PLAYER_SIZE);

  const { player, obstacles, score, alive } = state;

  ctx.fillStyle = alive ? "#4ade80" : "#f87171";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  ctx.fillStyle = "#f59e0b";
  for (const obs of obstacles) {
    ctx.fillRect(obs.x, obs.y, obs.size, obs.size);
  }

  ctx.fillStyle = "#e0e0e0";
  ctx.font = "16px system-ui";
  ctx.fillText(`Score: ${Math.floor(score)}`, 10, 24);

  if (!alive) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", w / 2, h / 2 - 10);
    ctx.fillText(`Score: ${Math.floor(score)}`, w / 2, h / 2 + 20);
    ctx.textAlign = "left";
  }
}
