/**
 * Modo Entrenar AI: 20 jugadores con red de 3 capas, cada uno con configuración aleatoria.
 * Cada generación se reproducen con mutación en proporción al score para formar 20 nuevos.
 */
import { createInitialState, updateState } from "./gameState.js";
import { setCanvasSize, render } from "./render.js";
import {
  createRandomBrain,
  stateToInputs,
  forward,
  nextGeneration,
  forwardDebug,
} from "./ai/brain.js";
import { drawNeuralNetwork } from "./ai/neuralView.js";
import * as C from "./constants.js";

const NUM_PLAYERS = 100;
const MINI_WIDTH = 200;
const MINI_HEIGHT = 40;
const SCORE_GOAL = 150;

let brains = [];
let states = [];
let generation = 0;
let rafId = null;
let trainingStopped = false;

function initPlayers() {
  brains = [];
  states = [];
  for (let i = 0; i < NUM_PLAYERS; i++) {
    brains.push(createRandomBrain());
    states.push(createInitialState());
  }
}

function stepAll() {
  let allDead = true;
  for (let i = 0; i < NUM_PLAYERS; i++) {
    if (!states[i].alive) continue;
    if (!brains[i]) {
      console.warn(`Brain ${i} is undefined, skipping`);
      continue;
    }
    allDead = false;
    const inputs = stateToInputs(states[i]);
    const jumpProb = forward(brains[i], inputs);
    const shouldJump = jumpProb > 0.5;
    updateState(states[i], shouldJump);
  }
  return allDead;
}

function updateRedNeuronalPanel(canvas, panelEl) {
  if (!canvas) return;
  const aliveIndices = states
    .map((s, i) => (s.alive ? i : -1))
    .filter((i) => i >= 0);
  if (aliveIndices.length === 0) {
    drawNeuralNetwork(canvas, null);
    if (panelEl) panelEl.textContent = "Esperando siguiente generación...";
    return;
  }
  const bestAlive = aliveIndices.reduce((best, i) =>
    states[i].score > states[best].score ? i : best
  );
  const idx = bestAlive;
  const inputs = stateToInputs(states[idx]);
  const debug = forwardDebug(brains[idx], inputs);
  debug._brain = brains[idx];
  drawNeuralNetwork(canvas, debug);
  if (panelEl) panelEl.textContent = `Jugador #${idx + 1} · Decisión: ${debug.decision ? "Saltar" : "No saltar"}`;
}

function renderAll(canvases, genEl, bestEl, redCanvas, redLegend) {
  for (let i = 0; i < NUM_PLAYERS; i++) {
    render(canvases[i], states[i]);
  }
  if (genEl) genEl.textContent = generation;
  const maxScore = states.reduce((m, s) => Math.max(m, s.score), 0);
  if (bestEl) bestEl.textContent = Math.floor(maxScore);
  updateRedNeuronalPanel(redCanvas, redLegend);
}

function getBestBrainIndex() {
  let best = 0;
  for (let i = 1; i < brains.length; i++) {
    if (states[i].score > states[best].score) best = i;
  }
  return best;
}

function downloadModel() {
  if (brains.length === 0) return;
  const idx = getBestBrainIndex();
  const brain = brains[idx];
  const score = states[idx].score;
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
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `brain-config-gen${generation}-score${Math.floor(score)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function runGeneration(canvases, genEl, bestEl, redCanvas, redLegend, btnDownload) {
  if (trainingStopped) return;
  const allDead = stepAll();
  renderAll(canvases, genEl, bestEl, redCanvas, redLegend);

  const maxScore = states.reduce((m, s) => Math.max(m, s.score), 0);
  if (maxScore >= SCORE_GOAL) {
    trainingStopped = true;
    if (genEl) genEl.textContent = generation + " ✓";
    const statusEl = document.getElementById("entrenar-status");
    if (statusEl) statusEl.textContent = "Entrenamiento completado. Descarga el modelo abajo.";
    if (btnDownload) btnDownload.disabled = false;
    return;
  }

  if (allDead) {
    const scores = states.map((s) => s.score);
    brains = nextGeneration(brains, scores, NUM_PLAYERS);
    generation += 1;
    for (let i = 0; i < NUM_PLAYERS; i++) {
      states[i] = createInitialState();
    }
  }
  rafId = requestAnimationFrame(() => runGeneration(canvases, genEl, bestEl, redCanvas, redLegend, btnDownload));
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
    <span>Mejor score: <strong id="entrenar-best">0</strong> / ${SCORE_GOAL}</span>
    <span id="entrenar-status" class="entrenar-status"></span>
  `;
  container.appendChild(info);

  const grid = document.createElement("div");
  grid.className = "entrenar-grid";
  const canvases = [];
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const wrap = document.createElement("div");
    wrap.className = "entrenar-cell";
    const canvas = document.createElement("canvas");
    canvas.className = "entrenar-canvas";
    setCanvasSize(canvas, MINI_WIDTH, MINI_HEIGHT);
    wrap.appendChild(canvas);
    grid.appendChild(wrap);
    canvases.push(canvas);
  }
  container.appendChild(grid);

  const redSection = document.createElement("section");
  redSection.className = "red-neuronal";
  const redTitle = document.createElement("h2");
  redTitle.textContent = "Red neuronal";
  redSection.appendChild(redTitle);
  const redCanvas = document.createElement("canvas");
  redCanvas.className = "red-neuronal-canvas";
  redCanvas.width = 540;
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
  runGeneration(canvases, genEl, bestEl, redCanvas, redLegend, btnDownload);

  return function stop() {
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}
