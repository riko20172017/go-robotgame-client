import Network from "./Network.js"
import Bullet from "./units/Bullet.js";
import Entity from "./units/Entity.js";
import Settings from "./Settings.js";
import { Player } from "./units/Player.js";
import { Input, Keys } from "./Input.js";
import { IInput } from "./Interfaces.js";
import Explosion from "./units/Explosion.js";

// player id = asdasd

class Client {

  playerId: string
  players: Array<Player>
  bullets: Array<Bullet>
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
  bulletIndex: number

  constructor() {
    this.playerId = ""
    this.players = []
    this.bullets = []
    this.bulletIndex = 0
    this.enemies = []
    this.explosions = []
    this.pending_inputs = []
    this.stateBufer = []
    this.lastFire = performance.now()
    this.server_reconciliation = true
    this.entity_interpolation = true
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

    this.processInputs(dt, this.input.getKeys());

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
      let bullets = message.bullets
      let explosions = message.explosions

      // Add bullets
      for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        if (bullet.playerId !== this.playerId) {
          this.bullets.push(new Bullet(bullet.id, bullet.playerId, bullet.x, bullet.y, [bullet.vx, bullet.vy], bullet.angle))
        }
      }

      // Add explosions
      for (let i = 0; i < explosions.length; i++) {
        const explosion = explosions[i];
        this.explosions.push(new Explosion(explosion.x, explosion.y))
        let bulletIndex = this.bullets.findIndex(bullet => bullet.id == explosion.bulletId)
        this.bullets.splice(bulletIndex, 0)
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
          player.pos[0] = state.x
          player.pos[1] = state.y

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
            player.pos[0] = state.x
            player.pos[1] = state.y
          } else {
            // Add it to the position buffer.
            var timestamp = +new Date();
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

  processInputs(delta: number, keys: Keys) {

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

      player.applyInput(keys, delta)

      // Process fire start ---------------------------------------------------------------------==>

      if (keys.SPACE && ((performance.now() - this.lastFire) > Settings.rocketDelay)) {

        var x = player.pos[0] + player.sprite.size[0] / 2;
        var y = player.pos[1] + player.sprite.size[1] / 2;
        var mx = keys.MOUSE.x;
        var my = keys.MOUSE.y;
        var vx = mx - x;
        var vy = my - y;
        var dist = Math.sqrt(vx * vx + vy * vy);
        var vx = vx / dist;
        var vy = vy / dist;
        var angle = -Math.atan2(vx, vy) + + 1.5;

        this.bullets.push(new Bullet(this.playerId + this.bulletIndex, this.playerId, x, y, [vx, vy], angle,))

        this.lastFire = performance.now();

        input.bullet = { id: this.playerId + this.bulletIndex, playerId: player.id, x, y, vx, vy, angle }
      }

      // Process fire end -----------------------------------------------------------------------

      this.network.socket.emit('movement', input);

      this.pending_inputs.push(input)
      this.stateBufer.push({ tik: this.tik, state: player.pos });
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
    for (var i = 0; i < this.bullets.length; i++) {
      var bullet = this.bullets[i];

      // bullet.pos[0] += bulletSpeed * dt * (- 1);
      bullet.pos[0] += Settings.rocketSpeed * dt * (bullet.way[0]);
      bullet.pos[1] += Settings.rocketSpeed * dt * (bullet.way[1]);

      // Remove the bullet if it goes offscreen
      if (bullet.pos[1] < 0 || bullet.pos[1] > Settings.height ||
        bullet.pos[0] > Settings.width) {
        this.bullets.splice(i, 1);
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
    var now = +new Date();
    var render_timestamp = now - (1000.0 / 30);

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

        player.pos[0] = x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
        player.pos[1] = y0 + (y1 - y0) * (render_timestamp - t0) / (t1 - t0);
      }
    }
  }

  getPlayer(id: string): Player | undefined {
    // return players.find(player => player.id == playerId);
    return this.players.find(player => player.id == id);
  }

}

export default Client