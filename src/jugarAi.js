/**
 * Modo Jugar AI: un jugador controlado por un modelo cargado desde archivo.
 * Carga el JSON descargado durante el entrenamiento y muestra la red neuronal en acción.
 */
import { createInitialState, updateState } from "./gameState.js";
import { setCanvasSize, render } from "./render.js";
import {
  loadBrainFromConfig,
  stateToInputs,
  forward,
  forwardDebug,
} from "./ai/brain.js";
import { drawNeuralNetwork } from "./ai/neuralView.js";

let rafId = null;
let brain = null;
let configMeta = null;

function runGameLoop(canvas, neuralCanvas, legendEl) {
  if (!brain || !state.alive) return;
  const inputs = stateToInputs(state);
  const shouldJump = forward(brain, inputs) > 0.5;
  updateState(state, shouldJump);
  render(canvas, state);

  const debug = forwardDebug(brain, inputs);
  debug._brain = brain;
  drawNeuralNetwork(neuralCanvas, debug);
  if (legendEl) {
    legendEl.textContent = `Score: ${Math.floor(state.score)} · Decisión: ${shouldJump ? "Saltar" : "No saltar"}`;
  }

  if (state.alive) {
    rafId = requestAnimationFrame(() => runGameLoop(canvas, neuralCanvas, legendEl));
  } else {
    if (legendEl) legendEl.textContent = `Game Over · Score: ${Math.floor(state.score)}`;
  }
}

let state = null;

export function startJugarAi(container) {
  container.innerHTML = "";
  const title = document.createElement("h1");
  title.textContent = "Jugar AI";
  container.appendChild(title);

  const uploadSection = document.createElement("div");
  uploadSection.className = "jugar-ai-upload";
  uploadSection.innerHTML = `
    <label class="jugar-ai-label">Cargar modelo entrenado (JSON)</label>
    <input type="file" id="ai-file-input" accept=".json" class="jugar-ai-file" />
  `;
  container.appendChild(uploadSection);

  const navBtns = document.createElement("div");
  navBtns.className = "entrenar-nav-btns";
  const backLink = document.createElement("a");
  backLink.href = "index.html";
  backLink.className = "btn-back";
  backLink.textContent = "← Volver al menú";
  const entrenarLink = document.createElement("a");
  entrenarLink.href = "entrenar.html";
  entrenarLink.className = "btn-back";
  entrenarLink.textContent = "Entrenar AI";
  navBtns.appendChild(backLink);
  navBtns.appendChild(entrenarLink);
  container.appendChild(navBtns);

  const gameWrap = document.createElement("div");
  gameWrap.className = "jugar-ai-game";
  gameWrap.style.display = "none";

  const canvas = document.createElement("canvas");
  canvas.className = "game-canvas jugar-ai-canvas";
  setCanvasSize(canvas);
  gameWrap.appendChild(canvas);

  const redSection = document.createElement("section");
  redSection.className = "red-neuronal jugar-ai-neural";
  const redTitle = document.createElement("h2");
  redTitle.textContent = "Red neuronal";
  redSection.appendChild(redTitle);
  const neuralCanvas = document.createElement("canvas");
  neuralCanvas.className = "red-neuronal-canvas";
  neuralCanvas.width = 540;
  neuralCanvas.height = 300;
  redSection.appendChild(neuralCanvas);
  const legendEl = document.createElement("p");
  legendEl.className = "red-neuronal-legend";
  redSection.appendChild(legendEl);
  gameWrap.appendChild(redSection);

  container.appendChild(gameWrap);

  const fileInput = document.getElementById("ai-file-input");
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result ?? "{}");
        const loadedBrain = loadBrainFromConfig(data);
        if (!loadedBrain) {
          alert("Archivo inválido. Debe contener brain: { W1, b1, W2, b2 }");
          return;
        }
        brain = loadedBrain;
        configMeta = { generation: data.generation, bestScore: data.bestScore };
        state = createInitialState();
        gameWrap.style.display = "block";
        uploadSection.style.display = "none";
        runGameLoop(canvas, neuralCanvas, legendEl);
      } catch (err) {
        alert("Error al cargar el archivo: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  return function stop() {
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}
