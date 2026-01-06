// Server Configuration
const SERVER_CONFIG = {
    cfxServerID: '53d3yd', // CFX.re server ID
    discordInvite: 'https://discord.gg/wavepvp', // Discord invite link
    discordInviteCode: 'wavepvp', // Kun invite koden (efter discord.gg/)
    restartTimes: [0, 6, 12, 18], // Restart tidspunkter (timer i 24-timers format)
};

// DOM Elements
const elements = {
    playerCount: document.getElementById('player-count'),
    discordCount: document.getElementById('discord-count'),
    nextRestart: document.getElementById('uptime'),
    connectCode: document.getElementById('connect-code'),
    discordLink: document.getElementById('discord-link'),
    serverStatusText: document.getElementById('server-status-text'),
};

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
    loadServerStats();
    updateNextRestart();
    
    // Refresh stats every 30 seconds
    setInterval(loadServerStats, 30000);
    
    // Update restart countdown every second
    setInterval(updateNextRestart, 1000);
});

function initializeWebsite() {
    // Connect code sættes når vi henter server data
    elements.connectCode.textContent = 'Connecting...';
    
    // Set up Discord link
    elements.discordLink.href = SERVER_CONFIG.discordInvite;
    
    // Add loading states
    if (elements.playerCount) elements.playerCount.classList.add('loading');
    if (elements.discordCount) elements.discordCount.classList.add('loading');
}

async function loadServerStats() {
    await Promise.all([
        loadPlayerCount(),
        loadDiscordMembers()
    ]);
}

async function loadPlayerCount() {
    if (!elements.playerCount) return;
    
    try {
        const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${SERVER_CONFIG.cfxServerID}`);
        const data = await response.json();
        
        if (data && data.Data) {
            const current = data.Data.clients || 0;
            const max = data.Data.sv_maxclients || data.Data.svMaxclients || 48;
            elements.playerCount.textContent = `${current}/${max}`;
            elements.playerCount.classList.remove('loading');
            
            // Opdater hero status tekst
            if (elements.serverStatusText) {
                elements.serverStatusText.textContent = `${current} Players Online`;
            }
            
            // Opdater connect code med server endpoint
            if (data.EndPoint) {
                elements.connectCode.textContent = `connect ${data.EndPoint}`;
            } else {
                elements.connectCode.textContent = `connect cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
            }
            return;
        }
        
        // Fallback
        elements.playerCount.textContent = '0/48';
        elements.connectCode.textContent = `connect cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
        elements.playerCount.classList.remove('loading');
        
        // Opdater hero status
        if (elements.serverStatusText) {
            elements.serverStatusText.textContent = '0 Players Online';
        }
        
    } catch (error) {
        console.error('Fejl ved indlæsning af spillerantal:', error);
        elements.playerCount.textContent = 'Offline';
        elements.connectCode.textContent = `connect cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
        elements.playerCount.classList.remove('loading');
        
        // Opdater hero status ved fejl
        if (elements.serverStatusText) {
            elements.serverStatusText.textContent = 'Server Offline';
        }
    }
}

async function loadDiscordMembers() {
    if (!elements.discordCount) return;
    
    try {
        // Brug Discord invite API til at få member count
        if (SERVER_CONFIG.discordInviteCode) {
            const response = await fetch(`https://discord.com/api/invites/${SERVER_CONFIG.discordInviteCode}?with_counts=true`);
            
            if (!response.ok) {
                throw new Error('Invite API fejlede');
            }
            
            const data = await response.json();
            
            // Invite API giver approximate_member_count (totalt antal medlemmer)
            if (data && data.approximate_member_count) {
                elements.discordCount.textContent = data.approximate_member_count.toLocaleString();
                elements.discordCount.classList.remove('loading');
                return;
            }
        }
        
        // Fallback - vis placeholder
        elements.discordCount.textContent = '-';
        elements.discordCount.classList.remove('loading');
        
    } catch (error) {
        console.error('Fejl ved indlæsning af Discord medlemmer:', error);
        elements.discordCount.textContent = '-';
        elements.discordCount.classList.remove('loading');
    }
}

// Calculate and display next restart time
function updateNextRestart() {
    if (!elements.nextRestart) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    // Find næste restart tidspunkt
    let nextRestartHour = SERVER_CONFIG.restartTimes.find(hour => hour > currentHour);
    
    // Hvis ingen restart er tilbage i dag, tag den første i morgen
    if (nextRestartHour === undefined) {
        nextRestartHour = SERVER_CONFIG.restartTimes[0];
    }
    
    // Beregn tid til næste restart
    let hoursUntil, minutesUntil, secondsUntil;
    
    if (nextRestartHour > currentHour) {
        // Restart er senere i dag
        hoursUntil = nextRestartHour - currentHour - 1;
        minutesUntil = 59 - currentMinutes;
        secondsUntil = 59 - currentSeconds;
        
        if (currentMinutes === 0 && currentSeconds === 0) {
            hoursUntil = nextRestartHour - currentHour;
            minutesUntil = 0;
            secondsUntil = 0;
        }
    } else {
        // Restart er i morgen
        hoursUntil = (24 - currentHour) + nextRestartHour - 1;
        minutesUntil = 59 - currentMinutes;
        secondsUntil = 59 - currentSeconds;
        
        if (currentMinutes === 0 && currentSeconds === 0) {
            hoursUntil = (24 - currentHour) + nextRestartHour;
            minutesUntil = 0;
            secondsUntil = 0;
        }
    }
    
    // Formater output
    const hours = hoursUntil.toString().padStart(2, '0');
    const minutes = minutesUntil.toString().padStart(2, '0');
    const seconds = secondsUntil.toString().padStart(2, '0');
    
    elements.nextRestart.textContent = `${hours}:${minutes}:${seconds}`;
}

function copyConnectCode() {
    const connectText = elements.connectCode.textContent;
    
    navigator.clipboard.writeText(connectText).then(function() {
        // Vis success feedback
        const copyButton = document.querySelector('.copy-button');
        const originalHTML = copyButton.innerHTML;
        
        copyButton.innerHTML = '<i class="fas fa-check"></i>';
        copyButton.style.background = '#4ade80';
        
        setTimeout(function() {
            copyButton.innerHTML = originalHTML;
            copyButton.style.background = '';
        }, 2000);
        
    }).catch(function(err) {
        console.error('Kunne ikke kopiere tekst:', err);
        
        // Fallback: Vælg tekst for manuel kopiering
        const codeElement = elements.connectCode;
        const range = document.createRange();
        range.selectNode(codeElement);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        alert('Connect koden er markeret! Tryk Ctrl+C for at kopiere.');
    });
}

function connectToServer() {
    // Brug cfx.re link til direkte connect
    const fivemLink = `fivem://connect/cfx.re/join/${SERVER_CONFIG.cfxServerID}`;
    
    // Forsøg at åbne FiveM direkte
    window.location.href = fivemLink;
    
    // Vis fallback instruktioner efter kort forsinkelse
    setTimeout(function() {
        const connectCode = elements.connectCode.textContent;
        if (confirm('If FiveM did not open automatically, copy this code and paste it into the FiveM console (F8):\n\n' + connectCode + '\n\nDo you want to copy the code now?')) {
            copyConnectCode();
        }
    }, 2000);
}

function playCarGame() {
    // Vis bil spillet i højre side
    const gameContainer = document.getElementById('car-game-container');
    const serverStatus = document.querySelector('.server-status');
    
    if (gameContainer.style.display === 'none' || !gameContainer.style.display) {
        // Vis bil spil og skjul server status
        gameContainer.style.display = 'block';
        serverStatus.style.display = 'none';
        
        // Start bil spillet
        initCarGame();
    } else {
        // Skjul bil spil og vis server status
        gameContainer.style.display = 'none';
        serverStatus.style.display = 'block';
    }
}

function hideCarGame() {
    const gameContainer = document.getElementById('car-game-container');
    const serverStatus = document.querySelector('.server-status');
    
    gameContainer.style.display = 'none';
    serverStatus.style.display = 'block';
    
    // Stop game loop
    if (carGame.gameLoopId) {
        cancelAnimationFrame(carGame.gameLoopId);
        carGame.gameLoopId = null;
    }
}

// Car Game Variables
let carGame = {
    canvas: null,
    ctx: null,
    playerX: 0,
    playerY: 0,
    playerWidth: 44,
    playerHeight: 80,
    score: 0,
    highScore: 0,
    gameSpeed: 5,
    isGameOver: false,
    enemies: [],
    roadLines: [],
    dodgedCars: 0,
    gameTime: 0,
    lastTime: 0,
    leftPressed: false,
    rightPressed: false,
    frameCount: 0,
    carColors: ['#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#3498db', '#1abc9c', '#e67e22'],
    gameLoopId: null
};

function initCarGame() {
    carGame.canvas = document.getElementById('carGameCanvas');
    if (!carGame.canvas) return;
    
    carGame.ctx = carGame.canvas.getContext('2d');
    
    // Reset game state
    carGame.playerX = carGame.canvas.width / 2 - 22;
    carGame.playerY = carGame.canvas.height - 110;
    carGame.score = 0;
    carGame.highScore = localStorage.getItem('carGameHighScore') || 0;
    carGame.gameSpeed = 5;
    carGame.isGameOver = false;
    carGame.enemies = [];
    carGame.roadLines = [];
    carGame.dodgedCars = 0;
    carGame.gameTime = 0;
    carGame.lastTime = Date.now();
    carGame.frameCount = 0;
    
    // Update UI
    document.getElementById('car-highScore').textContent = carGame.highScore;
    document.getElementById('car-score').textContent = carGame.score;
    document.getElementById('car-dodgedCars').textContent = carGame.dodgedCars;
    document.getElementById('car-gameTime').textContent = '0';
    document.getElementById('car-speedValue').textContent = '60';
    document.getElementById('car-gameOver').style.display = 'none';
    
    // Create road lines
    for (let i = 0; i < 8; i++) {
        carGame.roadLines.push({ y: i * 80 });
    }
    
    // Add event listeners
    document.addEventListener('keydown', handleCarKeyDown);
    document.addEventListener('keyup', handleCarKeyUp);
    
    // Start game loop
    carGameLoop();
}

function handleCarKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        carGame.leftPressed = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        carGame.rightPressed = true;
    }
    if ((e.key === ' ' || e.key === 'Enter') && carGame.isGameOver) {
        restartCarGame();
    }
}

function handleCarKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        carGame.leftPressed = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        carGame.rightPressed = false;
    }
}

function drawCarPlayer() {
    const ctx = carGame.ctx;
    const playerX = carGame.playerX;
    const playerY = carGame.playerY;
    const playerWidth = carGame.playerWidth;
    const playerHeight = carGame.playerHeight;
    
    ctx.save();
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(playerX + playerWidth/2 + 3, playerY + playerHeight - 5, playerWidth/2 - 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = '#6bb8ff';
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

    // Body highlight
    ctx.fillStyle = '#529bee';
    ctx.fillRect(playerX + 2, playerY + 2, playerWidth - 15, playerHeight - 4);

    // Cabin/roof
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(playerX + 4, playerY + 18, playerWidth - 8, 30);

    // Windshield
    ctx.fillStyle = '#a8d4ff';
    ctx.fillRect(playerX + 6, playerY + 20, playerWidth - 12, 12);

    // Headlights
    ctx.fillStyle = '#fff';
    ctx.fillRect(playerX + 4, playerY + 4, 10, 6);
    ctx.fillRect(playerX + playerWidth - 14, playerY + 4, 10, 6);

    // Tail lights
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(playerX + 4, playerY + playerHeight - 10, 8, 4);
    ctx.fillRect(playerX + playerWidth - 12, playerY + playerHeight - 10, 8, 4);

    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(playerX - 3, playerY + 8, 6, 16);
    ctx.fillRect(playerX + playerWidth - 3, playerY + 8, 6, 16);
    ctx.fillRect(playerX - 3, playerY + playerHeight - 24, 6, 16);
    ctx.fillRect(playerX + playerWidth - 3, playerY + playerHeight - 24, 6, 16);

    ctx.restore();
}

function drawCarEnemy(enemy) {
    const ctx = carGame.ctx;
    
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(enemy.x + enemy.width/2 + 3, enemy.y + enemy.height - 5, enemy.width/2 - 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    // Cabin
    ctx.fillStyle = shadeColor(enemy.color, -25);
    ctx.fillRect(enemy.x + 4, enemy.y + 32, enemy.width - 8, 28);

    // Rear window
    ctx.fillStyle = '#333';
    ctx.fillRect(enemy.x + 6, enemy.y + 48, enemy.width - 12, 10);

    // Tail lights
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(enemy.x + 4, enemy.y + enemy.height - 10, 8, 4);
    ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + enemy.height - 10, 8, 4);

    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(enemy.x - 3, enemy.y + 8, 6, 16);
    ctx.fillRect(enemy.x + enemy.width - 3, enemy.y + 8, 6, 16);
    ctx.fillRect(enemy.x - 3, enemy.y + enemy.height - 24, 6, 16);
    ctx.fillRect(enemy.x + enemy.width - 3, enemy.y + enemy.height - 24, 6, 16);

    ctx.restore();
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + 
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

function drawCarRoad() {
    const ctx = carGame.ctx;
    const canvas = carGame.canvas;
    
    // Road background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road edges
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, 8, canvas.height);
    ctx.fillRect(canvas.width - 8, 0, 8, canvas.height);

    // Edge lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(8, 0, 2, canvas.height);
    ctx.fillRect(canvas.width - 10, 0, 2, canvas.height);

    // Center dashed lines
    carGame.roadLines.forEach(line => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(canvas.width / 2 - 2, line.y, 4, 35);
    });

    // Lane markers
    carGame.roadLines.forEach(line => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(canvas.width / 4, line.y, 2, 25);
        ctx.fillRect(canvas.width * 3/4, line.y, 2, 25);
    });
}

function updateCarRoadLines() {
    carGame.roadLines.forEach(line => {
        line.y += carGame.gameSpeed;
        if (line.y > carGame.canvas.height) {
            line.y = -40;
        }
    });
}

function spawnCarEnemy() {
    const lanes = [45, 120, 195, 270, 340];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    
    const tooClose = carGame.enemies.some(e => Math.abs(e.x - lane) < 30 && e.y < 150);
    if (tooClose) return;

    carGame.enemies.push({
        x: lane,
        y: -100,
        width: 44,
        height: 80,
        color: carGame.carColors[Math.floor(Math.random() * carGame.carColors.length)]
    });
}

function updateCarEnemies() {
    carGame.enemies.forEach((enemy, index) => {
        enemy.y += carGame.gameSpeed;

        if (enemy.y > carGame.canvas.height) {
            carGame.enemies.splice(index, 1);
            carGame.score += 10;
            carGame.dodgedCars++;
            document.getElementById('car-score').textContent = carGame.score;
            document.getElementById('car-dodgedCars').textContent = carGame.dodgedCars;
        }
    });
}

function checkCarCollision() {
    carGame.enemies.forEach(enemy => {
        if (carGame.playerX < enemy.x + enemy.width - 8 &&
            carGame.playerX + carGame.playerWidth > enemy.x + 8 &&
            carGame.playerY < enemy.y + enemy.height - 8 &&
            carGame.playerY + carGame.playerHeight > enemy.y + 8) {
            endCarGame();
        }
    });
}

function endCarGame() {
    carGame.isGameOver = true;
    
    if (carGame.score > carGame.highScore) {
        carGame.highScore = carGame.score;
        localStorage.setItem('carGameHighScore', carGame.highScore);
        document.getElementById('car-highScore').textContent = carGame.highScore;
    }

    document.getElementById('car-finalScore').textContent = carGame.score;
    document.getElementById('car-finalHighScore').textContent = carGame.highScore;
    document.getElementById('car-finalDodged').textContent = carGame.dodgedCars;
    document.getElementById('car-gameOver').style.display = 'block';
}

function restartCarGame() {
    carGame.playerX = carGame.canvas.width / 2 - 22;
    carGame.score = 0;
    carGame.gameSpeed = 5;
    carGame.isGameOver = false;
    carGame.enemies = [];
    carGame.dodgedCars = 0;
    carGame.gameTime = 0;
    carGame.lastTime = Date.now();
    carGame.frameCount = 0;
    
    document.getElementById('car-score').textContent = carGame.score;
    document.getElementById('car-dodgedCars').textContent = carGame.dodgedCars;
    document.getElementById('car-gameTime').textContent = '0';
    document.getElementById('car-speedValue').textContent = '60';
    document.getElementById('car-gameOver').style.display = 'none';
    
    carGameLoop();
}

function updateCarPlayer() {
    const speed = 7;
    if (carGame.leftPressed && carGame.playerX > 15) {
        carGame.playerX -= speed;
    }
    if (carGame.rightPressed && carGame.playerX < carGame.canvas.width - carGame.playerWidth - 15) {
        carGame.playerX += speed;
    }
}

function carGameLoop() {
    if (carGame.isGameOver) return;

    carGame.ctx.clearRect(0, 0, carGame.canvas.width, carGame.canvas.height);

    drawCarRoad();
    updateCarRoadLines();
    
    carGame.enemies.forEach(enemy => drawCarEnemy(enemy));
    drawCarPlayer();

    updateCarPlayer();
    updateCarEnemies();
    checkCarCollision();

    carGame.frameCount++;
    if (carGame.frameCount % Math.max(25, 55 - Math.floor(carGame.score / 100)) === 0) {
        spawnCarEnemy();
    }

    if (carGame.score > 0 && carGame.score % 50 === 0) {
        carGame.gameSpeed = Math.min(14, 5 + Math.floor(carGame.score / 50));
        const speed = 60 + (carGame.gameSpeed - 5) * 20;
        document.getElementById('car-speedValue').textContent = speed;
    }

    const currentTime = Date.now();
    carGame.gameTime += (currentTime - carGame.lastTime) / 1000;
    carGame.lastTime = currentTime;
    document.getElementById('car-gameTime').textContent = Math.floor(carGame.gameTime);

    carGame.gameLoopId = requestAnimationFrame(carGameLoop);
}

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe stat boxes for animation
document.addEventListener('DOMContentLoaded', function() {
    const statBoxes = document.querySelectorAll('.stat-box');
    statBoxes.forEach(box => {
        box.style.opacity = '0';
        box.style.transform = 'translateY(20px)';
        box.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(box);
    });

});

