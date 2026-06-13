// Centered scrolling road, ported from granturismo/game/road.py.
// Everything is derived from a single monotonic scroll counter.
import { rgb } from "../config.js";

export class Road {
  constructor(config) {
    const s = config.road;
    const win = config.window;
    this.windowWidth = win.width;
    this.windowHeight = win.height;
    this.laneWidth = s.lane_width;
    this.laneCount = s.lane_count;
    this.bgColor = rgb(s.background_color);
    this.laneColor = rgb(s.lane_color);
    this.linesColor = rgb(s.lines_color);
    this.linesHeight = s.lines_height;
    this.linesWidth = s.lines_width;
    this.linesMargin = s.lines_margin;
    this.sideH = s.side_lines_height;
    this.sideW = s.side_lines_width;
    this.sideColors = s.side_lines_colors.map(rgb);

    const roadPixelWidth = this.laneCount * this.laneWidth;
    this.roadLeft = ((this.windowWidth / 2) | 0) - ((roadPixelWidth / 2) | 0);
    this.roadRight = this.roadLeft + roadPixelWidth;

    this.laneLineXs = [];
    for (let i = 1; i < this.laneCount; i++) {
      this.laneLineXs.push(this.roadLeft + this.laneWidth * i - ((this.linesWidth / 2) | 0));
    }

    this.scroll = 0;
  }

  // 1-based lane index -> top-left x that centers a sprite of the given width.
  laneX(lane, spriteWidth) {
    const center = this.roadLeft + (lane - 0.5) * this.laneWidth;
    return Math.trunc(center - spriteWidth / 2);
  }

  update(speed) {
    this.scroll += speed;
  }

  render(ctx) {
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);

    ctx.fillStyle = this.laneColor;
    ctx.fillRect(this.roadLeft, 0, this.laneCount * this.laneWidth, this.windowHeight);

    // Dashed white lane stripes.
    ctx.fillStyle = this.linesColor;
    const period = this.linesHeight + this.linesMargin;
    let shift = this.scroll % period;
    let y = -this.linesHeight + shift;
    while (y < this.windowHeight) {
      for (const x of this.laneLineXs) {
        ctx.fillRect(x, Math.trunc(y), this.linesWidth, this.linesHeight);
      }
      y += period;
    }

    // Alternating red/white side stripes.
    const pair = this.sideH * 2;
    shift = this.scroll % pair;
    y = -pair + shift;
    let cnt = 0;
    const [c0, c1] = this.sideColors;
    while (y < this.windowHeight) {
      ctx.fillStyle = cnt % 2 === 0 ? c0 : c1;
      ctx.fillRect(this.roadLeft - this.sideW, Math.trunc(y), this.sideW, this.sideH);
      ctx.fillRect(this.roadRight, Math.trunc(y), this.sideW, this.sideH);
      y += this.sideH;
      cnt += 1;
    }
  }
}
