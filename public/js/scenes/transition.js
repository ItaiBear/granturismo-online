// "Reset vehicles" speed-up sweep, ported from granturismo/scenes/transition.py.
import { Scene } from "./base.js";

export class TransitionScene extends Scene {
  constructor(app, nextFactory, accel = 2, maxSpeed = 80, decel = 1) {
    super(app);
    this._nextFactory = nextFactory;
    this._accel = accel;
    this._max = maxSpeed;
    this._decel = decel;
    this._slowing = false;
    this._originalSpeed = this.world.speed;
    this.world.speed = 10;
  }

  update() {
    this.world.spawnStep(3.0, false);
    this.world.scrollStep();

    if (this.world.speed >= this._max || this._slowing) {
      this._slowing = true;
      this.world.speed -= this._decel;
    } else {
      this.world.speed += this._accel;
    }

    if (this.world.speed <= 0) {
      this.world.aiCars = [];
      this.world.speed = this._originalSpeed;
      this.app.setScene(this._nextFactory);
    }
  }

  render(ctx) {
    this.world.renderBackground(ctx);
  }
}
