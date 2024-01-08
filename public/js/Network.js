import { Player } from "./units/Player.js";
function io() {
    return new Socket();
}
class Socket {
    emit(text, obj) { }
    on(text, fn) { }
}
class Network {
    messages;
    socket;
    test = 3;
    constructor() {
        this.messages = [];
        this.socket = io();
    }
    init(client) {
        let network = this;
        this.socket.emit('DISCOVER');
        this.socket.on('DISCOVER', function (data) {
            client.playerId = data.uid;
            document.getElementById("game-start")?.classList.add("show");
            document.getElementById("play")?.addEventListener("click", () => { network.socket.emit('JOIN', { uid: data.uid }); }, false);
        });
        this.socket.on('JOIN', function (data) {
            console.log(111);
            client.players.push(new Player(client.playerId, 0, 0));
            document.getElementById("game-start")?.classList.remove("show");
        });
        this.socket.on('state', function (data) {
            network.messages.push(data);
        });
    }
    receive() {
        return this.messages.shift();
    }
    gameOverScreen() {
        document.getElementById("game-over")?.classList.add("show");
    }
}
export default Network;
//# sourceMappingURL=Network.js.map