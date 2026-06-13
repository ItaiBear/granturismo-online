// Entry point: load fonts + assets, then start the game.
import { config } from "./config.js";
import { Music, preload, loadFonts } from "./assets.js";
import { App } from "./app.js";

async function boot() {
  const canvas = document.getElementById("game");
  // Canvas sizing is handled responsively by App (fills the viewport).

  const music = new Music(config.audio.music_file, config.audio.default_volume);
  if (config.audio.start_muted) music.mute();

  const nameEntry = {
    wrap: document.getElementById("nameEntry"),
    input: document.getElementById("nameInput"),
  };

  const app = new App(config, canvas, music, nameEntry);

  // Preload everything the scenes blit synchronously.
  await loadFonts();
  await app.world.load();
  const trans = config.ui_assets.countdown_transparent;
  await preload([
    { src: config.ui_assets.go, colorkey: trans },
    { src: config.ui_assets.pause, colorkey: trans },
    { src: config.ui_assets.countdown_1, colorkey: trans },
    { src: config.ui_assets.countdown_2, colorkey: trans },
    { src: config.ui_assets.countdown_3, colorkey: trans },
    { src: config.ui_assets.mute },
    { src: config.ui_assets.unmute },
    { src: config.ui_assets.logo },
  ]);

  document.getElementById("loading").style.display = "none";
  app.start();
}

boot().catch((err) => {
  console.error(err);
  const el = document.getElementById("loading");
  if (el) el.textContent = "Failed to load game: " + err.message;
});
