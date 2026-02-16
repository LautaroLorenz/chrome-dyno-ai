/**
 * Modo Entrenar AI: N jugadores en un único mundo compartido, red de 3 capas.
 * Cada generación se reproducen con mutación en proporción a la distancia recorrida.
 */
import { createInitialPlayer, updatePlayer } from "./gameState.js";
import { setCanvasSize, renderSharedWorld } from "./render.js";
import {
  createRandomBrain,
  stateToInputs,
  forward,
  nextGeneration,
  forwardDebug,
} from "./ai/brain.js";
import { drawNeuralNetwork } from "./ai/neuralView.js";
import * as C from "./constants.js";
import { getLevel, createLevelRunner } from "./levels/index.js";

const NUM_PLAYERS = 10000;
const SCORE_GOAL = 900;
/** Renderizar solo cada N frames (lógica sigue a 60fps, gráficos más espaciados para rendimiento). */
const RENDER_EVERY_N_FRAMES = 2;

const TRAINING_LEVEL = 1; // Las IA siempre entrenan en el nivel 1

let brains = [];
/** Mundo compartido: { players, obstacles, maxDistance } */
let sharedState = { players: [], obstacles: [], maxDistance: 0 };
let levelRunner = null;
let generation = 0;
let rafId = null;
let trainingStopped = false;
let frameCount = 0;

function initPlayers() {
  brains = [];
  sharedState.players = [];
  sharedState.obstacles = [];
  sharedState.maxDistance = 0;
  levelRunner = createLevelRunner(getLevel(TRAINING_LEVEL));
  for (let i = 0; i < NUM_PLAYERS; i++) {
    brains.push(createRandomBrain());
    sharedState.players.push(createInitialPlayer());
  }
}

function stepAll() {
  const sharedObstacles = levelRunner.advance(C.OBSTACLE_SPEED);
  sharedState.obstacles = sharedObstacles;

  let allDead = true;
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const player = sharedState.players[i];
    if (!player.alive) continue;
    if (!brains[i]) {
      console.warn(`Brain ${i} is undefined, skipping`);
      continue;
    }
    allDead = false;
    const inputs = stateToInputs(player, sharedObstacles);
    const jumpProb = forward(brains[i], inputs);
    updatePlayer(player, jumpProb > 0.5, sharedObstacles);
  }
  sharedState.maxDistance = Math.max(
    0,
    ...sharedState.players.map((p) => p.distanceTraveled),
  );
  return allDead;
}

function updateRedNeuronalPanel(canvas, panelEl) {
  if (!canvas) return;
  const aliveIndices = sharedState.players
    .map((p, i) => (p.alive ? i : -1))
    .filter((i) => i >= 0);
  if (aliveIndices.length === 0) {
    drawNeuralNetwork(canvas, null);
    if (panelEl) panelEl.textContent = "Esperando siguiente generación...";
    return;
  }
  const bestAlive = aliveIndices.reduce((best, i) =>
    sharedState.players[i].distanceTraveled > sharedState.players[best].distanceTraveled ? i : best,
  );
  const idx = bestAlive;
  const inputs = stateToInputs(sharedState.players[idx], sharedState.obstacles);
  const debug = forwardDebug(brains[idx], inputs);
  debug._brain = brains[idx];
  drawNeuralNetwork(canvas, debug);
  if (panelEl)
    panelEl.textContent = `Jugador #${idx + 1} · Decisión: ${debug.decision ? "Saltar" : "No saltar"}`;
}

function renderAll(gameCanvas, genEl, bestEl, aliveEl, redCanvas, redLegend) {
  renderSharedWorld(gameCanvas, sharedState);
  updateRedNeuronalPanel(redCanvas, redLegend);
}

function getBestBrainIndex() {
  let best = 0;
  for (let i = 1; i < brains.length; i++) {
    if (sharedState.players[i].distanceTraveled > sharedState.players[best].distanceTraveled) best = i;
  }
  return best;
}

function downloadModel() {
  if (brains.length === 0) return;
  const idx = getBestBrainIndex();
  const brain = brains[idx];
  const score = sharedState.players[idx].distanceTraveled;
  const config = {
    version: 1,
    generation,
    bestScore: Math.floor(score),
    brain: {
      W1: brain.W1,
      b1: brain.b1,
      W2: brain.W2,
      b2: brain.b2,
    },
  };
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `brain-config-gen${generation}-score${Math.floor(score)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function runGeneration(
  gameCanvas,
  genEl,
  bestEl,
  aliveEl,
  redCanvas,
  redLegend,
  btnDownload,
) {
  if (trainingStopped) return;
  const allDead = stepAll();
  const maxScore = sharedState.maxDistance;
  const aliveCount = sharedState.players.filter((p) => p.alive).length;
  if (genEl) genEl.textContent = generation;
  if (bestEl) bestEl.textContent = Math.floor(maxScore);
  if (aliveEl) aliveEl.textContent = aliveCount;

  if (frameCount % RENDER_EVERY_N_FRAMES === 0) {
    renderAll(gameCanvas, genEl, bestEl, aliveEl, redCanvas, redLegend);
  }
  frameCount += 1;

  if (maxScore >= SCORE_GOAL) {
    trainingStopped = true;
    if (genEl) genEl.textContent = generation + " ✓";
    const statusEl = document.getElementById("entrenar-status");
    if (statusEl)
      statusEl.textContent =
        "Entrenamiento completado. Descarga el modelo abajo.";
    if (btnDownload) btnDownload.disabled = false;
    return;
  }

  if (allDead) {
    const scores = sharedState.players.map((p) => p.distanceTraveled);
    brains = nextGeneration(brains, scores, NUM_PLAYERS);
    generation += 1;
    frameCount = 0;
    levelRunner = createLevelRunner(getLevel(TRAINING_LEVEL));
    sharedState.players = [];
    for (let i = 0; i < NUM_PLAYERS; i++) {
      sharedState.players.push(createInitialPlayer());
    }
    renderAll(gameCanvas, genEl, bestEl, aliveEl, redCanvas, redLegend);
  }
  rafId = requestAnimationFrame(() =>
    runGeneration(gameCanvas, genEl, bestEl, aliveEl, redCanvas, redLegend, btnDownload),
  );
}

export function startEntrenar(container) {
  container.innerHTML = "";
  const title = document.createElement("h1");
  title.textContent = "Entrenar AI";
  container.appendChild(title);

  const info = document.createElement("div");
  info.className = "entrenar-info";
  info.innerHTML = `
    <span>Generación: <strong id="entrenar-gen">0</strong></span>
    <span style="width: 164px; display: inline-block; text-align: start;">Mejor score: <strong id="entrenar-best">0</strong> / ${SCORE_GOAL}</span>
    <span style="width: 162px; display: inline-block; text-align: start;">Vivos: <strong id="entrenar-alive">0</strong> / ${NUM_PLAYERS}</span>
    <span id="entrenar-status" class="entrenar-status"></span>
  `;
  container.appendChild(info);

  const gameWrap = document.createElement("div");
  gameWrap.className = "entrenar-game-wrap";
  const gameCanvas = document.createElement("canvas");
  gameCanvas.className = "entrenar-canvas entrenar-canvas-single";
  setCanvasSize(gameCanvas, C.WORLD_WIDTH, C.WORLD_HEIGHT);
  gameWrap.appendChild(gameCanvas);
  container.appendChild(gameWrap);

  const redSection = document.createElement("section");
  redSection.className = "red-neuronal";
  const redTitle = document.createElement("h2");
  redTitle.textContent = "Red neuronal";
  redSection.appendChild(redTitle);
  const redCanvas = document.createElement("canvas");
  redCanvas.className = "red-neuronal-canvas";
  redCanvas.width = 720;
  redCanvas.height = 460;
  redSection.appendChild(redCanvas);
  const redLegend = document.createElement("p");
  redLegend.className = "red-neuronal-legend";
  redSection.appendChild(redLegend);
  container.appendChild(redSection);

  const navBtns = document.createElement("div");
  navBtns.className = "entrenar-nav-btns";
  const backLink = document.createElement("a");
  backLink.href = "index.html";
  backLink.className = "btn-back";
  backLink.textContent = "← Volver al menú";
  const btnDownload = document.createElement("button");
  btnDownload.className = "btn-download entrenar-download";
  btnDownload.textContent = "Descargar modelo entrenado";
  btnDownload.type = "button";
  btnDownload.disabled = true;
  btnDownload.addEventListener("click", downloadModel);
  navBtns.appendChild(backLink);
  navBtns.appendChild(btnDownload);
  container.appendChild(navBtns);

  generation = 0;
  trainingStopped = false;
  initPlayers();
  const genEl = document.getElementById("entrenar-gen");
  const bestEl = document.getElementById("entrenar-best");
  const aliveEl = document.getElementById("entrenar-alive");
  runGeneration(gameCanvas, genEl, bestEl, aliveEl, redCanvas, redLegend, btnDownload);

  return function stop() {
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}
