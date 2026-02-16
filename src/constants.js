/**
 * Constantes del juego: dimensiones, física y velocidad.
 * Todo basado en PLAYER_SIZE (alto y ancho del jugador).
 */
export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 160;

export const PLAYER_SIZE = 24;
export const PLAYER_X = 60;

/** Velocidad horizontal del escenario (obstáculos hacia la izquierda). */
export const OBSTACLE_SPEED = 5;
/** Gravedad y salto: altura del salto = 2×PLAYER_SIZE, largo del salto = 4×PLAYER_SIZE. */
export const GRAVITY = (OBSTACLE_SPEED * OBSTACLE_SPEED) / PLAYER_SIZE;
export const JUMP_FORCE = -3 * OBSTACLE_SPEED;

export const GROUND_Y = WORLD_HEIGHT - PLAYER_SIZE;

/** Obstáculos: ancho y alto = 1× o 2× PLAYER_SIZE. */
export const OBSTACLE_MIN_WIDTH = PLAYER_SIZE;
export const OBSTACLE_MAX_WIDTH = 2 * PLAYER_SIZE;
export const OBSTACLE_MIN_HEIGHT = PLAYER_SIZE;
export const OBSTACLE_MAX_HEIGHT = 2 * PLAYER_SIZE;
/** Distancia al suelo: múltiplo de PLAYER_SIZE (0, 1× o 2×). */
export const OBSTACLE_Y_OFFSET_MAX = 3 * PLAYER_SIZE;
export const OBSTACLE_SPAWN_GAP_MIN = 180;
export const OBSTACLE_SPAWN_GAP_MAX = 280;
export const OBSTACLE_BASE_X = WORLD_WIDTH;

export const SCORE_PER_FRAME = 0.1;
