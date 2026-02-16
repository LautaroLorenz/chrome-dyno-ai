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
  };
}

/**
 * Actualiza el estado un frame. Recibe si el jugador pidió salto (Space).
 * Retorna el mismo objeto state actualizado.
 */
export function updateState(state, playerJumps) {
  if (!state.alive) return state;

  const { player, obstacles, speed } = state;

  if (playerJumps && player.onGround) {
    player.velocityY = C.JUMP_FORCE;
    player.onGround = false;
  }

  player.velocityY += C.GRAVITY;
  player.y += player.velocityY;
  if (player.y >= C.GROUND_Y) {
    player.y = C.GROUND_Y;
    player.velocityY = 0;
    player.onGround = true;
  }

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
    const width =
      C.OBSTACLE_MIN_WIDTH +
      Math.random() * (C.OBSTACLE_MAX_WIDTH - C.OBSTACLE_MIN_WIDTH);
    const height =
      C.OBSTACLE_MIN_HEIGHT +
      Math.random() * (C.OBSTACLE_MAX_HEIGHT - C.OBSTACLE_MIN_HEIGHT);
    const yOffset = Math.random() * C.OBSTACLE_Y_OFFSET_MAX;
    const y = C.GROUND_Y - yOffset;
    state.obstacles.push({
      x: spawnX,
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    });
  }

  for (const obs of state.obstacles) {
    if (collide(player, obs)) {
      state.alive = false;
      break;
    }
  }

  state.score += C.SCORE_PER_FRAME;
  const { dist, nextSize, nextHeight } = getNextObstacleInfo(player, state.obstacles);
  state.distanceToNextObstacle = dist;
  state.nextObstacleSize = nextSize;
  state.nextObstacleHeight = nextHeight;
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
  if (nearest == null) return { dist: null, nextSize: null, nextHeight: null };
  return {
    dist: nearest.x - playerRight,
    nextSize: nearest.width,
    nextHeight: nearest.height,
  };
}
