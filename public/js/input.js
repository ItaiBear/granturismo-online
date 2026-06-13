// Normalizes DOM keyboard events into the token vocabulary used by config.keys,
// so scene code can compare `event.key === config.keys.left` etc.

const KEY_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  " ": "space",
  Spacebar: "space",
  Enter: "enter",
  Escape: "escape",
  Backspace: "backspace",
  Tab: "tab",
};

export function normalizeKey(domEvent) {
  const k = domEvent.key;
  if (KEY_MAP[k]) return KEY_MAP[k];
  if (k === "+") return "+";
  if (k === "-") return "-";
  if (k.length === 1) return k.toLowerCase();
  return k;
}

// The printable character for name entry (single letters), else "".
export function printable(domEvent) {
  const k = domEvent.key;
  return k.length === 1 ? k : "";
}
