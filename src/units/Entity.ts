import Sprite from "../Sprite";

abstract class Entity {
    id: string;
    x: number
    y: number
    speed: number
    angle: number
    abstract sprite: Sprite

    constructor(id: string, x: number, y: number) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.speed = 200
        this.angle = 0
    }

    changeDirection(dir: string) { }

    calculateAngle(x1: number, y1: number, x2: number, y2: number) {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle)
        this.sprite.render(ctx)
        ctx.restore();
    }
}

export default Entity