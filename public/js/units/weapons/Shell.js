import Config from '../../Config.js';
import Entity from "../Entity.js";
class Shell extends Entity {
    type;
    playerId;
    sx;
    sy;
    tx;
    ty;
    dx;
    dy;
    moves;
    radian;
    sprite;
    distance;
    constructor(id, type, playerId, x, y, tx, ty, sprite) {
        super(id, x, y);
        this.type = type;
        this.playerId = playerId;
        this.sx = x;
        this.sy = y;
        this.tx = tx;
        this.ty = ty;
        this.dx = 0;
        this.dy = 0;
        this.moves = 0;
        this.distance = 0;
        this.sprite = sprite;
        this.radian = 0;
        this.init();
    }
    init() {
        var diffx = this.tx - this.x;
        var diffy = this.ty - this.y;
        this.distance = Math.sqrt(diffx * diffx + diffy * diffy);
        this.moves = this.distance / 0.9;
        this.dx = diffx / this.moves;
        this.dy = diffy / this.moves;
        this.radian = Math.atan2(diffy, diffx);
    }
    update(dt) {
        this.x += Config.rocketSpeed * dt * this.dx;
        this.y += Config.rocketSpeed * dt * this.dy;
    }
    isMoveEnd() {
        var diffx = this.x - this.sx;
        var diffy = this.y - this.sy;
        let distance = Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2));
        if (distance > this.distance) {
            return true;
        }
    }
    isOutOfScreen() {
        return this.x < 0 || this.y < 0 || this.y > Config.height ||
            this.x > Config.width;
    }
}
export default Shell;
//# sourceMappingURL=Shell.js.map