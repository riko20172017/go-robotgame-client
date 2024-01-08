class Entity {
    id;
    x;
    y;
    speed;
    radian;
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.speed = 200;
        this.radian = 0;
    }
    changeDirection(dir) { }
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.radian);
        this.sprite.render(ctx);
        ctx.restore();
    }
}
export default Entity;
//# sourceMappingURL=Entity.js.map