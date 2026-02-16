/**
 * Configuración global del juego.
 * Canvas, contexto 2D y constantes compartidas.
 */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const groundLevel = canvas.height - 20;
const FPS = 60;

// Constantes para normalización del estado (IA)
const STATE_MAX_VELOCITY = 20;
const STATE_OBSTACLE_HEIGHT_DIVISOR = 50;
const STATE_MAX_OBSTACLE_SIZE = 60;
const STATE_MAX_PLAYER_SIZE = 60;
const STATE_MAX_GAME_SPEED = 15;
const STATE_MAX_JUMP_HEIGHT = 150;

// Puntos por frame sobrevivido
const SURVIVAL_SCORE_BONUS = 0.01;

export {
  canvas,
  ctx,
  groundLevel,
  FPS,
  STATE_MAX_VELOCITY,
  STATE_OBSTACLE_HEIGHT_DIVISOR,
  STATE_MAX_OBSTACLE_SIZE,
  STATE_MAX_PLAYER_SIZE,
  STATE_MAX_GAME_SPEED,
  STATE_MAX_JUMP_HEIGHT,
  SURVIVAL_SCORE_BONUS,
};
