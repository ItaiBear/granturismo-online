// Port of the original game's config.json. Values are kept identical so the
// web game tunes exactly like the desktop original.
export const config = {
  window: { width: 1300, height: 700, fps: 60, title: "Gran Turismo" },
  audio: {
    music_file: "assets/audio/Moon Over The Castle.mp3",
    default_volume: 0.4,
    start_muted: false,
  },
  road: {
    lane_width: 130,
    lane_count: 3,
    background_color: [0, 130, 0],
    lane_color: [71, 71, 64],
    lines_color: [255, 255, 255],
    lines_height: 70,
    lines_width: 10,
    lines_margin: 80,
    side_lines_height: 90,
    side_lines_width: 10,
    side_lines_colors: [
      [237, 28, 36],
      [255, 255, 255],
    ],
  },
  player: {
    sprite: "assets/sprites/car-yellow.png",
    transparent_color: [34, 177, 76],
    width: 70,
    height: 137,
    speed: 15,
    horizontal_speed: 13,
    rest_y_ratio: 0.74,
    brake_y_ratio: 0.85,
  },
  ai_cars: {
    sprites: [
      { file: "assets/sprites/car-green.png", w: 70, h: 142, transparent: [255, 174, 201] },
      { file: "assets/sprites/car-tourquise.png", w: 70, h: 114, transparent: [255, 174, 201] },
      { file: "assets/sprites/car-orange.png", w: 70, h: 153, transparent: [255, 174, 201] },
      { file: "assets/sprites/car-red.png", w: 65, h: 137, transparent: [255, 174, 201] },
      { file: "assets/sprites/car-blue.png", w: 70, h: 137, transparent: [255, 174, 201] },
    ],
    base_density: 30,
    scroll_speed: 7,
    spawn_margin: 30,
  },
  scenery: {
    tree_sprite: "assets/sprites/tree1.png",
    tree_transparent: [255, 174, 201],
    tree_width: 200,
    tree_height: 200,
    tree_density: 10,
    margin_from_road: 10,
  },
  difficulty: { speedup_seconds: 25, menu_speedup_seconds: 10, speedup_amount: 1 },
  leaderboard: { size: 8, name_max_length: 6 },
  keys: {
    left: "left",
    right: "right",
    pause: "p",
    mute: "m",
    volume_up: "+",
    volume_down: "-",
    reset_speed: "r",
    submit: "space",
  },
  theme: {
    text_primary: [255, 255, 0],
    text_accent: [255, 201, 14],
    panel_bg: [190, 190, 190],
    panel_inner: [50, 50, 50],
    panel_inner_alpha: 245,
    panel_outer_alpha: 180,
    button_primary: [251, 100, 0],
    button_text: [50, 50, 50],
    text_dark: [0, 0, 0],
  },
  ui_assets: {
    logo: "assets/sprites/logo.png",
    pause: "assets/sprites/pause.png",
    mute: "assets/sprites/mute.png",
    unmute: "assets/sprites/unmute.png",
    reset: "assets/sprites/reset.png",
    go: "assets/sprites/go.png",
    countdown_1: "assets/sprites/1.png",
    countdown_2: "assets/sprites/2.png",
    countdown_3: "assets/sprites/3.png",
    countdown_transparent: [255, 174, 201],
  },
};

// Convenience: "rgb(r,g,b)" / "rgba(r,g,b,a)" from a [r,g,b] array.
export function rgb(c) {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
export function rgba(c, a) {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}
