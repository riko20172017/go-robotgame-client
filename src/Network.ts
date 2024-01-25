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

    encoder: TextEncoder;
    decoder: TextDecoder;
    transport: WebTransport
    datagramWriter: WritableStreamDefaultWriter<any>

    messages: IMessage[]
    socket: Socket
    test: number = 3

    constructor() {
        this.transport = new WebTransport("https://localhost:4433/counter");
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();

        this.closeTransport(this.transport)

        this.datagramWriter = this.transport.datagrams.writable.getWriter();

        this.messages = []
        this.socket = io();
    }

    init(client: Client) {
        this.reader((data: any) => {

            switch (data.type) {
                case "OFFER":
                    client.playerId = data.uid
                    document.getElementById("game-start")?.classList.add("show");
                    document.getElementById("play")?.addEventListener("click", () => { this.send({ "type": "REQUEST", "id": 1 }) }, false)
                    break;
                case "JOIN":
                    console.log("JOIN");
                    client.players.push(new Player(client.playerId, 0, 0))
                    document.getElementById("game-start")?.classList.remove("show");
                    break;
                case "DATA":
                    console.log(data.x, data.y);
                default:
                    break;
            }
        })

        // this.writer({ id: "datagram" })

        // let network = this;

        // this.socket.emit('DISCOVER');

        // this.socket.on('DISCOVER', function (data: Discover) {
        //     client.playerId = data.uid
        //     document.getElementById("game-start")?.classList.add("show");
        //     document.getElementById("play")?.addEventListener("click", () => { network.socket.emit('JOIN', { uid: data.uid }) }, false)
        // })

        // this.socket.on('JOIN', function (data: any) {
        //     console.log(111);
        //     client.players.push(new Player(client.playerId, 0, 0))
        //     document.getElementById("game-start")?.classList.remove("show");
        // });

        // this.socket.on('state', function (data: IMessage) {
        //     network.messages.push(data);
        // })
    }

    receive() {
        return this.messages.shift()
    }

    gameOverScreen() {
        document.getElementById("game-over")?.classList.add("show");
    }

    async reader(dataReceivedFunction: Function) {
        try {
            let reader = this.transport.datagrams.readable.getReader();
            while (true) {
                const data = await reader.read();
                if (data.done) {
                    break;
                }
                dataReceivedFunction(JSON.parse(this.decoder.decode(data.value)));
            }
        } catch (error) {
            console.log('Datagram receive error :', error);
        }
    }

    send(data: any) {
        this.datagramWriter.write(this.encoder.encode(JSON.stringify(data)))
    }

    async closeTransport(transport: WebTransport) {
        // Respond to connection closing
        try {
            await transport.closed;
            console.log(`Connection closed normally`);
        } catch (error) {
            console.error(`Connection closed abruptly ${error}.`);
        }
    }
}

export default Network