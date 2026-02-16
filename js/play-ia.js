/**
 * Entrada para ver en acción un modelo ya entrenado.
 * El usuario sube el único archivo descargado desde Entrenamiento (dino-ai-model.json).
 */
import { step, getState, resetGame, render } from "./env.js";

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

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

/**
 * Carga el modelo desde el único archivo (dino-ai-model.json con pesos en base64).
 */
async function loadModelFromSingleFile(file) {
  if (!file || !file.name.toLowerCase().endsWith(".json")) return null;
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.modelTopology || !data.weightSpecs) return null;
  const weightData =
    data.weightDataBase64 != null && data.weightDataBase64 !== ""
      ? base64ToArrayBuffer(data.weightDataBase64)
      : undefined;
  const modelArtifacts = {
    modelTopology: data.modelTopology,
    weightSpecs: data.weightSpecs,
    weightData,
  };
  const handler = tf.io.fromMemory(modelArtifacts);
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
    if (!files || files.length !== 1) {
      if (errorEl) {
        errorEl.textContent =
          "Seleccioná el archivo del modelo (dino-ai-model.json descargado desde Entrenamiento).";
        errorEl.hidden = false;
      }
      return;
    }
    btnLoad.disabled = true;
    btnLoad.textContent = "Cargando…";
    try {
      const model = await loadModelFromSingleFile(files[0]);
      if (!model) {
        if (errorEl) {
          errorEl.textContent =
            "Archivo no válido. Usá el dino-ai-model.json que descargaste desde Entrenamiento.";
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
        errorEl.textContent =
          "No se pudo cargar el modelo. Revisá que sea el archivo dino-ai-model.json descargado desde Entrenamiento.";
        errorEl.hidden = false;
      }
      btnLoad.disabled = false;
      btnLoad.textContent = "Cargar modelo y jugar";
    }
  });
}

init();
