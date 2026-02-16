/**
 * Constantes del juego: dimensiones, física y velocidad.
 * Centralizadas para mantener el estado coherente y reutilizar en IA.
 */
export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 160;

export const PLAYER_SIZE = 24;
export const PLAYER_X = 60;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;

export const GROUND_Y = WORLD_HEIGHT - PLAYER_SIZE;

export const OBSTACLE_SIZE = 28;
export const OBSTACLE_MIN_WIDTH = 20;
export const OBSTACLE_MAX_WIDTH = 40;
export const OBSTACLE_MIN_HEIGHT = 18;
export const OBSTACLE_MAX_HEIGHT = 45;
/** Rango de Y: obstáculos en suelo (GROUND_Y) o flotando hasta GROUND_Y - OBSTACLE_Y_OFFSET_MAX */
export const OBSTACLE_Y_OFFSET_MAX = 80;
export const OBSTACLE_SPEED = 5;
export const OBSTACLE_SPAWN_GAP_MIN = 180;
export const OBSTACLE_SPAWN_GAP_MAX = 280;
export const OBSTACLE_BASE_X = WORLD_WIDTH;

export const SCORE_PER_FRAME = 0.1;
