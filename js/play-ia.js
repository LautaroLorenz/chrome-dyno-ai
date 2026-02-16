/**
 * Entrada para ver en acción un modelo descargado.
 * El usuario debe subir model.json y el archivo .weights.bin antes de empezar.
 */
import { step, getState, resetGame, render } from "./env.js";

function getJumpProbability(model, state) {
  const stateTensor = tf.tensor2d([state]);
  const prob = model.predict(stateTensor);
  const val = prob.dataSync()[0];
  stateTensor.dispose();
  prob.dispose();
  return val;
}

function getAction(model, state) {
  const probVal = getJumpProbability(model, state);
  return Math.random() < probVal ? 1 : 0;
}

function playLoop(model) {
  const state = getState();
  const action = getAction(model, state);
  const result = step(action);
  render();

  if (result.done) {
    document.getElementById("play-status").textContent =
      `Game Over — Score: ${result.score.toFixed(1)}. Reiniciando…`;
    resetGame();
  }

  requestAnimationFrame(() => playLoop(model));
}

function startPlaying(model) {
  const uploadSection = document.getElementById("upload-section");
  const gameCanvas = document.getElementById("game");
  const playActions = document.getElementById("play-actions");
  if (uploadSection) uploadSection.hidden = true;
  if (gameCanvas) gameCanvas.hidden = false;
  if (playActions) playActions.hidden = false;

  document.getElementById("play-status").textContent = "IA jugando";
  resetGame();
  playLoop(model);
}

async function loadModelFromFiles(files) {
  if (!files || files.length < 2) return null;
  const sorted = Array.from(files).sort((a, b) => {
    const aJson = a.name.toLowerCase().endsWith(".json");
    const bJson = b.name.toLowerCase().endsWith(".json");
    if (aJson && !bJson) return -1;
    if (!aJson && bJson) return 1;
    return 0;
  });
  const jsonFile = sorted.find((f) => f.name.toLowerCase().endsWith(".json"));
  const weightsFile = sorted.find(
    (f) =>
      f.name.toLowerCase().endsWith(".weights.bin") ||
      f.name.toLowerCase().endsWith(".bin")
  );
  if (!jsonFile || !weightsFile) return null;
  // TensorFlow.js hace coincidir por nombre: el archivo de pesos debe llamarse como en el manifest (dino-ai-model.weights.bin)
  const handler = tf.io.browserFiles([jsonFile, weightsFile]);
  return await tf.loadLayersModel(handler);
}

async function init() {
  await tf.ready();

  const inputFiles = document.getElementById("model-files");
  const btnLoad = document.getElementById("btn-load-model");
  const errorEl = document.getElementById("upload-error");

  if (!btnLoad || !inputFiles) return;

  btnLoad.addEventListener("click", async () => {
    const files = inputFiles.files;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
    if (!files || files.length < 2) {
      if (errorEl) {
        errorEl.textContent =
          "Seleccioná los dos archivos: model.json y dino-ai-model.weights.bin (en ese orden no importa).";
        errorEl.hidden = false;
      }
      return;
    }
    btnLoad.disabled = true;
    btnLoad.textContent = "Cargando…";
    try {
      const model = await loadModelFromFiles(files);
      if (!model) {
        if (errorEl) {
          errorEl.textContent =
            "Seleccioná un archivo .json (model.json) y uno .weights.bin o .bin (dino-ai-model.weights.bin).";
          errorEl.hidden = false;
        }
        btnLoad.disabled = false;
        btnLoad.textContent = "Cargar modelo y jugar";
        return;
      }
      startPlaying(model);
    } catch (err) {
      console.error("Error al cargar el modelo:", err);
      if (errorEl) {
        const msg =
          err && err.message && err.message.includes("basename")
            ? "El archivo de pesos debe llamarse exactamente dino-ai-model.weights.bin (como cuando lo descargás)."
            : "No se pudo cargar el modelo. Revisá que sean model.json y dino-ai-model.weights.bin descargados desde Entrenamiento.";
        errorEl.textContent = msg;
        errorEl.hidden = false;
      }
      btnLoad.disabled = false;
      btnLoad.textContent = "Cargar modelo y jugar";
    }
  });
}

init();
