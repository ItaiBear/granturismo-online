// Text helpers that map the original's SysFont names to the bundled webfonts
// (Carlito ~ Calibri metrics, Comic Neue ~ Comic Sans).
import { rgb } from "../config.js";

function family(name) {
  if (name.startsWith("Comic")) return "'Comic Neue', 'Comic Sans MS', cursive";
  if (name.startsWith("Calibri")) return "Carlito, Calibri, sans-serif";
  return name;
}

export function cssFont(name, size, bold = false, italic = false) {
  return `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}px ${family(name)}`;
}

// color may be an [r,g,b] array or a css string.
function toCss(color) {
  return Array.isArray(color) ? rgb(color) : color;
}

export function drawText(ctx, text, x, y, font, color, align = "left", baseline = "top") {
  ctx.font = font;
  ctx.fillStyle = toCss(color);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

export function drawCenteredText(ctx, text, cx, cy, font, color) {
  drawText(ctx, text, cx, cy, font, color, "center", "middle");
}
