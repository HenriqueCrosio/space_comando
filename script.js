const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');

let gameActive = false;
let score = 0;
let gameSpeed = 0.8;
let gameTime = 0;
let lastBossTime = 0;
let lastTimestamp;

// Carregamento das imagens
const playerImage = new Image();
playerImage.src = 'images/ship.gif';
const enemyImage = new Image();
enemyImage.src = 'images/enemy.png';
const invaderImage = new Image();
invaderImage.src = 'images/invader.png';
const bossImage = new Image();
bossImage.src = 'images/boss.png';

// Carregamento dos sons
const backgroundMusic = new Audio('sounds/8bit.mp3');
backgroundMusic.loop = true;
const laserSound = new Audio('sounds/lasershoot.mp3');

// Variáveis do jogador
let playerX = canvas.width / 2;
let playerY = canvas.height - 120;
let playerWidth = 80;
let playerHeight = 80;
let playerSpeed = 5;
let playerVelocity = 0;
const playerAcceleration = 1.1;
const playerMaxSpeed = 20;
const playerFriction = 0.98;

// Variáveis dos inimigos
let enemies = [];
let enemyWidth = 40;
let enemyHeight = 40;
let invaderWidth = 38; // Aumentado em 1px
let invaderHeight = 38; // Aumentado em 1px
let bossWidth = 100;
let bossHeight = 100;

// Variáveis dos lasers
let lasers = [];
let enemyLasers = [];
const laserWidth = 4;
const laserHeight = 20;
const laserSpeed = 10;
const enemyLaserSpeed = 2;
const enemySpeed = 1;
const enemyLaserCollisionWidth = 12;

function createEnemy() {
    const enemyType = Math.random();
    let newEnemies = [];

    if (enemyType < 0.8) { // 80% chance de ser invader(s)
        const invaderCount = Math.random() < 0.7 ? 1 : (Math.random() < 0.5 ? 2 : 3);
        const totalWidth = invaderCount * invaderWidth;
        const startX = Math.random() * (canvas.width - totalWidth);
        
        for (let i = 0; i < invaderCount; i++) {
            newEnemies.push({
                x: startX + i * invaderWidth,
                y: 0,
                type: 'invader',
                width: invaderWidth,
                height: invaderHeight,
            });
        }
    } else if (enemyType < 1) { // 20% chance de ser um enemy que atira
        newEnemies.push({
            x: Math.random() * (canvas.width - enemyWidth),
            y: 0,
            type: 'enemy',
            width: enemyWidth,
            height: enemyHeight,
            lastShot: Date.now() - 1400
        });
    }

    // Verifica se há sobreposição com inimigos existentes
    const noOverlap = newEnemies.every(newEnemy => 
        !enemies.some(existingEnemy => 
            newEnemy.x < existingEnemy.x + existingEnemy.width &&
            newEnemy.x + newEnemy.width > existingEnemy.x &&
            newEnemy.y < existingEnemy.y + existingEnemy.height &&
            newEnemy.y + newEnemy.height > existingEnemy.y
        )
    );

    if (noOverlap) {
        enemies.push(...newEnemies);
    }
}

function createBoss() {
    enemies.push({
        x: canvas.width / 2 - bossWidth / 2,
        y: 0,
        type: 'boss',
        width: bossWidth,
        height: bossHeight,
        health: 10,
        lastShot: Date.now()
    });
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        if (enemy.type === 'invader') {
            enemy.y += enemySpeed;
        } else if (enemy.type === 'enemy') {
            enemy.y += enemySpeed;
            if (Date.now() - enemy.lastShot > 1500) {
                enemyLasers.push({x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height, width: laserWidth, height: laserHeight});
                enemy.lastShot = Date.now();
            }
        } else if (enemy.type === 'boss') {
            if (enemy.y < 50) enemy.y += 0.5;
            enemy.x += Math.sin(Date.now() * 0.001) * 2;
            if (Date.now() - enemy.lastShot > 1000) {
                enemyLasers.push({x: enemy.x + enemy.width / 4, y: enemy.y + enemy.height, width: laserWidth, height: laserHeight});
                enemyLasers.push({x: enemy.x + enemy.width * 3/4, y: enemy.y + enemy.height, width: laserWidth, height: laserHeight});
                enemy.lastShot = Date.now();
            }
        }

        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });
}

function drawPlayer() {
    ctx.drawImage(playerImage, playerX - playerWidth / 2, playerY, playerWidth, playerHeight);
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.type === 'invader') {
            ctx.drawImage(invaderImage, enemy.x, enemy.y, enemy.width, enemy.height);
        } else if (enemy.type === 'enemy') {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        } else if (enemy.type === 'boss') {
            ctx.drawImage(bossImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

function drawLasers() {
    ctx.fillStyle = 'lime';
    lasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    });
    
    ctx.fillStyle = 'red';
    enemyLasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laserWidth, laserHeight);
        
        ctx.beginPath();
        ctx.arc(laser.x + laserWidth / 2, laser.y + laserHeight / 2, laserWidth * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Pontuação: ${score}`, 10, 30);
}

function startGame() {
    gameActive = true;
    score = 0;
    gameSpeed = 0.8;
    gameTime = 0;
    lastBossTime = 0;
    lastTimestamp = undefined;
    enemies = [];
    lasers = [];
    enemyLasers = [];
    playerX = canvas.width / 2;
    playerVelocity = 0;
    
    startScreen.style.display = 'none';
    backgroundMusic.play();
    
    createEnemyInterval = setInterval(createEnemy, 1000 / gameSpeed);
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameActive) return;

    if (!lastTimestamp) {
        lastTimestamp = timestamp;
    }
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    gameTime += deltaTime;

    if (gameTime - lastBossTime >= 60000) {
        createBoss();
        lastBossTime = gameTime;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    playerX += playerVelocity;
    playerVelocity *= playerFriction;

    playerX = Math.max(playerWidth / 2, Math.min(canvas.width - playerWidth / 2, playerX));

    drawPlayer();
    drawEnemies();
    drawLasers();
    drawScore();

    updateEnemies();

    lasers.forEach((laser, laserIndex) => {
        laser.y -= laserSpeed;
        
        if (laser.y + laserHeight < 0) {
            lasers.splice(laserIndex, 1);
        }
        
        enemies.forEach((enemy, enemyIndex) => {
            if (
                laser.x < enemy.x + enemy.width &&
                laser.x + laserWidth > enemy.x &&
                laser.y < enemy.y + enemy.height &&
                laser.y + laserHeight > enemy.y
            ) {
                lasers.splice(laserIndex, 1);
                if (enemy.type === 'boss') {
                    enemy.health--;
                    if (enemy.health <= 0) {
                        enemies.splice(enemyIndex, 1);
                        score += 20;
                    }
                } else {
                    enemies.splice(enemyIndex, 1);
                    score += enemy.type === 'invader' ? 2 : 5;
                }
                
                gameSpeed += 0.01;
                clearInterval(createEnemyInterval);
                createEnemyInterval = setInterval(createEnemy, 1000 / gameSpeed);
            }
        });

        enemyLasers.forEach((enemyLaser, enemyLaserIndex) => {
            if (
                laser.x < enemyLaser.x + enemyLaserCollisionWidth &&
                laser.x + laser.width > enemyLaser.x - enemyLaserCollisionWidth / 2 &&
                laser.y < enemyLaser.y + laserHeight &&
                laser.y + laser.height > enemyLaser.y
            ) {
                lasers.splice(laserIndex, 1);
                enemyLasers.splice(enemyLaserIndex, 1);
            }
        });
    });

    enemyLasers.forEach((laser, laserIndex) => {
        laser.y += enemyLaserSpeed;
        
        if (laser.y > canvas.height) {
            enemyLasers.splice(laserIndex, 1);
        }
        
        const playerHitbox = {
            x: playerX - playerWidth / 6,
            y: playerY + playerHeight / 3,
            width: playerWidth / 3,
            height: playerHeight / 3
        };
        
        if (
            laser.x < playerHitbox.x + playerHitbox.width &&
            laser.x + laser.width > playerHitbox.x &&
            laser.y < playerHitbox.y + playerHitbox.height &&
            laser.y + laser.height > playerHitbox.y
        ) {
            endGame();
        }
    });

    enemies.forEach((enemy, index) => {
        const playerHitbox = {
            x: playerX - playerWidth / 6,
            y: playerY + playerHeight / 3,
            width: playerWidth / 3,
            height: playerHeight / 3
        };
        
        if (
            playerHitbox.x < enemy.x + enemy.width &&
            playerHitbox.x + playerHitbox.width > enemy.x &&
            playerHitbox.y < enemy.y + enemy.height &&
            playerHitbox.y + playerHitbox.height > enemy.y
        ) {
            endGame();
        }
    });

    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameActive = false;
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    clearInterval(createEnemyInterval);
    gameOverScreen.style.display = 'block';
    document.getElementById('finalScore').textContent = score;
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    startGame();
}

function fireLaser() {
    lasers.push({
        x: playerX,
        y: playerY,
        width: laserWidth,
        height: laserHeight
    });
    laserSound.currentTime = 0;
    laserSound.play();
}

document.addEventListener('keydown', function(event) {
    if (gameActive) {
        if (event.code === 'ArrowLeft') {
            playerVelocity = Math.max(playerVelocity - playerAcceleration, -playerMaxSpeed);
        } else if (event.code === 'ArrowRight') {
            playerVelocity = Math.min(playerVelocity + playerAcceleration, playerMaxSpeed);
        } else if (event.code === 'Space') {
            fireLaser();
        }
    }
});

document.addEventListener('keyup', function(event) {
    if (gameActive) {
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            playerVelocity *= 0.5;
        }
    }
});

canvas.addEventListener('touchmove', function(event) {
    if (gameActive) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        playerX = touch.clientX - rect.left;
    }
}, { passive: false });

canvas.addEventListener('touchstart', function(event) {
    if (gameActive) {
        event.preventDefault();
        fireLaser();
    }
}, { passive: false });

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

[playerImage, enemyImage, invaderImage, bossImage].forEach(img => {
    img.onload = () => {
        if (playerImage.complete && enemyImage.complete && invaderImage.complete && bossImage.complete) {
            startButton.disabled = false;
        }
    };
});