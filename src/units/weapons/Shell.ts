import Config from '../../Config.js';
import Sprite from "../../Sprite.js";
import Entity from "../Entity.js"

class Shell extends Entity {
    type: string
    playerId: string
    sx: number
    sy: number
    tx: number
    ty: number
    dx: number
    dy: number
    moves: number
    angle: number
    sprite: Sprite
    distance: number

    constructor(
        id: string,
        type: string,
        playerId: string,
        x: number,
        y: number,
        tx: number,
        ty: number,
        sprite: Sprite
    ) {
        super(id, x, y)
        this.type = type
        this.playerId = playerId
        this.sx = x
        this.sy = y
        this.tx = tx
        this.ty = ty
        this.dx = 0
        this.dy = 0
        this.moves = 0
        this.distance = 0
        this.sprite = sprite
        this.angle = 0

        this.init()

    }
    init() {
        this.angle = this.calculateAngle(this.x, this.y, this.tx, this.ty);
        this.dx = Math.cos(this.angle * Math.PI / 180);
        this.dy = Math.sin(this.angle * Math.PI / 180);
    }

    update(deltaTime: number) {

        this.x += Config.rocketSpeed * this.dx * deltaTime;
        this.y += Config.rocketSpeed * this.dy * deltaTime;
    }

    isMoveEnd(deltaTime: number) {
        let distance = Math.sqrt((this.tx - this.x) ** 2 + (this.ty - this.y) ** 2);
        if (distance > (Config.rocketSpeed * deltaTime)) { return false }
        else { return true }
    }

    isOutOfScreen() {
        return this.x < 0 || this.y < 0 || this.y > Config.height ||
            this.x > Config.width
    }
}

export default Shell