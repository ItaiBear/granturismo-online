// Axis-aligned bounding-box collision with a forgiving inset, ported from
// granturismo/game/collision.py. Rects are { x, y, w, h }.
export function rectsCollide(a, b, shrink = 5) {
  const ax = a.x + shrink;
  const ay = a.y + shrink;
  const aw = a.w - 2 * shrink;
  const ah = a.h - 2 * shrink;
  const bx = b.x + shrink;
  const by = b.y + shrink;
  const bw = b.w - 2 * shrink;
  const bh = b.h - 2 * shrink;
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
