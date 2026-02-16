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

/** Devuelve un valor aproximadamente N(0, 1) usando Box-Muller. */
function randomGaussian() {
  const u1 = 1 - Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const LEAKY_RELU_ALPHA = 0.01;

function leakyRelu(x) {
  return x > 0 ? x : LEAKY_RELU_ALPHA * x;
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
 * Crea un cerebro desde un archivo JSON (modelo actual: 7 entradas, 7 ocultas, 1 salida).
 * @param {object} config - { brain: { W1, b1, W2, b2 } }
 * @returns {object} cerebro listo para forward()
 */
export function loadBrainFromConfig(config) {
  if (!config || !config.brain) return null;
  const b = config.brain;
  if (!b.W1 || !b.b1 || !b.W2 || !b.b2) return null;
  let W1 = b.W1.map((row) => row.slice());
  if (W1[0]) {
    if (W1[0].length > INPUT_SIZE) {
      W1 = W1.map((row) => row.slice(0, INPUT_SIZE));
    } else if (W1[0].length === 6) {
      for (let i = 0; i < W1.length; i++) W1[i].push((Math.random() - 0.5) * 2);
    }
  }
  if (W1.length > HIDDEN_SIZE) {
    W1 = W1.slice(0, HIDDEN_SIZE);
  } else if (W1.length === 6 && W1[0] && W1[0].length === 7) {
    W1.push(W1[0].map(() => (Math.random() - 0.5) * 2));
  }
  let b1 = b.b1.slice();
  if (b1.length > HIDDEN_SIZE) b1 = b1.slice(0, HIDDEN_SIZE);
  else if (b1.length === 6) b1.push((Math.random() - 0.5) * 2);
  let W2 = b.W2.map((row) => row.slice());
  if (W2[0] && W2[0].length > HIDDEN_SIZE) {
    W2 = W2.map((row) => row.slice(0, HIDDEN_SIZE));
  } else if (W2[0] && W2[0].length === 6) {
    W2 = W2.map((row) => [...row, (Math.random() - 0.5) * 2]);
  }
  return {
    W1,
    b1,
    W2,
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
 * [ dist. obstáculo, vel. Y, dist. al suelo player, ancho obst., alt. obst., dist. suelo obst., dist. borde inferior player a borde superior obst. ]
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

  const distNorm = dist == null ? 1 : Math.min(1, Math.max(0, dist / 800));
  const maxVelY = Math.abs(C.JUMP_FORCE);
  const velNorm = Math.max(-1, Math.min(1, player.velocityY / maxVelY));
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

  const playerBottom = player.y + player.size;
  const obstacleTop =
    nextInfo.nextGroundDist != null
      ? C.GROUND_Y - nextInfo.nextGroundDist
      : null;
  const gap =
    obstacleTop != null ? obstacleTop - playerBottom : 2 * C.PLAYER_SIZE;
  const gapNorm =
    Math.max(0, Math.min(1, gap / (2 * C.PLAYER_SIZE)));

  return [
    distNorm,
    velNorm,
    playerGroundDist,
    nextSize,
    nextHeight,
    nextGroundDist,
    gapNorm,
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
    hidden[i] = leakyRelu(sum);
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
      if (Math.random() < rate) b.W1[i][j] += amount * randomGaussian();
    }
  }
  for (let i = 0; i < b.b1.length; i++) {
    if (Math.random() < rate) b.b1[i] += amount * randomGaussian();
  }
  for (let i = 0; i < b.W2.length; i++) {
    for (let j = 0; j < b.W2[i].length; j++) {
      if (Math.random() < rate) b.W2[i][j] += amount * randomGaussian();
    }
  }
  for (let i = 0; i < b.b2.length; i++) {
    if (Math.random() < rate) b.b2[i] += amount * randomGaussian();
  }
  return b;
}

const MUTATE_RATE = 0.05; // 5% - mutación baja para no romper estrategias
const MUTATE_AMOUNT = 0.15; // sigma de mutación gaussiana (cambios pequeños más frecuentes)
const MUTATE_DECAY = 0.995; // por generación: rate y amount bajan (0.995^gen). Al final se afina.

const TOP_PERCENT = 0.1; // Solo el 10% que llegó más lejos se reproduce
/** Peso = (score + eps)^POWER: mayor potencia → el mejor tiene muchos más hijos. */
const SELECTION_WEIGHT_POWER = 3;
/** Cuántos mejores pasan sin mutar a la siguiente generación (elitismo). */
const ELITISM_COUNT = 3;
/** Probabilidad de que un hijo sea copia exacta del padre (sin mutar). Preserva más genotipos buenos. */
const CLONE_PROBABILITY = 0.08;
/** Si no hay mejora durante tantas generaciones, se inyectan cerebros aleatorios (anti-estancamiento). */
const STAGNATION_THRESHOLD = 25;
const STAGNATION_INJECT_COUNT = 10;

/**
 * Genera la siguiente generación: elitismo + top % con ruleta; mutación decreciente con generación; inyección de aleatorios si hay estancamiento.
 * @param {number} generation - Generación que acaba de terminar (0, 1, 2, ...). Reduce rate y amount con el tiempo.
 * @param {number} generationsWithoutImprovement - Generaciones seguidas sin mejorar el mejor score. Si >= STAGNATION_THRESHOLD se inyectan cerebros aleatorios.
 */
export function nextGeneration(brains, scores, numOffspring, generation = 0, generationsWithoutImprovement = 0) {
  if (brains.length === 0 || scores.length === 0) {
    const next = [];
    for (let i = 0; i < numOffspring; i++) next.push(createRandomBrain());
    return next;
  }

  const decay = Math.pow(MUTATE_DECAY, generation);
  const rate = MUTATE_RATE * (0.5 + 0.5 * decay);
  const amount = MUTATE_AMOUNT * (0.5 + 0.5 * decay);

  const indices = scores.map((s, i) => ({ i, score: s }));
  indices.sort((a, b) => b.score - a.score);
  const topCount = Math.max(1, Math.floor(brains.length * TOP_PERCENT));
  const top = indices.slice(0, topCount);
  const topIndices = top.map((x) => x.i);
  const topScores = top.map((x) =>
    Math.pow(x.score + 1e-6, SELECTION_WEIGHT_POWER),
  );
  const sum = topScores.reduce((a, b) => a + b, 0);

  const next = [];
  const elite = Math.min(ELITISM_COUNT, numOffspring, indices.length);
  for (let e = 0; e < elite; e++) {
    next.push(cloneBrain(brains[indices[e].i]));
  }
  const toFill = numOffspring - next.length;
  for (let k = 0; k < toFill; k++) {
    let r = Math.random() * sum;
    let parentPos = 0;
    for (let i = 0; i < topScores.length; i++) {
      r -= topScores[i];
      if (r <= 0) {
        parentPos = i;
        break;
      }
      parentPos = i;
    }
    const parentIdx = topIndices[parentPos];
    const parent = brains[parentIdx];
    if (Math.random() < CLONE_PROBABILITY) {
      next.push(cloneBrain(parent));
    } else {
      next.push(mutateBrain(parent, rate, amount));
    }
  }

  if (generationsWithoutImprovement >= STAGNATION_THRESHOLD) {
    const inject = Math.min(STAGNATION_INJECT_COUNT, next.length);
    for (let i = 0; i < inject; i++) {
      next[next.length - 1 - i] = createRandomBrain();
    }
  }

  return next;
}

export const BRAIN_INPUT_SIZE = INPUT_SIZE;
export const BRAIN_HIDDEN_SIZE = HIDDEN_SIZE;

export const INPUT_LABELS = [
  "Dist. al obstáculo (0-1)",
  "Velocidad Y (norm)",
  "Dist. al suelo player (0-1)",
  "Ancho próximo obst. (0-1)",
  "Altura próximo obst. (0-1)",
  "Dist. al suelo próximo obst. (0-1)",
  "Gap vertical (0-1)",
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
    hiddenPost[i] = leakyRelu(sum);
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
