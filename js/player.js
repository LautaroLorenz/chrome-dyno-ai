import { canvas, ctx } from './config.js';

export const player = {
  x: 80,
  y: canvas.height - 60,
  size: 40,
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -14,
  groundY: canvas.height - 60
};

export function updatePlayer() {
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.velocityY = 0;
  }
}

export function drawPlayer() {
  ctx.fillStyle = '#e94560';
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

export function resetPlayer() {
  player.y = player.groundY;
  player.velocityY = 0;
}
