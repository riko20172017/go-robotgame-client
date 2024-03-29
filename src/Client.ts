import Network from "./Network.js"
import Shell from "./units/weapons/Shell.js";
import Entity from "./units/Entity.js";
import Settings from "./Config.js";
import { Player } from "./units/Player.js";
import { Input } from "./Input.js";
import { IInput } from "./Interfaces.js";
import Explosion from "./units/Explosion.js";
import Rocket from "./units/weapons/Rocket.js";

// player id = asdasd

class Client {

  playerId: string
  players: Array<Player>
  shells: Array<Shell>
  enemies: Array<Entity>
  explosions: Array<Entity>
  pending_inputs: IInput[]
  stateBufer: Array<any>
  lastFire: number
  tik: number
  network: Network
  input: Input
  server_reconciliation: boolean
  entity_interpolation: boolean
  client_side_prediction: boolean
  shellIndex: number

  constructor() {
    this.playerId = ""
    this.players = []
    this.shells = []
    this.shellIndex = 0
    this.enemies = []
    this.explosions = []
    this.pending_inputs = []
    this.stateBufer = []
    this.lastFire = performance.now()
    this.server_reconciliation = false
    this.entity_interpolation = true
    this.client_side_prediction = true
    this.tik = 0
    this.network = new Network()
    this.input = new Input()

    this.network.init(this)
  }

  update(dt: number) {
    // Listen to the server.
    this.processServerMessages();

    if (this.playerId == "") {
      return;  // Not connected yet.
    }

    this.processInputs(dt);

    // Interpolate other entities.
    if (this.entity_interpolation) {
      this.interpolateEntities();
    }

    this.updateEntities(dt);
  }

  havePlayer(id: string) {
    return this.players.some((player) => player.id == id)
  }

  processServerMessages() {

    while (true) {/*➿*/
      let message = this.network.receive()
      if (!message) break; /*⛔*/

      let states = message.states
      let shells = message.bullets
      let explosions = message.explosions

      // Add bullets
      for (let i = 0; i < shells.length; i++) {
        const shell = shells[i];
        if (shell.playerId !== this.playerId) {
          this.shells.push(new Rocket(
            shell.id,
            shell.playerId,
            shell.x,
            shell.y,
            shell.tx,
            shell.ty,
          ))
        }
      }

      // Add explosions
      for (let i = 0; i < explosions.length; i++) {
        const explosion = explosions[i];
        this.explosions.push(new Explosion(explosion.x, explosion.y))
        let bulletIndex = this.shells.findIndex(bullet => bullet.id == explosion.bulletId)
        this.shells.splice(bulletIndex, 1)
      }

      // World state is a list of entity states.
      for (var i = 0; i < states.length; i++) {/*➿*/
        var state = states[i];

        // If this is the first time we see this entity, create a local representation.
        if (!this.havePlayer(state.uid)) {
          let player = new Player(state.uid, state.x, state.y);
          this.players.push(player);
        }

        let player = this.getPlayer(state.uid)
        if (!player) {
          console.log("there is no entity state");
          continue
        }

        // Received the authoritative position of this client's entity.
        if (state.uid == this.playerId) {
          player.x = state.x
          player.y = state.y

          // var testPlayer = this.getPlayer("asdasd")
          // if (testPlayer) {
          //   testPlayer.pos[0] = state.x
          //   testPlayer.pos[1] = state.y
          //   testPlayer.changeDirection(state.dir)
          // }

          if (this.server_reconciliation) {
            var j = 0;
            while (j < this.pending_inputs.length) {    /*➿*/
              let input = this.pending_inputs[j];
              if (input.tik <= state.lastTik) {
                // Already processed. Its effect is already taken into account into the world update
                // we just got, so we can drop it.
                this.pending_inputs.splice(j, 1);
              }
              else {
                // Not processed by the server yet. Re-apply it.
                player.applyInput(input.keys, input.delta)
                j++;
              }
            }
          }
          else {
            // Reconciliation is disabled, so drop all the saved inputs.
            this.pending_inputs = [];
          }
        }
        else {
          // Received the position of an entity other than this client's.
          if (!this.entity_interpolation) {
            // Entity interpolation is disabled - just accept the server's position.
            player.x = state.x
            player.y = state.y
          } else {
            // Add it to the position buffer.
            var timestamp = +performance.now();
            player.position_buffer.push([timestamp, state.x, state.y]);
          }
        }
      }


      // If this is disconnected or destroied, remove a local representation.
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        const uid = player.id

        if (states.find(state => state.uid == uid) == undefined) {
          this.players.splice(i, 1)
        }
      }
    }

    this.network.messages = []
  }

  processInputs(delta: number) {

    let keys = this.input.getKeys()

    if (keys.DOWN || keys.UP || keys.RIGHT || keys.LEFT || keys.SPACE) {
      let input: IInput = {
        tik: this.tik,
        uid: this.playerId,
        delta,
        keys,
      }

      // const player = this.getPlayer("asdasd");
      const player = this.getPlayer(this.playerId);

      if (!player) {
        console.log("local player is not exist")
        return
      }

      if (this.client_side_prediction) {
        player.applyInput(keys, delta)
      }


      // Process fire start ---------------------------------------------------------------------==>

      if (keys.SPACE && ((performance.now() - this.lastFire) > Settings.rocketDelay)) {

        let x = player.x;
        let y = player.y;
        let tx = keys.MOUSE.x;
        let ty = keys.MOUSE.y;

        this.shellIndex++

        let shell: Rocket = new Rocket(
          this.shellIndex.toString(),
          this.playerId,
          x,
          y,
          tx,
          ty,
        );

        this.shells.push(shell)

        this.lastFire = performance.now();

        input.shell =
        {
          id: shell.id,
          playerId: shell.playerId,
          x: shell.x,
          y: shell.y,
          tx: shell.tx,
          ty: shell.ty,
          radian: shell.radian,
          type: shell.type
        }
      }

      // Process fire end -----------------------------------------------------------------------

      this.network.socket.emit('movement', input);

      this.pending_inputs.push(input)
      this.stateBufer.push({ tik: this.tik, state: [player.x, player.y] });
    }
  }

  updateEntities(dt: number) {
    // Update the player sprite animation
    for (const key in this.players) {
      if (Object.hasOwnProperty.call(this.players, key)) {
        const player = this.players[key];
        player.sprite.update(dt);

      }
    }

    // Update all the bullets
    for (var i = 0; i < this.shells.length; i++) {
      var shell = this.shells[i];

      shell.update(dt)

      // Remove the bullet if it goes offscreen
      if (shell.isMoveEnd() || shell.isOutOfScreen()) {
        // Add explosions
        this.explosions.push(new Explosion(shell.x, shell.y))
        this.shells.splice(i, 1);
        i--;
      }
    }

    // Update all the explosions
    for (var i = 0; i < this.explosions.length; i++) {
      this.explosions[i].sprite.update(dt);

      // Remove if animation is done
      if (this.explosions[i].sprite.done) {
        this.explosions.splice(i, 1);
        i--;
      }
    }
  }

  interpolateEntities() {

    // Compute render timestamp.
    var now = +performance.now();
    var render_timestamp = now - (1000.0 / 10);

    for (var i in this.players) {
      var player = this.players[i];

      // No point in interpolating this client's entity.
      // if (player.id == this.playerId && player.id == "asdasd") {
      if (player.id == this.playerId) {
        continue;
      }

      // Find the two authoritative positions surrounding the rendering timestamp.
      var buffer = player.position_buffer;

      // Drop older positions.
      while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
        buffer.shift();
      }

      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
        var x0 = buffer[0][1];
        var x1 = buffer[1][1];
        var y0 = buffer[0][2];
        var y1 = buffer[1][2];
        var t0 = buffer[0][0];
        var t1 = buffer[1][0];

        player.x = x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
        player.y = y0 + (y1 - y0) * (render_timestamp - t0) / (t1 - t0);
      }
    }
  }

  getPlayer(id: string): Player | undefined {
    // return players.find(player => player.id == playerId);
    return this.players.find(player => player.id == id);
  }

}

export default Client