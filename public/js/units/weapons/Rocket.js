import Sprite from "../../Sprite.js";
import Shell from "./Shell.js";
class Rocket extends Shell {
    constructor(id, playerId, x, y, tx, ty) {
        super(id, "rocket", playerId, x, y, tx, ty, new Sprite('public/img/sprites.png', [0, 39], [18, 6], 10, [0, 0]));
    }
}
export default Rocket;
//# sourceMappingURL=Rocket.js.map