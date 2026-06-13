// End-of-run panel with the shared leaderboard, adapted from scenes/game_over.py.
//
// Web differences from the desktop original:
//   - leaderboard is fetched from / submitted to the shared backend API
//   - the score is POSTed once, when the player leaves this screen
//   - name entry uses a focused HTML <input> (mobile keyboard friendly)
//   - the destructive "reset leaderboard" icon is intentionally omitted (it
//     would wipe the GLOBAL board for everyone)
import { Scene } from "./base.js";
import { SlidingPanel, makeRoundPanel } from "../ui/widgets.js";
import { cssFont, drawCenteredText, drawText } from "../ui/text.js";
import { image } from "../assets.js";
import { CarModel, AICar } from "../game/entities.js";
import { pointInRect, trunc } from "../util.js";
import { fetchLeaderboard, submitScore, rankFor } from "../leaderboardClient.js";

const PLACEHOLDER = "______";

export class GameOverScene extends Scene {
  constructor(app, score) {
    super(app);
    this.score = score;
    this.nameMax = this.config.leaderboard.name_max_length;
    this.size = this.config.leaderboard.size;

    this.name = ""; // raw typed name
    this.rank = null; // provisional rank (null = didn't qualify / still loading)
    this.baseEntries = newPlaceholderBoard(this.size);
    this._submitted = false;
    this._nextChoice = null; // "play_again" | "main_menu"

    this._buildLayout();
    this._loadBoard();
  }

  async _loadBoard() {
    try {
      const data = await fetchLeaderboard();
      this.baseEntries = data.entries;
      this.rank = rankFor(this.baseEntries, this.score);
      if (this.rank !== null) {
        this.app.beginNameEntry(this.nameMax, (v) => (this.name = v), () => this._goToPlayAgain());
      }
    } catch (_) {
      // Offline / API down: just show the score, no submission.
      this.rank = null;
    }
  }

  // ---------- layout ----------

  _buildLayout() {
    const win = this.config.window;
    const theme = this.config.theme;

    const panelW = trunc(win.width / 2);
    const panelH = trunc(win.height / 1.4);
    this.panelSize = [panelW, panelH];
    const panelBg = makeRoundPanel(this.panelSize, theme.panel_bg, 25, theme.panel_outer_alpha);
    this.panel = new SlidingPanel(this.panelSize, trunc(win.width / 2), trunc(win.height / 2), panelBg, 50.0);

    const margin = 30;
    const lbW = trunc(panelW * 0.45 - margin * 1.5);
    const lbH = panelH - margin * 2;
    this.lbOffset = [margin - trunc(panelW / 2), margin - trunc(panelH / 2)];
    this.lbSize = [lbW, lbH];
    this.lbBg = makeRoundPanel(this.lbSize, theme.panel_inner, 20, theme.panel_inner_alpha);

    const sbW = trunc(panelW * 0.55 - margin * 1.5);
    const sbH = trunc(panelH * 0.4 - margin);
    this.scoreOffset = [this.lbOffset[0] + lbW + margin, this.lbOffset[1]];
    this.scoreSize = [sbW, sbH];
    this.scoreBg = makeRoundPanel(this.scoreSize, theme.panel_inner, 20, theme.panel_inner_alpha);

    const paH = trunc(panelH * 0.3 - margin * 1.5);
    this.paOffset = [this.scoreOffset[0], this.scoreOffset[1] + sbH + margin];
    this.paSize = [sbW, paH];
    const buttonFont = cssFont("Calibri", 45, true);
    this.paSurface = makeRoundPanel(this.paSize, theme.button_primary, 20);
    drawCenteredText(this.paSurface.getContext("2d"), "Play Again", sbW / 2, paH / 2, buttonFont, theme.button_text);

    const mmH = paH;
    this.mmOffset = [this.paOffset[0], this.paOffset[1] + paH + margin];
    this.mmSize = [sbW, mmH];
    this.mmSurface = makeRoundPanel(this.mmSize, theme.button_primary, 20);
    drawCenteredText(this.mmSurface.getContext("2d"), "Main Menu", sbW / 2, mmH / 2, buttonFont, theme.button_text);

    this.lbTitleFont = cssFont("Calibri", 30, true);
    this.lbEntryFont = cssFont("Calibri", 20, true);
    this.scoreBigFont = cssFont("Calibri", 70, true);
    this.rankScoreFont = cssFont("Calibri", 35, true);
    this.hintFont = cssFont("Calibri", 14, true);

    this.muteIcon = image(this.config.ui_assets.mute);
    this.unmuteIcon = image(this.config.ui_assets.unmute);
    this.muteIconRect = { x: 60, y: 10, w: 40, h: 40 };
  }

  onResize() {
    this._buildLayout();
  }

  _absRect(offset, size) {
    const cx = this.panel.centerX;
    const cy = trunc(this.panel.centerY);
    return { x: cx + offset[0], y: cy + offset[1], w: size[0], h: size[1] };
  }

  // ---------- events ----------

  handleEvent(event) {
    const keys = this.config.keys;
    if (event.type === "keydown") {
      if (event.key === keys.submit) this._goToPlayAgain();
      else if (event.key === keys.mute) this.world.toggleMute();
    } else if (event.type === "pointerup" && event.button === 1) {
      if (!this.panel.isIdle) return;
      if (pointInRect(this._absRect(this.paOffset, this.paSize), event.pos)) this._goToPlayAgain();
      else if (pointInRect(this._absRect(this.mmOffset, this.mmSize), event.pos)) this._goToMainMenu();
      else if (pointInRect(this.muteIconRect, event.pos)) this.world.toggleMute();
    }
  }

  // ---------- transitions ----------

  _submitOnce() {
    if (this._submitted || this.rank === null) return;
    this._submitted = true;
    const finalName = this.name.trim() || PLACEHOLDER;
    submitScore(finalName, this.score).catch(() => {});
  }

  _goToPlayAgain() {
    if (this._nextChoice) return;
    this._submitOnce();
    this.panel.slideOutUp();
    this._nextChoice = "play_again";
  }

  _goToMainMenu() {
    if (this._nextChoice) return;
    this._submitOnce();
    this.panel.slideOutDown();
    this._nextChoice = "main_menu";
  }

  onExit() {
    this.app.endNameEntry();
  }

  // ---------- update / render ----------

  update() {
    this.panel.update(this.config.window.height);

    if (this.panel.isDone && this._nextChoice) {
      // Turn the player car into a faux AI car so it sweeps off-screen with
      // traffic during the upcoming transition.
      const p = this.world.player;
      if (p) {
        const fakeModel = new CarModel(p.image, p.rect.w, p.rect.h);
        const fake = new AICar(fakeModel, p.rect.x, 0);
        fake.rect.y = p.rect.y;
        this.world.aiCars.push(fake);
        this.world.removePlayer();
      }
      const next = this._nextChoice === "play_again" ? this.app.scenes.Countdown : this.app.scenes.MainMenu;
      this.app.setScene(this.app.scenes.Transition, next);
    }
  }

  render(ctx) {
    this.world.renderBackground(ctx);
    if (!this.panel.isDone) this._renderPanel(ctx);
    ctx.drawImage(this.world.muted ? this.muteIcon : this.unmuteIcon, this.muteIconRect.x, this.muteIconRect.y);
  }

  _displayEntries() {
    const entries = this.baseEntries.map((e) => ({ ...e }));
    if (this.rank !== null) {
      entries.splice(this.rank - 1, 0, { name: this.name, score: this.score });
      entries.length = Math.min(entries.length, this.size);
    }
    return entries;
  }

  _renderPanel(ctx) {
    this.panel.render(ctx);
    const accent = this.config.theme.button_primary;

    // Leaderboard box.
    const lbRect = this._absRect(this.lbOffset, this.lbSize);
    ctx.drawImage(this.lbBg, lbRect.x, lbRect.y);
    drawCenteredText(ctx, "Leaderboard", lbRect.x + trunc(this.lbSize[0] / 2) - 20, lbRect.y + 30, this.lbTitleFont, accent);

    const entries = this._displayEntries();
    let entryY = lbRect.y + 70;
    for (let i = 0; i < entries.length; i++) {
      const line = formatEntry(i + 1, entries[i].name, entries[i].score, this.nameMax);
      drawText(ctx, line, lbRect.x + 30, entryY, this.lbEntryFont, accent);
      entryY += 45;
    }

    // Score box.
    const scoreRect = this._absRect(this.scoreOffset, this.scoreSize);
    ctx.drawImage(this.scoreBg, scoreRect.x, scoreRect.y);
    const cx = scoreRect.x + trunc(this.scoreSize[0] / 2);
    if (this.rank !== null) {
      const current = entries[this.rank - 1];
      const line = formatEntry(this.rank, current.name, current.score, this.nameMax);
      drawCenteredText(ctx, line, cx, scoreRect.y + trunc(this.scoreSize[1] * 0.3), this.rankScoreFont, accent);
      drawCenteredText(ctx, "Enter your name to display it", cx, scoreRect.y + trunc(this.scoreSize[1] * 0.7), this.hintFont, accent);
      drawCenteredText(ctx, "on the leaderboard!", cx, scoreRect.y + trunc(this.scoreSize[1] * 0.7) + 15, this.hintFont, accent);
    } else {
      drawCenteredText(ctx, String(this.score), cx, scoreRect.y + trunc(this.scoreSize[1] / 2), this.scoreBigFont, accent);
    }

    // Buttons.
    const paRect = this._absRect(this.paOffset, this.paSize);
    ctx.drawImage(this.paSurface, paRect.x, paRect.y);
    const mmRect = this._absRect(this.mmOffset, this.mmSize);
    ctx.drawImage(this.mmSurface, mmRect.x, mmRect.y);
  }
}

function newPlaceholderBoard(size) {
  const board = [];
  for (let i = 0; i < size; i++) board.push({ name: PLACEHOLDER, score: 0 });
  return board;
}

function formatEntry(rank, name, score, nameMax) {
  const padded = (name || "").padEnd(nameMax, "_").slice(0, nameMax);
  return `${rank}. ${padded} - ${score}`;
}
