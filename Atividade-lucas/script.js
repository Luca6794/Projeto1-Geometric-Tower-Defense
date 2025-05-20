// ========== MENU & SCREENS ==========
const screens = document.querySelectorAll('.screen');
function showScreen(id, overlay = false) {
  screens.forEach(s => s.classList.remove('active'));
  if (id === 'catalog' && overlay) {
    document.getElementById('catalogOverlay').style.display = 'block';
    renderCatalog('catalogOverlay');
    document.getElementById('game').classList.add('active');
  } else {
    document.getElementById('catalogOverlay').style.display = 'none';
    document.getElementById(id).classList.add('active');
    if (id === 'catalog') renderCatalog('catalogContent');
  }
}
function backToMenu() {
  showScreen('menu');
  stopGame();
}

// ========== GAME VARIABLES ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameInterval;
let gameState = {};
const map = {
  path: [
    {x: 60, y: 80}, {x: 160, y: 80}, {x: 160, y: 320}, {x: 400, y: 320},
    {x: 400, y: 150}, {x: 600, y: 150}, {x: 600, y: 440}, {x: 800, y: 440},
    {x: 900, y: 300}
  ],
  buildSpots: [
    {x: 120, y: 200}, {x: 240, y: 120}, {x: 300, y: 250}, {x: 500, y: 220},
    {x: 700, y: 220}, {x: 820, y: 380}, {x: 240, y: 380}, {x: 340, y: 420},
    {x: 540, y: 100}, {x: 740, y: 150}, {x: 840, y: 200}, {x: 100, y: 500},
    {x: 450, y: 500}, {x: 600, y: 340}, {x: 680, y: 420}
  ]
};
// ========== CUBE/TOWER & UPGRADE DATA ==========
const cubeTypes = [
  {
    name: "Arqueiro",
    desc: "Atira flechas rápidas. Bom contra inimigos leves.",
    cost: 80,
    color: "#3bc34a",
    damage: 25,
    rate: 0.75,
    range: 120,
    upgrades: [
      { name: "Besteiro", cost: 160, desc: "Flechas perfuram inimigos. +dano." },
      { name: "Sniper", cost: 240, desc: "Alcance enorme, dano alto, cadência baixa." }
    ]
  },
  {
    name: "Mago",
    desc: "Lança magias em área.",
    cost: 120,
    color: "#3a7fd5",
    damage: 35,
    rate: 1.5,
    range: 100,
    upgrades: [
      { name: "Mago de Fogo", cost: 240, desc: "Causa queimadura. Bom contra chefes." },
      { name: "Mago de Gelo", cost: 240, desc: "Diminui velocidade dos inimigos." }
    ]
  },
  {
    name: "Veneno",
    desc: "Envenena inimigos causando dano ao longo do tempo.",
    cost: 100,
    color: "#bada55",
    damage: 15,
    rate: 1.0,
    range: 110,
    upgrades: [
      { name: "Corrosão", cost: 200, desc: "Ignora resistência, dano aumentado." },
      { name: "Decomposição", cost: 200, desc: "Espalha veneno para inimigos próximos." }
    ]
  },
  {
    name: "Canhão",
    desc: "Explosões de área, dano alto, recarga lenta.",
    cost: 150,
    color: "#da4636",
    damage: 50,
    rate: 2.8,
    range: 90,
    upgrades: [
      { name: "Catapulta", cost: 300, desc: "Área maior, dano em grupo." },
      { name: "Balista", cost: 300, desc: "Projéteis atravessam vários inimigos." }
    ]
  }
];

// ========== ENEMY DATA ==========
const enemyTypes = [
  // 20 tipos geométricos, diferentes cores, status e resistências
  // Exemplo:
  { name: "Quadrado", color: "#fff", shape: "square", size: 32, hp: 60, speed: 1.2, res: { arqueiro: 0, mago: 0, veneno: 0, canhao: 0 }, weak: "veneno" },
  { name: "Triângulo", color: "#ff0", shape: "triangle", size: 30, hp: 30, speed: 2, res: { arqueiro: -0.5, mago: 0, veneno: 0, canhao: 0 }, weak: "arqueiro" },
  { name: "Círculo", color: "#0ff", shape: "circle", size: 28, hp: 40, speed: 1.7, res: { arqueiro: 0, mago: -0.5, veneno: 0, canhao: 0 }, weak: "mago" },
  { name: "Hexágono", color: "#f0f", shape: "hexagon", size: 40, hp: 80, speed: 1, res: { arqueiro: 0, mago: 0, veneno: -0.5, canhao: 0 }, weak: "veneno" },
  { name: "Pentágono", color: "#fa0", shape: "pentagon", size: 36, hp: 70, speed: 1.3, res: { arqueiro: 0, mago: 0, veneno: 0, canhao: -0.5 }, weak: "canhao" },
  { name: "Paralelogramo", color: "#0fa", shape: "parallelogram", size: 32, hp: 50, speed: 1.4, res: { arqueiro: 0.3, mago: 0, veneno: 0, canhao: 0 }, weak: "mago" },
  { name: "Trapézio", color: "#aaf", shape: "trapezoid", size: 35, hp: 65, speed: 1.1, res: { arqueiro: 0, mago: 0, veneno: 0.5, canhao: 0 }, weak: "canhao" },
  { name: "Octógono", color: "#faa", shape: "octagon", size: 45, hp: 100, speed: 0.9, res: { arqueiro: 0.5, mago: 0.2, veneno: 0, canhao: 0 }, weak: "veneno" },
  { name: "Retângulo", color: "#aff", shape: "rectangle", size: 36, hp: 60, speed: 1.1, res: { arqueiro: 0, mago: 0, veneno: 0, canhao: 0.3 }, weak: "arqueiro" },
  { name: "Estrela", color: "#ee0", shape: "star", size: 40, hp: 55, speed: 1.7, res: { arqueiro: 0.2, mago: 0, veneno: 0, canhao: -0.3 }, weak: "canhao" },
  { name: "Cubo", color: "#fff", shape: "cube", size: 32, hp: 65, speed: 1.2, res: { arqueiro: 0, mago: 0.5, veneno: 0, canhao: 0 }, weak: "veneno" },
  { name: "Cilindro", color: "#8cf", shape: "cylinder", size: 32, hp: 70, speed: 1.0, res: { arqueiro: 0, mago: 0, veneno: 0, canhao: 0 }, weak: "arqueiro" },
  { name: "Cone", color: "#f8c", shape: "cone", size: 34, hp: 55, speed: 1.5, res: { arqueiro: 0, mago: -0.5, veneno: 0, canhao: 0 }, weak: "mago" },
  { name: "Prisma", color: "#cfa", shape: "prism", size: 38, hp: 90, speed: 0.95, res: { arqueiro: 0, mago: 0, veneno: 0, canhao: 0.5 }, weak: "veneno" },
  { name: "Pirâmide", color: "#ffd700", shape: "pyramid", size: 36, hp: 60, speed: 1.4, res: { arqueiro: 0, mago: 0, veneno: 0.3, canhao: 0 }, weak: "arqueiro" },
  { name: "Dodecágono", color: "#fd0", shape: "dodecagon", size: 46, hp: 120, speed: 0.85, res: { arqueiro: 0.3, mago: 0, veneno: 0, canhao: 0 }, weak: "mago" },
  { name: "Toro", color: "#b33", shape: "torus", size: 38, hp: 110, speed: 1.1, res: { arqueiro: 0, mago: 0, veneno: 0.5, canhao: 0 }, weak: "canhao" },
  { name: "Cruz", color: "#ccc", shape: "cross", size: 40, hp: 80, speed: 1.2, res: { arqueiro: 0, mago: 0.7, veneno: 0, canhao: 0 }, weak: "veneno" },
  { name: "Coração", color: "#f55", shape: "heart", size: 40, hp: 90, speed: 1.15, res: { arqueiro: 0, mago: 0, veneno: 0, canhao: 0 }, weak: "mago" },
  { name: "Diamante", color: "#0ff", shape: "diamond", size: 34, hp: 70, speed: 1.3, res: { arqueiro: 0, mago: 0, veneno: 0, canhao: -0.5 }, weak: "canhao" }
];
// Bosses
const bossTypes = [
  { name: "Hexa Boss", color: "#e33", shape: "hexagon", size: 60, hp: 800, speed: 0.7, res: { arqueiro: 0.5, mago: 0.5, veneno: 0.5, canhao: 0.5 }, weak: "mago" },
  { name: "Mega Prisma", color: "#3e3", shape: "prism", size: 80, hp: 1200, speed: 0.55, res: { arqueiro: 0.3, mago: 0.3, veneno: 0.3, canhao: 0.3 }, weak: "canhao" },
  { name: "Ultra Cubo", color: "#fff", shape: "cube", size: 92, hp: 2200, speed: 0.4, res: { arqueiro: 0.7, mago: 0.7, veneno: 0.7, canhao: 0.7 }, weak: "veneno" }
];

// ========== GAME LOGIC ==========
function startGame() {
  gameState = {
    phase: 1,
    life: 20,
    money: 200,
    cubes: [],
    enemies: [],
    bullets: [],
    cooldown: 0,
    cubeLimit: 15,
    placingCube: null,
    buildSpots: map.buildSpots.map(s => ({...s, occupied: false})),
    spawnTimer: 0,
    enemiesLeft: 0,
    wave: [],
    bossesSpawned: 0,
    running: true
  };
  showScreen('game');
  spawnWave();
  updateUI();
  gameInterval = setInterval(gameLoop, 1000/60);
  canvas.onclick = handleCanvasClick;
  canvas.onmousemove = handleCanvasMouse;
}
function stopGame() {
  clearInterval(gameInterval);
  canvas.onclick = null;
  canvas.onmousemove = null;
}
function updateUI() {
  document.getElementById("phaseInfo").textContent = `Fase: ${gameState.phase}/30`;
  document.getElementById("lifeInfo").textContent = `Vidas: ${gameState.life}`;
  document.getElementById("moneyInfo").textContent = `Dinheiro: ${gameState.money}`;
  document.getElementById("cubeLimitInfo").textContent = `Cubos: ${gameState.cubes.length}/${gameState.cubeLimit}`;
}
function nextPhase() {
  if (gameState.phase >= 30) {
    alert('Parabéns! Você venceu o Cube Tower Defense!');
    stopGame();
    showScreen('menu');
    return;
  }
  gameState.phase++;
  spawnWave();
  updateUI();
}
function spawnWave() {
  let enemiesToSpawn = 10 + Math.floor(gameState.phase * 0.8);
  let wave = [];
  for (let i = 0; i < enemiesToSpawn; i++) {
    let t = enemyTypes[(gameState.phase + i) % enemyTypes.length];
    wave.push({ ...t });
  }
  // Bosses: fase 10, 20 e 30
  if ([10,20,30].includes(gameState.phase)) {
    let boss = bossTypes[Math.floor(gameState.phase/10)-1];
    wave.push({ ...boss });
  }
  gameState.wave = wave;
  gameState.enemiesLeft = wave.length;
  gameState.spawnTimer = 0;
}
function gameLoop() {
  if (!gameState.running) return;
  update();
  draw();
}
function update() {
  // Spawn enemies
  if (gameState.wave.length > 0 && gameState.enemies.length < 7) {
    if (gameState.spawnTimer <= 0) {
      let type = gameState.wave.shift();
      gameState.enemies.push(createEnemy(type));
      gameState.spawnTimer = 60;
    } else {
      gameState.spawnTimer--;
    }
  }
  // Update enemies
  gameState.enemies.forEach(e => updateEnemy(e));
  // Remove mortos/chegaram ao fim
  gameState.enemies = gameState.enemies.filter(e => {
    if (e.hp <= 0) {
      gameState.money += Math.floor(e.maxHp/6);
      updateUI();
      return false;
    }
    if (e.progress >= 1) {
      gameState.life--;
      updateUI();
      if (gameState.life <= 0) {
        alert('Game Over! Você perdeu todas as vidas...');
        stopGame();
        showScreen('menu');
        return false;
      }
      return false;
    }
    return true;
  });
  // Update cubes/attack
  for (const c of gameState.cubes) {
    c.cooldown = Math.max(0, c.cooldown - 1/60);
    if (c.cooldown <= 0) {
      let targets = gameState.enemies.filter(e => dist(c, e) < c.range);
      if (targets.length > 0) {
        let t = targets[0];
        shootCube(c, t);
        c.cooldown = c.rate;
      }
    }
  }
  // Update bullets
  gameState.bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
  });
  // Bullet hits
  for (const b of gameState.bullets) {
    for (const e of gameState.enemies) {
      if (!b.hit && dist(b, e) < e.size/2 + 6) {
        let mult = 1 + (e.weak === b.cubeType ? 0.5 : 0);
        let res = (e.res[b.cubeType] || 0);
        let dmg = b.damage * (1 + mult) * (1 - res);
        e.hp -= dmg;
        b.hit = true;
        if (b.effect === 'burn') e.burn = { t: 2, dps: 7 };
        if (b.effect === 'slow') e.slow = { t: 2, factor: 0.5 };
        if (b.effect === 'poison') e.poison = { t: 3, dps: 6 };
        break;
      }
    }
  }
  // Burn, poison
  for (const e of gameState.enemies) {
    if (e.burn) {
      e.hp -= e.burn.dps/60;
      e.burn.t -= 1/60;
      if (e.burn.t <= 0) e.burn = null;
    }
    if (e.poison) {
      e.hp -= e.poison.dps/60;
      e.poison.t -= 1/60;
      if (e.poison.t <= 0) e.poison = null;
    }
    if (e.slow) {
      e.slow.t -= 1/60;
      if (e.slow.t <= 0) e.slow = null;
    }
  }
  // Remove bullets
  gameState.bullets = gameState.bullets.filter(b => !b.hit && b.life > 0);
  // Wave ended?
  if (gameState.enemies.length === 0 && gameState.wave.length === 0) {
    // Próxima fase
    nextPhase();
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Draw path
  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(map.path[0].x, map.path[0].y);
  for (const p of map.path) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#333";
  ctx.stroke();
  // Build spots
  for (const s of gameState.buildSpots) {
    ctx.fillStyle = s.occupied ? "#666" : "#aaa";
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 28, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Cubes
  for (const c of gameState.cubes) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = c.color;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(c.short, 0, 5);
    ctx.restore();
    // Draw range when mouse over
    if (c.hover) {
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.range, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  // Enemies
  for (const e of gameState.enemies) {
    drawEnemy(e);
  }
  // Bullets
  for (const b of gameState.bullets) {
    ctx.save();
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  // Place cube preview
  if (gameState.placingCube !== null && gameState.placingCube >= 0) {
    let spot = gameState.buildSpots.find(s => dist(s, mouse) < 28 && !s.occupied);
    if (spot) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = cubeTypes[gameState.placingCube].color;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 22, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.color;
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 3;
  switch (e.shape) {
    case "square":
    case "cube":
      ctx.fillRect(-e.size/2, -e.size/2, e.size, e.size);
      ctx.strokeRect(-e.size/2, -e.size/2, e.size, e.size);
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -e.size/2);
      ctx.lineTo(e.size/2, e.size/2);
      ctx.lineTo(-e.size/2, e.size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(0,0,e.size/2,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();
      break;
    case "hexagon":
    case "octagon":
    case "dodecagon":
      let sides = e.shape === "hexagon" ? 6 : (e.shape === "octagon" ? 8 : 12);
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        let ang = (Math.PI * 2 / sides) * i;
        ctx.lineTo(Math.cos(ang) * e.size/2, Math.sin(ang) * e.size/2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "pentagon":
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        let ang = (Math.PI * 2 / 5) * i - Math.PI/2;
        ctx.lineTo(Math.cos(ang) * e.size/2, Math.sin(ang) * e.size/2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "star":
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        let ang = (Math.PI * 2 / 10) * i - Math.PI/2;
        let r = i % 2 === 0 ? e.size/2 : e.size/4;
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "rectangle":
      ctx.fillRect(-e.size/2, -e.size/3, e.size, e.size*2/3);
      ctx.strokeRect(-e.size/2, -e.size/3, e.size, e.size*2/3);
      break;
    case "parallelogram":
      ctx.beginPath();
      ctx.moveTo(-e.size/2+8, -e.size/2);
      ctx.lineTo(e.size/2, -e.size/2);
      ctx.lineTo(e.size/2-8, e.size/2);
      ctx.lineTo(-e.size/2, e.size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "trapezoid":
      ctx.beginPath();
      ctx.moveTo(-e.size/3, -e.size/2);
      ctx.lineTo(e.size/3, -e.size/2);
      ctx.lineTo(e.size/2, e.size/2);
      ctx.lineTo(-e.size/2, e.size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "prism":
      ctx.beginPath();
      ctx.moveTo(-e.size/2, e.size/2);
      ctx.lineTo(-e.size/4, -e.size/2);
      ctx.lineTo(e.size/4, -e.size/2);
      ctx.lineTo(e.size/2, e.size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "pyramid":
      ctx.beginPath();
      ctx.moveTo(0, -e.size/2);
      ctx.lineTo(e.size/2, e.size/2);
      ctx.lineTo(-e.size/2, e.size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "cylinder":
      ctx.beginPath();
      ctx.ellipse(0, 0, e.size/2, e.size/3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case "cone":
      ctx.beginPath();
      ctx.moveTo(0, -e.size/2);
      ctx.lineTo(e.size/2, e.size/2);
      ctx.lineTo(-e.size/2, e.size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "torus":
      ctx.beginPath();
      ctx.arc(0, 0, e.size/2, 0, Math.PI*2);
      ctx.arc(0, 0, e.size/3, 0, Math.PI*2, true);
      ctx.fill();
      ctx.stroke();
      break;
    case "cross":
      ctx.fillRect(-e.size/6, -e.size/2, e.size/3, e.size);
      ctx.fillRect(-e.size/2, -e.size/6, e.size, e.size/3);
      ctx.strokeRect(-e.size/6, -e.size/2, e.size/3, e.size);
      ctx.strokeRect(-e.size/2, -e.size/6, e.size, e.size/3);
      break;
    case "heart":
      ctx.beginPath();
      ctx.moveTo(0, -e.size/4);
      ctx.bezierCurveTo(e.size/2, -e.size/2, e.size/2, e.size/4, 0, e.size/2);
      ctx.bezierCurveTo(-e.size/2, e.size/4, -e.size/2, -e.size/2, 0, -e.size/4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -e.size/2);
      ctx.lineTo(e.size/2, 0);
      ctx.lineTo(0, e.size/2);
      ctx.lineTo(-e.size/2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }
  // HP bar
  ctx.fillStyle = "#000";
  ctx.fillRect(-e.size/2, -e.size/2-12, e.size, 7);
  ctx.fillStyle = "#2e2";
  ctx.fillRect(-e.size/2, -e.size/2-12, e.size * (e.hp / e.maxHp), 7);
  ctx.strokeStyle = "#222";
  ctx.strokeRect(-e.size/2, -e.size/2-12, e.size, 7);
  ctx.restore();
}

// ========== CUBES (TOWERS) ==========
function handleCanvasClick(ev) {
  let rect = canvas.getBoundingClientRect();
  let x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  if (gameState.placingCube !== null && gameState.placingCube >= 0) {
    let spot = gameState.buildSpots.find(s => dist(s, {x, y}) < 28 && !s.occupied);
    if (spot && gameState.money >= cubeTypes[gameState.placingCube].cost && gameState.cubes.length < gameState.cubeLimit) {
      // Place cube
      let ctype = cubeTypes[gameState.placingCube];
      let cube = {
        ...ctype,
        short: ctype.name[0],
        x: spot.x, y: spot.y,
        cooldown: 0,
        rate: ctype.rate,
        range: ctype.range,
        upgrade: null,
        color: ctype.color,
        cubeType: ctype.name.toLowerCase(),
        id: Math.random().toString(36).slice(2),
        hover: false
      };
      gameState.cubes.push(cube);
      spot.occupied = true;
      gameState.money -= ctype.cost;
      updateUI();
    }
    gameState.placingCube = null;
    return;
  }
  // Se clicou em uma torre: mostrar upgrade
  let c = gameState.cubes.find(c => dist(c, {x, y}) < 22);
  if (c && !c.upgrade) {
    let upgHtml = `<b>Upgrade para:</b><br>`;
    c.upgradeBtns = [];
    for (let i = 0; i < c.upgrades.length; i++) {
      let upg = c.upgrades[i];
      let price = upg.cost;
      upgHtml += `<button onclick="upgradeCube('${c.id}',${i})">${upg.name} (R$${price})</button> - ${upg.desc}<br>`;
    }
    showPopup(upgHtml, x, y);
    return;
  }
  hidePopup();
  // Se clicou em um spot vazio: abrir menu de cubos
  let spot = gameState.buildSpots.find(s => dist(s, {x, y}) < 28 && !s.occupied);
  if (spot) {
    showCubeMenu(x, y);
    return;
  }
}
function handleCanvasMouse(ev) {
  let rect = canvas.getBoundingClientRect();
  let x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  mouse.x = x; mouse.y = y;
  for (const c of gameState.cubes) {
    c.hover = dist(c, mouse) < 24;
  }
}
let mouse = { x: 0, y: 0 };

function showCubeMenu(x, y) {
  let html = `<b>Escolha um Cubo:</b><br>`;
  for (let i = 0; i < cubeTypes.length; i++) {
    let c = cubeTypes[i];
    html += `<button onclick="placeCube(${i})">${c.name} (R$${c.cost})</button> - ${c.desc}<br>`;
  }
  showPopup(html, x, y);
}
function placeCube(idx) {
  gameState.placingCube = idx;
  hidePopup();
}
window.placeCube = placeCube;

function upgradeCube(cubeId, upgIdx) {
  let c = gameState.cubes.find(c => c.id === cubeId);
  if (!c || c.upgrade) return;
  let upg = c.upgrades[upgIdx];
  let price = upg.cost;
  if (gameState.money >= price) {
    c.upgrade = upg.name;
    c.short = upg.name[0];
    c.damage *= 1.8;
    c.range *= 1.15;
    c.rate *= 0.8;
    c.color = c.color === "#3bc34a" ? (upgIdx === 0 ? "#bfe549" : "#5c8f4a")
           : c.color === "#3a7fd5" ? (upgIdx === 0 ? "#ff7100" : "#00cfff")
           : c.color === "#bada55" ? (upgIdx === 0 ? "#b26500" : "#c5ff99")
           : c.color === "#da4636" ? (upgIdx === 0 ? "#c0c0c0" : "#ff4e5e")
           : "#fff";
    if (c.upgrade === "Mago de Fogo") c.effect = "burn";
    if (c.upgrade === "Mago de Gelo") c.effect = "slow";
    if (c.upgrade === "Corrosão" || c.upgrade === "Decomposição") c.effect = "poison";
    gameState.money -= price;
    updateUI();
  }
  hidePopup();
}
window.upgradeCube = upgradeCube;

// ========== CUBE SHOOTING ==========
function shootCube(cube, target) {
  let dx = target.x - cube.x, dy = target.y - cube.y;
  let dist2 = Math.sqrt(dx*dx+dy*dy);
  let speed = 7;
  let bullet = {
    x: cube.x,
    y: cube.y,
    vx: dx/dist2*speed,
    vy: dy/dist2*speed,
    color: cube.color,
    cubeType: cube.cubeType,
    damage: cube.damage,
    effect: cube.effect,
    life: 80,
    hit: false
  };
  gameState.bullets.push(bullet);
}

// ========== ENEMY MOVEMENT ==========
function createEnemy(type) {
  let e = {
    ...type,
    x: map.path[0].x, y: map.path[0].y,
    progress: 0,
    maxHp: type.hp
  };
  return e;
}
function updateEnemy(e) {
  // Percorre o caminho
  let speed = e.speed;
  if (e.slow) speed *= e.slow.factor;
  let distTotal = 0, path = map.path;
  for (let i = 1; i < path.length; i++) {
    distTotal += distance(path[i-1], path[i]);
  }
  e.progress += (speed / distTotal) / 60;
  let prog = e.progress * distTotal;
  let curr = 0;
  for (let i = 1; i < path.length; i++) {
    let seg = distance(path[i-1], path[i]);
    if (curr + seg > prog) {
      let t = (prog - curr) / seg;
      e.x = path[i-1].x + (path[i].x - path[i-1].x) * t;
      e.y = path[i-1].y + (path[i].y - path[i-1].y) * t;
      break;
    }
    curr += seg;
  }
}

// ========== HELPER FUNCTIONS ==========
function distance(a, b) {
  return Math.hypot(a.x-b.x, a.y-b.y);
}
function dist(a, b) {
  return Math.hypot(a.x-b.x, a.y-b.y);
}

// ========== POPUP ==========
let popupDiv;
function showPopup(html, x, y) {
  if (!popupDiv) {
    popupDiv = document.createElement('div');
    document.body.appendChild(popupDiv);
    popupDiv.style.position = "fixed";
    popupDiv.style.zIndex = 999;
    popupDiv.style.background = "#23272e";
    popupDiv.style.color = "#fff";
    popupDiv.style.padding = "16px";
    popupDiv.style.borderRadius = "10px";
    popupDiv.style.boxShadow = "2px 4px 16px #000a";
    popupDiv.style.maxWidth = "350px";
  }
  popupDiv.innerHTML = html;
  popupDiv.style.display = "block";
  popupDiv.style.left = (canvas.offsetLeft + x - 10) + "px";
  popupDiv.style.top = (canvas.offsetTop + y + 60) + "px";
}
function hidePopup() {
  if (popupDiv) popupDiv.style.display = "none";
}
document.body.onclick = function(ev) {
  if (popupDiv && popupDiv.style.display === "block") {
    if (!popupDiv.contains(ev.target)) hidePopup();
  }
};

// ========== CATALOG ==========
function renderCatalog(where) {
  let html = `<h3>Cubos (Torres)</h3>`;
  for (const c of cubeTypes) {
    html += `<b>${c.name}</b>: ${c.desc}<br>Preço: R$${c.cost}<br>`;
    html += `Upgrades:<ul>`;
    for (const upg of c.upgrades) {
      html += `<li><b>${upg.name}</b>: ${upg.desc} (R$${upg.cost})</li>`;
    }
    html += `</ul>`;
  }
  html += `<hr><h3>Inimigos</h3>`;
  for (const e of enemyTypes.concat(bossTypes)) {
    html += `<b>${e.name}</b> (Forma: ${e.shape})<br>Vida: ${e.hp} | Vel: ${e.speed} | Tamanho: ${e.size}<br>`;
    html += `Resistências: `;
    for (const k in e.res) {
      if (e.res[k] !== 0) html += `${k} ${e.res[k]>0?'+':''}${Math.round(e.res[k]*100)}%, `;
    }
    html += `Fraqueza: <b>${e.weak||'-'}</b><br><br>`;
  }
  document.getElementById(where).innerHTML = html;
}

// ========== START ==========
document.querySelector('button[onclick="showScreen(\'game\')"]').onclick = startGame;

// Início na tela de menu
showScreen('menu');
