// Title screen, ported from granturismo/scenes/main_menu.py.
import { Scene } from "./base.js";
import { SlidingPanel, makeRoundPanel } from "../ui/widgets.js";
import { cssFont, drawCenteredText } from "../ui/text.js";
import { image } from "../assets.js";
import { pointInRect, trunc } from "../util.js";

export class MainMenuScene extends Scene {
  constructor(app) {
    super(app);
    this._buildLayout();
    this._startTicks = app.now();
    this._playPressed = false;
  }

  _buildLayout() {
    const win = this.config.window;
    const theme = this.config.theme;

    const panelW = trunc(win.width / 2);
    const panelH = trunc(win.height / 1.4);
    this.panelSize = [panelW, panelH];
    const panelBg = makeRoundPanel(this.panelSize, theme.panel_bg, 25, theme.panel_outer_alpha);
    this.panel = new SlidingPanel(this.panelSize, trunc(win.width / 2), trunc(win.height / 2), panelBg, 50.0);

    const margin = 30;
    const bw = trunc(panelW * 0.44);
    const bh = trunc(panelH * 0.25 - margin * 1.5);
    this.buttonSize = [bw, bh];
    this.buttonSurface = makeRoundPanel([bw, bh], theme.button_primary, 35);
    const bctx = this.buttonSurface.getContext("2d");
    drawCenteredText(bctx, "Play Now", bw / 2, bh / 2, cssFont("Calibri", 40, true), theme.button_text);
    this.buttonOffsetFromCenter = [-trunc(bw / 2), margin * 2];

    this.logo = image(this.config.ui_assets.logo);
    this.logoOffsetFromCenter = [-150, -200];

    this.creditFont = cssFont("Calibri", 20, true, true);

    this.muteIcon = image(this.config.ui_assets.mute);
    this.unmuteIcon = image(this.config.ui_assets.unmute);
    this.muteIconRect = { x: 60, y: 10, w: 40, h: 40 };
  }

  _buttonRect() {
    const cx = this.panel.centerX + this.buttonOffsetFromCenter[0];
    const cy = trunc(this.panel.centerY) + this.buttonOffsetFromCenter[1];
    return { x: cx, y: cy, w: this.buttonSize[0], h: this.buttonSize[1] };
  }

  handleEvent(event) {
    const keys = this.config.keys;
    if (event.type === "pointerup" && event.button === 1) {
      if (pointInRect(this._buttonRect(), event.pos) && this.panel.isIdle) {
        this.panel.slideOutDown();
        this._playPressed = true;
      } else if (pointInRect(this.muteIconRect, event.pos)) {
        this.world.toggleMute();
      }
    } else if (event.type === "keydown") {
      if (event.key === keys.mute) this.world.toggleMute();
      else if (event.key === keys.reset_speed) this.world.speed = this.config.player.speed;
      else if (event.key === keys.volume_up) this.world.setVolume(this.world.volume + 0.1);
      else if (event.key === keys.volume_down) this.world.setVolume(this.world.volume - 0.1);
    }
  }

  update() {
    this.world.spawnStep();
    this.world.scrollStep();

    const elapsed = (this.app.now() - this._startTicks) / 1000.0;
    if (elapsed > this.config.difficulty.menu_speedup_seconds) {
      this._startTicks = this.app.now();
      this.world.speed += this.config.difficulty.speedup_amount;
    }

    this.panel.update(this.config.window.height);

    if (this.panel.isDone && this._playPressed) {
      this.app.startRace();
    }
  }

  render(ctx) {
    this.world.renderBackground(ctx);
    this.panel.render(ctx);

    if (!this.panel.isDone) {
      const cx = this.panel.centerX;
      const cy = trunc(this.panel.centerY);
      ctx.drawImage(this.logo, cx + this.logoOffsetFromCenter[0], cy + this.logoOffsetFromCenter[1]);
      const btn = this._buttonRect();
      ctx.drawImage(this.buttonSurface, btn.x, btn.y);
      drawCenteredText(
        ctx,
        "Created and Designed by Itai Bear, May 2020",
        cx,
        btn.y + btn.h + 50,
        this.creditFont,
        this.config.theme.text_dark
      );
    }

    const icon = this.world.muted ? this.muteIcon : this.unmuteIcon;
    ctx.drawImage(icon, this.muteIconRect.x, this.muteIconRect.y);
  }
}
