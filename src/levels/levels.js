/**
 * Niveles con configuración fija de obstáculos.
 * Cada nivel tiene obstáculos suficientes para ~1000 puntos (10000 frames).
 */
import * as C from "../constants.js";

/** RNG determinista por semilla (Mulberry32) */
function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera la definición de un nivel (array de obstáculos).
 * Cada elemento: { gap, width, height, yOffset }
 * gap = distancia desde el borde derecho del obstáculo anterior (o WORLD_WIDTH para el primero)
 */
function generateLevel(seed, obstacleCount = 220) {
  const rnd = seededRandom(seed);
  const level = [];
  for (let i = 0; i < obstacleCount; i++) {
    const gap =
      i === 0
        ? 0
        : C.OBSTACLE_SPAWN_GAP_MIN +
          rnd() * (C.OBSTACLE_SPAWN_GAP_MAX - C.OBSTACLE_SPAWN_GAP_MIN);
    const width =
      C.OBSTACLE_MIN_WIDTH +
      rnd() * (C.OBSTACLE_MAX_WIDTH - C.OBSTACLE_MIN_WIDTH);
    const height =
      C.OBSTACLE_MIN_HEIGHT +
      rnd() * (C.OBSTACLE_MAX_HEIGHT - C.OBSTACLE_MIN_HEIGHT);
    const yOffset = rnd() * C.OBSTACLE_Y_OFFSET_MAX;
    level.push({
      gap: Math.round(gap),
      width: Math.round(width),
      height: Math.round(height),
      yOffset: Math.round(yOffset),
    });
  }
  return level;
}

/** Nivel 1: configuración fija (semilla 1) */
export const level1 = generateLevel(1);

/** Nivel 2: configuración fija (semilla 2) */
export const level2 = generateLevel(2);

/** Nivel 3: configuración fija (semilla 3) */
export const level3 = generateLevel(3);

export function getLevel(levelNumber) {
  switch (levelNumber) {
    case 1:
      return level1;
    case 2:
      return level2;
    case 3:
      return level3;
    default:
      return level1;
  }
}
