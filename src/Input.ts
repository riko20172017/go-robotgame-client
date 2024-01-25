class Keys {
    SPACE = 0
    LEFT = 0
    UP = 0
    RIGHT = 0
    DOWN = 0
    MOUSE = { x: 0, y: 0 }
}

class Input {

    keys: Keys = new Keys()

    constructor() {
        document.addEventListener('keydown', this.keydown.bind(this));
        document.addEventListener('keyup', this.keyup.bind(this));
        document.addEventListener('blur', this.blur.bind(this));
        document.addEventListener('mousemove', this.mousemove.bind(this));
    }

    setKey(event: KeyboardEvent, status: number) {
        switch (event.keyCode) {
            case 32:
                this.keys.SPACE = status; break;
            case 65:
                this.keys.LEFT = status; break;
            case 87:
                this.keys.UP = status; break;
            case 68:
                this.keys.RIGHT = status; break;
            case 83:
                this.keys.DOWN = status; break;
            default:
        }
    }

    keydown(e: KeyboardEvent) {
        this.setKey(e, 1);
    }

    keyup(e: KeyboardEvent) {
        this.setKey(e, 0);
    }

    blur() {
        this.keys.SPACE = 0
        this.keys.LEFT = 0
        this.keys.UP = 0
        this.keys.RIGHT = 0
        this.keys.DOWN = 0
    };


    mousemove(e: MouseEvent) {
        this.keys.MOUSE.x = e.offsetX;
        this.keys.MOUSE.y = e.offsetY;
    }

    getKeys() {
        return this.keys
    }
    // document.inputManual = function (key) {
    //     return { ...window.input, mouse: { ...window.getMouse() } };
    // }
}

export { Input, Keys }