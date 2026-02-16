/**
 * Ejecuta un nivel: avanza obstáculos y genera los siguientes según la definición del nivel.
 */
import * as C from "../constants.js";

/**
 * Crea un runner para un nivel. Mantiene el índice del nivel y los obstáculos actuales.
 * @param {Array} level - Array de { gap, width, height, yOffset }
 * @returns {{ advance: (speed: number) => Array }} advance(speed) devuelve los obstáculos para este frame
 */
export function createLevelRunner(level) {
  let levelIndex = 0;
  let obstacles = [];

  function advance(speed) {
    // Mover obstáculos
    for (const obs of obstacles) {
      obs.x -= speed;
    }
    obstacles = obstacles.filter((obs) => obs.x + obs.width > 0);

    let rightEdge =
      obstacles.length > 0
        ? Math.max(...obstacles.map((o) => o.x + o.width))
        : 0;

    // Generar siguientes obstáculos según el nivel (cuando toca spawnear)
    while (levelIndex < level.length) {
      const def = level[levelIndex];
      const spawnX =
        obstacles.length === 0
          ? C.OBSTACLE_BASE_X
          : rightEdge + def.gap;

      // Solo spawnear si el slot ya llegó (el obstáculo quedaría a la derecha o en pantalla)
      if (obstacles.length > 0 && spawnX > C.WORLD_WIDTH + 80) break;

      const y = C.GROUND_Y - def.yOffset;
      obstacles.push({
        x: spawnX,
        y: Math.round(y),
        width: def.width,
        height: def.height,
      });
      rightEdge = spawnX + def.width;
      levelIndex++;
    }

    return obstacles.map((obs) => ({ ...obs }));
  }

  return { advance };
}
