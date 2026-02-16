/**
 * Obstáculos (triángulos).
 * Spawn, movimiento, colisiones y detección del más cercano.
 */
import { canvas, ctx, groundLevel, FPS } from "./config.js";
import { player } from "./player.js";

const obstacles = [];
export const obstacleSpeed = 5;
const spawnIntervalFrames = Math.round((1500 / 1000) * FPS); // 90 frames ≈ 1.5s
let lastSpawnFrame = -spawnIntervalFrames;

function spawnObstacle() {
  const size = 35;
  obstacles.push({
    x: canvas.width,
    y: groundLevel - size,
    width: size,
    height: size,
    scored: false
  });
}

export function updateObstacles(frameCount) {
  if (frameCount - lastSpawnFrame >= spawnIntervalFrames) {
    spawnObstacle();
    lastSpawnFrame = frameCount;
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

export function resetObstacles(frameCount = 0) {
  obstacles.length = 0;
  lastSpawnFrame = frameCount - spawnIntervalFrames;
}

export function getNearestObstacleInFront() {
  let nearest = null;
  for (const obs of obstacles) {
    if (obs.x + obs.width > player.x) {
      if (!nearest || obs.x < nearest.x) nearest = obs;
    }
  }
  return nearest;
}

export function getPointsFromPassedObstacles() {
  let points = 0;
  for (const obs of obstacles) {
    if (!obs.scored && obs.x + obs.width < player.x) {
      obs.scored = true;
      points++;
    }
  }
  return points;
}
