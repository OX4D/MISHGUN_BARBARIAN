const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

const playerImage = new Image();
playerImage.src = 'player.png';

let swordImage = new Image();
swordImage.src = 'sword.png';

let swordImage2 = new Image();
swordImage2.src = 'sword_2.png';

const enemyImage = new Image();
enemyImage.src = 'enemy.png';

let player = { x: 0, y: 0, width: 60, height: 90 };
let sword = { angle: 0, radius: 100, width: 90, height: 55 };
let enemies = [];
let particles = [];
let bloodSplats = [];
let enemySpeed = 2;
let gameOver = false;
let score = 0;
let shakeDuration = 0;
let shakeIntensity = 10; // Увеличили интенсивность тряски

function createEnemy() {
    const size = 50;
    const side = Math.floor(Math.random() * 4);
    const position = Math.random() * (side % 2 === 0 ? canvas.height : canvas.width);
    const x = side === 1 ? canvas.width + size : side === 0 ? -size : position;
    const y = side === 3 ? canvas.height + size : side === 2 ? -size : position;

    enemies.push({ x, y, size, vx: 0, vy: 0, hit: false });
}

function createParticles(x, y, vx, vy, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * Math.PI / 4;
        const speed = Math.random() * 2 + 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: Math.random() * 3 + 1
        });
    }
}

function createBloodSplat(x, y, angle) {
    const count = Math.floor(Math.random() * 10) + 20; // От 20 до 30 брызг
    for (let i = 0; i < count; i++) {
        // Модифицируем угол с большими отклонениями для большей размазанности
        const splatAngle = angle + (Math.random() - 0.5) * Math.PI; // ±180 градусов
        const radius = Math.random() * 60 + 40; // Радиус от 40 до 100 пикселей
        const size = Math.random() * 3 + 1; // Толщина линии от 1 до 4 пикселей
        // Смещаем позицию брызги вперед по направлению удара
        const offsetX = Math.cos(splatAngle) * (radius / 2);
        const offsetY = Math.sin(splatAngle) * (radius / 2);
        // Варьируем оттенок красного
        const red = 139 + Math.floor(Math.random() * 20); // 139-158
        const green = Math.floor(Math.random() * 20); // 0-19
        const blue = Math.floor(Math.random() * 20); // 0-19
        const color = `rgba(${red}, ${green}, ${blue}, 0.8)`;
        bloodSplats.push({
            x: x + offsetX,
            y: y + offsetY,
            angle: splatAngle,
            radius: radius,
            size: size,
            alpha: 1,
            color: color
        });
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
}

function movePlayer(x, y) {
    const rect = canvas.getBoundingClientRect();
    player.x = x - rect.left - player.width / 2;
    player.y = y - rect.top - player.height / 2 - 20;
}

canvas.addEventListener('mousemove', (event) => movePlayer(event.clientX, event.clientY));
canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    movePlayer(event.touches[0].clientX, event.touches[0].clientY);
}, { passive: false });

function update() {
    if (gameOver) return;

    sword.angle += 0.05;

    if (shakeDuration > 0) {
        shakeDuration--;
    }

    enemies.forEach((enemy, index) => {
        if (enemy.hit) {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            enemy.vx *= 0.95;
            enemy.vy *= 0.95;
            enemy.size -= 1;

            if (enemy.size <= 0) enemies.splice(index, 1);
            return;
        }

        const dx = player.x + player.width / 2 - enemy.x;
        const dy = player.y + player.height / 2 - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        enemy.x += (dx / distance) * enemySpeed;
        enemy.y += (dy / distance) * enemySpeed;

        const swordX = player.x + player.width / 2 + Math.cos(sword.angle) * sword.radius;
        const swordY = player.y + player.height / 2 + Math.sin(sword.angle) * sword.radius;
        const distToSword = Math.sqrt((swordX - enemy.x) ** 2 + (swordY - enemy.y) ** 2);

        if (distToSword < enemy.size / 2 + sword.width / 4) {
            enemy.hit = true;
            enemy.vx = (enemy.x - swordX) * 0.4;
            enemy.vy = (enemy.y - swordY) * 0.4;
            createParticles(enemy.x, enemy.y, enemy.vx, enemy.vy);
            createBloodSplat(enemy.x, enemy.y, Math.atan2(enemy.y - (player.y + player.height / 2), enemy.x - (player.x + player.width / 2))); // Передаём угол удара
            shakeDuration = 10; // Устанавливаем длительность тряски
            score++;

            // Меняем меч после 1 убитого врага
            if (score === 1) {
                swordImage = swordImage2;
            }
        }

        const distToPlayer = Math.sqrt((player.x + player.width / 2 - enemy.x) ** 2 + (player.y + player.height / 2 - enemy.y) ** 2);
        if (distToPlayer < enemy.size / 2 + player.width / 4) {
            gameOver = true;
            restartButton.style.display = 'block';
        }
    });

    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.005;

        if (particle.alpha <= 0) particles.splice(index, 1);
    });

    // Обновление брызг крови
    bloodSplats.forEach((splat, index) => {
        splat.alpha -= 0.002; // Замедляем уменьшение прозрачности
        if (splat.alpha <= 0) {
            bloodSplats.splice(index, 1);
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) return;

    let shakeX = 0;
    let shakeY = 0;
    if (shakeDuration > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Отрисовка брызг крови
    bloodSplats.forEach((splat, index) => {
        ctx.save();
        ctx.globalAlpha = splat.alpha;
        ctx.fillStyle = splat.color; // Используем вариативный цвет

        // Центр круга
        const centerX = splat.x + Math.cos(splat.angle) * splat.radius;
        const centerY = splat.y + Math.sin(splat.angle) * splat.radius;

        // Рисуем круг
        ctx.beginPath();
        ctx.arc(centerX, centerY, splat.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // Отрисовка игрока
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    const swordX = player.x + player.width / 2 + Math.cos(sword.angle) * sword.radius;
    const swordY = player.y + player.height / 2 + Math.sin(sword.angle) * sword.radius;
    ctx.save();
    ctx.translate(swordX, swordY);
    ctx.rotate(sword.angle);
    ctx.drawImage(swordImage, -sword.width / 2, -sword.height / 2, sword.width, sword.height);
    ctx.restore();

    enemies.forEach(enemy => {
        ctx.save();
        ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
        ctx.shadowBlur = 20;
        ctx.drawImage(enemyImage, enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
        ctx.restore();
    });

    particles.forEach(particle => {
        ctx.save();
        ctx.fillStyle = `rgba(255, 0, 0, ${particle.alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    ctx.fillStyle = 'white';
    ctx.font = '24px FCCR, sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 30);

    ctx.restore();

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

restartButton.addEventListener('click', () => {
    gameOver = false;
    enemies = [];
    particles = [];
    bloodSplats = []; // Сбрасываем брызги крови при перезапуске
    score = 0;
    restartButton.style.display = 'none';
    draw();
});

window.addEventListener('resize', resizeCanvas);

playerImage.onload = function() {
    resizeCanvas();
    setInterval(createEnemy, 1000);
    draw();
};