// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio Context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound effects functions
function playBrickBreakSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playLifeLostSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playWinSound() {
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C, D, E, G, A

    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime + index * 0.15;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
    });
}

function playLevelCompleteSound() {
    const notes = [659.25, 783.99, 1046.50]; // E, G, C (major chord arpeggio)

    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'triangle';

        const startTime = audioContext.currentTime + index * 0.1;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
    });
}

// Game state
let gameState = 'name'; // 'name', 'playing', 'paused', 'levelComplete', 'gameOver'
let playerName = '';
let currentLevel = 1;
let score = 0;
let lives = 3;

// Paddle
const paddle = {
    width: 120,
    height: 15,
    x: 0,
    y: 0,
    speed: 7,
    dx: 0
};

// Ball
const ball = {
    x: 0,
    y: 0,
    radius: 8,
    speed: 4,
    dx: 0,
    dy: 0,
    launched: false
};

// Bricks
const brickInfo = {
    rows: 0,
    cols: 0,
    width: 70,
    height: 20,
    padding: 10,
    offsetX: 35,
    offsetY: 60
};

let bricks = [];

// Level configurations (10 levels with increasing difficulty)
const levels = [
    { rows: 3, cols: 8, speed: 4, color: '#FF6B6B' },
    { rows: 4, cols: 8, speed: 4.5, color: '#4ECDC4' },
    { rows: 4, cols: 9, speed: 4.5, color: '#45B7D1' },
    { rows: 5, cols: 9, speed: 5, color: '#FFA07A' },
    { rows: 5, cols: 10, speed: 5, color: '#98D8C8' },
    { rows: 6, cols: 10, speed: 5.5, color: '#F7DC6F' },
    { rows: 6, cols: 10, speed: 5.5, color: '#BB8FCE' },
    { rows: 7, cols: 10, speed: 6, color: '#85C1E2' },
    { rows: 7, cols: 11, speed: 6, color: '#F8B500' },
    { rows: 8, cols: 11, speed: 6.5, color: '#FF1493' }
];

// Keyboard state
const keys = {
    left: false,
    right: false,
    space: false
};

// Initialize game
function init() {
    paddle.x = canvas.width / 2 - paddle.width / 2;
    paddle.y = canvas.height - 40;
    resetBall();
    createBricks();
}

// Create bricks for current level
function createBricks() {
    bricks = [];
    const level = levels[currentLevel - 1];
    brickInfo.rows = level.rows;
    brickInfo.cols = level.cols;

    for (let row = 0; row < brickInfo.rows; row++) {
        bricks[row] = [];
        for (let col = 0; col < brickInfo.cols; col++) {
            bricks[row][col] = {
                x: col * (brickInfo.width + brickInfo.padding) + brickInfo.offsetX,
                y: row * (brickInfo.height + brickInfo.padding) + brickInfo.offsetY,
                status: 1,
                color: level.color
            };
        }
    }
}

// Reset ball to paddle
function resetBall() {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    ball.dx = 0;
    ball.dy = 0;
    ball.launched = false;
}

// Launch ball
function launchBall() {
    if (!ball.launched) {
        const level = levels[currentLevel - 1];
        ball.dx = level.speed * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = -level.speed;
        ball.launched = true;
    }
}

// Draw paddle
function drawPaddle() {
    ctx.fillStyle = '#667eea';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Add gradient effect
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Draw ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

// Draw bricks
function drawBricks() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.status === 1) {
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brickInfo.width, brickInfo.height);

                // Add border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(brick.x, brick.y, brickInfo.width, brickInfo.height);
            }
        });
    });
}

// Move paddle
function movePaddle() {
    paddle.x += paddle.dx;

    // Wall detection
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Move ball
function moveBall() {
    if (!ball.launched) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius;
        return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (left and right)
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }

    // Wall collision (top)
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Paddle collision
    if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
    ) {
        // Calculate where the ball hit the paddle (for angle variation)
        const hitPos = (ball.x - paddle.x) / paddle.width;
        const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degree angle

        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -Math.abs(speed * Math.cos(angle));
    }

    // Ball falls below paddle
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateDisplay();

        // Play life lost sound
        playLifeLostSound();

        if (lives === 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
}

// Brick collision
function brickCollision() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.status === 1) {
                if (
                    ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brickInfo.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brickInfo.height
                ) {
                    ball.dy *= -1;
                    brick.status = 0;
                    score += 10;
                    updateDisplay();

                    // Play brick break sound
                    playBrickBreakSound();

                    // Check if level complete
                    if (checkLevelComplete()) {
                        levelComplete();
                    }
                }
            }
        });
    });
}

// Check if all bricks are destroyed
function checkLevelComplete() {
    return bricks.every(row => row.every(brick => brick.status === 0));
}

// Level complete
function levelComplete() {
    gameState = 'levelComplete';

    if (currentLevel < levels.length) {
        // Play level complete sound
        playLevelCompleteSound();
        showMessage(`Level ${currentLevel} Complete!`, true, false);
    } else {
        // Play win sound for completing all levels
        playWinSound();
        showMessage(`Congratulations! You won the game!`, false, true);
    }
}

// Next level
function nextLevel() {
    currentLevel++;
    lives = 3;
    createBricks();
    resetBall();
    updateDisplay();
    hideMessage();
    gameState = 'playing';
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    showMessage(`Game Over! Final Score: ${score}`, false, true);
}

// Restart game
function restartGame() {
    currentLevel = 1;
    score = 0;
    lives = 3;
    init();
    updateDisplay();
    hideMessage();
    gameState = 'playing';
}

// Update display
function updateDisplay() {
    document.getElementById('displayName').textContent = playerName;
    document.getElementById('levelDisplay').textContent = currentLevel;
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('livesDisplay').textContent = lives;
}

// Show message
function showMessage(text, showContinue, showRestart) {
    document.getElementById('messageText').textContent = text;
    document.getElementById('messageBox').classList.remove('hidden');

    if (showContinue) {
        document.getElementById('continueBtn').classList.remove('hidden');
    } else {
        document.getElementById('continueBtn').classList.add('hidden');
    }

    if (showRestart) {
        document.getElementById('restartBtn').classList.remove('hidden');
    } else {
        document.getElementById('restartBtn').classList.add('hidden');
    }
}

// Hide message
function hideMessage() {
    document.getElementById('messageBox').classList.add('hidden');
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawBricks();
    drawPaddle();
    drawBall();
}

// Update game
function update() {
    if (gameState !== 'playing') return;

    movePaddle();
    moveBall();
    brickCollision();
}

// Game loop
function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

// Keyboard event handlers
function keyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
        paddle.dx = -paddle.speed;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
        paddle.dx = paddle.speed;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (gameState === 'playing') {
            launchBall();
        }
    }
}

function keyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
        if (!keys.right) {
            paddle.dx = 0;
        }
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
        if (!keys.left) {
            paddle.dx = 0;
        }
    }
}

// Event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Start button
document.getElementById('startBtn').addEventListener('click', () => {
    const nameInput = document.getElementById('playerName');
    if (nameInput.value.trim() === '') {
        alert('Please enter your name!');
        return;
    }

    playerName = nameInput.value.trim();
    document.getElementById('nameScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    init();
    updateDisplay();
    gameState = 'playing';
    gameLoop();
});

// Continue button (next level)
document.getElementById('continueBtn').addEventListener('click', () => {
    nextLevel();
});

// Restart button
document.getElementById('restartBtn').addEventListener('click', () => {
    restartGame();
});

// Allow Enter key to start game
document.getElementById('playerName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('startBtn').click();
    }
});

// Background image upload handler
let customBackgroundImage = null;

document.getElementById('backgroundUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (file) {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file!');
            e.target.value = '';
            return;
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB!');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            customBackgroundImage = event.target.result;

            // Show preview
            document.getElementById('previewImg').src = customBackgroundImage;
            document.getElementById('imagePreview').classList.remove('hidden');
            document.getElementById('uploadText').textContent = 'Change Background Image';

            // Set background immediately
            document.body.style.background = `url(${customBackgroundImage})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
        };

        reader.readAsDataURL(file);
    }
});

// Remove image button
document.getElementById('removeImage').addEventListener('click', () => {
    customBackgroundImage = null;
    document.getElementById('backgroundUpload').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('uploadText').textContent = 'Upload Background Image (Optional)';

    // Restore default gradient background
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    document.body.style.backgroundAttachment = 'fixed';
});
