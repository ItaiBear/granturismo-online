// Modal pause overlay, ported from granturismo/scenes/pause.py.
import { Scene } from "./base.js";
import { cssFont, drawCenteredText } from "../ui/text.js";

export class PauseScene extends Scene {
  constructor(app, returnTo) {
    super(app);
    this._returnTo = returnTo;
    // Snapshot the current (device-pixel) frame; drawn scaled to CSS pixels.
    this._backdrop = app.snapshot();
    this.app.music.pause();
  }

  handleEvent(event) {
    if (event.type === "keydown" || event.type === "pointerdown") {
      this.app.music.resume();
      this.app.scene = this._returnTo;
    }
  }

  render(ctx) {
    const win = this.config.window;
    ctx.drawImage(this._backdrop, 0, 0, win.width, win.height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(0, 0, win.width, win.height);
    drawCenteredText(
      ctx,
      "Press any key to continue",
      win.width / 2,
      win.height / 2,
      cssFont("Calibri", 50, true),
      [0, 0, 0]
    );
  }
}
