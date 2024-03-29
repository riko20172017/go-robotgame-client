import { Keys } from "src/Input.js";
import Settings from "../Config.js";
import Sprite from "../Sprite.js";
import Entity from "./Entity.js"

class Player extends Entity {
    position_buffer: number[][]
    sprite: Sprite
    
    constructor(id: string, x: number, y: number) {
        super(id, x, y)
        this.id = id;
        this.sprite = new Sprite('public/img/player.png', [0, 0], [40, 40], 16, [0, 1])
        this.speed = Settings.playerSpeed
        this.position_buffer = []

    }

    applyInput(keys: Keys, delta: number) {
        delta = delta * this.speed;
        var dir = ""

        if (keys.DOWN) {
            this.y += delta;
            dir = dir.concat("DOWN")
        }
        if (keys.UP) {
            this.y -= delta;
            dir = dir.concat("UP")
        }
        if (keys.RIGHT) {
            this.x += delta;
            dir = dir.concat("RIGHT")
        }
        if (keys.LEFT) {
            this.x -= delta;
            dir = dir.concat("LEFT")
        }
        
        this.changeDirection(dir);
    }

    changeDirection(dir: string) {
        this.sprite.dir = dir
    }
}

class PlayerTest extends Player {
    constructor(id: string, x: number, y: number) {
        super(id, x, y)
        this.sprite = new Sprite('img/playerTest.png', [0, 0], [40, 40], 16, [0, 1])
    }
}

export { Player, PlayerTest }