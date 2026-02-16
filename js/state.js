/**
 * Construcción del estado del juego para la IA.
 * Vector de 7 entradas normalizadas.
 */
import {
  canvas,
  STATE_MAX_OBSTACLE_SIZE,
  STATE_MAX_PLAYER_SIZE,
  STATE_MAX_GAME_SPEED,
  STATE_MAX_JUMP_HEIGHT,
} from "./config.js";
import { player } from "./player.js";
import { getNearestObstacleInFront, obstacleSpeed } from "./obstacles.js";

/**
 * Devuelve el estado del juego normalizado (7 entradas).
 * [0] distancia al inicio del próximo obstáculo (0-1, 1 = lejos o sin obstáculo)
 * [1] tamaño del próximo obstáculo ancho (0-1)
 * [2] tamaño del próximo obstáculo alto (0-1)
 * [3] tamaño del player alto (0-1)
 * [4] tamaño del player ancho (0-1)
 * [5] velocidad del juego (0-1)
 * [6] altura del player respecto al suelo (0-1, 0 = en el suelo)
 * @returns {number[]}
 */
export function getState() {
  const obs = getNearestObstacleInFront();
  const maxDistance = canvas.width;

  let distanceNorm = 1;
  let obstacleWidthNorm = 0;
  let obstacleHeightNorm = 0;

  if (obs) {
    const distance = obs.x - (player.x + player.size);
    distanceNorm = distance > 0 ? Math.min(1, distance / maxDistance) : 0;
    obstacleWidthNorm = Math.min(1, obs.width / STATE_MAX_OBSTACLE_SIZE);
    obstacleHeightNorm = Math.min(1, obs.height / STATE_MAX_OBSTACLE_SIZE);
  }

  const playerHeightNorm = Math.min(1, player.size / STATE_MAX_PLAYER_SIZE);
  const playerWidthNorm = Math.min(1, player.size / STATE_MAX_PLAYER_SIZE);
  const gameSpeedNorm = Math.min(1, obstacleSpeed / STATE_MAX_GAME_SPEED);
  const heightAboveGround = Math.max(0, player.groundY - player.y);
  const playerHeightAboveGroundNorm = Math.min(
    1,
    heightAboveGround / STATE_MAX_JUMP_HEIGHT,
  );

  return [
    distanceNorm,
    obstacleWidthNorm,
    obstacleHeightNorm,
    playerHeightNorm,
    playerWidthNorm,
    gameSpeedNorm,
    playerHeightAboveGroundNorm,
  ];
}
