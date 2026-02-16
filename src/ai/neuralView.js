/**
 * Visualización gráfica de la red neuronal en un canvas.
 */

/** Etiquetas junto a cada nodo de entrada */
const INPUT_LABELS_SHORT = [
  "1. Dist. obstáculo",
  "2. Velocidad Y",
  "3. En suelo",
  "4. Ancho obst.",
  "5. Altura obst.",
  "6. Dist. suelo obst.",
];

const PADDING = 32;
const NODE_RADIUS = 14;
const MAX_LINE_WIDTH = 2;

/**
 * Dibuja la red neuronal en el canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} debug - salida de forwardDebug(brain, inputs)
 * @param {number} playerIndex
 * @param {number} score
 * @param {number} gen
 */
export function drawNeuralNetwork(canvas, debug) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);

  if (!debug) {
    ctx.fillStyle = "#64748b";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No hay jugadores vivos", w / 2, h / 2);
    return;
  }

  const { inputs, hidden, output } = debug;

  const layers = [
    { nodes: inputs.length, values: inputs, labels: INPUT_LABELS_SHORT, color: "#22d3ee" },
    { nodes: hidden.length, values: hidden.map((n) => n.postActivation), labels: null, color: "#a78bfa" },
    { nodes: 1, values: [output.postActivation], labels: ["Saltar"], color: "#4ade80" },
  ];

  const cols = 3;
  const usableW = w - 2 * PADDING - 120;
  const usableH = h - 2 * PADDING - 40;
  const positions = [];
  for (let col = 0; col < cols; col++) {
    const layer = layers[col];
    const x = PADDING + 50 + (col / (cols - 1)) * usableW;
    const n = layer.nodes;
    const minStep = col === 0 ? 38 : 0;
    const stepY = n > 1 ? Math.max(usableH / (n - 1), minStep) : 0;
    const startY = PADDING + 14 + (n > 1 ? 0 : usableH / 2);
    const rowPos = [];
    for (let row = 0; row < n; row++) {
      const y = startY + (n > 1 ? row * stepY : 0);
      rowPos.push({ x, y });
    }
    positions.push(rowPos);
  }

  const brain = debug._brain;
  if (brain) {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 0.8;
    for (let j = 0; j < inputs.length; j++) {
      for (let i = 0; i < hidden.length; i++) {
        const w1 = brain.W1[i][j];
        const alpha = Math.min(1, Math.abs(w1) / 2);
        ctx.strokeStyle = w1 >= 0 ? `rgba(34, 197, 94, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
        ctx.lineWidth = 0.5 + Math.min(MAX_LINE_WIDTH, Math.abs(w1) / 1.5);
        ctx.beginPath();
        ctx.moveTo(positions[0][j].x + NODE_RADIUS, positions[0][j].y);
        ctx.lineTo(positions[1][i].x - NODE_RADIUS, positions[1][i].y);
        ctx.stroke();
      }
    }
    for (let j = 0; j < hidden.length; j++) {
      const w2 = brain.W2[0][j];
      const alpha = Math.min(1, Math.abs(w2) / 2);
      ctx.strokeStyle = w2 >= 0 ? `rgba(34, 197, 94, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = 0.5 + Math.min(MAX_LINE_WIDTH, Math.abs(w2) / 1.5);
      ctx.beginPath();
      ctx.moveTo(positions[1][j].x + NODE_RADIUS, positions[1][j].y);
      ctx.lineTo(positions[2][0].x - NODE_RADIUS, positions[2][0].y);
      ctx.stroke();
    }
  }

  for (let col = 0; col < cols; col++) {
    const layer = layers[col];
    const pos = positions[col];
    for (let row = 0; row < layer.nodes; row++) {
      const { x, y } = pos[row];
      const val = layer.values[row];
      const intensity = typeof val === "number" ? Math.max(0, Math.min(1, val)) : 0.5;
      const alpha = 0.4 + 0.6 * intensity;
      ctx.fillStyle = layer.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      const text = typeof val === "number" ? val.toFixed(2) : String(val);
      ctx.fillStyle = "#fff";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);

      if (layer.labels && layer.labels[row]) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const labelY = y + NODE_RADIUS + 4;
        ctx.fillText(layer.labels[row], x, labelY);
      }
    }
  }

}
