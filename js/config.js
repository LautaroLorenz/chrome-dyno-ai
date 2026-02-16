const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const groundLevel = canvas.height - 20;
const FPS = 60;

export { canvas, ctx, groundLevel, FPS };
