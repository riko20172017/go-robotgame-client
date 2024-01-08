import Client from "./Client.js";
import { Player, PlayerTest } from "./units/Player.js";
import { ClientToServerEvents, Discover, IMessage, ServerToClientEvents } from "./Interfaces.js";

function io() {
    return new Socket()
}

class Socket {
    emit(text: "JOIN" | "DISCOVER" | "movement", obj?: {}) { }
    on(text: "DISCOVER" | 'JOIN' | "state", fn: ((data: Discover) => void) | ((data: IMessage) => void)) { }
}

class Network {

    messages: IMessage[]
    socket: Socket
    test: number = 2

    constructor() {
        this.messages = []
        this.socket = io();
    }

    init(client: Client) {
        let network = this;

        this.socket.emit('DISCOVER');

        this.socket.on('DISCOVER', function (data: Discover) {
            client.playerId = data.uid
            document.getElementById("game-start")?.classList.add("show");
            document.getElementById("play")?.addEventListener("click", () => { network.socket.emit('JOIN', { uid: data.uid }) }, false)
        })

        this.socket.on('JOIN', function (data: any) {
            console.log(111);
            client.players.push(new Player(client.playerId, 0, 0))
            document.getElementById("game-start")?.classList.remove("show");
        });

        this.socket.on('state', function (data: IMessage) {
            network.messages.push(data);
        })
    }

    receive() {
        return this.messages.shift()
    }

    gameOverScreen() {
        document.getElementById("game-over")?.classList.add("show");
    }
}

export default Network