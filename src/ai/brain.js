/**
 * Red neuronal de 3 capas (entrada, oculta, salida) para controlar al jugador.
 * Cada cerebro tiene configuración aleatoria inicial; se reproducen los mejores con mutación.
 */

const INPUT_SIZE = 6;
const HIDDEN_SIZE = 12;
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
  // Migrar modelos antiguos: añadir columnas de pesos aleatorios según el tamaño
  if (W1[0]) {
    const currentSize = W1[0].length;
    if (currentSize === 4) {
      // Migrar de 4 a 6 entradas: añadir 2 columnas
      for (let i = 0; i < W1.length; i++) {
        W1[i].push((Math.random() - 0.5) * 2);
        W1[i].push((Math.random() - 0.5) * 2);
      }
    } else if (currentSize === 5) {
      // Migrar de 5 a 6 entradas: añadir 1 columna
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
 * Estructura: entrada (6) -> oculta (12) -> salida (1).
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
 * Construye el vector de entrada para la red a partir del estado del juego.
 * [ dist. obstáculo, vel. Y, onGround, tam. obstáculo, alt. obstáculo, dist. al suelo obstáculo ]
 */
export function stateToInputs(state) {
  const dist = state.distanceToNextObstacle;
  const distNorm = dist == null ? 1 : Math.min(1, Math.max(0, dist / 800));
  const velNorm = Math.max(-1, Math.min(1, state.player.velocityY / 15));
  const onGround = state.player.onGround ? 1 : 0;
  const nextSize = state.nextObstacleSize != null ? state.nextObstacleSize / 80 : 0;
  const nextHeight =
    state.nextObstacleHeight != null ? state.nextObstacleHeight / 80 : 0;
  const nextGroundDist =
    state.nextObstacleGroundDistance != null ? Math.min(1, Math.max(0, state.nextObstacleGroundDistance / 80)) : 0;
  return [distNorm, velNorm, onGround, nextSize, nextHeight, nextGroundDist];
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
      if (Math.random() < rate) b.W1[i][j] += (Math.random() - 0.5) * 2 * amount;
    }
  }
  for (let i = 0; i < b.b1.length; i++) {
    if (Math.random() < rate) b.b1[i] += (Math.random() - 0.5) * 2 * amount;
  }
  for (let i = 0; i < b.W2.length; i++) {
    for (let j = 0; j < b.W2[i].length; j++) {
      if (Math.random() < rate) b.W2[i][j] += (Math.random() - 0.5) * 2 * amount;
    }
  }
  for (let i = 0; i < b.b2.length; i++) {
    if (Math.random() < rate) b.b2[i] += (Math.random() - 0.5) * 2 * amount;
  }
  return b;
}

const NUM_OFFSPRING = 20;
const MUTATE_RATE = 0.15;
const MUTATE_AMOUNT = 0.25;

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
  const remainder = quota.map((q, i) => ({ i, frac: q - Math.floor(q) }))
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
  "Velocidad Y (norm)",
  "En suelo (0/1)",
  "Ancho próximo obst. (0-1)",
  "Altura próximo obst. (0-1)",
  "Dist. al suelo próximo obst. (0-1)",
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
  for (let i = 0; i < HIDDEN_SIZE; i++) outPre += brain.W2[0][i] * hiddenPost[i];
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
