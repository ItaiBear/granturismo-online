// Top-level scene manager, fixed-timestep loop, and DOM input plumbing.
// Ported/adapted from granturismo/app.py.
import { World } from "./world.js";
import { normalizeKey } from "./input.js";
import { MainMenuScene } from "./scenes/main_menu.js";
import { TransitionScene } from "./scenes/transition.js";
import { CountdownScene } from "./scenes/countdown.js";
import { GameplayScene } from "./scenes/gameplay.js";
import { PauseScene } from "./scenes/pause.js";
import { GameOverScene } from "./scenes/game_over.js";

const STEP_MS = 1000 / 60;
const MAX_STEPS = 5; // clamp catch-up after a stall

// The original game's design resolution. The world is scaled uniformly from
// this so sprites/road/HUD keep their original proportions on any screen.
const DESIGN_WIDTH = 1300;
const DESIGN_HEIGHT = 700;

export class App {
  constructor(config, canvas, music, nameEntry) {
    this.config = config;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.music = music;
    this.nameEntry = nameEntry; // { wrap, input }

    this.world = new World(config, music);
    this.scenes = {
      MainMenu: MainMenuScene,
      Transition: TransitionScene,
      Countdown: CountdownScene,
      Gameplay: GameplayScene,
      Pause: PauseScene,
      GameOver: GameOverScene,
    };

    this.scene = null;
    this._acc = 0;
    this._last = 0;
    this._musicStarted = false;

    this._resize();
    this._bindEvents();
    window.addEventListener("resize", () => this._resize());
    window.addEventListener("orientationchange", () => this._resize());
  }

  now() {
    return performance.now();
  }

  // Make the canvas fill the viewport at native pixel density, and feed the live
  // CSS-pixel dimensions to the game world so everything reflows (no letterbox).
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    // Largest uniform scale that fits the 1300x700 design; the world then extends
    // in the looser dimension to fill the viewport (no bars, no distortion, no
    // cropped HUD). Sprites/road/UI keep the original's proportions.
    const scale = Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT);
    this.config.window.width = vw / scale;
    this.config.window.height = vh / scale;
    this.canvas.width = Math.round(vw * dpr);
    this.canvas.height = Math.round(vh * dpr);
    this.ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    if (this.world && this.world.road) this.world.road.resize(this.config);
    if (this.scene && typeof this.scene.onResize === "function") this.scene.onResize();
  }

  setScene(factory, ...args) {
    if (this.scene && typeof this.scene.onExit === "function") this.scene.onExit();
    this.scene = new factory(this, ...args);
  }

  startRace() {
    this.setScene(this.scenes.Transition, this.scenes.Countdown);
  }

  snapshot() {
    const c = document.createElement("canvas");
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    c.getContext("2d").drawImage(this.canvas, 0, 0);
    return c;
  }

  // ---------- name entry (HTML input overlay) ----------

  beginNameEntry(maxLen, onChange, onEnter) {
    const input = this.nameEntry.input;
    input.value = "";
    input.maxLength = maxLen;
    this._nameOnChange = onChange;
    this._nameOnEnter = onEnter;
    this.nameEntry.wrap.classList.add("visible");
    // Desktop: focus immediately. Mobile: the user taps the field (a gesture)
    // to open the keyboard.
    try {
      input.focus();
    } catch (_) {}
  }

  endNameEntry() {
    this._nameOnChange = null;
    this._nameOnEnter = null;
    this.nameEntry.wrap.classList.remove("visible");
    this.nameEntry.input.blur();
  }

  // ---------- input plumbing ----------

  _toInternal(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.config.window.width;
    const y = ((clientY - rect.top) / rect.height) * this.config.window.height;
    return [x, y];
  }

  _startMusicOnce() {
    if (this._musicStarted) return;
    this._musicStarted = true;
    if (!this.world.muted) this.music.start();
  }

  _dispatch(event) {
    if (this.scene) this.scene.handleEvent(event);
  }

  _bindEvents() {
    const canvas = this.canvas;

    canvas.addEventListener("pointerdown", (e) => {
      this._startMusicOnce();
      const pos = this._toInternal(e.clientX, e.clientY);
      this._dispatch({ type: "pointerdown", pos, button: 1 });
    });
    canvas.addEventListener("pointerup", (e) => {
      const pos = this._toInternal(e.clientX, e.clientY);
      this._dispatch({ type: "pointerup", pos, button: 1 });
    });
    // Stop long-press / double-tap gestures from interfering with play.
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    window.addEventListener("keydown", (e) => {
      // While typing a name, let the input handle everything.
      if (document.activeElement === this.nameEntry.input) return;
      this._startMusicOnce();
      const key = normalizeKey(e);
      if (["left", "right", "up", "down", "space"].includes(key)) e.preventDefault();
      this._dispatch({ type: "keydown", key, raw: e });
    });

    // Name entry input events.
    const input = this.nameEntry.input;
    input.addEventListener("input", () => {
      const filtered = input.value.replace(/[^\p{L}\p{N}]/gu, "");
      if (filtered !== input.value) input.value = filtered;
      if (this._nameOnChange) this._nameOnChange(filtered);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (this._nameOnEnter) this._nameOnEnter();
      }
    });
  }

  // ---------- main loop ----------

  start() {
    this.setScene(this.scenes.MainMenu);
    this._last = performance.now();
    const frame = (t) => {
      this._acc += t - this._last;
      this._last = t;
      let steps = 0;
      while (this._acc >= STEP_MS && steps < MAX_STEPS) {
        this.scene.update();
        this._acc -= STEP_MS;
        steps += 1;
      }
      if (this._acc > STEP_MS * MAX_STEPS) this._acc = 0; // drop the backlog
      this.scene.render(this.ctx);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
