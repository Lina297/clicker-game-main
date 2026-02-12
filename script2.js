const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const root = document.documentElement;

// --- CONFIG ---
const gridSize = 40; 
const tileCount = canvas.width / gridSize;
const gameSpeed = 130; 

// --- AUDIO ---
const sounds = {
    up: new Audio('./sounds/up.mp3'),
    down: new Audio('./sounds/down.mp3'),
    left: new Audio('./sounds/left.mp3'),
    right: new Audio('./sounds/right.mp3'),
    death: new Audio('./sounds/death.mp3'),
    eat: new Audio('./sounds/eat.mp3') 
};

// --- STATE ---
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let snake = [];
let food = { x: 5, y: 5 };
let velocity = { x: 0, y: 0 };
let inputQueue = [];
let lastTime = 0;
let timeAccumulator = 0;
let isGameRunning = false;
let animationId;

// --- DOM ---
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const menuOverlay = document.getElementById('menu-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const themeDots = document.querySelectorAll('.theme-dot');

// --- INIT ---
highScoreEl.innerText = highScore;

// --- LISTENERS ---
window.addEventListener('keydown', handleInput);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', showMainMenu);

themeDots.forEach(btn => {
    btn.addEventListener('click', (e) => {
        themeDots.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const theme = e.target.getAttribute('data-theme');
        root.setAttribute('data-theme', theme);
        if (!isGameRunning) draw();
    });
});

// --- LOGIC ---

function startGame() {
    score = 0;
    scoreEl.innerText = score;
    isGameRunning = true;
    
    snake = [
        { x: 7, y: 10 },
        { x: 7, y: 11 },
        { x: 7, y: 12 }
    ];
    
    velocity = { x: 0, y: -1 }; 
    inputQueue = [];
    
    placeFood();
    
    menuOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    
    lastTime = performance.now();
    timeAccumulator = 0;
    
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

function showMainMenu() {
    isGameRunning = false;
    cancelAnimationFrame(animationId);
    menuOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
    draw();
}

function gameOver() {
    isGameRunning = false;
    
    // Play death sound
    sounds.death.currentTime = 0;
    sounds.death.play().catch(e => {});

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    finalScoreEl.innerText = score;
    gameOverOverlay.classList.remove('hidden');
    draw();
}

function gameLoop(currentTime) {
    if (!isGameRunning) return;

    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (deltaTime > 200) deltaTime = 200;
    timeAccumulator += deltaTime;

    while (timeAccumulator >= gameSpeed) {
        update();
        timeAccumulator -= gameSpeed;
    }

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    if (inputQueue.length > 0) {
        const nextDir = inputQueue.shift();
        const oppositeX = nextDir.x === -velocity.x;
        const oppositeY = nextDir.y === -velocity.y;
        
        if (!oppositeX && !oppositeY) {
            velocity = nextDir;
        }
    }

    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self-collision
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Food
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.innerText = score;
        
        // Play eat sound
        sounds.eat.currentTime = 0;
        sounds.eat.play().catch(e => {});
        
        placeFood();
    } else {
        snake.pop();
    }
}

function handleInput(e) {
    if (!isGameRunning) return;
    
    // Prevent scrolling
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyS","KeyA","KeyD"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    let newDir = null;
    let soundToPlay = null;

    switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': 
            newDir = { x: 0, y: -1 }; 
            soundToPlay = sounds.up;
            break;
        case 'arrowdown': case 's': 
            newDir = { x: 0, y: 1 }; 
            soundToPlay = sounds.down;
            break;
        case 'arrowleft': case 'a': 
            newDir = { x: -1, y: 0 }; 
            soundToPlay = sounds.left;
            break;
        case 'arrowright': case 'd': 
            newDir = { x: 1, y: 0 }; 
            soundToPlay = sounds.right;
            break;
    }

    if (newDir && inputQueue.length < 2) {
        // Reset sound to start and play
        if (soundToPlay) {
            soundToPlay.currentTime = 0;
            soundToPlay.play().catch(e => {}); 
        }
        inputQueue.push(newDir);
    }
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        valid = !snake.some(p => p.x === food.x && p.y === food.y);
    }
}

// --- RENDER ---

function draw() {
    const styles = getComputedStyle(root);
    const tile1 = styles.getPropertyValue('--tile-1').trim();
    const tile2 = styles.getPropertyValue('--tile-2').trim();
    const snakeColor = styles.getPropertyValue('--snake-color').trim();
    const foodColor = styles.getPropertyValue('--food-color').trim();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? tile1 : tile2;
            ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
    }

    drawApple(food.x, food.y, gridSize, foodColor);

    for (let i = snake.length - 1; i >= 0; i--) {
        const part = snake[i];
        const isHead = (i === 0);
        const gap = 2;
        const size = gridSize - (gap * 2);
        const x = part.x * gridSize + gap;
        const y = part.y * gridSize + gap;

        ctx.fillStyle = snakeColor;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 10);
        ctx.fill();

        if (isHead) {
            drawFace(x, y, size, velocity);
        }
    }
}

function drawFace(x, y, size, dir) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    
    // Tongue
    ctx.strokeStyle = "#ff5252"; 
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    let tx = cx + (dir.x * size * 0.8);
    let ty = cy + (dir.y * size * 0.8);
    ctx.lineTo(tx, ty);
    
    if (dir.x !== 0) { 
        ctx.lineTo(tx + (dir.x * 5), ty - 5);
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + (dir.x * 5), ty + 5);
    } else { 
        ctx.lineTo(tx - 5, ty + (dir.y * 5));
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + 5, ty + (dir.y * 5));
    }
    ctx.stroke();

    // Eyes
    let e1x, e1y, e2x, e2y;
    let shift = size / 4;
    const eyeSize = size / 3.5;
    const pupilSize = eyeSize / 2.5;

    if (dir.y === -1) { 
        e1x = cx - shift; e1y = cy - shift;
        e2x = cx + shift; e2y = cy - shift;
    } else if (dir.y === 1) { 
        e1x = cx - shift; e1y = cy + shift;
        e2x = cx + shift; e2y = cy + shift;
    } else if (dir.x === -1) { 
        e1x = cx - shift; e1y = cy - shift;
        e2x = cx - shift; e2y = cy + shift;
    } else { 
        e1x = cx + shift; e1y = cy - shift;
        e2x = cx + shift; e2y = cy + shift;
    }

    ctx.fillStyle = "white"; 
    ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "black";
    let px = dir.x * 2; 
    let py = dir.y * 2;
    ctx.beginPath(); ctx.arc(e1x + px, e1y + py, pupilSize, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x + px, e2y + py, pupilSize, 0, Math.PI*2); ctx.fill();
}

function drawApple(x, y, size, color) {
    const cx = x * size + size / 2;
    const cy = y * size + size / 2;
    const radius = size / 2.5;

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius - 2, radius, radius/3, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(cx - radius/3, cy - radius/3, radius/3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius + 5);
    ctx.quadraticCurveTo(cx, cy - radius - 5, cx + 5, cy - radius - 8);
    ctx.stroke();

    ctx.fillStyle = '#6ab04c';
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy - radius - 2, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

draw();