import { canvas, ctx, groundLevel } from './config.js';
import { player } from './player.js';

const obstacles = [];
const obstacleSpeed = 5;
const obstacleSpawnInterval = 1500;
let lastSpawnTime = 0;

function spawnObstacle() {
  const size = 35;
  obstacles.push({
    x: canvas.width,
    y: groundLevel - size,
    width: size,
    height: size
  });
}

export function updateObstacles() {
  const now = Date.now();
  if (now - lastSpawnTime > obstacleSpawnInterval) {
    spawnObstacle();
    lastSpawnTime = now;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacleSpeed;
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
    }
  }
}

function drawObstacle(obs) {
  ctx.fillStyle = '#0f3460';
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(obs.x + obs.width / 2, obs.y);
  ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
  ctx.lineTo(obs.x, obs.y + obs.height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawObstacles() {
  obstacles.forEach(drawObstacle);
}

export function checkCollision() {
  for (const obs of obstacles) {
    if (
      player.x + player.size > obs.x &&
      player.x < obs.x + obs.width &&
      player.y + player.size > obs.y &&
      player.y < obs.y + obs.height
    ) {
      return true;
    }
  }
  return false;
}

export function resetObstacles() {
  obstacles.length = 0;
  lastSpawnTime = Date.now();
}
