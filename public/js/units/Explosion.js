import Sprite from "../Sprite.js";
import Entity from "./Entity.js";
class Explosion extends Entity {
    sprite;
    constructor(x, y) {
        super("", x, y);
        this.sprite = new Sprite('public/img/sprites.png', [0, 117], [39, 39], 16, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], undefined, true);
    }
}
export default Explosion;
//# sourceMappingURL=Explosion.js.map