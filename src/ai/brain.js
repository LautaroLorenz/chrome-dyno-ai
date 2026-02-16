/**
 * Red neuronal de 3 capas (entrada, oculta, salida) para controlar al jugador.
 * Cada cerebro tiene configuración aleatoria inicial; se reproducen los mejores con mutación.
 */
import * as C from "../constants.js";
import { getNextObstacleInfo } from "../gameState.js";

const INPUT_SIZE = 7;
const HIDDEN_SIZE = INPUT_SIZE; // Misma cantidad de neuronas que entradas
const OUTPUT_SIZE = 1;

function randomWeight() {
  return (Math.random() - 0.5) * 2;
}

function relu(x) {
  return x > 0 ? x : 0;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/** Crea una matriz de rows x cols con valores aleatorios. */
function randomMatrix(rows, cols) {
  const m = [];
  for (let r = 0; r < rows; r++) {
    m[r] = [];
    for (let c = 0; c < cols; c++) m[r][c] = randomWeight();
  }
  return m;
}

/** Crea un vector de tamaño n con valores aleatorios. */
function randomVector(n) {
  const v = [];
  for (let i = 0; i < n; i++) v[i] = randomWeight();
  return v;
}

/**
 * Crea un cerebro desde un archivo JSON descargado durante el entrenamiento.
 * @param {object} config - { brain: { W1, b1, W2, b2 } }
 * @returns {object} cerebro listo para forward()
 */
export function loadBrainFromConfig(config) {
  if (!config || !config.brain) return null;
  const b = config.brain;
  if (!b.W1 || !b.b1 || !b.W2 || !b.b2) return null;
  let W1 = b.W1.map((row) => row.slice());
  // Migrar modelos antiguos: 8 entradas → quitar columna Velocidad Y (índice 1); <7 → añadir columnas
  if (W1[0]) {
    const currentSize = W1[0].length;
    if (currentSize === 8) {
      // Quitar entrada 2 (Velocidad Y)
      for (let i = 0; i < W1.length; i++) W1[i].splice(1, 1);
    } else if (currentSize === 4) {
      for (let i = 0; i < W1.length; i++) {
        W1[i].push((Math.random() - 0.5) * 2);
        W1[i].push((Math.random() - 0.5) * 2);
        W1[i].push((Math.random() - 0.5) * 2);
      }
    } else if (currentSize === 5) {
      for (let i = 0; i < W1.length; i++) {
        W1[i].push((Math.random() - 0.5) * 2);
        W1[i].push((Math.random() - 0.5) * 2);
      }
    } else if (currentSize === 6) {
      for (let i = 0; i < W1.length; i++) {
        W1[i].push((Math.random() - 0.5) * 2);
      }
    }
  }
  return {
    W1,
    b1: b.b1.slice(),
    W2: b.W2.map((row) => row.slice()),
    b2: b.b2.slice(),
  };
}

/**
 * Crea un cerebro con pesos y bias aleatorios.
 * Estructura: entrada (7) -> oculta (7) -> salida (1).
 */
export function createRandomBrain() {
  return {
    W1: randomMatrix(HIDDEN_SIZE, INPUT_SIZE),
    b1: randomVector(HIDDEN_SIZE),
    W2: randomMatrix(OUTPUT_SIZE, HIDDEN_SIZE),
    b2: randomVector(OUTPUT_SIZE),
  };
}

/**
 * Construye el vector de entrada para la red.
 * Acepta (state) para humano/jugarAi o (player, sharedObstacles) para entrenamiento compartido.
 * [ dist. obstáculo, dist. al suelo player, tam. obstáculo, alt. obstáculo, dist. al suelo obstáculo, tiempo desde último salto, altura máxima alcanzable ]
 */
export function stateToInputs(stateOrPlayer, sharedObstacles) {
  const isShared = Array.isArray(sharedObstacles);
  const player = isShared ? stateOrPlayer : stateOrPlayer.player;
  const dist = isShared
    ? getNextObstacleInfo(player, sharedObstacles).dist
    : stateOrPlayer.distanceToNextObstacle;
  const nextInfo = isShared
    ? getNextObstacleInfo(player, sharedObstacles)
    : {
        nextSize: stateOrPlayer.nextObstacleSize,
        nextHeight: stateOrPlayer.nextObstacleHeight,
        nextGroundDist: stateOrPlayer.nextObstacleGroundDistance,
      };
  const timeSinceLastJump = isShared
    ? stateOrPlayer.timeSinceLastJump || 0
    : stateOrPlayer.timeSinceLastJump || 0;

  const distNorm = dist == null ? 1 : Math.min(1, Math.max(0, dist / 800));
  const rawDist = C.GROUND_Y - player.y;
  const jumpHeightMax = (C.JUMP_FORCE * C.JUMP_FORCE) / (2 * C.GRAVITY);
  const playerGroundDist = Math.min(1, Math.max(0, rawDist / jumpHeightMax));
  const maxObstacleDim = 2 * C.PLAYER_SIZE;
  const nextSize =
    nextInfo.nextSize != null ? nextInfo.nextSize / maxObstacleDim : 0;
  const nextHeight =
    nextInfo.nextHeight != null ? nextInfo.nextHeight / maxObstacleDim : 0;
  const nextGroundDist =
    nextInfo.nextGroundDist != null
      ? Math.min(
          1,
          Math.max(0, nextInfo.nextGroundDist / C.OBSTACLE_Y_OFFSET_MAX),
        )
      : 0;

  const timeSinceJump = Math.min(1, timeSinceLastJump / 300);

  let maxJumpHeight;
  if (player.onGround) {
    maxJumpHeight = (C.JUMP_FORCE * C.JUMP_FORCE) / (2 * C.GRAVITY);
  } else if (player.velocityY < 0) {
    maxJumpHeight = (player.velocityY * player.velocityY) / (2 * C.GRAVITY);
  } else {
    maxJumpHeight = 0;
  }
  const maxJumpHeightNorm = Math.min(
    1,
    Math.max(0, maxJumpHeight / jumpHeightMax),
  );

  return [
    distNorm,
    playerGroundDist,
    nextSize,
    nextHeight,
    nextGroundDist,
    timeSinceJump,
    maxJumpHeightNorm,
  ];
}

/**
 * Forward pass: devuelve valor en [0, 1]. Si > 0.5 la IA decide saltar.
 */
export function forward(brain, inputs) {
  const hidden = [];
  for (let i = 0; i < HIDDEN_SIZE; i++) {
    let sum = brain.b1[i];
    for (let j = 0; j < INPUT_SIZE; j++) sum += brain.W1[i][j] * inputs[j];
    hidden[i] = relu(sum);
  }
  let out = brain.b2[0];
  for (let i = 0; i < HIDDEN_SIZE; i++) out += brain.W2[0][i] * hidden[i];
  return sigmoid(out);
}

/** Copia un cerebro (arrays profundos). */
function cloneBrain(brain) {
  return {
    W1: brain.W1.map((row) => row.slice()),
    b1: brain.b1.slice(),
    W2: brain.W2.map((row) => row.slice()),
    b2: brain.b2.slice(),
  };
}

/** Añade variación aleatoria a un cerebro (mutación). */
function mutateBrain(brain, rate = 0.1, amount = 0.3) {
  const b = cloneBrain(brain);
  for (let i = 0; i < b.W1.length; i++) {
    for (let j = 0; j < b.W1[i].length; j++) {
      if (Math.random() < rate)
        b.W1[i][j] += (Math.random() - 0.5) * 2 * amount;
    }
  }
  for (let i = 0; i < b.b1.length; i++) {
    if (Math.random() < rate) b.b1[i] += (Math.random() - 0.5) * 2 * amount;
  }
  for (let i = 0; i < b.W2.length; i++) {
    for (let j = 0; j < b.W2[i].length; j++) {
      if (Math.random() < rate)
        b.W2[i][j] += (Math.random() - 0.5) * 2 * amount;
    }
  }
  for (let i = 0; i < b.b2.length; i++) {
    if (Math.random() < rate) b.b2[i] += (Math.random() - 0.5) * 2 * amount;
  }
  return b;
}

const NUM_OFFSPRING = 20;
const MUTATE_RATE = 0.1; // 10% - mutación baja
const MUTATE_AMOUNT = 0.2; // ±0.2 - cambio pequeño

/**
 * Genera la siguiente generación: cada cerebro aporta hijos en proporción a su score.
 * A mayor score, más descendientes (copias mutadas).
 * @param {object[]} brains - Array de cerebros de la generación actual
 * @param {number[]} scores - Array de scores correspondientes a cada cerebro
 * @param {number} numOffspring - Número de descendientes a generar (por defecto NUM_OFFSPRING)
 * @returns {object[]} Array de nuevos cerebros para la siguiente generación
 */
export function nextGeneration(brains, scores, numOffspring = NUM_OFFSPRING) {
  if (brains.length === 0 || scores.length === 0) {
    // Si no hay cerebros, crear cerebros aleatorios
    const next = [];
    for (let i = 0; i < numOffspring; i++) {
      next.push(createRandomBrain());
    }
    return next;
  }

  const epsilon = 1e-6;
  const total = scores.reduce((a, b) => a + b, 0) + epsilon;
  const quota = scores.map((s) => ((s + epsilon) / total) * numOffspring);

  const counts = quota.map((q) => Math.floor(q));
  let sum = counts.reduce((a, b) => a + b, 0);
  const remainder = quota
    .map((q, i) => ({ i, frac: q - Math.floor(q) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; sum < numOffspring && k < remainder.length; k++) {
    counts[remainder[k].i] += 1;
    sum += 1;
  }

  const next = [];
  for (let i = 0; i < brains.length; i++) {
    for (let j = 0; j < counts[i]; j++) {
      next.push(mutateBrain(brains[i], MUTATE_RATE, MUTATE_AMOUNT));
    }
  }
  while (next.length > numOffspring) next.pop();
  while (next.length < numOffspring) {
    const best = scores.indexOf(Math.max(...scores));
    if (best >= 0 && brains[best]) {
      next.push(mutateBrain(brains[best], MUTATE_RATE, MUTATE_AMOUNT));
    } else {
      // Fallback: crear cerebro aleatorio si no hay mejor disponible
      next.push(createRandomBrain());
    }
  }
  return next;
}

export const BRAIN_INPUT_SIZE = INPUT_SIZE;
export const BRAIN_HIDDEN_SIZE = HIDDEN_SIZE;

export const INPUT_LABELS = [
  "Dist. al obstáculo (0-1)",
  "Dist. al suelo player (0-1)",
  "Ancho próximo obst. (0-1)",
  "Altura próximo obst. (0-1)",
  "Dist. al suelo próximo obst. (0-1)",
  "Tiempo desde último salto (0-1)",
  "Altura máx. alcanzable (0-1)",
];
export const OUTPUT_LABELS = ["Saltar (prob.)"];

/**
 * Forward pass con información detallada para visualización: activaciones por capa,
 * pesos y bias involucrados, decisión final.
 */
export function forwardDebug(brain, inputs) {
  const hiddenPre = [];
  const hiddenPost = [];
  for (let i = 0; i < HIDDEN_SIZE; i++) {
    let sum = brain.b1[i];
    for (let j = 0; j < INPUT_SIZE; j++) sum += brain.W1[i][j] * inputs[j];
    hiddenPre[i] = sum;
    hiddenPost[i] = relu(sum);
  }
  let outPre = brain.b2[0];
  for (let i = 0; i < HIDDEN_SIZE; i++)
    outPre += brain.W2[0][i] * hiddenPost[i];
  const outPost = sigmoid(outPre);
  return {
    inputs: inputs.slice(),
    hidden: hiddenPre.map((pre, i) => ({
      bias: brain.b1[i],
      weights: brain.W1[i].slice(),
      preActivation: pre,
      postActivation: hiddenPost[i],
    })),
    output: {
      bias: brain.b2[0],
      weights: brain.W2[0].slice(),
      preActivation: outPre,
      postActivation: outPost,
    },
    decision: outPost > 0.5,
    threshold: 0.5,
  };
}
