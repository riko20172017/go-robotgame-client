import Player from "./units/player.js";
import Sprite from "./sprite.js";
import PlayerTest from "./units/playerTest.js";

// Create the canvas
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// The main game loop
var lastTime;

resources.load([
    'img/sprites.png',
    'img/terrain.png',
    'img/player.png',
    'img/playerTest.png',
]);
resources.onReady(init);

// Game state
var fps = 30;
var frameCount = 0;
var interval = 1000 / fps;
var now;
var now1;
var elapsed;
var then = performance.now();
var startTime = then;
var players = [];
var bullets = [];
var enemies = [];
var explosions = [];
var playerId;
var tik = 0;
var stateBufer = [];
var inputBufer = [];
var messages = []

var lastFire = Date.now();
var gameTime = 0;
var isGameOver;
var terrainPattern;
var currentFps = 0

// Speed in pixels per second
var playerSpeed = 200;
var bulletSpeed = 500;
var enemySpeed = 100;
var dt = 0;

var socket = io();

socket.emit('DISCOVER');

socket.on('OFFER', function (data) {
    playerId = data
    players.push(new Player(playerId, 0, 0))
    players.push(new PlayerTest("asdasd", 0, 0))
});

socket.on('state', function (data) {
    messages.push(data);
})



// players = players.map(player => {
//     player.pos[0] = play.x
//     player.pos[1] = player.y
//     player.changeDirection(player.dir)
// })
// for (const id in data) {
//     if (Object.hasOwnProperty.call(data, id)) {
//         const player = data[id];
//         players[id].pos[0] = player.x
//         players[id].pos[1] = player.y
//         players[id].changeDirection(player.dir)
//     }
// }

// for (let index = data.tik; index <= tik; index++) {
//     update(inputBufer[data.tik].dt, inputBufer[data.tik].input)
// }

// stateBufer.shift(0, data.tik)
// inputBufer.shift(0, data.tik)

// if (data?.bullet) {
//     bullets.push({
//         ...data.bullet,
//         sprite: new Sprite('img/sprites.png', [0, 39], [18, 8], [0, 0], 10, data.bullet.dir)
//     })
// }



socket.on('explosions', function (data) {
    delete players[data.player.id]
    bullets.splice(data.bulletKey, 1);
    explosions.push({
        pos: [data.player.x, data.player.y],
        sprite: new Sprite('img/sprites.png',
            [0, 117],
            [39, 39],
            16,
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            null,
            true)
    });

})

function main() {
    requestAnimationFrame(main);

    now = performance.now();
    elapsed = now - then;

    if (elapsed > interval) {
        then = now - (elapsed % interval);
        var sinceStart = now - startTime;
        now1 = performance.now();
        dt = Math.abs((now1 - lastTime) / 1000);

        messages.forEach((message) => {
            message.forEach(state => {
                var player = getPlayerById(players, state.uid);
                player.pos[0] = state.x
                player.pos[1] = state.y

                if (state.uid == playerId) {
                    var serverTik = state.lastTik

                    var bufferIndex = inputBufer.findIndex(input => {
                        return input.tik == serverTik
                    })

                    if (!(bufferIndex == -1)) {

                        var limitVal = 30;
                        var xMin, xMax, yMin, yMax;
                        var [sbX, sbY] = stateBufer[bufferIndex].state;
                        xMin = sbX - limitVal
                        xMax = sbX + limitVal
                        yMin = sbY - limitVal
                        yMax = sbY + limitVal

                        inputBufer.splice(0, bufferIndex + 1)
                        stateBufer.splice(0, bufferIndex + 1)

                        if (
                            state.x < xMin ||
                            state.x > xMax ||
                            state.y < yMin ||
                            state.y > yMax
                        ) {
                            var testPlayer = getPlayer()
                            testPlayer.pos[0] = state.x
                            testPlayer.pos[1] = state.y
                            testPlayer.changeDirection(state.dir)

                            // inputBufer.forEach((input, i) => {
                            //     update(input.dt, input.input)
                            // })
                        };
                    }
                }
            });

        })

        messages = []

        update(dt, window.input, tik);

        render();

        if (!(tik % 5)) {
            currentFps = Math.round(1000 / (now1 - lastTime));
            gameTime = Math.round((sinceStart / 1000) * 100) / 100
        }

        ctx.fillStyle = "white"
        ctx.font = "18px arial";
        ctx.fillText("time: " + gameTime, 350, 20);
        ctx.fillText("fps:   " + currentFps, 350, 40);


        lastTime = now1;
        tik++;

    }
}

function init() {
    terrainPattern = ctx.createPattern(resources.get('img/terrain.png'), 'repeat');

    document.getElementById('play-again').addEventListener('click', function () {
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

// Update game objects
function update(dt, input, tik) {
    handleInput(dt, input, tik);
    updateEntities(dt);

};

function handleInput(dt, keys, tik) {
    var input
    if (isDown('s', keys)) {
        input = { dir: 'DOWN' }
    }
    else if (isDown('w', keys)) {
        input = { dir: 'UP' }
    } else if (isDown('d', keys)) {
        input = { dir: 'RIGHT' }
    }
    else if (isDown('a', keys)) {
        input = { dir: 'LEFT' }
    }
    else {
        return
    }

    input.tik = tik
    input.delta = dt
    input.uid = playerId

    const player = getPlayer();
    player.move(input)

    socket.emit('movement', input);

    inputBufer.push(input)
    stateBufer.push({ tik, state: getPlayer().pos });
}

function updateEntities(dt) {
    // Update the player sprite animation
    for (const key in players) {
        if (Object.hasOwnProperty.call(players, key)) {
            const player = players[key];
            player.sprite.update(dt);

        }
    }

    // Update all the bullets
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];

        // bullet.pos[0] += bulletSpeed * dt * (- 1);
        bullet.pos[0] += bulletSpeed * dt * (bullet.way[0]);
        bullet.pos[1] += bulletSpeed * dt * (bullet.way[1]);



        // Remove the bullet if it goes offscreen
        if (bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
            bullet.pos[0] > canvas.width) {
            bullets.splice(i, 1);
            i--;
        }
    }

    // Update all the enemies
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].pos[0] -= enemySpeed * dt;
        enemies[i].sprite.update(dt);

        // Remove if offscreen
        if (enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
            enemies.splice(i, 1);
            i--;
        }
    }

    // Update all the explosions
    for (var i = 0; i < explosions.length; i++) {
        explosions[i].sprite.update(dt);

        // Remove if animation is done
        if (explosions[i].sprite.done) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

function checkPlayerBounds() {
    // Check bounds
    if (player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if (player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if (player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if (player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if (!isGameOver) {
        players.forEach(player => renderEntity(player))
    }

    renderEntities(bullets);
    renderEntities(enemies);
    renderEntities(explosions);
};

function renderEntities(list) {
    for (var i = 0; i < list.length; i++) {
        renderEntity(list[i]);
    }
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    ctx.rotate(entity.dir)
    entity.sprite.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 0;

    enemies = [];
    bullets = [];

    // player.pos = [50, canvas.height / 2];
};

function getPlayer() {
    // return players.find(player => player.id == playerId);
    return players.find(player => player.id == "asdasd");
}

function getPlayerById(players, playerId) {
    return players.find(({ id }) => id == playerId);
}

function isDown(key, input) {
    return input[key.toUpperCase()];
}

window.input = {};
var mouse = { x: 0, y: 0 };

function setKey(event, status) {
    var code = event.keyCode;
    var key;

    switch (code) {
        case 32:
            key = 'SPACE'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'UP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;
        default:
            // Convert ASCII codes to letters
            key = String.fromCharCode(code);
    }

    window.input[key] = status;

}


document.addEventListener('keydown', function (e) {
    setKey(e, true);
});

document.addEventListener('keyup', function (e) {
    setKey(e, false);
});

window.addEventListener('blur', function () {
    window.input = {};
});

window.inputManual = function (key) {
    return { ...window.input, mouse: { ...window.getMouse() } };
}

canvas.addEventListener('mousemove', event => {
    mouse.x = event.offsetX;
    mouse.y = event.offsetY;
});

window.getMouse = function () {
    return { x: mouse.x, y: mouse.y };
}
