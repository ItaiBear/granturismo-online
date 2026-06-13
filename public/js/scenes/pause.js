// Modal pause overlay, ported from granturismo/scenes/pause.py.
import { Scene } from "./base.js";
import { cssFont, drawCenteredText } from "../ui/text.js";

export class PauseScene extends Scene {
  constructor(app, returnTo) {
    super(app);
    this._returnTo = returnTo;
    const win = this.config.window;

    // Snapshot the current frame and veil it.
    this._backdrop = app.snapshot();
    const bctx = this._backdrop.getContext("2d");
    bctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    bctx.fillRect(0, 0, win.width, win.height);
    drawCenteredText(
      bctx,
      "Press any key to continue",
      win.width / 2,
      win.height / 2,
      cssFont("Calibri", 50, true),
      [0, 0, 0]
    );

    this.app.music.pause();
  }

  handleEvent(event) {
    if (event.type === "keydown" || event.type === "pointerdown") {
      this.app.music.resume();
      this.app.scene = this._returnTo;
    }
  }

  render(ctx) {
    ctx.drawImage(this._backdrop, 0, 0);
  }
}
