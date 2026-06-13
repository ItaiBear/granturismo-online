// 3-2-1 countdown while the player drives in, ported from scenes/countdown.py.
import { Scene } from "./base.js";
import { image } from "../assets.js";
import { pointInRect, trunc } from "../util.js";

export class CountdownScene extends Scene {
  constructor(app) {
    super(app);
    const win = this.config.window;
    this.world.aiCars = [];
    this.world.speed = 0;
    this.player = this.world.resetPlayer(win.height, trunc((this.config.road.lane_count + 1) / 2));
    this._restYThreshold = trunc(win.height * this.config.player.rest_y_ratio);
    this._brakeYThreshold = trunc(win.height * this.config.player.brake_y_ratio);
    this._tempSpeed = 1;
    this._counter = 0;
    this._startTicks = app.now();

    const trans = this.config.ui_assets.countdown_transparent;
    this._signs = {
      1: image(this.config.ui_assets.countdown_3, trans),
      2: image(this.config.ui_assets.countdown_2, trans),
      3: image(this.config.ui_assets.countdown_1, trans),
    };
    this._signPos = [trunc(win.width / 2) - 50, trunc(win.height * 0.25)];

    this._pauseIcon = image(this.config.ui_assets.pause, trans);
    this._muteIcon = image(this.config.ui_assets.mute);
    this._unmuteIcon = image(this.config.ui_assets.unmute);
    this._pauseIconRect = { x: 10, y: 10, w: 50, h: 50 };
    this._muteIconRect = { x: 60, y: 10, w: 40, h: 40 };
  }

  _enterPause() {
    this.app.setScene(this.app.scenes.Pause, this);
  }

  handleEvent(event) {
    const keys = this.config.keys;
    if (event.type === "pointerdown") {
      if (pointInRect(this._pauseIconRect, event.pos)) this._enterPause();
      else if (pointInRect(this._muteIconRect, event.pos)) this.world.toggleMute();
    } else if (event.type === "keydown") {
      if (event.key === keys.pause) this._enterPause();
      else if (event.key === keys.mute) this.world.toggleMute();
    }
  }

  update() {
    this.world.spawnStep(1.0, false);
    this.world.scrollStep();

    if (this.player.rect.y > this._restYThreshold) {
      if (this.player.rect.y < this._brakeYThreshold) this._tempSpeed -= 2;
      this.player.rect.y -= this._tempSpeed;
      this._tempSpeed += 1;
    }

    if ((this.app.now() - this._startTicks) / 1000.0 > 1.0) {
      this._startTicks = this.app.now();
      this._counter += 1;
    }
    if (this._counter >= 4) {
      this.app.setScene(this.app.scenes.Gameplay);
    }
  }

  render(ctx) {
    this.world.renderWorld(ctx);
    const sign = this._signs[this._counter];
    if (sign) ctx.drawImage(sign, this._signPos[0], this._signPos[1]);
    this.world.renderPlayer(ctx);
    ctx.drawImage(this._pauseIcon, this._pauseIconRect.x, this._pauseIconRect.y);
    ctx.drawImage(
      this.world.muted ? this._muteIcon : this._unmuteIcon,
      this._muteIconRect.x,
      this._muteIconRect.y
    );
  }
}
