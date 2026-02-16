/**
 * Red neuronal de 3 capas (entrada, oculta, salida) para controlar al jugador.
 * Cada cerebro tiene configuración aleatoria inicial; se reproducen los mejores con mutación.
 */

const INPUT_SIZE = 4;
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
 * Crea un cerebro con pesos y bias aleatorios.
 * Estructura: entrada (4) -> oculta (12) -> salida (1).
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
 * [ distancia al obstáculo (0-1), velocidadY normalizada, onGround (0/1), tamaño próximo obstáculo (0-1) ]
 */
export function stateToInputs(state) {
  const dist = state.distanceToNextObstacle;
  const distNorm = dist == null ? 1 : Math.min(1, Math.max(0, dist / 800));
  const velNorm = Math.max(-1, Math.min(1, state.player.velocityY / 15));
  const onGround = state.player.onGround ? 1 : 0;
  const nextSize = state.nextObstacleSize != null ? state.nextObstacleSize / 800 : 0;
  return [distNorm, velNorm, onGround, nextSize];
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

/**
 * Dados 10 puntuaciones, toma los 4 mejores cerebros y genera 10 nuevos
 * reproduciendo (copiando + mutar) para la siguiente generación.
 */
export function nextGeneration(brains, scores) {
  const indexed = brains.map((b, i) => ({ brain: b, score: scores[i] }));
  indexed.sort((a, b) => b.score - a.score);
  const top4 = indexed.slice(0, 4).map((x) => x.brain);
  const next = [];
  for (let i = 0; i < 10; i++) {
    const parent = top4[i % 4];
    next.push(mutateBrain(parent, 0.15, 0.25));
  }
  return next;
}

export const BRAIN_INPUT_SIZE = INPUT_SIZE;
export const BRAIN_HIDDEN_SIZE = HIDDEN_SIZE;
