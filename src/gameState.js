/**
 * Estado del juego: posición, tamaño, velocidad y distancia al obstáculo.
 * Se actualiza cada frame y se usa para render y, más adelante, para entrenar la IA.
 */
import * as C from "./constants.js";

export function createInitialState() {
  return {
    player: {
      x: C.PLAYER_X,
      y: C.GROUND_Y,
      velocityY: 0,
      size: C.PLAYER_SIZE,
      onGround: true,
    },
    obstacles: [],
    score: 0,
    alive: true,
    /** Velocidad del juego (obstáculos hacia la izquierda). */
    speed: C.OBSTACLE_SPEED,
    /** Distancia del borde derecho del jugador al borde izquierdo del próximo obstáculo. */
    distanceToNextObstacle: null,
    /** Ancho del próximo obstáculo (para IA). */
    nextObstacleSize: null,
    /** Altura del próximo obstáculo (para IA). */
    nextObstacleHeight: null,
    /** Distancia al suelo del próximo obstáculo (para IA). */
    nextObstacleGroundDistance: null,
    /** Tiempo desde el último salto (en frames, para IA). */
    timeSinceLastJump: 0,
  };
}

/**
 * Actualiza el estado un frame. Recibe si el jugador pidió salto (Space).
 * @param {object} state - Estado del juego
 * @param {boolean} playerJumps - Si el jugador quiere saltar
 * @param {Array} sharedObstacles - Obstáculos compartidos (opcional, para modo entrenamiento)
 * @returns {object} El mismo objeto state actualizado
 */
export function updateState(state, playerJumps, sharedObstacles = null) {
  if (!state.alive) return state;

  const { player, obstacles, speed } = state;

  if (playerJumps && player.onGround) {
    player.velocityY = C.JUMP_FORCE;
    player.onGround = false;
    state.timeSinceLastJump = 0;
  } else {
    state.timeSinceLastJump = (state.timeSinceLastJump || 0) + 1;
  }

  player.velocityY += C.GRAVITY;
  player.y += player.velocityY;
  if (player.y >= C.GROUND_Y) {
    player.y = C.GROUND_Y;
    player.velocityY = 0;
    player.onGround = true;
  }

  // Si hay obstáculos compartidos, usarlos; si no, generar propios
  if (sharedObstacles !== null) {
    // Copiar obstáculos compartidos (crear copias para evitar mutaciones)
    state.obstacles = sharedObstacles.map(obs => ({ ...obs }));
  } else {
    // Generar obstáculos propios (modo normal)
    for (const obs of obstacles) {
      obs.x -= speed;
    }
    state.obstacles = obstacles.filter((obs) => obs.x + obs.width > 0);

    const rightmost =
      state.obstacles.length > 0
        ? Math.max(...state.obstacles.map((o) => o.x + o.width))
        : 0;
    const minGap = C.OBSTACLE_SPAWN_GAP_MIN;
    const maxGap = C.OBSTACLE_SPAWN_GAP_MAX;
    const gap = minGap + Math.random() * (maxGap - minGap);
    const shouldSpawn =
      state.obstacles.length === 0 || rightmost < C.WORLD_WIDTH - minGap;
    if (shouldSpawn) {
      const spawnX = state.obstacles.length === 0 ? C.OBSTACLE_BASE_X : rightmost + gap;
      const width = Math.random() < 0.5 ? C.OBSTACLE_MIN_WIDTH : C.OBSTACLE_MAX_WIDTH;
      const height = Math.random() < 0.5 ? C.OBSTACLE_MIN_HEIGHT : C.OBSTACLE_MAX_HEIGHT;
      const yOffsetMultiplier = Math.floor(Math.random() * 3);
      const yOffset = yOffsetMultiplier * C.PLAYER_SIZE;
      const y = C.GROUND_Y - yOffset;
      state.obstacles.push({
        x: spawnX,
        y: Math.round(y),
        width,
        height,
      });
    }
  }

  for (const obs of state.obstacles) {
    if (collide(player, obs)) {
      state.alive = false;
      break;
    }
  }

  state.score += C.SCORE_PER_FRAME;
  const { dist, nextSize, nextHeight, nextGroundDist } = getNextObstacleInfo(player, state.obstacles);
  state.distanceToNextObstacle = dist;
  state.nextObstacleSize = nextSize;
  state.nextObstacleHeight = nextHeight;
  state.nextObstacleGroundDistance = nextGroundDist;
  return state;
}

export function getStateSnapshot(state) {
  return {
    player: { ...state.player },
    obstacles: state.obstacles.map((o) => ({ ...o })),
    score: state.score,
    alive: state.alive,
    speed: state.speed,
    distanceToNextObstacle: state.distanceToNextObstacle,
    nextObstacleSize: state.nextObstacleSize,
    nextObstacleHeight: state.nextObstacleHeight,
    nextObstacleGroundDistance: state.nextObstacleGroundDistance,
    timeSinceLastJump: state.timeSinceLastJump,
  };
}

function collide(player, obstacle) {
  const pr = player.x + player.size;
  const pl = player.x;
  const pb = player.y + player.size;
  const pt = player.y;
  const ol = obstacle.x;
  const or = obstacle.x + obstacle.width;
  const ob = obstacle.y + obstacle.height;
  const ot = obstacle.y;
  return pr > ol && pl < or && pb > ot && pt < ob;
}

function getNextObstacleInfo(player, obstacles) {
  const playerRight = player.x + player.size;
  let nearest = null;
  for (const obs of obstacles) {
    if (obs.x >= playerRight && (nearest == null || obs.x < nearest.x)) {
      nearest = obs;
    }
  }
  if (nearest == null) return { dist: null, nextSize: null, nextHeight: null, nextGroundDist: null };
  return {
    dist: nearest.x - playerRight,
    nextSize: nearest.width,
    nextHeight: nearest.height,
    nextGroundDist: C.GROUND_Y - nearest.y,
  };
}
