// Persistent scrolling world shared across scenes, ported from granturismo/world.py.
import { surface } from "./assets.js";
import { Road } from "./game/road.js";
import { CarModel, Player } from "./game/entities.js";
import { trySpawnAi, trySpawnTree } from "./game/spawner.js";

export class World {
  constructor(config, music) {
    this.config = config;
    this.music = music;

    this.road = new Road(config);
    this.speed = config.player.speed;
    this.carsScrollSpeed = config.ai_cars.scroll_speed;

    this.trees = [];
    this.aiCars = [];
    this.player = null;

    this.muted = config.audio.start_muted;
    this.volume = config.audio.default_volume;
  }

  async load() {
    const c = this.config;
    const aiImages = await Promise.all(
      c.ai_cars.sprites.map((s) => surface(s.file, s.transparent))
    );
    this.aiModels = aiImages.map((img, i) => {
      const s = c.ai_cars.sprites[i];
      return new CarModel(img, s.w, s.h);
    });
    const playerImg = await surface(c.player.sprite, c.player.transparent_color);
    this.playerModel = new CarModel(playerImg, c.player.width, c.player.height);
    this.treeImage = await surface(c.scenery.tree_sprite, c.scenery.tree_transparent);
  }

  // ----- spawning + scrolling -----

  spawnStep(densityScale = 1.0, includeCars = true) {
    const s = this.config;
    const tree = trySpawnTree(
      this.road,
      this.treeImage,
      s.scenery.tree_width,
      s.scenery.tree_height,
      Math.max(1, Math.trunc(s.scenery.tree_density / densityScale)),
      s.scenery.margin_from_road
    );
    if (tree) this.trees.push(tree);

    if (includeCars) {
      const car = trySpawnAi(
        this.road,
        this.aiCars,
        this.aiModels,
        s.ai_cars.base_density,
        this.playerModel.height,
        s.ai_cars.spawn_margin,
        this.carsScrollSpeed
      );
      if (car) this.aiCars.push(car);
    }
  }

  scrollStep() {
    this.road.update(this.speed);
    for (const t of this.trees) t.update(this.speed, this.road.windowHeight);
    for (const car of this.aiCars) car.update(this.speed, this.road.windowHeight);
    this.trees = this.trees.filter((t) => !t.dead);
    this.aiCars = this.aiCars.filter((c) => !c.dead);
  }

  // ----- player lifecycle -----

  resetPlayer(startY, lane) {
    const player = new Player(this.playerModel, this.road, lane, this.config.player.horizontal_speed);
    player.rect.y = startY;
    this.player = player;
    return player;
  }

  removePlayer() {
    this.player = null;
  }

  // ----- volume / mute -----

  setVolume(volume) {
    this.volume = Math.max(0.0, Math.min(1.0, volume));
    if (!this.muted) this.music.setVolume(this.volume);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.music.mute();
    else this.music.unmute();
  }

  // ----- rendering -----

  renderWorld(ctx) {
    this.road.render(ctx);
    for (const t of this.trees) t.draw(ctx);
    for (const car of this.aiCars) car.draw(ctx);
  }

  renderPlayer(ctx) {
    if (this.player) this.player.draw(ctx);
  }

  renderBackground(ctx) {
    this.renderWorld(ctx);
    this.renderPlayer(ctx);
  }
}
