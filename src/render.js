/**
 * Dibuja el estado del juego en el canvas.
 * Si el canvas tiene tamaño distinto al mundo, se escala el dibujado.
 */
import * as C from "./constants.js";

export function setCanvasSize(canvas, width = C.WORLD_WIDTH, height = C.WORLD_HEIGHT) {
  canvas.width = width;
  canvas.height = height;
}

export function render(canvas, state) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const scaleX = w / C.WORLD_WIDTH;
  const scaleY = h / C.WORLD_HEIGHT;
  const r = (v) => Math.round(v);

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, w, h);

  const groundY = C.GROUND_Y + C.PLAYER_SIZE;
  ctx.fillStyle = "#2d2d44";
  ctx.fillRect(0, r(groundY * scaleY), w, h - r(groundY * scaleY));

  const { player, obstacles, score, alive } = state;

  ctx.fillStyle = alive ? "#4ade80" : "#f87171";
  ctx.fillRect(r(player.x * scaleX), r(player.y * scaleY), r(player.size * scaleX), r(player.size * scaleY));

  ctx.fillStyle = "#f59e0b";
  for (const obs of obstacles) {
    ctx.fillRect(r(obs.x * scaleX), r(obs.y * scaleY), r(obs.width * scaleX), r(obs.height * scaleY));
  }

  const fontSize = Math.max(8, 16 * Math.min(scaleX, scaleY));
  ctx.fillStyle = "#e0e0e0";
  ctx.font = `${fontSize}px system-ui`;
  ctx.fillText(`Score: ${Math.floor(score)}`, 4, fontSize + 4);

  if (!alive) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(12, fontSize * 1.2)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("Game Over", w / 2, h / 2 - 4);
    ctx.fillText(`Score: ${Math.floor(score)}`, w / 2, h / 2 + 12);
    ctx.textAlign = "left";
  }
}

/**
 * Dibuja el mundo compartido: múltiples jugadores y obstáculos en un solo canvas.
 * sharedState: { players: Array<player>, obstacles: Array<obs>, maxDistance: number }
 */
export function renderSharedWorld(canvas, sharedState) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const scaleX = w / C.WORLD_WIDTH;
  const scaleY = h / C.WORLD_HEIGHT;
  const r = (v) => Math.round(v);

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, w, h);

  const groundY = C.GROUND_Y + C.PLAYER_SIZE;
  ctx.fillStyle = "#2d2d44";
  ctx.fillRect(0, r(groundY * scaleY), w, h - r(groundY * scaleY));

  ctx.fillStyle = "#f59e0b";
  for (const obs of sharedState.obstacles) {
    ctx.fillRect(r(obs.x * scaleX), r(obs.y * scaleY), r(obs.width * scaleX), r(obs.height * scaleY));
  }

  ctx.fillStyle = "#4ade80";
  for (const player of sharedState.players) {
    if (player.alive) {
      ctx.fillRect(r(player.x * scaleX), r(player.y * scaleY), r(player.size * scaleX), r(player.size * scaleY));
    }
  }

  const fontSize = Math.max(8, 16 * Math.min(scaleX, scaleY));
  ctx.fillStyle = "#e0e0e0";
  ctx.font = `${fontSize}px system-ui`;
  ctx.fillText(`Score: ${Math.floor(sharedState.maxDistance)}`, 4, fontSize + 4);
}
