// The active race, ported from granturismo/scenes/gameplay.py.
// Adds tap-left / tap-right steering for touch devices.
import { Scene } from "./base.js";
import { rectsCollide } from "../game/collision.js";
import { makeRoundPanel } from "../ui/widgets.js";
import { cssFont, drawCenteredText } from "../ui/text.js";
import { image } from "../assets.js";
import { pointInRect, trunc } from "../util.js";

export class GameplayScene extends Scene {
  constructor(app) {
    super(app);
    const win = this.config.window;
    this.world.speed = 0;
    this.score = 0;
    this._startTicks = app.now();

    const trans = this.config.ui_assets.countdown_transparent;
    this._goSign = image(this.config.ui_assets.go, trans);
    this._goPos = [trunc(win.width / 2) - 50, trunc(win.height * 0.25)];

    this._pauseIcon = image(this.config.ui_assets.pause, trans);
    this._muteIcon = image(this.config.ui_assets.mute);
    this._unmuteIcon = image(this.config.ui_assets.unmute);
    this._pauseIconRect = { x: 10, y: 10, w: 50, h: 50 };
    this._muteIconRect = { x: 60, y: 10, w: 40, h: 40 };

    this._scoreFont = cssFont("Comic Sans MS", 47, true);
  }

  _enterPause() {
    this.app.setScene(this.app.scenes.Pause, this);
  }

  handleEvent(event) {
    const keys = this.config.keys;
    if (event.type === "pointerdown") {
      if (pointInRect(this._pauseIconRect, event.pos)) {
        this._enterPause();
      } else if (pointInRect(this._muteIconRect, event.pos)) {
        this.world.toggleMute();
      } else if (this.world.player) {
        // Touch / click steering: left half <-, right half ->.
        if (event.pos[0] < this.config.window.width / 2) this.world.player.shift(-1);
        else this.world.player.shift(+1);
      }
    } else if (event.type === "keydown") {
      if (!this.world.player) return;
      if (event.key === keys.left) this.world.player.shift(-1);
      else if (event.key === keys.right) this.world.player.shift(+1);
      else if (event.key === keys.pause) this._enterPause();
      else if (event.key === keys.mute) this.world.toggleMute();
    }
  }

  update() {
    const s = this.config;
    if (this.world.speed < s.player.speed) this.world.speed += 1;

    const elapsed = (this.app.now() - this._startTicks) / 1000.0;
    if (elapsed > s.difficulty.speedup_seconds) {
      this._startTicks = this.app.now();
      this.world.speed += s.difficulty.speedup_amount;
    }

    this.world.spawnStep();
    this.world.scrollStep();
    if (this.world.player) this.world.player.update();

    if (this._goPos[1] < s.window.height) this._goPos[1] += trunc(this.world.speed);

    const player = this.world.player;
    if (player) {
      for (const car of this.world.aiCars) {
        if (rectsCollide(player.rect, car.rect)) {
          this.app.setScene(this.app.scenes.GameOver, this.score);
          return;
        }
      }
    }

    this.score += trunc(this.world.speed);
  }

  render(ctx) {
    const win = this.config.window;
    this.world.renderWorld(ctx);
    if (this._goPos[1] < win.height) ctx.drawImage(this._goSign, this._goPos[0], this._goPos[1]);
    this.world.renderPlayer(ctx);
    this._renderScore(ctx);
    ctx.drawImage(this._pauseIcon, this._pauseIconRect.x, this._pauseIconRect.y);
    ctx.drawImage(
      this.world.muted ? this._muteIcon : this._unmuteIcon,
      this._muteIconRect.x,
      this._muteIconRect.y
    );
  }

  _renderScore(ctx) {
    const text = String(this.score);
    const win = this.config.window;
    const theme = this.config.theme;
    const boxW = 35 * text.length + 40;
    const boxH = 65;
    const boxX = win.width - 30 * text.length - 35;
    const boxY = 6;
    const bg = makeRoundPanel([boxW, boxH], [255, 255, 255], 15, 90);
    ctx.drawImage(bg, boxX, boxY);
    drawCenteredText(
      ctx,
      text,
      boxX + trunc(boxW / 2) - 10,
      boxY + trunc(boxH / 2) - 2,
      this._scoreFont,
      theme.button_primary
    );
  }
}
