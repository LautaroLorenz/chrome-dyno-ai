/**
 * Entrenamiento de la IA con TensorFlow.js.
 * Usa REINFORCE (policy gradient) para aprender a jugar.
 */
import { step, getState, resetGame, render } from "./env.js";

const STATE_SIZE = 4;
const HIDDEN_SIZE = 32;
const LEARNING_RATE = 0.001;
const MODEL_DOWNLOAD_PREFIX = "dino-ai-model";
const GAMMA = 0.99;
const EXPLORATION_START = 0.3;
const EXPLORATION_DECAY = 0.995;
const EXPLORATION_MIN = 0.05;
const SCORE_HISTORY_LENGTH = 100;

let model;
let optimizer;
let episode = 0;
let bestScore = 0;
let exploration = EXPLORATION_START;
let scoreHistory = [];

const episodeData = {
  states: [],
  actions: [],
  rewards: [],
};

const modelCanvas = document.getElementById("model-canvas");
const chartCanvas = document.getElementById("chart-canvas");
const probFill = document.getElementById("prob-fill");

function createModel() {
  model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [STATE_SIZE],
        units: HIDDEN_SIZE,
        activation: "relu",
      }),
      tf.layers.dense({ units: HIDDEN_SIZE, activation: "relu" }),
      tf.layers.dense({ units: 1, activation: "sigmoid" }),
    ],
  });
  optimizer = tf.train.adam(LEARNING_RATE);
  return model;
}

function getJumpProbability(state) {
  if (!model) return 0;
  const stateTensor = tf.tensor2d([state]);
  const prob = model.predict(stateTensor);
  const val = prob.dataSync()[0];
  stateTensor.dispose();
  prob.dispose();
  return val;
}

function getActivations(state) {
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

function getAction(state, explore = true) {
  const shouldExplore = explore && Math.random() < exploration;
  if (shouldExplore) {
    return Math.random() < 0.5 ? 0 : 1;
  }

  const probVal = getJumpProbability(state);
  return Math.random() < probVal ? 1 : 0;
}

function computeReturns(rewards) {
  const returns = [];
  let G = 0;
  for (let i = rewards.length - 1; i >= 0; i--) {
    G = rewards[i] + GAMMA * G;
    returns.unshift(G);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std =
    Math.sqrt(
      returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    ) || 1;
  return returns.map((r) => (r - mean) / std);
}

function trainOnEpisode() {
  if (episodeData.states.length === 0) return;

  const returns = computeReturns(episodeData.rewards);
  const states = tf.tensor2d(episodeData.states);
  const actions = tf.tensor1d(episodeData.actions, "float32");
  const returnsTensor = tf.tensor1d(returns);

  optimizer.minimize(() =>
    tf.tidy(() => {
      const probs = model.predict(states).squeeze();
      const eps = 1e-7;
      const safeProbs = tf.clipByValue(probs, eps, 1 - eps);

      const logProbJump = tf.log(safeProbs);
      const logProbNoJump = tf.log(tf.sub(1, safeProbs));
      const logProbs = tf.add(
        tf.mul(actions, logProbJump),
        tf.mul(tf.sub(1, actions), logProbNoJump)
      );

      return tf.neg(tf.mean(tf.mul(logProbs, returnsTensor)));
    })
  );

  states.dispose();
  actions.dispose();
  returnsTensor.dispose();
}

function updateStats(score) {
  document.getElementById("episode").textContent = episode;
  document.getElementById("best").textContent = bestScore.toFixed(1);
  document.getElementById("score").textContent = score.toFixed(1);
}

function drawModelViz(state) {
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

  const layers = [4, 12, 12, 1];
  const inputLabels = ["Dist", "Alt", "Vel", "Suelo"];
  const outputLabel = "P(saltar)";
  const layerGap = cw / (layers.length + 1);
  const nodeRadius = 6;
  const nodes = layers.map((n, i) => {
    const x = layerGap * (i + 1);
    const nodeGap = ch / (n + 1);
    return Array.from({ length: n }, (_, j) => ({
      x,
      y: nodeGap * (j + 1),
    }));
  });

  const activations = state ? getActivations(state) : null;

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

    drawConnections(0, 1, Array.from(weights0), 4, 12, 4, HIDDEN_SIZE);
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
            ctx.fillText(
              `${inputLabels[ni]} ${formatVal(val)}`,
              node.x - nodeRadius - 6,
              node.y
            );
          } else if (li === layers.length - 1) {
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(
              `${outputLabel} ${formatVal(val)}`,
              node.x + nodeRadius + 6,
              node.y
            );
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

function updateModelViz(state) {
  const prob = getJumpProbability(state);
  if (probFill) probFill.style.width = `${prob * 100}%`;
  drawModelViz(state);
  drawScoreChart();
}

function trainLoop() {
  const state = getState();
  const action = getAction(state);

  episodeData.states.push([...state]);
  episodeData.actions.push(action);

  const result = step(action);
  episodeData.rewards.push(result.reward);

  render();
  updateStats(result.score);
  updateModelViz(state);

  if (result.done) {
    if (result.score > bestScore) {
      bestScore = result.score;
    }
    scoreHistory.push(result.score);
    if (scoreHistory.length > SCORE_HISTORY_LENGTH) {
      scoreHistory.shift();
    }
    trainOnEpisode();
    episodeData.states = [];
    episodeData.actions = [];
    episodeData.rewards = [];
    exploration = Math.max(EXPLORATION_MIN, exploration * EXPLORATION_DECAY);
    episode++;
    resetGame();
  }

  requestAnimationFrame(trainLoop);
}

/**
 * Descarga el modelo actual como model.json + archivo de pesos (para subir en play-ia).
 */
function downloadModelAsFiles(modelArtifacts) {
  const weightsFileName = `${MODEL_DOWNLOAD_PREFIX}.weights.bin`;
  const modelJSON = {
    modelTopology: modelArtifacts.modelTopology,
    weightsManifest: [
      { paths: ["./" + weightsFileName], weights: modelArtifacts.weightSpecs },
    ],
  };
  const jsonBlob = new Blob([JSON.stringify(modelJSON)], {
    type: "application/json",
  });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const a1 = document.createElement("a");
  a1.href = jsonUrl;
  a1.download = "model.json";
  a1.click();
  URL.revokeObjectURL(jsonUrl);

  if (modelArtifacts.weightData) {
    const weightsBlob = new Blob([modelArtifacts.weightData], {
      type: "application/octet-stream",
    });
    const weightsUrl = URL.createObjectURL(weightsBlob);
    const a2 = document.createElement("a");
    a2.href = weightsUrl;
    a2.download = weightsFileName;
    a2.click();
    URL.revokeObjectURL(weightsUrl);
  }
}

async function downloadModel() {
  if (!model) return;
  const btn = document.getElementById("btn-download-model");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Descargando…";
  }
  try {
    const handler = {
      save: async (modelArtifacts) => {
        downloadModelAsFiles(modelArtifacts);
        return { modelArtifactsInfo: {} };
      },
    };
    await model.save(handler);
    if (btn) {
      btn.textContent = "Descargado ✓";
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "Descargar modelo";
      }, 1500);
    }
  } catch (err) {
    console.error("Error al descargar el modelo:", err);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Descargar modelo";
    }
  }
}

async function init() {
  await tf.ready();
  createModel();
  resetGame();
  trainLoop();

  const btnDownload = document.getElementById("btn-download-model");
  if (btnDownload) btnDownload.addEventListener("click", downloadModel);
}

init();
