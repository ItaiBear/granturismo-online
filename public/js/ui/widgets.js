// Pre-rendered UI primitives, ported from granturismo/ui/widgets.py.
// Panels are drawn once to an offscreen canvas and blitted every frame.

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Build an offscreen canvas with a single rounded-rect fill.
// color is [r,g,b]; alpha is 0..255 (matching pygame) or null for opaque.
export function makeRoundPanel([w, h], color, radius, alpha = null) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const a = alpha === null ? 1 : alpha / 255;
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${a})`;
  roundRectPath(ctx, 0, 0, w, h, radius);
  ctx.fill();
  return c;
}

export class SlidingPanel {
  static IDLE = 0;
  static SLIDING_IN = 1;
  static EXITING_DOWN = 2;
  static EXITING_UP = 3;
  static DONE = -1;

  constructor(size, centerX, targetY, background, initialSpeed = 50.0) {
    this.size = size;
    this.centerX = centerX;
    this.targetY = targetY;
    this.centerY = -size[1] / 2;
    this.speed = initialSpeed;
    this.state = SlidingPanel.SLIDING_IN;
    this.background = background;
  }

  slideOutDown() {
    this.state = SlidingPanel.EXITING_DOWN;
    this.speed = 10.0;
  }

  slideOutUp() {
    this.state = SlidingPanel.EXITING_UP;
    this.speed = 10.0;
  }

  update(windowHeight) {
    const S = SlidingPanel;
    if (this.state === S.SLIDING_IN) {
      this.centerY += this.speed;
      this.speed -= 1;
      if (this.centerY >= this.targetY - 100) this.speed -= 1;
      if (this.centerY >= this.targetY) this.speed -= 5;
      if (this.centerY >= this.targetY + 100) this.speed -= 3;
      if (this.centerY <= this.targetY + 15 && this.speed < 0) {
        this.state = S.IDLE;
        this.speed = 0;
        this.centerY = this.targetY;
      }
    } else if (this.state === S.EXITING_DOWN) {
      this.centerY += this.speed;
      this.speed += 3;
      if (this.centerY - this.size[1] / 2 >= windowHeight) this.state = S.DONE;
    } else if (this.state === S.EXITING_UP) {
      this.centerY -= this.speed;
      this.speed += 3;
      if (this.centerY + this.size[1] / 2 <= 0) this.state = S.DONE;
    }
  }

  get topleft() {
    return [this.centerX - this.size[0] / 2, Math.trunc(this.centerY) - this.size[1] / 2];
  }

  get isIdle() {
    return this.state === SlidingPanel.IDLE;
  }

  get isDone() {
    return this.state === SlidingPanel.DONE;
  }

  render(ctx) {
    if (this.state === SlidingPanel.DONE) return;
    const [x, y] = this.topleft;
    ctx.drawImage(this.background, x, y);
  }
}
