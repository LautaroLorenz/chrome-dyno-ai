/**
 * Modo Entrenar AI: 10 jugadores con red de 3 capas, cada uno con configuración aleatoria.
 * Cada generación se eligen los 4 mejores (por score) y se reproducen con mutación para formar 10 nuevos.
 */
import { createInitialState, updateState } from "./gameState.js";
import { setCanvasSize, render } from "./render.js";
import {
  createRandomBrain,
  stateToInputs,
  forward,
  nextGeneration,
} from "./ai/brain.js";
import * as C from "./constants.js";

const NUM_PLAYERS = 10;
const MINI_WIDTH = 200;
const MINI_HEIGHT = 40;

let brains = [];
let states = [];
let generation = 0;
let rafId = null;

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
    allDead = false;
    const inputs = stateToInputs(states[i]);
    const jumpProb = forward(brains[i], inputs);
    const shouldJump = jumpProb > 0.5;
    updateState(states[i], shouldJump);
  }
  return allDead;
}

function renderAll(canvases, genEl, bestEl) {
  for (let i = 0; i < NUM_PLAYERS; i++) {
    render(canvases[i], states[i]);
  }
  if (genEl) genEl.textContent = generation;
  const aliveScores = states.filter((s) => s.alive).map((s) => s.score);
  const maxScore = states.reduce((m, s) => Math.max(m, s.score), 0);
  if (bestEl) bestEl.textContent = Math.floor(maxScore);
}

function runGeneration(canvases, genEl, bestEl) {
  const allDead = stepAll();
  renderAll(canvases, genEl, bestEl);
  if (allDead) {
    const scores = states.map((s) => s.score);
    brains = nextGeneration(brains, scores);
    generation += 1;
    for (let i = 0; i < NUM_PLAYERS; i++) {
      states[i] = createInitialState();
    }
  }
  rafId = requestAnimationFrame(() => runGeneration(canvases, genEl, bestEl));
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
    <span>Mejor score: <strong id="entrenar-best">0</strong></span>
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

  const backLink = document.createElement("a");
  backLink.href = "index.html";
  backLink.className = "btn-back";
  backLink.textContent = "← Volver al menú";
  container.appendChild(backLink);

  generation = 0;
  initPlayers();
  const genEl = document.getElementById("entrenar-gen");
  const bestEl = document.getElementById("entrenar-best");
  runGeneration(canvases, genEl, bestEl);

  return function stop() {
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}
