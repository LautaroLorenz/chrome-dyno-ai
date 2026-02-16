const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Cuadrado (jugador)
const player = {
  x: 80,
  y: canvas.height - 60,
  size: 40,
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -14,
  groundY: canvas.height - 60
};

// Triángulos (obstáculos)
const obstacles = [];
const obstacleSpeed = 5;
const obstacleSpawnInterval = 1500;
let lastSpawnTime = 0;
const groundLevel = canvas.height - 20; // Base del jugador = suelo

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (player.y >= player.groundY) {
      player.velocityY = player.jumpForce;
    }
  }
});

function spawnObstacle() {
  const size = 35;
  obstacles.push({
    x: canvas.width,
    y: groundLevel - size, // Base del triángulo alineada con el suelo
    width: size,
    height: size
  });
}

function updateObstacles() {
  const now = Date.now();
  if (now - lastSpawnTime > obstacleSpawnInterval) {
    spawnObstacle();
    lastSpawnTime = now;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacleSpeed;
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
    }
  }
}

function drawObstacle(obs) {
  ctx.fillStyle = '#0f3460';
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(obs.x + obs.width / 2, obs.y);
  ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
  ctx.lineTo(obs.x, obs.y + obs.height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function updatePlayer() {
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.velocityY = 0;
  }
}

function drawPlayer() {
  ctx.fillStyle = '#e94560';
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  updateObstacles();
  drawPlayer();
  obstacles.forEach(drawObstacle);

  requestAnimationFrame(gameLoop);
}

gameLoop();
