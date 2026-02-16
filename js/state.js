/**
 * Construcción del estado del juego para la IA.
 * Convierte el estado interno en un vector normalizado.
 */
import { canvas, STATE_MAX_VELOCITY, STATE_OBSTACLE_HEIGHT_DIVISOR } from "./config.js";
import { player } from "./player.js";
import { getNearestObstacleInFront } from "./obstacles.js";

/**
 * Devuelve el estado del juego normalizado.
 * [0] distancia al obstáculo (0-1, 1 = lejos o sin obstáculo)
 * [1] altura del obstáculo (0-1)
 * [2] velocidad Y del jugador (-1 a 1)
 * [3] jugador en suelo (0 o 1)
 * @returns {number[]}
 */
export function getState() {
  const obs = getNearestObstacleInFront();
  const maxDistance = canvas.width;

  let distanceNorm = 1;
  let obstacleHeightNorm = 0;

  if (obs) {
    const distance = obs.x - (player.x + player.size);
    distanceNorm = distance > 0 ? Math.min(1, distance / maxDistance) : 0;
    obstacleHeightNorm = Math.min(1, obs.height / STATE_OBSTACLE_HEIGHT_DIVISOR);
  }

  const velocityNorm = Math.max(
    -1,
    Math.min(1, player.velocityY / STATE_MAX_VELOCITY)
  );
  const isGrounded = player.y >= player.groundY ? 1 : 0;

  return [distanceNorm, obstacleHeightNorm, velocityNorm, isGrounded];
}
