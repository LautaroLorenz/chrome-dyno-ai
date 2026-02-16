/**
 * Entrada para ver en acción un modelo ya entrenado.
 * El usuario sube el único archivo descargado desde Entrenamiento (dino-ai-model.json).
 * Incluye la misma sección gráfica que el entrenamiento (red neuronal, P(saltar), score).
 */
import { step, getState, resetGame, render } from "./env.js";

const STATE_SIZE = 7;
const HIDDEN_SIZE = 32;
const SCORE_HISTORY_LENGTH = 100;

let scoreHistory = [];
let modelCanvas;
let chartCanvas;
let probFill;

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

function getActivations(model, state) {
  if (!model) return null;
  return tf.tidy(() => {
    let x = tf.tensor2d([state]);
    const activations = [Array.from(x.dataSync())];
    for (let i = 0; i < model.layers.length; i++) {
      x = model.layers[i].apply(x);
      activations.push(Array.from(x.dataSync()));
    }
    return activations;
  });
}

function getAction(model, state) {
  const probVal = getJumpProbability(model, state);
  return Math.random() < probVal ? 1 : 0;
}

function drawModelViz(model, state) {
  if (!model || !modelCanvas) return;
  const ctx = modelCanvas.getContext("2d");
  const rect = modelCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = rect.width * dpr;
  const h = rect.height * dpr;
  if (modelCanvas.width !== w || modelCanvas.height !== h) {
    modelCanvas.width = w;
    modelCanvas.height = h;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  const cw = rect.width;
  const ch = rect.height;
  ctx.fillStyle = "#0f1629";
  ctx.fillRect(0, 0, cw, ch);

  const layers = [STATE_SIZE, 12, 12, 1];
  const inputLabels = ["Dist", "ObsW", "ObsH", "PlayH", "PlayW", "Vel", "AltSuelo"];
  const outputLabel = "P(saltar)";
  const layerGap = cw / (layers.length + 1);
  const nodeRadius = 6;
  const nodes = layers.map((n, i) => {
    const x = layerGap * (i + 1);
    const nodeGap = ch / (n + 1);
    return Array.from({ length: n }, (_, j) => ({ x, y: nodeGap * (j + 1) }));
  });

  const activations = state ? getActivations(model, state) : null;

  try {
    const weights0 = model.layers[0].getWeights()[0].dataSync();
    const weights1 = model.layers[1].getWeights()[0].dataSync();
    const weights2 = model.layers[2].getWeights()[0].dataSync();
    const allW = [...Array.from(weights0), ...Array.from(weights1), ...Array.from(weights2)];
    const maxW = Math.max(...allW.map(Math.abs), 0.01);

    function drawConnections(fromLayer, toLayer, weights, fromN, toN, inSize, outSize) {
      for (let i = 0; i < fromN; i++) {
        for (let j = 0; j < toN; j++) {
          const ii = Math.floor((i / fromN) * inSize);
          const jj = Math.floor((j / toN) * outSize);
          const w = weights[ii * outSize + jj] || 0;
          const alpha = Math.min(1, Math.abs(w) / maxW) * 0.6;
          const hue = w >= 0 ? 200 : 350;
          ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
          ctx.lineWidth = Math.max(0.5, (Math.abs(w) / maxW) * 2);
          ctx.beginPath();
          ctx.moveTo(nodes[fromLayer][i].x, nodes[fromLayer][i].y);
          ctx.lineTo(nodes[toLayer][j].x, nodes[toLayer][j].y);
          ctx.stroke();
        }
      }
    }
    drawConnections(0, 1, Array.from(weights0), STATE_SIZE, 12, STATE_SIZE, HIDDEN_SIZE);
    drawConnections(1, 2, Array.from(weights1), 12, 12, HIDDEN_SIZE, HIDDEN_SIZE);
    drawConnections(2, 3, Array.from(weights2), 12, 1, HIDDEN_SIZE, 1);

    function getDisplayValue(layerIdx, nodeIdx) {
      if (!activations || layerIdx >= activations.length) return null;
      const vals = activations[layerIdx];
      const n = layers[layerIdx];
      const actualN = vals.length;
      const j = Math.min(Math.floor((nodeIdx / n) * actualN), actualN - 1);
      return vals[j];
    }
    function formatVal(v) {
      if (v === null || v === undefined) return "";
      return Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2);
    }

    nodes.forEach((layer, li) => {
      layer.forEach((node, ni) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = li === 0 ? "#4a9eff" : li === layers.length - 1 ? "#e94560" : "#0f3460";
        ctx.fill();
        ctx.strokeStyle = "#e94560";
        ctx.lineWidth = 1;
        ctx.stroke();
        const val = getDisplayValue(li, ni);
        if (val !== null) {
          ctx.fillStyle = "#eee";
          ctx.font = "9px monospace";
          if (li === 0) {
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillText(`${inputLabels[ni]} ${formatVal(val)}`, node.x - nodeRadius - 6, node.y);
          } else if (li === layers.length - 1) {
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(`${outputLabel} ${formatVal(val)}`, node.x + nodeRadius + 6, node.y);
          } else {
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(formatVal(val), node.x, node.y + nodeRadius + 4);
          }
        }
      });
    });
  } catch (e) {
    ctx.fillStyle = "#eee";
    ctx.font = "14px system-ui";
    ctx.fillText("Esperando modelo...", 10, 30);
  }
}

function drawScoreChart() {
  if (!chartCanvas || scoreHistory.length < 2) return;
  const ctx = chartCanvas.getContext("2d");
  const rect = chartCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = rect.width * dpr;
  const h = rect.height * dpr;
  if (chartCanvas.width !== w || chartCanvas.height !== h) {
    chartCanvas.width = w;
    chartCanvas.height = h;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  const cw = rect.width;
  const ch = rect.height;
  ctx.fillStyle = "#0f1629";
  ctx.fillRect(0, 0, cw, ch);
  const maxScore = Math.max(...scoreHistory, 1);
  const padding = 8;
  const graphW = cw - padding * 2;
  const graphH = ch - padding * 2;
  ctx.strokeStyle = "#0f3460";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, ch - padding);
  ctx.lineTo(cw - padding, ch - padding);
  ctx.stroke();
  ctx.strokeStyle = "#e94560";
  ctx.lineWidth = 2;
  ctx.beginPath();
  scoreHistory.forEach((score, i) => {
    const x = padding + (i / (scoreHistory.length - 1)) * graphW;
    const y = ch - padding - (score / maxScore) * graphH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function updateModelViz(model, state) {
  const prob = getJumpProbability(model, state);
  if (probFill) probFill.style.width = `${prob * 100}%`;
  drawModelViz(model, state);
  drawScoreChart();
}

function playLoop(model) {
  const state = getState();
  const action = getAction(model, state);
  const result = step(action);
  render();

  if (result.done) {
    scoreHistory.push(result.score);
    if (scoreHistory.length > SCORE_HISTORY_LENGTH) scoreHistory.shift();
    document.getElementById("play-status").textContent =
      `Game Over — Score: ${result.score.toFixed(1)}. Reiniciando…`;
    resetGame();
  }

  updateModelViz(model, state);
  requestAnimationFrame(() => playLoop(model));
}

function startPlaying(model) {
  const uploadSection = document.getElementById("upload-section");
  const playContainer = document.getElementById("play-container");
  if (uploadSection) uploadSection.hidden = true;
  if (playContainer) {
    playContainer.hidden = false;
    document.body.classList.remove("show-upload");
  }

  modelCanvas = document.getElementById("model-canvas");
  chartCanvas = document.getElementById("chart-canvas");
  probFill = document.getElementById("prob-fill");

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
