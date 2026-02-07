//////////////////////////////////////////////////////
// GLOBAL
//////////////////////////////////////////////////////

let canvas, ctx;
let lastTime = 0;
let gameState = "start";

let score = 0;
let highScore = 0;
let scoreCard = document.getElementById("score_card");

let scoreSound = new Audio("mixkit-bonus-earned-in-video-game-2058.wav");
let jumpSound = new Audio("mixkit-player-jumping-in-a-video-game-2043.wav");
let hitSound = new Audio("mixkit-player-losing-or-failing-2042.wav");

scoreSound.volume = 0.6;
jumpSound.volume = 0.6;
hitSound.volume = 0.7;

//////////////////////////////////////////////////////
// STARS
//////////////////////////////////////////////////////

let stars = [];
for (let i = 0; i < 80; i++) {
    stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 500,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random()
    });
}

//////////////////////////////////////////////////////
// MOON
//////////////////////////////////////////////////////

let moon = {
    x: 1000,
    y: 120,
    r: 50
};

//////////////////////////////////////////////////////
// CLOUDS (DARK)
//////////////////////////////////////////////////////

let clouds = [
    { x: 200, y: 140, size: 60 },
    { x: 600, y: 200, size: 80 },
    { x: 1000, y: 160, size: 70 }
];
let cloudSpeed = 20;

//////////////////////////////////////////////////////
// GAME OBJECTS
//////////////////////////////////////////////////////

let bird = {
    x: 120,
    y: 300,
    width: 60,
    height: 90,
    vel: 0,
    gravity: 2200,
    jump: -750
};

let pillars = [];
let pillarSpeed = 650;
let spawnInterval = 900;
let lastSpawnTime = 0;

//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

function init() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    highScore = Number(localStorage.getItem("highScore")) || 0;
    scoreCard.textContent = `Score: 0 | High: ${highScore}`;

    requestAnimationFrame(gameLoop);
}

//////////////////////////////////////////////////////
// GAME LOOP
//////////////////////////////////////////////////////

function gameLoop(time) {

    if (!lastTime) {
        lastTime = time;
        requestAnimationFrame(gameLoop);
        return;
    }

    let dt = (time - lastTime) / 1000;
    lastTime = time;

    if (gameState === "playing") update(dt, time);

    draw(dt);
    requestAnimationFrame(gameLoop);
}

//////////////////////////////////////////////////////
// UPDATE
//////////////////////////////////////////////////////

function update(dt, time) {
    updateBird(dt);
    updatePillars(dt);
    spawnPillars(time);
    checkCollision();
    updateScore();
}

//////////////////////////////////////////////////////
// DRAW
//////////////////////////////////////////////////////

function draw(dt) {
    drawNightBackground(dt);
    drawPillars();
    drawBird();
    drawText();
}

//////////////////////////////////////////////////////
// NIGHT BACKGROUND
//////////////////////////////////////////////////////

function drawNightBackground(dt) {

    // sky
    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#020024");
    sky.addColorStop(1, "#0f2027");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars
    stars.forEach(s => {
        s.alpha += (Math.random() - 0.5) * 0.05;
        s.alpha = Math.max(0.2, Math.min(1, s.alpha));

        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // moon glow
    let g = ctx.createRadialGradient(
        moon.x, moon.y, 10,
        moon.x, moon.y, moon.r * 2
    );
    g.addColorStop(0, "rgba(255,255,220,0.9)");
    g.addColorStop(1, "rgba(255,255,220,0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.r * 2, 0, Math.PI * 2);
    ctx.fill();

    // moon
    ctx.fillStyle = "#fff9c4";
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
    ctx.fill();

    // ground
    ctx.fillStyle = "#0b1c1f";
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
}

//////////////////////////////////////////////////////
// BIRD
//////////////////////////////////////////////////////

function updateBird(dt) {
    bird.vel += bird.gravity * dt;
    if (bird.vel > 900) bird.vel = 900;
    bird.y += bird.vel * dt;
}

function drawBird() {
    ctx.shadowColor = "#4fc3ff";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#4fc3ff";
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    ctx.shadowBlur = 0;
}

//////////////////////////////////////////////////////
// PILLARS
//////////////////////////////////////////////////////

function spawnPillars(time) {
    if (time - lastSpawnTime > spawnInterval) {
        let h = Math.random() * 350 + 120;
        pillars.push({ x: canvas.width, height: h, gap: 300, passed: false });
        lastSpawnTime = time;
    }
}

function updatePillars(dt) {
    pillars.forEach(p => p.x -= pillarSpeed * dt);
    pillars = pillars.filter(p => p.x + 140 > 0);
}

function drawPillars() {

    pillars.forEach(p => {

        // glow
        ctx.shadowColor = "rgba(255, 235, 59, 0.5)";
        ctx.shadowBlur = 25;

        // pillar body
        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(p.x, 0, 120, p.height);

        ctx.fillRect(
            p.x,
            p.height + p.gap,
            120,
            canvas.height - (p.height + p.gap)
        );

        // inner bright strip (neon effect)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(p.x + 8, 0, 10, p.height);
        ctx.fillRect(
            p.x + 8,
            p.height + p.gap,
            10,
            canvas.height - (p.height + p.gap)
        );
    });
}


//////////////////////////////////////////////////////
// COLLISION
//////////////////////////////////////////////////////

function checkCollision() {

    if (bird.y < 0 || bird.y + bird.height > canvas.height - 60) {
        gameOver();
    }

    let L = bird.x, R = bird.x + bird.width;
    let T = bird.y, B = bird.y + bird.height;

    pillars.forEach(p => {
        if (
            R > p.x && L < p.x + 120 &&
            (T < p.height || B > p.height + p.gap)
        ) {
            gameOver();
        }
    });
}

//////////////////////////////////////////////////////
// SCORE
//////////////////////////////////////////////////////

function updateScore() {
    pillars.forEach(p => {
        if (!p.passed && p.x + 120 < bird.x) {
            p.passed = true;
            score++;
            scoreSound.currentTime = 0;
            scoreSound.play();
            scoreCard.textContent = `Score: ${score} | High: ${highScore}`;
        }
    });
}

//////////////////////////////////////////////////////
// GAME STATE
//////////////////////////////////////////////////////

function gameOver() {
    hitSound.currentTime = 0;
    hitSound.play();
    gameState = "over";

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }
}

function resetGame() {
    bird.y = 300;
    bird.vel = 0;
    pillars = [];
    score = 0;
    lastSpawnTime = 0;
    scoreCard.textContent = `Score: 0 | High: ${highScore}`;
}

//////////////////////////////////////////////////////
// TEXT
//////////////////////////////////////////////////////

function drawText() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;

    if (gameState === "start") {
        ctx.font = "60px Arial";
        ctx.strokeText("FLAPPY NIGHT", 560, 350);
        ctx.fillText("FLAPPY NIGHT", 560, 350);

        ctx.font = "36px Arial";
        ctx.strokeText("Press SPACE to Start", 560, 420);
        ctx.fillText("Press SPACE to Start", 560, 420);
    }

    if (gameState === "over") {
        ctx.font = "60px Arial";
        ctx.strokeText("GAME OVER", 580, 350);
        ctx.fillText("GAME OVER", 580, 350);

        ctx.font = "36px Arial";
        ctx.strokeText("Press SPACE to Restart", 540, 420);
        ctx.fillText("Press SPACE to Restart", 540, 420);
    }
}

//////////////////////////////////////////////////////
// INPUT
//////////////////////////////////////////////////////

window.addEventListener("keydown", e => {

    if (e.code === "Space") {

        if (gameState === "start") {
            gameState = "playing";
            bird.vel = bird.jump;
            jumpSound.currentTime = 0;
            jumpSound. play();
        }

        else if (gameState === "playing") {
            bird.vel = bird.jump;
            jumpSound.currentTime = 0;
            jumpSound.play();
        }

        else if (gameState === "over") {
            resetGame();
            gameState = "start";
        }
    }
});

//////////////////////////////////////////////////////
// START
//////////////////////////////////////////////////////

init();
