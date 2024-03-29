import Resources from "./Resources";

declare global {
    interface Window { resources: Resources; }
}

export default class Sprite {
    pos: number[];
    size: number[];
    speed: number;
    frames: number[];
    _index: number;
    url: string;
    dir: string;
    once: boolean;
    done: boolean

    constructor(url: string, pos: number[], size: number[], speed: number, frames: number[], dir?: string, once?: boolean) {
        this.pos = pos;
        this.size = size;
        this.speed = typeof speed === 'number' ? speed : 0;
        this.frames = frames;
        this._index = 0;
        this.url = url;
        this.dir = dir || 'horizontal';
        this.once = once || false;
        this.done = false
    }

    update(dt: number) {
        this._index += this.speed * dt;
    }

    render(ctx: CanvasRenderingContext2D) {
        var frame;

        if (this.speed > 0) {
            var max = this.frames.length;
            var idx = Math.floor(this._index);
            frame = this.frames[idx % max];

            if (this.once && idx >= max) {
                this.done = true;
                return;
            }
        }
        else {
            frame = 0;
        }

        var x = this.pos[0];
        var y = this.pos[1];

        switch (this.dir) {
            case 'RIGHT':
                x += frame * this.size[0];
                y = this.size[1] * 0;
                break;
            case 'UP':
                x += frame * this.size[0];
                y = this.size[1] * 3
                break;
            case 'DOWN':
                x += frame * this.size[0];
                y = this.size[1] * 2
                break;
            case 'LEFT':
                x += frame * this.size[0];
                y = this.size[1] * 1
                break;
            case 'UPRIGHT':
                x += frame * this.size[0];
                y = this.size[1] * 5
                break;
            case 'UPLEFT':
                x += frame * this.size[0];
                y = this.size[1] * 6
                break;
            case 'DOWNLEFT':
                x += frame * this.size[0];
                y = this.size[1] * 7
                break;
            case 'DOWNRIGHT':
                x += frame * this.size[0];
                y = this.size[1] * 4
                break;
            default:
                x += frame * this.size[0];
                break;
        }

        ctx.drawImage(window.resources.get(this.url),
            x, y,
            this.size[0], this.size[1],
            -this.size[0] / 2, -this.size[1] / 2,
            this.size[0], this.size[1]);

        // ctx.beginPath();
        // ctx.lineWidth = 1;
        // ctx.strokeStyle = "white";
        // ctx.rect(-this.size[0] / 2, -this.size[1] / 2, this.size[0], this.size[1]);
        // ctx.stroke();
    }

}