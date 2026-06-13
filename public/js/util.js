// Small shared helpers.
export function pointInRect(rect, pos) {
  const [x, y] = pos;
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

export const trunc = Math.trunc;
